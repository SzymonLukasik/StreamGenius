import { useWebSocket } from '../hooks/useWebSocket'
import { useOverlayStore } from '../store/overlays'

interface StatusBarProps {
  isMuted: boolean
  isCapturing: boolean
}

export function StatusBar({ isMuted, isCapturing }: StatusBarProps) {
  const { isConnected, reconnecting, sessionId } = useWebSocket()
  const overlays = useOverlayStore((s) => s.overlays)

  const activeCount = overlays.filter(
    (o) => o.status === 'approved' || o.status === 'displayed'
  ).length
  const pendingCount = overlays.filter(
    (o) => o.status === 'fetching' || o.status === 'ready'
  ).length

  return (
    <header style={styles.container}>
      <div style={styles.brand}>
        <span style={styles.title}>StreamGenius</span>
        <span style={styles.badge}>Live</span>
      </div>

      <div style={styles.center}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{activeCount}</span>
          <span style={styles.statLabel}>On Stream</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>{pendingCount}</span>
          <span style={styles.statLabel}>Pending</span>
        </div>
      </div>

      <div style={styles.right}>
        {isCapturing && (
          <div style={isMuted ? styles.micStatusMuted : styles.micStatus}>
            {isMuted ? 'Muted' : 'Live'}
          </div>
        )}

        <div style={styles.connection}>
          <span
            style={{
              ...styles.dot,
              backgroundColor: isConnected
                ? '#22c55e'
                : reconnecting
                  ? '#eab308'
                  : '#ef4444',
            }}
          />
          <span style={styles.connectionText}>
            {isConnected ? 'Connected' : reconnecting ? 'Reconnecting' : 'Offline'}
          </span>
          {sessionId && (
            <span style={styles.sessionId}>{sessionId.slice(0, 8)}</span>
          )}
        </div>
      </div>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: '#0f0f12',
    borderBottom: '1px solid #ffffff0d',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffffeb',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '3px 8px',
    backgroundColor: '#ef4444',
    color: '#fff',
    borderRadius: '4px',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffffeb',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  divider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#ffffff1a',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  micStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#22c55e22',
    color: '#22c55e',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  micStatusMuted: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#f59e0b22',
    color: '#f59e0b',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  connection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  connectionText: {
    fontSize: '12px',
    color: '#888',
  },
  sessionId: {
    fontSize: '11px',
    color: '#555',
    fontFamily: 'monospace',
  },
}
