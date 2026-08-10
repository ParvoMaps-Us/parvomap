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
- [ ] De-dupe against what's already on the map.
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
