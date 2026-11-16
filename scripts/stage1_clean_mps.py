"""Stage 1: clean the scraped MP list into data/mps.csv using parlimen.gov.my profiles.

    .venv/bin/python scripts/stage1_clean_mps.py [--input data/mp_emails.csv]

Profiles are cached in data/cache/profiles/, so reruns make no new requests.
Party comes from election results (MECo, CC0: github.com/Thevesh/paper-meco-results),
taking each seat's latest election (GE-15 or a later by-election), and only when the
winner's name matches the profile.
Nothing is guessed: anything that cannot be confirmed goes in `flags`.
"""
import argparse
import csv
import difflib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CACHE, DATA, PARLIMEN, clean_text, fetch, read_csv, seat_code, write_csv  # noqa: E402

TOTAL_SEATS = 222
COALITIONS = {"PH", "PN", "BN", "GPS", "GRS"}  # values on profiles that are coalitions, not parties
NON_MP_POSTS = ("Setiausaha Dewan Rakyat", "Yang di-Pertua Dewan Rakyat")

MECO_URL = "https://raw.githubusercontent.com/Thevesh/paper-meco-results/main/data/consol_ballots.csv"
GE15_DATE = "2022-11-19"

FIELDS = ["constituency_code", "constituency", "name", "honorific", "party", "party_at_election",
          "party_source", "coalition", "state",
          "status", "role", "committees", "official_facebook", "official_x", "social_media_raw",
          "email", "phone", "profile_id", "profile_url", "flags", "notes"]
OVERRIDES = os.path.join(DATA, "manual_overrides.csv")


def apply_overrides(rows):
    """Apply data/manual_overrides.csv (hand-verified corrections) on top of scraped data.
    field=clear_flags removes flags starting with `value`; any other field is set to `value`."""
    if not os.path.exists(OVERRIDES):
        return 0
    by_code = {r["constituency_code"]: r for r in rows}
    n = 0
    for o in read_csv(OVERRIDES):
        row = by_code.get(o["constituency_code"])
        if not row:
            print("WARNING: override for unknown seat %s" % o["constituency_code"])
            continue
        if o["field"] == "clear_flags":
            row["flags"] = "; ".join(f for f in row.get("flags", "").split("; ")
                                     if f and not f.startswith(o["value"]))
        elif o["field"] in FIELDS:
            row[o["field"]] = o["value"]
            if o["field"] == "party":
                row["party_source"] = "manual (%s, %s)" % (o["source"], o["date"])
        else:
            print("WARNING: unknown override field %s" % o["field"])
            continue
        note = "%s [%s %s]" % (o["note"], o["source"], o["date"])
        if note not in row.get("notes", ""):
            row["notes"] = "; ".join(filter(None, [row.get("notes", ""), note]))
        n += 1
    return n

# Leading title words. Some only count as titles after another title, so that
# surnames such as "Tan" are never stripped.
ALWAYS_TITLE = {"yb", "yab", "ybhg", "tuan", "puan", "cik", "dato'", "dato", "datuk", "datu",
                "datin", "dr.", "dr", "ir.", "ts.", "prof.", "haji", "hajah", "hajjah", "hj.", "hjh.",
                "ustaz", "ustazah", "kapten", "mejar", "kolonel", "leftenan", "jeneral"}
AFTER_TITLE = {"seri", "sri", "wira", "indera", "paduka", "panglima", "setia", "amar", "madya", "utama", "diraja"}
# "Tuan"/"Puan"/"Cik" are titles only straight after YB (in "Dato' Sri Tuan Ibrahim" it is a name).
YB_ONLY = {"yb", "yab", "ybhg"}
FORM_OF_ADDRESS = {"tuan", "puan", "cik"}
DATO_LIKE = {"dato'", "dato", "datuk", "datu", "datin"}


