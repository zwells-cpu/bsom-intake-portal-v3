import { resetDemoData } from '../lib/mockData'

export function DemoBanner({ onShowTour }) {
  return (
    <div className="demo-banner">
      <span className="demo-banner-label">
        <span className="demo-badge">DEMO</span>
        Sample data only — no real client information
      </span>
      <div className="demo-banner-actions">
        <button className="demo-banner-btn" onClick={onShowTour} title="View feature tour">
          ? Tour
        </button>
        <button className="demo-banner-btn demo-banner-btn-reset" onClick={resetDemoData}>
          ↺ Reset Demo
        </button>
      </div>
    </div>
  )
}
