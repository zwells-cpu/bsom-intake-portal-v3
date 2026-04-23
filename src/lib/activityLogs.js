/**
 * Client-side audit log bridge.
 *
 * createActivityLog  — POST to the backend; the backend writes to PostgreSQL.
 *                      The client never inserts directly into the database.
 * fetchRecentActivityLogs — GET from the backend read-only endpoint.
 *
 * Both functions are intentionally non-throwing so callers can fire-and-forget
 * without try/catch. Errors are surfaced to the console only.
 */

import { API_BASE } from './api'

/**
 * Send an audit event to the backend.
 *
 * Accepted fields (all optional except `action`):
 *   user_id, user_email, user_role — actor context
 *   action                         — snake_case event name (required)
 *   entity_type                    — 'referral' | 'assessment' | null
 *   entity_id                      — UUID string
 *   entity_label                   — human-readable name (e.g. client full name)
 *   description                    — one-sentence human summary
 *   details_json                   — structured metadata object
 *
 * @param {object} entry
 * @returns {Promise<object|null>}
 */
export async function createActivityLog(entry = {}) {
  const action = String(entry.action || '').trim()
  if (!action) return null

  const payload = {
    user_id:      entry.user_id      || null,
    user_email:   entry.user_email   || null,
    user_role:    entry.user_role    || null,
    action,
    entity_type:  entry.entity_type  || null,
    entity_id:    entry.entity_id    || null,
    entity_label: entry.entity_label || entry.client_name || null,
    description:  entry.description  || null,
    details_json: (
      entry.details_json && typeof entry.details_json === 'object'
        ? entry.details_json
        : entry.metadata && typeof entry.metadata === 'object'
          ? entry.metadata
          : {}
    ),
  }

  try {
    const res = await fetch(`${API_BASE}/api/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('createActivityLog: backend rejected log entry', { status: res.status, body: text, action })
      return null
    }

    return await res.json()
  } catch (err) {
    console.error('createActivityLog: network error', err.message, { action })
    return null
  }
}

/**
 * Fetch recent audit logs from the backend (read-only).
 *
 * @param {number|null} limit  — max rows to return (null = server default 50)
 * @returns {Promise<object[]>}
 */
export async function fetchRecentActivityLogs(limit = 10) {
  try {
    const params = new URLSearchParams()
    if (typeof limit === 'number' && limit > 0) params.set('limit', String(limit))

    const res = await fetch(`${API_BASE}/api/audit-logs?${params}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json()
    return Array.isArray(json.data) ? json.data : []
  } catch (err) {
    console.error('fetchRecentActivityLogs: failed', err.message)
    return []
  }
}
