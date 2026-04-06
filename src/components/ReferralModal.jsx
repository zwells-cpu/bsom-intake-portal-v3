import { useState } from 'react'
import { Badge, OfficePill, ProgressRing } from './Badge'
import { INSURANCES, BOOL, STAT, STAFF, OFFICES, CHECKLIST_FIELDS } from '../lib/constants'
import { pct, formatInsurance } from '../lib/utils'

export function ReferralModal({ referral, onClose, onSave, onDelete, onSetStatus, onToggleParentInterview }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ ...referral })
  const [saving, setSaving] = useState(false)

  const r = referral
  const e = editMode ? form : referral

  const field = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    const patch = { ...form }
    delete patch.id
    delete patch.created_at
    delete patch.user_id
    const res = await onSave(r.id, patch)
    if (res?.success) setEditMode(false)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this referral permanently? This cannot be undone.')) return
    setSaving(true)
    const res = await onDelete(r.id)
    if (res?.success) {
      setEditMode(false)
      onClose()
    }
    setSaving(false)
  }

  const isNR = r.status === 'non-responsive' || r.status === 'referred-out'

  const FootLeft = () => {
    if (isNR) {
      return (
        <button onClick={() => onSetStatus(r.id, 'active')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ↩ Restore Active
        </button>
      )
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => onSetStatus(r.id, 'non-responsive')}
          style={{ color: '#ef4444', borderColor: '#ef444440', fontSize: 12 }}>
          🚫 Non-Responsive
        </button>
        <button className="btn-ghost" onClick={() => onSetStatus(r.id, 'referred-out')}
          style={{ color: '#8b5cf6', borderColor: '#8b5cf640', fontSize: 12 }}>
          🏁 Referred Out
        </button>
        <button onClick={() => onToggleParentInterview(r.id, !r.ready_for_parent_interview)}
          style={{
            padding: '7px 13px', borderRadius: 8,
            border: `1px solid ${r.ready_for_parent_interview ? '#22c55e40' : '#1a2840'}`,
            background: r.ready_for_parent_interview ? '#22c55e15' : 'transparent',
            color: r.ready_for_parent_interview ? '#22c55e' : 'var(--dim)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
          {r.ready_for_parent_interview ? '✓ Ready for Interview' : '◐ Mark Ready for Interview'}
        </button>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{r.first_name} {r.last_name}</div>
            <div className="modal-sub">
              DOB: {r.dob || '--'} · Received: {r.date_received || '--'} · <OfficePill office={r.office} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ProgressRing value={pct(r)} />
            <button className={`btn-edit ${editMode ? 'editing' : ''}`}
              onClick={() => { if (!editMode) { setForm({ ...r }); setEditMode(true) } else setEditMode(false) }}>
              ✏ {editMode ? 'Editing' : 'Edit Record'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          {/* Left column */}
          <div>
            <div className="section-hdr">Caregiver</div>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[['caregiver', 'Full Name'], ['caregiver_phone', '601-000-0000'], ['caregiver_email', 'email@example.com']].map(([k, ph]) => (
                  <div key={k}>
                    <div className="label">{k.replace('caregiver_', '').replace('_', ' ')}</div>
                    <input className="edit-input" value={e[k] || ''} onChange={ev => field(k)(ev.target.value)} placeholder={ph} />
                  </div>
                ))}
              </div>
            ) : (
              [['Name', r.caregiver], ['Phone', r.caregiver_phone], ['Email', r.caregiver_email]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 12 }}>
                  <div className="label">{l}</div>
                  <div style={{ color: '#cbd5e1', fontSize: 14 }}>{v || '--'}</div>
                </div>
              ))
            )}

            <div className="section-hdr" style={{ marginTop: 4 }}>Insurance</div>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                <div className="info-row"><span className="info-label">Primary</span>
                  <select className="edit-select" value={e.insurance || ''} onChange={ev => field('insurance')(ev.target.value)}>
                    {INSURANCES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="info-row"><span className="info-label">Secondary</span>
                  <select className="edit-select" value={e.secondary_insurance || ''} onChange={ev => field('secondary_insurance')(ev.target.value)}>
                    {['None', ...INSURANCES].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="info-row"><span className="info-label">Verified</span>
                  <select className="edit-select" value={e.insurance_verified || ''} onChange={ev => field('insurance_verified')(ev.target.value)}>
                    {BOOL.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="info-row"><span className="info-label">Primary</span><span className="info-val">{formatInsurance(r.insurance) || '--'}</span></div>
                <div className="info-row"><span className="info-label">Secondary</span><span className="info-val">{formatInsurance(r.secondary_insurance) || '--'}</span></div>
                <div className="info-row"><span className="info-label">Verified</span><Badge value={r.insurance_verified} /></div>
              </>
            )}

            <div className="section-hdr" style={{ marginTop: 16 }}>Contact Log</div>
            {['contact1', 'contact2', 'contact3'].map((k, i) => (
              <div className="info-row" key={k}>
                <span className="info-label">{i + 1}{['st', 'nd', 'rd'][i]} Contact</span>
                {editMode
                  ? <input className="edit-input" type="date" value={e[k] || ''} onChange={ev => field(k)(ev.target.value)} style={{ width: 160 }} />
                  : <span className={r[k] ? 'contact-val' : 'info-val'}>{r[k] || '--'}</span>}
              </div>
            ))}

            {editMode && (
              <>
                <div style={{ marginTop: 12 }}>
                  <div className="label">Date Received</div>
                  <input className="edit-input" type="date" value={e.date_received || ''} onChange={ev => field('date_received')(ev.target.value)} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="label">Office</div>
                  <select className="edit-select" value={e.office || ''} onChange={ev => field('office')(ev.target.value)}>
                    {OFFICES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div>
            <div className="section-hdr">Intake Checklist</div>
            {CHECKLIST_FIELDS.map(([label, key, opts]) => (
              <div className="info-row" key={key}>
                <span className="info-label">{label}</span>
                {editMode
                  ? <select className="edit-select" value={e[key] || ''} onChange={ev => field(key)(ev.target.value)} style={{ width: 160 }}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <Badge value={r[key]} />}
              </div>
            ))}

            <div style={{ marginTop: 14 }}>
              <div className="label">Intake Personnel</div>
              {editMode
                ? <select className="edit-select" value={e.intake_personnel || ''} onChange={ev => field('intake_personnel')(ev.target.value)}>
                    {STAFF.map(s => <option key={s}>{s}</option>)}
                  </select>
                : <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 15, marginTop: 4 }}>{r.intake_personnel || '--'}</div>}
            </div>

            {editMode ? (
              <div style={{ marginTop: 14 }}>
                <div className="label">Notes</div>
                <textarea className="edit-input" rows={3} value={e.notes || ''} onChange={ev => field('notes')(ev.target.value)} style={{ resize: 'vertical' }} />
              </div>
            ) : r.notes ? (
              <div style={{ marginTop: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>Notes</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{r.notes}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-foot">
          <FootLeft />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-ghost"
              onClick={handleDelete}
              disabled={saving}
              style={{ color: '#ef4444', borderColor: '#ef444440' }}
            >
              Delete
            </button>
            {editMode ? (
              <>
                <button className="btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={onClose}>Close</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
