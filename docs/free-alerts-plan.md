# Free ZIP alerts (BUILT 11/9/2026, not deployed; test plan: docs/TEST-free-alerts.md)

**What got built 11/9:** double opt-in signup (email + ZIP → confirm email → button), boxes on the homepage, state pages and under the ZIP search, an hourly sweep so seeded pins alert people (first run sends nothing), one email per person per sweep, free pet-food recall alerts, hashed dedupe keys, free-tier unsubscribe wording. Code map: lib/free-alerts.ts (pending signups), lib/alert-delivery.ts (who gets emailed + sweep), app/api/alerts/subscribe + confirm, app/api/cron/alert-sweep, components/AlertSignup.tsx. Original plan below.

---

(parked 10/20/2026, build on a free evening)

**Why:** the giveaway that brings owners back and grows the email list; makes every "Send to a friend" worth more.
Never reward reports (fake cases). Reward sharing/sign-up only.

**What exists:** ZIP + radius matching (lib/alerts.ts `matches`), magic-link email (request-link), signed unsubscribe
in every alert (lib/notifications.ts), rate limits, privacy policy already covers alerts. 0 subscribers today.

**Build (~2-3 h):**
1. Free tier: replace the `isActiveSubscriber` gate with "confirmed alert signup" in api/alerts/request-link,
   api/alerts/save, api/verify (send), cron/recall-alerts. Free = 1 ZIP, 10-mile radius, all diseases. Paid keeps
   multi-ZIP + food-brand recalls.
2. Signup box (email + ZIP → confirm email → on): welcome popup, "Cases near you" ZIP check, pin popups.
3. Hourly alert sweep cron: new pins from ANY source (seeded cases skip /api/verify today, so they alert no one),
   match prefs, send, record sent ids to dedupe.
4. Check the Resend plan limits (free = 100/day).
5. TEST-free-alerts.md (signup, confirm, alert fires, unsubscribe, no duplicates, rate limit) → Cass → deploy.
Copy: "We'll email you when a case is confirmed near you." Don't promise frequency (dog-only seeding rule = quiet).

**Next after it:** Puppy Parvo Guide PDF as the thank-you after sharing (vaccine schedule, early signs, first 24h,
yard disinfecting). Later: partner-clinic vaccine discount for sharers.
