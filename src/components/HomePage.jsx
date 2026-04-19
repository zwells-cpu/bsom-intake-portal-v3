import { MODULES } from '../lib/constants'
import { ThemeToggle } from './ThemeToggle'

export function HomePage({
  onEnterModule,
  onAddReferral,
  onScheduleParentInterview,
  theme,
  setTheme,
  topRightContent = null,
}) {
  return (
    <div className="home-screen">
      <div className="home-topbar">
        <ThemeToggle theme={theme} setTheme={setTheme} />
        {topRightContent}
      </div>

      <div className="home-logo">
        <img
          src="/bsom-logo.jpg"
          alt="BSOM"
          style={{ width: 96, height: 96 }}
        />
      </div>

      <div className="home-hero">
        <div className="home-eyebrow">Behavioral Solutions of Mississippi</div>
        <div className="home-title">Intake Operations Portal</div>
      </div>

      <div className="module-grid">
        {MODULES.map(m => (
          <div
            key={m.id}
            className="module-card"
            style={{ '--card-color': m.color }}
            onClick={() => onEnterModule(m.id)}
          >
            <div className="module-arrow">{'\u2192'}</div>
            {m.icon ? <div className="module-icon">{m.icon}</div> : null}
            <div className="module-name">{m.name}</div>
            <div className="module-desc">{m.desc}</div>
          </div>
        ))}

        <div
          className="module-card module-card-actions"
          style={{ '--card-color': 'var(--accent)' }}
        >
          <div className="module-arrow">{'\u2192'}</div>
          <div className="module-name">Quick Actions</div>
          <div className="module-desc">Jump straight into the most common intake tasks without leaving the home screen.</div>
          <div className="quick-actions">
            <button className="quick-action-btn quick-action-btn-primary" onClick={onAddReferral}>
              Add New Referral
            </button>
            <button className="quick-action-btn quick-action-btn-secondary" onClick={onScheduleParentInterview}>
              Schedule Parent Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
