import { sc } from '../lib/utils'

export function Badge({ value }) {
  if (!value || value === '--') {
    return (
      <span className="bdg" style={{ background: '#64748b15', color: '#64748b', border: '1px solid #64748b25' }}>
        --
      </span>
    )
  }
  const color = sc(value)
  return (
    <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35`, letterSpacing: '0.01em' }}>
      {value}
    </span>
  )
}

export function OfficePill({ office, previousOffice }) {
  const norm = normalizeOfficeFn(office)
  const showPreviousOffice = Boolean(
    previousOffice
    && previousOffice !== office
    && !(office === 'FLOWOOD' && previousOffice === 'JACKSON')
  )

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', minHeight: 28 }}>
      <span className="office-pill">{norm || ''}</span>
      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600, visibility: showPreviousOffice ? 'visible' : 'hidden' }}>
        Prev. {showPreviousOffice ? previousOffice : ' '}
      </span>
    </span>
  )
}

function normalizeOfficeFn(o) {
  if (o === 'JACKSON') return 'FLOWOOD'
  if (o === 'SCHOOL') return 'DAY TREATMENT'
  if (o === 'NEWTON') return 'FOREST'
  return o
}

export function StagePill({ stage }) {
  const COLORS = {
    'New Referral': '#6366f1', 'Intake': '#8b5cf6', 'Ready for Interview': '#22c55e', 'Initial Assessment': '#f59e0b',
    'PA Submitted': '#fb923c', 'PA In Review': '#fb923c', 'PA Approved': '#22c55e',
    'Active Client': '#22c55e', 'Referred Out': '#64748b', 'Reauth Needed': '#f59e0b', 'Discharged': '#64748b',
  }
  if (!stage) return <span style={{ color: 'var(--dim)' }}>--</span>
  const c = COLORS[stage] || '#64748b'
  const unifiedStageFamily = ['New Referral', 'Intake', 'Ready for Interview', 'Initial Assessment', 'Active Client'].includes(stage)
  if (unifiedStageFamily) {
    return (
      <span
        className="stage-badge action-btn"
        style={{ background: `${c}20`, color: c, borderColor: `${c}35` }}
      >
        <span>{stage}</span>
      </span>
    )
  }
  return (
    <span style={{ background: `${c}20`, color: c, border: `1px solid ${c}35`, borderRadius: 6, padding: '2px 9px', fontSize: '10.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {stage}
    </span>
  )
}

export function PaStatusBadge({ status }) {
  const PA_COLORS = {
    'Approved': '#22c55e', 'Approved/Discharged': '#64748b', 'No PA Needed': '#22c55e',
    'Pending': '#f59e0b', 'In Review': '#6366f1', 'Reauthorization Needed': '#f59e0b',
    'Appeal Pending': '#fb923c', 'Denied': '#ef4444', 'Referred Out': '#64748b',
  }
  const s = status || 'Pending'
  const c = PA_COLORS[s] || '#64748b'
  return (
    <span className="bdg" style={{ background: `${c}20`, color: c, border: `1px solid ${c}35` }}>
      {s}
    </span>
  )
}

export function ProgressRing({ value }) {
  const radius = 18
  const circ = 2 * Math.PI * radius
  const col = value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="52" height="52" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="#1a2840" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke={col}
        strokeWidth="4"
        strokeDasharray={`${value / 100 * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={col} fontFamily="DM Mono,monospace">
        {value}%
      </text>
    </svg>
  )
}
