"""Stage 2: add Cabinet roles and committee memberships to data/mps.csv.

    .venv/bin/python scripts/stage2_roles_committees.py

Run after Stage 1 (Stage 1 rewrites mps.csv and clears these columns).

Sources (all official):
- Cabinet: Bahagian Istiadat dan Urus Setia Persidangan Antarabangsa (istiadat.gov.my),
  "Jemaah Menteri" and "Timbalan Menteri" PDFs. The newest PDFs listed on the page are used.
- Committees: parlimen.gov.my standing committees, PAC (/pac) and select committees (/jkdr).

Writes:
- data/cabinet.csv     one row per Cabinet post (used by Stage 3 to map "Menteri X" to an MP)
- data/committees.csv  one row per committee membership
- data/mps.csv         role, role_title, committees columns filled
"""
import os
import re
import sys

import pdfplumber

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CACHE, DATA, PARLIMEN, clean_text, fetch, read_csv, write_csv  # noqa: E402
from stage1_clean_mps import FIELDS as MP_FIELDS, name_match, split_honorific  # noqa: E402

ISTIADAT_PAGE = "https://www.istiadat.gov.my/protokol-persekutuan/"
CABINET_PDFS = {"minister": r"JEMAAH-MENTERI-[\d.]+\.pdf", "deputy minister": r"TIMBALAN-MENTERI-[\d.]+\.pdf"}
COLUMN_SPLIT_X = 310  # PDF layout: name/honours left of this, post/address right
POST_RE = re.compile(r"^(Perdana Menteri|Timbalan Perdana Menteri|Menteri|Timbalan Menteri)\b")
# Lines that end a post title: ministry/office names, addresses, phone/email lines (icon glyphs).
ADDRESS_RE = re.compile(r"^(Kementerian|Pejabat|Jabatan|Aras|Tingkat|Blok|No\.|Menara|Wisma|Kompleks|"
                        r"Bangunan|Pusat|Jalan|Persiaran|Presint|Lot|Level|\d|SU\b|PK\b|KSU|SUSK|[^\w(])")
ROW_TOLERANCE = 6  # a post line up to this many points above an entry's number line belongs to it

STANDING = {
    "Jawatankuasa Pemilih": PARLIMEN + "jawatankuasa-dr.html?view=51&uweb=dr&",
    "Jawatankuasa Dewan": PARLIMEN + "jawatankuasa-dr.html?view=52&uweb=dr&",
    "Jawatankuasa Hak dan Kebebasan": PARLIMEN + "jawatankuasa-dr.html?view=54&uweb=dr&",
    "Jawatankuasa Peraturan Mesyuarat": PARLIMEN + "jawatankuasa-dr.html?view=55&uweb=dr&",
}
PAC = ("Jawatankuasa Kira-kira Wang Negara (PAC)", PARLIMEN + "pac/ahli-jawatankuasa-pac.html?")
PAC_ROLES = {"PENGERUSI": "Pengerusi", "NAIB PENGERUSI": "Naib Pengerusi", "SETIAUSAHA": "Setiausaha",
             "AHLI": "Ahli", "AHLI-AHLI": "Ahli"}
JKDR_INDEX = PARLIMEN + "jkdr/"
MEMBER_ROLES = ("Pengerusi", "Naib Pengerusi", "Ahli", "Setiausaha")


# ---------- Cabinet ----------

def latest_pdf_urls():
    page = fetch(ISTIADAT_PAGE, cache_path=os.path.join(CACHE, "roles", "istiadat_%s.html" % _today()))
    urls = {}
    for role, pattern in CABINET_PDFS.items():
        found = sorted(set(re.findall(r'href="(https://www\.istiadat\.gov\.my/wp-content/uploads/(\d{4}/\d{2})/%s)"'
                                      % pattern, page, flags=re.I)), key=lambda m: m[1])
        if not found:
            raise SystemExit("No %s PDF found on %s" % (role, ISTIADAT_PAGE))
        urls[role] = found[-1][0]  # newest upload folder
    return urls


def _today():
    import datetime
    return datetime.date.today().isoformat()


def _lines(page, x0, x1):
    """Words in a column grouped into lines: a word joins a line if its top is within 3pt."""
    # Assign whole words by their start x (cropping would split words that cross the boundary)
    words = sorted((w for w in page.extract_words() if x0 <= w["x0"] < x1), key=lambda w: w["top"])
    lines = []  # [top, [words]]
    for w in words:
        if lines and abs(w["top"] - lines[-1][0]) <= 3:
            lines[-1][1].append(w)
        else:
            lines.append([w["top"], [w]])
    return [(top, " ".join(w["text"] for w in sorted(ws, key=lambda w: w["x0"])).strip())
            for top, ws in lines]


