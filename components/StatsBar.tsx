export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-dot green" />
        <div>
          <div className="stat-num green">71</div>
          <div className="stat-label">Last 30 days</div>
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-dot amber" />
        <div>
          <div className="stat-num amber">19</div>
          <div className="stat-label">Last 7 days</div>
        </div>
      </div>
      <div className="stat-item">
        <div className="stat-dot red" />
        <div>
          <div className="stat-num red">6</div>
          <div className="stat-label">Last 48 hours</div>
        </div>
      </div>
      <div className="stat-item" style={{ borderRight: 'none' }}>
        <div>
          <div className="stat-num" style={{ color: 'var(--text-muted)', fontSize: '16px' }}>31</div>
          <div className="stat-label">US States affected</div>
        </div>
      </div>
      <div className="stats-updated">LAST UPDATED · LIVE</div>
    </div>
  )
}
