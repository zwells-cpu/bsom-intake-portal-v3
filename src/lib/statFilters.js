import { getAuthorizationStatus, normalizeTreatmentPlanStatus } from './utils'

export function isStatFilterTarget(filter, target) {
  return filter?.target === target ? filter : null
}

export function toggleStatFilter(currentFilter, nextFilter) {
  if (!nextFilter) return null
  return currentFilter?.target === nextFilter.target && currentFilter?.key === nextFilter.key ? null : nextFilter
}

export function matchesStatFilter(record, filter) {
  const target = filter?.target
  const key = filter?.key

  if (!target || !key) return true

  if (target === 'all-referrals') {
    const paperwork = (record.intake_paperwork || '').toLowerCase()
    if (key === 'paperwork-signed') return paperwork.includes('signed')
    if (key === 'paperwork-pending') return !['signed', 'completed'].includes(paperwork)
    if (key === 'non-responsive-only') return record.status === 'non-responsive'
    if (key === 'non-responsive-all') return record.status === 'non-responsive' || record.status === 'referred-out'
    return true
  }

  if (target === 'pending-docs') {
    const paperwork = (record.intake_paperwork || '').toLowerCase()
    const dx = (record.autism_diagnosis || '').toLowerCase()
    if (key === 'not-yet-sent') return !paperwork.includes('emailed') && !['signed', 'completed'].includes(paperwork)
    if (key === 'emailed') return paperwork.includes('emailed')
    if (key === 'needs-dx') return dx !== 'received'
    return !['signed', 'completed'].includes(paperwork)
  }

  if (target === 'insurance-verification') {
    const status = (record.insurance_verified || '').toLowerCase()
    if (key === 'verified') return status === 'yes'
    if (key === 'awaiting') return status === 'awaiting'
    if (key === 'not-started') return status === 'no'
    if (key === 'total-active') return true
    return status !== 'yes'
  }

  if (target === 'non-responsive') {
    if (key === 'referred-out') return record.status === 'referred-out'
    if (key === 'non-responsive-only') return record.status === 'non-responsive'
    return record.status === 'non-responsive' || record.status === 'referred-out'
  }

  if (target === 'assessment-tracker') {
    const pa = getAuthorizationStatus(record)
    const stage = record.assessment_status || ''
    if (key === 'pa-approved') return ['Approved', 'No PA Needed', 'Approved/Discharged'].includes(pa)
    if (key === 'in-progress') return stage === 'In Progress'
    if (key === 'denied-appealed') return ['Denied', 'Appeal Pending'].includes(pa)
    if (key === 'awaiting-pa') return ['Pending', 'In Review'].includes(pa)
    return true
  }

  if (target === 'parent-interviews') {
    const status = record.parent_interview_status || ''
    if (key === 'awaiting-assignment') return !status || status === 'Awaiting Assignment'
    if (key === 'scheduled') return status === 'Scheduled'
    if (key === 'completed') return status === 'Completed'
    if (key === 'no-show') return status === 'No Show'
    return true
  }

  if (target === 'bcba-assignments') {
    if (key === 'unassigned') return !record.assigned_bcba
    if (key === 'assigned') return Boolean(record.assigned_bcba)
    return true
  }

  if (target === 'assessment-progress') {
    const status = record.assessment_status || ''
    if (key === 'not-started') return !status || status === 'Not Started'
    if (key === 'in-progress') return status === 'In Progress'
    if (key === 'completed') return status === 'Completed'
    return true
  }

  if (target === 'treatment-plans') {
    return normalizeTreatmentPlanStatus(record.treatment_plan_status) === key
  }

  if (target === 'ready-for-services') {
    if (key === 'active-clients') return Boolean(record.active_client_date)
    if (key === 'ready') return record.ready_for_services === true
    if (key === 'awaiting-authorization') {
      return record.assessment_status === 'Completed'
        && !['Approved'].includes(getAuthorizationStatus(record))
        && !record.ready_for_services
    }
    if (key === 'not-ready') return record.ready_for_services !== true
    return !record.ready_for_services
  }

  return true
}
