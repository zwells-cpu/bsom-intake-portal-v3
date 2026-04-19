import { MODULES } from '../lib/constants'
import { ThemeToggle } from './ThemeToggle'

function HomeIcon({ kind }) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  if (kind === 'dashboard') {
    return (
      <svg {...shared}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19v-4" />
      </svg>
    )
  }

  if (kind === 'intake') {
    return (
      <svg {...shared}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    )
  }

  if (kind === 'assessment') {
    return (
      <svg {...shared}>
        <path d="M9 3h6" />
        <path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" />
        <path d="M8 14h8" />
      </svg>
    )
  }

  if (kind === 'operations') {
    return (
      <svg {...shared}>
        <path d="M4 16l5-5 4 4 7-7" />
        <path d="M20 13V8h-5" />
      </svg>
    )
  }

  if (kind === 'about') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6" />
        <path d="M12 7h.01" />
      </svg>
    )
  }

  if (kind === 'addReferral') {
    return (
      <svg {...shared}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    )
  }

  if (kind === 'scheduleInterview') {
    return (
      <svg {...shared}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
        <path d="M12 13v4" />
        <path d="M10 15h4" />
      </svg>
    )
  }

  return null
}

const MODULE_ICON_KIND = {
  dashboard: 'dashboard',
  intake: 'intake',
  assessment: 'assessment',
  operations: 'operations',
  about: 'about',
}

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
            <div className="module-icon" aria-hidden="true">
              <HomeIcon kind={MODULE_ICON_KIND[m.id]} />
            </div>
            <div className="module-name">{m.name}</div>
            <div className="module-desc">{m.desc}</div>
          </div>
        ))}

        <div
          className="module-card module-card-actions"
          style={{ '--card-color': 'var(--accent)' }}
        >
          <div className="module-arrow">{'\u2192'}</div>
          <div className="module-icon" aria-hidden="true">
            <HomeIcon kind="dashboard" />
          </div>
          <div className="module-name">Quick Actions</div>
          <div className="module-desc">Jump straight into the most common intake tasks without leaving the home screen.</div>
          <div className="quick-actions">
            <button className="quick-action-btn quick-action-btn-primary" onClick={onAddReferral}>
              <span className="quick-action-btn-icon" aria-hidden="true">
                <HomeIcon kind="addReferral" />
              </span>
              <span>Add New Referral</span>
            </button>
            <button className="quick-action-btn quick-action-btn-secondary" onClick={onScheduleParentInterview}>
              <span className="quick-action-btn-icon" aria-hidden="true">
                <HomeIcon kind="scheduleInterview" />
              </span>
              <span>Schedule Parent Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
