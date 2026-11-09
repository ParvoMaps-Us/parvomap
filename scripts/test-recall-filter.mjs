// Regression test for the pet filter and the kind classifier in lib/recalls.ts.
//
// WHY: the FDA feed mixes human and pet recalls, and PET_RE decides which ones
// reach /recalls. A singular-only list ("dog", not "dogs") silently dropped the
// Sept 2026 "Fi Recalls Supplements for Dogs" notice. These cases pin the fix
// (plurals match) and its guard (human foods like "Hot Dog Buns" do not), plus
// the plural fixes in the device / medication / food / supplement classifiers.
//
// The regexes are read straight from lib/recalls.ts, so this always tests the
// shipped patterns. The two small helpers below (isPetItem, recallKind) are
// copied from that file; keep them in sync if the logic there changes.
//
// USAGE (from the repo root; no install, no network, no env):
//   node scripts/test-recall-filter.mjs
// Exits 1 if any case fails.

import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../lib/recalls.ts', import.meta.url), 'utf8')

/** Pull `const NAME = /.../flags` out of the TS source and rebuild it. */
function loadRegex(name) {
  const m = src.match(new RegExp(`\\nconst ${name} =\\s*\\/(.+)\\/([a-z]*)\\n`))
  if (!m) throw new Error(`Could not find ${name} in lib/recalls.ts`)
  return new RegExp(m[1], m[2])
}

const PET_RE = loadRegex('PET_RE')
const HUMAN_FOOD_RE = loadRegex('HUMAN_FOOD_RE')
const DEVICE_RE = loadRegex('DEVICE_RE')
const MED_RE = loadRegex('MED_RE')
const FOOD_RE = loadRegex('FOOD_RE')
const SUPP_RE = loadRegex('SUPP_RE')

// Copied from isPetItem() in lib/recalls.ts.
const isPetItem = text => PET_RE.test(text.replace(HUMAN_FOOD_RE, ' '))

// Copied from recallKind() in lib/recalls.ts (same order: device, medication,
// food, supplement, then default to food).
function recallKind(text) {
  if (DEVICE_RE.test(text)) return 'device'
  if (MED_RE.test(text)) return 'medication'
  if (FOOD_RE.test(text)) return 'food'
  if (SUPP_RE.test(text)) return 'supplement'
  return 'food'
}

// [recall text, should it count as a pet recall?]
const PET_CASES = [
  // Singular pet words: matched before the fix, must keep matching.
  ['Company Recalls Dog Food Due to Possible Aflatoxin', true],
  ["Oma's Pride Recalls Woof Complete Canine Chicken Recipe (6 Lb Bag)", true],
  ['Brand X Recalls Cat Treats Because of Possible Salmonella', true],
  ['Revival Animal Health Recalls Feline Milk Replacers', true],
  ['Puppy Formula Recalled for Low Vitamin D', true],
  // Plurals: the fix.
  ['Fi Recalls Supplements for Dogs Because of Possible Salmonella Contamination', true],
  ['Fromm Recalls Turkey Pate Wet Food For Dogs', true],
  ['Chicken Jerky for Cats Recalled', true],
  ['Milk Replacer for Puppies and Kittens Recalled', true],
  ['Joint Chews for Canines and Felines Recalled', true],
  ["Kibbles 'n Bits Recall Over Foreign Material", true],
  ['Cargill Recalls Animal Feeds Due to Elevated Copper', true],
  // Pet-food cues with no dog/cat word at all.
  ["Steve's Real Food Freeze-Dried Chicken Recipe, Low Thiamine", true],
  ['Grain-Free Kibble Recalled Over Vitamin D', true],
  ['Northwest Naturals Recalls Two Raw Pet Food Products', true],
  // The guard only blanks the human-food phrase, not the whole notice.
  ['Hot Dog Flavored Chews for Dogs Recalled', true],
  // Human foods that hold a pet word: must NOT count.
  ['Bakery Recalls Hot Dog Buns Due to Undeclared Sesame', false],
  ['Recall of Plant-Based Hot Dogs Due to Possible Listeria', false],
  ['Company Recalls Frozen Mini Corn Dogs Due to Undeclared Milk', false],
  ['Corn Dog Batter Mix Recalled', false],
  ['Chili Dog Sauce Recalled for Undeclared Wheat', false],
  ['Recall of Chili-Dogs Sold at Gas Stations', false],
  ['Hotdogs Sold at Stadium Recalled', false],
  ['HAIFA Recalls Smoked Catfish Fillets Due to Listeria', false],
  ['Atkinson Milling Recalls Frozen Hushpuppies Due to Undeclared Milk', false],
  ['Hush Puppy Mix Recalled for Undeclared Milk', false],
  ["Recall of Cat's Claw Capsules Due to Salmonella", false],
  ['Cat\u2019s Claw Herbal Supplement Recall', false], // curly apostrophe, as FDA titles use
  // Other human items from the real feed.
  ['Tonight We Ride Recalls Ultimate Forza Male Supplement', false],
  ['Spring Water in PET Bottles Recalled', false],
]

// [pet recall text, kind it should get] -> which page and advice it lands on.
const KIND_CASES = [
  ['Fi Recalls Supplements for Dogs Because of Possible Salmonella Contamination', 'supplement'],
  ['Probiotics for Dogs Recalled Over Salmonella', 'supplement'],
  ['Dewormers for Dogs and Cats Recalled', 'medication'],
  ['Rabies Vaccines for Dogs Recalled', 'medication'],
  ['Adequan Canine Injection 100 mg/mL Recall', 'medication'],
  ['Infusion Sets for Veterinary Use in Dogs Recalled', 'device'],
  ['Revival Animal Health Recalls Feline Milk Replacers', 'food'],
  ["GO Raw Recalls Steve's Real Food Freeze-Dried Chicken Recipe Due to Low Thiamine (Vitamin B1)", 'food'],
  // Warehouse-wide recall: "Medical Devices" must not pull it off the food page.
  ['Gold Star Distribution Recalls Products Including Drugs, Medical Devices, Cosmetics, Dietary Supplements, Human Food, and Pet Food', 'food'],
]

let failed = 0
function report(ok, label, text) {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(18)} ${text}`)
}

console.log('Pet filter (isPetItem)')
for (const [text, want] of PET_CASES) {
  const got = isPetItem(text)
  report(got === want, want ? 'pet' : 'not pet', got === want ? text : `${text}  (got ${got ? 'pet' : 'not pet'})`)
}

console.log('\nKind (recallKind)')
for (const [text, want] of KIND_CASES) {
  const got = recallKind(text)
  report(isPetItem(text) && got === want, want, got === want ? text : `${text}  (got ${got})`)
}

// None of the patterns may backtrack badly: run them over ~1.4 MB of near
// misses (blanked phrases, glued words) that force a full scan with no match.
console.log('\nSpeed')
const long = 'hot dog hush puppy cat claw dogfish catsup medical devices '.repeat(25000)
const t0 = performance.now()
const longPet = isPetItem(long)
recallKind(long)
const ms = Math.round(performance.now() - t0)
report(!longPet && ms < 1000, 'linear time', `${(long.length / 1e6).toFixed(1)} MB scanned in ${ms} ms, ${longPet ? 'FALSE pet match' : 'no false match'}`)

const total = PET_CASES.length + KIND_CASES.length + 1
console.log(`\n${total - failed}/${total} passed${failed ? `, ${failed} FAILED` : ''}`)
process.exit(failed ? 1 : 0)
