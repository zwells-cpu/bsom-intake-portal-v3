import { useState } from 'react'
import { OFFICES, INSURANCE_PAYERS, REFERRAL_SOURCES, BOOL, STAT, STAFF, AUTISM_DIAGNOSIS_OPTIONS, REFERRAL_FORM_OPTIONS, IEP_REPORT_OPTIONS, emptyReferral } from '../lib/constants'
import { normalizeOptions, optionValues } from '../lib/lookups'
import { formatPhoneNumber, normalizeAutismDx } from '../lib/utils'

const STEPS = ['Client Info', 'Caregiver', 'Insurance', 'Documents', 'Review']
const ATTEND_SCHOOL_OPTIONS = ['Yes', 'No']
const INTAKE_PERSONNEL_OPTIONS = [...STAFF.slice(0, -1), 'Nicola', STAFF[STAFF.length - 1]]
const PHONE_FIELDS = new Set(['caregiver_phone', 'referral_source_phone', 'referral_source_fax'])

function StepDots({ step, setStep }) {
  return (
    <div className="step-row">
      {STEPS.map((label, index) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: index < STEPS.length - 1 ? 1 : 'none' }}>
          <div
            className={`step-dot ${index < step ? 'done' : index === step ? 'active' : 'future'}`}
            onClick={() => index <= step && setStep(index)}
            style={{ cursor: index <= step ? 'pointer' : 'default' }}
          >
            {index + 1}
          </div>
          {index < STEPS.length - 1 && <div className={`step-line ${index < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

function Field({ label, type = 'text', options, value, onChange, inputMode, maxLength }) {
  return (
    <div>
      <label className="label">{label}</label>
      {options ? (
        <select className="input-field" value={value || ''} onChange={onChange}>
          <option value="">-- Select --</option>
          {options.map(option => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input className="input-field" type={type} value={value || ''} onChange={onChange} inputMode={inputMode} maxLength={maxLength} />
      )}
    </div>
  )
}

export function NewReferralPage({ onSave, saving, officeOptions: liveOfficeOptions = [], insuranceOptions: liveInsuranceOptions = [], referralSourceOptions: liveReferralSourceOptions = [] }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyReferral())
  const officeOptions = optionValues(liveOfficeOptions.length ? liveOfficeOptions : normalizeOptions(OFFICES))
  const insuranceOptions = optionValues(liveInsuranceOptions.length ? liveInsuranceOptions : normalizeOptions(INSURANCE_PAYERS))
  const referralSourceOptions = optionValues(liveReferralSourceOptions.length ? liveReferralSourceOptions : normalizeOptions(REFERRAL_SOURCES))

  const f = (key) => (event) => {
    let nextValue = event.target.value

    if (PHONE_FIELDS.has(key)) nextValue = formatPhoneNumber(nextValue)
    if (key === 'autism_diagnosis') nextValue = normalizeAutismDx(nextValue)

    setForm(prev => ({ ...prev, [key]: nextValue }))
  }

  const handleSubmit = async () => {
    const res = await onSave({ ...form, autism_diagnosis: normalizeAutismDx(form.autism_diagnosis, { emptyAsNotReceived: false }) })
    if (res?.success) {
      setForm(emptyReferral())
      setStep(0)
    }
  }

  const steps = [
    <div className="form-grid">
      <Field label="First Name" value={form.first_name} onChange={f('first_name')} />
      <Field label="Last Name" value={form.last_name} onChange={f('last_name')} />
      <Field label="Date of Birth" type="date" value={form.dob} onChange={f('dob')} />
      <Field label="Date Received" type="date" value={form.date_received} onChange={f('date_received')} />
      <Field label="Office" options={officeOptions} value={form.office} onChange={f('office')} />
      <Field label="Reason for Referral" value={form.reason_for_referral} onChange={f('reason_for_referral')} />
      <Field label="Referral Source" options={referralSourceOptions} value={form.referral_source} onChange={f('referral_source')} />
      <Field label="Referral Source Phone" value={form.referral_source_phone} onChange={f('referral_source_phone')} inputMode="numeric" maxLength={12} />
      <Field label="Referral Source Fax" value={form.referral_source_fax} onChange={f('referral_source_fax')} inputMode="numeric" maxLength={12} />
      <Field label="Point of Contact" value={form.point_of_contact} onChange={f('point_of_contact')} />
      <Field label="Provider NPI" value={form.provider_npi} onChange={f('provider_npi')} />
    </div>,

    <div className="form-grid">
      <Field label="Caregiver Name" value={form.caregiver} onChange={f('caregiver')} />
      <Field label="Phone" value={form.caregiver_phone} onChange={f('caregiver_phone')} inputMode="numeric" maxLength={12} />
      <Field label="Email" value={form.caregiver_email} onChange={f('caregiver_email')} />
      <Field label="1st Contact Date" type="date" value={form.contact1} onChange={f('contact1')} />
      <Field label="2nd Contact Date" type="date" value={form.contact2} onChange={f('contact2')} />
      <Field label="3rd Contact Date" type="date" value={form.contact3} onChange={f('contact3')} />
    </div>,

    <div className="form-grid">
      <Field label="Primary Insurance" options={insuranceOptions} value={form.insurance} onChange={f('insurance')} />
      <Field label="Secondary Insurance" options={['None', ...insuranceOptions]} value={form.secondary_insurance} onChange={f('secondary_insurance')} />
      <Field label="Insurance Verified" options={BOOL} value={form.insurance_verified} onChange={f('insurance_verified')} />
    </div>,

    <div className="form-grid">
      <Field label="Referral Form Received" options={REFERRAL_FORM_OPTIONS} value={form.referral_form} onChange={f('referral_form')} />
      <Field label="Permission for Assessment" options={STAT} value={form.permission_assessment} onChange={f('permission_assessment')} />
      <Field label="Vineland" options={STAT} value={form.vineland} onChange={f('vineland')} />
      <Field label="SRS-2" options={STAT} value={form.srs2} onChange={f('srs2')} />
      <Field label="Attends School" options={ATTEND_SCHOOL_OPTIONS} value={form.attends_school} onChange={f('attends_school')} />
      <Field label="IEP Report" options={IEP_REPORT_OPTIONS} value={form.iep_report} onChange={f('iep_report')} />
      <Field label="Autism Diagnosis" options={AUTISM_DIAGNOSIS_OPTIONS} value={form.autism_diagnosis} onChange={f('autism_diagnosis')} />
      <Field label="Intake Paperwork" options={STAT} value={form.intake_paperwork} onChange={f('intake_paperwork')} />
      <Field label="Intake Personnel" options={INTAKE_PERSONNEL_OPTIONS} value={form.intake_personnel} onChange={f('intake_personnel')} />
    </div>,

    <div>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="section-hdr">Client</div>
        <div className="responsive-review-grid">
          {[['Name', `${form.first_name} ${form.last_name}`], ['DOB', form.dob], ['Office', form.office], ['Date Received', form.date_received]].map(([label, value]) => (
            <div key={label}><div className="label">{label}</div><div style={{ color: 'var(--text)' }}>{value || '--'}</div></div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <div className="section-hdr">Caregiver & Insurance</div>
        <div className="responsive-review-grid">
          {[['Caregiver', form.caregiver], ['Phone', form.caregiver_phone], ['Insurance', form.insurance], ['Verified', form.insurance_verified]].map(([label, value]) => (
            <div key={label}><div className="label">{label}</div><div style={{ color: 'var(--text)' }}>{value || '--'}</div></div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label className="label">Notes</label>
        <textarea className="input-field" rows={3} value={form.notes || ''} onChange={f('notes')} style={{ resize: 'vertical' }} />
      </div>
    </div>,
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="pg-hdr" style={{ marginBottom: 28 }}>
        <div className="pg-hdr-title">New Referral</div>
        <div className="pg-hdr-sub">Step {step + 1} of {STEPS.length}: {STEPS[step]}</div>
      </div>

      <StepDots step={step} setStep={setStep} />

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        {steps[step]}
      </div>

      <div className="responsive-form-actions">
        <button className="btn-ghost" onClick={() => setStep(current => Math.max(0, current - 1))} disabled={step === 0}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn-primary" onClick={() => setStep(current => current + 1)}>
            Next
          </button>
        ) : (
          <button className="btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Submit Referral'}
          </button>
        )}
      </div>
    </div>
  )
}
