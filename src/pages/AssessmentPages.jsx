import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  CircleDashed,
  Clock,
  ClipboardCheck,
  Eye,
  FilePlus2,
  PhoneCall,
  ClockAlert,
  UserPlus,
} from 'lucide-react'
import { PaStatusBadge } from '../components/Badge'
import { NotifyModal } from '../components/NotifyModal'
import { ActiveFilterBanner, ClickableStatCard } from '../components/StatFilterControls'
import { SyncedHorizontalScrollTable } from '../components/SyncedHorizontalScrollTable'
import { LIFECYCLE_BADGE_STYLES } from '../lib/constants'
import { cleanLookupValue, createBcbaStaff, deactivateBcbaStaff, getBcbaStaffRecords, normalizeLookupValue, optionValues, updateBcbaStaff } from '../lib/lookups'
import { isStatFilterTarget, matchesStatFilter, toggleStatFilter } from '../lib/statFilters'
import {
  AUTHORIZATION_STATUSES,
  TREATMENT_PLAN_STATUSES,
  formatDate,
  formatDisplayDate,
  getAssessmentLifecycleStatus,
  getAssessmentRecordId,
  getAssessmentWorkflowProgress,
  getAssessmentWorkflowStatus,
  getAuthorizationStatus,
  isAssessmentActiveClient,
  isAuthorizationApproved,
  normalizeAssessmentComponentStatus,
  normalizeAuthorizationStatus,
  normalizeParentInterviewStatus,
  normalizeTreatmentPlanStatus,
  statusColor,
} from '../lib/utils'

function assessVal(value) {
  const normalized = normalizeAssessmentComponentStatus(value)
  if (!normalized) return <span style={{ color: 'var(--dim)', fontSize: 12 }}>--</span>

  const color = statusColor(normalized)
  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{normalized}</span>
}

function simpleValueBadge(value) {
  if (!value) return <span style={{ color: 'var(--dim)', fontSize: 12 }}>--</span>
  const normalized = String(value).trim()
  const color = normalized.toUpperCase() === 'YES' ? '#22c55e' : normalized.toUpperCase() === 'NO' ? '#ef4444' : '#64748b'
  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{normalized}</span>
}

function sBdg(status) {
  const normalizedStatus = status || 'Not Started'
  const map = {
    Completed: '#22c55e',
    'In Progress': '#f59e0b',
    'Not Started': '#ef4444',
    Scheduled: '#f59e0b',
    'No Show': '#ef4444',
    Finalized: '#22c55e',
    'Awaiting Assignment': '#3b82f6',
  }
  const color = map[normalizedStatus] || '#64748b'
  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{normalizedStatus || '--'}</span>
}

function paStatus(status) {
  return <PaStatusBadge status={status} />
}

function isTrackedAssessmentComplete(value) {
  return normalizeAssessmentComponentStatus(value) === 'Completed'
}

function getAssessmentProgressFields(record) {
  return {
    vineland: record?.vineland || '',
    srs2: record?.srs2 || '',
    vbmapp: record?.vbmapp || '',
    sociallySavvy: record?.socially_savvy || '',
  }
}

function getAssessmentProgressPercent(record) {
  const trackedValues = Object.values(getAssessmentProgressFields(record))
  const completedCount = trackedValues.filter(isTrackedAssessmentComplete).length
  return `${completedCount * 25}%`
}

const ALL_PA = ['All', ...AUTHORIZATION_STATUSES]
const TX_STATUSES = TREATMENT_PLAN_STATUSES
const PA_FILTER_LABELS = {
  'Pending Submission': 'Pending',
  'Submitted / In Review': 'In Review',
  'Partially Approved': 'Partial',
  'Approved / Discharged': 'Discharged',
  'Approved/Discharged': 'Discharged',
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
  return statusColor(status)
}

function lifecycleBadge(status) {
  const style = LIFECYCLE_BADGE_STYLES[status] || {
    color: '#64748b',
    background: '#64748b20',
    border: '#64748b35',
  }

  return <span className="bdg" style={{ background: style.background, color: style.color, border: `1px solid ${style.border}` }}>{status}</span>
}

function isParentInterviewComplete(record) {
  return normalizeParentInterviewStatus(record?.parent_interview_status) === 'Completed'
    || Boolean(record?.parent_interview_completed_date)
}

function isParentInterviewScheduled(record) {
  return isParentInterviewComplete(record)
    || normalizeParentInterviewStatus(record?.parent_interview_status) === 'Scheduled'
    || Boolean(record?.parent_interview_scheduled_date)
}

function isDirectObservationComplete(record) {
  return normalizeAssessmentComponentStatus(record?.direct_obs_status || record?.direct_obs) === 'Completed'
    || Boolean(record?.direct_obs_completed_date)
}

function isDirectObservationScheduled(record) {
  return isDirectObservationComplete(record)
    || normalizeAssessmentComponentStatus(record?.direct_obs_status || record?.direct_obs) === 'Scheduled'
    || Boolean(record?.direct_obs_scheduled_date)
}

function getAssessmentReferenceDate(record) {
  return record?.date_received
    || record?.created_at
    || record?.assessment_created_at
    || record?.updated_at
    || record?.parent_interview_scheduled_date
    || record?.treatment_plan_started_date
    || null
}

function getDaysSinceAssessmentReference(record) {
  const rawDate = getAssessmentReferenceDate(record)
  if (!rawDate) return 0
  const timestamp = new Date(rawDate).getTime()
  if (Number.isNaN(timestamp)) return 0
  return Math.floor((Date.now() - timestamp) / 86400000)
}

function isAssessmentStalled(record) {
  return getDaysSinceAssessmentReference(record) > 14
    && getAssessmentWorkflowStatus(record) !== 'Completed'
    && getAssessmentLifecycleStatus(record) !== 'Referred Out'
    && !isAssessmentActiveClient(record)
}

function needsParentFollowUp(record) {
  const status = normalizeParentInterviewStatus(record?.parent_interview_status)
  return !isParentInterviewComplete(record)
    && (!isParentInterviewScheduled(record) || ['No Show', 'Not Started', 'Awaiting Assignment'].includes(status))
}