def split_honorific(full):
    tokens = full.split()
    titles = []
    while tokens:
        t = tokens[0].lower()
        nxt = tokens[1].lower() if len(tokens) > 1 else ""
        if t in FORM_OF_ADDRESS:
            if all(x.lower() in YB_ONLY for x in titles):
                titles.append(tokens.pop(0))
            else:
                break
        elif t in ALWAYS_TITLE or (titles and t in AFTER_TITLE):
            titles.append(tokens.pop(0))
        elif t == "tan" and nxt in ("sri", "seri"):  # "Tan Sri", not the surname Tan
            titles.extend([tokens.pop(0), tokens.pop(0)])
        else:
            break
    return " ".join(titles), " ".join(tokens)


def parse_profile(page):
    """Return {label: (text, html)} from the profile's MAKLUMAT table."""
    out = {}
    for label, cell in re.findall(r"<strong>\s*([^<]+?)\s*</strong>\s*</td>\s*<td[^>]*>(.*?)</td>",
                                  page, flags=re.S | re.I):
        if label not in out:
            value = clean_text(cell)
            out[label] = ("" if value == "-" else value, cell)
    return out


def _as_url(value, domains):
    """Turn '//www.facebook.com/x', 'facebook.com/x' or 'https://...' into an https URL."""
    m = re.search(r"(?:https?:)?(?://)?((?:www\.|m\.)?(?:%s)/\S+)" % "|".join(map(re.escape, domains)),
                  value, flags=re.I)
    return "https://" + m.group(1).rstrip(".,;)") if m else ""


def social_links(cell_html, raw_text):
    """Parse 'FB : ... / Twitter : ... / IG : ...' lines. Only explicit URLs or @handles
    become links; plain page names stay in social_media_raw for manual lookup."""
    fb = x = ""
    for href in re.findall(r'href="([^"]+)"', cell_html or "", flags=re.I):
        fb = fb or _as_url(href, ["facebook.com", "fb.com"])
        x = x or _as_url(href, ["twitter.com", "x.com"])
    for line in (raw_text or "").split("\n"):
        label, _, value = line.partition(":")
        label, value = label.strip().lower(), value.strip()
        if label in ("fb", "facebook"):
            fb = fb or _as_url(value, ["facebook.com", "fb.com"])
        elif label in ("twitter", "x"):
            url = _as_url(value, ["twitter.com", "x.com"])
            m = re.fullmatch(r"@([A-Za-z0-9_]{1,15})", value)
            x = x or url or ("https://x.com/" + m.group(1) if m else "")
    return fb, x


def load_profile(pid):
    url = "%sprofile-ahli.html?uweb=dr&id=%s" % (PARLIMEN, pid)
    page = fetch(url, cache_path=os.path.join(CACHE, "profiles", "%s.html" % pid))
    return url, parse_profile(page)


def build_row(pid, url, prof, input_row=None):
    get = lambda k: prof.get(k, ("", ""))[0]  # noqa: E731
    flags = []
    raw_name = get("Nama")
    honorific, name = split_honorific(raw_name)
    suffix = re.search(r"\s*\(([A-Z]{1,3})\)\s*$", name)
    if suffix:  # e.g. "(B)" after the name: meaning not stated on the profile
        name = name[:suffix.start()]
        flags.append("name_suffix_removed(%s)" % suffix.group(1))
    if not name or len(name.split()) < 2:
        flags.append("check_name_parse")

    code = seat_code(get("Parlimen"))
    if not code:
        flags.append("no_constituency_code_on_profile")

    party_field = get("Parti")
    if party_field in COALITIONS:
        coalition, party = party_field, ""
        flags.append("party_not_on_profile(coalition_only)")
    else:
        coalition, party = "", party_field
        if not party_field:
            flags.append("no_party_on_profile")

    found = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", get("Email"))
    email = "; ".join(dict.fromkeys(e.lower() for e in found))
    if not email:
        flags.append("no_email_on_profile")
    elif input_row and input_row.get("emails"):
        given = set(re.findall(r"[^\s;,/]+@[^\s;,/]+", input_row["emails"].lower()))
        if given != set(email.split("; ")):
            flags.append("email_differs_from_input(input=%s)" % ", ".join(sorted(given)))

    social_raw = re.sub(r"\n\s*\n+", "\n", get("Media Sosial")).strip()
    fb, x = social_links(prof.get("Media Sosial", ("", ""))[1], social_raw)
    if re.search(r"^\s*(FB|Facebook)\s*:", social_raw, flags=re.I | re.M) and not fb:
        flags.append("facebook_named_not_linked")
    if re.search(r"^\s*(Twitter|X)\s*:", social_raw, flags=re.I | re.M) and not x:
        flags.append("x_named_not_linked")

    return {
        "constituency_code": code, "constituency": get("Kawasan"), "name": name,
        "honorific": honorific, "party": party, "coalition": coalition, "state": get("Negeri"),
        "role": "", "committees": "", "official_facebook": fb, "official_x": x,
        "social_media_raw": social_raw.replace("\n", " | "), "email": email,
        "phone": get("No. Telefon"), "profile_id": pid, "profile_url": url,
        "flags": "; ".join(flags), "_post": get("Jawatan dalam Parlimen"),
    }


