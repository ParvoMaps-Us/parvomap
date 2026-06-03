const PINS = [
  { top: '38%', left: '22%', disease: 'parvo', state: 'active', recency: '48h', zip: '90210', city: 'Beverly Hills, CA', size: 10 },
  { top: '55%', left: '42%', disease: 'parvo', state: 'active', recency: '48h', zip: '77001', city: 'Houston, TX', size: 10 },
  { top: '48%', left: '72%', disease: 'parvo', state: 'active', recency: '7d', zip: '30301', city: 'Atlanta, GA', size: 9 },
  { top: '32%', left: '60%', disease: 'kennel', state: 'active', recency: '48h', zip: '60601', city: 'Chicago, IL', size: 10 },
  { top: '24%', left: '14%', disease: 'influenza', state: 'active', recency: '7d', zip: '98101', city: 'Seattle, WA', size: 9 },
  { top: '36%', left: '28%', disease: 'kennel', state: 'active', recency: '7d', zip: '80201', city: 'Denver, CO', size: 9 },
  { top: '50%', left: '18%', disease: 'leptospira', state: 'active', recency: '7d', zip: '85001', city: 'Phoenix, AZ', size: 9 },
  { top: '65%', left: '65%', disease: 'giardia', state: 'active', recency: '7d', zip: '33101', city: 'Miami, FL', size: 9 },
  { top: '40%', left: '30%', disease: 'cyano', state: 'active', recency: '48h', zip: 'N/A', city: 'Utah Lake, UT', size: 11 },
  { top: '30%', left: '78%', disease: 'lyme', state: 'active', recency: '7d', zip: '06001', city: 'Avon, CT', size: 9 },
  { top: '50%', left: '19%', disease: 'rmsf', state: 'active', recency: '7d', zip: '85001', city: 'Phoenix, AZ', size: 9 },
  { top: '35%', left: '27%', disease: 'tickspot', state: 'active', recency: '30d', zip: '80401', city: 'Golden, CO', size: 8 },
  { top: '45%', left: '55%', disease: 'distemper', state: 'historical', recency: '30d', zip: '63101', city: 'St. Louis, MO', size: 8 },
  { top: '28%', left: '45%', disease: 'kennel', state: 'unverified', recency: '7d', zip: '55101', city: 'St. Paul, MN', size: 7 },
]

export default function Map() {
  return (
    <section className="map-section" aria-label="US canine disease outbreak map">
      <div className="map-bg" />
      <div className="map-grid" />
      <div className="map-label">Live Outbreak Map · US</div>

      {/* US outline SVG */}
      <svg className="map-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path
          d="M 180,120 L 100,140 L 80,180 L 60,220 L 80,260 L 120,300 L 140,340 L 180,360 L 240,380 L 300,400 L 360,420 L 420,440 L 480,450 L 540,440 L 600,420 L 660,400 L 720,380 L 780,360 L 820,320 L 840,280 L 820,240 L 800,200 L 760,160 L 720,140 L 680,130 L 640,120 L 600,115 L 560,118 L 520,120 L 480,118 L 440,115 L 400,112 L 360,110 L 320,112 L 280,115 L 240,118 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Pins */}
      {PINS.map((pin, i) => (
        <div
          key={i}
          className="pin"
          data-disease={pin.disease}
          data-state={pin.state}
          data-recency={pin.recency}
          style={{ top: pin.top, left: pin.left, width: pin.size, height: pin.size }}
        >
          <div className="pin-popup">
            <div className="popup-zip">{pin.zip !== 'N/A' ? `ZIP ${pin.zip}` : pin.city}</div>
            <div className="popup-row"><span>Location</span><span>{pin.city}</span></div>
            <div className="popup-row"><span>Disease</span><span>{pin.disease}</span></div>
            <div className="popup-row"><span>Status</span><span>{pin.state}</span></div>
            <div className="popup-anon">Anonymous community report</div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Map Key</div>
        <div className="legend-section">
          <div className="legend-section-title">Recency</div>
          <div className="legend-item"><div className="legend-dot red" /> Last 48h</div>
          <div className="legend-item"><div className="legend-dot amber" /> Last 7 days</div>
          <div className="legend-item"><div className="legend-dot green" /> Last 30 days</div>
          <div className="legend-item"><div className="legend-dot gray" /> Historical</div>
        </div>
      </div>
    </section>
  )
}
