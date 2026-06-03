interface StatsBarProps {
  last30: number
  last7: number
  last48: number
  states: number
}

export default function StatsBar({ last30, last7, last48, states }: StatsBarProps) {
  const isEmpty = last30 === 0 && last7 === 0 && last48 === 0

  if (isEmpty) {
    return (
      <div className="stats-bar" style={{ justifyContent: 'center' }}>
        <a
          href="#report"
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '12px',
            color: 'var(--green)',
            letterSpacing: '0.05em',
            textDecoration: 'none',
          }}
        >
          Be the first to report a case in your area →
        </a>
      </div>
    )
  }

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-dot green" />
        <div>
          <div className="stat-num green">{last30}</div>
          <div className="stat-label">Last 30 days</div>
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-dot amber" />
        <div>
          <div className="stat-num amber">{last7}</div>
          <div className="stat-label">Last 7 days</div>
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-dot red" />
        <div>
          <div className="stat-num red">{last48}</div>
          <div className="stat-label">Last 48 hours</div>
        </div>
      </div>
      <div className="stat-item" style={{ borderRight: 'none' }}>
        <div>
          <div className="stat-num" style={{ color: 'var(--text-muted)', fontSize: '16px' }}>{states}</div>
          <div className="stat-label">US States affected</div>
        </div>
      </div>
      <div className="stats-updated">LAST UPDATED · LIVE</div>
    </div>
  )
}
