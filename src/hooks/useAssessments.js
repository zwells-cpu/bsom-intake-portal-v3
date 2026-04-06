import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'

function getAssessmentId(record) {
  return record?.assessment_id ?? record?.id ?? null
}

function normalizeAssessmentRecord(record, fallbackId = null) {
  if (!record) return null

  const assessmentId = getAssessmentId(record) ?? fallbackId
  const authorizationStatus = record.authorization_status ?? record.pa_status ?? ''

  return {
    ...record,
    assessment_id: assessmentId,
    authorization_status: authorizationStatus,
    pa_status: authorizationStatus,
  }
}

export function useAssessments() {
  const [assessData, setAssessData] = useState([])
  const [assessLoading, setAssessLoading] = useState(false)
  const [assessError, setAssessError] = useState(null)

  const loadAssessments = useCallback(async () => {
    setAssessLoading(true)
    try {
      setAssessError(null)
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('client_name', { ascending: true })
      if (error) throw error
      setAssessData((data || []).map(record => normalizeAssessmentRecord(record)))
    } catch (e) {
      setAssessError('Could not load assessments: ' + e.message)
    } finally {
      setAssessLoading(false)
    }
  }, [])

  const saveAssessEdit = useCallback(async (id, patch) => {
    try {
      setAssessError(null)
      const normalizedPatch = normalizeAssessmentRecord({ assessment_id: id, ...patch }, id)

      const { data, error } = await supabase
        .from('assessments')
        .update(normalizedPatch)
        .eq('assessment_id', id)
        .select('*')
        .maybeSingle()
      if (error) throw error

      let nextRecord = data ? normalizeAssessmentRecord(data, id) : null

      if (!nextRecord) {
        const { data: refreshed, error: refreshError } = await supabase
          .from('assessments')
          .select('*')
          .eq('assessment_id', id)
          .maybeSingle()
        if (refreshError) throw refreshError
        nextRecord = normalizeAssessmentRecord(refreshed, id)
      }

      if (!nextRecord) {
        nextRecord = normalizedPatch
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
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('assessment_id', id)
      if (error) throw error
      setAssessData(prev => removeRecordById(prev, id, getAssessmentId))
      return { success: true, id }
    } catch (e) {
      setAssessError('Could not delete assessment: ' + e.message)
      return { success: false }
    }
  }, [])

  return { assessData, assessLoading, assessError, loadAssessments, saveAssessEdit, deleteAssessment }
}