def parse_cabinet_pdf(path, role, url):
    """Return [{role, raw_name, name, posts, page}] from a Jemaah/Timbalan Menteri PDF."""
    entries, current = [], None
    fix = lambda t: t.replace("’", "'").replace("‘", "'")  # noqa: E731
    with pdfplumber.open(path) as pdf:
        updated = re.search(r"DIKEMAS KINI PADA ([^)]+)\)", pdf.pages[0].extract_text() or "")
        for pno, page in enumerate(pdf.pages, 1):
            # Pass 1: entries from the left column ("12. YB Dato' Name" + wrapped name lines)
            starts = []  # (top, entry) for entries starting on this page
            name_open = False
            for top, text in _lines(page, 0, COLUMN_SPLIT_X):
                text = fix(text)
                m = re.match(r"^(\d+)\.(?:\s+(.+))?$", text)
                if m and (m.group(2) or "").strip() != "" or (m and not m.group(2)):
                    current = {"role": role, "no": int(m.group(1)), "raw_name": (m.group(2) or "").strip(),
                               "posts": [], "page": pno}
                    entries.append(current)
                    starts.append((top, current))
                    name_open = True
                elif name_open:
                    # name ends at honours ("S.P.M.K.(Kel)") or spouse "(YBhg. ...)"
                    if not text or re.search(r"[A-Z]\.[A-Z]|^\(|\.\(", text):
                        name_open = bool(not text and not current["raw_name"])
                    else:
                        current["raw_name"] = (current["raw_name"] + " " + text).strip()
            carry = entries[-len(starts) - 1] if len(entries) > len(starts) else None

            # Pass 2: post titles from the right column, assigned by vertical position
            post_open = False
            for top, text in _lines(page, COLUMN_SPLIT_X, page.width):
                text = fix(text)
                owner = carry
                for s_top, e in starts:
                    if s_top <= top + ROW_TOLERANCE:
                        owner = e
                if owner is None:
                    continue
                if "@" in text:  # page footer ("... protokol@istiadat.gov.my") or email line
                    post_open = False
                elif POST_RE.match(text) and not post_open:
                    owner["posts"].append(text)
                    post_open = True
                elif post_open and text and not ADDRESS_RE.match(text):
                    owner["posts"][-1] += " " + text  # wrapped post title
                else:
                    post_open = False
    for e in entries:
        e["posts"] = [p for p in e["posts"] if len(p.split()) >= 2]  # drop stray footer fragments
        raw = e["raw_name"]
        e["senator"] = bool(re.match(r"^(YB\s+)?Senator\b", raw, flags=re.I))
        raw = re.sub(r"^(YB\s+)?Senator\s+", r"\1", raw, flags=re.I)
        e["honorific"], e["name"] = split_honorific(raw)
        e["source_url"] = url
        e["list_date"] = updated.group(1).title() if updated else ""
    return entries


def match_mp(name, mps):
    hits = [m for m in mps if m.get("name") and name_match(name, m["name"])]
    exact = [m for m in hits if name_match(name, m["name"]) == "exact"]
    if len(exact) == 1:
        return exact[0], "exact"
    if len(hits) == 1:
        return hits[0], "variant"
    return None, ("ambiguous(%s)" % ", ".join(h["constituency_code"] for h in hits)) if hits else "no_mp_match"


# ---------- Committees ----------

def _norm_seat(s):
    return re.sub(r"[^a-z]", "", s.lower())


def parse_committee(html_text):
    """Return [(member_role, constituency_name, display_name)] from a committee page."""
    parts = [p.strip() for p in re.split(r"\s*\n\s*", clean_text(html_text)) if p.strip()]
    out, role, last_name = [], None, ""
    for p in parts:
        if p in MEMBER_ROLES:
            role = p
        elif re.match(r"^Yang (Amat )?Berhormat\b", p):
            last_name = re.sub(r"^Yang (Amat )?Berhormat\s+", "", p)
        elif p.startswith("Ahli Parlimen ") and role and role != "Setiausaha":
            seat = re.split(r"\s*[\[/]", p[len("Ahli Parlimen "):])[0].strip()
            out.append((role, seat, last_name))
    return out


def parse_pac(html_text, seat_names):
    """PAC page is a photo grid: 'YB Name' split over cells, then a constituency cell."""
    cells = [re.sub(r"\s+", " ", clean_text(c)).strip(" /")
             for c in re.split(r"<(?:td|p|br|span|div)[^>]*>", html_text, flags=re.I)]
    out, role, name = [], "Ahli", None
    for c in filter(None, cells):
        if c.upper() in PAC_ROLES:
            role, name = PAC_ROLES[c.upper()], None
        elif re.match(r"^YB\s", c):  # MPs are "YB"; the Secretary is "YBrs" (staff)
            if role == "Setiausaha":
                role = "Ahli"  # members follow the Secretary with no "AHLI" heading
            name = c[3:]
        elif name is not None:
            if _norm_seat(c) in seat_names:
                out.append((role, c, name))
                name = None
                if role in ("Pengerusi", "Naib Pengerusi"):
                    role = "Ahli"
            elif len(c) < 40:
                name += " " + c
    return out


def jkdr_committees():
    index = fetch(JKDR_INDEX, cache_path=os.path.join(CACHE, "committees", "jkdr_index.html"))
    found = {}
    for href, label in re.findall(r'href="(/jkdr/jawatankuasa-pilihan-khas-[^"]+)"[^>]*>(.*?)</a>', index, re.S):
        name = clean_text(label).title().replace("Jawatankuasa Pilihan", "JKPK")
        found[name] = PARLIMEN.rstrip("/") + href
    return found


