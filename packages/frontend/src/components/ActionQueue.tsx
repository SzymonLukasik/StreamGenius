import type { ClientOverlay, YoutubeData, DeepAnalysisData, WebSearchData, ComparisonData } from '@streamgenius/shared'
import { useWebSocket } from '../hooks/useWebSocket'
import { useOverlayStore } from '../store/overlays'

const TYPE_COLORS: Record<string, string> = {
  youtube_card: '#ef4444',
  fact_banner: '#f97316',
  web_search: '#3b82f6',
  comparison: '#8b5cf6',
}

export function ActionQueue() {
  const { sendMessage } = useWebSocket()
  const overlays = useOverlayStore((s) => s.overlays)
  const updateOverlayStatus = useOverlayStore((s) => s.updateOverlayStatus)
  const removeOverlay = useOverlayStore((s) => s.removeOverlay)

  const fetchingOverlays = overlays.filter((o) => o.status === 'fetching')
  const pendingOverlays = overlays.filter((o) => o.status === 'ready')

  const handleApprove = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'approved')
    sendMessage({ kind: 'overlay_approve', id: overlay.id, overlayType: overlay.type })
  }

  const handleSkip = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'skipped')
    sendMessage({ kind: 'overlay_dismiss', id: overlay.id })
    removeOverlay(overlay.id)
  }

  const isEmpty = fetchingOverlays.length === 0 && pendingOverlays.length === 0

  if (isEmpty) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyText}>No pending overlays</span>
        <span style={styles.emptyHint}>AI-generated overlays will appear here</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {fetchingOverlays.map((overlay) => (
        <FetchingCard key={overlay.id} overlay={overlay} onSkip={() => handleSkip(overlay)} />
      ))}
      {pendingOverlays.map((overlay) => (
        <PendingCard
          key={overlay.id}
          overlay={overlay}
          onApprove={() => handleApprove(overlay)}
          onSkip={() => handleSkip(overlay)}
        />
      ))}
    </div>
  )
}

function FetchingCard({ overlay, onSkip }: { overlay: ClientOverlay; onSkip: () => void }) {
  const color = TYPE_COLORS[overlay.type] ?? '#666'

  return (
    <div style={{ ...styles.card, opacity: 0.6 }}>
      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <span style={{ ...styles.typeBadge, backgroundColor: color }}>{formatType(overlay.type)}</span>
        </div>
        <span style={styles.fetchingStatus}>Fetching...</span>
      </div>

      <p style={styles.trigger}>&ldquo;{overlay.trigger}&rdquo;</p>

      <div style={styles.progressBar}>
        <div style={styles.progressFill} className="animate-shimmer" />
      </div>

      <button onClick={onSkip} style={styles.skipSmall}>
        Cancel
      </button>
    </div>
  )
}

function PendingCard({
  overlay,
  onApprove,
  onSkip,
}: {
  overlay: ClientOverlay
  onApprove: () => void
  onSkip: () => void
}) {
  const color = TYPE_COLORS[overlay.type] ?? '#666'

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <span style={{ ...styles.typeBadge, backgroundColor: color }}>{formatType(overlay.type)}</span>
        </div>
        <span style={styles.readyStatus}>Ready</span>
      </div>

      <p style={styles.trigger}>&ldquo;{overlay.trigger}&rdquo;</p>

      {overlay.data && <OverlayPreview overlay={overlay} />}

      <div style={styles.actions}>
        <button onClick={onApprove} style={styles.approveButton}>
          Show
        </button>
        <button onClick={onSkip} style={styles.skipButton}>
          Skip
        </button>
      </div>
    </div>
  )
}

function OverlayPreview({ overlay }: { overlay: ClientOverlay }) {
  if (!overlay.data) return null

  switch (overlay.type) {
    case 'youtube_card': {
      const d = overlay.data as YoutubeData
      return (
        <div style={styles.preview}>
          <span style={styles.previewTitle}>{d.title}</span>
          <span style={styles.previewMeta}>
            {d.channelName} · {formatViewCount(d.viewCount)} views
          </span>
        </div>
      )
    }
    case 'fact_banner': {
      const d = overlay.data as DeepAnalysisData
      return (
        <div style={styles.preview}>
          <span style={{ ...styles.verdict, color: verdictColor(d.verdict) }}>
            {formatVerdict(d.verdict)}
          </span>
          <span style={styles.previewMeta}>{Math.round(d.confidence * 100)}% confidence</span>
        </div>
      )
    }
    case 'web_search': {
      const d = overlay.data as WebSearchData
      const first = d.results[0]
      return (
        <div style={styles.preview}>
          <span style={styles.previewTitle}>{first?.title ?? 'No results'}</span>
          {first && <span style={styles.previewMeta}>{truncate(first.snippet, 80)}</span>}
        </div>
      )
    }
    case 'comparison': {
      const d = overlay.data as ComparisonData
      return (
        <div style={styles.preview}>
          <span style={styles.previewTitle}>
            {d.itemA.name} vs {d.itemB.name}
          </span>
          <span style={styles.previewMeta}>{truncate(d.summary, 80)}</span>
        </div>
      )
    }
    default:
      return null
  }
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatVerdict(verdict: DeepAnalysisData['verdict']): string {
  return verdict.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function verdictColor(verdict: DeepAnalysisData['verdict']): string {
  const colors: Record<string, string> = {
    verified: '#22c55e',
    partially_true: '#eab308',
    disputed: '#f97316',
    unverified: '#888',
  }
  return colors[verdict] ?? '#888'
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    gap: '4px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#666',
  },
  emptyHint: {
    fontSize: '11px',
    color: '#444',
  },
  card: {
    backgroundColor: '#1a1a1d',
    borderRadius: '10px',
    padding: '14px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
  },
  fetchingStatus: {
    fontSize: '11px',
    color: '#eab308',
    fontWeight: 500,
  },
  readyStatus: {
    fontSize: '11px',
    color: '#22c55e',
    fontWeight: 500,
  },
  trigger: {
    fontSize: '13px',
    color: '#888',
    fontStyle: 'italic',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  progressBar: {
    height: '3px',
    backgroundColor: '#333',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eab308',
    borderRadius: '2px',
    background: 'linear-gradient(90deg, #eab308 0%, #fbbf24 50%, #eab308 100%)',
    backgroundSize: '200% 100%',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: '#131316',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '12px',
  },
  previewTitle: {
    fontSize: '13px',
    color: '#e0e0e0',
    fontWeight: 500,
    lineHeight: 1.3,
  },
  previewMeta: {
    fontSize: '11px',
    color: '#666',
  },
  verdict: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  approveButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  skipButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#333',
    color: '#aaa',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  skipSmall: {
    padding: '6px 12px',
    backgroundColor: '#333',
    color: '#888',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
  },
}
