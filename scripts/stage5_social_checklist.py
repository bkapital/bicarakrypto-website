"""Stage 5: social media checklist (prepare only, no scraping).

    .venv/bin/python scripts/stage5_social_checklist.py

Facebook and X do not allow scraping, so nothing is fetched from them. For each MP this writes
data/social_checklist.csv with their official accounts (as listed on their parlimen.gov.my
profile, from Stage 1) and ready-made search links to check by hand:

- X: advanced search limited to the account: from:<handle> (keyword OR keyword ...), newest first
- Facebook: Facebook's post search for "<page or MP name> <keyword>"
- Google: site search of the Facebook page / X account for the keywords (finds older posts)

Columns at the end (checked_on, checked_by, found, post_links, notes) are for the person checking.
Rerunning keeps anything already entered in those columns.
"""
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA, read_csv, write_csv  # noqa: E402
from stage4_news import common_name  # noqa: E402

OUT = os.path.join(DATA, "social_checklist.csv")
# Brief's keyword list, grouped so each search stays within X/Facebook query limits.
KEYWORDS_X = ['kripto', '"mata wang kripto"', '"mata wang digital"', '"aset digital"', 'blockchain',
              '"rantaian blok"', 'bitcoin', 'ethereum', 'stablecoin', 'CBDC', '"token digital"',
              '"penipuan pelaburan"', '"pertukaran aset digital"', 'crypto', 'cryptocurrency',
              '"digital asset"', '"digital currency"', '"investment scam"', 'Web3']
FB_KEYWORDS = ["kripto", "crypto", "blockchain", "aset digital", "bitcoin", "penipuan pelaburan"]
GOOGLE_TERMS = '(kripto OR crypto OR blockchain OR bitcoin OR "aset digital" OR "mata wang digital" ' \
               'OR stablecoin OR CBDC OR "penipuan pelaburan")'
MANUAL = ["checked_on", "checked_by", "found", "post_links", "notes"]
FIELDS = (["constituency_code", "name", "party", "role", "official_facebook", "official_x",
           "official_instagram", "as_listed_on_profile", "source", "flags",
           "x_search", "google_x_search"]
          + ["fb_search_%s" % k.replace(" ", "_") for k in FB_KEYWORDS]
          + ["google_fb_search"] + MANUAL)


def clean_url(url):
    """Drop tracking parameters; fix obvious typos seen on profiles. Returns (url, note)."""
    if not url:
        return "", ""
    note = ""
    p = urllib.parse.urlparse(url)
    host = p.netloc.replace("m.facebook.com", "www.facebook.com").rstrip(".")
    path = re.sub(r"\(.*$", "", p.path).rstrip("/")
    if path.startswith("/profile.pnp"):
        path, note = "/profile.php", "corrected 'profile.pnp' typo on profile to 'profile.php'"
    query = urllib.parse.parse_qs(p.query)
    keep = {k: v for k, v in query.items() if k == "id"}  # profile.php?id=... is the only one needed
    return urllib.parse.urlunparse(("https", host, path, "", urllib.parse.urlencode(keep, doseq=True), "")), note


def x_handle(url):
    m = re.match(r"https://(?:www\.)?(?:x|twitter)\.com/([A-Za-z0-9_]{1,15})$", url or "")
    return m.group(1) if m else ""


def from_raw(raw, label_re, domains):
    """Find an account the Stage 1 parser missed (e.g. 'facebook.com./name')."""
    for line in (raw or "").split(" | "):
        label, _, value = line.partition(":")
        if re.fullmatch(label_re, label.strip(), flags=re.I):
            m = re.search(r"((?:www\.|m\.)?(?:%s)\.?/[^\s|]+)" % "|".join(map(re.escape, domains)), value, re.I)
            if m:
                return "https://" + m.group(1).replace(".com./", ".com/"), value.strip()
            return "", value.strip()
    return "", ""


def q(url, **params):
    return url + "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)


