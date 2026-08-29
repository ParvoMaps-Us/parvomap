# ParvoMaps — Weekly Canine Disease Scan Playbook

A repeatable recipe for finding new, real, **mappable** dog-disease cases to add to
the map. Run it ~once a week. Hand this file (or just say "run the weekly disease
scan") to the assistant and it knows what to do.

---

## What counts as a case worth adding

A case goes on the map only if **all** of these are true:

1. **Real + sourced** — a specific news article or official health/shelter/agency
   notice. No rumors, no fabrication.
2. **Dog-RELEVANT** — a confirmed case in *any* species counts as long as a dog
   could realistically catch it there. **Amended 2026-08-03 (owner's call):** the
   map's job is prevention, so a rabid skunk, raccoon, fox, or bat is a valid pin
   even when no dog was infected. A dog owner seeing "rabies confirmed here" keeps
   their dog leashed and their shots current, and that pin is exactly the warning
   we exist to give. Same logic for algae blooms: an advisory on a named lake is a
   pin, no dog death required.
   Still excluded: species-locked cases with no dog pathway (a cattle-only
   screwworm detection, a human-only illness) and pure risk *forecasts* (CAPC
   models, "cases are up statewide") — those are predictions, not incidents.
3. **Location-specific** — at least a city or county we can geocode. A statewide
   "cases are up" advisory with no place is NOT mappable.
4. **A disease we track** — see `lib/diseases.ts` (`DISEASE_MAP`). Currently:
   parvo, distemper, kennel, leptospira, influenza, giardia, ringworm, brucella,
   screwworm, rabies, fleas, mange, strepzoo, corona (canine coronavirus / CCoV),
   cyano (blue-green algae), lyme, rmsf, anaplasma, ehrlichia, tickspot.
   If a found disease isn't in the map yet, it can be added — the recipe is
   6 files: `lib/diseases.ts` (the entry), `components/Ticker.tsx` (display
   name), `components/Map.tsx` (pin colour), `components/FilterBar.tsx` and
   `components/ReportForm.tsx` (the picker rows), and `app/globals.css`
   (`--d-<key>` variable + the `.pin[data-disease=...]` rule).

   **Note on `corona`:** this is canine enteric coronavirus (CCoV), a DOG gut
   virus. It has nothing to do with COVID-19. Do not map human COVID stories,
   and do not map a "dog tested positive for SARS-CoV-2" story under this key.
   CCoV matters mainly as a parvo co-infection, so it surfaces in the same
   shelter and kennel outbreak coverage — check parvo articles for it.

Recency: anything within a disease's pin TTL shows as **active**; older shows as
**historical** (still fine to add, just dimmed). TTLs: cyano 30d, parvo 365d,
rabies 180d, screwworm 365d, tickspot 30d, everything else 90d
(source of truth: `pinTtlDays` in `lib/diseases.ts` — read it, don't trust
this list if the two disagree).

### NEVER seed from a search snippet. Open the source first.

**This is the single biggest failure mode in the whole scan.** On 2026-08-14 a
40-state sweep produced roughly 25 real-looking candidates that turned out to be
the WRONG YEAR. Every one of them was caught only by fetching the article:

| Looked like | Actually |
|---|---|
| Delanco NJ, dog killed a rabid raccoon, "Aug 12" | Aug 2025 |
| Happy Tails Rochester NY, six dogs dead of parvo | Feb 2025 |
| York County SC, rabid skunks, two dogs exposed | Oct 2025 |
| Devils Lake MI algae bloom | Aug 2024 |
| Midland TX distemper outbreak | Mar 2024 |
| Kansas City lepto, two dogs euthanized | Sep 2024 |
| Las Vegas distemper at The Animal Foundation | Feb 2025 |
| Soldan Dog Park MI algae | Aug 2025 |
| Big Horn County MT rabid puppy | 2022 |
| Houston County AL rabid bat | Apr 2025 |

Why it happens, and why it will happen again:

1. Search snippets print "August 21" or "January 27" with **no year**, and the
   assistant fills in the current one.
2. Shelter outbreaks **recur annually at the same facilities** (Weber County UT,
   Memphis Animal Services, UPAWS). A 2025 story about the same shelter reads
   exactly like a 2026 one.
3. A URL containing `/2026/` proves when the page was *published or updated*, not
   when the incident happened. Verify the date **in the body text**.

**The control:** every case must have its date read out of the fetched article
before it is seeded. A snippet is a lead, never a source. If the page 403s, is
paywalled, or returns only navigation, the case does not get seeded — find
another outlet or drop it (this is the same rule as control #4 in the back-test
log below, and it bites often: Bangor Daily News, Toledo Blade, and several
Yahoo mirrors all blocked automated fetching during the 2026-08-14 sweep).

### Geocode traps: a lake is not in the county the story names

Verify coordinates land in the stated county (see the checklist), but note the
specific failure that a state bounding-box check will never catch:

**Large waterbodies span counties, and the centroid usually sits in the wrong
one.** On 2026-08-14 the Lake Lanier bloom was reported at the Six Mile
Embayment in **Hall** County, but geocoding "Lake Lanier" returns a centroid in
**Forsyth** County. Pin the *named feature in the story* (the embayment, the
beach, the boat launch), not the lake as a whole, and re-run the county check on
the point actually being written.

Same logic for county-level cases with no town named: pin the **county seat**
and say so in `locationDetail` ("exact location not disclosed"), rather than
guessing at a neighbourhood.

### Age gate: check retention BEFORE seeding, not after

A pin is retained for **its TTL + 60 days of historical grace**
(`HISTORICAL_GRACE_DAYS` in `lib/retention.ts`). Past that, the retention job
deletes it. So an age check is required per case, using its OWN disease's TTL:

| Disease | TTL | Max age worth seeding (TTL + 60) |
|---|---|---|
| cyano, tickspot | 30d | **90d** |
| most (distemper, kennel, lepto, strepzoo, giardia, mange, flu, ticks) | 90d | **150d** |
| rabies | 180d | **240d** |
| parvo, screwworm | 365d | **425d** |

- Older than TTL but inside the grace window: fine to seed, renders dimmed under
  the "Historical" toggle.
- **Older than TTL + 60: do NOT seed.** It is dead on arrival, gets auto-deleted,
  and in the meantime is stale data claiming to be current.
- Note the trap: a "within the last 12 months" search rule is far too loose for
  a 90-day disease. Twelve months is only correct for parvo and screwworm.

**This exact bug happened 2026-08-07:** the batch included a Miami strep zoo case
397 days old (strep zoo retention is 150 days) plus 10 others past retention;
caught on review and removed. Always run the age gate over the whole batch before
seeding, and report anything dropped for age.

---

## The core search set (run all of these each week)

Run each query with a web search, current month/year included. These are the
ones that reliably surface location-specific outbreaks:

```
dog parvo outbreak 2026 shelter city confirmed cases
canine distemper outbreak 2026 dogs city county warning
dog leptospirosis cases 2026 city veterinary warning outbreak
blue-green algae dog death lake warning <MONTH> 2026
canine influenza H3N2 outbreak 2026 dogs city boarding daycare
dog kennel cough outbreak 2026 boarding daycare city
canine coronavirus CCoV outbreak 2026 dogs shelter city diarrhea
new world screwworm dog 2026 USDA confirmed
dog rabies case 2026 county confirmed exposure
tick disease dog lyme anaplasma ehrlichia 2026 county warning
pet food recall <brand> — (handled separately by /recalls, FDA feed)
```

Rotate the `<MONTH>` and bump the year as time passes. Add a discovery query if a
new threat is in the news (e.g. a novel respiratory illness).

**Run each disease as its OWN query. Do not bundle.** A combined query like
"dog parvo rabies distemper 2026 Ohio" returns whatever dominates that state's
news, which is almost always rabies, and the other diseases silently vanish.
The 2026-08-14 sweep produced 9 rabies pins and 0 of anything else until the
bundling was stopped; running lepto as its own query immediately surfaced the
Spokane County case, which doubled the map's entire leptospirosis coverage.

**Expect the mix to be lopsided, and know why.** The map's disease ratios track
*what gets publicly announced with a location*, not what dogs actually catch:

- **Rabies** — county health departments publish formal alerts with a date and a
  street. Florida issues them per county. Highly mappable.
- **Cyano** — beach closures name the lake. Highly mappable.
- **Parvo / distemper** — local news when a shelter closes. Episodic but real.
- **Lepto, giardia, mange, kennel cough** — usually advisories to veterinarians,
  with no address attached. Rarely mappable.
- **Tick-borne (lyme, anaplasma, ehrlichia, rmsf)** — almost nothing but CAPC
  forecasts, which criterion 2 excludes as predictions rather than incidents.

That last group is the strongest argument for the clinic reporting channel: a
vet reporting lepto directly is the only realistic way those diseases ever get
represented on the map.

### Do NOT re-run these four weekly — swept 2026-08-14, zero new pins

A full 50-state sweep of the four zero-pin diseases that looked most promising
(**influenza, brucella, strepzoo, corona**) produced **exactly one** qualifying
case, and it was already on the map. Findings, so this is not re-derived:

| Disease | What exists | Why nothing was seeded |
|---|---|---|
| **influenza** | Real 2026 story: H3N2 vaccine shortage, daycare super-spreaders, LA County guidance 3/4/26 | 2026 coverage is national trend pieces with no facility or city. Every LOCATED outbreak was old: Tampa Bay 6/2024, Wake County NC 10/2023 |
| **brucella** | MN Board of Animal Health warning 7/9/2026, several active cases from imported SD dogs | No county, city, or facility named — fails criterion 3. Iowa Marion County case is 5/2019 |
| **strepzoo** | Four real 2026 US shelter outbreaks | Retention killed three: Sacramento 1/30/26 (196d), Multnomah 2/13/26 (182d) vs a 150d limit. Riverside is 1/2023, San Diego 11/2023, Stanislaus 7/2025. Stockton 5/21/26 was the only live one and was already pinned |
| **corona** | Academic papers only (Portugal, Ecuador, Kazakhstan) | No US incident coverage exists to find |

**The real reason these stay at zero is announcement shape, not rarity.**
Rabies gets a county press release with a street address because it is a public
health reporting requirement. Strep zoo only makes news when a shelter closes
its doors. Brucellosis surfaces as state import policy, not a local quarantine
notice. Influenza in 2026 is a national supply-chain story.

Note the compounding trap: **strepzoo's 90d TTL means a shelter outbreak is
past retention roughly 5 months after it happens.** Shelter-closure stories are
findable but age out fast, so they are only seedable if caught within the
quarter.

**Cadence:** keep **strepzoo** in the monthly rotation (shelter closures do get
covered, they just expire quickly). Check **influenza, brucella, corona** only
quarterly, or when something breaks nationally. Do not spend a weekly sweep on
them.

Good source domains to trust: local TV/news (abc/cbs/fox/nbc affiliates),
`*.gov` health departments, county animal-care pages, university vet schools
(UC Davis, Texas A&M), AVMA, shelters/humane societies, USDA APHIS, CDC.

---

## Per-state / regional scoping (e.g. "scan these 5 states")

The search is web-based, so **scoping = adding the place name to each query.**

When you want a specific set of states, say e.g.:

> "Run the weekly disease scan for **Texas, Florida, Ohio, Georgia, Arizona**."

The assistant then runs the core query set **once per state**, substituting the
state name into each query, e.g.:

```
dog parvo outbreak 2026 shelter Texas confirmed cases
canine distemper outbreak 2026 dogs Texas warning
dog leptospirosis 2026 Texas veterinary warning
blue-green algae dog death lake Texas 2026
...repeat for Florida, Ohio, Georgia, Arizona
```

Scoping options you can ask for:
- **By state list:** "scan TX, FL, OH" → core queries × each state.
- **By region:** "scan the Southwest" / "scan the Gulf Coast" → expands to the
  states in that region, then per-state.
- **By count:** "scan the 5 states with the most dogs / biggest metros" → the
  assistant picks (CA, TX, FL, NY, PA…) and scopes to those.
- **Nationwide (default):** no state given → the generic core set above (broad
  but not exhaustive — it can't truly crawl all 50 states, so per-state passes
  catch more).
- **Targeted single state:** "deep scan Florida" → run more query variants
  (add metro names: Miami, Tampa, Orlando, Jacksonville) for fuller coverage.

Practical tip: a focused 3–5 state pass each week, rotating which states, gives
better coverage over a month than one thin nationwide pass.

---

## How a found case gets added to the map

For each qualifying case the assistant:
1. Gets the exact place → geocodes to lat/lng (county-level cases pin the county
   seat) + ZIP + county + state.
2. Builds a verified report record and writes it to the prod Redis
   `reports:verified` sorted set (same method used for all seeded cases).
3. Fields: `disease`, `zip`, `state`, `city`, `county`, `lat`, `lng`,
   `timestamp` (the incident/article date), `verified: true`, `confidence: 1`,
   `source` (vet-diagnosed / positive-test / other), `reporterType: 'news'`,
   `sourceUrl` (the article), `kind: 'disease'`. Place-based hazards (cyano,
   tickspot) also set `locationDetail` (the lake/park/spot).

   **`subject` is PER CASE, never per batch.** Set it from what actually tested
   positive: `'dog'` for a dog case, `'wildlife'` for a rabid raccoon/bat/fox/
   skunk/beaver or distemper confirmed in raccoons, `'other'` for a non-dog
   domestic animal (e.g. a rabid unvaccinated cat). It drives the popup's
   "Found in:" row and its advisory, so a wildlife case stamped `'dog'` puts
   "Found in: A dog" on a raccoon pin, which is a lie on the map.
   **This exact bug happened 2026-08-07:** an 82-pin batch was seeded with a
   blanket `subject: 'dog'`, mislabeling 24 wildlife/other cases; caught on
   review and corrected. Algae and tickspot pins derive their label from the
   disease category, so they are immune either way.
4. Uses a stable, human-readable id like `PARVO-BALTIMORE-2026-06` so it can be
   found and removed later (`zrem` the member whose JSON `id` matches).

**Note:** `.env.local` `UPSTASH_REDIS_REST_*` must point at the LIVE prod DB
**`live-katydid-108013`** (= `parvo-redis` via Vercel `KV_*`). `lib/redis.ts` prefers
`UPSTASH_*` over `KV_*`, so a stale `UPSTASH_*` silently sends seeds to a dead DB.
**This exact bug happened:** it pointed at the retired `alive-wombat-147981` ("wombat")
and weeks of seeds went nowhere the site could read. Fixed 2026-07-27 — repointed to
katydid; wombat to be deleted. **Guard before every seed:** confirm the target with
`curl -s $UPSTASH_REDIS_REST_URL/zcard/reports:verified -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"`
and sanity-check the count against the live map (`www.parvomaps.us/api/reports`). Each
seeded case id is recorded in the disease-tracker memory note.

---

## Weekly checklist

- [ ] Decide scope (nationwide, or N states — rotate them).
- [ ] Run the core query set (× each state if scoped).
- [ ] Filter to cases meeting the 4 criteria above; drop livestock-only / no-location.
- [ ] **Fetch every candidate's source and read the date out of the body.** No
      snippet-only seeding, ever. Drop anything whose source won't load.
- [ ] De-dupe against what's already on the map. Expect ~2/3 of per-state finds
      to already be pinned from nationwide passes — that is the scan working,
      not wasted effort. The remaining third is small-town material (a town
      notice in Raymond ME, a county newsflash in Arvada CO) that never ranks
      nationally, and it is the whole reason per-state passes exist.
- [ ] **Age gate:** drop anything older than its disease's TTL + 60d (table above).
- [ ] **Set `subject` per case** (dog / wildlife / other) from what tested positive.
- [ ] **Verify coordinates land in the stated county** before writing. Free check:
      `geocoding.geo.census.gov/geocoder/geographies/coordinates?x=<lng>&y=<lat>`
      `&benchmark=2020&vintage=2020&layers=Counties&format=json`.
      City-name geocoding silently returns the wrong place for small towns —
      on 2026-08-07 it put Deep Run NC in Baltimore, Oxbow OR in Portland, and
      Michigan Center MI 200 miles north. A state bounding-box check is NOT
      enough to catch those; only the county check is.
- [ ] Confirm the batch, then seed.
- [ ] **Report the batch back (required, every time).** Right after seeding, give
      Izic a short breakdown, not just a pin count:
      1. Totals by disease, and the pin count before → after.
      2. Per-state line: what each state contributed, and which states came back
         empty **with the reason** (duplicate, wildlife-only under the old rule,
         no location, too stale).
      3. The 3-5 headline cases in one sentence each — the ones with a real story
         (first rabid dog since 1994, 82 dogs euthanized, 10 puppies dead).
      4. Anything DROPPED and why (dead source URL, unverifiable date).
      Keep it short. This is the record of what changed and the raw material for
      blog posts and social content, so the interesting cases must surface.
- [ ] (Optional) note any new disease not yet in `DISEASE_MAP` to add later.

---

## Back-test log

### 2026-08-09 — subject audit of wildlife-common diseases

Pins seeded before the per-case subject control existed all defaulted to
`subject: 'dog'`. Audited the 20 highest-risk of them: every non-hazard pin whose
disease is commonly a WILDLIFE or LIVESTOCK disease (rabies, distemper, screwworm).
Each was re-read against its own source article.

**8 of 20 were wrong. A 40% error rate in that subset.**

Fixed:
- RABIES-CACHE-2026-06 (Logan UT) dog -> wildlife. A bat.
- RABIES-WEBER-2026-07 (Ogden UT) dog -> wildlife. A bat.
- RABIES-LYONS-2026-06 (NY) dog -> wildlife. A raccoon.
- RABIES-GALEN-2026-06 (NY) dog -> other. A cat.
- DISTEMPER-PIMA-2026-06 source swapped to reachable KOLD coverage (old URL 403s).

Removed:
- RABIES-PAULDING-2026-06. The case was RETRACTED. Follow-up testing confirmed the
  shelter dog did not have rabies. We were displaying a retracted case as confirmed.
- DISTEMPER-DALLAS-2026-06. Sourced to an evergreen SPCA info page whose named
  outbreak was 2022. Neither the subject nor the 2026 date was supported.

Left alone by owner decision: NWS-PECOS-2026-06 (screwworm).

**Lessons, now controls:**
1. **A rabies story about a bat is not a dog case.** Judge only what the article says
   tested POSITIVE. Exposure, biting, and proximity are not the case.
   Counter-example worth remembering: RABIES-CALAVERAS-2026-05 mentions a skunk, but
   the DOG was the confirmed positive. Read carefully in both directions.
2. **Check for retractions.** Read the whole article including updates appended later.
   A confirmed case can become an un-confirmed case a week after publication.
3. **An evergreen page is not a source for a dated case.** If the URL is a general
   info page, a dashboard, or a state landing page, it cannot support a specific
   animal on a specific date. Find a species-specific, dated article or drop the pin.
4. **The source URL must be reachable.** A 403 or a dead link means nobody can check
   the work, including us.

**Still unaudited:** ~58 non-hazard `subject: 'dog'` pins in diseases that genuinely
are canine (parvo, kennel cough, mange, giardia, lepto, strep zoo). Lower risk, since
the default is probably right, but never verified case by case.

---

## Seed log

### 2026-08-21 — 10-state low-coverage pass (383 → 388)
Scope: the ten states with the thinnest coverage (LA, MS, NV, OK, AR, IL, IA, WV, CT, NH),
18 pins between them at start. **5 seeded, 5 states empty.**

Seeded ids:
- `CYANO-HENDERSONLAKE-LA-2026-08` — Henderson Lake, St. Martin Parish, 8/20
- `RABIES-DEKALB-IL-2026-06` — rabid bat, Leland, DeKalb County, 6/18, wildlife
- `PARVO-BENTON-AR-2026-07` — Benton Animal Services, Saline County, 7/30, dog
- `RABIES-NORTHSTONINGTON-CT-2026-06` — rabid raccoon, New London County, 6/10, wildlife
- `CYANO-WASHOELAKE-NV-2026-07` — Washoe Lake State Park, Washoe County, 7/28

Dropped, with cause (all controls fired at least once):
- **Wrong year:** MS Tippah County rabid bat read as current in the snippet, was **May 2025**,
  472d against rabies' 240d ceiling. Caught only by fetching.
- **Age gate:** NV Lake Mead Government Wash (161d) and NV Lahontan Reservoir (102d), both
  against cyano's 90d ceiling.
- **Duplicate:** WV Fayette County shelter parvo was already `PARVO-FAYETTE-2026-06` at 0.0mi.
- **Marginal, judgment drop:** WV Parkersburg distemper 3/30 was 144d against a 150d limit.
  Legal to seed but would be auto-deleted within a week. Not worth the pin.
- **No location (criterion 3):** OK statewide parvo coverage named no facility or county.
- **Source would not load:** IL DuPage (empty body), IL Coles County (429), NV Lake Mohave (403).

**Two geocode errors the county check caught, and a state bounding box would not have:**
1. "Benton, Arkansas" resolved to **Benton County** in the northwest, ~200 miles from the
   Saline County city of the same name. Same class as Deep Run NC landing in Baltimore.
2. **Leland IL straddles the LaSalle/DeKalb county line.** First geocode put it in LaSalle.
   DeKalb County Health issued the release, so the pin was moved to a Census-verified DeKalb
   point and `locationDetail` says so explicitly.

**Empty states and why:** MS (only a 2025 case), OK (no location named), IA (systematic DNR
beach postings, the two microcystin-exceeding beaches were never named), NH (program pages
only, no located incident), WV (its one live case was already pinned).

**Note for the next pass:** actual seeded records do NOT carry `county`, `confidence`, `source`,
or `kind` fields despite the prose above describing them. The live shape is: id, disease, zip,
state, city, lat, lng, timestamp (ms), verified, locationDetail, sourceUrl, reporterType,
subject. Sorted-set score == timestamp. Seeded news cases use 12:00 UTC on the incident date.

### 2026-08-28 — 10-state deep scan (388 → 427)
Scope: SD, MS, NV, OK, LA, IA, WV, ME, WY, CT. **39 seeded, 2 states empty (OK, LA).**

Headliners: WY DEQ's WyoHCBs storymap is a goldmine — 22 current named-waterbody
bloom advisories seeded in one pass (Boysen and Hawk Springs carry TOXIN advisories;
Beck Lake and McKenzie Lake sample at dog parks). IA HHS epi update gave Iowa's first
rabid cow since 2018 (Lyon Co) and first rabid skunk south of I-80 since 2012 (Decatur
Co). NV seeded 3 county rabid bats + 2 named Lake Mohave HAB sites. ME rabid fox at
Lisbon Falls verified via the everlit.audio full-text mirror after BDN blocked fetching.

Per state: WY 24 (22 cyano + Casper shelter parvo + Sheridan rabid bat), NV 5, ME 3,
IA 3, MS 1 (Hernando shelter parvo 10/2025), SD 1 (Wall Lake HAB), WV 1 (Ohio Co
shelter parvo 1/31), CT 1 (Granby raccoon 3/9).

Dropped highlights (controls fired everywhere):
- **Wrong year traps re-dodged:** Tippah MS bat (5/2025), Tulsa rabies (2/2025), OKC
  flu/strepzoo cluster (2023), Animal Foundation LV distemper (2/2025), ARL Des Moines
  parvo (5/2025), news3lv parvo (2018!).
- **Age gate:** Kanawha-Charleston distemper (162d vs 150), Parkersburg distemper (now
  past gate for good), Waterville ME fox (380d), 3 CT rabies from 2025, South Worland
  Pond (94d vs 90).
- **Duplicate ID collision caught pre-seed:** agent proposed CYANO-GRAYROCKS-2026-07;
  the existing cyano@Wheatland pin IS Grayrocks under that exact id. Always diff
  candidate ids against live ids, not just city names.
- **Lifted advisories dropped:** IA Marble Beach + Orleans (lifted 8/26), Lake DeSmet
  WY (lifted 8/21). Rule of thumb: a lifted advisory is a resolved hazard, don't seed.
- **Exposure is not a case:** Cara's House Ascension Parish LA distemper closure was
  precautionary, no positive.
- OK empty: every candidate failed on date, statewide-only, wrong state, or 404.
  LA empty: all four candidates were dupes/stale/exposure-only.

Note: NV county bats use the 7/23 NDA release date; locationDetail flags "identified
earlier in 2026, exact date not disclosed."

### 2026-08-28 — 10-state deep scan #2, Utah lead (427 → 447)
Scope: UT, AK, DE, HI, NH, AR, AL, IL, MI, MO. **20 seeded; DE, HI, NH empty.**

Headliners: **Alaska's first pin ever** (RABIES-BETHEL-AK-2026-02 — two rabid foxes,
one shot by Bethel PD after attacking a chained dog; Y-K Delta winter uptick, 13 foxes
region-wide). UT got 6: first rabid bat of Utah's 2026 (Washington Co) + 5 HABs from
the Utah County Health Dept advisory dated 8/27 incl a DANGER-level bloom at Lindon
Marina. Michigan's first rabies case of 2026 (Charlotte bat). Greene Co MO skunk bit a
dog. Per state: UT 6, AL 3, IL 3, MI 3, AR 2, MO 2, AK 1.

**Dedupe caught 4 exact-id overlaps** (nationwide passes had them): AL Auburn raccoon,
Tallassee fox, Andalusia rabid dog; IL Macomb (PARVO-MCDONOUGH-2025-11). Always pull
the target states' existing ids BEFORE trusting an agent's "new" list.

Dropped highlights:
- **Wrong-Delaware trap:** DE candidates were Delaware OHIO, Delaware Co PA, and
  Delaware Co NY. Namesake counties are a real failure mode for small states.
- **HI judgment drop:** Waianae lepto puppy sat exactly at the 150d ceiling — DOA.
- **NH blocked, again:** NHDES + NH Bulletin are Akamai-403 even with browser UA;
  three late-Aug cyano alerts unverifiable → correctly unseeded. NH needs a human
  browser or a different outlet to ever get pins.
- Wrong year re-dodged: Houston Co AL 2025 bat (a REAL 2026 Dothan bat was found
  instead — verify, don't just avoid, known traps), Detroit rabid dog (2021),
  St. Louis 19-dog parvo (2025), KC lepto (2024), Unalaska parvo (2016!).
- Age gate: Chicago rabid dog now 252d (gone for good), Fayetteville AR distemper
  157d, Jonesboro 152d — March distemper dies in August.

Housekeeping flagged: UT has 2 duplicate cyano pairs to remove (CYANO-MANTUA-2026-07
and CYANO-SALEMPOND-2026-07 duplicate their -UT- twins); removal was permission-blocked
this session, pending owner approval.

### 2026-08-29 — 10-state deep scan #3 (447 → 475)
Scope: MN, NJ, VT, WI, AZ, TN, MT, NM, ND, VA. **28 seeded; MN and TN 0 new (fully
covered by prior passes — ALL 4 TN candidates and both MN lakes were already pinned).**

Headliners: rabid bobcat attacked 3 people + 3 dogs near Prescott AZ before a German
shepherd killed it (RABIES-PRESCOTT-AZ-2026-05). Rabid cat attacked multiple people
in Fairfax Co VA. Rabid bull calf, Surry Co VA. Booth Lake WI: 9 human illness
reports, microcystin confirmed. VA's VDH street-level alerts gave 7 pins — best
per-state source found yet, worth a dedicated quarterly VDH pass.

Per state: ND 9 (NDDEQ advisory PDF is the official dated list — the allowed
exception — but 6 of its 15 waterbodies were already pinned), VA 7, MT 4 (all county
bats; all 5 MT cyano candidates were dups of July pins), WI 3, NJ 2, AZ 1, NM 1, VT 1.

Dedupe scale this pass: ~26 of 54 candidates were already pinned. Confirms the
playbook's ~2/3 expectation for well-covered states. Exact-id collisions again
(PARVO-GALLUP-NM-2025-10, RABIES-FARHILLS/CHERRYHILL NJ, WI Shawano) — id-level diff
against live pins remains mandatory.

Also this morning (security, not scan): Next.js critical AVIF RCE patched — parvomap
bumped to 16.3.3, built clean, pushed to main (commit 7b08be8), Vercel redeployed.

Housekeeping backlog (pin removals pending owner approval, delete was
permission-blocked): UT CYANO-MANTUA-2026-07 + CYANO-SALEMPOND-2026-07;
MN CYANO-CORNELIA-2026-07 (duplicates CYANO-LAKECORNELIA-MN-2026-07).
