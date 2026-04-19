import { supabase } from './supabase'

export async function createActivityLog(entry) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(entry)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchRecentActivityLogs(limit = 10) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}
