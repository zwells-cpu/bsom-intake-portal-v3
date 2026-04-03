import { useState } from 'react'
import { OFFICES, INSURANCES, BOOL, STAT, STAFF, emptyReferral } from '../lib/constants'

const STEPS = ['Client Info', 'Caregiver', 'Insurance', 'Documents', 'Review']

export function NewReferralPage({ onSave, saving }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyReferral())

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    const res = await onSave(form)
    if (res?.success) {
      setForm(emptyReferral())
      setStep(0)
    }
  }

  const StepDots = () => (
    <div className="step-row">
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'future'}`}
            onClick={() => i <= step && setStep(i)} style={{ cursor: i <= step ? 'pointer' : 'default' }}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )

  const Field = ({ label, name, type = 'text', options }) => (
    <div>
      <label className="label">{label}</label>
      {options ? (
        <select className="input-field" value={form[name] || ''} onChange={f(name)}>
          <option value="">-- Select --</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input className="input-field" type={type} value={form[name] || ''} onChange={f(name)} />
      )}
    </div>
  )

  const steps = [
    // Step 0: Client Info
    <div className="form-grid">
      <Field label="First Name" name="first_name" />
      <Field label="Last Name" name="last_name" />
      <Field label="Date of Birth" name="dob" type="date" />
      <Field label="Date Received" name="date_received" type="date" />
      <Field label="Office" name="office" options={OFFICES} />
      <Field label="Reason for Referral" name="reason_for_referral" />
    </div>,

    // Step 1: Caregiver
    <div className="form-grid">
      <Field label="Caregiver Name" name="caregiver" />
      <Field label="Phone" name="caregiver_phone" />
      <Field label="Email" name="caregiver_email" />
      <Field label="1st Contact Date" name="contact1" type="date" />
      <Field label="2nd Contact Date" name="contact2" type="date" />
      <Field label="3rd Contact Date" name="contact3" type="date" />
    </div>,

    // Step 2: Insurance
    <div className="form-grid">
      <Field label="Primary Insurance" name="insurance" options={INSURANCES} />
      <Field label="Secondary Insurance" name="secondary_insurance" options={['None', ...INSURANCES]} />
      <Field label="Insurance Verified" name="insurance_verified" options={BOOL} />
    </div>,

    // Step 3: Documents
    <div className="form-grid">
      <Field label="Referral Form" name="referral_form" options={STAT} />
      <Field label="Permission for Assessment" name="permission_assessment" options={STAT} />
      <Field label="Vineland" name="vineland" options={STAT} />
      <Field label="SRS-2" name="srs2" options={STAT} />
      <Field label="Attends School" name="attends_school" options={BOOL} />
      <Field label="IEP Report" name="iep_report" options={STAT} />
      <Field label="Autism Diagnosis" name="autism_diagnosis" options={STAT} />
      <Field label="Intake Paperwork" name="intake_paperwork" options={STAT} />
      <Field label="Intake Personnel" name="intake_personnel" options={STAFF} />
    </div>,

    // Step 4: Review
    <div>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="section-hdr">Client</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Name', `${form.first_name} ${form.last_name}`], ['DOB', form.dob], ['Office', form.office], ['Date Received', form.date_received]].map(([l, v]) => (
            <div key={l}><div className="label">{l}</div><div style={{ color: 'var(--text)' }}>{v || '--'}</div></div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <div className="section-hdr">Caregiver & Insurance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['Caregiver', form.caregiver], ['Phone', form.caregiver_phone], ['Insurance', form.insurance], ['Verified', form.insurance_verified]].map(([l, v]) => (
            <div key={l}><div className="label">{l}</div><div style={{ color: 'var(--text)' }}>{v || '--'}</div></div>
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
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 4 }}>New Referral</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</div>
      </div>

      <StepDots />

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        {steps[step]}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : '💾 Submit Referral'}
          </button>
        )}
      </div>
    </div>
  )
}
