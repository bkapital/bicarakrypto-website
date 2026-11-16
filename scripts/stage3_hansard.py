"""Stage 3: find crypto / digital-asset mentions in Dewan Rakyat Hansard (15th Parliament).

    .venv/bin/python scripts/stage3_hansard.py --dates 2023-03-14,2023-10-13   # test run
    .venv/bin/python scripts/stage3_hansard.py --all                          # every sitting
    .venv/bin/python scripts/stage3_hansard.py --all --since 2025-01-01       # a date range

Sources (both official, Parliament of Malaysia):
- Sitting list + structured transcript (speaker, section heading, text):
    https://hansard.parlimen.gov.my/katalog/dewan-rakyat
    https://hansard.parlimen.gov.my/hansard/dewan-rakyat/YYYY-MM-DD
- Official PDF (Penyata Rasmi), used for the evidence link and page number:
    https://www.parlimen.gov.my/files/hindex/pdf/DR-DDMMYYYY.pdf

Each keyword paragraph is attributed from the speaker label, then located in the PDF to get
a page number and confirm the excerpt is verbatim. Anything uncertain is flagged in `notes`.
Rows are merged into data/evidence.csv by a stable evidence_id; hand-entered `stance` and
`mentions_rakyat_benefit` values are kept on rerun.
"""
import argparse
import datetime
import json
import os
import re
import sys
import unicodedata

import fitz  # PyMuPDF

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CACHE, DATA, fetch, read_csv, write_csv  # noqa: E402
from stage1_clean_mps import name_match, split_honorific  # noqa: E402

PORTAL = "https://hansard.parlimen.gov.my"
PDF_URL = "https://www.parlimen.gov.my/files/hindex/pdf/DR-%s.pdf"  # DDMMYYYY
PDF_DIR = os.path.join(DATA, "hansard_pdfs")
MANIFEST = os.path.join(PDF_DIR, "manifest.csv")
AUTHOR_MAP = os.path.join(CACHE, "hansard_author_seats.json")
EVIDENCE = os.path.join(DATA, "evidence.csv")
START_DATE = "2022-12-19"
MAX_WORDS = 80

EVIDENCE_FIELDS = ["evidence_id", "mp_constituency_code", "mp_name", "date", "type", "source_name",
                   "link", "pdf_page", "hansard_page_printed", "excerpt", "keywords_matched", "topic", "stance",
                   "mentions_rakyat_benefit", "speaker_as_printed", "section", "notes"]
MANUAL_FIELDS = ["stance", "mentions_rakyat_benefit"]  # never filled by scripts; kept on rerun

# Brief's keyword list (case-insensitive). Longer phrases first so they are reported, not their parts.
KEYWORDS = ["mata wang kripto", "mata wang digital", "pertukaran aset digital", "aset digital",
            "rantaian blok", "token digital", "penipuan pelaburan", "cryptocurrency", "cryptocurrencies",
            "digital asset", "digital assets", "digital currency", "digital currencies",
            "investment scam", "investment scams", "blockchain", "bitcoin", "ethereum", "stablecoin",
            "stablecoins", "CBDC", "Web3", "kripto", "crypto"]
KEYWORD_RE = re.compile(r"(?<![\w-])(%s)(?![\w-])" % "|".join(re.escape(k) for k in KEYWORDS), re.I)
TOPICS = [  # first match wins; keyword-derived, for filtering only
    ("investment scam", {"penipuan pelaburan", "investment scam", "investment scams"}),
    ("CBDC / digital currency", {"cbdc", "mata wang digital", "digital currency", "digital currencies"}),
    ("blockchain", {"blockchain", "rantaian blok", "web3"}),
]
DEFAULT_TOPIC = "crypto / digital assets"