def main():
    mps = read_csv(os.path.join(DATA, "mps.csv"))
    for m in mps:  # idempotent: rebuild these columns from scratch on every run
        m["role"] = m["role_title"] = m["committees"] = ""
    by_seat = {_norm_seat(m["constituency"]): m for m in mps if m.get("constituency")}
    problems = []

    # Cabinet
    cabinet = []
    for role, url in latest_pdf_urls().items():
        path = os.path.join(CACHE, "roles", os.path.basename(url))
        fetch(url, cache_path=path, binary=True)
        entries = parse_cabinet_pdf(path, role, url)
        print("%s list (%s): %d entries from %s" % (role, entries[0]["list_date"] if entries else "?",
                                                    len(entries), os.path.basename(url)))
        cabinet += entries
    for e in cabinet:
        mp, how = (None, "senator(not_an_MP)") if e["senator"] else match_mp(e["name"], mps)
        e["constituency_code"] = mp["constituency_code"] if mp else ""
        e["match"] = how
        if not e["posts"]:
            problems.append("No post parsed for %s (%s p.%d)" % (e["name"], e["role"], e["page"]))
        if mp:
            prev = mp.get("role")
            if prev == "minister" and e["role"] == "deputy minister":
                continue
            mp["role"] = e["role"]
            mp["role_title"] = "; ".join(filter(None, [mp.get("role_title", "") if prev == e["role"] else "",
                                                       "; ".join(e["posts"])]))
    write_csv(os.path.join(DATA, "cabinet.csv"),
              [dict(e, posts="; ".join(e["posts"])) for e in cabinet],
              ["role", "no", "name", "honorific", "posts", "constituency_code", "match",
               "list_date", "source_url", "page"])

    # Committees
    pages = dict(STANDING)
    pages[PAC[0]] = PAC[1]
    pages.update(jkdr_committees())
    memberships = []
    for committee, url in pages.items():
        slug = re.sub(r"[^a-z0-9]+", "_", committee.lower()).strip("_")
        html_text = fetch(url, cache_path=os.path.join(CACHE, "committees", slug + ".html"))
        members = (parse_pac(html_text, by_seat) if committee == PAC[0] else parse_committee(html_text))
        updated = re.search(r"Kemaskini Terakhir\s*:\s*([\d/]+)", clean_text(html_text), flags=re.I)
        if not members:
            problems.append("No members parsed for %s (%s)" % (committee, url))
        for member_role, seat, display in members:
            mp = by_seat.get(_norm_seat(seat))
            memberships.append({"committee": committee, "member_role": member_role,
                                "constituency_code": mp["constituency_code"] if mp else "",
                                "constituency_on_page": seat, "name_on_page": display,
                                "page_updated": updated.group(1) if updated else "", "source_url": url})
            if not mp:
                problems.append("Committee %s: seat '%s' (%s) not in mps.csv" % (committee, seat, display))
                continue
            label = committee if member_role == "Ahli" else "%s (%s)" % (committee, member_role)
            mp["committees"] = "; ".join(filter(None, [mp.get("committees", ""), label]))
            if committee == PAC[0] and mp.get("role") in ("minister", "deputy minister"):
                problems.append("PAC page lists %s %s (%s), who is now a %s: PAC page may be out of date"
                                % (mp["constituency_code"], mp["name"], seat, mp["role"]))
        print("%-75s %2d members" % (committee[:75], len(members)))
    write_csv(os.path.join(DATA, "committees.csv"), memberships,
              ["committee", "member_role", "constituency_code", "constituency_on_page", "name_on_page",
               "page_updated", "source_url"])

    fields = list(MP_FIELDS)
    if "role_title" not in fields:
        fields.insert(fields.index("role") + 1, "role_title")
    for m in mps:
        if m.get("name") and m.get("status", "sitting") != "sitting":
            m["role"], m["role_title"], m["committees"] = "former MP", "", ""
        elif m.get("name") and not m.get("role"):
            m["role"] = "backbencher"
    write_csv(os.path.join(DATA, "mps.csv"), mps, fields)

    print("\n=== Stage 2 summary ===")
    for r in ("minister", "deputy minister", "backbencher"):
        print("%-16s %d MPs" % (r, sum(1 for m in mps if m.get("role") == r)))
    print("Cabinet entries not matched to an MP (senators or name issues):")
    for e in cabinet:
        if not e["constituency_code"]:
            print("  [%s] %s -> %s (%s)" % (e["role"], e["name"], "; ".join(e["posts"]) or "?", e["match"]))
    variants = [e for e in cabinet if e["match"] == "variant"]
    print("Cabinet names matched with spelling variants: %d (see data/cabinet.csv)" % len(variants))
    print("MPs on at least one committee: %d" % sum(1 for m in mps if m.get("committees")))
    print("Problems: %s" % ("none" if not problems else ""))
    for p in problems:
        print("  - " + p)


if __name__ == "__main__":
    main()
