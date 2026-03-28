import ReactMarkdown from 'react-markdown'
import { useOverlayStore } from '../store/overlays'

export function ControlPanel() {
  const transcript = useOverlayStore((s) => s.transcript)
  const transcriptFinal = useOverlayStore((s) => s.transcriptFinal)
  const reasoning = useOverlayStore((s) => s.reasoning)

  return (
    <div style={styles.container}>
      <div style={styles.transcriptContainer}>
        <h3 style={styles.label}>Live Transcript</h3>
        <div
          style={{
            ...styles.content,
            opacity: transcriptFinal ? 1 : 0.7,
          }}
        >
          {transcript ? (
            <ReactMarkdown>{transcript}</ReactMarkdown>
          ) : (
            <span style={styles.placeholder}>Start broadcasting to see live transcription...</span>
          )}
        </div>
      </div>

      <div style={styles.reasoningContainer}>
        <h3 style={styles.label}>AI Reasoning</h3>
        <div style={styles.content}>
          {reasoning ? (
            <ReactMarkdown>{reasoning}</ReactMarkdown>
          ) : (
            <span style={styles.placeholder}>AI thoughts will appear here...</span>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  transcriptContainer: {},
  reasoningContainer: {},
  label: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  content: {
    padding: '15px',
    backgroundColor: '#252525',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.6,
    minHeight: '80px',
    maxHeight: '200px',
    overflowY: 'auto',
    color: '#ddd',
  },
  placeholder: {
    color: '#666',
    fontStyle: 'italic',
  },
}
