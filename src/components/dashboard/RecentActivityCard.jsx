import { formatActivityLogDisplay } from '../../lib/activityLogs'

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

function formatEntityType(type) {
  if (!type) return ''
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function buildActorLine(log) {
  if (log.user_email) {
    return log.user_role
      ? `${log.user_email} (${log.user_role})`
      : log.user_email
  }

  return log.actor || 'Unknown staff member'
}

export function ActivityLogTechnicalDetails({ log }) {
  const details = log.details_json && typeof log.details_json === 'object' ? log.details_json : null
  if (!details || Object.keys(details).length === 0) return null

  return (
    <details className="activity-log-technical">
      <summary>Show technical details</summary>
      <pre>{JSON.stringify(details, null, 2)}</pre>
    </details>
  )
}

export function ActivityLogItem({ log, index, canShowTechnicalDetails = false, compact = false }) {
  const display = formatActivityLogDisplay(log)
  const actorLine = buildActorLine(log)

  return (
    <div
      className="activity-log-item"
      key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`}
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0))',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: compact ? '12px 14px' : '14px 16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {display.actionLabel}
          </span>
          {display.entityType && (
            <span className="activity-log-badge">
              {formatEntityType(display.entityType)}
            </span>
          )}
          {display.office && (
            <span className="activity-log-badge">
              {display.office}
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

      {display.entityName && (
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, overflowWrap: 'anywhere' }}>
          {display.entityName}
        </div>
      )}

      {display.summary && (
        <div className="activity-log-summary" style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: display.chips.length ? 8 : 4 }}>
          {display.summary}
        </div>
      )}

      {display.chips.length > 0 && (
        <div className="activity-log-chips" aria-label="Updated areas">
          {display.chips.map(chip => (
            <span key={chip} className="activity-log-chip">{chip}</span>
          ))}
          {display.hiddenChipCount > 0 && (
            <span className="activity-log-chip activity-log-chip-muted">+{display.hiddenChipCount} more updates</span>
          )}
        </div>
      )}

      <div className="activity-log-actor" style={{ marginTop: 8, fontSize: 11, color: 'var(--dim)' }}>
        {actorLine}
      </div>

      {canShowTechnicalDetails && <ActivityLogTechnicalDetails log={log} />}
    </div>
  )
}

function ActivityLogSkeleton({ count }) {
  return Array.from({ length: count }).map((_, index) => (
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
}

export function RecentActivityCard({ logs, loading, onViewAll }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Activity</div>

      <div className="card card-pad" style={{ minHeight: 254, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <ActivityLogSkeleton count={4} />
        ) : logs.length === 0 ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--dim)', fontSize: 13 }}>
            No recent activity yet.
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <ActivityLogItem key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`} log={log} index={index} compact />
            ))}
            {onViewAll ? (
              <button
                type="button"
                className="btn-sm"
                onClick={onViewAll}
                style={{ alignSelf: 'flex-start', marginTop: 2, paddingInline: 0, border: 'none', background: 'transparent', color: 'var(--muted)' }}
              >
                View All Activity {'->'}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export function ActivityLogList({ logs, loading, emptyText = 'No recent activity yet.', canShowTechnicalDetails = false }) {
  if (loading) {
    return (
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ActivityLogSkeleton count={6} />
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
      {logs.map((log, index) => (
        <ActivityLogItem
          key={`${log.created_at || 'log'}-${log.entity_id || index}-${index}`}
          log={log}
          index={index}
          canShowTechnicalDetails={canShowTechnicalDetails}
        />
      ))}
    </div>
  )
}
