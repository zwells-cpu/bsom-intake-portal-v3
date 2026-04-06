import { STAGE_COLORS, STAGE_ICONS, PA_COLORS, PA_ICONS } from './constants'

// ── Status color ──
export function sc(v) {
  if (!v || v === 'N/A' || v === '--') return '#94a3b8'
  const u = v.toUpperCase()
  if (u.includes('NOT RECEIVED')) return '#ef4444'
  if (u.includes('PLEASE')) return '#3b82f6'
  if (['COMPLETED','SIGNED','YES','RECEIVED'].some(x => u.includes(x))) return '#22c55e'
  if (['EMAILED','REMINDER','TOO YOUNG'].some(x => u.includes(x))) return '#f59e0b'
  if (['AWAITING','REQUESTED'].some(x => u.includes(x))) return '#fb923c'
  if (u === 'NO') return '#ef4444'
  if (['DISCHARGED','REFERRED OUT','CLOSED','INACTIVE','APPROVED/DISCHARGED'].some(x => u.includes(x))) return '#64748b'
  return '#64748b'
}

// ── Badge icon ──
export function badgeIcon(v) {
  if (!v) return ''
  const u = v.toUpperCase()
  if (u.includes('NOT RECEIVED')) return '✗ '
  if (['COMPLETED','SIGNED','YES','RECEIVED','VERIFIED','APPROVED','DONE','NO PA NEEDED'].some(x => u.includes(x))) return '✓ '
  if (['DENIED','NON-RESPONSIVE','PLEASE','DECLINED','MISSING'].some(x => u.includes(x))) return '✗ '
  if (u === 'NO') return '✗ '
  if (['IN PROGRESS','IN-PROGRESS','SUBMITTED','IN REVIEW','NOW SCHEDULED','REAUTH','AWAITING','WAITING','REQUESTED','EMAILED','SENT','APPEAL PENDING'].some(x => u.includes(x))) return '◐ '
  return ''
}

// ── Completion percentage ──
export function pct(r) {
  const fs = ['referral_form','permission_assessment','vineland','srs2','insurance_verified','autism_diagnosis','intake_paperwork','intake_personnel']
  const done = fs.filter(f => {
    const v = f === 'autism_diagnosis'
      ? normalizeAutismDx(r[f], { emptyAsNotReceived: false }).toUpperCase()
      : (r[f] || '').toUpperCase()
    return ['YES','COMPLETED','SIGNED','RECEIVED'].some(x => v.includes(x))
  })
  return Math.round(done.length / fs.length * 100)
}

// ── Office normalization ──
export function normalizeOffice(o) {
  if (o === 'JACKSON') return 'FLOWOOD'
  if (o === 'SCHOOL')  return 'DAY TREATMENT'
  if (o === 'NEWTON')  return 'FOREST'
  return o
}

export function normalizeStaffName(name) {
  const normalized = String(name || '').trim().toLowerCase().replace(/\s+/g, '')
  if (!normalized) return ''
  if (normalized === 'lashannon') return 'lashannon'
  if (normalized === 'aerianna' || normalized === 'ariana') return 'aerianna'
  if (normalized === 'keiara') return 'keiara'
  if (normalized === 'zanteria') return 'zanteria'
  if (normalized === 'celia') return 'celia'
  return normalized
}

export function displayStaffName(name) {
  const normalized = normalizeStaffName(name)
  if (normalized === 'zanteria') return 'Zanteria'
  if (normalized === 'aerianna') return 'Aerianna'
  if (normalized === 'lashannon') return 'LaShannon'
  if (normalized === 'keiara') return 'Keiara'
  if (normalized === 'celia') return 'Celia'
  return String(name || '').trim()
}

export function formatInsurance(name) {
  if (!name) return ''

  const map = {
    'medicaid of ms': 'Medicaid of MS',
    'uhc': 'UHC',
    'uhc comm': 'UHC Community',
    'uhc community': 'UHC Community',
    'magnolia': 'Magnolia',
    'molina': 'Molina',
    'bcbsms': 'BCBSMS',
    'aetna': 'Aetna',
    'tri care': 'Tricare',
    'tricare': 'Tricare',
    'cigna': 'Cigna',
    'trucare': 'TruCare',
  }

  const key = name.toLowerCase().trim()
  return map[key] || name
}

