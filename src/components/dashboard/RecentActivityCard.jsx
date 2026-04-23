function formatRelativeTime(value) {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

function formatFullTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

function formatActionLabel(action) {
  return (action || 'activity')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildActorLine(log) {
  // New schema: user_email + user_role
  if (log.user_email) {
    return log.user_role
      ? `${log.user_email} (${log.user_role})`
      : log.user_email
  }
  // Legacy schema fallback: actor string
  return log.actor || 'Unknown staff member'
}

function buildSummary(log) {
  // New schema: top-level description field
  if (log.description) return log.description
  // Legacy: description may be nested in details
  if (log.details_json?.description) return log.details_json.description
  return null
}

function buildChangeSummary(details_json) {
  if (!details_json || typeof details_json !== 'object') return null

  const parts = []

  if (Array.isArray(details_json.changed_fields) && details_json.changed_fields.length) {
    parts.push(`Changed: ${details_json.changed_fields.join(', ')}`)
  }

  if (details_json.before && details_json.after) {
    const fields = Object.keys(details_json.before)
    if (fields.length) {
      const changes = fields
        .map(f => `${f}: ${details_json.before[f] ?? '—'} → ${details_json.after[f] ?? '—'}`)
        .join(' | ')
      parts.push(changes)
    }
  }

  return parts.length ? parts.join(' · ') : null
}

function ActivityLogItem({ log, index }) {
  const entityName  = log.entity_label || log.client_name || null
  const actorLine   = buildActorLine(log)
  const summary     = buildSummary(log)
  const changeLine  = buildChangeSummary(log.details_json)
  const office      = log.details_json?.office || log.details_json?.clinic || log.office || null
  const entityType  = log.entity_type || null

  return (
    <div
      key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`}
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0))',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      {/* Top row: action label + badges + timestamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {formatActionLabel(log.action)}
          </span>
          {entityType && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border2)', background: 'var(--surface2)', borderRadius: 999, padding: '2px 8px' }}>
              {entityType}
            </span>
          )}
          {office && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border2)', background: 'var(--surface2)', borderRadius: 999, padding: '2px 8px' }}>
              {office}
            </span>
          )}
        </div>
        <span
          title={formatFullTimestamp(log.created_at)}
          style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0, cursor: 'default' }}
        >
          {formatRelativeTime(log.created_at)}
        </span>
      </div>

      {/* Entity name */}
      {entityName && (
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{entityName}</div>
      )}

      {/* Human summary */}
      {summary && (
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 4 }}>{summary}</div>
      )}

      {/* Change tracking line */}
      {changeLine && (
        <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: "'DM Mono', monospace", marginBottom: 4, lineHeight: 1.5 }}>
          {changeLine}
        </div>
      )}

      {/* Actor */}
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--dim)' }}>
        {actorLine}
      </div>
    </div>
  )
}

export function RecentActivityCard({ logs, loading, onViewAll }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Activity</div>

      <div className="card card-pad" style={{ minHeight: 254, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              style={{
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                padding: '14px 16px',
              }}
            >
              <div style={{ height: 10, width: '36%', background: 'rgba(148,163,184,0.18)', borderRadius: 999, marginBottom: 10 }} />
              <div style={{ height: 12, width: '72%', background: 'rgba(148,163,184,0.14)', borderRadius: 999, marginBottom: 10 }} />
              <div style={{ height: 10, width: '54%', background: 'rgba(148,163,184,0.12)', borderRadius: 999 }} />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
            No recent activity yet.
          </div>
        ) : (
          <>
            {logs.map((log, index) => <ActivityLogItem key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`} log={log} index={index} />)}
            {onViewAll ? (
              <button
                type="button"
                className="btn-sm"
                onClick={onViewAll}
                style={{ alignSelf: 'flex-start', marginTop: 2, paddingInline: 0, border: 'none', background: 'transparent', color: 'var(--muted)' }}
              >
                View All Activity {'→'}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export function ActivityLogList({ logs, loading, emptyText = 'No recent activity yet.' }) {
  if (loading) {
    return (
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              padding: '14px 16px',
            }}
          >
            <div style={{ height: 10, width: '36%', background: 'rgba(148,163,184,0.18)', borderRadius: 999, marginBottom: 10 }} />
            <div style={{ height: 12, width: '72%', background: 'rgba(148,163,184,0.14)', borderRadius: 999, marginBottom: 10 }} />
            <div style={{ height: 10, width: '54%', background: 'rgba(148,163,184,0.12)', borderRadius: 999 }} />
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--dim)' }}>
        {emptyText}
      </div>
    )
  }

  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {logs.map((log, index) => <ActivityLogItem key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`} log={log} index={index} />)}
    </div>
  )
}
