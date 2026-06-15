import { NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getRedisClient } from '@/lib/redis'
import { sendSubscriptionWelcome } from '@/lib/notifications'
import { claimFounderSlot } from '@/lib/founders'
import { maskEmail } from '@/lib/log'
import { getAlertPrefs, saveAlertPrefs } from '@/lib/alerts'
import { geocodeZip } from '@/lib/geocode'

// Stripe signs the *raw* request body. Next.js route handlers give us the
// untouched bytes via req.text(); never parse to JSON before verifying.
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !secret) {
    console.warn('Stripe webhook hit but Stripe/webhook secret not configured')
    return Response.json({ error: 'not configured' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return Response.json({ error: 'missing signature' }, { status: 400 })

  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret)
  } catch (e) {
    console.error('Stripe signature verification failed:', e)
    return Response.json({ error: 'invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const plan = (s.metadata?.plan as string | undefined) ?? null
        const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? null
        await recordSubscriber({
          customerId:   typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null,
          email:        s.customer_details?.email ?? null,
          plan,
          subscription: subId,
          status:       'active',
          ts:           Date.now(),
        })
        console.log('New subscriber:', maskEmail(s.customer_details?.email), plan)

        // Founding Guardian: claim a price-locked slot (idempotent, hard-capped).
        // Tagging the subscription is what marks it "never migrate" for life.
        try {
          const claim = await claimFounderSlot(plan, subId)
          if (claim.isFounder && subId) {
            await stripe.subscriptions.update(subId, {
              metadata: { plan: plan ?? '', founder: 'true', founder_number: String(claim.number) },
            })
            console.log(`Founding Guardian #${claim.number} locked in:`, maskEmail(s.customer_details?.email))
          }
        } catch (e) {
          console.error('Founder slot claim failed:', e)
        }

        // Auto-enroll in alerts using the billing ZIP Stripe already collected, so
        // a new member doesn't have to retype their email on /alerts and configure
        // from scratch. Best-effort: any failure just falls back to manual setup.
        const newEmail = s.customer_details?.email
        let enrolledZip: string | null = null
        if (newEmail) {
          try {
            enrolledZip = await autoEnrollAlerts(newEmail, s.customer_details?.address?.postal_code ?? null)
          } catch (e) {
            console.error('Alert auto-enroll failed:', e)
          }
        }

        // Welcome email — confirms alerts are on (or how to set them up if we
        // couldn't auto-enroll, e.g. a non-US billing ZIP).
        if (newEmail) {
          try {
            await sendSubscriptionWelcome(newEmail, (s.metadata?.plan as string | undefined) ?? null, { enrolledZip })
          } catch (e) {
            console.error('Welcome email failed:', e)
          }
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
        if (customerId) await markSubscriberStatus(customerId, 'cancelled')
        console.log('Subscription cancelled:', customerId)
        break
      }
      default:
        // Acknowledge everything else so Stripe stops retrying.
        break
    }
  } catch (e) {
    // Log but still 200 — a persistence hiccup shouldn't make Stripe retry forever.
    console.error('Webhook handler error:', e)
  }

  return Response.json({ received: true })
}

/**
 * Turn alerts on for a brand-new subscriber using the ZIP they entered at
 * checkout. Returns the 5-digit ZIP we enrolled them at, or null if we couldn't
 * (no/foreign ZIP, geocode failure) — caller falls back to manual setup. Never
 * overwrites prefs they've already configured.
 */
async function autoEnrollAlerts(email: string, postalCode: string | null): Promise<string | null> {
  // Stripe postal codes can be ZIP+4 ("84101-1234") or non-US; only take a clean
  // US 5-digit ZIP.
  const zip = (postalCode ?? '').trim().slice(0, 5)
  if (!/^\d{5}$/.test(zip)) return null

  // Don't clobber an existing configuration (e.g. a resubscribe).
  if (await getAlertPrefs(email)) return null

  // Geocode for radius matching; if it fails, exact-ZIP matching still works.
  const geo = await geocodeZip(zip)

  await saveAlertPrefs({
    email,
    zip,
    lat: geo?.lat,
    lng: geo?.lng,
    radiusMiles: 25,      // sensible default; member can widen/narrow later
    diseases: 'all',      // every disease until they pick favorites
    lostDogs: true,       // include nearby lost dogs by default
    updatedAt: Date.now(),
  })
  return zip
}

interface SubscriberRecord {
  customerId: string | null
  email: string | null
  plan: string | null
  subscription: string | null
  status: 'active' | 'cancelled'
  ts: number
}

async function recordSubscriber(rec: SubscriberRecord): Promise<void> {
  const client = getRedisClient()
  if (!client || !rec.customerId) return
  await client.hset('subscribers', { [rec.customerId]: JSON.stringify(rec) })
}

async function markSubscriberStatus(customerId: string, status: 'active' | 'cancelled'): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  const existing = await client.hget<string>('subscribers', customerId)
  if (!existing) return
  const rec = JSON.parse(existing) as SubscriberRecord
  rec.status = status
  await client.hset('subscribers', { [customerId]: JSON.stringify(rec) })
}
