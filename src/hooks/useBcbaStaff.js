import { useCallback, useMemo, useState } from 'react'
import {
  cleanBcbaName,
  createBcbaStaff as createBcbaStaffRequest,
  deactivateBcbaStaff as deactivateBcbaStaffRequest,
  fetchBcbaStaff,
  normalizeBcbaName,
  updateBcbaStaff as updateBcbaStaffRequest,
} from '../lib/bcbaStaff'

function sortStaff(records) {
  return (records || []).slice().sort((a, b) => cleanBcbaName(a.full_name).localeCompare(cleanBcbaName(b.full_name)))
}

export function useBcbaStaff() {
  const [bcbaStaff, setBcbaStaff] = useState([])
  const [bcbaStaffLoading, setBcbaStaffLoading] = useState(false)
  const [bcbaStaffError, setBcbaStaffError] = useState(null)

  const activeBcbaStaff = useMemo(() => bcbaStaff.filter(record => record.is_active !== false), [bcbaStaff])

  const assertNoDuplicate = useCallback((fullName, currentId = null) => {
    const normalized = normalizeBcbaName(fullName)
    if (!normalized) throw new Error('BCBA name is required.')

    const duplicate = bcbaStaff.find(record =>
      record.is_active !== false
      && String(record.id) !== String(currentId || '')
      && normalizeBcbaName(record.full_name) === normalized
    )
    if (duplicate) throw new Error('An active BCBA with that name already exists.')
  }, [bcbaStaff])

  const loadBcbaStaff = useCallback(async ({ includeInactive = true } = {}) => {
    setBcbaStaffLoading(true)
    setBcbaStaffError(null)
    try {
      const data = await fetchBcbaStaff({ includeInactive })
      setBcbaStaff(sortStaff(data))
      return { success: true, data }
    } catch (error) {
      setBcbaStaffError('Could not load BCBA staff: ' + error.message)
      return { success: false, error }
    } finally {
      setBcbaStaffLoading(false)
    }
  }, [])

  const createBcbaStaff = useCallback(async (input) => {
    try {
      assertNoDuplicate(input?.full_name)
      const data = await createBcbaStaffRequest(input)
      setBcbaStaff(prev => sortStaff([data, ...prev]))
      return { success: true, data }
    } catch (error) {
      setBcbaStaffError('Could not add BCBA: ' + error.message)
      return { success: false, error }
    }
  }, [assertNoDuplicate])

  const updateBcbaStaff = useCallback(async (id, input) => {
    try {
      if (Object.prototype.hasOwnProperty.call(input || {}, 'full_name')) assertNoDuplicate(input.full_name, id)
      const data = await updateBcbaStaffRequest(id, input)
      setBcbaStaff(prev => sortStaff(prev.map(record => String(record.id) === String(id) ? { ...record, ...data } : record)))
      return { success: true, data }
    } catch (error) {
      setBcbaStaffError('Could not update BCBA: ' + error.message)
      return { success: false, error }
    }
  }, [assertNoDuplicate])

  const deactivateBcbaStaff = useCallback(async (id) => {
    try {
      const data = await deactivateBcbaStaffRequest(id)
      setBcbaStaff(prev => sortStaff(prev.map(record => String(record.id) === String(id) ? { ...record, ...data, is_active: false } : record)))
      return { success: true, data }
    } catch (error) {
      setBcbaStaffError('Could not deactivate BCBA: ' + error.message)
      return { success: false, error }
    }
  }, [])

  return {
    bcbaStaff,
    activeBcbaStaff,
    bcbaStaffLoading,
    bcbaStaffError,
    setBcbaStaffError,
    loadBcbaStaff,
    createBcbaStaff,
    updateBcbaStaff,
    deactivateBcbaStaff,
  }
}
