import { ThemeToggle } from './ThemeToggle'

const FEATURES = [
  { icon: '📊', title: 'Live Dashboard', desc: 'At-a-glance stats, actionable alerts, and recent staff activity.', color: '#6366f1' },
  { icon: '📋', title: 'Intake Tracking', desc: 'Full referral pipeline with paperwork, insurance, and status management.', color: '#22c55e' },
  { icon: '🧪', title: 'Assessment Module', desc: 'BCBA assignments, parent interviews, treatment plans, and PA tracking.', color: '#f59e0b' },
  { icon: '📈', title: 'Operational Insights', desc: 'Aging reports, clinic volume, conversion rates, and team performance.', color: '#fb923c' },
]

const HIGHLIGHTS = [
  'Built for real ABA intake workflows',
  'Multi-office support with per-clinic filters',
  'Full audit trail — every action logged',
]

export function DemoLandingPage({ onEnter, theme, setTheme }) {
  return (
    <div className="landing-page">
      <div className="landing-topbar">
        <div className="landing-demo-pill">Interactive Demo</div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="landing-hero">
        <img src="/bsom-logo.jpg" alt="BSOM" className="landing-logo" onError={e => { e.target.style.display = 'none' }} />
        <div className="landing-eyebrow">Behavioral Solutions of Mississippi</div>
        <h1 className="landing-title">Intake Operations Portal</h1>
        <p className="landing-tagline">
          A complete intake management system for behavioral health clinics —
          from first referral to active client.
        </p>

        <div className="landing-stats">
          <div className="landing-stat"><span className="landing-stat-num">4</span><span className="landing-stat-label">Clinic Offices</span></div>
          <div className="landing-stat-divider" />
          <div className="landing-stat"><span className="landing-stat-num">5</span><span className="landing-stat-label">Demo Referrals</span></div>
          <div className="landing-stat-divider" />
          <div className="landing-stat"><span className="landing-stat-num">9</span><span className="landing-stat-label">Pipeline Stages</span></div>
        </div>

        <button className="landing-cta" onClick={onEnter}>
          Enter Demo →
        </button>
        <p className="landing-disclaimer">Sample data only — no real client information</p>
      </div>

      <div className="landing-features">
        <div className="landing-section-label">What's inside</div>
        <div className="landing-feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="landing-feature-card" style={{ '--feat-color': f.color }}>
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-highlights">
        {HIGHLIGHTS.map(h => (
          <div key={h} className="landing-highlight-item">
            <span className="landing-highlight-check">✓</span> {h}
          </div>
        ))}
      </div>

      <div className="landing-footer-cta">
        <button className="landing-cta" onClick={onEnter}>Enter Demo →</button>
      </div>
    </div>
  )
}
