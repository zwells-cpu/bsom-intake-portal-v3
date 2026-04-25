import { useState } from 'react'
import { API_BASE } from '../lib/api'

export function NotifyModal({ referral, onClose }) {
  const [status, setStatus] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const hasEmail = !!referral.caregiver_email

  const handleQuickEmail = async () => {
    if (!hasEmail) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: referral.caregiver_email, type: 'email' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Server error ${res.status}`)
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Failed to send notification.')
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Send Notification</div>
            <div className="modal-sub">{referral.first_name} {referral.last_name}</div>
          </div>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'grid', gap: 12 }}>
          {!hasEmail && (
            <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b44', borderRadius: 10, padding: '10px 14px', color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
              No caregiver email on file for this referral.
            </div>
          )}

          {status === 'success' && (
            <div style={{ background: '#16a34a12', border: '1px solid #16a34a33', borderRadius: 10, padding: '10px 14px', color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
              ✅ Email notification sent successfully.
            </div>
          )}

          {status === 'error' && (
            <div style={{ background: '#ef444418', border: '1px solid #ef444433', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
              ❌ {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-sm"
              disabled={!hasEmail || status === 'sending' || status === 'success'}
              onClick={handleQuickEmail}
              style={{ flex: 1, padding: '10px 16px', fontSize: 13 }}
            >
              {status === 'sending' ? 'Sending...' : 'Quick Email'}
            </button>

            <div title="Coming Soon" style={{ flex: 1 }}>
              <button
                className="btn-sm"
                disabled
                style={{ width: '100%', padding: '10px 16px', fontSize: 13, opacity: 0.45, cursor: 'not-allowed' }}
              >
                Quick Text
              </button>
            </div>
          </div>
        </div>

        <div className="modal-foot" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
