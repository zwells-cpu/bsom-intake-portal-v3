const portalModules = [
  ['Dashboard', 'High-level stats, alerts, and recent activity at a glance.', '#6366f1'],
  ['Intake', 'Manage referrals, add new clients, track pending documents and insurance verification.', '#22c55e'],
  ['Initial Assessments', 'Track Vineland, SRS-2, parent interviews, BCBA assignments, and prior authorization status.', '#f59e0b'],
  ['Operational Insights', 'Aging reports, clinic volume, conversion rates, and staff performance metrics.', '#fb923c'],
]

const locations = [
  {
    name: 'Meridian',
    phone: '(769) 274-8961',
    address: '3302 8th St Meridian, MS 39301',
    color: '#6366f1',
  },
  {
    name: 'Forest',
    phone: '(601) 900-5125',
    address: '1151 MS-35 S Forest, MS 39074',
    color: '#22c55e',
  },
  {
    name: 'Flowood',
    phone: '(769) 274-8962',
    address: '1050 N Flowood Dr Flowood, MS 39232',
    color: '#f59e0b',
  },
]

export function AboutPortalPage() {
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 6 }}>About the Portal</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>BSOM Intake Portal - internal operations tool</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad">
            <div className="section-hdr">Overview</div>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              The BSOM Intake Portal is an internal operations tool built for Behavioral Solutions of Mississippi staff. It centralizes referral tracking, intake coordination, assessment management, and operational reporting across all clinic locations.
            </p>
          </div>

          <div className="card card-pad">
            <div className="section-hdr">Version</div>
            <div className="info-row"><span className="info-label">Version</span><span className="info-val">3.0.0 (React/Vite)</span></div>
            <div className="info-row"><span className="info-label">Backend</span><span className="info-val">Supabase (PostgreSQL)</span></div>
            <div className="info-row" style={{ border: 'none' }}><span className="info-label">Developed by</span><span style={{ color: '#a5b4fc', fontWeight: 700 }}>Zanteria Wells</span></div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-hdr">Modules</div>
          {portalModules.map(([name, desc, color], idx) => (
            <div key={name} style={{ padding: '12px 0', borderBottom: idx === portalModules.length - 1 ? 'none' : `1px solid ${color}22` }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color }}>{name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LocationsPage() {
  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>Office Locations</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>BSOM clinic locations and contact information</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'stretch' }}>
        {locations.map(loc => (
          <div key={loc.name} className="card card-pad" style={{ borderLeft: `3px solid ${loc.color}`, minHeight: 190 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14, color: loc.color }}>{loc.name}</div>
            <div className="info-row">
              <span className="info-label">Phone</span>
              <span className="info-val">{loc.phone}</span>
            </div>
            <div className="info-row" style={{ border: 'none', alignItems: 'flex-start' }}>
              <span className="info-label">Address</span>
              <span className="info-val" style={{ textAlign: 'right', maxWidth: 220, lineHeight: 1.6 }}>{loc.address}</span>
            </div>
          </div>
        ))}

        <div className="card card-pad" style={{ borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14, color: '#a78bfa' }}>General Contact Info</div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-val">hello@bxsom.com</span>
          </div>
          <div className="info-row">
            <span className="info-label">Website</span>
            <span className="info-val">bx-solutionsms.com</span>
          </div>
          <div className="info-row">
            <span className="info-label">Fax 1</span>
            <span className="info-val">(601) 952-4398</span>
          </div>
          <div className="info-row" style={{ border: 'none' }}>
            <span className="info-label">Fax 2</span>
            <span className="info-val">(769) 210-4208</span>
          </div>
        </div>
      </div>
    </div>
  )
}
