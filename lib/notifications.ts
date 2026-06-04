import { Resend } from 'resend'
import { getDiseaseName } from './diseases'
import { getLeadType } from './lead'
import { BIOREST_ENABLED } from './flags'
import type { PendingReport } from './redis'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_HELLO  = 'hello@parvomaps.us'
const FROM_ALERTS = 'alerts@parvomaps.us'

// Resend's SDK returns API errors as a value ({ data, error }) instead of
// throwing — so a rejected send (bad key, unverified domain, wrong account)
// looks like success unless we inspect `error`. Wrap every send to surface it.
async function sendEmail(opts: Parameters<typeof resend.emails.send>[0]) {
  const { data, error } = await resend.emails.send(opts)
  if (error) {
    throw new Error(
      `Resend send failed: ${error.name ?? 'error'} — ${error.message ?? JSON.stringify(error)}`
    )
  }
  return data
}

// ─── VERIFICATION EMAIL ───────────────────────────────────────────────────────

export async function sendVerificationEmail(
  report: PendingReport,
  token: string
): Promise<void> {
  const verifyUrl  = `https://parvomaps.us/api/verify?token=${token}`
  const diseaseName = getDiseaseName(report.disease)

  await sendEmail({
    from:    FROM_HELLO,
    to:      report.email!,
    subject: `Verify your ParvoMap report — ${diseaseName} near ZIP ${report.zip}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#00ff88;">PARVO</span><span style="font-size:24px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#f0f0f0;">MAP</span>
    </div>

    <h1 style="font-size:28px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#f0f0f0;margin:0 0 8px;">Verify Your Report</h1>

    <p style="color:#888;font-size:14px;margin:0 0 24px;line-height:1.6;">
      Your ${diseaseName} report near ZIP <strong style="color:#f0f0f0">${report.zip}</strong> has been received.
      Your pin is currently showing as unverified on the map.
    </p>

    <p style="color:#888;font-size:14px;margin:0 0 32px;line-height:1.6;">
      Click below to verify your report. This upgrades your pin to full color and alerts nearby dog owners.
    </p>

    <a href="${verifyUrl}" style="display:inline-block;background:#00ff88;color:#000000;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 32px;margin-bottom:24px;">
      Verify My Report →
    </a>

    <p style="color:#555;font-size:12px;margin:24px 0 0;line-height:1.6;">
      This link expires in 24 hours. If you did not submit this report, you can safely ignore this email.
    </p>

    <div style="border-top:1px solid #222;margin:32px 0;"></div>

    <p style="color:#444;font-size:11px;line-height:1.6;">
      ParvoMap · US Canine Disease Tracker<br>
      parvomaps.us · Reports are anonymous${BIOREST_ENABLED ? `<br><br>
      Yard decontamination in Utah?
      <a href="https://scoopie.us" style="color:#555;text-decoration:underline;">Scoopie BioRest™</a>` : ''}
    </p>
  </div>
</body>
</html>`,
  })
}

// ─── VERIFICATION CONFIRMATION ────────────────────────────────────────────────

