import { useState } from 'react'
import { PaStatusBadge } from '../components/Badge'

function assessVal(value) {
  if (!value) return <span style={{ color: 'var(--dim)', fontSize: 12 }}>--</span>

  const upper = value.toUpperCase()
  let color = '#64748b'
  let icon = ''

  if (['DONE', 'YES', 'COMPLETED'].some(token => upper.includes(token))) {
    color = '#22c55e'
    icon = '✓ '
  } else if (['IN-PROGRESS', 'IN PROGRESS', 'NOW SCHEDULED', 'REPORT IN PROGRESS'].some(token => upper.includes(token))) {
    color = '#f59e0b'
    icon = '◐ '
  } else if (['WAITING', 'TBD'].some(token => upper.includes(token))) {
    color = '#fb923c'
    icon = '◷ '
  } else if (['NO', 'DECLINED'].some(token => upper.includes(token))) {
    color = '#ef4444'
    icon = '✕ '
  }

  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{icon}{value}</span>
}

function sBdg(status) {
  const map = {
    Completed: '#22c55e',
    Done: '#22c55e',
    'In Progress': '#f59e0b',
    'Not Started': '#ef4444',
    'Awaiting Assignment': '#fb923c',
    Scheduled: '#f59e0b',
    'No Show': '#ef4444',
    Finalized: '#22c55e',
    'Draft Complete': '#6366f1',
    'In Review': '#6366f1',
    Written: '#22c55e',
  }
  const color = map[status] || '#64748b'
  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{status || '--'}</span>
}

const ALL_PA = ['All', 'Approved', 'In Review', 'Pending', 'Reauthorization Needed', 'Appeal Pending', 'Denied', 'No PA Needed', 'Approved/Discharged', 'Referred Out']
const TX_STATUSES = ['Not Started', 'In Progress', 'Draft Complete', 'In Review', 'Finalized']

function getAssessRecordId(record) {
  return record?.assessment_id || record?.id || null
}

function renderClientCell(record, secondaryText) {
  return (
    <>
      <div style={{ fontWeight: 700 }}>{record.client_name}</div>
      <div style={{ fontSize: 11, color: 'var(--dim)' }}>{secondaryText || ''}</div>
    </>
  )
}

function txColor(status) {
  if (['Finalized', 'Done', 'Completed'].includes(status)) return '#22c55e'
  if (['In Progress', 'In Review', 'Draft Complete'].includes(status)) return '#f59e0b'
  return '#ef4444'
}