# Recorded divisions to include, chosen by hand (brief: bills mentioning digital assets).
# (date, text in the bill's section heading, note shown on every vote row)
VOTES_TO_RECORD = [
    ("2025-11-04", "PERBEKALAN 2026",
     "GENERAL BUDGET VOTE (Supply Bill 2026), not a crypto-specific vote. Included because the "
     "debate mentioned blockchain (RM53m Geran Pecutan Digital). Do not read as a stance on crypto."),
]
VOTE_LISTS = {"Ahli-Ahli Yang Bersetuju": "Bersetuju (For)",
              "Ahli-Ahli Yang Tidak Bersetuju": "Tidak Bersetuju (Against)",
              "Ahli-Ahli Yang Tidak Hadir": "Tidak Hadir (Absent)"}
VOTE_ENTRY_RE = re.compile(r"(\d{1,3})\.\s*(.+?)\s*\(([^()]+)\)\s*(?=\d{1,3}\.\s|$)", re.S)

CHAIR_RE = re.compile(r"^(Tuan|Puan)?\s*(Timbalan\s+)?(Yang di-Pertua|Pengerusi)\b|^Setiausaha\b", re.I)
QUESTION_SECTIONS = ("PERTANYAAN-PERTANYAAN BAGI JAWAB LISAN", "WAKTU PERTANYAAN-PERTANYAAN MENTERI",
                     "PERTANYAAN-PERTANYAAN JAWAB LISAN")


# ---------- sources ----------

def sittings():
    """[(date, is_final)] for the 15th Parliament, from the portal catalogue (refreshed daily)."""
    today = datetime.date.today().isoformat()
    page = fetch(PORTAL + "/katalog/dewan-rakyat",
                 cache_path=os.path.join(CACHE, "hansard_index", "katalog_dr_%s.html" % today))
    archive = _next_data(page)["archive"]["15"]
    out = []
    for session in archive.values():
        if isinstance(session, dict):
            for meeting in session.values():
                if isinstance(meeting, dict) and "sitting_list" in meeting:
                    out += [(s["date"], bool(s["is_final"])) for s in meeting["sitting_list"]]
    return sorted(set(out))


def _next_data(page):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S)
    if not m:
        raise ValueError("no __NEXT_DATA__ in page")
    return json.loads(m.group(1))["props"]["pageProps"]


def transcript(date, is_final):
    status = "final" if is_final else "draft"
    page = fetch("%s/hansard/dewan-rakyat/%s" % (PORTAL, date),
                 cache_path=os.path.join(CACHE, "hansard_json", "%s_%s.html" % (date, status)))
    return _next_data(page)


def load_manifest():
    return {r["date"]: r for r in read_csv(MANIFEST)} if os.path.exists(MANIFEST) else {}


def pdf_for(date, is_final, manifest):
    """Download the sitting PDF once (again only if a draft has since become final)."""
    d = datetime.date.fromisoformat(date)
    url = PDF_URL % d.strftime("%d%m%Y")
    path = os.path.join(PDF_DIR, os.path.basename(url))
    prev = manifest.get(date)
    if os.path.exists(path) and prev and prev.get("status") == "draft" and is_final:
        os.remove(path)  # final version now published
    downloaded = not os.path.exists(path)
    data = fetch(url, cache_path=path, binary=True)
    if not data.startswith(b"%PDF"):
        os.remove(path)
        raise ValueError("not a PDF: %s" % url)
    if downloaded or not prev:
        manifest[date] = {"date": date, "status": "final" if is_final else "draft", "url": url,
                          "bytes": len(data), "downloaded": datetime.date.today().isoformat()}
        write_csv(MANIFEST, sorted(manifest.values(), key=lambda r: r["date"]),
                  ["date", "status", "url", "bytes", "downloaded"])
    return url, path


# ---------- PDF page lookup ----------

def _norm(text):
    text = unicodedata.normalize("NFKC", text).replace("’", "'").replace("‘", "'")
    text = re.sub(r"-\s*\n\s*", "", text)  # words hyphenated across lines
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


