import Stripe from 'stripe'

let stripe: Stripe | null = null

/** Shared Stripe client. Returns null if STRIPE_SECRET_KEY isn't configured
 *  (e.g. local dev without keys) so callers can degrade gracefully instead of
 *  throwing at import time. */
export function getStripe(): Stripe | null {
  if (stripe) return stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('placeholder')) {
    console.warn('Stripe not configured — using null client')
    return null
  }

  // Pin nothing: omit apiVersion so the installed SDK uses its pinned default.
  stripe = new Stripe(key)
  return stripe
}

/**
 * The plans we sell on /pro. Each maps to a Stripe Price created in the
 * dashboard; the id is read from env so prices can be swapped without a deploy.
 *
 *   guardian-* → consumer SaaS (pet owners)   — tax code txcd_10103002
 *   pro-clinic → business SaaS (vets/shelters) — tax code txcd_10103001
 */
export type PlanKey = 'guardian-monthly' | 'guardian-annual' | 'pro-clinic'

export interface Plan {
  key: PlanKey
  /** Env var holding the Stripe Price id (price_…). */
  priceEnv: string
  /** Audience — drives which tax code Stripe applies on the Price in-dashboard. */
  audience: 'consumer' | 'business'
}

export const PLANS: Record<PlanKey, Plan> = {
  'guardian-monthly': { key: 'guardian-monthly', priceEnv: 'STRIPE_GUARDIAN_MONTHLY_PRICE_ID', audience: 'consumer' },
  'guardian-annual':  { key: 'guardian-annual',  priceEnv: 'STRIPE_GUARDIAN_ANNUAL_PRICE_ID',  audience: 'consumer' },
  'pro-clinic':       { key: 'pro-clinic',        priceEnv: 'STRIPE_PRO_CLINIC_PRICE_ID',       audience: 'business' },
}

/** Resolve a plan key to its configured Stripe Price id, or null if unset. */
export function priceIdFor(key: PlanKey): string | null {
  const plan = PLANS[key]
  if (!plan) return null
  const id = process.env[plan.priceEnv]
  return id && !id.includes('placeholder') ? id : null
}
