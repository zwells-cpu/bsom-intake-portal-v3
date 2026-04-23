import { useState, useCallback } from 'react'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'

const API_URL = import.meta.env.VITE_API_URL

const ASSESSMENT_DB_FIELDS = [
  'client_name',
  'clinic',
  'assigned_bcba',
  'caregiver',
  'caregiver_phone',
  'caregiver_email',
  'insurance',
  'vineland',
  'srs2',
  'vbmapp',
  'socially_savvy',
  'parent_interview_status',
  'parent_interview_scheduled_date',
  'parent_interview_completed_date',
  'assessment_status',
  'assessment_started_date',
  'assessment_completed_date',
  'direct_obs',
  'treatment_plan_status',
  'treatment_plan_started_date',
  'treatment_plan_completed_date',
  'authorization_status',
  'authorization_submitted_date',
  'authorization_approved_date',
  'ready_for_services',
  'active_client_date',
  'in_school',
  'other_services',
  'notes',
]

function getAssessmentId(record) {
  return record?.assessment_id ?? record?.id ?? null
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return value
}

function normalizeAssessmentRecord(record, fallbackId = null) {
  if (!record) return null

  const assessmentId = getAssessmentId(record) ?? fallbackId
  const authorizationStatus = record.authorization_status ?? record.pa_status ?? ''
  const clinic = record.clinic ?? record.office ?? ''

  return {
    ...record,
    assessment_id: assessmentId,
    client_name: record.client_name || record.name || '',
    clinic,
    office: clinic,
    authorization_status: authorizationStatus,
    pa_status: authorizationStatus,
    ready_for_services: normalizeBoolean(record.ready_for_services) === true,
  }
}

function sanitizeAssessmentPatch(patch = {}) {
  const cleaned = {}
  ASSESSMENT_DB_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) return
    const value = patch[field]
    if (field === 'ready_for_services') {
      cleaned[field] = normalizeBoolean(value) === true
      return
    }
    if (field.endsWith('_date')) {
      cleaned[field] = value || null
      return
    }
    cleaned[field] = value ?? ''
  })
  return cleaned
}

export function useAssessments() {
  const [assessData, setAssessData] = useState([])
  const [assessLoading, setAssessLoading] = useState(false)
  const [assessError, setAssessError] = useState(null)

  const loadAssessments = useCallback(async () => {
    setAssessLoading(true)
    try {
      setAssessError(null)
      const res = await fetch(`${API_URL}/assessments`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const sorted = (data || []).slice().sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''))
      setAssessData(sorted.map(record => normalizeAssessmentRecord(record)))
    } catch (e) {
      setAssessError('Could not load assessments: ' + e.message)
    } finally {
      setAssessLoading(false)
    }
  }, [])

  const saveAssessEdit = useCallback(async (id, patch) => {
    try {
      setAssessError(null)
      const normalizedPatch = sanitizeAssessmentPatch(patch)

      const patchRes = await fetch(`${API_URL}/assessments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedPatch),
      })
      if (!patchRes.ok) throw new Error(await patchRes.text())
      const data = await patchRes.json()

      let nextRecord = data ? normalizeAssessmentRecord(data, id) : null

      if (!nextRecord) {
        const refreshRes = await fetch(`${API_URL}/assessments/${id}`)
        if (!refreshRes.ok) throw new Error(await refreshRes.text())
        const refreshed = await refreshRes.json()
        nextRecord = normalizeAssessmentRecord(refreshed, id)
      }

      if (!nextRecord) {
        nextRecord = normalizeAssessmentRecord({ assessment_id: id, ...normalizedPatch }, id)
      }

      setAssessData(prev => replaceRecordById(prev, nextRecord, getAssessmentId))
      return { success: true, data: nextRecord }
    } catch (e) {
      setAssessError('Could not save assessment changes: ' + e.message)
      return { success: false }
    }
  }, [])

  const deleteAssessment = useCallback(async (id) => {
    try {
      setAssessError(null)
      const res = await fetch(`${API_URL}/assessments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setAssessData(prev => removeRecordById(prev, id, getAssessmentId))
      return { success: true, id }
    } catch (e) {
      setAssessError('Could not delete assessment: ' + e.message)
      return { success: false }
    }
  }, [])

  return { assessData, assessLoading, assessError, loadAssessments, saveAssessEdit, deleteAssessment }
}
