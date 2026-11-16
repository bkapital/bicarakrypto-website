"""Stage 6: summary report, data checks, and the survey / corrections files.

    .venv/bin/python scripts/stage6_summary.py

- Creates data/survey.csv (one row per MP with seat, name and email; response columns empty)
  and data/corrections.csv (headers only) if they do not exist. Existing entries are never
  overwritten; MPs missing from survey.csv are appended.
- Checks evidence.csv against the brief's rules.
- Prints the report and saves it to data/summary_report.txt.
"""
import collections
import datetime
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA, read_csv, write_csv  # noqa: E402

SURVEY = os.path.join(DATA, "survey.csv")
SURVEY_FIELDS = ["mp_constituency_code", "mp_name", "email", "date_sent", "followup_date", "reply_date",
                 "q1", "q2", "q3", "q4", "q5", "comments", "publish_permission"]
CORRECTIONS = os.path.join(DATA, "corrections.csv")
CORRECTION_FIELDS = ["date", "mp_constituency_code", "request", "action_taken"]
REPORT = os.path.join(DATA, "summary_report.txt")
TYPES = ["speech", "parliamentary_question", "written_answer", "vote", "press", "social", "event"]
MAX_WORDS = 85  # brief: "max ~80 words"; small allowance for "..." markers


def make_survey(mps):
    """Sitting MPs only. Rows for seats no longer held are dropped only if nothing was entered."""
    sitting = {m["constituency_code"] for m in mps if m.get("status", "sitting") == "sitting"}
    existing = read_csv(SURVEY) if os.path.exists(SURVEY) else []
    responses = SURVEY_FIELDS[3:]
    kept = [r for r in existing if r["mp_constituency_code"] in sitting or any(r.get(f) for f in responses)]
    have = {r["mp_constituency_code"] for r in kept}
    added = [{"mp_constituency_code": m["constituency_code"], "mp_name": m["name"], "email": m.get("email", "")}
             for m in mps if m["constituency_code"] in sitting and m["constituency_code"] not in have]
    write_csv(SURVEY, kept + added, SURVEY_FIELDS)
    return len(kept), len(added), len(existing) - len(kept)


def make_corrections():
    if not os.path.exists(CORRECTIONS):
        write_csv(CORRECTIONS, [], CORRECTION_FIELDS)
        return "created (empty)"
    return "kept (%d rows)" % len(read_csv(CORRECTIONS))


