import { supabase } from './supabase'

function normalizeEntityId(value) {
  if (value === null || value === undefined) return null

  const normalized = String(value).trim()
  if (!normalized) return null

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(normalized) ? normalized : null
}

function buildActivityLogPayload(entry = {}) {
  return {
    action: String(entry.action || '').trim(),
    entity_type: String(entry.entity_type || '').trim(),
    entity_id: normalizeEntityId(entry.entity_id),
    client_name: String(entry.client_name || '').trim(),
    description: String(entry.description || '').trim(),
    office: String(entry.office || '').trim(),
    actor: String(entry.actor || '').trim(),
    metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
  }
}

export async function createActivityLog(entry) {
  const payload = buildActivityLogPayload(entry)

  console.log('createActivityLog payload:', payload)

  const { data, error } = await supabase
    .from('activity_logs')
    .insert([payload])
    .select()

  if (error) {
    console.error('createActivityLog insert failed:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      payload,
    })
    throw error
  }

  return Array.isArray(data) ? data[0] ?? null : data
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
