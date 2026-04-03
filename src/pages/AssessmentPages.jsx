import { useState } from 'react'
import { PaStatusBadge } from '../components/Badge'

// ── Shared helpers ──
const PA_COLORS = {
  'Approved': '#22c55e', 'Approved/Discharged': '#64748b', 'No PA Needed': '#22c55e',
  'Pending': '#f59e0b', 'In Review': '#6366f1', 'Reauthorization Needed': '#f59e0b',
  'Appeal Pending': '#fb923c', 'Denied': '#ef4444', 'Referred Out': '#64748b',
}
const STATUS_OPTS = ['Done','In-Progress','Now Scheduled','Waiting','Waiting for a Response','TBD','Report in Progress','Declined Services','NO','Yes','']

function assessVal(v) {
  if (!v) return <span style={{ color: 'var(--dim)', fontSize: 12 }}>--</span>
  const u = v.toUpperCase()
  let c = '#64748b', icon = ''
  if (['DONE','YES','COMPLETED'].some(x => u.includes(x)))                                      { c = '#22c55e'; icon = '✓ ' }
  else if (['IN-PROGRESS','IN PROGRESS','NOW SCHEDULED','REPORT IN PROGRESS'].some(x => u.includes(x))) { c = '#f59e0b'; icon = '◐ ' }
  else if (['WAITING','TBD'].some(x => u.includes(x)))                                          { c = '#fb923c'; icon = '◷ ' }
  else if (['NO','DECLINED'].some(x => u.includes(x)))                                          { c = '#ef4444'; icon = '✗ ' }
  return <span className="bdg" style={{ background: `${c}20`, color: c, border: `1px solid ${c}35` }}>{icon}{v}</span>
}

function sBdg(s) {
  const map = {
    'Completed': '#22c55e', 'Done': '#22c55e', 'In Progress': '#f59e0b',
    'Not Started': '#ef4444', 'Awaiting Assignment': '#fb923c',
    'Scheduled': '#f59e0b', 'No Show': '#ef4444', 'Finalized': '#22c55e',
    'Draft Complete': '#6366f1', 'In Review': '#6366f1', 'Written': '#22c55e',
  }
  const c = map[s] || '#64748b'
  return <span className="bdg" style={{ background: `${c}20`, color: c, border: `1px solid ${c}35` }}>{s || '--'}</span>
}

const ALL_PA = ['All','Approved','In Review','Pending','Reauthorization Needed','Appeal Pending','Denied','No PA Needed','Approved/Discharged','Referred Out']

