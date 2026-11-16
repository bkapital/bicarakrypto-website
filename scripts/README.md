# MP crypto-stance data pipeline

Collects public, sourced evidence of how Dewan Rakyat MPs (15th Parliament) engage with
crypto, blockchain and digital assets. Each stage has its own script and can be rerun.
Downloads are cached, so a rerun makes no new requests for pages it already has.

## Setup (once)

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Run every script from the project root with `.venv/bin/python scripts/<script>.py`.

## A note on TLS

parlimen.gov.my does not send its intermediate certificate, so ordinary clients reject it.
`common.py` fetches that intermediate from the issuer (Sectigo) and **still verifies the
full chain** against certifi's trusted roots. Verification is never turned off.

## Polite crawling

- About 2.5 s between live requests (`DELAY_SECONDS` in `common.py`)
- Clear User-Agent (`USER_AGENT` in `common.py`)
- Every fetched page/PDF is cached under `data/cache/` (and `data/hansard_pdfs/`), so stages are resumable

## Stages

| Stage | Script | Reads | Writes |
|---|---|---|---|
| 1. Clean MP list | `stage1_clean_mps.py` | `data/mp_emails.csv` + parlimen.gov.my profiles | `data/mps.csv` |
| 2. Roles & committees | `stage2_roles_committees.py` | `data/mps.csv` + istiadat.gov.my Cabinet PDFs + parlimen.gov.my committee pages | `data/mps.csv` (role, role_title, committees), `data/cabinet.csv`, `data/committees.csv` |
| 3. Hansard | `stage3_hansard.py` | Hansard portal transcripts + parlimen.gov.my PDFs, `mps.csv`, `cabinet.csv` | `data/evidence.csv`, `data/hansard_pdfs/` |
| 4. News | `stage4_news.py` | `data/press_hits.csv` (search results) + article page metadata | `data/evidence.csv` (type `press`), `data/stage4_queries.csv` |
| 5. Social checklist | `stage5_social_checklist.py` | `data/mps.csv` (accounts from parlimen.gov.my profiles) | `data/social_checklist.csv` |
| 6. Summary | `stage6_summary.py` | all of the above | `data/summary_report.txt`, `data/summary_per_mp.csv`, `data/survey.csv`, `data/corrections.csv` |

**Full rerun, in order:** Stage 1 → 2 → 3 (`--all`) → 4 (`merge`) → 5 → 6. Reruns only fetch what is
new or changed (new sittings, drafts that became final). Hand-entered fields are kept:
`stance`, `mentions_rakyat_benefit`, the survey answers, the checklist columns, and corrections.

### Stage 1: `stage1_clean_mps.py`

```bash
.venv/bin/python scripts/stage1_clean_mps.py [--input data/mp_emails.csv]
```

- Uses each MP's parlimen.gov.my profile as the source of truth for name, seat code,
  constituency, state, party, email and social media.
