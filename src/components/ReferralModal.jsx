import { useState, useEffect } from 'react'
import { Badge, OfficePill, ProgressRing, StagePill } from './Badge'
import { ConfirmationModal } from './ConfirmationModal'
import { INSURANCE_PAYERS, REFERRAL_SOURCES, BOOL, STAFF, OFFICES, CHECKLIST_FIELDS } from '../lib/constants'
import { includeCurrentOption, normalizeOptions, optionValues } from '../lib/lookups'
import { formatDisplayDate, getReferralStage, pct, formatInsurance, normalizeAutismDx, normalizeReferralFieldValue } from '../lib/utils'
import { API_BASE } from '../lib/api'

const MAX_FILE_SIZE = 10 * 1024 * 1024

const DOCUMENT_TYPE_OPTIONS = ['Referral Form', 'Insurance Card', 'Diagnosis Report', 'Assessment Report', 'IEP/School Records', 'Consent Form', 'Other']

function formatFileSize(size) {
  if (!size) return '--'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ReferralModal({ referral, onClose, onSave, onDelete, onSetStatus, onToggleParentInterview, onUploadDocument, officeOptions: liveOfficeOptions = [], insuranceOptions: liveInsuranceOptions = [], referralSourceOptions: liveReferralSourceOptions = [] }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    ...referral,
    autism_diagnosis: normalizeAutismDx(referral.autism_diagnosis),
    referral_form: normalizeReferralFieldValue('referral_form', referral.referral_form),
    iep_report: normalizeReferralFieldValue('iep_report', referral.iep_report),
  })
  const [saving, setSaving] = useState(false)
  const [docType, setDocType] = useState('Referral Form')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsKey, setDocsKey] = useState(0)

  useEffect(() => {
    if (!referral?.id) return
    let cancelled = false
    setDocsLoading(true)
    fetch(`${API_BASE}/referrals/${referral.id}/documents`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (!cancelled) setDocs(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setDocs([]) })
      .finally(() => { if (!cancelled) setDocsLoading(false) })
    return () => { cancelled = true }
  }, [referral?.id, docsKey])

  const r = referral
  const e = editMode ? form : referral
  const intakeStage = getReferralStage(e)
  const officeOptions = includeCurrentOption(optionValues(liveOfficeOptions.length ? liveOfficeOptions : normalizeOptions(OFFICES)), e.office)
  const insuranceOptions = includeCurrentOption(optionValues(liveInsuranceOptions.length ? liveInsuranceOptions : normalizeOptions(INSURANCE_PAYERS)), e.insurance)
  const secondaryInsuranceOptions = includeCurrentOption(['None', ...insuranceOptions], e.secondary_insurance)
  const referralSourceOptions = includeCurrentOption(optionValues(liveReferralSourceOptions.length ? liveReferralSourceOptions : normalizeOptions(REFERRAL_SOURCES)), e.referral_source)

  const field = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    const patch = { ...form }
    patch.autism_diagnosis = normalizeAutismDx(form.autism_diagnosis)
    delete patch.id
    delete patch.created_at
    delete patch.user_id
    const res = await onSave(r.id, patch)
    if (res?.success) setEditMode(false)
    setSaving(false)
  }

  const performDelete = async () => {
    setSaving(true)
    const res = await onDelete(r.id)
    if (res?.success) {
      setEditMode(false)
      onClose()
    }
    setSaving(false)
  }

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    await performDelete()
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setSelectedFile(null)
    setUploadError(null)
    setUploadSuccess(null)
    setDocType('Referral Form')
  }

  const handleDocumentUpload = async () => {
    if (!selectedFile || !onUploadDocument) return

    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadError('File must be under 10 MB.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    const res = await onUploadDocument({
      referral: r,
      documentType: docType,
      file: selectedFile,
    })

    if (res?.success) {
      setUploadSuccess(`Uploaded ${selectedFile.name}`)
      setSelectedFile(null)
      setDocType('Referral Form')
      setDocsKey(k => k + 1)
    } else {
      setUploadError(res?.error || 'Could not upload document.')
    }

    setUploading(false)
  }

  const isNR = r.status === 'non-responsive' || r.status === 'referred-out'

  const handleStatusChange = async (status) => {
    if (!onSetStatus) return
    setSaving(true)
    await onSetStatus(r.id, status)
    setSaving(false)
  }

  const FootLeft = () => {
    if (isNR) {
      return (
        <button onClick={() => handleStatusChange('active')}
          disabled={saving}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Restore Active
        </button>
      )
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => handleStatusChange('non-responsive')}
          disabled={saving}
          style={{ color: '#ef4444', borderColor: '#ef444440', fontSize: 12 }}>
          Non-Responsive
        </button>
        <button className="btn-ghost" onClick={() => handleStatusChange('referred-out')}
          disabled={saving}
          style={{ color: '#8b5cf6', borderColor: '#8b5cf640', fontSize: 12 }}>
          Referred Out
        </button>
        <button onClick={() => onToggleParentInterview(r.id, !r.ready_for_parent_interview)}
          style={{
            padding: '7px 13px', borderRadius: 8,
            border: `1px solid ${r.ready_for_parent_interview ? '#22c55e40' : '#1a2840'}`,
            background: r.ready_for_parent_interview ? '#22c55e15' : 'transparent',
            color: r.ready_for_parent_interview ? '#22c55e' : 'var(--dim)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
          {r.ready_for_parent_interview ? 'Ready for Interview' : 'Mark Ready for Interview'}
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
              DOB: {formatDisplayDate(r.dob)} | Received: {formatDisplayDate(r.date_received)} | <OfficePill office={r.office} />
            </div>
          </div>
          <div className="modal-actions">
            <ProgressRing value={pct(r)} />
            <button className={`btn-edit ${editMode ? 'editing' : ''}`}
              onClick={() => { if (!editMode) { setForm({
                ...r,
                autism_diagnosis: normalizeAutismDx(r.autism_diagnosis),
                referral_form: normalizeReferralFieldValue('referral_form', r.referral_form),
                iep_report: normalizeReferralFieldValue('iep_report', r.iep_report),
              }); setEditMode(true) } else handleCancelEdit() }}>
              {editMode ? 'Editing' : 'Edit Record'}
            </button>
            <button className="close-btn" onClick={onClose}>x</button>
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
                  <div style={{ color: 'var(--text)', fontSize: 14 }}>{v || '--'}</div>
                </div>
              ))
            )}

            <div className="section-hdr" style={{ marginTop: 4 }}>Insurance</div>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                <div className="info-row"><span className="info-label">Primary</span>
                  <select className="edit-select" value={e.insurance || ''} onChange={ev => field('insurance')(ev.target.value)}>
                    {insuranceOptions.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="info-row"><span className="info-label">Secondary</span>
                  <select className="edit-select" value={e.secondary_insurance || ''} onChange={ev => field('secondary_insurance')(ev.target.value)}>
                    {secondaryInsuranceOptions.map(i => <option key={i}>{i}</option>)}
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
                  : <span className={r[k] ? 'contact-val' : 'info-val'}>{r[k] ? formatDisplayDate(r[k]) : '--'}</span>}
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
                    {officeOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div>
            <div className="section-hdr">Intake Checklist</div>
            <div className="info-row">
              <span className="info-label">Current Intake Stage</span>
              <StagePill stage={intakeStage} />
            </div>
            {CHECKLIST_FIELDS.map(([label, key, opts]) => (
              <div className="info-row" key={key}>
                <span className="info-label">{label}</span>
                {editMode
                  ? <select className="edit-select" value={e[key] || ''} onChange={ev => field(key)(ev.target.value)} style={{ width: 160 }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <Badge value={key === 'autism_diagnosis' ? normalizeAutismDx(r[key]) : normalizeReferralFieldValue(key, r[key])} />}
              </div>
            ))}

            <div style={{ marginTop: 14 }}>
              <div className="label">Referral Source</div>
              {editMode
                ? <select className="edit-select" value={e.referral_source || ''} onChange={ev => field('referral_source')(ev.target.value)}>
                    <option value="">-- Select --</option>
                    {referralSourceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                : <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, marginTop: 4 }}>{r.referral_source || '--'}</div>}
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Intake Personnel</div>
              {editMode
                ? <select className="edit-select" value={e.intake_personnel || ''} onChange={ev => field('intake_personnel')(ev.target.value)}>
                    {STAFF.map(s => <option key={s}>{s}</option>)}
                  </select>
                : <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, marginTop: 4 }}>{r.intake_personnel || '--'}</div>}
            </div>

            {editMode ? (
              <div style={{ marginTop: 14 }}>
                <div className="label">Notes</div>
                <textarea className="edit-input" rows={3} value={e.notes || ''} onChange={ev => field('notes')(ev.target.value)} style={{ resize: 'vertical' }} />
              </div>
            ) : r.notes ? (
              <div style={{ marginTop: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div className="label" style={{ marginBottom: 6 }}>Notes</div>
                <div style={{ color: 'var(--text)', fontSize: 13 }}>{r.notes}</div>
              </div>
            ) : null}

            <div className="section-hdr" style={{ marginTop: 18 }}>Client Documents</div>
            <div className="card card-pad" style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: 'none' }}>

              {/* Upload form - edit mode only */}
              {editMode && (
                <div style={{ display: 'grid', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="label">Document Type</div>
                    <select className="edit-select" value={docType} onChange={ev => setDocType(ev.target.value)}>
                      {DOCUMENT_TYPE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="label">File</div>
                    <input
                      className="edit-input"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={ev => {
                        const nextFile = ev.target.files?.[0] || null
                        setSelectedFile(nextFile)
                        setUploadError(null)
                        setUploadSuccess(null)
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--dim)' }}>
                      PDF and image files only | max 10 MB.
                    </div>
                  </div>

                  {selectedFile && (
                    <div style={{ fontSize: 12, color: 'var(--text)', padding: '10px 12px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                      {selectedFile.name} | {formatFileSize(selectedFile.size)}
                    </div>
                  )}

                  {uploadError && (
                    <div className="error-bar" style={{ margin: 0 }}>
                      {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div style={{ borderRadius: 10, border: '1px solid #16a34a33', background: '#16a34a12', color: '#16a34a', padding: '10px 12px', fontSize: 12, fontWeight: 700 }}>
                      {uploadSuccess}
                    </div>
                  )}

                  <button className="btn-save" onClick={handleDocumentUpload} disabled={!selectedFile || uploading}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              )}

              {/* Document list - always visible */}
              {docsLoading && (
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>Loading documents...</div>
              )}

              {!docsLoading && docs.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  {docs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                        <div style={{ color: 'var(--muted)', marginTop: 2 }}>{doc.document_type} | {formatFileSize(doc.file_size)}</div>
                      </div>
                      {doc.created_at && (
                        <div style={{ color: 'var(--dim)', whiteSpace: 'nowrap' }}>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!docsLoading && docs.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                  {editMode ? 'No documents yet. Use the uploader above to attach files.' : 'No documents attached.'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <FootLeft />
          <div className="modal-actions">
            {editMode ? (
              <>
                <button className="btn-danger" onClick={handleDeleteRequest} disabled={saving}>
                  Delete
                </button>
                <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '0 4px' }} />
                <button className="btn-ghost" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={onClose}>Close</button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        title="Delete Referral"
        message="Are you sure you want to delete this referral? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}
