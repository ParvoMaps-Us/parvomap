// Puppy insurance box (affiliate). One featured partner, picked from the 11/9/2026 research
// (Personal Work/_Ideas/pet-insurance-affiliate-payouts-2026-11-09.md).
//
// SWITCH: the box renders only when INSURANCE_AFFILIATE_URL is set (Vercel env, not a secret:
// it is the public tracking link the network gives us after the brand approves ParvoMaps).
// No link, no box. Remove the env var and redeploy to turn it off.
//
// COPY RULES (do not loosen without Vera):
// - Never suggest buying a plan for a dog that is sick or was exposed. Nothing that started
//   before the plan, or during the wait, is covered.
// - Always tell owners to keep shots on schedule (plans can deny a parvo claim otherwise).
// - The "we earn a fee" line stays next to the button (FTC), and the link is rel="sponsored".
// - Partner facts below must match the partner's own site AND its network contract. Re-check
//   them when the contract arrives, and again if the partner changes.

// BEFORE SETTING THE ENV VAR (Vera 11/9/2026). Read the partner's network contract for:
// 1. Payout trigger. The fee line in InsuranceBox says "if you sign up". If they pay per quote
//    or application, change it to "if you get a quote or sign up through this link".
// 2. That unlicensed publishers are allowed, and any excluded states (hide the box on those
//    state pages). One named insurer + pay per sign-up sits near the "solicit" line in state
//    insurance law; only the contract or an insurance lawyer can settle it.
// 3. Copy pre-approval, any ban on coverage or price statements, a required underwriter
//    disclaimer, trademark use of the name, required FTC wording, and that "costs you nothing
//    extra" is true.

export const INSURANCE_PARTNER = {
  name: 'Pets Best',
  minAge: '7 weeks',
  illnessWaitDays: 14,
} as const

/** The affiliate link, or null when the box should stay hidden. https only. */
export function insuranceUrl(): string | null {
  const url = process.env.INSURANCE_AFFILIATE_URL?.trim()
  return url && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null
}
