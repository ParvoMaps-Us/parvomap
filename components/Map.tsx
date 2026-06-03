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

      {/* US outline SVG — simplified but recognizable contiguous US shape */}
      <svg className="map-svg" viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path
          d="M 160,80 L 155,95 L 148,100 L 140,98 L 128,105 L 118,112 L 110,125
             L 100,132 L 88,138 L 78,150 L 72,165 L 68,182 L 65,200
             L 68,218 L 72,235 L 80,250 L 85,268 L 82,285 L 78,300
             L 90,310 L 105,318 L 115,330 L 120,348 L 128,360 L 140,368
             L 155,372 L 170,375 L 190,378 L 215,382 L 240,388 L 260,395
             L 280,400 L 308,408 L 335,415 L 362,420 L 390,428 L 415,435
             L 440,442 L 462,450 L 480,455 L 498,458 L 518,458 L 538,455
             L 558,450 L 578,445 L 600,440 L 622,432 L 645,425 L 668,418
             L 690,410 L 712,402 L 732,392 L 750,380 L 765,368 L 778,355
             L 788,340 L 795,325 L 800,308 L 802,292 L 800,275 L 795,260
             L 788,245 L 778,232 L 768,220 L 758,208 L 750,195 L 745,182
             L 742,168 L 740,155 L 742,142 L 745,130 L 748,118 L 745,108
             L 738,100 L 728,95 L 715,92 L 700,90 L 685,88 L 668,87
             L 650,86 L 632,85 L 615,84 L 598,83 L 580,82 L 562,81
             L 544,80 L 525,80 L 506,80 L 488,80 L 470,80 L 452,80
             L 434,80 L 415,80 L 396,80 L 378,80 L 360,80 L 342,80
             L 324,80 L 306,80 L 288,81 L 270,82 L 252,83 L 235,85
             L 218,87 L 202,89 L 188,85 L 175,82 Z
             M 65,200 L 55,205 L 48,215 L 45,228 L 48,240 L 55,250 L 65,258 L 72,255 L 78,245 L 78,228 L 72,215 Z"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Florida peninsula */}
        <path
          d="M 640,420 L 648,438 L 652,455 L 655,472 L 655,490 L 650,505 L 642,515 L 632,510 L 625,498 L 620,482 L 618,465 L 620,448 L 625,435 L 632,425 Z"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Alaska inset */}
        <path
          d="M 100,480 L 88,475 L 75,472 L 62,475 L 52,482 L 48,492 L 52,502 L 62,508 L 75,510 L 88,508 L 100,500 Z"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1"
        />
        {/* Hawaii inset */}
        <ellipse cx="175" cy="520" rx="18" ry="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <ellipse cx="205" cy="515" rx="12" ry="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
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
