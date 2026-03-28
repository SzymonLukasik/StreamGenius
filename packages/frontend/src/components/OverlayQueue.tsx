import { useWebSocket } from '../hooks/useWebSocket'
import { useOverlayStore } from '../store/overlays'
import type { ClientOverlay, YoutubeData, DeepAnalysisData, WebSearchData, ComparisonData } from '@streamgenius/shared'

export function OverlayQueue() {
  const { sendMessage } = useWebSocket()
  const overlays = useOverlayStore((s) => s.overlays)
  const updateOverlayStatus = useOverlayStore((s) => s.updateOverlayStatus)
  const removeOverlay = useOverlayStore((s) => s.removeOverlay)

  const pendingOverlays = overlays.filter(
    (o) => o.status === 'fetching' || o.status === 'ready'
  )
  const activeOverlays = overlays.filter((o) => o.status === 'approved')

  const handleApprove = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'approved')
    sendMessage({ kind: 'overlay_approve', id: overlay.id, overlayType: overlay.type })
  }

  const handleDismissPending = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'dismissed')
    sendMessage({ kind: 'overlay_dismiss', id: overlay.id })
    removeOverlay(overlay.id)
  }

  const handleHideFromStream = (overlay: ClientOverlay) => {
    removeOverlay(overlay.id)
  }

  const isEmpty = pendingOverlays.length === 0 && activeOverlays.length === 0

  return (
    <div style={styles.root}>
      {activeOverlays.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionLabel}>On stream now</p>
          <div style={styles.queue}>
            {activeOverlays.map((overlay) => (
              <ActiveOverlayCard
                key={overlay.id}
                overlay={overlay}
                onHide={() => handleHideFromStream(overlay)}
              />
            ))}
          </div>
        </div>
      )}

      {pendingOverlays.length > 0 && (
        <div style={styles.section}>
          {activeOverlays.length > 0 && <p style={styles.sectionLabel}>Pending</p>}
          <div style={styles.queue}>
            {pendingOverlays.map((overlay) => (
              <div key={overlay.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.type}>{formatType(overlay.type)}</span>
                  <span
                    style={{
                      ...styles.status,
                      backgroundColor: overlay.status === 'ready' ? '#22c55e' : '#eab308',
                    }}
                  >
                    {overlay.status}
                  </span>
                </div>

                <p style={styles.trigger}>&ldquo;{overlay.trigger}&rdquo;</p>

                {overlay.status === 'ready' && overlay.data && renderPreview(overlay)}

                {overlay.status === 'ready' && (
                  <div style={styles.actions}>
                    <button
                      style={{ ...styles.button, backgroundColor: '#22c55e' }}
                      onClick={() => handleApprove(overlay)}
                    >
                      Show on stream
                    </button>
                    <button
                      style={{ ...styles.button, backgroundColor: '#666' }}
                      onClick={() => handleDismissPending(overlay)}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {overlay.status === 'fetching' && (
                  <div style={styles.fetchingRow}>
                    <span style={styles.loading}>Fetching data...</span>
                    <button
                      style={{ ...styles.button, flex: 'none', padding: '4px 12px', fontSize: '12px', backgroundColor: '#666' }}
                      onClick={() => handleDismissPending(overlay)}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div style={styles.empty}>
          <p>No pending overlays</p>
          <p style={styles.hint}>AI-generated overlays will appear here when detected</p>
        </div>
      )}
    </div>
  )
}

function ActiveOverlayCard({ overlay, onHide }: { overlay: ClientOverlay; onHide: () => void }) {
  return (
    <div style={{ ...styles.card, borderLeft: '3px solid #22c55e' }}>
      <div style={styles.cardHeader}>
        <span style={styles.type}>{formatType(overlay.type)}</span>
        <span style={styles.countdown}>On stream</span>
      </div>

      <p style={styles.trigger}>&ldquo;{overlay.trigger}&rdquo;</p>

      {overlay.data && renderPreview(overlay)}

      <button
        style={{ ...styles.button, backgroundColor: '#444', marginTop: 4 }}
        onClick={onHide}
      >
        Hide from stream
      </button>
    </div>
  )
}

function renderPreview(overlay: ClientOverlay): React.ReactNode {
  if (!overlay.data) return null

  switch (overlay.type) {
    case 'youtube_card': {
      const d = overlay.data as YoutubeData
      return (
        <div style={styles.preview}>
          <span style={styles.previewTitle}>{d.title}</span>
          <span style={styles.previewMeta}>{d.channelName} · {formatViewCount(d.viewCount)} views</span>
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
          {first && <span style={styles.previewMeta}>{first.snippet.slice(0, 80)}…</span>}
        </div>
      )
    }
    case 'comparison': {
      const d = overlay.data as ComparisonData
      return (
        <div style={styles.preview}>
          <span style={styles.previewTitle}>{d.itemA.name} vs {d.itemB.name}</span>
          <span style={styles.previewMeta}>{d.summary.slice(0, 80)}…</span>
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

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: 0,
  },
  queue: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  empty: {
    textAlign: 'center',
    padding: '30px',
    color: '#666',
  },
  hint: {
    fontSize: '12px',
    marginTop: '5px',
  },
  card: {
    backgroundColor: '#252525',
    borderRadius: '8px',
    padding: '15px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  type: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
  },
  status: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#000',
    fontWeight: 500,
    textTransform: 'uppercase',
  },
  countdown: {
    fontSize: '12px',
    color: '#888',
    fontVariantNumeric: 'tabular-nums',
  },
  trigger: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '10px',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    backgroundColor: '#1a1a1a',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '12px',
  },
  previewTitle: {
    fontSize: '13px',
    color: '#e0e0e0',
    fontWeight: 500,
  },
  previewMeta: {
    fontSize: '11px',
    color: '#777',
  },
  verdict: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  fetchingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  button: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loading: {
    fontSize: '13px',
    color: '#888',
  },
}
