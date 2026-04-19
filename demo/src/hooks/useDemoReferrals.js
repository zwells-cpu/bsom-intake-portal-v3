import { useState, useCallback } from 'react'
import { getInitialData, loadDemoData, saveDemoData } from '../lib/mockData'
import { replaceRecordById, removeRecordById } from '../lib/recordStore'

function getId(r) { return r?.id ?? null }

function getStore() {
  const saved = loadDemoData()
  return saved ? saved.referrals : getInitialData().referrals
}

function persist(refs) {
  const saved = loadDemoData() || getInitialData()
  saveDemoData({ ...saved, referrals: refs })
}

export function useDemoReferrals() {
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const data = getStore()
    setRefs(data)
    setLoading(false)
  }, [])

  const saveReferral = useCallback(async (form) => {
    setSaving(true)
    const record = { ...form, id: `ref-${Date.now()}`, created_at: new Date().toISOString() }
    setRefs(prev => {
      const next = [record, ...prev]
      persist(next)
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    setSaving(false)
    return { success: true, data: record }
  }, [])

  const updateReferral = useCallback(async (id, patch) => {
    let updated = null
    setRefs(prev => {
      const next = replaceRecordById(prev, { id, ...patch }, getId)
      updated = next.find(r => getId(r) === id)
      persist(next)
      return next
    })
    return { success: true, data: updated }
  }, [])

  const deleteReferral = useCallback(async (id) => {
    setRefs(prev => {
      const next = removeRecordById(prev, id, getId)
      persist(next)
      return next
    })
    return { success: true, id }
  }, [])

  const setStatus = useCallback(async (id, status) => {
    return updateReferral(id, { status })
  }, [updateReferral])

  const toggleParentInterview = useCallback(async (id, val) => {
    return updateReferral(id, { ready_for_parent_interview: val })
  }, [updateReferral])

  return { refs, loading, error, saving, saved, setError, load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview }
}
