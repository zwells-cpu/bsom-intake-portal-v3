export const OFFICES = ['MERIDIAN', 'FOREST', 'FLOWOOD', 'DAY TREATMENT']

export const INSURANCES = [
  'Medicaid of MS', 'UHC', 'UHC Community', 'Magnolia', 'Molina',
  'BCBSMS', 'Aetna', 'Tricare', 'Cigna', 'TruCare', 'Other',
]

export const BOOL = ['YES', 'NO', 'AWAITING']

export const STAT = ['Completed', 'Emailed', 'Awaiting', 'Please Send', 'N/A']

export const STAFF = ['Zanteria', 'Aerianna', 'LaShannon', 'Keiara', 'Celia', 'Other']

export const ALL_ROLES = ['All Staff', ...STAFF.filter((s) => s !== 'Other')]

export const MODULES = [
  { id: 'dashboard',  icon: 'ðŸ“Š', name: 'Dashboard',             desc: 'At-a-glance stats, alerts, and recent activity',              color: '#6366f1' },
  { id: 'intake',     icon: 'ðŸ“‹', name: 'Intake',                desc: 'Manage referrals, add new clients, track status',             color: '#22c55e' },
  { id: 'assessment', icon: 'ðŸ§ª', name: 'Initial Assessments',   desc: 'Vineland, SRS-2, IEP and assessment tracking',                color: '#f59e0b' },
  { id: 'operations', icon: 'ðŸ“ˆ', name: 'Operational Insights',  desc: 'Aging reports, volume, conversion rates, and team performance', color: '#fb923c' },
  { id: 'about',      icon: 'â„¹ï¸', name: 'About',                 desc: 'Office locations, version history, portal info',              color: '#8b5cf6' },
]

export const MODULE_NAV = {
  dashboard: [
    { id: 'overview', icon: 'ðŸ ', label: 'Overview' },
  ],
  intake: [
    { id: 'intakedash', icon: 'ðŸ ', label: 'Intake Dashboard' },
    { id: 'all',        icon: 'ðŸ“‹', label: 'All Referrals' },
    { id: 'new',        icon: 'âž•', label: 'New Referral' },
    { id: 'pending',    icon: 'ðŸ“„', label: 'Pending Documents' },
    { id: 'insurance',  icon: 'ðŸ›¡ï¸', label: 'Insurance Verification' },
    { id: 'nr',         icon: 'ðŸš«', label: 'Non-Responsive' },
  ],
  assessment: [
    { id: 'tracker',    icon: 'ðŸ§ª', label: 'Assessment Tracker' },
    { id: 'interviews', icon: 'ðŸ—£ï¸', label: 'Parent Interviews' },
    { id: 'bcba',       icon: 'ðŸ‘©â€âš•ï¸', label: 'BCBA Assignments' },
    { id: 'progress',   icon: 'ðŸ“ˆ', label: 'Assessment Progress' },
    { id: 'txplan',     icon: 'ðŸ“', label: 'Treatment Plan Status' },
    { id: 'readysvc',   icon: 'â­', label: 'Ready for Services' },
  ],
  operations: [
    { id: 'pipeline',    icon: 'ðŸ”„', label: 'Pipeline Overview' },
    { id: 'aging',       icon: 'â±ï¸', label: 'Referral Aging' },
    { id: 'volume',      icon: 'ðŸ¢', label: 'Clinic Volume' },
    { id: 'conversion',  icon: 'ðŸ“Š', label: 'Conversion Rate' },
    { id: 'performance', icon: 'â­', label: 'Intake Performance' },
  ],
  about: [
    { id: 'locations', icon: 'ðŸ“', label: 'Office Locations' },
    { id: 'portal',    icon: 'â„¹ï¸', label: 'About the Portal' },
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
  'Approved':               'âœ“',
  'Approved/Discharged':    'ðŸ',
  'No PA Needed':           'âœ“',
  'Pending':                'â—',
  'In Review':              'ðŸ”',
  'Reauthorization Needed': 'ðŸ”„',
  'Appeal Pending':         'âš ï¸',
  'Denied':                 'âœ—',
  'Referred Out':           'ðŸ',
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
  'New Referral':       'ðŸ“¥',
  'Intake':             'ðŸ“‹',
  'Initial Assessment': 'ðŸ§ª',
  'PA Submitted':       'ðŸ“¤',
  'PA In Review':       'ðŸ”',
  'PA Approved':        'âœ…',
  'Active Client':      'â­',
  'Reauth Needed':      'ðŸ”„',
  'Discharged':         'ðŸ',
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
