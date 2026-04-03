import { MODULES, MODULE_NAV } from '../lib/constants'

export function Sidebar({ module, subpage, setSubpage, goHome, pendingCount, nrCount, unverifiedCount }) {
  const m = MODULES.find(x => x.id === module)
  const navItems = MODULE_NAV[module] || []

  const badgeFor = (id) => {
    if (id === 'pending')   return pendingCount > 0 ? pendingCount : null
    if (id === 'insurance') return unverifiedCount > 0 ? unverifiedCount : null
    if (id === 'nr')        return nrCount > 0 ? nrCount : null
    return null
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header sidebar-home-btn" onClick={goHome}>
        <div className="sidebar-logo">
          <img src="/bsom-logo.png" alt="BSOM" onError={e => { e.target.style.display='none' }} />
        </div>
        <div>
          <div className="sidebar-title">BSOM Portal</div>
          <div className="sidebar-sub">{m?.icon} {m?.name}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(n => {
          const badge = badgeFor(n.id)
          return (
            <div
              key={n.id}
              className={`nav-item ${subpage === n.id ? 'active' : ''}`}
              onClick={() => setSubpage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </div>
          )
        })}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Modules</div>
        {MODULES.filter(x => x.id !== module).map(x => (
          <div key={x.id} className="nav-item" onClick={() => {
            // Handled by parent via goHome + re-enter
            window.dispatchEvent(new CustomEvent('enter-module', { detail: x.id }))
          }}>
            <span className="nav-icon">{x.icon}</span>
            <span style={{ fontSize: 12 }}>{x.name}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="back-btn" onClick={goHome}>← Back to Portal Home</div>
      </div>
    </aside>
  )
}
