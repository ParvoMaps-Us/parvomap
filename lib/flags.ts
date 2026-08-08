// Master switch for the Scoopie BioRest integration: public promotion (footer +
// email mentions), reporter outreach emails, and internal lead alerts.
//
// Flip to `true` when the Scoopie BioRest service is ready to launch. While
// false, ParvoMap runs as a standalone tracker — reports still post to the map,
// but nothing BioRest-related is shown or sent.
export const BIOREST_ENABLED = false

// Master switch for the paid alerts product (Guardian/Pro Clinic): the /pro,
// /alerts, and /clinic pages plus every upsell CTA that points at them. While
// false those pages 404, upsells hide, and the header CTA becomes the
// "Keep ParvoMaps Free" chip-in (lib/donate.ts). Flip to `true` to relaunch —
// no other edits needed. Parked 2026-08-08: donations-first until traffic
// justifies the paid tier.
export const PAID_ALERTS_LIVE = false
