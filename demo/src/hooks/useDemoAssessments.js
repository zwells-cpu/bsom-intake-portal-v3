import { useState, useCallback } from 'react'
import { getInitialData, loadDemoData, saveDemoData } from '../lib/mockData'
import { replaceRecordById, removeRecordById } from '../lib/recordStore'

function getId(r) { return r?.assessment_id ?? r?.id ?? null }

function getStore() {
  const saved = loadDemoData()
  return saved ? saved.assessments : getInitialData().assessments
}

function persist(assessments) {
  const saved = loadDemoData() || getInitialData()
  saveDemoData({ ...saved, assessments })
}

function normalize(record) {
  if (!record) return null
  const authorizationStatus = record.authorization_status ?? record.pa_status ?? ''
  const clinic = record.clinic ?? record.office ?? ''
  return {
    ...record,
    assessment_id: getId(record),
    clinic,
    office: clinic,
    authorization_status: authorizationStatus,
    pa_status: authorizationStatus,
    ready_for_services: record.ready_for_services === true,
  }
}

export function useDemoAssessments() {
  const [assessData, setAssessData] = useState([])
  const [assessLoading, setAssessLoading] = useState(false)

  const loadAssessments = useCallback(() => {
    setAssessLoading(true)
    const data = getStore().map(normalize)
    setAssessData(data)
    setAssessLoading(false)
  }, [])

  const saveAssessEdit = useCallback(async (id, patch) => {
    let updated = null
    setAssessData(prev => {
      const record = normalize({ assessment_id: id, ...patch })
      const next = replaceRecordById(prev, record, getId)
      updated = next.find(r => getId(r) === id)
      persist(next)
      return next
    })
    return { success: true, data: updated }
  }, [])

  const deleteAssessment = useCallback(async (id) => {
    setAssessData(prev => {
      const next = removeRecordById(prev, id, getId)
      persist(next)
      return next
    })
    return { success: true, id }
  }, [])

  return { assessData, assessLoading, assessError: null, loadAssessments, saveAssessEdit, deleteAssessment }
}