def main():
    mps_all = read_csv(os.path.join(DATA, "mps.csv"))
    mps = [m for m in mps_all if m.get("name")]
    codes = {m["constituency_code"]: m for m in mps}
    ev = read_csv(os.path.join(DATA, "evidence.csv"))
    out = []
    p = out.append

    s_old, s_new, s_dropped = make_survey(mps)
    corr = make_corrections()

    p("MP CRYPTO STANCE TRACKER - SUMMARY REPORT")
    p("Generated %s" % datetime.date.today().isoformat())
    p("=" * 72)

    # --- coverage
    p("\n1. MPs")
    sitting = [m for m in mps if m.get("status", "sitting") == "sitting"]
    vacant = [m for m in mps if m.get("status", "sitting") != "sitting"]
    p("   Seats: %d | sitting MPs: %d | vacant: %d" % (len(mps_all), len(sitting), len(vacant)))
    for m in vacant:
        p("     - %s %s: former MP (%s), %s" % (m["constituency_code"], m["constituency"], m["name"], m["status"]))
    for r in ("minister", "deputy minister", "backbencher"):
        p("   %-16s %d" % (r, sum(1 for m in sitting if m.get("role") == r)))
    p("   Sitting MPs with no email on record: %d (%s)" % (
        sum(1 for m in sitting if not m.get("email")),
        ", ".join(m["constituency_code"] for m in sitting if not m.get("email"))))

    # --- evidence totals
    p("\n2. EVIDENCE ROWS (evidence.csv: %d rows)" % len(ev))
    by_type = collections.Counter(r["type"] for r in ev)
    for t in TYPES:
        p("   %-24s %4d" % (t, by_type.get(t, 0)))
    for t in sorted(set(by_type) - set(TYPES)):
        p("   %-24s %4d  <- unexpected type" % (t, by_type[t]))
    gaps = [t for t in ("written_answer", "social", "event") if not by_type.get(t)]
    if gaps:
        p("   No rows yet for: %s (see README: written answers unavailable; social checked by hand)"
          % ", ".join(gaps))

    # --- per MP
    substantive = [r for r in ev if r["type"] != "vote"]  # the only vote is the general Budget 2026 vote
    per_mp = collections.defaultdict(collections.Counter)
    for r in substantive:
        if r["mp_constituency_code"]:
            per_mp[r["mp_constituency_code"]][r["type"]] += 1
    p("\n3. EVIDENCE PER MP (excluding the Budget 2026 vote, which every MP has)")
    sit_codes = {m["constituency_code"] for m in sitting}
    p("   Sitting MPs with at least one row: %d of %d" % (len(sit_codes & set(per_mp)), len(sitting)))
    p("   Sitting MPs with ZERO evidence:    %d" % (len(sitting) - len(sit_codes & set(per_mp))))
    p("   Former MPs (vacant seats) with evidence from their time as MP: %d"
      % len({m["constituency_code"] for m in vacant} & set(per_mp)))
    p("   Top 20:")
    p("   %-6s %-34s %-8s %-15s %5s %5s %5s %5s" % ("seat", "name", "party", "role", "total", "spch", "PQ", "press"))
    for code, c in sorted(per_mp.items(), key=lambda kv: -sum(kv[1].values()))[:20]:
        m = codes.get(code, {})
        p("   %-6s %-34s %-8s %-15s %5d %5d %5d %5d" % (
            code, m.get("name", "?")[:34], (m.get("party") or "-")[:8], m.get("role", "")[:15],
            sum(c.values()), c["speech"], c["parliamentary_question"], c["press"]))
    by_party = collections.Counter((codes[c].get("party") or "(blank)") for c in per_mp if c in codes)
    all_party = collections.Counter((m.get("party") or "(blank)") for m in mps)
    p("   MPs with evidence, by party: " + ", ".join(
        "%s %d/%d" % (k, by_party.get(k, 0), v) for k, v in all_party.most_common()))
    p("   Full per-MP counts: data/summary_per_mp.csv")
    write_csv(os.path.join(DATA, "summary_per_mp.csv"),
              [{"constituency_code": m["constituency_code"], "name": m["name"], "party": m.get("party", ""),
                "coalition": m.get("coalition", ""), "status": m.get("status", ""), "role": m.get("role", ""),
                "total": sum(per_mp[m["constituency_code"]].values()),
                **{t: per_mp[m["constituency_code"]][t] for t in TYPES if t != "vote"}} for m in mps],
              ["constituency_code", "name", "party", "coalition", "status", "role", "total"]
              + [t for t in TYPES if t != "vote"])

    # --- unmatched
    p("\n4. ROWS NOT MATCHED TO AN MP")
    unmatched = [r for r in ev if not r["mp_constituency_code"]]
    senators = [r for r in unmatched if "Senator" in r["notes"]]
    other = [r for r in unmatched if r not in senators]
    p("   Senators speaking as ministers (not MPs): %d" % len(senators))
    for name, n in collections.Counter(r["speaker_as_printed"][:60] for r in senators).most_common():
        p("     - %s (%d)" % (name, n))
    p("   Unmatched speakers: %d" % len(other))
    for r in other:
        p("     - %s %s | %s" % (r["date"], r["speaker_as_printed"][:55], r["notes"].split(";")[0][:70]))
    empty_seats = [m["constituency_code"] for m in mps_all if not m.get("name")]
    if empty_seats:
        p("   Seats with no MP in mps.csv: %s" % ", ".join(empty_seats))

    # --- rule checks
    p("\n5. CHECKS AGAINST THE BRIEF'S RULES")
    issues = []
    no_link = [r["evidence_id"] for r in ev if not r["link"].startswith("http")]
    issues.append(("every row has a source link", no_link))
    long_ex = [r["evidence_id"] for r in ev if len(r["excerpt"].split()) > MAX_WORDS]
    issues.append(("excerpts <= ~80 words", long_ex))
    non_hansard_ex = [r["evidence_id"] for r in ev if r["excerpt"] and r["type"] in ("press", "social")]
    issues.append(("excerpts only from Hansard (no press/social text)", non_hansard_ex))
    filled = [r["evidence_id"] for r in ev if r["stance"] or r["mentions_rakyat_benefit"]]
    p("   stance / mentions_rakyat_benefit filled by hand so far: %d rows (scripts never fill these)" % len(filled))
    bad_code = [r["evidence_id"] for r in ev if r["mp_constituency_code"] and r["mp_constituency_code"] not in codes]
    issues.append(("seat codes exist in mps.csv", bad_code))
    dup = [k for k, n in collections.Counter(r["evidence_id"] for r in ev).items() if n > 1]
    issues.append(("evidence_id unique", dup))
    no_date = [r["evidence_id"] for r in ev if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["date"] or "")]
    issues.append(("every row has a date (YYYY-MM-DD)", no_date))
    for label, bad in issues:
        p("   [%s] %s%s" % ("OK" if not bad else "!!", label,
                            "" if not bad else ": %d rows, e.g. %s" % (len(bad), ", ".join(bad[:5]))))

    # --- flags for manual review
    p("\n6. ROWS FLAGGED FOR MANUAL REVIEW")
    flags = collections.Counter()
    for r in ev:
        for n in r["notes"].split("; "):
            if n.startswith("CHECK") or "UNMATCHED" in n or n.startswith("paywalled") or "before the 15th" in n:
                flags[re.sub(r"\(.*", "", n).replace("UNMATCHED speaker: ", "")[:75].strip()] += 1
    for k, n in flags.most_common():
        p("   %4d  %s" % (n, k))
    draft = sum(1 for r in ev if "(draft)" in r["source_name"] and r["type"] != "vote")
    p("   Hansard rows from DRAFT transcripts: %d (refresh by rerunning Stage 3 later)" % draft)

    # --- errors / gaps
    p("\n7. ERRORS AND KNOWN GAPS")
    manifest = os.path.join(DATA, "hansard_pdfs", "manifest.csv")
    pdfs = len(read_csv(manifest)) if os.path.exists(manifest) else 0
    p("   Hansard PDFs downloaded: %d (3 sittings have no PDF on parlimen.gov.my: portal page used)" % pdfs)
    p("   Written answers (Jawapan Bukan Lisan): not available (search returns error / no results)")
    p("   Kamar Khas (special chamber) Hansard: not included")
    p("   News: searched only the 74 MPs found in Hansard; other 148 MPs not searched")
    p("   Social media: checklist prepared (data/social_checklist.csv); %d MPs checked so far" % sum(
        1 for r in read_csv(os.path.join(DATA, "social_checklist.csv")) if r.get("checked_on"))
      if os.path.exists(os.path.join(DATA, "social_checklist.csv")) else "   Social checklist: not built")
    p("   Party: current party is from election results + manual corrections; switches since may be missing")

    p("\n8. FILES")
    p("   survey.csv: %d existing rows kept, %d sitting MPs added, %d empty rows for vacant seats removed"
      % (s_old, s_new, s_dropped))
    p("   corrections.csv: %s" % corr)

    text = "\n".join(out)
    print(text)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(text + "\n")
    print("\nSaved to %s" % REPORT)


if __name__ == "__main__":
    main()
