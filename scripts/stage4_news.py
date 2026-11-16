"""Stage 4: news coverage of MPs on crypto (type = press in evidence.csv).

    .venv/bin/python scripts/stage4_news.py queries [--all]   # write data/stage4_queries.csv
    .venv/bin/python scripts/stage4_news.py merge             # verify data/press_hits.csv, merge

Web searches are run outside this script (by the assistant's web search tool, or by hand),
using the queries in data/stage4_queries.csv: "<MP name> kripto" and "<MP name> crypto".
Relevant results go in data/press_hits.csv, one row per (MP, article):

    mp_constituency_code, query, headline, link, summary, searched_on

`summary` is a one-line description written by the researcher, never copied article text.

`merge` then, for each hit:
- skips fetching paywalled outlets (PAYWALLED below) and records them as-is, flagged;
- otherwise fetches the page once to confirm the link works and to read publisher metadata
  only (og:site_name, og:title, article:published_time / datePublished). No article text is kept;
- writes evidence rows (type=press) with id PRS-<hash>, keeping hand-entered stance fields.
"""
import argparse
import datetime
import hashlib
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CACHE, DATA, fetch, read_csv, write_csv  # noqa: E402
from stage3_hansard import EVIDENCE, EVIDENCE_FIELDS, MANUAL_FIELDS  # noqa: E402

QUERIES = os.path.join(DATA, "stage4_queries.csv")
HITS = os.path.join(DATA, "press_hits.csv")
HIT_FIELDS = ["mp_constituency_code", "query", "headline", "link", "summary", "searched_on"]
# Subscription sites: never fetched (brief: do not scrape paywalled pages).
PAYWALLED = ("malaysiakini.com", "theedgemalaysia.com", "theedgemarkets.com", "nst.com.my/premium",
             "thestar.com.my/business/business-news/premium", "ft.com", "bloomberg.com", "wsj.com")
OUTLET_NAMES = {"thestar.com.my": "The Star", "nst.com.my": "New Straits Times", "bernama.com": "Bernama",
                "malaysiakini.com": "Malaysiakini", "freemalaysiatoday.com": "Free Malaysia Today",
                "theedgemalaysia.com": "The Edge Malaysia", "malaymail.com": "Malay Mail",
                "sinarharian.com.my": "Sinar Harian", "hmetro.com.my": "Harian Metro",
                "bharian.com.my": "Berita Harian", "utusan.com.my": "Utusan Malaysia",
                "astroawani.com": "Astro Awani", "thesun.my": "The Sun", "thevibes.com": "The Vibes",
                "kosmo.com.my": "Kosmo", "harakahdaily.net": "Harakah Daily", "sinchew.com.my": "Sin Chew",
                "chinapress.com.my": "China Press", "orientaldaily.com.my": "Oriental Daily",
                "theborneopost.com": "The Borneo Post", "dayakdaily.com": "DayakDaily",
                "dailyexpress.com.my": "Daily Express", "focusmalaysia.my": "Focus Malaysia",
                "malaysiagazette.com": "Malaysia Gazette", "buletintv3.my": "Buletin TV3",
                "rtm.gov.my": "RTM", "digitalnewsasia.com": "Digital News Asia",
                "coindesk.com": "CoinDesk", "theblock.co": "The Block", "reuters.com": "Reuters"}


def common_name(name):
    """'Syerleena binti Abdul Rashid' -> 'Syerleena Abdul Rashid' (how news usually writes it)."""
    name = re.sub(r"\s*@\s*\S+", "", name)
    name = re.sub(r"\s*\S*\([^)]*\)", "", name)  # "TLDM(Bersara)"
    name = re.sub(r"\b(bin|binti|bt|a/l|a/p|anak|ak|haji|hajah|hj\.?|dato'?|datuk|komander)(?=\s|$)\.?",
                  " ", name, flags=re.I)
    return re.sub(r"\s+", " ", name).strip()


def cmd_queries(all_mps):
    mps = [m for m in read_csv(os.path.join(DATA, "mps.csv")) if m.get("name")]
    in_hansard = set()
    if os.path.exists(EVIDENCE):
        in_hansard = {r["mp_constituency_code"] for r in read_csv(EVIDENCE)
                      if r["type"] in ("speech", "parliamentary_question") and r["mp_constituency_code"]}
    rows = []
    for m in mps:
        if not all_mps and m["constituency_code"] not in in_hansard:
            continue
        n = common_name(m["name"])
        rows.append({"mp_constituency_code": m["constituency_code"], "mp_name": m["name"],
                     "priority": "1 (in Hansard)" if m["constituency_code"] in in_hansard else "2",
                     "query_kripto": '"%s" kripto' % n, "query_crypto": '"%s" crypto' % n})
    write_csv(QUERIES, rows, ["mp_constituency_code", "mp_name", "priority", "query_kripto", "query_crypto"])
    print("Wrote %d MPs (%d queries) to %s" % (len(rows), 2 * len(rows), QUERIES))


def _meta(page, *names):
    for n in names:
        m = re.search(r'<meta[^>]+(?:property|name|itemprop)=["\']%s["\'][^>]*content=["\']([^"\']+)' % re.escape(n),
                      page, re.I) or re.search(
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name|itemprop)=["\']%s["\']' % re.escape(n),
            page, re.I)
        if m:
            return html.unescape(m.group(1)).strip()
    return ""


