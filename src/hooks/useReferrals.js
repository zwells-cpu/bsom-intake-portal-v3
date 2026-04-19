import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { emptyReferral } from '../lib/constants'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'

function getReferralId(record) {
  return record?.id ?? null
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
      setRefs(data || [])
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
      const { data, error: err } = await supabase
        .from('referrals')
        .insert(formData)
        .select()
        .single()
      if (err) throw err
      setRefs(prev => replaceRecordById(prev, data, getReferralId))
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      return { success: true, data }
    } catch (e) {
      setError('Could not save: ' + e.message)
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [])

  const updateReferral = useCallback(async (id, patch) => {
    try {
      const { data, error: err } = await supabase
        .from('referrals')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err
      setRefs(prev => replaceRecordById(prev, data || { id, ...patch }, getReferralId))
      return { success: true, data: data || { id, ...patch } }
    } catch (e) {
      setError('Could not update: ' + e.message)
      return { success: false }
    }
  }, [])

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
