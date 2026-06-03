/**
 * Quick smoke-test for Resend connectivity.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/test-email.ts
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function test() {
  console.log('Sending test email via Resend...')

  const result = await resend.emails.send({
    from:    'hello@parvomap.us',
    to:      'parvomaps.us@gmail.com',
    subject: 'ParvoMap Email Test',
    html:    '<p style="font-family:monospace;background:#0a0a0a;color:#00ff88;padding:24px;">Email sending is working correctly. ✓</p>',
  })

  if (result.error) {
    console.error('❌ Error:', result.error)
    process.exit(1)
  }

  console.log('✅ Sent! ID:', result.data?.id)
}

test().catch(e => {
  console.error('❌ Uncaught:', e)
  process.exit(1)
})