// ══════════════════════════════════════
// ASSESSMENT TRACKER
// ══════════════════════════════════════
export function AssessmentTracker({ assessData, assessLoading, onSelectAssess }) {
  const [search, setSearch]       = useState('')
  const [office, setOffice]       = useState('ALL')
  const [paFilter, setPaFilter]   = useState('All')

  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /><div style={{ color: 'var(--muted)' }}>Loading assessments...</div></div>

  const src = assessData.map(c => ({
    ...c,
    client_name: c.client_name || c.name || '',
    clinic: c.clinic || c.office || '',
    assessment_id: c.assessment_id || c.id || null,
  }))

  const fl = src.filter(c => {
    const n = (c.client_name || '').toLowerCase()
    return (n.includes(search.toLowerCase()) || (c.caregiver || '').toLowerCase().includes(search.toLowerCase()))
      && (office === 'ALL' || c.clinic === office)
      && (paFilter === 'All' || c.pa_status === paFilter)
  })

  const approved   = fl.filter(c => ['Approved','No PA Needed','Approved/Discharged'].includes(c.pa_status)).length
  const inProgress = fl.filter(c => (c.vineland||'').toLowerCase().includes('progress') || (c.direct_obs||'').toLowerCase().includes('progress')).length
  const denied     = fl.filter(c => ['Denied','Appeal Pending'].includes(c.pa_status)).length

  return (
    <>
      <div className="stats-row stats-4" style={{ marginBottom: 20 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#6366f1' }}>{fl.length}</div><div className="stat-label">Total Clients</div><div className="stat-sub">showing</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{approved}</div><div className="stat-label">PA Approved</div><div className="stat-sub">incl. no PA needed</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{inProgress}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{denied}</div><div className="stat-label">Denied / Appealed</div></div>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search client or caregiver..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-btns">
          {['ALL','MERIDIAN','FOREST','FLOWOOD','DAY TREATMENT'].map(o => (
            <button key={o} className={`filter-btn ${office === o ? 'active' : ''}`} onClick={() => setOffice(o)}>{o}</button>
          ))}
        </div>
      </div>

      <div className="filter-row" style={{ marginTop: -8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>Prior Authorization:</span>
        <div className="filter-btns">
          {ALL_PA.map(p => (
            <button key={p} className={`filter-btn ${paFilter === p ? 'active' : ''}`} onClick={() => setPaFilter(p)} style={{ fontSize: 11 }}>{p}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Insurance</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>In School</th><th>Other Services</th><th>PA Status</th></tr></thead>
            <tbody>
              {fl.length === 0
                ? <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No clients match your filters.</td></tr>
                : fl.map(c => (
                  <tr key={c.assessment_id || c.client_name} className="row-hover"
                    onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                    style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                    <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.caregiver || ''}</div></td>
                    <td><span className="office-pill">{c.clinic || '--'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.insurance || '--'}</td>
                    <td>{assessVal(c.vineland)}</td>
                    <td>{assessVal(c.srs2)}</td>
                    <td>{assessVal(c.parent_interview)}</td>
                    <td>{assessVal(c.direct_obs)}</td>
                    <td>{assessVal(c.in_school)}</td>
                    <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 140 }}>{c.other_services || '--'}</td>
                    <td><PaStatusBadge status={c.pa_status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════
// PARENT INTERVIEWS
// ══════════════════════════════════════
export function ParentInterviewsPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>
  const awaiting  = assessData.filter(c => !c.parent_interview_status || c.parent_interview_status === 'Awaiting Assignment')
  const scheduled = assessData.filter(c => c.parent_interview_status === 'Scheduled')
  const completed = assessData.filter(c => c.parent_interview_status === 'Completed')
  const noshow    = assessData.filter(c => c.parent_interview_status === 'No Show')

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Parent Interviews</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Schedule, track, and complete parent interviews for initial assessments</div>
      </div>
      <div className="stats-row stats-4" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#fb923c' }}>{awaiting.length}</div><div className="stat-label">◷ Awaiting Assignment</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{scheduled.length}</div><div className="stat-label">◐ Scheduled</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{completed.length}</div><div className="stat-label">✓ Completed</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{noshow.length}</div><div className="stat-label">✗ No Show</div></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Interview Status</th><th>Scheduled Date</th><th>Completed Date</th><th>Insurance</th><th /></tr></thead>
            <tbody>
              {assessData.length === 0
                ? <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records found.</td></tr>
                : assessData.map(c => (
                  <tr key={c.assessment_id || c.client_name} className="row-hover"
                    onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                    style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                    <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.caregiver || ''}</div></td>
                    <td><span className="office-pill">{c.clinic || '--'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.assigned_bcba || <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                    <td>{sBdg(c.parent_interview_status || 'Awaiting Assignment')}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: c.parent_interview_scheduled_date ? '#a5b4fc' : 'var(--dim)' }}>{c.parent_interview_scheduled_date || '--'}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: c.parent_interview_completed_date ? '#22c55e' : 'var(--dim)' }}>{c.parent_interview_completed_date || '--'}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.insurance || '--'}</td>
                    <td style={{ color: 'var(--accent)' }}>→</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════
// BCBA ASSIGNMENTS
// ══════════════════════════════════════
export function BCBAAssignmentsPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>
  const unassigned = assessData.filter(c => !c.assigned_bcba)
  const byBCBA = {}
  assessData.filter(c => c.assigned_bcba).forEach(c => {
    if (!byBCBA[c.assigned_bcba]) byBCBA[c.assigned_bcba] = { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
    byBCBA[c.assigned_bcba].total++
    if (c.assessment_status === 'Completed')   byBCBA[c.assigned_bcba].completed++
    else if (c.assessment_status === 'In Progress') byBCBA[c.assigned_bcba].inProgress++
    else byBCBA[c.assigned_bcba].notStarted++
  })

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>BCBA Assignments</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Caseload distribution and assignment tracking across BCBAs</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#6366f1' }}>{assessData.length}</div><div className="stat-label">Total Clients</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{unassigned.length}</div><div className="stat-label">✗ Unassigned</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{Object.keys(byBCBA).length}</div><div className="stat-label">Active BCBAs</div></div>
      </div>

      {Object.keys(byBCBA).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
          {Object.entries(byBCBA).map(([bcba, stats]) => (
            <div key={bcba} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>👩‍⚕️ {bcba}</div>
                <span className="bdg" style={{ background: '#6366f120', color: '#a5b4fc', border: '1px solid #6366f130' }}>{stats.total} clients</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="info-row"><span className="info-label">Completed</span><span style={{ color: '#22c55e', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.completed}</span></div>
                <div className="info-row"><span className="info-label">In Progress</span><span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.inProgress}</span></div>
                <div className="info-row" style={{ border: 'none' }}><span className="info-label">Not Started</span><span style={{ color: '#ef4444', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.notStarted}</span></div>
              </div>
              <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 4, height: 6 }}>
                <div style={{ width: `${stats.total ? Math.round(stats.completed / stats.total * 100) : 0}%`, height: 6, borderRadius: 4, background: '#22c55e', transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4, textAlign: 'right' }}>{stats.total ? Math.round(stats.completed / stats.total * 100) : 0}% complete</div>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>✗ Unassigned Clients ({unassigned.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Office</th><th>Assessment Status</th><th>PA Status</th><th>Insurance</th><th /></tr></thead>
                <tbody>
                  {unassigned.map(c => (
                    <tr key={c.assessment_id || c.client_name} className="row-hover"
                      onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                      style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                      <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.caregiver || ''}</div></td>
                      <td><span className="office-pill">{c.clinic || '--'}</span></td>
                      <td>{sBdg(c.assessment_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={c.pa_status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.insurance || '--'}</td>
                      <td style={{ color: 'var(--accent)' }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ══════════════════════════════════════
// ASSESSMENT PROGRESS
// ══════════════════════════════════════
export function AssessmentProgressPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>
  const notStarted = assessData.filter(c => !c.assessment_status || c.assessment_status === 'Not Started')
  const inProgress = assessData.filter(c => c.assessment_status === 'In Progress')
  const completed  = assessData.filter(c => c.assessment_status === 'Completed')

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Assessment Progress</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track Vineland, SRS-2, observations, and overall assessment completion</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{notStarted.length}</div><div className="stat-label">✗ Not Started</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{inProgress.length}</div><div className="stat-label">◐ In Progress</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{completed.length}</div><div className="stat-label">✓ Completed</div></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {assessData.map(c => (
                <tr key={c.assessment_id || c.client_name} className="row-hover"
                  onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                  style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                  <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.clinic || ''}</div></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.assigned_bcba || <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: 11 }}>Unassigned</span>}</td>
                  <td>{sBdg(c.assessment_status || 'Not Started')}</td>
                  <td>{assessVal(c.vineland)}</td>
                  <td>{assessVal(c.srs2)}</td>
                  <td>{sBdg(c.parent_interview_status || 'Awaiting Assignment')}</td>
                  <td>{assessVal(c.direct_obs)}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{c.assessment_started_date || '--'}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: c.assessment_completed_date ? '#22c55e' : 'var(--dim)' }}>{c.assessment_completed_date || '--'}</td>
                  <td style={{ color: 'var(--accent)' }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════
// TREATMENT PLAN STATUS
// ══════════════════════════════════════
const TX_STATUSES = ['Not Started','In Progress','Draft Complete','In Review','Finalized']
function txColor(s) {
  if (['Finalized','Done','Completed'].includes(s)) return '#22c55e'
  if (['In Progress','In Review','Draft Complete'].includes(s)) return '#f59e0b'
  return '#ef4444'
}

export function TreatmentPlansPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>
  const byStatus = {}
  TX_STATUSES.forEach(s => { byStatus[s] = assessData.filter(c => (c.treatment_plan_status || 'Not Started') === s).length })

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Treatment Plan Status</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track treatment plan drafting, completion, and finalization</div>
      </div>
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 22 }}>
        {TX_STATUSES.map(s => (
          <div key={s} className="stat-box">
            <div className="stat-num" style={{ color: txColor(s) }}>{byStatus[s] || 0}</div>
            <div className="stat-label">{s}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {assessData.map(c => (
                <tr key={c.assessment_id || c.client_name} className="row-hover"
                  onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                  style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                  <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.clinic || ''}</div></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.assigned_bcba || '--'}</td>
                  <td>{sBdg(c.assessment_status || 'Not Started')}</td>
                  <td>{sBdg(c.treatment_plan_status || 'Not Started')}</td>
                  <td>{sBdg(c.authorization_status || c.pa_status || 'Not Submitted')}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{c.treatment_plan_started_date || '--'}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: c.treatment_plan_completed_date ? '#22c55e' : 'var(--dim)' }}>{c.treatment_plan_completed_date || '--'}</td>
                  <td style={{ color: 'var(--accent)' }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════
// READY FOR SERVICES
// ══════════════════════════════════════
export function ReadyForServicesPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>
  const ready      = assessData.filter(c => c.ready_for_services === true)
  const almostAuth = assessData.filter(c =>
    c.assessment_status === 'Completed' &&
    !['Approved'].includes(c.authorization_status || c.pa_status || '') &&
    !c.ready_for_services
  )
  const notReady   = assessData.filter(c => !c.ready_for_services && !almostAuth.includes(c))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Ready for Services</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Clients who have completed all pre-service requirements</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{ready.length}</div><div className="stat-label">✓ Ready for Services</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{almostAuth.length}</div><div className="stat-label">◐ Awaiting Authorization</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{notReady.length}</div><div className="stat-label">✗ Not Ready</div></div>
      </div>

      {ready.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>✓ Ready for Services ({ready.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Authorization</th><th>Auth Approved</th><th>Active Date</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {ready.map(c => (
                    <tr key={c.assessment_id || c.client_name} className="row-hover"
                      onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                      style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                      <td><div style={{ fontWeight: 700, color: '#22c55e' }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.clinic || ''}</div></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.assigned_bcba || '--'}</td>
                      <td><PaStatusBadge status={c.authorization_status || c.pa_status} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#a5b4fc' }}>{c.authorization_approved_date || c.pa_decision_date || '--'}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: c.active_client_date ? '#22c55e' : '#fb923c' }}>{c.active_client_date || 'Pending'}</td>
                      <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 160 }}>{c.notes || '--'}</td>
                      <td style={{ color: 'var(--accent)' }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {almostAuth.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>◐ Awaiting Authorization ({almostAuth.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Submitted</th><th /></tr></thead>
                <tbody>
                  {almostAuth.map(c => (
                    <tr key={c.assessment_id || c.client_name} className="row-hover"
                      onClick={() => c.assessment_id && onSelectAssess(c.assessment_id)}
                      style={{ cursor: c.assessment_id ? 'pointer' : 'default' }}>
                      <td><div style={{ fontWeight: 700 }}>{c.client_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{c.clinic || ''}</div></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.assigned_bcba || '--'}</td>
                      <td>{sBdg(c.assessment_status || 'Not Started')}</td>
                      <td>{sBdg(c.treatment_plan_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={c.authorization_status || c.pa_status || 'Not Submitted'} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{c.authorization_submitted_date || '--'}</td>
                      <td style={{ color: 'var(--accent)' }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
