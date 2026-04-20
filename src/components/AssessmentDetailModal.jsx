import { useEffect, useState } from 'react'
import { OFFICES, STAT, BOOL } from '../lib/constants'
import { getAssessmentLifecycleStatus, normalizeTreatmentPlanStatus } from '../lib/utils'

const INTERVIEW_STATUSES = ['Awaiting Assignment', 'Scheduled', 'Completed', 'No Show']
const TREATMENT_PLAN_STATUSES = ['Not Started', 'In Progress', 'Finalized']
const AUTHORIZATION_STATUSES = ['Not Submitted', 'Pending', 'In Review', 'Approved', 'Reauthorization Needed', 'Appeal Pending', 'Denied', 'No PA Needed', 'Approved/Discharged', 'Referred Out']

function asBoolString(value) {
  return value === true || value === 'true' ? 'true' : 'false'
}

function displayValue(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
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

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <div className="label">{label}</div>
      <input className="edit-input" value={value || ''} placeholder={placeholder} onChange={ev => onChange(ev.target.value)} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <div className="label">{label}</div>
      <select className="edit-select" value={value || ''} onChange={ev => onChange(ev.target.value)}>
        <option value="">-- Select --</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="edit-input" type="date" value={value || ''} onChange={ev => onChange(ev.target.value)} style={{ flex: 1 }} />
        <button className="btn-ghost" type="button" onClick={() => onChange('')}>Clear</button>
      </div>
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
  const clinic = form?.clinic || form?.office || ''
  const lifecycleStatus = getAssessmentLifecycleStatus(form)

  const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!recordId) return
    setSaving(true)
    const patch = {
      client_name: form.client_name || '',
      clinic: form.clinic || form.office || '',
      assigned_bcba: form.assigned_bcba || '',
      caregiver: form.caregiver || '',
      caregiver_phone: form.caregiver_phone || '',
      caregiver_email: form.caregiver_email || '',
      insurance: form.insurance || '',
      vineland: form.vineland || '',
      srs2: form.srs2 || '',
      parent_interview_status: form.parent_interview_status || '',
      parent_interview_scheduled_date: form.parent_interview_scheduled_date || null,
      parent_interview_completed_date: form.parent_interview_completed_date || null,
      direct_obs: form.direct_obs || '',
      treatment_plan_status: normalizeTreatmentPlanStatus(form.treatment_plan_status || 'Not Started'),
      treatment_plan_started_date: form.treatment_plan_started_date || null,
      treatment_plan_completed_date: form.treatment_plan_completed_date || null,
      authorization_status: form.authorization_status || '',
      authorization_submitted_date: form.authorization_submitted_date || null,
      authorization_approved_date: form.authorization_approved_date || null,
      ready_for_services: form.ready_for_services === true || form.ready_for_services === 'true',
      active_client_date: form.active_client_date || null,
      in_school: form.in_school || '',
      other_services: form.other_services || '',
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

  const handleMarkReferredOut = async () => {
    if (!recordId) return
    setSaving(true)
    const res = await onSave(recordId, {
      authorization_status: 'Referred Out',
      ready_for_services: false,
      active_client_date: null,
    })
    if (res?.success) onClose()
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={ev => ev.stopPropagation()} style={{ maxWidth: 1080 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{displayValue(form?.client_name)}</div>
            <div className="modal-sub">Live assessment record editor</div>
          </div>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <div className="modal-body assessment-modal-body">
          <div>
            <div className="section-hdr">Client Details</div>
            <DetailRow label="Client Name" value={form?.client_name} />
            <DetailRow label="Clinic" value={clinic} />
            <DetailRow label="Assigned BCBA" value={form?.assigned_bcba} />
            <DetailRow label="Caregiver" value={form?.caregiver} />
            <DetailRow label="Caregiver Phone" value={form?.caregiver_phone} />
            <DetailRow label="Caregiver Email" value={form?.caregiver_email} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Caregiver / Insurance</div>
            <DetailRow label="Insurance" value={form?.insurance} />
            <DetailRow label="In School" value={form?.in_school} />
            <DetailRow label="Other Services" value={form?.other_services} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Assessment Components</div>
            <DetailRow label="Parent Interview" value={form?.parent_interview_status} />
            <DetailRow label="Interview Scheduled" value={form?.parent_interview_scheduled_date} />
            <DetailRow label="Interview Completed" value={form?.parent_interview_completed_date} />
            <DetailRow label="Vineland" value={form?.vineland} />
            <DetailRow label="SRS-2" value={form?.srs2} />
            <DetailRow label="Direct Observation" value={form?.direct_obs} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Treatment Plan / Authorization</div>
            <DetailRow label="Treatment Plan" value={normalizeTreatmentPlanStatus(form?.treatment_plan_status)} />
            <DetailRow label="Authorization Status" value={form?.authorization_status} />
            <DetailRow label="Lifecycle Status" value={lifecycleStatus} />
            <DetailRow label="Ready for Services" value={form?.ready_for_services === true ? 'Yes' : 'No'} />
            <DetailRow label="Active Client Date" value={form?.active_client_date} />

            <div style={{ marginTop: 14 }}>
              <div className="label">Notes</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, minHeight: 20, whiteSpace: 'pre-wrap' }}>
                {displayValue(form?.notes)}
              </div>
            </div>
          </div>

          <div>
            <div className="section-hdr">Client Details</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <TextField label="Client Name" value={form?.client_name} onChange={setField('client_name')} />
              <SelectField label="Clinic" value={form?.clinic || form?.office || ''} onChange={setField('clinic')} options={OFFICES} />

              <TextField label="Assigned BCBA" value={form?.assigned_bcba} onChange={setField('assigned_bcba')} />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Caregiver / Insurance</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <TextField label="Caregiver" value={form?.caregiver} onChange={setField('caregiver')} />
              <TextField label="Caregiver Phone" value={form?.caregiver_phone} onChange={setField('caregiver_phone')} />
              <TextField label="Caregiver Email" value={form?.caregiver_email} onChange={setField('caregiver_email')} />
              <TextField label="Insurance" value={form?.insurance} onChange={setField('insurance')} />
              <SelectField label="In School" value={form?.in_school} onChange={setField('in_school')} options={BOOL} />
              <TextField label="Other Services" value={form?.other_services} onChange={setField('other_services')} placeholder="ABA, OT, speech, etc." />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Assessment Components</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <SelectField label="Vineland" value={form?.vineland} onChange={setField('vineland')} options={STAT} />
              <SelectField label="SRS-2" value={form?.srs2} onChange={setField('srs2')} options={STAT} />
              <SelectField label="Parent Interview Status" value={form?.parent_interview_status} onChange={setField('parent_interview_status')} options={INTERVIEW_STATUSES} />
              <DateField label="Interview Scheduled" value={form?.parent_interview_scheduled_date} onChange={setField('parent_interview_scheduled_date')} />
              <DateField label="Interview Completed" value={form?.parent_interview_completed_date} onChange={setField('parent_interview_completed_date')} />
              <SelectField label="Direct Observation" value={form?.direct_obs} onChange={setField('direct_obs')} options={STAT} />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Treatment Plan / Authorization</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <SelectField label="Treatment Plan Status" value={normalizeTreatmentPlanStatus(form?.treatment_plan_status)} onChange={setField('treatment_plan_status')} options={TREATMENT_PLAN_STATUSES} />
              <DateField label="Treatment Plan Started" value={form?.treatment_plan_started_date} onChange={setField('treatment_plan_started_date')} />
              <DateField label="Treatment Plan Completed" value={form?.treatment_plan_completed_date} onChange={setField('treatment_plan_completed_date')} />
              <SelectField label="Authorization Status" value={form?.authorization_status || ''} onChange={setField('authorization_status')} options={AUTHORIZATION_STATUSES} />
              <DateField label="Auth Submitted" value={form?.authorization_submitted_date} onChange={setField('authorization_submitted_date')} />
              <DateField label="Auth Approved" value={form?.authorization_approved_date} onChange={setField('authorization_approved_date')} />
              <div>
                <div className="label">Ready for Services</div>
                <select className="edit-select" value={asBoolString(form?.ready_for_services)} onChange={ev => setField('ready_for_services')(ev.target.value)}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <DateField label="Active Client Date" value={form?.active_client_date} onChange={setField('active_client_date')} />
            </div>

            <div style={{ marginTop: 14 }}>
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

        <div className="modal-foot">
          <div style={{ color: 'var(--dim)', fontSize: 12 }}>
            {recordId ? `Saving to assessment_id ${recordId}.` : 'This record cannot be saved yet.'}
          </div>
          <div className="modal-actions">
            {lifecycleStatus !== 'Referred Out' ? (
              <button
                className="btn-ghost"
                onClick={handleMarkReferredOut}
                disabled={saving || deleting || !recordId}
                style={{ color: '#8b5cf6', borderColor: '#8b5cf640' }}
              >
                Mark Referred Out
              </button>
            ) : null}
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
