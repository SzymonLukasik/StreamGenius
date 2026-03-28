import { ControlPanel } from './components/ControlPanel'
import { OverlayQueue } from './components/OverlayQueue'
import { useWebSocket } from './hooks/useWebSocket'

export function App() {
  const { isConnected, sessionId, reconnecting } = useWebSocket()

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>StreamGenius</h1>
        <div style={styles.status}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isConnected ? '#22c55e' : reconnecting ? '#eab308' : '#ef4444',
            }}
          />
          <span>{isConnected ? 'Connected' : reconnecting ? 'Reconnecting...' : 'Disconnected'}</span>
          {sessionId && <span style={styles.sessionId}>Session: {sessionId.slice(0, 8)}</span>}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Control Panel</h2>
          <ControlPanel />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Overlay Queue</h2>
          <OverlayQueue />
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#888',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  sessionId: {
    marginLeft: '10px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 500,
    marginBottom: '15px',
    color: '#ccc',
  },
}
