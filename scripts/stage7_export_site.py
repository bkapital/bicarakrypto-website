"""Stage 7: export the public data files for bicarakrypto.com/data/mp-crypto-index.

    .venv/bin/python scripts/stage7_export_site.py

Writes trimmed copies (no emails, phone numbers or internal notes) to
public/datasets/mp-crypto-index/:
- mps.csv       seat, constituency, name, party, coalition, state, status, role
- evidence.csv  Hansard and news rows (no Budget vote rows) with stance and reason
- meta.json     when the data was exported, and counts

Stance: your reviewed `stance` in evidence.csv wins; otherwise the AI suggestion from
data/stance_suggestions.csv, marked stance_source=suggested.
Run after Stages 1-6 whenever the data changes, then rebuild/deploy the site.
"""
import csv
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA, ROOT, read_csv, write_csv  # noqa: E402

OUT = os.path.join(ROOT, "public", "datasets", "mp-crypto-index")
MP_FIELDS = ["constituency_code", "constituency", "name", "party", "coalition", "state", "status", "role"]
EV_FIELDS = ["evidence_id", "constituency_code", "mp_name", "date", "type", "source_name", "link", "page",
             "text", "stance", "stance_source", "stance_reason", "draft", "flagged"]


def main():
    mps = read_csv(os.path.join(DATA, "mps.csv"))
    sug_path = os.path.join(DATA, "stance_suggestions.csv")
    sug = {r["evidence_id"]: r for r in read_csv(sug_path)} if os.path.exists(sug_path) else {}
    rows = []
    for r in read_csv(os.path.join(DATA, "evidence.csv")):
        if r["type"] == "vote":
            continue
        head = re.search(r"Headline: (.*?)(; Summary:|$)", r["notes"])
        summ = re.search(r"Summary: (.*?)(; searched|$)", r["notes"])
        text = r["excerpt"] or ((head.group(1) if head else "") + (" — " + summ.group(1) if summ else ""))
        manual = r["stance"].strip().lower()
        s = sug.get(r["evidence_id"], {})
        rows.append({
            "evidence_id": r["evidence_id"], "constituency_code": r["mp_constituency_code"],
            "mp_name": r["mp_name"] or r["speaker_as_printed"], "date": r["date"], "type": r["type"],
            "source_name": r["source_name"], "link": r["link"], "page": r["hansard_page_printed"], "text": text,
            "stance": manual or s.get("suggested_stance", ""),
            "stance_source": "reviewed" if manual else ("suggested" if s else ""),
            "stance_reason": "" if manual else s.get("reason", ""),
            "draft": "yes" if "(draft)" in r["source_name"] else "no",
            "flagged": "yes" if any(k in r["notes"] for k in ("CHECK", "UNMATCHED", "paywalled")) else "no",
        })
    os.makedirs(OUT, exist_ok=True)
    write_csv(os.path.join(OUT, "mps.csv"), mps, MP_FIELDS)
    write_csv(os.path.join(OUT, "evidence.csv"), rows, EV_FIELDS)
    meta = {"exported_at": datetime.date.today().isoformat(), "mps": len(mps), "evidence_rows": len(rows),
            "reviewed_stances": sum(1 for r in rows if r["stance_source"] == "reviewed"),
            "hansard_range": "2022-12-19 to " + max((r["date"] for r in rows if r["date"]), default="")}
    with open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("Wrote %s: %d MPs, %d evidence rows (%d reviewed stances)"
          % (OUT, len(mps), len(rows), meta["reviewed_stances"]))


if __name__ == "__main__":
    main()
