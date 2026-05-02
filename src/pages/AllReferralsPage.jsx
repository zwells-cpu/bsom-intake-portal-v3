import { useState } from 'react'
import { AlertCircle, CalendarCheck, FileText, ArrowUpRight, Bell } from 'lucide-react'
import { Badge, OfficePill, StagePill, ProgressRing } from '../components/Badge'
import { ActiveFilterBanner } from '../components/StatFilterControls'
import { NotifyModal } from '../components/NotifyModal'
import { OFFICES } from '../lib/constants'
import { isStatFilterTarget, matchesStatFilter, toggleStatFilter } from '../lib/statFilters'
import {
  sortList, normalizeOffice, normalizeAutismDx, formatInsurance, exportCSV,
  formatDisplayDate, pct, getReferralBoardStage, isActiveReferralWork,
  isReferralTransitioned, getInsuranceVerificationStatus,
} from '../lib/utils'

const OFFICE_LABELS = {
  ALL: 'All',
  MERIDIAN: 'Meridian',
  FOREST: 'Forest',
  FLOWOOD: 'Flowood',
  'DAY TREATMENT': 'Day Treatment',
}

function getNextBlocker(r, assessData) {
  const paperwork = (r.intake_paperwork || '').toUpperCase()
  const paperworkDone = ['COMPLETED', 'SIGNED'].some(x => paperwork.includes(x))
  if (!paperworkDone) return { label: 'Paperwork needed', color: '#ef4444' }

  const insStatus = getInsuranceVerificationStatus(r)
  if (insStatus !== 'YES') return { label: 'Insurance verification', color: '#f59e0b' }

  const autismDx = normalizeAutismDx(r.autism_diagnosis)
  if (autismDx !== 'Received') return { label: 'Autism diagnosis needed', color: '#fb923c' }

  const stage = getReferralBoardStage(r, assessData)
  if (stage === 'New Referral') return { label: 'Ready for intake review', color: '#6366f1' }
  if (stage === 'Ready for Interview') return { label: 'Ready for interview', color: '#22c55e' }
  if (stage === 'Moved to Initial Assessment') return { label: 'In initial assessment', color: '#8b5cf6' }
  return { label: 'No blocker', color: '#64748b' }
}

