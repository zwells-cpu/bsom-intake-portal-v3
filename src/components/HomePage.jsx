import { MODULES } from '../lib/constants'
import { ThemeToggle } from './ThemeToggle'

export function HomePage({ onEnterModule, theme, setTheme }) {
  return (
    <div className="home-screen">
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="home-logo">
        <img
          src="/bsom-logo.jpg"
          alt="BSOM"
          style={{ width: 96, height: 96 }}
        />
      </div>

      <div className="home-title">BSOM Intake Portal</div>
      <div className="home-sub">Behavioral Solutions of Mississippi Intake Operations Portal</div>

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