def latest_winners():
    """{'P.065': winner row} for each seat's most recent election from GE-15 onwards."""
    path = os.path.join(CACHE, "meco", "consol_ballots.csv")
    fetch(MECO_URL, cache_path=path)
    winners = {}
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if (r["date"] >= GE15_DATE and r["seat"].startswith("P.")
                    and r["result"].startswith("won")):
                code = r["seat"][:5]
                if code not in winners or r["date"] > winners[code]["date"]:
                    winners[code] = r
    return winners


_FILLER = {"a/l", "a/p", "bin", "binti", "bt", "b", "anak", "ak", "haji", "hajah", "hj", "hjh"}


def _name_tokens(n):
    words = re.split(r"[\s.@()/,]+", n.lower().replace("a/l", " ").replace("a/p", " "))
    return [w for w in (re.sub(r"[^a-z]", "", w) for w in words) if w and w not in _FILLER]


def name_match(a, b):
    """'exact', 'variant' (one name's words contained in the other's, >=2 words, or a
    close spelling) or '' (different people). Always within the same seat."""
    ta, tb = _name_tokens(a), _name_tokens(b)
    if not ta or not tb:
        return ""
    if ta == tb:
        return "exact"
    small, big = (set(ta), set(tb)) if len(ta) <= len(tb) else (set(tb), set(ta))
    if len(small) >= 2 and small <= big:
        return "variant"
    if difflib.SequenceMatcher(None, "".join(ta), "".join(tb)).ratio() >= 0.85:
        return "variant"
    return ""


def add_party(row, winner):
    """Fill party from election results if the winner is the profile's MP; else flag."""
    flags = [f for f in row["flags"].split("; ") if f and not f.startswith("party_not_on_profile")]
    election = "%s %s" % (winner["election"], winner["date"])
    if not row.get("name"):  # seat has no profile: record the election winner, flagged
        row.update({"constituency": winner["seat"][6:], "name": winner["name"], "state": winner["state"],
                    "party": winner["party"], "party_at_election": winner["party"],
                    "coalition": winner["coalition"], "party_source": "MECo " + election})
        flags = ["NO_PROFILE_ON_PARLIMEN_SITE(details_from_%s_results;check_still_current)" % winner["election"]]
    elif not name_match(row["name"], winner["name"]):
        flags.append("name_mismatch_with_election_winner(%s=%s)" % (election, winner["name"]))
    else:
        if name_match(row["name"], winner["name"]) == "variant":
            flags.append("name_variant_matched(election_name=%s)" % winner["name"])
        profile_party = row["party"]
        row["party"], row["party_source"] = winner["party"], "MECo " + election
        row["party_at_election"] = winner["party"]
        if profile_party and profile_party != winner["party"]:
            flags.append("profile_party_differs(profile=%s)" % profile_party)
        if row["coalition"] and winner["coalition"] and row["coalition"] != winner["coalition"]:
            flags.append("coalition_changed_since_election(%s=%s)" % (winner["election"], winner["coalition"]))
    row["flags"] = "; ".join(flags)