export function AllReferralsPage({ refs, assessData = [], onSelectRef, onOpenProfile, statFilter, onSetStatFilter, onClearStatFilter }) {
  const active = refs.filter(r => r.status === 'active')
  const activeWork = active.filter(r => isActiveReferralWork(r, assessData))
  const transitioned = active.filter(r => isReferralTransitioned(r, assessData))

  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('ALL')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [notifyReferral, setNotifyReferral] = useState(null)
  const [localStageFilter, setLocalStageFilter] = useState('all')

  const activeFilter = isStatFilterTarget(statFilter, 'all-referrals')
  const showingTransitioned = activeFilter?.key === 'transitioned-to-initial'
  const searchActive = search.trim().length > 0

  const baseRows = showingTransitioned
    ? transitioned
    : searchActive
      ? active
      : activeWork

  const visibleBeforeStageFilter = baseRows.map(r => ({
    ...r,
    __transitioned: isReferralTransitioned(r, assessData),
  })).filter(r => {
    const n = `${r.first_name} ${r.last_name}`.toLowerCase()
    return (n.includes(search.toLowerCase()) || (r.caregiver || '').toLowerCase().includes(search.toLowerCase()))
      && matchesStatFilter(r, activeFilter)
  })

  const stageFiltered = (showingTransitioned || searchActive || localStageFilter === 'all')
    ? visibleBeforeStageFilter
    : localStageFilter === 'needs-followup'
      ? visibleBeforeStageFilter.filter(r => {
          const b = getNextBlocker(r, assessData)
          return b.label !== 'Ready for interview' && b.label !== 'No blocker' && b.label !== 'In initial assessment'
        })
      : localStageFilter === 'new-referral'
        ? visibleBeforeStageFilter.filter(r => getReferralBoardStage(r, assessData) === 'New Referral')
        : localStageFilter === 'ready-for-interview'
          ? visibleBeforeStageFilter.filter(r => getReferralBoardStage(r, assessData) === 'Ready for Interview')
          : localStageFilter === 'pending-paperwork'
            ? visibleBeforeStageFilter.filter(r => {
                const pw = (r.intake_paperwork || '').toUpperCase()
                return !['COMPLETED', 'SIGNED'].some(x => pw.includes(x))
              })
            : visibleBeforeStageFilter

  const toggleTransitionedFilter = () => {
    if (!onSetStatFilter) return
    onSetStatFilter(toggleStatFilter(activeFilter, {
      target: 'all-referrals',
      key: 'transitioned-to-initial',
      label: 'Moved to Initial Assessment',
    }))
  }

  const officeCounts = ['ALL', ...OFFICES].reduce((acc, officeKey) => {
    acc[officeKey] = officeKey === 'ALL'
      ? stageFiltered.length
      : stageFiltered.filter(r => normalizeOffice(r.office) === officeKey || r.office === officeKey).length
    return acc
  }, {})

  const filtered = sortList(
    stageFiltered.filter(r => office === 'ALL' || normalizeOffice(r.office) === office || r.office === office),
    sortCol, sortDir
  )

  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const Th = ({ col, label, style }) => (
    <th
      className={sortCol === col ? (sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : ''}
      onClick={() => toggleSort(col)}
      style={{ cursor: 'pointer', ...style }}
    >
      {label}
    </th>
  )

  // KPI counts always from the full active lists, unaffected by current UI filters
  const kpiNeedsFollowUp = activeWork.filter(r => {
    const b = getNextBlocker(r, assessData)
    return b.label !== 'Ready for interview' && b.label !== 'No blocker' && b.label !== 'In initial assessment'
  }).length
  const kpiReadyForInterview = activeWork.filter(r => getReferralBoardStage(r, assessData) === 'Ready for Interview').length
  const kpiPendingPaperwork = activeWork.filter(r => {
    const pw = (r.intake_paperwork || '').toUpperCase()
    return !['COMPLETED', 'SIGNED'].some(x => pw.includes(x))
  }).length
  const kpiTransitioned = transitioned.length

  const handleKpiClick = id => {
    if (id === 'transitioned') {
      setLocalStageFilter('all')
      toggleTransitionedFilter()
    } else {
      if (showingTransitioned && onClearStatFilter) onClearStatFilter()
      setLocalStageFilter(id)
    }
  }

  const handleQueueTab = id => {
    if (id === 'transitioned') {
      setLocalStageFilter('all')
      toggleTransitionedFilter()
    } else {
      if (showingTransitioned && onClearStatFilter) onClearStatFilter()
      setLocalStageFilter(id)
    }
  }

  const activeKpiId = showingTransitioned ? 'transitioned' : (localStageFilter === 'all' || localStageFilter === 'new-referral' ? null : localStageFilter)

  const kpiCards = [
    {
      id: 'needs-followup',
      label: 'Needs Follow-Up',
      count: kpiNeedsFollowUp,
      helper: 'Active referrals with open blockers',
      color: '#ef4444',
      bg: '#ef444418',
      icon: <AlertCircle size={18} />,
    },
    {
      id: 'ready-for-interview',
      label: 'Ready for Interview',
      count: kpiReadyForInterview,
      helper: 'All requirements met, awaiting interview',
      color: '#22c55e',
      bg: '#22c55e18',
      icon: <CalendarCheck size={18} />,
    },
    {
      id: 'pending-paperwork',
      label: 'Pending Paperwork',
      count: kpiPendingPaperwork,
      helper: 'Intake paperwork not yet completed',
      color: '#f59e0b',
      bg: '#f59e0b18',
      icon: <FileText size={18} />,
    },
    {
      id: 'transitioned',
      label: 'Moved to Initial Assessment',
      count: kpiTransitioned,
      helper: 'Transitioned from referral queue',
      color: '#8b5cf6',
      bg: '#8b5cf618',
      icon: <ArrowUpRight size={18} />,
    },
  ]

  const queueTabs = [
    { id: 'all', label: 'All Active', count: activeWork.length },
    { id: 'new-referral', label: 'New Referral', count: activeWork.filter(r => getReferralBoardStage(r, assessData) === 'New Referral').length },
    { id: 'ready-for-interview', label: 'Ready for Interview', count: kpiReadyForInterview },
    { id: 'pending-paperwork', label: 'Pending Paperwork', count: kpiPendingPaperwork },
    { id: 'transitioned', label: 'Moved to Initial Assessment', count: kpiTransitioned },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="pg-hdr">
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
          Intake Module
        </div>
        <h1 className="pg-hdr-title" style={{ fontSize: 22, fontWeight: 800 }}>All Referrals</h1>
        <p className="pg-hdr-sub">Review active referrals, blockers, paperwork, and next steps.</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="referral-kpi-row">
        {kpiCards.map(card => (
          <button
            key={card.id}
            className={`stat-box stat-box-clickable referral-kpi-card${activeKpiId === card.id ? ' active' : ''}`}
            onClick={() => handleKpiClick(card.id)}
          >
            <div className="referral-kpi-top">
              <div className="referral-kpi-icon" style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="referral-kpi-num" style={{ color: card.color }}>{card.count}</div>
            </div>
            <div className="referral-kpi-label">{card.label}</div>
            <div className="referral-kpi-helper">{card.helper}</div>
          </button>
        ))}
      </div>

      {/* Filter Row 1: Search + Office Chips + Export */}
      <div className="filter-row referral-filter-row1" style={{ marginBottom: 10 }}>
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search name or caregiver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-btns referral-office-chips">
          {['ALL', ...OFFICES].map(o => (
            <button
              key={o}
              className={`filter-btn${office === o ? ' active' : ''}`}
              style={{ borderRadius: 999 }}
              onClick={() => setOffice(o)}
            >
              {OFFICE_LABELS[o] || o} ({officeCounts[o] ?? 0})
            </button>
          ))}
        </div>
        <div className="filter-row-actions">
          <button className="btn-export" onClick={() => exportCSV(refs)}>Export CSV</button>
        </div>
      </div>

      {/* Filter Row 2: Stage Queue Tabs */}
      <div className="referral-queue-filter-row">
        {queueTabs.map(tab => {
          const isActive = tab.id === 'transitioned'
            ? showingTransitioned
            : !showingTransitioned && localStageFilter === tab.id
          return (
            <button
              key={tab.id}
              className={`referral-queue-tab${isActive ? ' active' : ''}`}
              onClick={() => handleQueueTab(tab.id)}
            >
              {tab.label} ({tab.count})
            </button>
          )
        })}
      </div>

      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered referrals" />

      {/* Referral Work Queue Table */}
      <div className="work-queue-card" style={{ width: '100%' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 4px 14px 4px' }}>
          Referral Work Queue
        </div>
        <div className="table-wrap">
          <table className="work-queue-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <Th col="pct" label="Progress" style={{ width: 56 }} />
                <Th col="last_name" label="Client" />
                <Th col="caregiver" label="Caregiver" />
                <Th col="office" label="Office" />
                <Th col="insurance" label="Insurance" />
                <Th col="current_stage" label="Stage" />
                <Th col="intake_paperwork" label="Paperwork" />
                <th style={{ cursor: 'default' }}>Next Blocker</th>
                <Th col="intake_personnel" label="Personnel" />
                <th style={{ cursor: 'default', textAlign: 'right' }}>Next Step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>
                    No referrals found.
                  </td>
                </tr>
              ) : filtered.map(r => {
                const blocker = getNextBlocker(r, assessData)
                return (
                  <tr key={r.id} className="row-hover" onClick={() => onSelectRef(r.id)}>
                    <td className="work-queue-progress-cell">
                      <ProgressRing value={pct(r)} size={36} />
                    </td>
                    <td>
                      <div className="work-queue-client-name">{r.first_name} {r.last_name}</div>
                      <div className="work-queue-client-date">{r.date_received ? formatDisplayDate(r.date_received) : ''}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{r.caregiver || '--'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.caregiver_phone || ''}</div>
                    </td>
                    <td><OfficePill office={r.office} previousOffice={r.previous_office} /></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text)' }}>{formatInsurance(r.insurance) || '--'}</td>
                    <td className="work-queue-status-cell">
                      <StagePill stage={getReferralBoardStage(r, assessData)} />
                    </td>
                    <td className="work-queue-status-cell">
                      <Badge value={r.intake_paperwork} />
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        background: `${blocker.color}18`,
                        color: blocker.color,
                        border: `1px solid ${blocker.color}30`,
                        borderRadius: 999,
                        padding: '4px 11px',
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                      }}>
                        {blocker.label}
                      </span>
                    </td>
                    <td className="work-queue-personnel">{r.intake_personnel || '--'}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className="btn-action-primary"
                          onClick={e => { e.stopPropagation(); onOpenProfile(r.id) }}
                        >
                          Open Profile
                        </button>
                        <button
                          className="btn-action-secondary"
                          onClick={e => { e.stopPropagation(); setNotifyReferral(r) }}
                          title="Send notification"
                        >
                          <Bell size={12} />
                          Notify
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {notifyReferral && (
        <NotifyModal referral={notifyReferral} onClose={() => setNotifyReferral(null)} />
      )}
    </>
  )
}