export async function sendVerificationConfirmation(
  report: PendingReport,
  nearbyCount: number
): Promise<void> {
  const diseaseName = getDiseaseName(report.disease)
  const mapUrl = `https://parvomaps.us/?verified=success`

  await sendEmail({
    from:    FROM_HELLO,
    to:      report.email!,
    subject: `Your report is live — ${diseaseName} near ZIP ${report.zip}`,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#00ff88;">PARVO</span><span style="font-size:24px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#f0f0f0;">MAP</span>
    </div>

    <div style="display:inline-block;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);color:#00ff88;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;padding:4px 12px;margin-bottom:16px;">
      ✓ Report Verified
    </div>

    <h1 style="font-size:28px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#f0f0f0;margin:0 0 16px;">Your Pin Is Live</h1>

    <p style="color:#888;font-size:14px;margin:0 0 16px;line-height:1.6;">
      Your ${diseaseName} report near ZIP <strong style="color:#f0f0f0">${report.zip}</strong> is now verified and showing on the map in full color.
    </p>

    <p style="color:#888;font-size:14px;margin:0 0 32px;line-height:1.6;">
      <strong style="color:#f0f0f0">${nearbyCount} dog owner${nearbyCount !== 1 ? 's' : ''}</strong>
      within 25 miles have been notified about activity in their area.
    </p>

    <a href="${mapUrl}" style="display:inline-block;background:#00ff88;color:#000;font-size:14px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;padding:14px 32px;margin-bottom:32px;">
      View on Map →
    </a>

    <div style="border-top:1px solid #222;margin:32px 0;"></div>

    <p style="color:#444;font-size:11px;line-height:1.6;">
      ParvoMap · parvomaps.us${BIOREST_ENABLED ? `<br>
      Yard decontamination in Utah?
      <a href="https://scoopie.us" style="color:#555;text-decoration:underline;">Scoopie BioRest™</a>` : ''}
    </p>
  </div>
</body>
</html>`,
  })
}

// ─── INTERNAL UTAH LEAD ALERT ─────────────────────────────────────────────────

export async function sendInternalAlert(report: PendingReport): Promise<void> {
  const alertEmail = process.env.SCOOPIE_ALERT_EMAIL
  if (!alertEmail) return

  const diseaseName = getDiseaseName(report.disease)
  const leadType = getLeadType(report) // 'residential' | 'commercial'
  const leadLabel = leadType === 'commercial' ? 'COMMERCIAL (facility)' : 'RESIDENTIAL'
  const rows: [string, string][] = [
    ['LEAD TYPE',  leadLabel],
    ['REPORTER',   report.reporterType ?? 'Unknown'],
    ['DISEASE',    diseaseName],
    ['ZIP',        report.zip],
    ['CITY',       report.city ? `${report.city}, ${report.state ?? ''}` : 'Unknown'],
    ['SOURCE',     report.source ?? 'Not provided'],
    ['EMAIL',      report.email ?? 'Not provided'],
    ['CONFIDENCE', `${report.confidence}/100`],
    ['REPORTED',   new Date(report.timestamp).toLocaleString()],
  ]

  await sendEmail({
    from:    FROM_ALERTS,
    to:      alertEmail,
    subject: `ParvoMap Utah Lead [${leadLabel}] — ${diseaseName} — ZIP ${report.zip}`,
    html: `
<div style="font-family:monospace;background:#0a0a0a;color:#f0f0f0;padding:24px;max-width:480px;">
  <div style="color:#00ff88;font-size:16px;font-weight:bold;margin-bottom:16px;letter-spacing:0.1em;">
    PARVOMAP UTAH LEAD
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    ${rows.map(([k, v]) => `
    <tr>
      <td style="color:#555;padding:6px 12px 6px 0;border-bottom:1px solid #222;text-transform:uppercase;letter-spacing:0.06em;width:40%;">${k}</td>
      <td style="color:#aaa;padding:6px 0;border-bottom:1px solid #222;">${v}</td>
    </tr>`).join('')}
  </table>
  ${report.notes ? `
  <div style="margin-top:16px;padding:12px;background:#111;border-left:2px solid #333;color:#888;font-size:12px;line-height:1.6;">
    <div style="color:#555;margin-bottom:4px;font-size:10px;letter-spacing:0.1em;">NOTES</div>
    ${report.notes}
  </div>` : ''}
  <div style="margin-top:24px;padding:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;font-size:11px;letter-spacing:0.06em;">
    → SCOOPIE BIOREST™ PROSPECT — Recommend follow-up within 30 minutes
  </div>
</div>`,
  })
}

// ─── DELAYED UTAH OUTREACH ────────────────────────────────────────────────────

export async function sendDelayedUtahOutreach(report: PendingReport): Promise<void> {
  if (!report.email) return

  const firstName = 'there'

  await sendEmail({
    from:    FROM_HELLO,
    to:      report.email,
    subject: `Is your yard safe after this exposure? — Scoopie BioRest™`,
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f0f0f0;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <div style="margin-bottom:32px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#00ff88;">PARVO</span><span style="font-size:22px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#f0f0f0;">MAP</span>
    </div>

    <p style="color:#aaa;font-size:15px;line-height:1.8;margin:0 0 16px;">Hi ${firstName},</p>

    <p style="color:#aaa;font-size:15px;line-height:1.8;margin:0 0 16px;">
      We saw your report near ZIP <strong style="color:#f0f0f0">${report.zip}</strong> — we are sorry you are going through this.
    </p>

    <p style="color:#aaa;font-size:15px;line-height:1.8;margin:0 0 16px;">
      One thing most people do not realize: pathogens like parvovirus can survive in soil and on outdoor surfaces for
      <strong style="color:#f0f0f0">up to 12 months</strong>.
      That means your yard may still be a risk to other dogs long after your dog recovers.
    </p>

    <p style="color:#aaa;font-size:15px;line-height:1.8;margin:0 0 32px;">
      Scoopie BioRest™ is a professional biosecurity restoration service serving Utah County and Salt Lake County.
      We use hospital-grade Wysiwash disinfectant to decontaminate outdoor surfaces.
      If you would like a free assessment, just reply to this email or visit us below.
    </p>

    <a href="https://scoopie.us" style="display:inline-block;background:#f59e0b;color:#000;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:12px 28px;margin-bottom:32px;">
      Learn About BioRest™ →
    </a>

    <p style="color:#aaa;font-size:14px;line-height:1.8;margin:0 0 8px;">— Izic and the Scoopie team</p>
    <p style="color:#555;font-size:12px;line-height:1.6;margin:0 0 32px;">
      P.S. Even if your dog fully recovers, the pathogen can remain in your yard.
      A decontamination visit protects your dog, your neighbors' dogs, and any future pets.
    </p>

    <div style="border-top:1px solid #222;margin:32px 0;"></div>

    <p style="color:#444;font-size:11px;line-height:1.6;">
      You received this because you submitted a report on ParvoMap. This is a one-time follow-up.<br>
      ParvoMap · parvomaps.us · Scoopie LLC · scoopie.us · 385-412-7152
    </p>
  </div>
</body>
</html>`,
  })
}
