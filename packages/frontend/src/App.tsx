import { useState } from 'react'
import { StatusBar } from './components/StatusBar'
import { ActionQueue } from './components/ActionQueue'
import { ActiveOverlays } from './components/ActiveOverlays'
import { TranscriptPanel } from './components/TranscriptPanel'
import { BroadcastControls } from './components/BroadcastControls'
import { FishjamProvider } from './providers/FishjamProvider'

function AppContent() {
  const [isMuted, setIsMuted] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  return (
    <div style={styles.container}>
      <StatusBar isMuted={isMuted} isCapturing={isCapturing} />

      <main style={styles.main}>
        <div style={styles.leftPanel}>
          <section style={styles.streamSection}>
            <BroadcastControls
              onMuteChange={setIsMuted}
              onCapturingChange={setIsCapturing}
            />
          </section>

          <section style={styles.transcriptSection}>
            <h3 style={styles.sectionTitle}>Live Transcript</h3>
            <TranscriptPanel />
          </section>
        </div>

        <div style={styles.rightPanel}>
          <section style={styles.queueSection}>
            <h3 style={styles.sectionTitle}>Pending Overlays</h3>
            <ActionQueue />
          </section>

          <section style={styles.activeSection}>
            <h3 style={styles.sectionTitle}>On Stream</h3>
            <ActiveOverlays />
          </section>
        </div>
      </main>
    </div>
  )
}

export function App() {
  return (
    <FishjamProvider>
      <AppContent />
    </FishjamProvider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0a0a0f',
    color: '#ffffffeb',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '1px',
    backgroundColor: '#ffffff0d',
    overflow: 'hidden',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0f',
    overflow: 'hidden',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0a0f',
    overflow: 'hidden',
  },
  streamSection: {
    padding: '16px',
  },
  transcriptSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 16px 16px',
    overflow: 'hidden',
  },
  queueSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    overflowY: 'auto',
  },
  activeSection: {
    padding: '16px',
    borderTop: '1px solid #ffffff0d',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 12px 0',
  },
}
