import { useState, useCallback } from 'react'
import { emptyReferral } from '../lib/constants'
import { removeRecordById, replaceRecordById } from '../lib/recordStore'
import { getReferralStage } from '../lib/utils'

const API_URL = import.meta.env.VITE_API_URL

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
      const res = await fetch(`${API_URL}/clients`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
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
      const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
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
      const res = await fetch(`${API_URL}/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPatch),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
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
      const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
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
