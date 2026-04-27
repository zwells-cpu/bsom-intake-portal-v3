import { useEffect, useState } from 'react'
import { ActivityLogItem } from '../components/dashboard/RecentActivityCard'
import { API_BASE } from '../lib/api'
import { formatDisplayDate } from '../lib/utils'

export function ClientProfilePage({ referralId, onBack, canShowTechnicalDetails = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!referralId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

    Promise.all([
      fetch(`${API_BASE}/referrals/${referralId}`).then(r => r.json()),
      fetch(`${API_BASE}/referrals/${referralId}/assessments`).then(r => r.json()),
      fetch(`${API_BASE}/referrals/${referralId}/activity`).then(r => r.json()),
    ])
      .then(([referral, assessments, activity]) => {
        if (cancelled) return
        setData({
          referral,
          assessments: Array.isArray(assessments) ? assessments : [],
          activity: Array.isArray(activity) ? activity : [],
        })
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [referralId])

  if (!referralId) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--muted)' }}>
        No client selected. Go to All Referrals and click Profile on a row.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--muted)' }}>Loading client profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-bar">
        Failed to load client profile: {error}
      </div>
    )
  }

  if (!data) return null

  const { referral, assessments, activity } = data
  const latest = assessments[0] ?? null

  const pipeline = [
    { stage: 'Parent Interview', status: latest?.parent_interview_status ?? 'Pending' },
    { stage: 'Treatment Plan', status: latest?.treatment_plan_status ?? 'Pending' },
    { stage: 'Authorization', status: latest?.authorization_status ?? 'Pending' },
    { stage: 'Active Client', status: latest?.ready_for_services ? 'Ready' : 'Pending' },
  ]

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn-sm" onClick={onBack}>Back</button>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {referral.first_name} {referral.last_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            DOB: {formatDisplayDate(referral.dob)} | Received: {formatDisplayDate(referral.date_received)} | Office: {referral.office || '--'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20, display: 'grid', gap: 10 }}>
          <div className="section-hdr">Client Details</div>
          <InfoRow label="Caregiver" value={referral.caregiver} />
          <InfoRow label="Phone" value={referral.caregiver_phone} />
          <InfoRow label="Email" value={referral.caregiver_email} />
          <InfoRow label="Insurance" value={referral.insurance} />
          <InfoRow label="Ins. Verified" value={referral.insurance_verified} />
          <InfoRow label="Autism DX" value={referral.autism_diagnosis} />
          <InfoRow label="Stage" value={referral.current_stage} />
          <InfoRow label="Status" value={referral.status} />
        </div>

        <div className="card" style={{ padding: 20, display: 'grid', gap: 10 }}>
          <div className="section-hdr">Pipeline Status</div>
          {pipeline.map(({ stage, status }) => (
            <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{stage}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: stageColor(status) }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {assessments.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-hdr" style={{ marginBottom: 12 }}>Assessment History</div>
          <div className="table-wrap">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Parent Interview</th>
                  <th>Treatment Plan</th>
                  <th>Authorization</th>
                  <th>Ready</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.assessment_id || a.id}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{formatDisplayDate(a.assessment_started_date)}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{formatDisplayDate(a.assessment_completed_date)}</td>
                    <td style={{ color: stageColor(a.parent_interview_status), fontSize: 12, fontWeight: 700 }}>{a.parent_interview_status || '--'}</td>
                    <td style={{ color: stageColor(a.treatment_plan_status), fontSize: 12, fontWeight: 700 }}>{a.treatment_plan_status || '--'}</td>
                    <td style={{ color: stageColor(a.authorization_status), fontSize: 12, fontWeight: 700 }}>{a.authorization_status || '--'}</td>
                    <td style={{ color: a.ready_for_services ? 'var(--green)' : 'var(--dim)', fontSize: 12, fontWeight: 700 }}>
                      {a.ready_for_services ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-hdr" style={{ marginBottom: 12 }}>Activity Timeline</div>
          <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
            {activity.map((log, index) => (
              <ActivityLogItem
                key={log.id || `${log.created_at || 'log'}-${index}`}
                log={log}
                index={index}
                compact
                canShowTechnicalDetails={canShowTechnicalDetails}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="label">{label}</span>
      <span style={{ fontSize: 13, color: value ? 'var(--text)' : 'var(--dim)' }}>{value || '--'}</span>
    </div>
  )
}

function stageColor(status) {
  const s = String(status || '').toLowerCase()
  if (['completed', 'ready', 'approved'].includes(s)) return 'var(--green)'
  if (['in progress', 'submitted', 'scheduled'].includes(s)) return 'var(--yellow)'
  return 'var(--dim)'
}
