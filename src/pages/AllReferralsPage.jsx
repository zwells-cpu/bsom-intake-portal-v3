import { useState } from 'react'
import { Badge, OfficePill, StagePill, ProgressRing } from '../components/Badge'
import { ActiveFilterBanner } from '../components/StatFilterControls'
import { NotifyModal } from '../components/NotifyModal'
import { OFFICES } from '../lib/constants'
import { isStatFilterTarget, matchesStatFilter, toggleStatFilter } from '../lib/statFilters'
import { sortList, normalizeOffice, normalizeAutismDx, formatInsurance, exportCSV, formatDisplayDate, pct, getReferralBoardStage, isActiveReferralWork, isReferralTransitioned } from '../lib/utils'

export function AllReferralsPage({ refs, assessData = [], onSelectRef, onOpenProfile, statFilter, onSetStatFilter, onClearStatFilter }) {
  const active = refs.filter(r => r.status === 'active')
  const activeWork = active.filter(r => isActiveReferralWork(r, assessData))
  const transitioned = active.filter(r => isReferralTransitioned(r, assessData))
  const [search, setSearch]       = useState('')
  const [office, setOffice]       = useState('ALL')
  const [sortCol, setSortCol]     = useState(null)
  const [sortDir, setSortDir]     = useState('asc')
  const [notifyReferral, setNotifyReferral] = useState(null)
  const activeFilter = isStatFilterTarget(statFilter, 'all-referrals')
  const showingTransitioned = activeFilter?.key === 'transitioned-to-initial'
  const searchActive = search.trim().length > 0
  const baseRows = showingTransitioned
    ? transitioned
    : searchActive
      ? active
      : activeWork

  const visibleBeforeOfficeFilter = baseRows.map(r => ({
    ...r,
    __transitioned: isReferralTransitioned(r, assessData),
  })).filter(r => {
    const n = `${r.first_name} ${r.last_name}`.toLowerCase()
    return (n.includes(search.toLowerCase()) || (r.caregiver || '').toLowerCase().includes(search.toLowerCase()))
      && matchesStatFilter(r, activeFilter)
  })

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
      ? visibleBeforeOfficeFilter.length
      : visibleBeforeOfficeFilter.filter(r => normalizeOffice(r.office) === officeKey || r.office === officeKey).length
    return acc
  }, {})

  const filtered = sortList(
    visibleBeforeOfficeFilter.filter(r => office === 'ALL' || normalizeOffice(r.office) === office || r.office === office),
    sortCol, sortDir
  )

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const Th = ({ col, label }) => (
    <th className={sortCol === col ? (sortDir === 'asc' ? 'sort-asc' : 'sort-desc') : ''}
      onClick={() => toggleSort(col)} style={{ cursor: 'pointer' }}>{label}</th>
  )

  return (
    <>
      <div className="filter-row">
        <div className="search-wrap">
          <input className="search-input" placeholder="Search name or caregiver..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-btns">
          <button
            className={`filter-btn ${showingTransitioned ? 'active' : ''}`}
            onClick={toggleTransitionedFilter}
          >
            Moved to Initial Assessment ({transitioned.length})
          </button>
          {['ALL', ...OFFICES].map(o => (
            <button key={o} className={`filter-btn ${office === o ? 'active' : ''}`} onClick={() => setOffice(o)}>{o} ({officeCounts[o] || 0})</button>
          ))}
        </div>
        <div className="filter-row-actions">
          <button className="btn-export" onClick={() => exportCSV(refs)}>Export CSV</button>
        </div>
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing filtered referrals" />

      <div className="card" style={{ width: '100%' }}>
        <div className="table-wrap">
          <table className="table-compact">
            <thead>
              <tr>
                <Th col="pct" label="Progress" />
                <Th col="last_name" label="Client" />
                <Th col="dob" label="DOB" />
                <Th col="caregiver" label="Caregiver" />
                <Th col="office" label="Office" />
                <Th col="insurance" label="Insurance" />
                <Th col="insurance_verified" label="Ins. Verified" />
                <Th col="autism_diagnosis" label="Autism DX" />
                <Th col="current_stage" label="Stage" />
                <Th col="intake_paperwork" label="Paperwork" />
                <Th col="intake_personnel" label="Personnel" />
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No referrals found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="row-hover" onClick={() => onSelectRef(r.id)}>
                  <td><ProgressRing value={pct(r)} /></td>
                  <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.date_received ? formatDisplayDate(r.date_received) : ''}</div></td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--text)' }}>{formatDisplayDate(r.dob)}</td>
                  <td><div style={{ color: 'var(--text)' }}>{r.caregiver || ''}</div><div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{r.caregiver_phone || '--'}</div></td>
                  <td><OfficePill office={r.office} previousOffice={r.previous_office} /></td>
                  <td style={{ color: 'var(--text)', fontSize: 12 }}>{formatInsurance(r.insurance) || '--'}</td>
                  <td><Badge value={r.insurance_verified} /></td>
                  <td><Badge value={normalizeAutismDx(r.autism_diagnosis)} /></td>
                  <td><StagePill stage={getReferralBoardStage(r, assessData)} /></td>
                  <td><Badge value={r.intake_paperwork} /></td>
                  <td style={{ color: 'var(--text)', fontSize: 12 }}>{r.intake_personnel || '--'}</td>
                  <td style={{ whiteSpace: 'nowrap', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn-sm"
                      style={{ fontSize: 11, padding: '3px 10px' }}
                      onClick={e => { e.stopPropagation(); onOpenProfile(r.id) }}
                    >
                      Profile
                    </button>
                    <button
                      className="btn-sm"
                      style={{ fontSize: 11, padding: '3px 10px' }}
                      onClick={e => { e.stopPropagation(); setNotifyReferral(r) }}
                    >
                      Notify
                    </button>
                  </td>
                </tr>
              ))}
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
