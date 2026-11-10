# Free ZIP alerts: live test plan

Built 11/9/2026. Run this on the live site right after the deploy. It takes about 15 minutes.
Use an email you can open on your phone. Do each step in order and tick the box.

**Checked 11/9:** `CRON_SECRET` is set for ParvoMaps production in Vercel (name only; the value was not
read). The hourly alert sweep refuses to run without it.

## 1. Sign up
- [ ] Open www.parvomaps.us. The green "Get an email when a case is confirmed near you" box shows above the report form.
- [ ] Type a ZIP in "Cases near you" and press Check. A smaller signup box shows under the result, with no ZIP field.
- [ ] Open a state page (for example /outbreaks/utah). The box shows under the four number tiles.
- [ ] In any box, enter your email and your ZIP. Press "Email me alerts". It says "Check your email."
- [ ] Try a bad email, a 4-digit ZIP, and ZIP 00000. Each one shows a clear error and sends nothing.

## 2. Confirm
- [ ] The email "Turn on your ParvoMaps alerts" arrives from alerts@parvomaps.us within a minute. Check spam too.
- [ ] Open the link. The page shows your email and ZIP and a "Turn on my alerts" button. Nothing is on yet.
- [ ] Press the button. It says "Your alerts are on for ZIP ...".
- [ ] Open the same link again. It says the link has expired (one use only).

## 3. An alert arrives (needs Claude)
- [ ] Ask Claude to add one test pin within 10 miles of your ZIP (id starting TEST-), with your OK.
- [ ] Within about an hour (the sweep runs at 20 past each hour) one email arrives: "... confirmed near ZIP ...".
- [ ] "See it on the map" opens the map on that pin. The email has an Unsubscribe link at the bottom.
- [ ] No second email comes for the same pin after the next sweep.
- [ ] Ask Claude to remove the test pin.

Note: the very first sweep after the deploy sends nothing on purpose. It only records the pins already
on the map. So do step 3 at least one sweep after the deploy.

## 4. Unsubscribe
- [ ] Press Unsubscribe in the alert email. The page names your email. Press "Yes, stop sending me alerts".
- [ ] It says "Done". Ask Claude to add and remove one more test pin: no email arrives.

## 5. Limits
- [ ] Sign up 4 times in a row with the same email. Only 3 confirmation emails arrive.
- [ ] Sign up 6 times fast from one phone. The 6th says "Too many requests".

## What Claude checks (not you)
- [ ] `node --import ./scripts/ts-alias.mjs scripts/test-alert-delivery.ts` passes (27 cases).
- [ ] Vercel logs for /api/cron/alert-sweep show `bootstrapped: true` once, then normal runs. No full emails in any log line.
- [ ] Resend dashboard: sends match, no bounces. Note the plan's daily limit.
- [ ] Count of free signups only (never the addresses).

## Not built yet
- Changing your ZIP without signing up again (sign up again with the new ZIP; it replaces the old one).
- One-click unsubscribe header for Gmail's inbox button.
- A postal address in the email footer (see Vera's notes).
