import { useCallback } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAudioCapture } from '../hooks/useAudioCapture'
import { useOverlayStore } from '../store/overlays'

export function ControlPanel() {
  const { sendMessage } = useWebSocket()
  const transcript = useOverlayStore((s) => s.transcript)
  const transcriptFinal = useOverlayStore((s) => s.transcriptFinal)

  const handleAudioChunk = useCallback(
    (base64: string) => {
      sendMessage({ kind: 'audio_chunk', data: base64 })
    },
    [sendMessage]
  )

  const { isCapturing, error, start, stop } = useAudioCapture(handleAudioChunk)

  return (
    <div style={styles.container}>
      <div style={styles.audioControl}>
        <button
          style={{
            ...styles.button,
            backgroundColor: isCapturing ? '#ef4444' : '#22c55e',
          }}
          onClick={isCapturing ? stop : start}
        >
          {isCapturing ? 'Stop Recording' : 'Start Recording'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>

      <div style={styles.transcriptContainer}>
        <h3 style={styles.transcriptLabel}>Live Transcript</h3>
        <div
          style={{
            ...styles.transcript,
            opacity: transcriptFinal ? 1 : 0.7,
          }}
        >
          {transcript || 'Waiting for speech...'}
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
  audioControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
  },
  transcriptContainer: {
    marginTop: '10px',
  },
  transcriptLabel: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  transcript: {
    padding: '15px',
    backgroundColor: '#252525',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
    minHeight: '80px',
    color: '#ddd',
  },
}
