import { useState, useCallback, useEffect } from 'react'
import { getInitialData, loadDemoData, saveDemoData } from '../lib/mockData'

function getStore() {
  const saved = loadDemoData()
  return saved ? saved.activityLogs : getInitialData().activityLogs
}

export function useDemoActivityLogs(limit = 10, refreshKey = 0) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    const all = getStore()
    setLogs(all.slice(0, limit))
    setLoading(false)
  }, [limit])

  useEffect(() => { refresh() }, [refreshKey, refresh])

  return { logs, loading, refreshLogs: refresh }
}

export function appendDemoActivityLog(entry) {
  const saved = loadDemoData() || getInitialData()
  const log = { id: `log-${Date.now()}`, ...entry, created_at: entry.created_at || new Date().toISOString() }
  saveDemoData({ ...saved, activityLogs: [log, ...(saved.activityLogs || [])] })
}
