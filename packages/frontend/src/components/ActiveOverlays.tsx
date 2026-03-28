import type { ClientOverlay } from '@streamgenius/shared'
import { useOverlayStore } from '../store/overlays'

const TYPE_COLORS: Record<string, string> = {
  youtube_card: '#ef4444',
  fact_banner: '#f97316',
  web_search: '#3b82f6',
  comparison: '#8b5cf6',
}

export function ActiveOverlays() {
  const overlays = useOverlayStore((s) => s.overlays)
  const removeOverlay = useOverlayStore((s) => s.removeOverlay)

  const activeOverlays = overlays.filter(
    (o) => o.status === 'approved' || o.status === 'displayed' || o.status === 'rendering'
  )

  if (activeOverlays.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyText}>No overlays on stream</span>
        <span style={styles.emptyHint}>Approved overlays will appear here</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {activeOverlays.map((overlay) => (
        <ActiveOverlayRow
          key={overlay.id}
          overlay={overlay}
          onHide={() => removeOverlay(overlay.id)}
        />
      ))}
    </div>
  )
}

function ActiveOverlayRow({
  overlay,
  onHide,
}: {
  overlay: ClientOverlay
  onHide: () => void
}) {
  const color = TYPE_COLORS[overlay.type] ?? '#666'

  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <span style={{ ...styles.dot, backgroundColor: color }} />
        <span style={styles.type}>{formatType(overlay.type)}</span>
      </div>
      <button onClick={onHide} style={styles.hideButton}>
        Hide
      </button>
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
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
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#1a1a1d',
    borderRadius: '6px',
    borderLeft: '3px solid #22c55e',
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  type: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#e0e0e0',
  },
  hideButton: {
    padding: '4px 10px',
    backgroundColor: '#333',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
  },
}
