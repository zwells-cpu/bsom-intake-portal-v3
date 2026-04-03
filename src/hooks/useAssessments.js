import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
      const { error } = await supabase
        .from('assessments')
        .update(patch)
        .eq('assessment_id', id)
      if (error) throw error
      setAssessData(prev => prev.map(r => r.assessment_id === id ? { ...r, ...patch } : r))
      return { success: true }
    } catch (e) {
      setAssessError('Could not save assessment changes: ' + e.message)
      return { success: false }
    }
  }, [])

  return { assessData, assessLoading, assessError, loadAssessments, saveAssessEdit }
}
