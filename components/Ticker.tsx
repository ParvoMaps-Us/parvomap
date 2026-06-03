const items = [
  { zip: '90210', city: 'Beverly Hills CA', disease: 'Parvovirus', time: '4 min ago' },
  { zip: '77001', city: 'Houston TX', disease: 'Parvovirus', time: '18 min ago' },
  { zip: '30301', city: 'Atlanta GA', disease: 'Distemper', time: '41 min ago' },
  { zip: '60601', city: 'Chicago IL', disease: 'Kennel Cough', time: '1 hr ago' },
  { zip: '98101', city: 'Seattle WA', disease: 'Dog Flu', time: '2 hr ago' },
  { zip: '80201', city: 'Denver CO', disease: 'Kennel Cough', time: '3 hr ago' },
  { zip: '85001', city: 'Phoenix AZ', disease: 'Leptospirosis', time: '5 hr ago' },
  { zip: '33101', city: 'Miami FL', disease: 'Giardia', time: '6 hr ago' },
  { label: 'Utah Lake', city: 'Provo UT', disease: 'Blue-green algae', time: '3 days ago' },
  { label: 'Bear Lake', city: 'Garden City UT', disease: 'Blue-green algae', time: '6 hr ago' },
  { zip: '06001', city: 'Avon CT', disease: 'Lyme Disease', time: '2 days ago' },
  { zip: '85001', city: 'Phoenix AZ', disease: 'RMSF', time: '5 hr ago' },
  { zip: '80401', city: 'Golden CO', disease: 'Tick Sighting', time: '1 day ago' },
]

const allItems = [...items, ...items]

export default function Ticker() {
  return (
    <div className="ticker-wrap">
      <div className="ticker-label">Live Reports</div>
      <div className="ticker-track">
        {allItems.map((item, i) => (
          <span key={i}>
            {'zip' in item && item.zip ? (
              <>ZIP <b>{item.zip}</b> · {item.city} · {item.disease} · <em>{item.time}</em></>
            ) : (
              <><b>{(item as any).label}</b> · {item.city} · {item.disease} · <em>{item.time}</em></>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
