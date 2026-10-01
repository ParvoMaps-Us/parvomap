# Billing terms — paste back into page.tsx when PAID_ALERTS_LIVE flips to true

Removed from app/terms/page.tsx on 2026-10-01 because the paid tier
(Guardian / Guardian Annual / Pro Clinic) was off and these sections described
live billing for a product that 404s. Preserved here verbatim — the Founding
Guardian clause especially took real care (price-lock-follows-the-subscription-
not-the-person, forfeiture on lapse, 1,000-slot allocation order) and should be
restored exactly, not re-derived from memory.

Insert order: "Subscriptions & billing" and "Founding Guardian price lock" go
right after "Acceptable use" and before "Voluntary contributions". "Pro Clinic
data" goes right after "Voluntary contributions". Re-point the liability cap
back to "the amount you paid us in the 12 months before the claim" instead of
the flat $100 (that number only makes sense while there is no paid revenue to
index against).

---

## Subscriptions & billing

- Paid plans (Guardian, Guardian Annual, Pro Clinic) are billed on a recurring basis through Stripe until cancelled.
- Applicable sales tax is calculated at checkout based on your location.
- You can cancel anytime via the billing portal on your [account page](/account); access continues through the end of the paid period.
- Except where required by law, payments are non-refundable.

## Founding Guardian price lock

- The first 1,000 subscribers to a Guardian or Guardian Annual plan ("Founding Guardians") lock in the founding rate in effect at sign-up — currently $5/month or $50/year — for as long as their subscription remains **continuously active**.
- Founding slots are limited to 1,000 in total and are allocated in the order checkout is completed. Once all slots are claimed, the offer closes and new subscriptions are billed at the then-current regular price.
- The locked rate is tied to the subscription, not the person. If you cancel or your subscription lapses for any reason, the founding rate is forfeited; re-subscribing later is at the then-current regular price, even if founding slots remain.
- The price lock applies to the recurring subscription fee only. Applicable sales tax is still calculated at checkout and may change. We may add, change, or remove plan features over time; the locked rate applies to the Guardian plan as it then exists.
- This offer may be withdrawn or modified for sign-ups that have not yet occurred. Any such change does not affect the locked rate of existing Founding Guardians.

## Pro Clinic data

Pro Clinic data exports and API access are provided for your internal and professional use. You may not resell or redistribute the data in a way that re-identifies individuals or misrepresents it as independently verified case data.
