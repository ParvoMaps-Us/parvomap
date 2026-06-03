interface StatsBarProps {
  last30: number
  last7: number
  last48: number
  states: number
}

export default function StatsBar({ last30, last7, last48, states }: StatsBarProps) {
  const isEmpty = last30 === 0 && last7 === 0 && last48 === 0

  return (
    <>
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
        <div className="stat-item stat-item-last">
          <div>
            <div className="stat-num stat-num-states">{states}</div>
            <div className="stat-label">US States affected</div>
          </div>
        </div>
        {isEmpty ? (
          <a
            href="#report"
            className="stats-cta-desktop"
          >
            No reports yet — be the first →
          </a>
        ) : (
          <div className="stats-updated">LAST UPDATED · LIVE</div>
        )}
      </div>

      {/* Mobile-only "no reports" row — sits below the grid, no overflow */}
      {isEmpty && (
        <a
          href="#report"
          className="stats-cta-mobile"
        >
          No reports yet — be the first to report a case →
        </a>
      )}
    </>
  )
}
