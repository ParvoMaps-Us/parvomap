import { BIOREST_ENABLED } from '@/lib/flags'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer>
      <div className="footer-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/parvomaps-emblem.svg"
          alt="ParvoMaps — US canine pathogen tracking & mapping"
          className="footer-emblem"
          width={1280}
          height={768}
        />
      </div>
      <div className="footer-disclaimer">
        <strong>ParvoMaps is a community reporting tool.</strong> Data is user-submitted and unverified.
        Do not use this map as a substitute for veterinary advice. If your dog is showing symptoms,
        contact your veterinarian immediately.
        <br /><br />
        Parvo pins remain active for 12 months — canine parvovirus survives in soil for up to a year.
        All other disease pins expire after 90 days. Lost-dog posts (and their photos) are removed after 30 days,
        or sooner if the owner marks the dog as found.
      </div>
      <div className="footer-links">
        {BIOREST_ENABLED && (
          <a href="https://scoopie.us" className="scoopie-link" target="_blank" rel="noopener noreferrer">
            🐾 Dog illness in Utah? → Scoopie BioRest™
          </a>
        )}
        <a
          href="mailto:parvomaps.us@gmail.com?subject=ParvoMap%20feedback%20%E2%80%94%20feature%20or%20bug"
          className="footer-feedback"
        >
          💡 Suggest a feature or report a bug
        </a>
        <div className="footer-copy">
          © {year} ParvoMaps · parvomaps.us<br />
          Community-powered canine disease surveillance<br />
          <a href="/diseases" style={{ color: 'inherit', textDecoration: 'underline' }}>Diseases</a>
          {' · '}
          <a href="/recalls" style={{ color: 'inherit', textDecoration: 'underline' }}>Dog food recalls</a>
          {' · '}
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</a>
          {' · '}
          <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms</a>
        </div>
      </div>
    </footer>
  )
}
