export function AboutPortalPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 6 }}>About the Portal</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>BSOM Intake Portal — internal operations tool</div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="section-hdr">Overview</div>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          The BSOM Intake Portal is an internal operations tool built for Behavioral Solutions of Mississippi staff. It centralizes referral tracking, intake coordination, assessment management, and operational reporting across all clinic locations.
        </p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="section-hdr">Modules</div>
        {[
          ['📊 Dashboard', 'High-level stats, alerts, and recent activity at a glance.'],
          ['📋 Intake', 'Manage referrals, add new clients, track pending documents and insurance verification.'],
          ['🧪 Initial Assessments', 'Track Vineland, SRS-2, parent interviews, BCBA assignments, and prior authorization status.'],
          ['📈 Operational Insights', 'Aging reports, clinic volume, conversion rates, and staff performance metrics.'],
        ].map(([name, desc]) => (
          <div key={name} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad">
        <div className="section-hdr">Version</div>
        <div className="info-row"><span className="info-label">Version</span><span className="info-val">3.0.0 (React/Vite)</span></div>
        <div className="info-row"><span className="info-label">Backend</span><span className="info-val">Supabase (PostgreSQL)</span></div>
        <div className="info-row" style={{ border: 'none' }}><span className="info-label">Developed by</span><span style={{ color: '#a5b4fc', fontWeight: 700 }}>Zanteria Wells</span></div>
      </div>
    </div>
  )
}

export function LocationsPage() {
  const locations = [
    { name: 'Meridian', address: 'Meridian, MS', phone: '', color: '#6366f1' },
    { name: 'Forest',   address: 'Forest, MS',   phone: '', color: '#22c55e' },
    { name: 'Flowood',  address: 'Flowood, MS',  phone: '', color: '#f59e0b' },
    { name: 'Day Treatment', address: 'Mississippi', phone: '', color: '#fb923c' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 4 }}>Office Locations</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>BSOM clinic locations and contact information</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {locations.map(loc => (
          <div key={loc.name} className="card card-pad" style={{ borderLeft: `3px solid ${loc.color}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: loc.color }}>{loc.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{loc.address}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
