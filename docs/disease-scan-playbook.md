# ParvoMaps — Weekly Canine Disease Scan Playbook

A repeatable recipe for finding new, real, **mappable** dog-disease cases to add to
the map. Run it ~once a week. Hand this file (or just say "run the weekly disease
scan") to the assistant and it knows what to do.

---

## What counts as a case worth adding

A case goes on the map only if **all** of these are true:

1. **Real + sourced** — a specific news article or official health/shelter/agency
   notice. No rumors, no fabrication.
2. **Dog-specific** — affects dogs (not just livestock/humans). Screwworm/algae
   that killed a dog counts; a cattle-only screwworm case does not.
3. **Location-specific** — at least a city or county we can geocode. A statewide
   "cases are up" advisory with no place is NOT mappable.
4. **A disease we track** — see `lib/diseases.ts` (`DISEASE_MAP`). Currently:
   parvo, distemper, kennel, leptospira, influenza, giardia, ringworm, brucella,
   screwworm, rabies, fleas, cyano (blue-green algae), lyme, rmsf, anaplasma,
   ehrlichia, tickspot. If a found disease isn't in the map yet, it can be added
   (5-file recipe — see the disease-tracker memory note).

Recency: anything within a disease's pin TTL shows as **active**; older shows as
**historical** (still fine to add, just dimmed). TTLs: cyano 30d, parvo 365d,
most others 90d.

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
4. Uses a stable, human-readable id like `PARVO-BALTIMORE-2026-06` so it can be
   found and removed later (`zrem` the member whose JSON `id` matches).

**Note:** `.env.local` Upstash points at PROD — seeding writes to the live public
map. Each seeded case id is recorded in the disease-tracker memory note.

---

## Weekly checklist

- [ ] Decide scope (nationwide, or N states — rotate them).
- [ ] Run the core query set (× each state if scoped).
- [ ] Filter to cases meeting the 4 criteria above; drop livestock-only / no-location.
- [ ] De-dupe against what's already on the map.
- [ ] Confirm the batch, then seed.
- [ ] (Optional) note any new disease not yet in `DISEASE_MAP` to add later.
