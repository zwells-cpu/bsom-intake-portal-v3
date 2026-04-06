import { useEffect, useState } from 'react'
import { normalizeTreatmentPlanStatus } from '../lib/utils'

const INTERVIEW_STATUSES = ['Awaiting Assignment', 'Scheduled', 'Completed', 'No Show']
const TREATMENT_PLAN_STATUSES = ['Not Started', 'In Progress', 'Finalized']
const AUTHORIZATION_STATUSES = ['Not Submitted', 'Pending', 'In Review', 'Approved', 'Reauthorization Needed', 'Appeal Pending', 'Denied', 'No PA Needed', 'Approved/Discharged', 'Referred Out']

function displayValue(value) {
  return value || '--'
}

function DetailRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{displayValue(value)}</span>
    </div>
  )
}

export function AssessmentDetailModal({ assessment, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(assessment)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(assessment)
  }, [assessment])

  const recordId = form?.assessment_id ?? form?.id ?? null
  const office = form?.clinic || form?.office || ''

  const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!recordId) return
    setSaving(true)
    const patch = {
      assigned_bcba: form.assigned_bcba || '',
      treatment_plan_status: normalizeTreatmentPlanStatus(form.treatment_plan_status || 'Not Started'),
      treatment_plan_started_date: form.treatment_plan_started_date || null,
      treatment_plan_completed_date: form.treatment_plan_completed_date || null,
      authorization_status: form.authorization_status || '',
      ready_for_services: form.ready_for_services === true || form.ready_for_services === 'true',
      parent_interview_status: form.parent_interview_status || '',
      parent_interview_scheduled_date: form.parent_interview_scheduled_date || null,
      parent_interview_completed_date: form.parent_interview_completed_date || null,
      insurance: form.insurance || '',
      notes: form.notes || '',
    }
    const res = await onSave(recordId, patch)
    if (res?.success) onClose()
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!recordId || !onDelete) return
    if (!window.confirm('Delete this assessment record? This action cannot be undone.')) return

    setDeleting(true)
    const res = await onDelete(recordId)
    if (res?.success) onClose()
    setDeleting(false)
  }

  const renderEditableDate = (label, key) => (
    <div>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="edit-input"
          type="date"
          value={form?.[key] || ''}
          onChange={ev => setField(key)(ev.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn-ghost" type="button" onClick={() => setField(key)('')}>
          Clear
        </button>
      </div>
    </div>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={ev => ev.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{displayValue(form?.client_name || form?.name)}</div>
            <div className="modal-sub">Parent interview details and scheduling</div>
          </div>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <div className="modal-body">
          <div>
            <div className="section-hdr">Client Details</div>
            <DetailRow label="Client Name" value={form?.client_name || form?.name} />
            <DetailRow label="Office" value={office} />
            <DetailRow label="Assigned BCBA" value={form?.assigned_bcba} />
            <DetailRow label="Interview Status" value={form?.parent_interview_status || 'Awaiting Assignment'} />
            <DetailRow label="Scheduled Date" value={form?.parent_interview_scheduled_date} />
            <DetailRow label="Completed Date" value={form?.parent_interview_completed_date} />
            <DetailRow label="Treatment Plan Status" value={normalizeTreatmentPlanStatus(form?.treatment_plan_status)} />
            <DetailRow label="Treatment Plan Started" value={form?.treatment_plan_started_date} />
            <DetailRow label="Treatment Plan Completed" value={form?.treatment_plan_completed_date} />
            <DetailRow label="Authorization Status" value={form?.authorization_status || form?.pa_status} />
            <DetailRow label="Ready for Services" value={form?.ready_for_services ? 'Yes' : 'No'} />
            <DetailRow label="Insurance" value={form?.insurance} />
            <DetailRow label="Caregiver Name" value={form?.caregiver} />
            <DetailRow label="Caregiver Phone" value={form?.caregiver_phone} />
            <DetailRow label="Caregiver Email" value={form?.caregiver_email} />

            <div style={{ marginTop: 14 }}>
              <div className="label">Notes</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, minHeight: 20 }}>
                {displayValue(form?.notes)}
              </div>
            </div>
          </div>

          <div>
            <div className="section-hdr">Edit Assessment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="label">Assigned BCBA</div>
                <input
                  className="edit-input"
                  value={form?.assigned_bcba || ''}
                  onChange={ev => setField('assigned_bcba')(ev.target.value)}
                />
              </div>

              <div>
                <div className="label">Interview Status</div>
                <select
                  className="edit-select"
                  value={form?.parent_interview_status || ''}
                  onChange={ev => setField('parent_interview_status')(ev.target.value)}
                >
                  <option value="">-- Select --</option>
                  {INTERVIEW_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              {renderEditableDate('Scheduled Date', 'parent_interview_scheduled_date')}
              {renderEditableDate('Completed Date', 'parent_interview_completed_date')}

              <div>
                <div className="label">Treatment Plan Status</div>
                <select
                  className="edit-select"
                  value={normalizeTreatmentPlanStatus(form?.treatment_plan_status)}
                  onChange={ev => setField('treatment_plan_status')(ev.target.value)}
                >
                  {TREATMENT_PLAN_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              {renderEditableDate('Treatment Plan Started', 'treatment_plan_started_date')}
              {renderEditableDate('Treatment Plan Completed', 'treatment_plan_completed_date')}

              <div>
                <div className="label">Authorization Status</div>
                <select
                  className="edit-select"
                  value={form?.authorization_status || form?.pa_status || 'Not Submitted'}
                  onChange={ev => setField('authorization_status')(ev.target.value)}
                >
                  {AUTHORIZATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div>
                <div className="label">Ready for Services</div>
                <select
                  className="edit-select"
                  value={form?.ready_for_services ? 'true' : 'false'}
                  onChange={ev => setField('ready_for_services')(ev.target.value)}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <div className="label">Insurance</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="edit-input"
                    value={form?.insurance || ''}
                    onChange={ev => setField('insurance')(ev.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn-ghost" type="button" onClick={() => setField('insurance')('')}>
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <div className="label">Notes</div>
                <textarea
                  className="edit-input"
                  rows={4}
                  value={form?.notes || ''}
                  onChange={ev => setField('notes')(ev.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <div style={{ color: 'var(--dim)', fontSize: 12 }}>
            {recordId ? 'Changes save to the assessment record.' : 'This record cannot be saved yet.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-ghost"
              onClick={handleDelete}
              disabled={saving || deleting || !recordId}
              style={{ color: '#ef4444', borderColor: '#ef444430' }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={handleSave} disabled={saving || deleting || !recordId}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
