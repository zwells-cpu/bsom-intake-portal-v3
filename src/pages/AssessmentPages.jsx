import { useState } from 'react'
import { PaStatusBadge } from '../components/Badge'
import { ActiveFilterBanner, ClickableStatCard } from '../components/StatFilterControls'
import { isStatFilterTarget, matchesStatFilter, toggleStatFilter } from '../lib/statFilters'
import { getAssessmentRecordId, getAuthorizationStatus, normalizeTreatmentPlanStatus } from '../lib/utils'

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
  const normalizedStatus = normalizeTreatmentPlanStatus(status)
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
  const color = map[normalizedStatus] || '#64748b'
  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{normalizedStatus || '--'}</span>
}

const ALL_PA = ['All', 'Approved', 'In Review', 'Pending', 'Reauthorization Needed', 'Appeal Pending', 'Denied', 'No PA Needed', 'Approved/Discharged', 'Referred Out']
const TX_STATUSES = ['Not Started', 'In Progress', 'Finalized']

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
  if (['In Progress'].includes(status)) return '#f59e0b'
  return '#ef4444'
}

function getAssessmentPageFilter(statFilter, onSetStatFilter, target) {
  const activeFilter = isStatFilterTarget(statFilter, target)
  const toggleFilter = (key, label) => onSetStatFilter(toggleStatFilter(activeFilter, { target, key, label }))
  return { activeFilter, toggleFilter }
}

