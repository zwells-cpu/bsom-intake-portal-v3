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

function formatActionLabel(action) {
  return (action || 'activity')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function ActivityLogItem({ log, index }) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {formatActionLabel(log.action)}
          </span>
          {log.office && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border2)', background: 'var(--surface2)', borderRadius: 999, padding: '2px 8px' }}>
              {log.office}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>{formatRelativeTime(log.created_at)}</span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{log.client_name || 'Client activity'}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{log.description || 'No description provided.'}</div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dim)' }}>
        {log.actor || 'Unknown staff member'}
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
                View All Activity {'\u2192'}
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
