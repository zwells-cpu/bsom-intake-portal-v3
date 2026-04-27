import { API_BASE } from './api'
import { supabase } from './supabase'

export function cleanBcbaName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export function normalizeBcbaName(value) {
  return cleanBcbaName(value).toLowerCase()
}

async function parseApiResponse(res) {
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const message = body?.error || body?.message || text || `HTTP ${res.status}`
    throw new Error(message)
  }

  return body
}

function shouldFallbackToSupabase(error) {
  return error?.name === 'TypeError' || error?.status === 404 || error?.status === 405
}

async function requestApi(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options)
  try {
    return await parseApiResponse(res)
  } catch (error) {
    error.status = res.status
    throw error
  }
}

async function getSupabaseResult(query) {
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function fetchBcbaStaff({ includeInactive = false } = {}) {
  const params = includeInactive ? '?include_inactive=true' : ''
  try {
    const data = await requestApi(`/bcba-staff${params}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (!shouldFallbackToSupabase(error)) throw error
    let query = supabase.from('bcba_staff').select('*').order('full_name', { ascending: true })
    if (!includeInactive) query = query.eq('is_active', true)
    return getSupabaseResult(query)
  }
}

export async function createBcbaStaff(input) {
  const payload = {
    full_name: cleanBcbaName(input?.full_name),
    email: input?.email?.trim() || null,
    office: input?.office?.trim() || null,
  }

  if (!payload.full_name) throw new Error('BCBA name is required.')

  try {
    return await requestApi('/bcba-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (!shouldFallbackToSupabase(error)) throw error
    return getSupabaseResult(supabase.from('bcba_staff').insert(payload).select('*').single())
  }
}

export async function updateBcbaStaff(id, input) {
  const payload = { ...input }
  if (Object.prototype.hasOwnProperty.call(payload, 'full_name')) {
    payload.full_name = cleanBcbaName(payload.full_name)
    if (!payload.full_name) throw new Error('BCBA name is required.')
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'email')) payload.email = payload.email?.trim() || null
  if (Object.prototype.hasOwnProperty.call(payload, 'office')) payload.office = payload.office?.trim() || null

  try {
    return await requestApi(`/bcba-staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (!shouldFallbackToSupabase(error)) throw error
    return getSupabaseResult(supabase.from('bcba_staff').update(payload).eq('id', id).select('*').single())
  }
}

export async function deactivateBcbaStaff(id) {
  try {
    return await requestApi(`/bcba-staff/${id}`, { method: 'DELETE' })
  } catch (error) {
    if (!shouldFallbackToSupabase(error)) throw error
    return getSupabaseResult(supabase.from('bcba_staff').update({ is_active: false }).eq('id', id).select('*').single())
  }
}