export function normalizeAutismDx(value, { emptyAsNotReceived = true } = {}) {
  if (value === null || value === undefined) return emptyAsNotReceived ? 'Not Received' : ''

  const normalized = String(value).trim()
  if (!normalized) return emptyAsNotReceived ? 'Not Received' : ''

  const upper = normalized.toUpperCase()

  if (upper === 'COMPLETED' || upper === 'RECEIVED') return 'Received'
  if (upper === 'NOT RECEIVED' || upper === 'NO') return 'Not Received'
  if (upper === 'AWAITING' || upper === 'REQUESTED') return 'Requested'

  return normalized
}

export function normalizeTreatmentPlanStatus(status) {
  if (!status) return 'Not Started'

  const value = String(status).trim()
  const upper = value.toUpperCase()

  if (['DRAFTING', 'DRAFT COMPLETE', 'WRITTEN', 'IN REVIEW', 'IN PROGRESS'].includes(upper)) return 'In Progress'
  if (['FINALIZED', 'DONE', 'COMPLETED'].includes(upper)) return 'Finalized'
  if (upper === 'NOT STARTED') return 'Not Started'

  return value
}

function hasMeaningfulAssessmentValue(value) {
  if (value === null || value === undefined) return false
  const normalized = String(value).trim()
  if (!normalized) return false
  return normalized.toUpperCase() !== 'N/A'
}

function isCompletedAssessmentValue(value) {
  const normalized = String(value || '').trim().toUpperCase()
  return ['YES', 'DONE', 'COMPLETED', 'RECEIVED', 'SIGNED'].some(token => normalized.includes(token))
}

export function getAssessmentWorkflowProgress(record) {
  const components = [
    { key: 'parent_interview_status', completed: String(record?.parent_interview_status || '').trim().toUpperCase() === 'COMPLETED', started: hasMeaningfulAssessmentValue(record?.parent_interview_status) },
    { key: 'vineland', completed: isCompletedAssessmentValue(record?.vineland), started: hasMeaningfulAssessmentValue(record?.vineland) },
    { key: 'srs2', completed: isCompletedAssessmentValue(record?.srs2), started: hasMeaningfulAssessmentValue(record?.srs2) },
    { key: 'direct_obs', completed: isCompletedAssessmentValue(record?.direct_obs), started: hasMeaningfulAssessmentValue(record?.direct_obs) },
  ]

  const total = components.length
  const completed = components.filter(component => component.completed).length
  const started = components.some(component => component.started)

  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100),
    started,
  }
}

export function getAssessmentWorkflowStatus(record) {
  const { completed, total, started } = getAssessmentWorkflowProgress(record)
  if (completed >= total) return 'Completed'
  if (started || completed > 0) return 'In Progress'
  return 'Not Started'
}

export function getAssessmentRecordId(record) {
  return record?.assessment_id ?? record?.id ?? null
}

export function getAuthorizationStatus(record) {
  return record?.authorization_status || record?.pa_status || ''
}

// ── Status color helper for assessments ──
export function statusColor(s) {
  if (['Finalized','Done','Completed'].includes(s)) return '#22c55e'
  if (['In Progress','In Review','Draft Complete'].includes(s)) return '#f59e0b'
  if (['Not Started'].includes(s)) return '#ef4444'
  return '#64748b'
}

// ── Sort list ──
export function sortList(list, sortCol, sortDir) {
  if (!sortCol) return list
  return [...list].sort((a, b) => {
    if (sortCol === 'pct') {
      const av = pct(a), bv = pct(b)
      return sortDir === 'asc' ? av - bv : bv - av
    }
    const av = a[sortCol] || '', bv = b[sortCol] || ''
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
}

// ── Export CSV ──
export function exportCSV(refs) {
  const active = refs.filter(r => r.status === 'active')
  const cols = ['first_name','last_name','dob','caregiver','caregiver_phone','caregiver_email','office','insurance','insurance_verified','autism_diagnosis','intake_paperwork','intake_personnel','referral_form','permission_assessment','vineland','srs2','attends_school','iep_report','contact1','contact2','contact3','date_received','notes','status']
  const csv = [
    cols.join(','),
    ...active.map(r => cols.map(c => '"' + (r[c] || '').replace(/"/g, '""') + '"').join(',')),
  ].join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'bsom_referrals.csv',
  })
  a.click()
}
