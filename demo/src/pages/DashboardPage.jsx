import { Badge, OfficePill, ProgressRing } from '../components/Badge'
import { ClickableStatCard } from '../components/StatFilterControls'
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard'
import { useActivityLogs } from '../hooks/useActivityLogs'
import { isInsuranceVerified, needsInsuranceVerification, normalizeAutismDx, pct } from '../lib/utils'

export function DashboardPage({ refs, setSelectedId, openModulePage, activityRefreshKey = 0 }) {
  const { logs, loading: activityLoading } = useActivityLogs(8, activityRefreshKey)
  const active = refs.filter((r) => r.status === 'active')
  const nr = refs.filter((r) => r.status === 'non-responsive' || r.status === 'referred-out')
  const signed = active.filter((r) => (r.intake_paperwork || '').toLowerCase().includes('signed'))
  const pending = active.filter((r) => !['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase()))
  const noIns = active.filter((r) => needsInsuranceVerification(r.insurance_verified))
  const readyForInterview = active.filter((r) => r.ready_for_parent_interview === true).length
  const aging14 = active.filter((r) => {
    const received = r.referral_received_date || r.date_received
    if (!received) return false
    const ageInDays = Math.floor((Date.now() - new Date(received).getTime()) / 86400000)
    return Number.isFinite(ageInDays) && ageInDays >= 14
  }).length
  const avgPct = active.length ? Math.round(active.reduce((sum, r) => sum + pct(r), 0) / active.length) : 0
  const recent = active.slice(0, 5)

  const alerts = []
  if (pending.length) alerts.push({ color: '#f59e0b', text: `${pending.length} client${pending.length > 1 ? 's' : ''} with pending paperwork`, action: () => openModulePage('intake', 'pending', { target: 'pending-docs', key: 'total-pending', label: 'Pending Documents' }), label: 'View Intake' })
  if (nr.length) alerts.push({ color: '#ef4444', text: `${nr.length} non-responsive or referred out`, action: () => openModulePage('intake', 'nr', { target: 'non-responsive', key: 'all', label: 'Non-Responsive / Referred Out' }), label: 'View List' })
  if (noIns.length) alerts.push({ color: '#a5b4fc', text: `${noIns.length} unverified insurance records`, action: () => openModulePage('intake', 'insurance', { target: 'insurance-verification', key: 'unverified', label: 'Unverified Insurance' }), label: 'Verify Now' })

  const needsAttentionItems = [
    { label: 'Pending Documents', value: pending.length, color: '#f59e0b', action: () => openModulePage('intake', 'pending', { target: 'pending-docs', key: 'total-pending', label: 'Pending Documents' }) },
    { label: 'Unverified Insurance', value: noIns.length, color: '#a5b4fc', action: () => openModulePage('intake', 'insurance', { target: 'insurance-verification', key: 'unverified', label: 'Unverified Insurance' }) },
    { label: 'Ready for Interview', value: readyForInterview, color: '#22c55e', action: () => openModulePage('intake', 'all', { target: 'all-referrals', key: 'ready-for-interview', label: 'Ready for Interview' }) },
    { label: 'Aging 14+ Days', value: aging14, color: '#fb923c', action: () => openModulePage('operations', 'aging', { target: 'referral-aging', key: 'aging-14-plus', label: 'Aging 14+ Days' }) },
  ]

  return (
    <>
      <div className="stats-row stats-4" style={{ marginBottom: 20 }}>
        <ClickableStatCard value={active.length} label="Active Referrals" color="#6366f1" onClick={() => openModulePage('intake', 'all', { target: 'all-referrals', key: 'active-referrals', label: 'Active Referrals' })} />
        <ClickableStatCard value={signed.length} label="Fully Signed" color="#22c55e" onClick={() => openModulePage('intake', 'all', { target: 'all-referrals', key: 'paperwork-signed', label: 'Fully Signed Referrals' })} />
        <ClickableStatCard value={pending.length} label="Pending Docs" color="#f59e0b" onClick={() => openModulePage('intake', 'pending', { target: 'pending-docs', key: 'total-pending', label: 'Pending Documents' })} />
        <ClickableStatCard value={nr.length} label="Non-Responsive" color="#fb923c" onClick={() => openModulePage('intake', 'nr', { target: 'non-responsive', key: 'all', label: 'Non-Responsive / Referred Out' })} />
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dim)', marginBottom: 10 }}>
          Needs Attention
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          {needsAttentionItems.map((item) => (
            <button
              key={item.label}
              className="stat-box stat-box-clickable"
              onClick={item.action}
              style={{ padding: '14px 18px', borderTop: `3px solid ${item.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono',monospace", color: item.color }}>{item.value}</span>
                <span style={{ fontSize: 10, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Open</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Alerts</div>
          {alerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    background: `${alert.color}12`,
                    border: `1px solid ${alert.color}30`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ color: alert.color, fontWeight: 700, fontSize: 13 }}>{alert.text}</span>
                  <button className="btn-sm" onClick={alert.action} style={{ fontSize: 11, flexShrink: 0 }}>{alert.label}</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--dim)', fontSize: 13, padding: 20, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              No alerts. Everything looks good.
            </div>
          )}
        </div>

        <RecentActivityCard logs={logs} loading={activityLoading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,340px) 1fr', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Overall Progress</div>
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Average completion</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{avgPct}%</span>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${avgPct}%`, height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.6s' }} />
              </div>
            </div>
            <div className="info-row"><span className="info-label">Paperwork signed</span><span style={{ color: '#22c55e', fontWeight: 700 }}>{signed.length} / {active.length}</span></div>
            <div className="info-row"><span className="info-label">Insurance verified</span><span style={{ color: '#f59e0b', fontWeight: 700 }}>{active.filter((r) => isInsuranceVerified(r.insurance_verified)).length} / {active.length}</span></div>
            <div className="info-row" style={{ border: 'none' }}><span className="info-label">Autism DX received</span><span style={{ color: '#a5b4fc', fontWeight: 700 }}>{active.filter((r) => normalizeAutismDx(r.autism_diagnosis) === 'Received').length} / {active.length}</span></div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recently Added</div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Office</th><th>Personnel</th><th>Paperwork</th><th>Progress</th><th /></tr></thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="row-hover" onClick={() => { setSelectedId(r.id); openModulePage('intake', 'all') }}>
                      <td><div style={{ fontWeight: 700 }}>{r.first_name} {r.last_name}</div><div style={{ fontSize: 11, color: 'var(--dim)' }}>{r.date_received || ''}</div></td>
                      <td><OfficePill office={r.office} previousOffice={r.previous_office} /></td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.intake_personnel || '--'}</td>
                      <td><Badge value={r.intake_paperwork} /></td>
                      <td><ProgressRing value={pct(r)} /></td>
                      <td style={{ color: 'var(--accent)' }}>{'\u2192'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
