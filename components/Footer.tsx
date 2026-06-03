export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer>
      <div className="footer-disclaimer">
        <strong>ParvoMap is a community reporting tool.</strong> Data is user-submitted and unverified.
        Do not use this map as a substitute for veterinary advice. If your dog is showing symptoms,
        contact your veterinarian immediately.
        <br /><br />
        Parvo pins remain active for 12 months — canine parvovirus survives in soil for up to a year.
        All other disease pins expire after 90 days.
      </div>
      <div className="footer-links">
        <a href="https://scoopie.us" className="scoopie-link" target="_blank" rel="noopener noreferrer">
          🐾 Parvo in Utah? → Scoopie.us
        </a>
        <div className="footer-copy">
          © {year} ParvoMap · parvomaps.us<br />
          Community-powered canine disease surveillance
        </div>
      </div>
    </footer>
  )
}
