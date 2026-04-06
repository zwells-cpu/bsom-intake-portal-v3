import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'

function getAssessmentId(record) {
  return record?.assessment_id ?? record?.id ?? null
}

export function useAssessments() {
  const [assessData, setAssessData] = useState([])
  const [assessLoading, setAssessLoading] = useState(false)
  const [assessError, setAssessError] = useState(null)

  const loadAssessments = useCallback(async () => {
    setAssessLoading(true)
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('client_name', { ascending: true })
      if (error) throw error
      setAssessData(data || [])
    } catch (e) {
      setAssessError('Could not load assessments: ' + e.message)
    } finally {
      setAssessLoading(false)
    }
  }, [])

  const saveAssessEdit = useCallback(async (id, patch) => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .update(patch)
        .eq('assessment_id', id)
        .select()
        .single()
      if (error) throw error
      setAssessData(prev => replaceRecordById(prev, data || { assessment_id: id, ...patch }, getAssessmentId))
      return { success: true, data: data || { assessment_id: id, ...patch } }
    } catch (e) {
      setAssessError('Could not save assessment changes: ' + e.message)
      return { success: false }
    }
  }, [])

  const deleteAssessment = useCallback(async (id) => {
    try {
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