export function AssessmentTracker({ assessData, assessLoading, onSelectAssess }) {
  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('ALL')
  const [paFilter, setPaFilter] = useState('All')

  if (assessLoading) {
    return <div className="loader-wrap"><div className="spinner" /><div style={{ color: 'var(--muted)' }}>Loading assessments...</div></div>
  }

  const src = assessData.map(record => ({
    ...record,
    client_name: record.client_name || record.name || '',
    clinic: record.clinic || record.office || '',
    assessment_id: record.assessment_id || record.id || null,
  }))

  const filtered = src.filter(record => {
    const name = (record.client_name || '').toLowerCase()
    const caregiver = (record.caregiver || '').toLowerCase()
    const query = search.toLowerCase()

    return (name.includes(query) || caregiver.includes(query))
      && (office === 'ALL' || record.clinic === office)
      && (paFilter === 'All' || record.pa_status === paFilter)
  })

  const approved = filtered.filter(record => ['Approved', 'No PA Needed', 'Approved/Discharged'].includes(record.pa_status)).length
  const inProgress = filtered.filter(record => (record.vineland || '').toLowerCase().includes('progress') || (record.direct_obs || '').toLowerCase().includes('progress')).length
  const denied = filtered.filter(record => ['Denied', 'Appeal Pending'].includes(record.pa_status)).length

  return (
    <>
      <div className="stats-row stats-4" style={{ marginBottom: 20 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#6366f1' }}>{filtered.length}</div><div className="stat-label">Total Clients</div><div className="stat-sub">showing</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{approved}</div><div className="stat-label">PA Approved</div><div className="stat-sub">incl. no PA needed</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{inProgress}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{denied}</div><div className="stat-label">Denied / Appealed</div></div>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search client or caregiver..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="filter-btns">
          {['ALL', 'MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT'].map(option => (
            <button key={option} className={`filter-btn ${office === option ? 'active' : ''}`} onClick={() => setOffice(option)}>{option}</button>
          ))}
        </div>
      </div>

      <div className="filter-row" style={{ marginTop: -8, marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>Prior Authorization:</span>
        <div className="filter-btns">
          {ALL_PA.map(status => (
            <button key={status} className={`filter-btn ${paFilter === status ? 'active' : ''}`} onClick={() => setPaFilter(status)} style={{ fontSize: 11 }}>{status}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Insurance</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>In School</th><th>Other Services</th><th>PA Status</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No clients match your filters.</td></tr>
                : filtered.map(record => (
                  <tr
                    key={record.assessment_id || record.client_name}
                    className="row-hover"
                    onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                    style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                  >
                    <td>{renderClientCell(record, record.caregiver)}</td>
                    <td><span className="office-pill">{record.clinic || '--'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
                    <td>{assessVal(record.vineland)}</td>
                    <td>{assessVal(record.srs2)}</td>
                    <td>{assessVal(record.parent_interview)}</td>
                    <td>{assessVal(record.direct_obs)}</td>
                    <td>{assessVal(record.in_school)}</td>
                    <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 140 }}>{record.other_services || '--'}</td>
                    <td><PaStatusBadge status={record.pa_status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export function ParentInterviewsPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const awaiting = assessData.filter(record => !record.parent_interview_status || record.parent_interview_status === 'Awaiting Assignment')
  const scheduled = assessData.filter(record => record.parent_interview_status === 'Scheduled')
  const completed = assessData.filter(record => record.parent_interview_status === 'Completed')
  const noShow = assessData.filter(record => record.parent_interview_status === 'No Show')

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Parent Interviews</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Schedule, track, and complete parent interviews for initial assessments</div>
      </div>
      <div className="stats-row stats-4" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#fb923c' }}>{awaiting.length}</div><div className="stat-label">Awaiting Assignment</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{scheduled.length}</div><div className="stat-label">Scheduled</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{completed.length}</div><div className="stat-label">Completed</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{noShow.length}</div><div className="stat-label">No Show</div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Interview Status</th><th>Scheduled Date</th><th>Completed Date</th><th>Insurance</th><th /></tr></thead>
            <tbody>
              {assessData.length === 0
                ? <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records found.</td></tr>
                : assessData.map(record => {
                  const canOpen = Boolean(getAssessRecordId(record))

                  return (
                    <tr key={record.assessment_id || record.client_name}>
                      <td>
                        {canOpen ? (
                          <button
                            type="button"
                            onClick={() => onSelectAssess(record)}
                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text)', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <div style={{ fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>{record.client_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--dim)' }}>{record.caregiver || ''}</div>
                          </button>
                        ) : (
                          renderClientCell(record, record.caregiver)
                        )}
                      </td>
                      <td><span className="office-pill">{record.clinic || record.office || '--'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                      <td>{sBdg(record.parent_interview_status || 'Awaiting Assignment')}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.parent_interview_scheduled_date ? '#a5b4fc' : 'var(--dim)' }}>{record.parent_interview_scheduled_date || '--'}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.parent_interview_completed_date ? '#22c55e' : 'var(--dim)' }}>{record.parent_interview_completed_date || '--'}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
                      <td style={{ color: 'var(--accent)' }}>{canOpen ? '→' : ''}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export function BCBAAssignmentsPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const unassigned = assessData.filter(record => !record.assigned_bcba)
  const byBCBA = {}

  assessData.filter(record => record.assigned_bcba).forEach(record => {
    if (!byBCBA[record.assigned_bcba]) byBCBA[record.assigned_bcba] = { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
    byBCBA[record.assigned_bcba].total += 1
    if (record.assessment_status === 'Completed') byBCBA[record.assigned_bcba].completed += 1
    else if (record.assessment_status === 'In Progress') byBCBA[record.assigned_bcba].inProgress += 1
    else byBCBA[record.assigned_bcba].notStarted += 1
  })

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>BCBA Assignments</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Caseload distribution and assignment tracking across BCBAs</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#6366f1' }}>{assessData.length}</div><div className="stat-label">Total Clients</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{unassigned.length}</div><div className="stat-label">Unassigned</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{Object.keys(byBCBA).length}</div><div className="stat-label">Active BCBAs</div></div>
      </div>

      {Object.keys(byBCBA).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
          {Object.entries(byBCBA).map(([bcba, stats]) => (
            <div key={bcba} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{bcba}</div>
                <span className="bdg" style={{ background: '#6366f120', color: '#a5b4fc', border: '1px solid #6366f130' }}>{stats.total} clients</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="info-row"><span className="info-label">Completed</span><span style={{ color: '#22c55e', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.completed}</span></div>
                <div className="info-row"><span className="info-label">In Progress</span><span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.inProgress}</span></div>
                <div className="info-row" style={{ border: 'none' }}><span className="info-label">Not Started</span><span style={{ color: '#ef4444', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.notStarted}</span></div>
              </div>
              <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 4, height: 6 }}>
                <div style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%`, height: 6, borderRadius: 4, background: '#22c55e', transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4, textAlign: 'right' }}>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% complete</div>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Unassigned Clients ({unassigned.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Office</th><th>Assessment Status</th><th>PA Status</th><th>Insurance</th><th /></tr></thead>
                <tbody>
                  {unassigned.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.caregiver)}</td>
                      <td><span className="office-pill">{record.clinic || '--'}</span></td>
                      <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={record.pa_status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
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

export function AssessmentProgressPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const notStarted = assessData.filter(record => !record.assessment_status || record.assessment_status === 'Not Started')
  const inProgress = assessData.filter(record => record.assessment_status === 'In Progress')
  const completed = assessData.filter(record => record.assessment_status === 'Completed')

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Assessment Progress</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track Vineland, SRS-2, observations, and overall assessment completion</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{notStarted.length}</div><div className="stat-label">Not Started</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{inProgress.length}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{completed.length}</div><div className="stat-label">Completed</div></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {assessData.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                >
                  <td>{renderClientCell(record, record.clinic)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: 11 }}>Unassigned</span>}</td>
                  <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                  <td>{assessVal(record.vineland)}</td>
                  <td>{assessVal(record.srs2)}</td>
                  <td>{sBdg(record.parent_interview_status || 'Awaiting Assignment')}</td>
                  <td>{assessVal(record.direct_obs)}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{record.assessment_started_date || '--'}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.assessment_completed_date ? '#22c55e' : 'var(--dim)' }}>{record.assessment_completed_date || '--'}</td>
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

export function TreatmentPlansPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const byStatus = {}
  TX_STATUSES.forEach(status => {
    byStatus[status] = assessData.filter(record => (record.treatment_plan_status || 'Not Started') === status).length
  })

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Treatment Plan Status</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track treatment plan drafting, completion, and finalization</div>
      </div>
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 22 }}>
        {TX_STATUSES.map(status => (
          <div key={status} className="stat-box">
            <div className="stat-num" style={{ color: txColor(status) }}>{byStatus[status] || 0}</div>
            <div className="stat-label">{status}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {assessData.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                >
                  <td>{renderClientCell(record, record.clinic)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                  <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                  <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                  <td>{sBdg(record.authorization_status || record.pa_status || 'Not Submitted')}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{record.treatment_plan_started_date || '--'}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.treatment_plan_completed_date ? '#22c55e' : 'var(--dim)' }}>{record.treatment_plan_completed_date || '--'}</td>
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

export function ReadyForServicesPage({ assessData, assessLoading, onSelectAssess }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const ready = assessData.filter(record => record.ready_for_services === true)
  const almostAuth = assessData.filter(record =>
    record.assessment_status === 'Completed'
    && !['Approved'].includes(record.authorization_status || record.pa_status || '')
    && !record.ready_for_services
  )
  const notReady = assessData.filter(record => !record.ready_for_services && !almostAuth.includes(record))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Ready for Services</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Clients who have completed all pre-service requirements</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <div className="stat-box"><div className="stat-num" style={{ color: '#22c55e' }}>{ready.length}</div><div className="stat-label">Ready for Services</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#f59e0b' }}>{almostAuth.length}</div><div className="stat-label">Awaiting Authorization</div></div>
        <div className="stat-box"><div className="stat-num" style={{ color: '#ef4444' }}>{notReady.length}</div><div className="stat-label">Not Ready</div></div>
      </div>

      {ready.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Ready for Services ({ready.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Authorization</th><th>Auth Approved</th><th>Active Date</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {ready.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#22c55e' }}>{record.client_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--dim)' }}>{record.clinic || ''}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td><PaStatusBadge status={record.authorization_status || record.pa_status} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#a5b4fc' }}>{record.authorization_approved_date || record.pa_decision_date || '--'}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.active_client_date ? '#22c55e' : '#fb923c' }}>{record.active_client_date || 'Pending'}</td>
                      <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 160 }}>{record.notes || '--'}</td>
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
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Awaiting Authorization ({almostAuth.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Submitted</th><th /></tr></thead>
                <tbody>
                  {almostAuth.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.clinic)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                      <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={record.authorization_status || record.pa_status || 'Not Submitted'} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--dim)' }}>{record.authorization_submitted_date || '--'}</td>
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