- Splits titles (YB, Dato' Seri, Dr., ...) into `honorific`; `name` is the plain name.
- `coalition` comes from the profile's "Parti" field, which usually shows the **current
  coalition** (PH, PN, BN, GPS, GRS).
- `party` comes from election results: the Malaysian Election Corpus (MECo, CC0 licence,
  github.com/Thevesh/paper-meco-results, built from SPR results). For each seat it uses the
  latest election from GE-15 onwards, including by-elections. `party_source` records which one.
  This is the party the MP **was elected under**. Party switches since then are not captured.
- Party is only filled if the election winner's name matches the profile name. Spelling
  variants (Abd/Abdul, Haji, nicknames) are accepted but flagged `name_variant_matched`.
  Real mismatches are flagged `name_mismatch_with_election_winner` and party is left blank.
- Excludes the Speaker and the Dewan Rakyat Secretary (not constituency MPs).
- Seats missing from the member list are looked up through unlinked profile ids and
  flagged `not_linked_from_member_list`. Seats with no profile at all (P.100, P.104, P.105,
  P.118 as of Nov 2026) get name/party/state from the election results, flagged
  `NO_PROFILE_ON_PARLIMEN_SITE`. Check that these MPs are still current.
- `role` and `committees` are left blank for Stage 2.
- **Manual corrections** go in `data/manual_overrides.csv` (`constituency_code, field, value,
  note, source, date`) and are applied last, on every rerun. `field` is any mps.csv column, or
  `clear_flags` to remove flags starting with `value`. Each one is recorded in the row's `notes`.
  `party` is the current party and `party_at_election` is the party the MP was elected under.
- **`status`** is `sitting`, or set by a manual override (e.g. `resigned; seat vacant until GE16`).
  For MPs who are no longer sitting:
  - Their name stays on the seat, so evidence from their time as an MP remains attributed to them.
  - Stage 2 sets their `role` to `former MP`.
  - Stage 6 leaves them out of the survey and the sitting-MP counts.
  - Stage 5 flags them.

  As of Nov 2026, P.100 Pandan, P.104 Subang, P.105 Petaling Jaya and P.118 Setiawangsa are vacant (their MPs resigned).

Columns beyond the brief: `honorific`, `social_media_raw` (profile text, often a page name,
not a link), `email`, `phone`, `profile_id`, `flags`.

### Stage 2: `stage2_roles_committees.py`

```bash
.venv/bin/python scripts/stage2_roles_committees.py
```

**Run after Stage 1.** Stage 1 rewrites `mps.csv`. Stage 2 rebuilds `role`, `role_title`
and `committees` from scratch each time, so it is safe to rerun.

- **Cabinet:** uses the newest "Jemaah Menteri" and "Timbalan Menteri" PDFs listed on
  istiadat.gov.my/protokol-persekutuan (Protocol Division, JPM). A new list is picked up
  automatically when it is published. The PDFs use two columns: name on the left, post on the right.
- `role` is `minister` (including PM and DPMs), `deputy minister` or `backbencher`.
  `role_title` holds the exact post(s), e.g. `Perdana Menteri; Menteri Kewangan`.
- Senators in the Cabinet are not MPs, so they appear in `cabinet.csv` only
  (`match = senator(not_an_MP)`). This matters for Stage 3: when "Menteri Kewangan II" speaks
  in the Dewan Rakyat, it is a senator, not an MP.
- `cabinet.csv` is the **current** Cabinet only. Hansard from earlier periods needs to know who
  held each post on that date (see Stage 3).
- **Committees:** 4 standing committees, the PAC (`/pac`) and the 10 select committees (JKPK, `/jkdr`).
  Members are matched by **constituency** shown on the page, not by name. `committees.csv` keeps
  the page's own name and seat for checking.
- Coalition labels on committee pages can be out of date (e.g. UPKO shown as [PH]), so only
  membership is taken from them.

### Stage 3: `stage3_hansard.py`

```bash
.venv/bin/python scripts/stage3_hansard.py --dates 2025-11-03,2026-07-08   # specific sittings
.venv/bin/python scripts/stage3_hansard.py --all                          # all sittings since 2022-12-19
.venv/bin/python scripts/stage3_hansard.py --all --since 2026-10-01       # only recent sittings
.venv/bin/python scripts/stage3_hansard.py --all --scan                   # count hits only, no PDFs
```

**Run after Stages 1–2.** It is resumable: transcripts and PDFs are cached, so a rerun only fetches new sittings.

Sources:
- **Sitting list:** `hansard.parlimen.gov.my/katalog/dewan-rakyat` (refreshed once a day).
- **Structured transcript:** `hansard.parlimen.gov.my/hansard/dewan-rakyat/YYYY-MM-DD`. Gives the
  speaker label, section heading and text, and is used to find keywords and attribute them.
- **Official PDF:** `www.parlimen.gov.my/files/hindex/pdf/DR-DDMMYYYY.pdf`, saved to `data/hansard_pdfs/`.
  Every excerpt is located in the PDF text to get the page and confirm it is verbatim.

How rows are built:
- **One row per paragraph** containing a keyword. Excerpts over 80 words are trimmed to 80 words around
  the first keyword and marked with `...`. Italics markers from the transcript (`*blockchain*`) are removed.
- **Attribution,** in order:
  1. `Name [Constituency]` maps to the seat. If the name differs from the current MP, it is flagged (by-elections).
  2. `Menteri X [Name]` is matched by name, so it maps to the person, not whoever holds the post today.
  3. The portal's `author_id`, learned from labels that include a seat.
  4. The name alone.
  5. Cabinet senators are noted as "not an MP". Anything else is `UNMATCHED`.
- **The chair** (Yang di-Pertua, Timbalan Yang di-Pertua, Pengerusi) is skipped as presiding, not taking a position.
- **Tabled oral questions** ("5. Name [Seat] minta Menteri X menyatakan...") are attributed to the asking MP
  and noted `tabled oral question`.
- **`type`:** `parliamentary_question` for oral question time, otherwise `speech`. `notes` adds
  "oral answer; speaking as <office>" using the office **as printed that day**.
- **`link`** is `PDF#page=N`. `pdf_page` is the PDF page index and `hansard_page_printed` is the page
  number printed on the Hansard (use this one in citations).
- **Draft sittings** (`is_final` false on the portal) say "(draft)" in `source_name`. When the final version
  is published, the next run downloads it again and rebuilds those rows.
- **`topic`** is derived from the keywords (investment scam / CBDC / blockchain / crypto) and is for filtering only.
- **Reruns** replace Hansard rows (`HDR-...`) for the sittings processed, but keep any `stance` and
  `mentions_rakyat_benefit` you have entered (matched by `evidence_id`).

Division votes (`type = vote`):
- Only divisions listed in `VOTES_TO_RECORD` at the top of `stage3_hansard.py` are recorded. Each one
  is chosen by hand, because whether a bill "mentions digital assets" is a judgment call.
- Currently there is one: **Supply Bill 2026 (4 Nov 2025)**, recorded with the note "GENERAL BUDGET VOTE,
  not a crypto-specific vote". It is the only recorded division in the term whose debate contained a keyword.
  The Online Safety Bill 2024 division had no keywords in its debate, so it is not recorded.
- One row per MP from the "Ahli-Ahli Yang Bersetuju / Tidak Bersetuju / Tidak Hadir" lists (For / Against /
  Absent), matched by the seat in brackets. Pages are searched only after the division is ordered, to avoid
  the attendance list at the front of the PDF.

Known limits:
- "Kriptologi" (cryptology) is deliberately not matched.
- **Written answers (Jawapan Bukan Lisan) are not included.** parlimen.gov.my only offers them through
  a search page. An automated search returned a server error, and a manual search for "kripto" and related
  terms (Nov 2026) returned no results. Treat this as a known gap on the dashboard. If written answers
  become available, add them as `type = written_answer` rows.

### Stage 4: `stage4_news.py`

```bash
.venv/bin/python scripts/stage4_news.py queries [--all]   # list the searches to run
.venv/bin/python scripts/stage4_news.py merge             # verify links in press_hits.csv, merge
```

The web searches themselves are **not automated**. No search API is configured, so they were
run with the assistant's web search tool (Nov 2026). Rerun them the same way, or by hand.

1. **`queries`** writes `data/stage4_queries.csv` with `"<name> kripto"` and `"<name> crypto"` for each MP.
   By default it covers only MPs who appear in Hansard (priority 1). `--all` covers all 222.
2. **Searching.** Run each query, limited to Malaysian outlets. Malay-language outlets were used for "kripto"
   (Berita Harian, Sinar Harian, Utusan, Harian Metro, Bernama, Kosmo, Harakah, Malaysia Gazette)
   and English-language outlets for "crypto" (The Star, NST, FMT, Malay Mail, Bernama, The Sun,
   The Edge, Borneo Post, Dayak Daily, Daily Express). An unrestricted search mostly returned
   irrelevant results. For lower-profile MPs, one combined search across both outlet groups was used.
3. **Recording.** Add relevant results to `data/press_hits.csv`. Include a result only if the headline or
   snippet shows **that MP** speaking or acting on crypto, digital assets, blockchain or investment scams.
   Write `summary` in your own words; never copy article text. Not recorded:
   - general crime reports
   - articles where the MP only appears in a sidebar
   - articles where the MP was impersonated by scammers
   - the same story repeated in another language by the same outlet
   - "kriptologi" / cryptography stories
4. **`merge`** loads each link once. Only metadata is read (outlet, headline, publish date), and no article
   text is stored. Paywalled outlets (The Edge, Malaysiakini, ...) are not fetched and are flagged. A headline
   from the page replaces the search-result headline. Flags:
   - a generic page title (possible redirect)
   - a missing date (the date is taken from the URL when it is there)
   - an article from before 19 Dec 2022

`press` rows have no `excerpt` (articles are not quoted). The headline and summary are in `notes`.

### Stage 5: `stage5_social_checklist.py`

```bash
.venv/bin/python scripts/stage5_social_checklist.py
```

**Nothing is fetched from Facebook or X**, because both prohibit scraping. The script only builds links for checking by hand.

- **Accounts** come from the "Media Sosial" field of each MP's parlimen.gov.my profile (Stage 1).
  Tracking parameters are removed and obvious typos fixed (`profile.pnp` becomes `profile.php`, and
  `facebook.com./` becomes `facebook.com/`); each fix is noted in `flags`.
  A handle written without a link (e.g. "Twitter : mohdsuhaimi77") is used, but flagged "confirm".
- **Search links per MP:**
  - `x_search`: X advanced search, `from:<handle> (kripto OR crypto OR ...)` with all brief keywords, newest first
  - `fb_search_<keyword>`: Facebook post search for "<MP's everyday name or listed page name> <keyword>"
  - `google_fb_search` / `google_x_search`: Google `site:` search of the account. It is often better
    than Facebook's own search for older posts.
- **Columns to fill in:** `checked_on`, `checked_by`, `found` (Y/N), `post_links`, `notes`.
  Rerunning the script **keeps** these.
- **Moving findings into evidence:** add a row to `evidence.csv` by hand with `type = social`, the post link,
  the post date, and a one-line summary in `notes`. Do not paste the whole post.

### Stage 6: `stage6_summary.py`

```bash
.venv/bin/python scripts/stage6_summary.py
```

- Prints the report and saves it to `data/summary_report.txt`. It covers:
  - MPs by role
  - evidence rows by type
  - evidence per MP (top 20 in the report, all MPs in `summary_per_mp.csv`)
  - MPs with zero evidence
  - rows not matched to an MP
  - checks against the brief's rules (link present, excerpt ≤ ~80 words and only from Hansard,
    valid seat codes, unique IDs, dates present)
  - flags awaiting manual review
  - known gaps
