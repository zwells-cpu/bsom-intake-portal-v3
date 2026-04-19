import { MODULES } from '../lib/constants'
import { ThemeToggle } from './ThemeToggle'

export function HomePage({ onEnterModule, theme, setTheme, topRightContent = null }) {
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
        <div className="home-sub">A complete intake management system for behavioral health clinics</div>
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
            <div className="module-icon">{m.icon}</div>
            <div className="module-name">{m.name}</div>
            <div className="module-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