def _json_ld_date(page):
    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', page, re.S | re.I):
        m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', block)
        if m:
            return m.group(1)
    return ""


def verify(link):
    """(outlet, headline, date, notes) from page metadata; nothing else from the page is kept."""
    host = urllib.parse.urlparse(link).netloc.lower().replace("www.", "")
    outlet = next((v for k, v in OUTLET_NAMES.items() if host.endswith(k)), host)
    if any(p in link for p in PAYWALLED):
        return outlet, "", "", ["paywalled outlet: not fetched; headline and date as found in search, verify manually"]
    key = hashlib.sha1(link.encode()).hexdigest()[:16]
    page, url, notes = None, link, []
    for attempt in range(3):  # follow 307/308 redirects (urllib on Python 3.9 does not); retry timeouts
        try:
            page = fetch(url, cache_path=os.path.join(CACHE, "press", key + ".html"))
            break
        except urllib.error.HTTPError as e:
            if e.code in (307, 308) and e.headers.get("Location"):
                url = urllib.parse.urljoin(url, e.headers["Location"])
                continue
            return outlet, "", "", ["CHECK: link did not load (HTTP %s)" % e.code]
        except Exception as e:
            if attempt == 2:
                return outlet, "", "", ["CHECK: link did not load (%s); retry later" % str(e)[:60]]
    if page is None:
        return outlet, "", "", ["CHECK: link did not load (too many redirects)"]
    outlet = _meta(page, "og:site_name") or outlet
    headline = _meta(page, "og:title", "twitter:title")
    if headline and (re.search(r"latest (trending )?news|home ?page|^%s$" % re.escape(outlet), headline, re.I)
                     or len(headline.split()) < 4):
        notes.append("CHECK: page shows a generic title (%s); link may redirect, verify article" % headline[:50])
        headline = ""
    raw_date = (_meta(page, "article:published_time", "datePublished", "pubdate", "publish-date", "date")
                or _json_ld_date(page))
    m = re.search(r"(\d{4}-\d{2}-\d{2})", raw_date)
    date = m.group(1) if m else ""
    if not date:
        u = re.search(r"/(20\d{2})/(\d{2})/(\d{2})/", link)
        if u:
            date = "-".join(u.groups())
            notes.append("date taken from article URL")
        else:
            notes.append("CHECK: publish date not in page metadata")
    if date and date < "2022-12-19":
        notes.append("before the 15th Parliament first sat (19 Dec 2022)")
    return outlet, headline, date, notes


def cmd_merge():
    hits = read_csv(HITS) if os.path.exists(HITS) else []
    mps = {m["constituency_code"]: m for m in read_csv(os.path.join(DATA, "mps.csv"))}
    rows, problems = [], []
    for h in hits:
        code, link = h["mp_constituency_code"].strip(), h["link"].strip()
        if code not in mps or not link.startswith("http"):
            problems.append("bad hit row: %s %s" % (code, link))
            continue
        outlet, title, date, notes = verify(link)
        headline = title or h["headline"]
        if title and h["headline"] and title.lower()[:40] != h["headline"].lower()[:40]:
            notes.append("headline from page metadata (search showed: %s)" % h["headline"][:80])
        rows.append({
            "evidence_id": "PRS-" + hashlib.sha1((code + "|" + link).encode()).hexdigest()[:10],
            "mp_constituency_code": code, "mp_name": mps[code]["name"], "date": date, "type": "press",
            "source_name": outlet, "link": link, "pdf_page": "", "hansard_page_printed": "",
            "excerpt": "", "keywords_matched": h["query"].split('" ')[-1] if '"' in h["query"] else "",
            "topic": "", "stance": "", "mentions_rakyat_benefit": "",
            "speaker_as_printed": "", "section": headline,
            "notes": "; ".join(filter(None, ["Headline: " + headline, "Summary: " + h["summary"],
                                             "searched %s with %s" % (h.get("searched_on", ""), h["query"])] + notes)),
        })
        print("%-6s %-22s %-10s %s" % (code, outlet[:22], date or "?", headline[:70]))

    existing = read_csv(EVIDENCE) if os.path.exists(EVIDENCE) else []
    manual = {r["evidence_id"]: {f: r.get(f, "") for f in MANUAL_FIELDS} for r in existing}
    for r in rows:
        r.update({k: v for k, v in manual.get(r["evidence_id"], {}).items() if v})
    keep = [r for r in existing if not r["evidence_id"].startswith("PRS-")]
    write_csv(EVIDENCE, sorted(keep + rows, key=lambda r: (r.get("date", ""), r["evidence_id"])), EVIDENCE_FIELDS)
    print("\n=== Stage 4 summary ===")
    print("Press rows: %d from %d hits | MPs with press: %d" % (len(rows), len(hits),
                                                              len({r['mp_constituency_code'] for r in rows})))
    print("Flagged: %d" % sum(1 for r in rows if "CHECK" in r["notes"] or "paywalled" in r["notes"]))
    for p in problems:
        print("  - " + p)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    q = sub.add_parser("queries")
    q.add_argument("--all", action="store_true", help="all MPs, not only those found in Hansard")
    sub.add_parser("merge")
    args = ap.parse_args()
    cmd_queries(args.all) if args.cmd == "queries" else cmd_merge()


if __name__ == "__main__":
    main()
