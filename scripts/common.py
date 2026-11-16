"""Shared helpers for the MP tracker pipeline: paths, polite verified fetching, CSV I/O."""
import csv
import html
import os
import re
import ssl
import time
import urllib.request

import certifi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
CACHE = os.path.join(DATA, "cache")

PARLIMEN = "https://www.parlimen.gov.my/"
USER_AGENT = "BicaraKrypto-MP-Tracker/0.1 (public-interest policy research; polite crawler)"
DELAY_SECONDS = 2.5

# parlimen.gov.my does not send its intermediate certificate. We fetch it from the
# issuer (Sectigo) and still validate the full chain against certifi's trusted roots.
_INTERMEDIATES = ["http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt"]
_ctx = None
_last_request = 0.0


def ssl_context():
    global _ctx
    if _ctx is None:
        _ctx = ssl.create_default_context(cafile=certifi.where())
        for url in _INTERMEDIATES:
            der = urllib.request.urlopen(url, timeout=30).read()
            _ctx.load_verify_locations(cadata=ssl.DER_cert_to_PEM_cert(der))
    return _ctx


def fetch(url, cache_path=None, binary=False):
    """GET `url`, waiting DELAY_SECONDS between live requests. Uses/stores a cache file if given."""
    global _last_request
    if cache_path and os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, "rb") as f:
            data = f.read()
        return data if binary else data.decode("utf-8", errors="replace")
    wait = DELAY_SECONDS - (time.time() - _last_request)
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, context=ssl_context(), timeout=90) as r:
            data = r.read()
    finally:
        _last_request = time.time()
    if cache_path:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        tmp = cache_path + ".part"
        with open(tmp, "wb") as f:
            f.write(data)
        os.replace(tmp, cache_path)  # atomic: no half-written cache files on interrupt
    return data if binary else data.decode("utf-8", errors="replace")


def clean_text(fragment):
    fragment = re.sub(r"<br\s*/?>", "\n", fragment, flags=re.I)
    text = html.unescape(re.sub(r"<[^>]+>", " ", fragment))
    return re.sub(r"[ \t\r\f\v\xa0]+", " ", text).strip()


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_csv(path, rows, fieldnames):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def seat_code(raw):
    """'P065' / 'P.065' / 'p 65' -> 'P.065'; '' if not a seat code."""
    m = re.fullmatch(r"\s*P\.?\s*(\d{1,3})\s*", raw or "", flags=re.I)
    return "P.%03d" % int(m.group(1)) if m else ""