export function AssessmentTracker({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
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
    assessment_id: getAssessmentRecordId(record),
    authorization_status: getAuthorizationStatus(record),
  }))

  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'assessment-tracker')

  const filtered = src.filter(record => {
    const name = (record.client_name || '').toLowerCase()
    const caregiver = (record.caregiver || '').toLowerCase()
    const query = search.toLowerCase()

    return (name.includes(query) || caregiver.includes(query))
      && (office === 'ALL' || (record.clinic || '').toUpperCase() === office)
      && (paFilter === 'All' || record.authorization_status === paFilter)
      && matchesStatFilter(record, activeFilter)
  })

  const approved = filtered.filter(record => ['Approved', 'No PA Needed', 'Approved/Discharged'].includes(record.authorization_status)).length
  const inProgress = filtered.filter(record => record.assessment_status === 'In Progress').length
  const denied = filtered.filter(record => ['Denied', 'Appeal Pending'].includes(record.authorization_status)).length
  return (
    <>
      <div className="stats-row stats-4" style={{ marginBottom: 20 }}>
        <ClickableStatCard value={filtered.length} label="Total Clients" color="#6366f1" sublabel="showing" active={activeFilter?.key === 'all'} onClick={() => toggleFilter('all', 'Assessment Tracker: All Clients')} />
        <ClickableStatCard value={approved} label="PA Approved" color="#22c55e" sublabel="incl. no PA needed" active={activeFilter?.key === 'pa-approved'} onClick={() => toggleFilter('pa-approved', 'Assessment Tracker: PA Approved')} />
        <ClickableStatCard value={inProgress} label="In Progress" color="#f59e0b" active={activeFilter?.key === 'in-progress'} onClick={() => toggleFilter('in-progress', 'Assessment Tracker: In Progress')} />
        <ClickableStatCard value={denied} label="Denied / Appealed" color="#ef4444" active={activeFilter?.key === 'denied-appealed'} onClick={() => toggleFilter('denied-appealed', 'Assessment Tracker: Denied / Appealed')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered assessment records" />

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
            <thead><tr><th>Client</th><th>Clinic</th><th>Insurance</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>In School</th><th>Other Services</th><th>PA Status</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No clients match your filters.</td></tr>
                : filtered.map(record => (
                  <tr
                    key={record.assessment_id || record.client_name}
                    className="row-hover"
                    onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                    style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                  >
                    <td>{renderClientCell(record, record.caregiver)}</td>
                    <td><span className="office-pill">{record.clinic || '--'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
                    <td>{assessVal(record.vineland)}</td>
                    <td>{assessVal(record.srs2)}</td>
                    <td>{sBdg(record.parent_interview_status || 'Awaiting Assignment')}</td>
                    <td>{assessVal(record.direct_obs)}</td>
                    <td>{assessVal(record.in_school)}</td>
                    <td style={{ fontSize: 11, color: record.other_services ? 'var(--muted)' : 'var(--dim)', maxWidth: 140 }}>{record.other_services || '--'}</td>
                    <td><PaStatusBadge status={record.authorization_status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export function ParentInterviewsPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const awaiting = assessData.filter(record => !record.parent_interview_status || record.parent_interview_status === 'Awaiting Assignment')
  const scheduled = assessData.filter(record => record.parent_interview_status === 'Scheduled')
  const completed = assessData.filter(record => record.parent_interview_status === 'Completed')
  const noShow = assessData.filter(record => record.parent_interview_status === 'No Show')
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'parent-interviews')
  const filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Parent Interviews</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Schedule, track, and complete parent interviews for initial assessments</div>
      </div>
      <div className="stats-row stats-4" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={awaiting.length} label="Awaiting Assignment" color="#fb923c" active={activeFilter?.key === 'awaiting-assignment'} onClick={() => toggleFilter('awaiting-assignment', 'Parent Interviews: Awaiting Assignment')} />
        <ClickableStatCard value={scheduled.length} label="Scheduled" color="#f59e0b" active={activeFilter?.key === 'scheduled'} onClick={() => toggleFilter('scheduled', 'Parent Interviews: Scheduled')} />
        <ClickableStatCard value={completed.length} label="Completed" color="#22c55e" active={activeFilter?.key === 'completed'} onClick={() => toggleFilter('completed', 'Parent Interviews: Completed')} />
        <ClickableStatCard value={noShow.length} label="No Show" color="#ef4444" active={activeFilter?.key === 'no-show'} onClick={() => toggleFilter('no-show', 'Parent Interviews: No Show')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered parent interviews" />

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Interview Status</th><th>Scheduled Date</th><th>Completed Date</th><th>Insurance</th><th /></tr></thead>
            <tbody>
              {filteredRows.length === 0
                ? <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records found.</td></tr>
                : filteredRows.map(record => {
                  const canOpen = Boolean(getAssessmentRecordId(record))

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

export function BCBAAssignmentsPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const unassigned = assessData.filter(record => !record.assigned_bcba)
  const assigned = assessData.filter(record => record.assigned_bcba)
  const byBCBA = {}
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'bcba-assignments')
  const filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  assigned.forEach(record => {
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
        <ClickableStatCard value={assessData.length} label="Total Clients" color="#6366f1" active={activeFilter?.key === 'all'} onClick={() => toggleFilter('all', 'BCBA Assignments: All Clients')} />
        <ClickableStatCard value={unassigned.length} label="Unassigned" color="#ef4444" active={activeFilter?.key === 'unassigned'} onClick={() => toggleFilter('unassigned', 'BCBA Assignments: Unassigned')} />
        <ClickableStatCard value={Object.keys(byBCBA).length} label="Active BCBAs" color="#22c55e" active={activeFilter?.key === 'assigned'} onClick={() => toggleFilter('assigned', 'BCBA Assignments: Assigned to BCBA')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered BCBA assignments" />

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

      <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: activeFilter?.key === 'unassigned' ? '#ef4444' : activeFilter?.key === 'assigned' ? '#22c55e' : '#a5b4fc' }}>
        {activeFilter?.key === 'unassigned'
          ? `Unassigned Clients (${filteredRows.length})`
          : activeFilter?.key === 'assigned'
            ? `Assigned Clients (${filteredRows.length})`
            : `All Clients (${filteredRows.length})`}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Assessment Status</th><th>PA Status</th><th>Insurance</th><th /></tr></thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records match the current filter.</td></tr>
              ) : filteredRows.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                >
                  <td>{renderClientCell(record, record.caregiver)}</td>
                  <td><span className="office-pill">{record.clinic || '--'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                  <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                  <td><PaStatusBadge status={getAuthorizationStatus(record)} /></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
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

export function AssessmentProgressPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const notStarted = assessData.filter(record => !record.assessment_status || record.assessment_status === 'Not Started')
  const inProgress = assessData.filter(record => record.assessment_status === 'In Progress')
  const completed = assessData.filter(record => record.assessment_status === 'Completed')
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'assessment-progress')
  const filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Assessment Progress</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track Vineland, SRS-2, observations, and overall assessment completion</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={notStarted.length} label="Not Started" color="#ef4444" active={activeFilter?.key === 'not-started'} onClick={() => toggleFilter('not-started', 'Assessment Progress: Not Started')} />
        <ClickableStatCard value={inProgress.length} label="In Progress" color="#f59e0b" active={activeFilter?.key === 'in-progress'} onClick={() => toggleFilter('in-progress', 'Assessment Progress: In Progress')} />
        <ClickableStatCard value={completed.length} label="Completed" color="#22c55e" active={activeFilter?.key === 'completed'} onClick={() => toggleFilter('completed', 'Assessment Progress: Completed')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered assessment progress records" />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Vineland</th><th>SRS-2</th><th>Parent Interview</th><th>Direct Obs.</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records match the current filter.</td></tr>
              ) : filteredRows.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
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

export function TreatmentPlansPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const normalizedRecords = assessData.map(record => ({
    ...record,
    treatment_plan_status: normalizeTreatmentPlanStatus(record.treatment_plan_status),
  }))

  const byStatus = {}
  TX_STATUSES.forEach(status => {
    byStatus[status] = normalizedRecords.filter(record => record.treatment_plan_status === status).length
  })

  const activeFilter = isStatFilterTarget(statFilter, 'treatment-plans')
  const filteredRecords = !activeFilter
    ? normalizedRecords
    : normalizedRecords.filter(record => matchesStatFilter(record, activeFilter))
  const toggleFilter = (status) => onSetStatFilter(toggleStatFilter(activeFilter, { target: 'treatment-plans', key: status, label: `Treatment Plans: ${status}` }))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Treatment Plan Status</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Track treatment plan drafting, completion, and finalization</div>
      </div>
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 12 }}>
        {TX_STATUSES.map(status => (
          <ClickableStatCard
            key={status}
            value={byStatus[status] || 0}
            label={status}
            color={txColor(status)}
            active={activeFilter?.key === status}
            onClick={() => toggleFilter(status)}
          />
        ))}
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered treatment plans" />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Started</th><th>Completed</th><th /></tr></thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No treatment plans match the current filter.</td></tr>
              ) : filteredRecords.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                >
                  <td>{renderClientCell(record, record.clinic)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                  <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                  <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                  <td>{sBdg(getAuthorizationStatus(record) || 'Not Submitted')}</td>
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

export function ReadyForServicesPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const ready = assessData.filter(record => record.ready_for_services === true)
  const almostAuth = assessData.filter(record =>
    record.assessment_status === 'Completed'
    && !['Approved'].includes(getAuthorizationStatus(record))
    && !record.ready_for_services
  )
  const notReady = assessData.filter(record => !record.ready_for_services && !almostAuth.includes(record))
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'ready-for-services')
  const readyRows = ready.filter(record => matchesStatFilter(record, activeFilter))
  const almostAuthRows = almostAuth.filter(record => matchesStatFilter(record, activeFilter))
  const notReadyRows = notReady.filter(record => matchesStatFilter(record, activeFilter))

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Ready for Services</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Clients who have completed all pre-service requirements</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={ready.length} label="Ready for Services" color="#22c55e" active={activeFilter?.key === 'ready'} onClick={() => toggleFilter('ready', 'Ready for Services')} />
        <ClickableStatCard value={almostAuth.length} label="Awaiting Authorization" color="#f59e0b" active={activeFilter?.key === 'awaiting-authorization'} onClick={() => toggleFilter('awaiting-authorization', 'Ready for Services: Awaiting Authorization')} />
        <ClickableStatCard value={notReady.length} label="Not Ready" color="#ef4444" active={activeFilter?.key === 'not-ready'} onClick={() => toggleFilter('not-ready', 'Ready for Services: Not Ready')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered service-readiness records" />

      {readyRows.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Ready for Services ({readyRows.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Authorization</th><th>Auth Approved</th><th>Active Date</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {readyRows.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#22c55e' }}>{record.client_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--dim)' }}>{record.clinic || ''}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record)} /></td>
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

      {almostAuthRows.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Awaiting Authorization ({almostAuthRows.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Submitted</th><th /></tr></thead>
                <tbody>
                  {almostAuthRows.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.clinic)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                      <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record) || 'Not Submitted'} /></td>
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

      {activeFilter && readyRows.length === 0 && almostAuthRows.length === 0 && notReadyRows.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--dim)' }}>
          No service-readiness records match the current filter.
        </div>
      )}

      {notReadyRows.length > 0 && activeFilter?.key === 'not-ready' && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Not Ready ({notReadyRows.length})</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment</th><th>Treatment Plan</th><th>Authorization</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {notReadyRows.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.clinic)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td>{sBdg(record.assessment_status || 'Not Started')}</td>
                      <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record) || 'Not Submitted'} /></td>
                      <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 180 }}>{record.notes || '--'}</td>
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