def main():
    mps = [m for m in read_csv(os.path.join(DATA, "mps.csv")) if m.get("name")]
    previous = {r["constituency_code"]: r for r in read_csv(OUT)} if os.path.exists(OUT) else {}
    rows = []
    for m in mps:
        flags = []
        raw = m.get("social_media_raw", "")
        fb, fb_note = clean_url(m.get("official_facebook"))
        if fb_note:
            flags.append(fb_note)
        fb_raw_url, fb_raw_text = from_raw(raw, r"fb|facebook", ["facebook.com", "fb.com"])
        if not fb and fb_raw_url:
            fb, _ = clean_url(fb_raw_url)
            flags.append("Facebook link recovered from profile text (%s)" % fb_raw_text[:60])
        x, _ = clean_url(m.get("official_x"))
        handle = x_handle(x)
        x_raw_url, x_raw_text = from_raw(raw, r"twitter|x", ["twitter.com", "x.com"])
        if not handle:
            h = re.fullmatch(r"@?([A-Za-z0-9_]{3,15})", x_raw_text or "")
            if h:
                handle = h.group(1)
                x = "https://x.com/" + handle
                flags.append("X handle given without link on profile ('%s'); confirm it is the MP's account"
                             % x_raw_text)
        ig_url, ig_text = from_raw(raw, r"ig|instagram", ["instagram.com"])
        if not ig_url and re.fullmatch(r"@?[A-Za-z0-9_.]{3,30}", ig_text or ""):
            ig_url = "https://www.instagram.com/" + ig_text.lstrip("@")
            flags.append("Instagram handle given without link on profile; confirm")

        if not fb:
            flags.append("no Facebook link on profile%s: find the official page"
                         % (" (profile names it: %s)" % fb_raw_text[:60] if fb_raw_text else ""))
        if not handle:
            flags.append("no X account on profile")
        if not raw:
            flags.append("profile lists no social media")
        if m.get("status", "sitting") != "sitting":
            flags.insert(0, "FORMER MP (%s): check posts from their time as MP only" % m["status"])

        # Facebook post search works on words, not page slugs: use the page name given on the
        # profile if it is plain text, otherwise the MP's everyday name ("Shahidan Kassim").
        listed = re.sub(r"\s+", " ", re.sub(r"https?://\S+|//\S+|\S+\.com\S*", "", fb_raw_text or "")).strip()
        fb_subject = listed if 1 < len(listed.split()) <= 6 else common_name(m["name"])

        row = {
            "constituency_code": m["constituency_code"], "name": m["name"], "party": m.get("party", ""),
            "role": m.get("role", ""), "official_facebook": fb,
            "official_x": "https://x.com/" + handle if handle else "",
            "official_instagram": ig_url, "as_listed_on_profile": raw, "source": m.get("profile_url", ""),
            "flags": "; ".join(flags),
            "x_search": q("https://x.com/search", q="from:%s (%s)" % (handle, " OR ".join(KEYWORDS_X)),
                          src="typed_query", f="live") if handle else "",
            "google_x_search": q("https://www.google.com/search",
                                 q="site:x.com/%s %s" % (handle, GOOGLE_TERMS)) if handle else "",
            "google_fb_search": q("https://www.google.com/search",
                                  q="site:%s %s" % (fb.replace("https://", ""), GOOGLE_TERMS))
                                if fb and "profile.php" not in fb else
                                q("https://www.google.com/search",
                                  q='site:facebook.com "%s" %s' % (m["name"], GOOGLE_TERMS)),
        }
        for k in FB_KEYWORDS:
            row["fb_search_" + k.replace(" ", "_")] = q("https://www.facebook.com/search/posts/",
                                                         q="%s %s" % (fb_subject, k))
        old = previous.get(m["constituency_code"], {})
        row.update({k: old.get(k, "") for k in MANUAL})
        rows.append(row)

    write_csv(OUT, rows, FIELDS)
    n = len(rows)
    print("Wrote %d MPs to %s" % (n, OUT))
    print("  Facebook page known: %d | X account known: %d | Instagram known: %d"
          % (sum(1 for r in rows if r["official_facebook"]), sum(1 for r in rows if r["official_x"]),
             sum(1 for r in rows if r["official_instagram"])))
    print("  No social media on profile at all: %d" % sum(1 for r in rows if "lists no social" in r["flags"]))
    print("  Rows with flags to confirm: %d" % sum(1 for r in rows if "confirm" in r["flags"]
                                                  or "corrected" in r["flags"] or "recovered" in r["flags"]))


if __name__ == "__main__":
    main()