- The Budget 2026 vote is left out of the per-MP counts, because every MP has one.
- Creates `survey.csv` (one row per MP with seat, name and email; responses empty) and
  `corrections.csv` (headers only) the first time. After that it only adds missing MPs and never overwrites entries.

## Suggested stances (`data/stance_suggestions.csv`)

One row per non-vote evidence row: `evidence_id, mp_constituency_code, suggested_stance, reason,
suggested_by, suggested_on`. These are **AI suggestions** (Claude, Nov 2026) made by reading each excerpt
or headline. They are **not** written into `evidence.csv`'s `stance` column, which stays yours.

| Label | Meaning |
|---|---|
| supportive | Favours crypto, blockchain or digital assets, or wants more adoption or an enabling framework |
| cautious | Open to it, but stresses risk, consumer protection or tight regulation |
| opposed | Wants it restricted or banned, or treats crypto itself as harmful |
| neutral | Figures, procedure, passing mentions, or enforcement against scams or illegal mining with no view on crypto |
| off-topic | "aset digital" / "crypto" means something else (government IT, cryptography); leave out of counts |

When you score a row in `evidence.csv` → `stance`, your value replaces the suggestion wherever both exist.
New evidence rows from a rerun have no suggestion until someone adds one.

## Manual-only fields

`stance` and `mentions_rakyat_benefit` in `evidence.csv` are never filled by scripts.
They are scored by hand using the codebook.
