import { useWebSocket } from '../hooks/useWebSocket'
import { useOverlayStore } from '../store/overlays'
import type { ClientOverlay } from '@streamgenius/shared'

export function OverlayQueue() {
  const { sendMessage } = useWebSocket()
  const overlays = useOverlayStore((s) => s.overlays)
  const updateOverlayStatus = useOverlayStore((s) => s.updateOverlayStatus)

  const pendingOverlays = overlays.filter(
    (o) => o.status === 'fetching' || o.status === 'ready'
  )

  const handleApprove = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'approved')
    sendMessage({ kind: 'overlay_approve', id: overlay.id, overlayType: overlay.type })
  }

  const handleDismiss = (overlay: ClientOverlay) => {
    updateOverlayStatus(overlay.id, 'dismissed')
    sendMessage({ kind: 'overlay_dismiss', id: overlay.id })
  }

  if (pendingOverlays.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No pending overlays</p>
        <p style={styles.hint}>AI-generated overlays will appear here when detected</p>
      </div>
    )
  }

  return (
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

          {overlay.status === 'ready' && (
            <div style={styles.actions}>
              <button
                style={{ ...styles.button, backgroundColor: '#22c55e' }}
                onClick={() => handleApprove(overlay)}
              >
                Approve
              </button>
              <button
                style={{ ...styles.button, backgroundColor: '#666' }}
                onClick={() => handleDismiss(overlay)}
              >
                Dismiss
              </button>
            </div>
          )}

          {overlay.status === 'fetching' && (
            <div style={styles.loading}>Fetching data...</div>
          )}
        </div>
      ))}
    </div>
  )
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const styles: Record<string, React.CSSProperties> = {
  queue: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
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
  trigger: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '12px',
  },
  actions: {
    display: 'flex',
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