class PdfIndex:
    def __init__(self, path):
        with fitz.open(path) as doc:
            raw = [p.get_text() for p in doc]
        pages = [_norm(t) for t in raw]
        # printed Hansard page number: first line on the page that is only a number
        self.printed = [next(iter(re.findall(r"^\s*(\d{1,4})\s*$", t, re.M)), "") for t in raw]
        self.text, self.starts, pos = "", [], 0
        for p in pages:
            self.starts.append(pos)
            self.text += p + " "
            pos = len(self.text)

    def find(self, phrase):
        return self.text.find(_norm(phrase))

    def page_of(self, excerpt, start_at=0):
        """1-based page where the excerpt appears (searching from char offset start_at),
        trying a few word windows; None if not found."""
        words = _norm(excerpt.replace("...", " ")).split()
        for size in (12, 8, 6):
            for start in range(0, max(1, len(words) - size + 1), max(1, size // 2)):
                probe = " ".join(words[start:start + size])
                if len(probe) < 20:
                    continue
                i = self.text.find(probe, start_at)
                if i >= 0:
                    return max(n for n, s in enumerate(self.starts, 1) if s <= i)
        return None


# ---------- attribution ----------

class Attributor:
    def __init__(self):
        self.mps = [m for m in read_csv(os.path.join(DATA, "mps.csv")) if m.get("name")]
        self.by_seat = {self._seat_key(m["constituency"]): m for m in self.mps}
        self.by_code = {m["constituency_code"]: m for m in self.mps}
        cab = read_csv(os.path.join(DATA, "cabinet.csv")) if os.path.exists(os.path.join(DATA, "cabinet.csv")) else []
        self.senators = [c for c in cab if c.get("match", "").startswith("senator")]
        self.author_seats = json.load(open(AUTHOR_MAP)) if os.path.exists(AUTHOR_MAP) else {}
        self.conflicts = set()

    @staticmethod
    def _seat_key(s):
        return re.sub(r"[^a-z]", "", (s or "").lower())

    def learn(self, items):
        """Record portal author_id -> seat whenever a label carries a known constituency."""
        for it in items:
            m = re.match(r"^(.*)\[(.+?)\]\s*$", it["author"] or "")
            aid = it.get("author_id")
            if m and aid is not None:
                mp = self.by_seat.get(self._seat_key(m.group(2)))
                if mp:
                    key, code = str(aid), mp["constituency_code"]
                    if self.author_seats.get(key, code) != code:
                        self.conflicts.add(key)
                    self.author_seats.setdefault(key, code)

    def save(self):
        for k in self.conflicts:
            self.author_seats.pop(k, None)
        os.makedirs(os.path.dirname(AUTHOR_MAP), exist_ok=True)
        json.dump(self.author_seats, open(AUTHOR_MAP, "w"), indent=0, sort_keys=True)

    def _by_name(self, name):
        _, plain = split_honorific(name.replace("’", "'").strip())
        hits = [m for m in self.mps if name_match(plain, m["name"])]
        exact = [m for m in hits if name_match(plain, m["name"]) == "exact"]
        return exact[0] if len(exact) == 1 else (hits[0] if len(hits) == 1 else None)

    def resolve(self, label, author_id):
        """Return (mp_row or None, notes list, skip_reason or None)."""
        label = (label or "").strip()
        if not label:
            return None, [], "no speaker"
        if CHAIR_RE.match(label):
            return None, [], "chair"
        notes = []
        m = re.match(r"^(.*?)\s*\[(.+?)\]\s*$", label)
        outside, inside = (m.group(1), m.group(2)) if m else (label, "")
        if inside:
            mp = self.by_seat.get(self._seat_key(inside))
            if mp:
                if not name_match(split_honorific(outside.replace("’", "'"))[1], mp["name"]):
                    notes.append("CHECK: label name differs from current MP for %s (%s); "
                                 "possibly a former MP (by-election)" % (inside, mp["name"]))
                return mp, notes, None
            # "[Name]" after a title, e.g. "Timbalan Menteri Kewangan [Tuan Liew Chin Tong]"
            mp = self._by_name(inside)
            if mp:
                return mp, ["attributed by name in label"], None
        if author_id is not None and str(author_id) in self.author_seats and str(author_id) not in self.conflicts:
            mp = self.by_code.get(self.author_seats[str(author_id)])
            if mp:
                return mp, ["attributed via portal author_id (same person labelled with seat elsewhere)"], None
        mp = self._by_name(outside)
        if mp:
            return mp, ["attributed by name (no constituency in label)"], None
        for s in self.senators:
            if name_match(split_honorific(outside.replace("’", "'"))[1], s["name"]):
                return None, ["Senator (%s), not an MP" % s["posts"]], None
        if re.match(r"^(Timbalan\s+)?(Perdana\s+)?Menteri\b", label) and not inside:
            return None, ["UNMATCHED speaker: CHECK: speaker shown by title only (%s), no name; "
                          "identify who held the post on this date (may be a senator)" % label], None
        if not inside and (label[:1].islower() or len(label.split()) > 12):
            return None, ["UNMATCHED speaker: CHECK: speaker label corrupted in source data; "
                          "identify the speaker from the PDF page"], None
        return None, ["UNMATCHED speaker: could not attribute to an MP (may be a former minister "
                      "or senator not in the current lists)"], None


# ---------- extraction ----------

def walk(speeches):
    """Yield (section_path, item) for every speech item in the nested heading structure."""
    def rec(node, path):
        if isinstance(node, list):
            for x in node:
                yield from rec(x, path)
        elif isinstance(node, dict):
            if "speech" in node:
                yield path, node
            else:
                for k, v in node.items():
                    yield from rec(v, path + [k.strip()])
    yield from rec(speeches, [])


def excerpt_around(paragraph, match_start):
    words = paragraph.split()
    if len(words) <= MAX_WORDS:
        return paragraph.strip(), False
    # word index of the first keyword, centre an 80-word window on it
    idx = len(paragraph[:match_start].split())
    lo = max(0, min(idx - MAX_WORDS // 2, len(words) - MAX_WORDS))
    hi = lo + MAX_WORDS
    text = " ".join(words[lo:hi])
    return ("..." if lo else "") + text + ("..." if hi < len(words) else ""), True


TABLED_Q_RE = re.compile(r"^\W*\d+\.\s*([^\[\]*]+\[[^\]]+\])\W*\s*minta\b", re.I)
OFFICE_RE = re.compile(r"^((?:Timbalan\s+)?(?:Perdana\s+)?Menteri\b[^\[]*?)\s*\[", re.I)


def classify(section, label):
    """Type from the section heading; office from the label as printed on that day."""
    office = OFFICE_RE.match(label or "")
    office_note = "speaking as %s" % office.group(1).strip() if office else ""
    if any(q in section.upper() for q in QUESTION_SECTIONS):
        return "parliamentary_question", ("oral answer; " + office_note) if office else ""
    return "speech", office_note


def topic_for(keywords):
    ks = {k.lower() for k in keywords}
    for name, group in TOPICS:
        if ks <= group:
            return name
    for name, group in TOPICS:
        if ks & group and not ks - group - {"crypto", "kripto"}:
            return name
    return DEFAULT_TOPIC


def process_sitting(date, is_final, attributor, manifest, stats):
    data = transcript(date, is_final)
    items = [(p, it) for p, it in walk(data.get("speeches", [])) if not it.get("is_annotation")]
    attributor.learn([it for _, it in items])
    try:
        url, path_pdf = pdf_for(date, is_final, manifest)  # brief: download every sitting's PDF
    except ValueError as e:  # parlimen.gov.my has no PDF for a few sittings ("File does not exist")
        stats.setdefault("missing_pdfs", []).append(date)
        print("   no PDF on parlimen.gov.my (%s); using Hansard portal page as source" % e)
        url, path_pdf = None, None
    hits = []
    for path, it in items:
        text = re.sub(r"(?<!\w)[*_]+|[*_]+(?!\w)", "", it.get("speech") or "")  # strip *italic* markup
        for pno, para in enumerate(re.split(r"\n\s*\n", text)):
            kws = list(dict.fromkeys(m.group(1).lower() for m in KEYWORD_RE.finditer(para)))
            if kws:
                hits.append((path, it, pno, para, kws))
    wants_vote = any(v[0] == date for v in VOTES_TO_RECORD)
    if not hits and not wants_vote:
        return []
    portal_url = "%s/hansard/dewan-rakyat/%s" % (PORTAL, date)
    index = PdfIndex(path_pdf) if path_pdf else None
    rows = []
    if wants_vote and index:
        vote_rows, problems = division_rows(date, is_final, items, attributor, url, index)
        rows += vote_rows
        stats.setdefault("vote_problems", []).extend(problems)
    for path, it, pno, para, kws in hits:
        label, tabled = it.get("author"), False
        if not (label or "").strip():
            # Tabled oral question: "**5. Puan Name [Seat]** minta Menteri X menyatakan ..."
            q = TABLED_Q_RE.match(it.get("speech") or "")
            if q:
                label, tabled = q.group(1).strip(), True
                it = dict(it, author=label, author_id=None)
        mp, notes, skip = attributor.resolve(label, it.get("author_id"))
        if tabled:
            notes.insert(0, "tabled oral question (MP's own question)")
        if skip:
            stats["skipped_" + skip] = stats.get("skipped_" + skip, 0) + 1
            continue
        first = KEYWORD_RE.search(para)
        excerpt, cut = excerpt_around(para, first.start())
        page = index.page_of(excerpt) if index else None
        p_lo, p_hi = it.get("pdf_page_start"), it.get("pdf_page_end")
        if not index:
            page = p_lo or None
            notes.append("CHECK: PDF not published on parlimen.gov.my; source is the official Hansard "
                         "portal page (page %s per portal)" % (p_lo or "?"))
        elif page is None and p_lo:
            page = p_lo
            notes.append("CHECK: excerpt not found in PDF text; page %s taken from Hansard portal" % p_lo)
        elif page and p_lo and is_final and not (int(p_lo) <= page <= int(p_hi or p_lo)):
            # (draft PDFs are paginated differently from the portal's copy, so only check finals)
            notes.append("CHECK: page %d differs from portal's pages %s-%s" % (page, p_lo, p_hi))
        section = " > ".join(p for p in path if p)
        etype, type_note = classify(section, it.get("author"))
        if type_note:
            notes.append(type_note)
        if cut:
            notes.append("excerpt trimmed to %d words around keyword" % MAX_WORDS)
        if page is None:
            notes.append("CHECK: excerpt not located in PDF text and no portal page; verify manually")
        if not is_final:
            notes.append("draft Hansard (not yet final)")
        d = datetime.date.fromisoformat(date)
        rows.append({
            "evidence_id": "HDR-%s-%04d-%02d" % (d.strftime("%Y%m%d"), int(it.get("index", 0)), pno),
            "mp_constituency_code": mp["constituency_code"] if mp else "",
            "mp_name": mp["name"] if mp else "",
            "date": date, "type": etype,
            "source_name": "Penyata Rasmi Dewan Rakyat, %s%s" % (d.strftime("%-d %B %Y"),
                                                               "" if is_final else " (draft)"),
            "link": (url + ("#page=%d" % page if page else "")) if url else portal_url,
            "pdf_page": page or "",
            "hansard_page_printed": (index.printed[page - 1] if index and page and page <= len(index.printed)
                                     else ""),
            "excerpt": excerpt, "keywords_matched": "; ".join(kws), "topic": topic_for(kws),
            "stance": "", "mentions_rakyat_benefit": "",
            "speaker_as_printed": it.get("author") or "", "section": section,
            "notes": "; ".join(notes),
        })
    return rows


def division_rows(date, is_final, items, attributor, url, index):
    """One `vote` row per MP for each hand-picked recorded division on this date."""
    rows, problems = [], []
    d = datetime.date.fromisoformat(date)
    for v_date, bill, note in VOTES_TO_RECORD:
        if v_date != date:
            continue
        lists = {}  # (division path, list label) -> [(no, text, seat)]
        for path, it in items:
            if not path or not any(bill in p for p in path):
                continue
            label = next((VOTE_LISTS[k] for k in VOTE_LISTS if path[-1].rstrip(":").strip() == k), None)
            if label:
                key = (" > ".join(path[:-1]), label)
                text = re.sub(r"[*_]", "", it.get("speech") or "")
                lists.setdefault(key, []).extend(VOTE_ENTRY_RE.findall(re.sub(r"\s+", " ", text)))
        if not lists:
            problems.append("%s: no division lists found for '%s'" % (date, bill))
        divisions = sorted({k[0] for k in lists})
        # Search after the chair orders the division, not in the attendance list at the front.
        start_at = max(0, index.find("belah bahagian diadakan"))
        first_list = index.text.find(_norm("Ahli-Ahli Yang"), start_at)
        start_at = first_list if first_list > 0 else start_at
        if start_at == 0:
            problems.append("%s: division order not found in PDF; vote pages may be wrong" % date)
        for dn, div in enumerate(divisions, 1):
            for (div_path, label), entries in sorted(lists.items()):
                if div_path != div:
                    continue
                for no, text, seat in entries:
                    mp = attributor.by_seat.get(attributor._seat_key(seat))
                    line = "%s. %s (%s)" % (no, re.sub(r"\s+", " ", text), seat)
                    page = index.page_of(line, start_at)
                    rows.append({
                        "evidence_id": "HDV-%s-%d-%s" % (d.strftime("%Y%m%d"), dn, (mp or {}).get(
                            "constituency_code", "X" + no).replace(".", "")),
                        "mp_constituency_code": mp["constituency_code"] if mp else "",
                        "mp_name": mp["name"] if mp else "", "date": date, "type": "vote",
                        "source_name": "Penyata Rasmi Dewan Rakyat, %s%s" % (
                            d.strftime("%-d %B %Y"), "" if is_final else " (draft)"),
                        "link": url + ("#page=%d" % page if page else ""), "pdf_page": page or "",
                        "hansard_page_printed": index.printed[page - 1] if page else "",
                        "excerpt": "%s: %s" % (label.split(" (")[0], line),
                        "keywords_matched": "", "topic": "vote: " + label, "stance": "",
                        "mentions_rakyat_benefit": "", "speaker_as_printed": line,
                        "section": div,
                        "notes": "; ".join(filter(None, [note, "" if mp else "UNMATCHED seat '%s'" % seat,
                                                         "" if page else "CHECK: vote line not located in PDF",
                                                         "" if is_final else "draft Hansard (not yet final)"])),
                    })
    # Lists run in order over consecutive pages: fill a missing page from the previous entry
    # in the same list (draft text sometimes splits words, e.g. "D ato'").
    last = {}
    for r in rows:
        key = (r["section"], r["topic"])
        if r["pdf_page"]:
            last[key] = r
        elif key in last:
            prev = last[key]
            r.update({k: prev[k] for k in ("link", "pdf_page", "hansard_page_printed")})
            r["notes"] = r["notes"].replace("CHECK: vote line not located in PDF",
                                            "page taken from the preceding entry in the same list")
    return rows, problems


def scan(dates, catalogue, attributor):
    """Transcripts only (no PDFs): keyword hits per sitting -> data/cache/hansard_scan.csv."""
    out = []
    for n, date in enumerate(dates, 1):
        try:
            items = [(p, it) for p, it in walk(transcript(date, catalogue[date]).get("speeches", []))
                     if not it.get("is_annotation")]
        except Exception as e:
            print("[%d/%d] %s ERROR %s" % (n, len(dates), date, e))
            continue
        attributor.learn([it for _, it in items])
        hits = [(p, it) for p, it in items if KEYWORD_RE.search(it.get("speech") or "")]
        speakers = sorted({it.get("author") or "" for _, it in hits})
        out.append({"date": date, "is_final": catalogue[date], "items": len(items), "keyword_items": len(hits),
                    "speakers": " | ".join(speakers)[:500],
                    "sections": " | ".join(sorted({" > ".join(p)[:80] for p, _ in hits}))[:500]})
        print("[%d/%d] %s %3d keyword items" % (n, len(dates), date, len(hits)))
        if n % 10 == 0:
            attributor.save()
    attributor.save()
    write_csv(os.path.join(CACHE, "hansard_scan.csv"), out,
              ["date", "is_final", "items", "keyword_items", "speakers", "sections"])
    print("Sittings with keyword items: %d / %d; total items %d"
          % (sum(1 for r in out if r["keyword_items"]), len(out), sum(r["keyword_items"] for r in out)))


def merge_evidence(new_rows, dates_done):
    """Replace Hansard rows for processed dates; keep hand-entered fields by evidence_id."""
    existing = read_csv(EVIDENCE) if os.path.exists(EVIDENCE) else []
    manual = {r["evidence_id"]: {f: r.get(f, "") for f in MANUAL_FIELDS} for r in existing}
    keep = [r for r in existing
            if not (r["evidence_id"].startswith(("HDR-", "HDV-")) and r.get("date") in dates_done)]
    for r in new_rows:
        r.update({k: v for k, v in manual.get(r["evidence_id"], {}).items() if v})
    rows = sorted(keep + new_rows, key=lambda r: (r.get("date", ""), r["evidence_id"]))
    write_csv(EVIDENCE, rows, EVIDENCE_FIELDS)
    return len(rows)


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dates", help="comma-separated YYYY-MM-DD sittings (test runs)")
    g.add_argument("--all", action="store_true", help="every 15th Parliament sitting from %s" % START_DATE)
    ap.add_argument("--since", default=START_DATE)
    ap.add_argument("--scan", action="store_true",
                    help="only fetch transcripts and count keyword hits per sitting (no PDFs, no evidence)")
    args = ap.parse_args()

    catalogue = dict(sittings())
    if args.dates:
        wanted = [d.strip() for d in args.dates.split(",")]
        missing = [d for d in wanted if d not in catalogue]
        if missing:
            raise SystemExit("Not sittings in the catalogue: %s" % ", ".join(missing))
    else:
        wanted = [d for d in sorted(catalogue) if d >= max(args.since, START_DATE)]

    attributor, manifest = Attributor(), load_manifest()
    if args.scan:
        return scan(wanted, catalogue, attributor)
    stats, errors, all_rows, done = {}, [], [], set()
    for n, date in enumerate(wanted, 1):
        try:
            rows = process_sitting(date, catalogue[date], attributor, manifest, stats)
            all_rows += rows
            done.add(date)
            print("[%d/%d] %s %-5s %3d evidence rows" % (n, len(wanted), date,
                                                      "" if catalogue[date] else "draft", len(rows)))
        except Exception as e:  # keep going; report at the end
            errors.append("%s: %s" % (date, e))
            print("[%d/%d] %s ERROR %s" % (n, len(wanted), date, e))
        attributor.save()  # resumable: author map persists after each sitting
    total = merge_evidence(all_rows, done)

    print("\n=== Stage 3 summary ===")
    print("Sittings processed: %d / %d" % (len(done), len(wanted)))
    print("Evidence rows from these sittings: %d (evidence.csv now %d rows)" % (len(all_rows), total))
    print("By type: %s" % {t: sum(1 for r in all_rows if r["type"] == t) for t in {r["type"] for r in all_rows}})
    print("Attributed to an MP: %d | not an MP or unmatched: %d"
          % (sum(1 for r in all_rows if r["mp_constituency_code"]),
             sum(1 for r in all_rows if not r["mp_constituency_code"])))
    print("Not located in PDF (page blank): %d" % sum(1 for r in all_rows if not r["pdf_page"]))
    print("Skipped (chair/procedural): %s" % (stats or "none"))
    print("Errors: %s" % ("none" if not errors else ""))
    for e in errors:
        print("  - " + e)


if __name__ == "__main__":
    main()