def profile_id(row):
    m = re.search(r"[?&]id=(\d+)", row.get("profile_url", ""))
    return m.group(1) if m else (row.get("id") or row.get("no") or "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default=os.path.join(DATA, "mp_emails.csv"))
    args = ap.parse_args()

    inputs = read_csv(args.input)
    rows, unmatched, non_mps, errors = [], [], [], []
    for i, r in enumerate(inputs, 1):
        pid = profile_id(r)
        if not pid.isdigit():
            unmatched.append((r.get("name", ""), "no profile id/url in input"))
            continue
        try:
            url, prof = load_profile(pid)
        except Exception as e:
            errors.append((pid, str(e)))
            continue
        if not prof.get("Nama"):
            unmatched.append((r.get("name", ""), "profile %s has no data" % pid))
            continue
        row = build_row(pid, url, prof, r)
        if row["_post"] in NON_MP_POSTS and not row["constituency_code"]:
            non_mps.append("%s (%s)" % (row["name"], row["_post"]))
            continue
        rows.append(row)
        print("[%d/%d] %-8s %s" % (i, len(inputs), row["constituency_code"], row["name"]))

    # Seats with no MP: check unlisted profile ids that sit between listed ids
    # (ids follow seat order). Only accept a profile if it fills a missing seat.
    have = {r["constituency_code"] for r in rows}
    missing = ["P.%03d" % n for n in range(1, TOTAL_SEATS + 1) if "P.%03d" % n not in have]
    if missing:
        listed = sorted(int(r["profile_id"]) for r in rows)
        for pid in (str(n) for n in range(listed[0], listed[-1] + 1) if n not in listed):
            if not missing:
                break
            try:
                url, prof = load_profile(pid)
            except Exception as e:
                errors.append((pid, str(e)))
                continue
            row = build_row(pid, url, prof)
            if row["constituency_code"] in missing:
                row["flags"] = "; ".join(filter(None, ["not_linked_from_member_list(check_current)",
                                                       row["flags"]]))
                rows.append(row)
                missing.remove(row["constituency_code"])
                print("[probe] %-8s %s (unlisted profile %s)" % (row["constituency_code"], row["name"], pid))

    for code in missing:
        rows.append({"constituency_code": code, "flags": "NO_MP_FOUND(vacant_or_not_on_site)"})

    winners = latest_winners()
    for row in rows:
        w = winners.get(row["constituency_code"])
        if w:
            add_party(row, w)
        else:
            row["flags"] = "; ".join(filter(None, [row.get("flags"), "no_election_result_found"]))

    for row in rows:  # 'status' = sitting unless a manual override says otherwise (e.g. resigned)
        row["status"] = "sitting" if row.get("name") else "no MP"
    print("Manual overrides applied: %d" % apply_overrides(rows))
    rows.sort(key=lambda r: r["constituency_code"])
    write_csv(os.path.join(DATA, "mps.csv"), rows, FIELDS)

    print("\n=== Stage 1 summary ===")
    print("MPs written:            %d / %d seats" % (sum(1 for r in rows if r.get("name")), TOTAL_SEATS))
    print("Excluded (not MPs):     %s" % (", ".join(non_mps) or "none"))
    print("Seats with no MP:       %s" % (", ".join(missing) or "none"))
    print("Unmatched input rows:   %s" % (unmatched or "none"))
    print("Fetch errors:           %s" % (errors or "none"))
    counts = {}
    for r in rows:
        for f in filter(None, (r.get("flags") or "").split("; ")):
            key = f.split("(input=")[0]
            counts[key] = counts.get(key, 0) + 1
    print("Flag counts:")
    for k, v in sorted(counts.items(), key=lambda kv: -kv[1]):
        print("  %4d  %s" % (v, k))


if __name__ == "__main__":
    main()
