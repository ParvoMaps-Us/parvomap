// Master switch for the Scoopie BioRest integration: public promotion (footer +
// email mentions), reporter outreach emails, and internal lead alerts.
//
// Flip to `true` when the Scoopie BioRest service is ready to launch. While
// false, ParvoMap runs as a standalone tracker — reports still post to the map,
// but nothing BioRest-related is shown or sent.
export const BIOREST_ENABLED = false
