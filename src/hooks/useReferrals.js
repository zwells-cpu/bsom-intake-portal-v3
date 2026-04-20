import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { emptyReferral } from '../lib/constants'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'
import { getReferralStage } from '../lib/utils'

function getReferralId(record) {
  return record?.id ?? null
}

function normalizeReferralRecord(record) {
  if (!record) return record

  return {
    ...record,
    current_stage: getReferralStage(record),
  }
}

export function useReferrals() {
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (err) throw err
      setRefs((data || []).map(normalizeReferralRecord))
    } catch (e) {
      setError(e.message?.includes('fetch')
        ? 'Could not reach database. Open the portal from GitHub Pages, not a local file.'
        : 'Database error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveReferral = useCallback(async (form) => {
    setSaving(true)
    try {
      const formData = { ...form }
      delete formData.referral_id
      delete formData.user_id
      formData.current_stage = getReferralStage(formData)
      const { data, error: err } = await supabase
        .from('referrals')
        .insert(formData)
        .select()
        .single()
      if (err) throw err
      setRefs(prev => replaceRecordById(prev, normalizeReferralRecord(data), getReferralId))
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      return { success: true, data: normalizeReferralRecord(data) }
    } catch (e) {
      setError('Could not save: ' + e.message)
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [])

  const updateReferral = useCallback(async (id, patch) => {
    try {
      const currentRecord = refs.find(record => record.id === id) || {}
      const mergedRecord = normalizeReferralRecord({ ...currentRecord, ...patch, id })
      const nextPatch = { ...patch, current_stage: mergedRecord.current_stage }
      const { data, error: err } = await supabase
        .from('referrals')
        .update(nextPatch)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err
      const normalizedRecord = normalizeReferralRecord(data || mergedRecord)
      setRefs(prev => replaceRecordById(prev, normalizedRecord, getReferralId))
      return { success: true, data: normalizedRecord }
    } catch (e) {
      setError('Could not update: ' + e.message)
      return { success: false }
    }
  }, [refs])

  const deleteReferral = useCallback(async (id) => {
    try {
      const { error: err } = await supabase
        .from('referrals')
        .delete()
        .eq('id', id)
      if (err) throw err
      setRefs(prev => removeRecordById(prev, id, getReferralId))
      return { success: true, id }
    } catch (e) {
      setError('Could not delete referral.')
      return { success: false }
    }
  }, [])

  const setStatus = useCallback(async (id, status) => {
    return updateReferral(id, { status })
  }, [updateReferral])

  const toggleParentInterview = useCallback(async (id, val) => {
    return updateReferral(id, { ready_for_parent_interview: val })
  }, [updateReferral])

  return {
    refs, loading, error, saving, saved,
    setError,
    load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview,
  }
}
