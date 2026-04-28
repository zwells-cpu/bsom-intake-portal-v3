import { useEffect, useState } from 'react'
import { ConfirmationModal } from './ConfirmationModal'
import { OFFICES } from '../lib/constants'
import { cleanLookupValue, includeCurrentOption, normalizeOptions, optionValues } from '../lib/lookups'
import {
  ASSESSMENT_COMPONENT_STATUSES,
  PARENT_INTERVIEW_STATUSES,
  TREATMENT_PLAN_STATUSES,
  formatDate,
  getAssessmentLifecycleStatus,
  normalizeAssessmentComponentStatus,
  normalizeParentInterviewStatus,
  normalizeTreatmentPlanStatus,
  statusColor,
} from '../lib/utils'

const AUTHORIZATION_STATUSES = ['Not Submitted', 'Pending', 'In Review', 'Approved', 'Reauthorization Needed', 'Appeal Pending', 'Denied', 'No PA Needed', 'Approved/Discharged', 'Referred Out']

function asBoolString(value) {
  return value === true || value === 'true' ? 'true' : 'false'
}

function displayValue(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return value || '--'
}

function assessVal(value) {
  const normalized = normalizeAssessmentComponentStatus(value)
  if (!normalized) return <span style={{ color: 'var(--dim)', fontSize: 12 }}>--</span>
  const color = statusColor(normalized)

  return <span className="bdg" style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>{normalized}</span>
}

function DetailRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{displayValue(value)}</span>
    </div>
  )
}

function BadgeDetailRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{assessVal(value)}</span>
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