function needsDirectObservation(record) {
  return isParentInterviewScheduled(record) && !isDirectObservationScheduled(record)
}

function isReadyForBcbaReview(record) {
  return getAssessmentWorkflowStatus(record) === 'Completed'
    && ['Not Started', ''].includes(normalizeTreatmentPlanStatus(record?.treatment_plan_status))
    && getAssessmentLifecycleStatus(record) !== 'Referred Out'
}

function isMissingAssessmentDocuments(record) {
  return !record?.vineland || !record?.srs2 || !record?.vbmapp || !record?.socially_savvy
}

function getNextBlocker(record) {
  if (!isParentInterviewScheduled(record)) return 'Parent interview needed'
  if (!isDirectObservationScheduled(record)) return 'Direct observation needed'
  if (getAssessmentWorkflowStatus(record) !== 'Completed') return 'Assessment completion needed'
  if (['Not Started', ''].includes(normalizeTreatmentPlanStatus(record?.treatment_plan_status))) return 'Ready for BCBA review'
  if (!['Submitted / In Review', 'Approved', 'Partially Approved', 'No PA Needed', 'Approved/Discharged', 'Approved / Discharged'].includes(getAuthorizationStatus(record))) return 'Authorization needed'
  return 'No blocker'
}

function blockerTone(label) {
  if (label === 'No blocker') return 'green'
  if (label === 'Ready for BCBA review') return 'blue'
  if (label === 'Authorization needed') return 'yellow'
  return 'orange'
}

function getAssessmentPageFilter(statFilter, onSetStatFilter, target) {
  const activeFilter = isStatFilterTarget(statFilter, target)
  const toggleFilter = (key, label) => onSetStatFilter(toggleStatFilter(activeFilter, { target, key, label }))
  return { activeFilter, toggleFilter }
}

