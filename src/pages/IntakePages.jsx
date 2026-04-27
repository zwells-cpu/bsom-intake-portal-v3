import { Badge, OfficePill, StagePill, ProgressRing } from '../components/Badge'
import { ActiveFilterBanner, ClickableStatCard } from '../components/StatFilterControls'
import { isStatFilterTarget, matchesStatFilter, toggleStatFilter } from '../lib/statFilters'
import { getReferralStage, pct, displayStaffName, formatDisplayDate, formatInsurance, normalizeAutismDx, normalizeOffice, normalizeStaffName } from '../lib/utils'

// ══════════════════════════════════════
// INTAKE DASHBOARD
// ══════════════════════════════════════
export function IntakeDashboard({ refs, onSelectRef, openModulePage }) {
  const active  = refs.filter(r => r.status === 'active')
  const nr      = refs.filter(r => r.status === 'non-responsive' || r.status === 'referred-out')
  const pending = active.filter(r => !['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase()))
  const signed  = active.filter(r => (r.intake_paperwork || '').toLowerCase().includes('signed'))
  const noIns   = active.filter(r => !['yes'].includes((r.insurance_verified || '').toLowerCase()))
  const noDx    = active.filter(r => normalizeAutismDx(r.autism_diagnosis) !== 'Received')
  const readyPI = active.filter(r => getReferralStage(r) === 'Ready for Interview')

  const byStage = {}
  active.forEach(r => { const s = getReferralStage(r); byStage[s] = (byStage[s] || 0) + 1 })
  const stageOrder = ['New Referral', 'Intake', 'Ready for Interview', 'Initial Assessment', 'PA Submitted', 'PA In Review', 'PA Approved', 'Active Client', 'Reauth Needed', 'Discharged']

  const staffCounts = {}
  active.forEach(r => {
    const staffKey = normalizeStaffName(r.intake_personnel)
    if (!staffKey) return
    if (!staffCounts[staffKey]) staffCounts[staffKey] = { label: displayStaffName(r.intake_personnel), total: 0, pending: 0 }
    staffCounts[staffKey].total += 1
    if (!['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase())) staffCounts[staffKey].pending += 1
  })
  const staffList = Object.values(staffCounts)

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Intake Dashboard</div>
        <div className="pg-hdr-sub">Real-time overview of all active referrals and action items</div>
      </div>

      <div className="stats-row stats-4" style={{ marginBottom: 24 }}>
        <ClickableStatCard value={active.length} label="Total Active" color="#6366f1" onClick={() => openModulePage('intake', 'all', { target: 'all-referrals', key: 'active-referrals', label: 'Active Referrals' })} />
        <ClickableStatCard value={signed.length} label="Paperwork Signed" color="#22c55e" onClick={() => openModulePage('intake', 'all', { target: 'all-referrals', key: 'paperwork-signed', label: 'Paperwork Signed' })} />
        <ClickableStatCard value={pending.length} label="Pending Documents" color="#f59e0b" onClick={() => openModulePage('intake', 'pending', { target: 'pending-docs', key: 'total-pending', label: 'Pending Documents' })} />
        <ClickableStatCard value={nr.length} label="Non-Responsive" color="#ef4444" onClick={() => openModulePage('intake', 'nr', { target: 'non-responsive', key: 'all', label: 'Non-Responsive / Referred Out' })} />
      </div>

      <div className="responsive-two-col" style={{ marginBottom: 24 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Pipeline by Stage</div>
          {stageOrder.map(s => {
            const count = byStage[s] || 0
            if (!count) return null
            const max = Math.max(...Object.values(byStage), 1)
            const STAGE_C = { 'New Referral': '#6366f1', 'Intake': '#8b5cf6', 'Ready for Interview': '#22c55e', 'Initial Assessment': '#f59e0b', 'PA Submitted': '#fb923c', 'PA In Review': '#fb923c', 'PA Approved': '#22c55e', 'Active Client': '#22c55e', 'Reauth Needed': '#f59e0b', 'Discharged': '#64748b' }
            const c = STAGE_C[s] || '#64748b'
            return (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <StagePill stage={s} />
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: 'var(--muted)' }}>{count}</span>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${Math.round(count / max * 100)}%`, height: 6, borderRadius: 4, background: c, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Action Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.length ? <ActionItem color="#f59e0b" text={`${pending.length} pending documents`} onClick={() => openModulePage('intake', 'pending', { target: 'pending-docs', key: 'total-pending', label: 'Pending Documents' })} /> : null}
              {noIns.length ? <ActionItem color="#a5b4fc" text={`${noIns.length} unverified insurance`} onClick={() => openModulePage('intake', 'insurance', { target: 'insurance-verification', key: 'unverified', label: 'Unverified Insurance' })} /> : null}
              {noDx.length ? <ActionItem color="#fb923c" text={`${noDx.length} awaiting diagnosis docs`} /> : null}
              {nr.length ? <ActionItem color="#ef4444" text={`${nr.length} non-responsive / referred out`} onClick={() => openModulePage('intake', 'nr', { target: 'non-responsive', key: 'all', label: 'Non-Responsive / Referred Out' })} /> : null}
              {readyPI.length ? <ActionItem color="#22c55e" text={`${readyPI.length} ready for parent interview`} /> : null}
              {!pending.length && !noIns.length && !nr.length && <div style={{ color: 'var(--dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>No action items.</div>}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>By Staff Member</div>
            {staffList.map(staff => {
              return (
                <div key={staff.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #0a1525' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{staff.label}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="bdg" style={{ background: '#6366f120', color: '#a5b4fc', border: '1px solid #6366f130' }}>{staff.total} total</span>
                    {staff.pending ? <span className="bdg" style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b30' }}>{staff.pending} pending</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recently Added</div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Client</th><th>Referral ID</th><th>Stage</th><th>Paperwork</th><th>Insurance</th><th>Staff</th><th /></tr></thead>
              <tbody>
                {active.slice(0, 8).map(r => (
                  <tr key={r.id} className="row-hover" onClick={() => onSelectRef(r.id)}>
                    <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.date_received ? formatDisplayDate(r.date_received) : ''}</div></td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>{r.referral_id || '--'}</td>
                    <td><StagePill stage={getReferralStage(r)} /></td>
                    <td><Badge value={r.intake_paperwork} /></td>
                    <td><Badge value={r.insurance_verified} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text)' }}>{r.intake_personnel || '--'}</td>
                    <td style={{ color: 'var(--accent)' }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function ActionItem({ color, text, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color, fontWeight: 700, fontSize: 13 }}>{text}</span>
      {onClick && <span style={{ color, fontSize: 12 }}>View →</span>}
    </div>
  )
}

// ══════════════════════════════════════
// PENDING DOCUMENTS
// ══════════════════════════════════════
export function PendingDocsPage({ refs, onSelectRef, statFilter, onSetStatFilter, onClearStatFilter }) {
  const active  = refs.filter(r => r.status === 'active')
  const pending = active.filter(r => !['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase()))
  const needsPaperwork = pending.filter(r => !(r.intake_paperwork || '').toLowerCase().includes('emailed'))
  const emailed        = pending.filter(r => (r.intake_paperwork || '').toLowerCase().includes('emailed'))
  const needsDx        = active.filter(r => normalizeAutismDx(r.autism_diagnosis) !== 'Received')
  const activeFilter = isStatFilterTarget(statFilter, 'pending-docs')
  const toggleFilter = (key, label) => onSetStatFilter(toggleStatFilter(activeFilter, { target: 'pending-docs', key, label }))
  const filteredRows = (activeFilter ? active : pending)
    .filter(r => matchesStatFilter(r, activeFilter))
    .sort((a, b) => (a.date_received || '').localeCompare(b.date_received || ''))

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Pending Documents</div>
        <div className="pg-hdr-sub">Clients requiring document follow-up</div>
      </div>
      <div className="stats-row stats-4" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={pending.length} label="Total Pending" color="#f59e0b" active={activeFilter?.key === 'total-pending'} onClick={() => toggleFilter('total-pending', 'Pending Documents')} />
        <ClickableStatCard value={needsPaperwork.length} label="Not Yet Sent" color="#ef4444" active={activeFilter?.key === 'not-yet-sent'} onClick={() => toggleFilter('not-yet-sent', 'Pending Documents: Not Yet Sent')} />
        <ClickableStatCard value={emailed.length} label="Emailed — Awaiting Return" color="#fb923c" active={activeFilter?.key === 'emailed'} onClick={() => toggleFilter('emailed', 'Pending Documents: Emailed — Awaiting Return')} />
        <ClickableStatCard value={needsDx.length} label="Awaiting Diagnosis Docs" color="#6366f1" active={activeFilter?.key === 'needs-dx'} onClick={() => toggleFilter('needs-dx', 'Pending Documents: Awaiting Diagnosis Docs')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing pending document matches" />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Referral ID</th><th>Office</th><th>Paperwork</th><th>Autism DX</th><th>Vineland</th><th>SRS-2</th><th>Staff</th><th>Date Received</th><th /></tr></thead>
            <tbody>
              {filteredRows.length === 0
                ? <tr><td colSpan={10} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No pending documents.</td></tr>
                : filteredRows.map(r => (
                  <tr key={r.id} className="row-hover" onClick={() => onSelectRef(r.id)}>
                    <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{r.caregiver || ''}</div></td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>{r.referral_id || '--'}</td>
                    <td><OfficePill office={r.office} previousOffice={r.previous_office} /></td>
                    <td><Badge value={r.intake_paperwork} /></td>
                    <td><Badge value={normalizeAutismDx(r.autism_diagnosis)} /></td>
                    <td><Badge value={r.vineland} /></td>
                    <td><Badge value={r.srs2} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text)' }}>{r.intake_personnel || '--'}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>{formatDisplayDate(r.date_received)}</td>
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
// INSURANCE VERIFICATION
// ══════════════════════════════════════
export function InsuranceVerifPage({ refs, onSelectRef, statFilter, onSetStatFilter, onClearStatFilter }) {
  const active     = refs.filter(r => r.status === 'active')
  const unverified = active.filter(r => !['yes'].includes((r.insurance_verified || '').toLowerCase()))
  const verified   = active.filter(r => (r.insurance_verified || '').toLowerCase() === 'yes')
  const awaiting   = active.filter(r => (r.insurance_verified || '').toLowerCase() === 'awaiting')
  const notStarted = active.filter(r => (r.insurance_verified || '').toLowerCase() === 'no')
  const byProvider = {}
  unverified.forEach(r => { const p = formatInsurance(r.insurance) || 'Unknown'; byProvider[p] = (byProvider[p] || 0) + 1 })
  const verRate = active.length ? Math.round(verified.length / active.length * 100) : 0
  const activeFilter = isStatFilterTarget(statFilter, 'insurance-verification')
  const toggleFilter = (key, label) => onSetStatFilter(toggleStatFilter(activeFilter, { target: 'insurance-verification', key, label }))
  const filteredRows = active.filter(r => matchesStatFilter(r, activeFilter))

  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Insurance Verification</div>
        <div className="pg-hdr-sub">Track insurance verification status across all active referrals</div>
      </div>
      <div className="stats-row stats-4" style={{ marginBottom: 22 }}>
        <ClickableStatCard value={verified.length} label="Verified" color="#22c55e" active={activeFilter?.key === 'verified'} onClick={() => toggleFilter('verified', 'Insurance Verification: Verified')} />
        <ClickableStatCard value={awaiting.length} label="Awaiting" color="#f59e0b" active={activeFilter?.key === 'awaiting'} onClick={() => toggleFilter('awaiting', 'Insurance Verification: Awaiting')} />
        <ClickableStatCard value={notStarted.length} label="Not Started" color="#ef4444" active={activeFilter?.key === 'not-started'} onClick={() => toggleFilter('not-started', 'Insurance Verification: Not Started')} />
        <ClickableStatCard value={active.length} label="Total Active" color="#6366f1" active={activeFilter?.key === 'total-active'} onClick={() => toggleFilter('total-active', 'Insurance Verification: Total Active')} />
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing insurance verification matches" />
      <div className="responsive-two-col">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Client</th><th>Insurance</th><th>Verified</th><th>Staff</th><th /></tr></thead>
              <tbody>
                {filteredRows.length === 0
                  ? <tr><td colSpan={5} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>All insurance verified.</td></tr>
                  : filteredRows.map(r => (
                    <tr key={r.id} className="row-hover" onClick={() => onSelectRef(r.id)}>
                      <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11 }}><OfficePill office={r.office} previousOffice={r.previous_office} /></div></td>
                      <td style={{ fontSize: 12, color: 'var(--text)' }}>{formatInsurance(r.insurance) || '--'}</td>
                      <td><Badge value={r.insurance_verified} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text)' }}>{r.intake_personnel || '--'}</td>
                      <td style={{ color: 'var(--accent)' }}>→</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>By Provider</div>
          {Object.entries(byProvider).sort((a, b) => b[1] - a[1]).map(([p, c]) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #0a1525' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p}</span>
              <span className="bdg" style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b30' }}>{c} pending</span>
            </div>
          ))}
          {Object.keys(byProvider).length === 0 && <div style={{ color: 'var(--dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>All clear.</div>}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Verification rate</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{verRate}%</span>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 8, marginTop: 6 }}>
              <div style={{ width: `${verRate}%`, height: 8, borderRadius: 4, background: '#22c55e', transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════
// NON-RESPONSIVE
// ══════════════════════════════════════
export function NonResponsivePage({ refs, onRestore, statFilter, onClearStatFilter }) {
  const nr = refs.filter(r => r.status === 'non-responsive' || r.status === 'referred-out')
  const activeFilter = isStatFilterTarget(statFilter, 'non-responsive')
  const filteredRows = nr.filter(r => matchesStatFilter(r, activeFilter))
  return (
    <>
      <div className="pg-hdr">
        <div className="pg-hdr-title">Non-Responsive / Referred Out</div>
        <div className="pg-hdr-sub">Clients who could not be reached or were referred elsewhere</div>
      </div>
      <ActiveFilterBanner filter={activeFilter} onClear={onClearStatFilter} defaultText="Showing non-responsive records" />
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Caregiver</th><th>Phone</th><th>Office</th><th>Insurance</th><th>Coordinator</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredRows.length === 0
                ? <tr><td colSpan={8} style={{ padding: 56, textAlign: 'center', color: 'var(--dim)' }}>No non-responsive clients.</td></tr>
                : filteredRows.map(r => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.date_received ? formatDisplayDate(r.date_received) : ''}</div></td>
                    <td style={{ color: 'var(--text)', fontSize: 13 }}>{r.caregiver || '--'}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--muted)' }}>{r.caregiver_phone || '--'}</td>
                    <td><OfficePill office={r.office} previousOffice={r.previous_office} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text)' }}>{formatInsurance(r.insurance) || '--'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text)' }}>{r.intake_personnel || '--'}</td>
                    <td><span className="bdg" style={{ background: r.status === 'referred-out' ? '#8b5cf620' : '#ef444420', color: r.status === 'referred-out' ? '#8b5cf6' : '#ef4444', border: `1px solid ${r.status === 'referred-out' ? '#8b5cf640' : '#ef444440'}` }}>{r.status}</span></td>
                    <td><button onClick={() => onRestore(r.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↩ Restore</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
