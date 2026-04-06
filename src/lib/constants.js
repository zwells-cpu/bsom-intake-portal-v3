export const OFFICES = ['MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT']

export const INSURANCES = [
  'Medicaid of MS', 'UHC', 'UHC Community', 'Magnolia', 'Molina',
  'BCBSMS', 'Aetna', 'Tricare', 'Cigna', 'TruCare', 'Other',
]

export const BOOL = ['YES', 'NO', 'AWAITING']

export const STAT = ['Completed', 'Emailed', 'Awaiting', 'Please Send', 'N/A']
export const AUTISM_DIAGNOSIS_OPTIONS = ['Received', 'Not Received', 'Requested']

export const STAFF = ['Zanteria', 'Aerianna', 'LaShannon', 'Keiara', 'Celia', 'Other']

export const ALL_ROLES = ['All Staff', ...STAFF.filter((s) => s !== 'Other')]

export const MODULES = [
  { id: 'dashboard', icon: '\u{1F4CA}', name: 'Dashboard', desc: 'At-a-glance stats, alerts, and recent activity', color: '#6366f1' },
  { id: 'intake', icon: '\u{1F4CB}', name: 'Intake', desc: 'Manage referrals, add new clients, track status', color: '#22c55e' },
  { id: 'assessment', icon: '\u{1F9EA}', name: 'Initial Assessments', desc: 'Vineland, SRS-2, IEP and assessment tracking', color: '#f59e0b' },
  { id: 'operations', icon: '\u{1F4C8}', name: 'Operational Insights', desc: 'Aging reports, volume, conversion rates, and team performance', color: '#fb923c' },
  { id: 'about', icon: '\u2139\uFE0F', name: 'About', desc: 'Office locations, version history, portal info', color: '#8b5cf6' },
]

export const MODULE_NAV = {
  dashboard: [
    { id: 'overview', icon: '\u{1F3E0}', label: 'Overview' },
  ],
  intake: [
    { id: 'intakedash', icon: '\u{1F3E0}', label: 'Intake Dashboard' },
    { id: 'all', icon: '\u{1F4CB}', label: 'All Referrals' },
    { id: 'new', icon: '+', label: 'New Referral' },
    { id: 'pending', icon: '\u{1F4C4}', label: 'Pending Documents' },
    { id: 'insurance', icon: '\u{1F6E1}\uFE0F', label: 'Insurance Verification' },
    { id: 'nr', icon: '\u{1F6AB}', label: 'Non-Responsive' },
  ],
  assessment: [
    { id: 'tracker', icon: '\u{1F9EA}', label: 'Assessment Tracker' },
    { id: 'interviews', icon: '\u{1F5E3}\uFE0F', label: 'Parent Interviews' },
    { id: 'bcba', icon: '\u{1F469}\u200D\u2695\uFE0F', label: 'BCBA Assignments' },
    { id: 'progress', icon: '\u{1F4C8}', label: 'Assessment Progress' },
    { id: 'txplan', icon: '\u{1F4DD}', label: 'Treatment Plan Status' },
    { id: 'readysvc', icon: '\u2B50', label: 'Ready for Services' },
  ],
  operations: [
    { id: 'pipeline', icon: '\u{1F504}', label: 'Pipeline Overview' },
    { id: 'aging', icon: '\u23F1\uFE0F', label: 'Referral Aging' },
    { id: 'volume', icon: '\u{1F3E2}', label: 'Clinic Volume' },
    { id: 'conversion', icon: '\u{1F4CA}', label: 'Conversion Rate' },
    { id: 'performance', icon: '\u2B50', label: 'Intake Performance' },
  ],
  about: [
    { id: 'locations', icon: '\u{1F4CD}', label: 'Office Locations' },
    { id: 'portal', icon: '\u2139\uFE0F', label: 'About the Portal' },
  ],
}

export const TX_STATUSES = ['Not Started', 'In Progress', 'Draft Complete', 'In Review', 'Finalized']

export const PA_COLORS = {
  Approved: '#22c55e',
  'Approved/Discharged': '#64748b',
  'No PA Needed': '#22c55e',
  Pending: '#f59e0b',
  'In Review': '#6366f1',
  'Reauthorization Needed': '#f59e0b',
  'Appeal Pending': '#fb923c',
  Denied: '#ef4444',
  'Referred Out': '#64748b',
}

export const PA_ICONS = {
  Approved: '\u2713',
  'Approved/Discharged': '\u{1F3C1}',
  'No PA Needed': '\u2713',
  Pending: '\u25D0',
  'In Review': '\u{1F50D}',
  'Reauthorization Needed': '\u{1F504}',
  'Appeal Pending': '\u26A0\uFE0F',
  Denied: '\u2717',
  'Referred Out': '\u{1F3C1}',
}

export const STAGE_COLORS = {
  'New Referral': '#6366f1',
  Intake: '#8b5cf6',
  'Initial Assessment': '#f59e0b',
  'PA Submitted': '#fb923c',
  'PA In Review': '#fb923c',
  'PA Approved': '#22c55e',
  'Active Client': '#22c55e',
  'Reauth Needed': '#f59e0b',
  Discharged: '#64748b',
}

export const STAGE_ICONS = {
  'New Referral': '\u{1F4E5}',
  Intake: '\u{1F4CB}',
  'Initial Assessment': '\u{1F9EA}',
  'PA Submitted': '\u{1F4E4}',
  'PA In Review': '\u{1F50D}',
  'PA Approved': '\u2705',
  'Active Client': '\u2B50',
  'Reauth Needed': '\u{1F504}',
  Discharged: '\u{1F3C1}',
}

export const CHECKLIST_FIELDS = [
  ['Referral Form', 'referral_form', STAT],
  ['Permission Assessment', 'permission_assessment', STAT],
  ['Vineland', 'vineland', STAT],
  ['SRS-2', 'srs2', STAT],
  ['Attends School', 'attends_school', BOOL],
  ['IEP Report', 'iep_report', STAT],
  ['Insurance Verified', 'insurance_verified', BOOL],
  ['Autism Diagnosis', 'autism_diagnosis', AUTISM_DIAGNOSIS_OPTIONS],
  ['Intake Paperwork', 'intake_paperwork', STAT],
]

export function emptyReferral() {
  return {
    first_name: '',
    last_name: '',
    dob: '',
    caregiver: '',
    caregiver_phone: '',
    caregiver_email: '',
    office: '',
    insurance: '',
    secondary_insurance: '',
    date_received: new Date().toISOString().split('T')[0],
    contact1: '',
    contact2: '',
    contact3: '',
    referral_form: '',
    permission_assessment: '',
    vineland: '',
    srs2: '',
    attends_school: '',
    iep_report: '',
    insurance_verified: '',
    autism_diagnosis: '',
    intake_paperwork: '',
    intake_personnel: '',
    referral_source: '',
    referral_source_phone: '',
    referral_source_fax: '',
    provider_npi: '',
    point_of_contact: '',
    reason_for_referral: '',
    notes: '',
    status: 'active',
  }
}