export function AssessmentTracker({ assessData, assessLoading, onSelectAssess, onNewAssessment, statFilter, onSetStatFilter, onClearStatFilter }) {
  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('ALL')
  const [paFilter, setPaFilter] = useState('All')

  if (assessLoading) {
    return <div className="loader-wrap"><div className="spinner" /><div style={{ color: 'var(--muted)' }}>Loading assessments...</div></div>
  }

  const src = (assessData || []).map(record => ({
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
      && (paFilter === 'All' || normalizeAuthorizationStatus(record.authorization_status) === paFilter)
      && matchesStatFilter(record, activeFilter)
  })

  const approved = filtered.filter(record => record.authorization_status === 'Approved').length
  const readyInterview = filtered.filter(record => isParentInterviewScheduled(record) && !isParentInterviewComplete(record))
  const parentFollowUp = filtered.filter(needsParentFollowUp)
  const directObservationNeeded = filtered.filter(needsDirectObservation)
  const readyForBcbaReview = filtered.filter(isReadyForBcbaReview)
  const stalledAssessments = filtered.filter(isAssessmentStalled)
  const waitingOnBcba = filtered.filter(record => Boolean(record.assigned_bcba) && isReadyForBcbaReview(record))
  const missingDocuments = filtered.filter(isMissingAssessmentDocuments)
  const completedRows = filtered.filter(record => getAssessmentWorkflowStatus(record) === 'Completed').slice(0, 6)
  const actionBuckets = [
    {
      key: 'ready-interview',
      label: 'Ready for Interview',
      helper: 'Parent interview is scheduled and ready to complete.',
      count: readyInterview.length,
      color: '#22c55e',
      Icon: CalendarCheck,
    },
    {
      key: 'parent-follow-up',
      label: 'Parent Follow-Up Needed',
      helper: 'Needs scheduling, outreach, or parent response.',
      count: parentFollowUp.length,
      color: '#f59e0b',
      Icon: PhoneCall,
    },
    {
      key: 'direct-observation',
      label: 'Direct Observation Needed',
      helper: 'Parent step is moving, direct observation is next.',
      count: directObservationNeeded.length,
      color: '#fb923c',
      Icon: Eye,
    },
    {
      key: 'bcba-review',
      label: 'Ready for BCBA Review',
      helper: 'Assessment work is complete and ready for plan review.',
      count: readyForBcbaReview.length,
      color: '#6366f1',
      Icon: ClipboardCheck,
    },
    {
      key: 'stalled',
      label: 'Stalled Over 14 Days',
      helper: 'Older assessment records that need intervention.',
      count: stalledAssessments.length,
      color: '#ef4444',
      Icon: ClockAlert,
    },
  ]
  const bottlenecks = [
    { key: 'parent-follow-up', label: 'Waiting on Parent', count: parentFollowUp.length, tone: 'yellow' },
    { key: 'waiting-bcba', label: 'Waiting on BCBA', count: waitingOnBcba.length, tone: 'blue' },
    { key: 'missing-documents', label: 'Missing Documents', count: missingDocuments.length, tone: 'orange' },
    { key: 'stalled', label: 'Stalled Assessments', count: stalledAssessments.length, tone: 'red' },
    { key: 'bcba-review', label: 'Ready for Review', count: readyForBcbaReview.length, tone: 'green' },
  ]

  return (
    <>
      <div className="pg-hdr assessment-board-header">
        <div>
          <div className="pg-hdr-title">Initial Assessment Board</div>
          <div className="pg-hdr-sub">Track clinical assessment movement, blockers, and readiness for BCBA review.</div>
        </div>
        <button type="button" className="btn-save assessment-board-new-btn" onClick={onNewAssessment}>
          <FilePlus2 size={16} />
          New Initial Assessment
        </button>
      </div>
      <div className="assessment-command-grid">
        {actionBuckets.map(({ key, label, helper, count, color, Icon }) => (
          <button
            key={key}
            type="button"
            className={`assessment-action-bucket ${activeFilter?.key === key ? 'is-active' : ''}`}
            style={{ '--bucket-color': color }}
            onClick={() => toggleFilter(key, `Assessment Tracker: ${label}`)}
          >
            <span className="assessment-action-icon"><Icon size={20} /></span>
            <span className="assessment-action-copy">
              <span className="assessment-action-count">{count}</span>
              <span className="assessment-action-label">{label}</span>
              <span className="assessment-action-helper">{helper}</span>
            </span>
          </button>
        ))}
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered assessment records" />

      <div className="filter-row assessment-primary-controls">
        <div className="search-wrap assessment-search-group">
          <input className="search-input" placeholder="Search client or caregiver..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="filter-divider"></div>
        <div className="filter-btns assessment-clinic-filter-group">
          {['ALL', 'MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT'].map(option => (
            <button key={option} className={`filter-btn ${office === option ? 'active' : ''}`} onClick={() => setOffice(option)}>{option}</button>
          ))}
        </div>
        <div className="filter-divider"></div>
        <div className="assessment-pa-select-group">
          <span>Prior Authorization</span>
          <select value={paFilter} onChange={event => setPaFilter(event.target.value)} aria-label="Prior Authorization">
            {ALL_PA.map(status => (
              <option key={status} value={status}>{PA_FILTER_LABELS[status] || status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="work-queue-header">
        <div>
          <div className="work-queue-eyebrow">Clinical Workflow</div>
          <div className="work-queue-title">Assessment Work Queue</div>
          <div className="work-queue-subtitle">{filtered.length} clients in the current view. {approved} authorization approvals recorded.</div>
        </div>
      </div>

      <div className="assessment-command-layout">
        <section className="assessment-work-queue">
          <div className="work-queue-card assessment-work-queue-card">
            <SyncedHorizontalScrollTable>
              <table className="work-queue-table assessment-work-table">
                <thead><tr><th>Client</th><th>Clinic</th><th>Assigned BCBA</th><th>Parent Interview</th><th>Direct Observation</th><th>Assessment Status</th><th>Next Blocker</th><th>Next Step</th></tr></thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={8} className="assessment-empty-row">No clients match your filters.</td></tr>
                    : filtered.map(record => {
                      const canOpen = Boolean(getAssessmentRecordId(record))
                      const blocker = getNextBlocker(record)
                      return (
                        <tr
                          key={record.assessment_id || record.client_name}
                          className={canOpen ? 'row-hover' : ''}
                          onClick={() => canOpen && onSelectAssess(record)}
                          style={{ cursor: canOpen ? 'pointer' : 'default' }}
                        >
                          <td>
                            <div className="work-queue-client-name">{record.client_name || '--'}</div>
                            <div className="work-queue-client-date">{record.caregiver || 'Caregiver not listed'}</div>
                          </td>
                          <td><span className="office-pill">{record.clinic || '--'}</span></td>
                          <td><span className="assessment-bcba-cell">{record.assigned_bcba || 'Unassigned'}</span></td>
                          <td>{sBdg(normalizeParentInterviewStatus(record.parent_interview_status))}</td>
                          <td>{assessVal(record.direct_obs_status || record.direct_obs)}</td>
                          <td>{lifecycleBadge(getAssessmentLifecycleStatus(record))}</td>
                          <td><span className={`assessment-blocker-pill assessment-blocker-${blockerTone(blocker)}`}>{blocker}</span></td>
                          <td>
                            {canOpen ? (
                              <button
                                type="button"
                                className="work-queue-action assessment-open-action"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onSelectAssess(record)
                                }}
                              >
                                Open Client <ArrowRight size={14} />
                              </button>
                            ) : '--'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </SyncedHorizontalScrollTable>
          </div>
        </section>

        <aside className="assessment-bottlenecks-panel">
          <div className="assessment-side-head">
            <div>
              <div className="work-queue-eyebrow">Operational Focus</div>
              <div className="assessment-side-title">Clinical Bottlenecks</div>
            </div>
            <span className="assessment-side-icon"><AlertCircle size={18} /></span>
          </div>
          <div className="assessment-bottleneck-list">
            {bottlenecks.map(item => (
              <button
                key={item.key}
                type="button"
                className={`assessment-bottleneck-row assessment-bottleneck-${item.tone} ${activeFilter?.key === item.key ? 'is-active' : ''}`}
                onClick={() => toggleFilter(item.key, `Assessment Tracker: ${item.label}`)}
              >
                <span>{item.label}</span>
                <strong>{item.count}</strong>
                <small>Review</small>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {completedRows.length > 0 && (
        <section className="assessment-completed-section">
          <div className="work-queue-header">
            <div>
              <div className="work-queue-eyebrow">Recently Completed</div>
              <div className="work-queue-title">Completed Assessment Movement</div>
              <div className="work-queue-subtitle">Secondary view of completed assessment records in the current filter.</div>
            </div>
          </div>
          <div className="assessment-completed-list">
            {completedRows.map(record => (
              <button
                key={record.assessment_id || record.client_name}
                type="button"
                className="assessment-completed-row"
                onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
              >
                <span>
                  <strong>{record.client_name || '--'}</strong>
                  <small>{record.clinic || '--'} / {record.assigned_bcba || 'Unassigned'}</small>
                </span>
                {lifecycleBadge(getAssessmentLifecycleStatus(record))}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export function ParentInterviewsPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('All')

  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const awaitingAssignment = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'Awaiting Assignment')
  const notStarted = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'Not Started')
  const scheduled = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'Scheduled')
  const inProgress = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'In Progress')
  const completed = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'Completed')
  const noShow = assessData.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === 'No Show')
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'parent-interviews')
  let filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  // Apply additional filters
  if (search) {
    const lowerSearch = search.toLowerCase()
    filteredRows = filteredRows.filter(record =>
      (record.client_name || '').toLowerCase().includes(lowerSearch) ||
      (record.caregiver || '').toLowerCase().includes(lowerSearch)
    )
  }
  if (office !== 'ALL') {
    filteredRows = filteredRows.filter(record => (record.clinic || record.office || '').toUpperCase() === office)
  }
  if (statusFilter !== 'All') {
    filteredRows = filteredRows.filter(record => normalizeParentInterviewStatus(record.parent_interview_status) === statusFilter)
  }

  const openAssessment = (record) => {
    if (!getAssessmentRecordId(record)) return
    onSelectAssess(record)
  }

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Parent Interviews</div>
        <div className="pg-hdr-sub">Schedule, track, and complete parent interviews and direct observations.</div>
      </div>
      <div className="stats-row stats-6" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={awaitingAssignment.length} label="Awaiting Assignment" color="#3b82f6" icon={UserPlus} active={activeFilter?.key === 'awaiting-assignment'} onClick={() => toggleFilter('awaiting-assignment', 'Parent Interviews: Awaiting Assignment')} />
        <ClickableStatCard value={notStarted.length} label="Not Started" color="#ef4444" icon={CircleDashed} active={activeFilter?.key === 'not-started'} onClick={() => toggleFilter('not-started', 'Parent Interviews: Not Started')} />
        <ClickableStatCard value={scheduled.length} label="Scheduled" color="#f59e0b" icon={CalendarClock} active={activeFilter?.key === 'scheduled'} onClick={() => toggleFilter('scheduled', 'Parent Interviews: Scheduled')} />
        <ClickableStatCard value={inProgress.length} label="In Progress" color="#f59e0b" icon={Clock} active={activeFilter?.key === 'in-progress'} onClick={() => toggleFilter('in-progress', 'Parent Interviews: In Progress')} />
        <ClickableStatCard value={completed.length} label="Completed" color="#22c55e" icon={CheckCircle} active={activeFilter?.key === 'completed'} onClick={() => toggleFilter('completed', 'Parent Interviews: Completed')} />
        <ClickableStatCard value={noShow.length} label="No Show" color="#ef4444" icon={AlertCircle} active={activeFilter?.key === 'no-show'} onClick={() => toggleFilter('no-show', 'Parent Interviews: No Show')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered parent interviews" />

      <div className="filter-row assessment-primary-controls">
        <div className="search-wrap assessment-search-group">
          <input className="search-input" placeholder="Search client or caregiver..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="filter-divider"></div>
        <div className="filter-btns assessment-clinic-filter-group">
          {['ALL', 'MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT'].map(option => (
            <button key={option} className={`filter-btn ${office === option ? 'active' : ''}`} onClick={() => setOffice(option)}>{option}</button>
          ))}
        </div>
        <div className="filter-divider"></div>
        <div className="assessment-pa-select-group">
          <span>Interview Status</span>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Interview Status">
            <option value="All">All</option>
            <option value="Awaiting Assignment">Awaiting Assignment</option>
            <option value="Not Started">Not Started</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="No Show">No Show</option>
          </select>
        </div>
      </div>

      <div className="work-queue-card">
        <div className="work-queue-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="work-queue-eyebrow">Parent Interview Workflow</div>
            <div className="work-queue-title">Parent Interview Work Queue</div>
            <div className="work-queue-subtitle">{filteredRows.length} clients in the current view.</div>
          </div>
        </div>
        <SyncedHorizontalScrollTable>
          <table className="work-queue-table">
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Parent Interview</th><th>Scheduled Date</th><th>Completed Date</th><th>Direct Observation</th><th>Direct Obs. Date</th><th>Insurance</th><th>Next Step</th></tr></thead>
            <tbody>
              {filteredRows.length === 0
                ? <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records found.</td></tr>
                : filteredRows.map(record => {
                  const canOpen = Boolean(getAssessmentRecordId(record))
                  const directObsStatus = record.direct_obs_status || record.direct_obs || ''
                  const directObsDate = record.direct_obs_completed_date || record.direct_obs_scheduled_date

                  return (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className={canOpen ? 'row-hover' : ''}
                      onClick={() => openAssessment(record)}
                      style={{ cursor: canOpen ? 'pointer' : 'default' }}
                    >
                      <td>
                        {canOpen ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openAssessment(record)
                            }}
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
                      <td>{sBdg(normalizeParentInterviewStatus(record.parent_interview_status))}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.parent_interview_scheduled_date ? '#a5b4fc' : 'var(--dim)' }}>{formatDisplayDate(record.parent_interview_scheduled_date)}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.parent_interview_completed_date ? '#22c55e' : 'var(--dim)' }}>{formatDisplayDate(record.parent_interview_completed_date)}</td>
                      <td>{assessVal(directObsStatus)}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.direct_obs_completed_date ? '#22c55e' : record.direct_obs_scheduled_date ? '#a5b4fc' : 'var(--dim)' }}>{formatDisplayDate(directObsDate)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {canOpen ? (
                          <button
                            type="button"
                            className="work-queue-action"
                            onClick={(event) => {
                              event.stopPropagation()
                              openAssessment(record)
                            }}
                          >
                            Open Client <ChevronRight size={14} />
                          </button>
                        ) : '--'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </SyncedHorizontalScrollTable>
      </div>
    </>
  )
}

function getBcbaDisplayName(value) {
  return cleanLookupValue(value)
}

const UNASSIGNED_BCBA_KEY = '__unassigned__'

function getBcbaAssignmentKey(value) {
  return normalizeLookupValue(value) || UNASSIGNED_BCBA_KEY
}

function getPossessiveName(name) {
  return name.endsWith('s') ? `${name}'` : `${name}'s`
}

function getDuplicateBcbaGroups(records) {
  const groups = {}
  records.forEach(record => {
    const raw = record.assigned_bcba
    const key = normalizeLookupValue(raw)
    if (!key) return
    const clean = String(raw || '').trim()
    if (!groups[key]) groups[key] = new Set()
    groups[key].add(clean)
  })

  return Object.entries(groups)
    .map(([key, names]) => ({ key, names: Array.from(names).sort((a, b) => a.localeCompare(b)) }))
    .filter(group => group.names.length > 1)
}

function ManageBcbasContent({ officeOptions = [], onRefreshLookups }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ full_name: '', email: '', office: '' })
  const officeValues = optionValues(officeOptions)

  const resetForm = () => {
    setEditingId(null)
    setForm({ full_name: '', email: '', office: '' })
  }

  const loadStaff = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getBcbaStaffRecords()
      setStaff(data)
    } catch (err) {
      setLoadError(err.message || 'Failed to load BCBAs.')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const startEdit = (record) => {
    setEditingId(record.id)
    setForm({
      full_name: cleanLookupValue(record.full_name),
      email: record.email || '',
      office: record.office || '',
    })
    setActionError(null)
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const fullName = cleanLookupValue(form.full_name)
    if (!fullName) {
      setActionError('BCBA name is required.')
      return
    }

    setSaving(true)
    setActionError(null)
    setMessage(null)
    try {
      if (editingId) {
        await updateBcbaStaff(editingId, form)
        setMessage('BCBA updated.')
      } else {
        await createBcbaStaff(form)
        setMessage('BCBA added.')
      }
      resetForm()
      await loadStaff()
      await onRefreshLookups?.()
    } catch (err) {
      setActionError(err.message || 'Could not save BCBA.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (record) => {
    setBusyId(record.id)
    setActionError(null)
    setMessage(null)
    try {
      await deactivateBcbaStaff(record.id)
      setMessage(`${cleanLookupValue(record.full_name)} deactivated.`)
      await loadStaff()
      await onRefreshLookups?.()
      if (editingId === record.id) resetForm()
    } catch (err) {
      setActionError(err.message || 'Could not deactivate BCBA.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        {editingId ? <button type="button" className="btn-ghost" onClick={resetForm}>Cancel Edit</button> : null}
      </div>

      {loadError ? (
        <div className="error-bar" style={{ marginBottom: 14 }}>
          Failed to load BCBAs: {loadError}
          <button className="x-btn" onClick={() => setLoadError(null)}>Close</button>
        </div>
      ) : null}

      {actionError ? (
        <div className="error-bar" style={{ marginBottom: 14 }}>
          {actionError}
          <button className="x-btn" onClick={() => setActionError(null)}>Close</button>
        </div>
      ) : null}

      {message ? (
        <div style={{ marginBottom: 14, borderRadius: 10, border: '1px solid #16a34a33', background: '#16a34a12', color: '#16a34a', padding: '10px 12px', fontSize: 12, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="responsive-review-grid" style={{ gap: 12, marginBottom: 16 }}>
        <div>
          <div className="label">BCBA Name</div>
          <input className="edit-input" value={form.full_name} onChange={event => setForm(prev => ({ ...prev, full_name: event.target.value }))} placeholder="Full name" />
        </div>
        <div>
          <div className="label">Email</div>
          <input className="edit-input" type="email" value={form.email} onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))} placeholder="Optional" />
        </div>
        <div>
          <div className="label">Office</div>
          {officeValues.length ? (
            <select className="edit-select" value={form.office} onChange={event => setForm(prev => ({ ...prev, office: event.target.value }))}>
              <option value="">Optional</option>
              {officeValues.map(office => <option key={office} value={office}>{office}</option>)}
            </select>
          ) : (
            <input className="edit-input" value={form.office} onChange={event => setForm(prev => ({ ...prev, office: event.target.value }))} placeholder="Optional" />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn-save" type="submit" disabled={saving || !cleanLookupValue(form.full_name)} style={{ width: '100%' }}>
            {saving ? 'Saving...' : editingId ? 'Save BCBA' : 'Add BCBA'}
          </button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Office</th><th>Status</th><th /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--dim)' }}>Loading BCBAs...</td></tr>
            ) : loadError ? (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--red)' }}>Failed to load BCBAs.</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'var(--dim)' }}>No BCBAs found.</td></tr>
            ) : staff.map(record => (
              <tr key={record.id || record.full_name}>
                <td style={{ fontWeight: 800 }}>{cleanLookupValue(record.full_name)}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.email || '--'}</td>
                <td><span className="office-pill">{record.office || '--'}</span></td>
                <td>{record.is_active === false ? <span className="bdg" style={{ background: '#64748b20', color: '#94a3b8', border: '1px solid #64748b35' }}>Inactive</span> : <span className="bdg" style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e35' }}>Active</span>}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn-ghost" onClick={() => startEdit(record)} style={{ padding: '6px 10px', fontSize: 12, marginRight: 8 }}>Edit</button>
                  {record.is_active !== false ? (
                    <button type="button" className="btn-ghost" onClick={() => handleDeactivate(record)} disabled={busyId === record.id} style={{ padding: '6px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef444440' }}>
                      {busyId === record.id ? 'Deactivating...' : 'Deactivate'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ManageBcbasModal({ isOpen, onClose, officeOptions = [], onRefreshLookups }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(100%, 960px)',
          maxWidth: 960,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Manage BCBAs</div>
            <div className="modal-sub">Add, edit, or deactivate BCBA dropdown options.</div>
          </div>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body" style={{ display: 'block', overflowY: 'auto' }}>
          <ManageBcbasContent officeOptions={officeOptions} onRefreshLookups={onRefreshLookups} />
        </div>
      </div>
    </div>
  )
}

export function BCBAAssignmentsPage({
  assessData,
  assessLoading,
  onSelectAssess,
  statFilter,
  onSetStatFilter,
  onClearStatFilter,
  bcbaOptions = [],
  officeOptions = [],
  onRefreshLookups,
}) {
  const [selectedBcbaKey, setSelectedBcbaKey] = useState(null)
  const [manageBcbasOpen, setManageBcbasOpen] = useState(false)

  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const unassigned = assessData.filter(record => getBcbaAssignmentKey(record.assigned_bcba) === UNASSIGNED_BCBA_KEY)
  const assigned = assessData.filter(record => getBcbaAssignmentKey(record.assigned_bcba) !== UNASSIGNED_BCBA_KEY)
  const byBCBA = {}
  const staffNamesByKey = {}
  bcbaOptions.forEach(option => {
    const name = option.value ?? option.label
    const key = normalizeLookupValue(name)
    if (key) staffNamesByKey[key] = cleanLookupValue(name)
  })
  const duplicateGroups = getDuplicateBcbaGroups(assessData)
  const bcbaFilter = isStatFilterTarget(statFilter, 'bcba-assignments')
  const treatmentPlanFilter = isStatFilterTarget(statFilter, 'treatment-plans')
  const activeFilter = bcbaFilter || treatmentPlanFilter
  const toggleFilter = (key, label) => onSetStatFilter(toggleStatFilter(bcbaFilter, { target: 'bcba-assignments', key, label }))
  const filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  assigned.forEach(record => {
    const workflowStatus = normalizeTreatmentPlanStatus(record.treatment_plan_status)
    const key = getBcbaAssignmentKey(record.assigned_bcba)
    const displayName = staffNamesByKey[key] || getBcbaDisplayName(record.assigned_bcba)
    if (!byBCBA[key]) byBCBA[key] = { name: displayName, total: 0, completed: 0, inProgress: 0, notStarted: 0 }
    byBCBA[key].total += 1
    if (workflowStatus === 'Completed' || workflowStatus === 'Finalized') byBCBA[key].completed += 1
    else if (workflowStatus === 'In Progress') byBCBA[key].inProgress += 1
    else byBCBA[key].notStarted += 1
  })

  const unassignedStats = unassigned.reduce((stats, record) => {
    const workflowStatus = normalizeTreatmentPlanStatus(record.treatment_plan_status)
    stats.total += 1
    if (workflowStatus === 'Completed' || workflowStatus === 'Finalized') stats.completed += 1
    else if (workflowStatus === 'In Progress') stats.inProgress += 1
    else stats.notStarted += 1
    return stats
  }, { name: 'Unassigned', total: 0, completed: 0, inProgress: 0, notStarted: 0 })

  const bcbaCards = [
    ...Object.entries(byBCBA).map(([key, stats]) => [key, stats]),
    ...(unassignedStats.total > 0 ? [[UNASSIGNED_BCBA_KEY, unassignedStats]] : []),
  ]

  const handleCardFilter = (bcbaKey) => {
    setSelectedBcbaKey(current => current === bcbaKey ? null : bcbaKey)
  }

  const handleCardKeyDown = (event, bcbaKey) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleCardFilter(bcbaKey)
  }

  const tableRows = selectedBcbaKey
    ? filteredRows.filter(record => getBcbaAssignmentKey(record.assigned_bcba) === selectedBcbaKey)
    : filteredRows
  const selectedBcbaName = selectedBcbaKey === UNASSIGNED_BCBA_KEY
    ? 'Unassigned'
    : selectedBcbaKey
      ? byBCBA[selectedBcbaKey]?.name || 'Selected BCBA'
      : null
  const tableHeading = selectedBcbaKey === UNASSIGNED_BCBA_KEY
    ? `Unassigned Clients (${tableRows.length})`
    : selectedBcbaName
      ? `${getPossessiveName(selectedBcbaName)} Clients (${tableRows.length})`
      : activeFilter?.key === 'unassigned'
        ? `Unassigned Clients (${tableRows.length})`
        : activeFilter?.key === 'assigned'
          ? `Assigned Clients (${tableRows.length})`
          : `All Clients (${tableRows.length})`

  return (
    <>
      <div className="pg-hdr" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div className="pg-hdr-title">BCBA Waitlist</div>
          <div className="pg-hdr-sub">Track assigned BCBAs, treatment plan progress, and authorization readiness.</div>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setManageBcbasOpen(true)} style={{ fontSize: 12, padding: '8px 12px' }}>
          Manage BCBAs
        </button>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={assessData.length} label="Total Clients" color="#6366f1" active={activeFilter?.key === 'all'} onClick={() => { setSelectedBcbaKey(null); toggleFilter('all', 'BCBA Waitlist: All Clients') }} />
        <ClickableStatCard value={unassigned.length} label="Unassigned" color="#ef4444" active={activeFilter?.key === 'unassigned'} onClick={() => { setSelectedBcbaKey(null); toggleFilter('unassigned', 'BCBA Waitlist: Unassigned') }} />
        <ClickableStatCard value={Object.keys(byBCBA).length} label="Active BCBAs" color="#22c55e" active={activeFilter?.key === 'assigned'} onClick={() => { setSelectedBcbaKey(null); toggleFilter('assigned', 'BCBA Waitlist: Assigned to BCBA') }} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered BCBA waitlist" />

      {duplicateGroups.length > 0 ? (
        <div className="card card-pad" style={{ marginBottom: 22, borderColor: '#f59e0b55' }}>
          <div className="section-hdr" style={{ marginTop: 0 }}>Suspected Duplicate BCBA Names</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>These assignments normalize to the same name. Review before deciding whether old records need manual cleanup.</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {duplicateGroups.map(group => (
              <div key={group.key} className="info-row" style={{ alignItems: 'flex-start' }}>
                <span className="info-label">Canonical</span>
                <span className="info-val">{cleanLookupValue(group.names[0])} <span style={{ color: 'var(--dim)' }}>({group.names.join(', ')})</span></span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {bcbaCards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
          {bcbaCards.map(([bcbaKey, stats]) => {
            const isSelected = selectedBcbaKey === bcbaKey
            return (
            <div
              key={bcbaKey}
              className="card card-pad"
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => handleCardFilter(bcbaKey)}
              onKeyDown={event => handleCardKeyDown(event, bcbaKey)}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? '#6366f1' : 'var(--border)',
                background: isSelected ? 'color-mix(in srgb, var(--accent) 9%, var(--surface))' : 'var(--surface)',
                boxShadow: isSelected ? '0 0 0 1px #6366f145, 0 12px 28px rgba(99,102,241,0.12)' : 'var(--shadow)',
                transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{stats.name}</div>
                <span className="bdg" style={{ background: '#6366f120', color: '#a5b4fc', border: '1px solid #6366f130' }}>{stats.total} clients</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="info-row"><span className="info-label">Plan Completed</span><span style={{ color: '#22c55e', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.completed}</span></div>
                <div className="info-row"><span className="info-label">Plan In Progress</span><span style={{ color: '#f59e0b', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.inProgress}</span></div>
                <div className="info-row" style={{ border: 'none' }}><span className="info-label">Plan Not Started</span><span style={{ color: '#ef4444', fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{stats.notStarted}</span></div>
              </div>
              <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 4, height: 6 }}>
                <div style={{ width: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%`, height: 6, borderRadius: 4, background: '#22c55e', transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4, textAlign: 'right' }}>{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% plans complete</div>
            </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: selectedBcbaKey ? '#a5b4fc' : activeFilter?.key === 'unassigned' ? '#ef4444' : activeFilter?.key === 'assigned' ? '#22c55e' : '#a5b4fc' }}>
          {tableHeading}
        </div>
        {selectedBcbaKey ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="bdg" style={{ background: '#6366f120', color: '#a5b4fc', border: '1px solid #6366f135' }}>
              Filtering by {selectedBcbaName}
            </span>
            <button type="button" className="btn-ghost" onClick={() => setSelectedBcbaKey(null)} style={{ padding: '6px 10px', fontSize: 12 }}>
              Clear filter
            </button>
          </div>
        ) : null}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Office</th><th>Assigned BCBA</th><th>Treatment Plan Status</th><th>Authorization Status</th><th>Treatment Plan Started</th><th>Treatment Plan Completed</th><th /></tr></thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>{selectedBcbaKey ? 'No clients assigned to this BCBA yet.' : 'No assessment records match the current filter.'}</td></tr>
              ) : tableRows.map(record => (
                <tr
                  key={record.assessment_id || record.client_name}
                  className="row-hover"
                  onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                  style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                >
                  <td>{renderClientCell(record, record.caregiver)}</td>
                  <td><span className="office-pill">{record.clinic || record.office || '--'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{getBcbaDisplayName(record.assigned_bcba) || <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                  <td>{sBdg(normalizeTreatmentPlanStatus(record.treatment_plan_status))}</td>
                  <td><PaStatusBadge status={getAuthorizationStatus(record)} /></td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.treatment_plan_started_date ? 'var(--muted)' : 'var(--dim)' }}>{formatDisplayDate(record.treatment_plan_started_date)}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.treatment_plan_completed_date ? '#22c55e' : 'var(--dim)' }}>{formatDisplayDate(record.treatment_plan_completed_date)}</td>
                  <td style={{ color: 'var(--accent)' }}>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ManageBcbasModal
        isOpen={manageBcbasOpen}
        onClose={() => setManageBcbasOpen(false)}
        officeOptions={officeOptions}
        onRefreshLookups={onRefreshLookups}
      />
    </>
  )
}

export function AssessmentProgressPage({ assessData, assessLoading, onSelectAssess, statFilter, onSetStatFilter, onClearStatFilter }) {
  const [notifyRecord, setNotifyRecord] = useState(null)

  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const notStarted = assessData.filter(record => getAssessmentWorkflowStatus(record) === 'Not Started')
  const inProgress = assessData.filter(record => getAssessmentWorkflowStatus(record) === 'In Progress')
  const completed = assessData.filter(record => getAssessmentWorkflowStatus(record) === 'Completed')
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'assessment-progress')
  const filteredRows = assessData.filter(record => matchesStatFilter(record, activeFilter))

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Assessment Progress</div>
        <div className="pg-hdr-sub">Track Vineland, SRS-2, VBMAPP, and Socially Savvy assessments</div>
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
            <thead><tr><th>Client</th><th>BCBA</th><th>Vineland</th><th>SRS-2</th><th>VBMAPP</th><th>Socially Savvy</th><th>Complete</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No assessment records match the current filter.</td></tr>
              ) : filteredRows.map(record => {
                const progressFields = getAssessmentProgressFields(record)
                const completionPercent = getAssessmentProgressPercent(record)

                return (
                  <tr
                    key={record.assessment_id || record.client_name}
                    className="row-hover"
                    onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                    style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                  >
                  <td>{renderClientCell(record, record.clinic)}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || <span style={{ color: '#ef4444', fontStyle: 'italic', fontSize: 11 }}>Unassigned</span>}</td>
                  <td>{assessVal(progressFields.vineland)}</td>
                  <td>{assessVal(progressFields.srs2)}</td>
                  <td>{assessVal(progressFields.vbmapp)}</td>
                  <td>{assessVal(progressFields.sociallySavvy)}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: completionPercent === '100%' ? '#22c55e' : 'var(--dim)' }}>{completionPercent}</td>
                  <td>{paStatus(record.pa_status || getAuthorizationStatus(record))}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={(e) => { e.stopPropagation(); setNotifyRecord(record) }}
                      style={{ padding: '5px 10px', fontSize: 11 }}
                    >
                      Notify
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {notifyRecord && <NotifyModal referral={notifyRecord} onClose={() => setNotifyRecord(null)} />}
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
      <div className="pg-hdr">
        <div className="pg-hdr-title">Treatment Plan Status</div>
        <div className="pg-hdr-sub">Track treatment plan drafting, completion, and finalization</div>
      </div>
      <div className="stats-row stats-3" style={{ marginBottom: 12 }}>
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
            <thead><tr><th>Client</th><th>BCBA</th><th>Assessment Progress</th><th>Treatment Plan</th><th>Authorization</th><th>Started</th><th>Completed</th><th /></tr></thead>
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
                  <td>{sBdg(getAssessmentWorkflowStatus(record))}</td>
                  <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                  <td><PaStatusBadge status={getAuthorizationStatus(record) || 'Not Submitted'} /></td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>{formatDisplayDate(record.treatment_plan_started_date)}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.treatment_plan_completed_date ? '#22c55e' : 'var(--dim)' }}>{formatDisplayDate(record.treatment_plan_completed_date)}</td>
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

  const referredOut = assessData.filter(record => getAssessmentLifecycleStatus(record) === 'Referred Out')
  const activeClients = assessData.filter(record => isAssessmentActiveClient(record))
  const activeClientSet = new Set(activeClients)
  const ready = assessData.filter(record => record.ready_for_services === true && getAssessmentLifecycleStatus(record) !== 'Referred Out' && !activeClientSet.has(record))
  const almostAuth = assessData.filter(record =>
    getAssessmentWorkflowStatus(record) === 'Completed'
    && !isAuthorizationApproved(record)
    && !record.ready_for_services
    && getAssessmentLifecycleStatus(record) !== 'Referred Out'
    && !activeClientSet.has(record)
  )
  const notReady = assessData.filter(record => !record.ready_for_services && !almostAuth.includes(record) && getAssessmentLifecycleStatus(record) !== 'Referred Out' && !activeClientSet.has(record))
  const { activeFilter, toggleFilter } = getAssessmentPageFilter(statFilter, onSetStatFilter, 'ready-for-services')
  const readyRows = ready.filter(record => matchesStatFilter(record, activeFilter))
  const almostAuthRows = almostAuth.filter(record => matchesStatFilter(record, activeFilter))
  const notReadyRows = notReady.filter(record => matchesStatFilter(record, activeFilter))
  const referredOutRows = referredOut.filter(record => matchesStatFilter(record, activeFilter))
  const activeRows = activeClients.filter(record => matchesStatFilter(record, activeFilter))

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Ready for Services</div>
        <div className="pg-hdr-sub">Clients who have completed all pre-service requirements</div>
      </div>
      <div className="stats-row" style={{ marginBottom: 22, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <ClickableStatCard value={ready.length} label="Ready for Services" color="#22c55e" active={activeFilter?.key === 'ready'} onClick={() => toggleFilter('ready', 'Ready for Services')} />
        <ClickableStatCard value={almostAuth.length} label="Awaiting Authorization" color="#f59e0b" active={activeFilter?.key === 'awaiting-authorization'} onClick={() => toggleFilter('awaiting-authorization', 'Ready for Services: Awaiting Authorization')} />
        <ClickableStatCard value={notReady.length} label="Not Ready" color="#ef4444" active={activeFilter?.key === 'not-ready'} onClick={() => toggleFilter('not-ready', 'Ready for Services: Not Ready')} />
        <ClickableStatCard value={activeClients.length} label="Active Clients" color="#22c55e" active={activeFilter?.key === 'active-clients'} onClick={() => toggleFilter('active-clients', 'Ready for Services: Active Clients')} />
        <ClickableStatCard value={referredOut.length} label="Referred Out" color="#8b5cf6" active={activeFilter?.key === 'referred-out'} onClick={() => toggleFilter('referred-out', 'Ready for Services: Referred Out')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered service-readiness records" />

      {activeRows.length > 0 && activeFilter?.key === 'active-clients' && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Active Clients ({activeRows.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Authorization</th><th>Active Date</th><th>Lifecycle</th><th>Open</th></tr></thead>
                <tbody>
                  {activeRows.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.clinic)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record)} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#22c55e' }}>{formatDate(record.active_client_date)}</td>
                      <td>{lifecycleBadge(getAssessmentLifecycleStatus(record))}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>Open</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {readyRows.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Ready for Services ({readyRows.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Authorization</th><th>Auth Approved</th><th>Active Date</th><th>Notes</th><th>Open</th></tr></thead>
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
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#a5b4fc' }}>{formatDate(record.authorization_approved_date || record.pa_decision_date)}</td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: record.active_client_date ? '#22c55e' : '#fb923c' }}>{formatDate(record.active_client_date || 'Pending')}</td>
                      <td style={{ fontSize: 11, color: 'var(--dim)', maxWidth: 160 }}>{record.notes || '--'}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>Open</td>
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
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment Progress</th><th>Treatment Plan</th><th>Authorization</th><th>Submitted</th><th /></tr></thead>
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
                      <td>{sBdg(getAssessmentWorkflowStatus(record))}</td>
                      <td>{sBdg(record.treatment_plan_status || 'Not Started')}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record) || 'Not Submitted'} /></td>
                      <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>{formatDisplayDate(record.authorization_submitted_date)}</td>
                      <td style={{ color: 'var(--accent)' }}>→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {referredOutRows.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>Referred Out ({referredOutRows.length})</div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>BCBA</th><th>Lifecycle Status</th><th>Authorization</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {referredOutRows.map(record => (
                    <tr
                      key={record.assessment_id || record.client_name}
                      className="row-hover"
                      onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                      style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                    >
                      <td>{renderClientCell(record, record.clinic)}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                      <td>{lifecycleBadge(getAssessmentLifecycleStatus(record))}</td>
                      <td><PaStatusBadge status={getAuthorizationStatus(record) || 'Referred Out'} /></td>
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

      {activeFilter && readyRows.length === 0 && almostAuthRows.length === 0 && notReadyRows.length === 0 && referredOutRows.length === 0 && activeRows.length === 0 && (
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
                <thead><tr><th>Client</th><th>BCBA</th><th>Assessment Progress</th><th>Treatment Plan</th><th>Authorization</th><th>Notes</th><th /></tr></thead>
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
                      <td>{sBdg(getAssessmentWorkflowStatus(record))}</td>
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

export function ActiveClientsPage({ assessData, assessLoading, onSelectAssess }) {
  const [search, setSearch] = useState('')

  if (assessLoading) return <div className="loader-wrap"><div className="spinner" /></div>

  const activeClients = assessData.filter(record => isAssessmentActiveClient(record))
  const query = search.trim().toLowerCase()
  const filtered = activeClients.filter(record => {
    if (!query) return true
    return [
      record.client_name,
      record.clinic || record.office,
      record.assigned_bcba,
      record.insurance,
      record.notes,
    ].some(value => String(value || '').toLowerCase().includes(query))
  })

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Active Clients</div>
        <div className="pg-hdr-sub">Completed intake records closed from the active Initial Assessment workflow</div>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <input className="search-input" placeholder="Search active clients..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Clinic</th><th>BCBA</th><th>Insurance</th><th>Authorization</th><th>Active Date</th><th>Lifecycle</th><th>Notes</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No active client records found.</td></tr>
                : filtered.map(record => (
                  <tr
                    key={record.assessment_id || record.client_name}
                    className="row-hover"
                    onClick={() => getAssessmentRecordId(record) && onSelectAssess(record)}
                    style={{ cursor: getAssessmentRecordId(record) ? 'pointer' : 'default' }}
                  >
                    <td>{renderClientCell(record, record.caregiver)}</td>
                    <td><span className="office-pill">{record.clinic || record.office || '--'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.assigned_bcba || '--'}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{record.insurance || '--'}</td>
                    <td><PaStatusBadge status={getAuthorizationStatus(record)} /></td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#22c55e' }}>{formatDate(record.active_client_date)}</td>
                    <td>{lifecycleBadge(getAssessmentLifecycleStatus(record))}</td>
                    <td style={{ fontSize: 11, color: record.notes ? 'var(--muted)' : 'var(--dim)', maxWidth: 220 }}>{record.notes || '--'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
