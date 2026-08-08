/** Donation link ("keep the free map free" lane — separate from the paid
 *  Guardian/Clinic tiers in lib/stripe.ts). A Stripe Payment Link with
 *  "customer chooses what to pay". Public URL, safe to hardcode.
 *
 *  Empty string = every donation UI element renders nothing, so this can ship
 *  ahead of the link existing. Paste the payment-link URL here to go live. */
export const DONATE_URL = ''