function SelectField({ label, value, onChange, options, placeholder = '-- Select --' }) {
  return (
    <div>
      <div className="label">{label}</div>
      <select className="edit-select" value={value || ''} onChange={ev => onChange(ev.target.value)}>
        <option value="">{placeholder}</option>
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

export function AssessmentDetailModal({ assessment, onClose, onSave, onDelete, bcbaOptions = [], officeOptions: liveOfficeOptions = [] }) {
  const [form, setForm] = useState(assessment)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    setForm(assessment)
  }, [assessment])

  const recordId = form?.assessment_id ?? form?.id ?? null
  const clinic = form?.clinic || form?.office || ''
  const lifecycleStatus = getAssessmentLifecycleStatus(form)
  const officeOptions = includeCurrentOption(optionValues(liveOfficeOptions.length ? liveOfficeOptions : normalizeOptions(OFFICES)), clinic)
  const currentBcba = cleanLookupValue(form?.assigned_bcba)
  const bcbaValues = (bcbaOptions.length ? bcbaOptions : normalizeOptions([]))
    .map(option => cleanLookupValue(option.value ?? option.label ?? option))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  const matchingBcbaOption = bcbaValues.find(option => option.toLowerCase() === currentBcba.toLowerCase())
  const selectedBcbaValue = matchingBcbaOption || currentBcba
  const assignedBcbaOptions = currentBcba && !matchingBcbaOption
    ? [currentBcba, ...bcbaValues]
    : bcbaValues

  const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!recordId) return
    setSaving(true)
    const patch = {
      client_name: form.client_name || '',
      clinic: form.clinic || form.office || '',
      assigned_bcba: selectedBcbaValue,
      caregiver: form.caregiver || '',
      caregiver_phone: form.caregiver_phone || '',
      caregiver_email: form.caregiver_email || '',
      insurance: form.insurance || '',
      vineland: normalizeAssessmentComponentStatus(form.vineland),
      srs2: normalizeAssessmentComponentStatus(form.srs2),
      vbmapp: normalizeAssessmentComponentStatus(form.vbmapp),
      socially_savvy: normalizeAssessmentComponentStatus(form.socially_savvy),
      parent_interview_status: normalizeParentInterviewStatus(form.parent_interview_status),
      parent_interview_scheduled_date: form.parent_interview_scheduled_date || null,
      parent_interview_completed_date: form.parent_interview_completed_date || null,
      direct_obs_status: normalizeAssessmentComponentStatus(form.direct_obs_status || form.direct_obs),
      direct_obs_scheduled_date: form.direct_obs_scheduled_date || null,
      direct_obs_completed_date: form.direct_obs_completed_date || null,
      treatment_plan_status: normalizeTreatmentPlanStatus(form.treatment_plan_status || 'Not Started'),
      treatment_plan_started_date: form.treatment_plan_started_date || null,
      treatment_plan_completed_date: form.treatment_plan_completed_date || null,
      authorization_status: form.authorization_status || '',
      authorization_submitted_date: form.authorization_submitted_date || null,
      authorization_approved_date: form.authorization_approved_date || null,
      ready_for_services: form.ready_for_services === true || form.ready_for_services === 'true',
      active_client_date: form.active_client_date || null,
      other_services: form.other_services || '',
      notes: form.notes || '',
    }
    const res = await onSave(recordId, patch)
    if (res?.success) onClose()
    setSaving(false)
  }

  const performDelete = async () => {
    if (!recordId || !onDelete) return
    setDeleting(true)
    const res = await onDelete(recordId)
    if (res?.success) onClose()
    setDeleting(false)
  }

  const handleDeleteRequest = () => {
    if (!recordId || !onDelete) return
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    await performDelete()
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
            <DetailRow label="Other Services" value={form?.other_services} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Assessment Components</div>
            <BadgeDetailRow label="Vineland" value={form?.vineland} />
            <BadgeDetailRow label="SRS-2" value={form?.srs2} />
            <BadgeDetailRow label="VBMAPP" value={form?.vbmapp} />
            <BadgeDetailRow label="Socially Savvy" value={form?.socially_savvy} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Parent Interview Workflow</div>
            <DetailRow label="Assigned BCBA" value={form?.assigned_bcba} />
            <BadgeDetailRow label="Parent Interview Status" value={normalizeParentInterviewStatus(form?.parent_interview_status)} />
            <DetailRow label="Interview Scheduled" value={form?.parent_interview_scheduled_date} />
            <DetailRow label="Interview Completed" value={form?.parent_interview_completed_date} />
            <BadgeDetailRow label="Direct Observation Status" value={form?.direct_obs_status || form?.direct_obs} />
            <DetailRow label="Direct Observation Scheduled" value={form?.direct_obs_scheduled_date} />
            <DetailRow label="Direct Observation Completed" value={form?.direct_obs_completed_date} />

            <div className="section-hdr" style={{ marginTop: 18 }}>Treatment Plan / Authorization</div>
            <DetailRow label="Treatment Plan" value={normalizeTreatmentPlanStatus(form?.treatment_plan_status)} />
            <DetailRow label="Authorization Status" value={form?.authorization_status} />
            <DetailRow label="Auth Approved" value={formatDate(form?.authorization_approved_date)} />
            <DetailRow label="Lifecycle Status" value={lifecycleStatus} />
            <DetailRow label="Ready for Services" value={form?.ready_for_services === true ? 'Yes' : 'No'} />
            <DetailRow label="Active Client Date" value={formatDate(form?.active_client_date)} />

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
              <SelectField label="Clinic" value={form?.clinic || form?.office || ''} onChange={setField('clinic')} options={officeOptions} />

              <SelectField label="Assigned BCBA" value={selectedBcbaValue} onChange={setField('assigned_bcba')} options={assignedBcbaOptions} placeholder="Select BCBA" />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Caregiver / Insurance</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <TextField label="Caregiver" value={form?.caregiver} onChange={setField('caregiver')} />
              <TextField label="Caregiver Phone" value={form?.caregiver_phone} onChange={setField('caregiver_phone')} />
              <TextField label="Caregiver Email" value={form?.caregiver_email} onChange={setField('caregiver_email')} />
              <TextField label="Insurance" value={form?.insurance} onChange={setField('insurance')} />
              <TextField label="Other Services" value={form?.other_services} onChange={setField('other_services')} placeholder="ABA, OT, speech, etc." />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Assessment Components</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <SelectField label="Vineland" value={normalizeAssessmentComponentStatus(form?.vineland)} onChange={setField('vineland')} options={ASSESSMENT_COMPONENT_STATUSES} />
              <SelectField label="SRS-2" value={normalizeAssessmentComponentStatus(form?.srs2)} onChange={setField('srs2')} options={ASSESSMENT_COMPONENT_STATUSES} />
              <SelectField label="VBMAPP" value={normalizeAssessmentComponentStatus(form?.vbmapp)} onChange={setField('vbmapp')} options={ASSESSMENT_COMPONENT_STATUSES} />
              <SelectField label="Socially Savvy" value={normalizeAssessmentComponentStatus(form?.socially_savvy)} onChange={setField('socially_savvy')} options={ASSESSMENT_COMPONENT_STATUSES} />
            </div>

            <div className="section-hdr" style={{ marginTop: 18 }}>Parent Interview Workflow</div>
            <div className="responsive-review-grid" style={{ gap: 12 }}>
              <SelectField label="Assigned BCBA" value={selectedBcbaValue} onChange={setField('assigned_bcba')} options={assignedBcbaOptions} placeholder="Select BCBA" />
              <SelectField label="Parent Interview Status" value={normalizeParentInterviewStatus(form?.parent_interview_status)} onChange={setField('parent_interview_status')} options={PARENT_INTERVIEW_STATUSES} />
              <DateField label="Interview Scheduled" value={form?.parent_interview_scheduled_date} onChange={setField('parent_interview_scheduled_date')} />
              <DateField label="Interview Completed" value={form?.parent_interview_completed_date} onChange={setField('parent_interview_completed_date')} />
              <SelectField label="Direct Observation Status" value={normalizeAssessmentComponentStatus(form?.direct_obs_status || form?.direct_obs)} onChange={setField('direct_obs_status')} options={ASSESSMENT_COMPONENT_STATUSES} />
              <DateField label="Direct Observation Scheduled" value={form?.direct_obs_scheduled_date} onChange={setField('direct_obs_scheduled_date')} />
              <DateField label="Direct Observation Completed" value={form?.direct_obs_completed_date} onChange={setField('direct_obs_completed_date')} />
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
          <div />
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
              className="btn-danger"
              onClick={handleDeleteRequest}
              disabled={saving || deleting || !recordId}
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

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        title="Delete Assessment"
        message="Deleting this assessment will remove all associated data."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}
