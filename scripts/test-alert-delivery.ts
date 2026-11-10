// Tests for the pure parts of free alerts: who matches, what is too old to
// email about, what the hourly sweep treats as new, and the free-tier gate.
//
// USAGE (repo root; no install, no network, no Redis, sends nothing):
//   node --import ./scripts/ts-alias.mjs scripts/test-alert-delivery.ts
// Exits 1 if any case fails.

process.env.RESEND_API_KEY ||= 're_test_not_a_real_key' // the SDK refuses to construct without one

const { isAlertable, selectHits, pickFresh, MAX_ALERT_AGE_MS } = await import('@/lib/alert-delivery')
const { matchesPrefs, isConfirmedFree, emailHash, FREE_RADIUS_MILES } = await import('@/lib/alerts')
const { isSignupToken, capKeyEmail } = await import('@/lib/free-alerts')

type AnyReport = Parameters<typeof matchesPrefs>[0]
type AnyPrefs = Parameters<typeof matchesPrefs>[1]

const NOW = Date.UTC(2026, 10, 9, 18)
const DAY = 24 * 60 * 60 * 1000
let failed = 0
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

const report = (over: Partial<AnyReport> = {}): AnyReport => ({
  id: 'PARVO-SLC-1', disease: 'parvo', zip: '84101', state: 'UT', city: 'Salt Lake City',
  lat: 40.7608, lng: -111.891, timestamp: NOW - DAY, verified: true, confidence: 1, ...over,
} as AnyReport)

// Salt Lake City 84101. Murray is about 7 miles south, Provo about 38.
const free = (over: Partial<AnyPrefs> = {}): AnyPrefs => ({
  email: 'a@example.com', zip: '84101', lat: 40.7608, lng: -111.891, radiusMiles: FREE_RADIUS_MILES,
  diseases: 'all', lostDogs: false, tier: 'free', confirmedAt: NOW - DAY, updatedAt: NOW - DAY, ...over,
} as AnyPrefs)

// ── matching ──
check('same spot matches', matchesPrefs(report(), free()), true)
check('about 7 miles away matches (inside 10)', matchesPrefs(report({ lat: 40.6669, lng: -111.888 }), free()), true)
check('about 38 miles away does not match', matchesPrefs(report({ lat: 40.2338, lng: -111.6585 }), free()), false)
check('no coords on the pin: same ZIP matches', matchesPrefs(report({ lat: undefined, lng: undefined }), free()), true)
check('no coords on the pin: other ZIP does not', matchesPrefs(report({ lat: undefined, lng: undefined, zip: '84604' }), free()), false)
check('lost dog never matches a free signup', matchesPrefs(report({ kind: 'lost' }), free()), false)
check('lost dog matches a paid record that asked for them', matchesPrefs(report({ kind: 'lost' }), free({ tier: undefined, lostDogs: true })), true)
check('paid record with a disease list: other disease does not match', matchesPrefs(report({ disease: 'rabies' }), free({ tier: undefined, diseases: ['parvo'] })), false)

// ── age gate ──
check('1 day old is alertable', isAlertable(report(), NOW), true)
check('59 days old is alertable', isAlertable(report({ timestamp: NOW - 59 * DAY }), NOW), true)
check('61 days old is not', isAlertable(report({ timestamp: NOW - 61 * DAY }), NOW), false)
check('cutoff is 60 days', MAX_ALERT_AGE_MS, 60 * DAY)
check('unverified is not alertable', isAlertable(report({ verified: false }), NOW), false)
check('no id is not alertable', isAlertable(report({ id: '' }), NOW), false)
check('dated 3 days in the future is not alertable', isAlertable(report({ timestamp: NOW + 3 * DAY }), NOW), false)

// ── selectHits ──
const batch = [
  report({ id: 'near-new' }),
  report({ id: 'near-old', timestamp: NOW - 90 * DAY }),
  report({ id: 'far-new', lat: 40.2338, lng: -111.6585 }),
  report({ id: 'near-new-2', disease: 'distemper', lat: 40.6669, lng: -111.888 }),
]
check('selectHits keeps near + recent only', selectHits(batch, free(), NOW).map(r => r.id), ['near-new', 'near-new-2'])

// ── sweep ──
check('pickFresh returns only unseen ids', pickFresh(batch, new Set(['near-new', 'far-new'])).map(r => r.id), ['near-old', 'near-new-2'])
check('pickFresh with everything seen is empty', pickFresh(batch, new Set(batch.map(r => r.id))).length, 0)

// ── free-tier gate ──
check('confirmed free signup is eligible', isConfirmedFree(free()), true)
check('free record without confirmedAt is not', isConfirmedFree(free({ confirmedAt: undefined })), false)
check('paid record is not "confirmed free"', isConfirmedFree(free({ tier: undefined })), false)

// ── dedupe key holds no address ──
check('emailHash ignores case and spaces', emailHash(' A@Example.com '), emailHash('a@example.com'))
check('emailHash does not contain the address', emailHash('a@example.com').includes('a@example.com'), false)
check('emailHash differs per address', emailHash('a@example.com') === emailHash('b@example.com'), false)

// ── the verify path (Cass 11/9): a pending report says verified:false, so the
//    route must pass a verified copy or nobody is ever alerted ──
const pendingShape = report({ verified: false, sourceUrl: 'https://evil.example/x' })
check('pending report as stored is NOT alertable', selectHits([pendingShape], free(), NOW).length, 0)
const asVerifySends = { ...pendingShape, verified: true, sourceUrl: undefined }
check('the copy the verify route sends IS alertable', selectHits([asVerifySends], free(), NOW).length, 1)
check('and carries no visitor-typed source link', asVerifySends.sourceUrl, undefined)

// ── per-address cap key: +tags and Gmail dots are one inbox ──
check('+tag is dropped', capKeyEmail('victim+1@example.com'), 'victim@example.com')
check('Gmail dots are dropped', capKeyEmail('v.i.c.tim+x@gmail.com'), 'victim@gmail.com')
check('googlemail is gmail', capKeyEmail('vic.tim@googlemail.com'), 'victim@gmail.com')
check('dots kept for other domains', capKeyEmail('vic.tim@example.com'), 'vic.tim@example.com')
check('case and spaces ignored', capKeyEmail('  Victim@Example.com '), 'victim@example.com')

// ── token shape ──
check('UUID is a signup token', isSignupToken('3f2b8c1e-9a4d-4c7b-8e21-0f6a5d4c3b2a'), true)
check('junk is not a signup token', isSignupToken('../../etc/passwd'), false)
check('empty is not a signup token', isSignupToken(''), false)

console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
