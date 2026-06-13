/** Mask an email for server logs: keep the first char + domain, redact the rest.
 *  e.g. "jane.doe@gmail.com" → "j***@gmail.com". Keeps enough to debug without
 *  writing full PII into Vercel logs. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '(none)'
  const at = email.indexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}
