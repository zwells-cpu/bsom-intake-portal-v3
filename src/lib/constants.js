export const OFFICES = ['MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT']

export const INSURANCES = [
  'MEDICAID OF MS', 'UHC', 'UHC Comm', 'MAGNOLIA', 'MOLINA',
  'BCBSMS', 'Aetna', 'Tri Care', 'CIGNA', 'TruCARE', 'Other',
]

export const BOOL = ['YES', 'NO', 'AWAITING']

export const STAT = ['Completed', 'Emailed', 'Awaiting', 'Please Send', 'N/A']

export const STAFF = ['Zanteria', 'Aerianna', 'LaShannon', 'Keiara', 'Celia', 'Other']

export const ALL_ROLES = ['All Staff', ...STAFF.filter((s) => s !== 'Other')]

export const MODULES = [
  { id: 'dashboard',  icon: '📊', name: 'Dashboard',             desc: 'At-a-glance stats, alerts, and recent activity',              color: '#6366f1' },
  { id: 'intake',     icon: '📋', name: 'Intake',                desc: 'Manage referrals, add new clients, track status',             color: '#22c55e' },
  { id: 'assessment', icon: '🧪', name: 'Initial Assessments',   desc: 'Vineland, SRS-2, IEP and assessment tracking',                color: '#f59e0b' },
  { id: 'operations', icon: '📈', name: 'Operational Insights',  desc: 'Aging reports, volume, conversion rates, and team performance', color: '#fb923c' },
  { id: 'about',      icon: 'ℹ️', name: 'About',                 desc: 'Office locations, version history, portal info',              color: '#8b5cf6' },
]

export const MODULE_NAV = {
  dashboard: [
    { id: 'overview', icon: '🏠', label: 'Overview' },
  ],
  intake: [
    { id: 'intakedash', icon: '🏠', label: 'Intake Dashboard' },
    { id: 'all',        icon: '📋', label: 'All Referrals' },
    { id: 'new',        icon: '➕', label: 'New Referral' },
    { id: 'pending',    icon: '📄', label: 'Pending Documents' },
    { id: 'insurance',  icon: '🛡️', label: 'Insurance Verification' },
    { id: 'nr',         icon: '🚫', label: 'Non-Responsive' },
  ],
  assessment: [
    { id: 'tracker',    icon: '🧪', label: 'Assessment Tracker' },
    { id: 'interviews', icon: '🗣️', label: 'Parent Interviews' },
    { id: 'bcba',       icon: '👩‍⚕️', label: 'BCBA Assignments' },
    { id: 'progress',   icon: '📈', label: 'Assessment Progress' },
    { id: 'txplan',     icon: '📝', label: 'Treatment Plan Status' },
    { id: 'readysvc',   icon: '⭐', label: 'Ready for Services' },
  ],
  operations: [
    { id: 'pipeline',    icon: '🔄', label: 'Pipeline Overview' },
    { id: 'aging',       icon: '⏱️', label: 'Referral Aging' },
    { id: 'volume',      icon: '🏢', label: 'Clinic Volume' },
    { id: 'conversion',  icon: '📊', label: 'Conversion Rate' },
    { id: 'performance', icon: '⭐', label: 'Intake Performance' },
  ],
  about: [
    { id: 'portal',    icon: 'ℹ️', label: 'About the Portal' },
    { id: 'locations', icon: '📍', label: 'Office Locations' },
  ],
}

export const TX_STATUSES = ['Not Started', 'In Progress', 'Draft Complete', 'In Review', 'Finalized']

export const PA_COLORS = {
  'Approved':               '#22c55e',
  'Approved/Discharged':    '#64748b',
  'No PA Needed':           '#22c55e',
  'Pending':                '#f59e0b',
  'In Review':              '#6366f1',
  'Reauthorization Needed': '#f59e0b',
  'Appeal Pending':         '#fb923c',
  'Denied':                 '#ef4444',
  'Referred Out':           '#64748b',
}

export const PA_ICONS = {
  'Approved':               '✓',
  'Approved/Discharged':    '🏁',
  'No PA Needed':           '✓',
  'Pending':                '◐',
  'In Review':              '🔍',
  'Reauthorization Needed': '🔄',
  'Appeal Pending':         '⚠️',
  'Denied':                 '✗',
  'Referred Out':           '🏁',
}

export const STAGE_COLORS = {
  'New Referral':       '#6366f1',
  'Intake':             '#8b5cf6',
  'Initial Assessment': '#f59e0b',
  'PA Submitted':       '#fb923c',
  'PA In Review':       '#fb923c',
  'PA Approved':        '#22c55e',
  'Active Client':      '#22c55e',
  'Reauth Needed':      '#f59e0b',
  'Discharged':         '#64748b',
}

export const STAGE_ICONS = {
  'New Referral':       '📥',
  'Intake':             '📋',
  'Initial Assessment': '🧪',
  'PA Submitted':       '📤',
  'PA In Review':       '🔍',
  'PA Approved':        '✅',
  'Active Client':      '⭐',
  'Reauth Needed':      '🔄',
  'Discharged':         '🏁',
}

export const CHECKLIST_FIELDS = [
  ['Referral Form',         'referral_form',         STAT],
  ['Permission Assessment', 'permission_assessment',  STAT],
  ['Vineland',              'vineland',               STAT],
  ['SRS-2',                 'srs2',                   STAT],
  ['Attends School',        'attends_school',         BOOL],
  ['IEP Report',            'iep_report',             STAT],
  ['Insurance Verified',    'insurance_verified',     BOOL],
  ['Autism Diagnosis',      'autism_diagnosis',       STAT],
  ['Intake Paperwork',      'intake_paperwork',       STAT],
]

export function emptyReferral() {
  return {
    first_name: '', last_name: '', dob: '', caregiver: '',
    caregiver_phone: '', caregiver_email: '', office: '',
    insurance: '', secondary_insurance: '',
    date_received: new Date().toISOString().split('T')[0],
    contact1: '', contact2: '', contact3: '',
    referral_form: '', permission_assessment: '', vineland: '', srs2: '',
    attends_school: '', iep_report: '', insurance_verified: '',
    autism_diagnosis: '', intake_paperwork: '', intake_personnel: '',
    referral_source: '', referral_source_phone: '', referral_source_fax: '',
    provider_npi: '', point_of_contact: '', reason_for_referral: '',
    notes: '', status: 'active',
  }
}
