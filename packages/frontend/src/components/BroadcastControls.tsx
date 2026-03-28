import { useEffect, useRef, useState } from 'react'
import { useFishjamBroadcast } from '../hooks/useFishjamBroadcast'
import { useWebSocket, setFishjamCallbacks } from '../hooks/useWebSocket'
import { useFishjamEnabled } from '../providers/FishjamProvider'
import { StreamPreview } from './StreamPreview'

function BroadcastControlsInner() {
  const { state, startBroadcast, stopBroadcast, videoStream, compositionReady, compositionError } =
    useFishjamBroadcast()
  const { sendMessage, isConnected: wsConnected } = useWebSocket()
  const [streamerId] = useState(() => `streamer_${Date.now()}`)
  const [pendingStart, setPendingStart] = useState(false)
  const [startupError, setStartupError] = useState<string | null>(null)
  const pendingStartRef = useRef(false)

  useEffect(() => {
    pendingStartRef.current = pendingStart
  }, [pendingStart])

  // Register Fishjam callbacks
  useEffect(() => {
    setFishjamCallbacks({
      onRoomCreated: async (roomId, streamerToken) => {
        setStartupError(null)
        if (pendingStartRef.current) {
          pendingStartRef.current = false
          setPendingStart(false)
          try {
            await startBroadcast(streamerToken, roomId)
          } catch (err) {
            console.error('Failed to start broadcast:', err)
          }
        }
      },
      onRoomClosed: () => {},
      onError: (message) => {
        pendingStartRef.current = false
        setPendingStart(false)
        setStartupError(message)
      },
    })

    return () => {
      setFishjamCallbacks({})
    }
  }, [startBroadcast])

  const handleStartBroadcast = () => {
    if (!wsConnected) {
      console.error('WebSocket not connected')
      return
    }

    setStartupError(null)
    pendingStartRef.current = true
    setPendingStart(true)
    sendMessage({ kind: 'fishjam_join', streamerId })
  }

  const handleStopBroadcast = async () => {
    if (state.roomId) {
      sendMessage({ kind: 'fishjam_leave', roomId: state.roomId })
    }
    pendingStartRef.current = false
    setPendingStart(false)
    setStartupError(null)
    await stopBroadcast()
  }

  const isStarting = pendingStart || state.isConnecting

  return (
    <div style={styles.container}>
      <StreamPreview
        stream={videoStream}
        isLive={state.isConnected}
        compositionReady={compositionReady}
        compositionError={compositionError?.message ?? null}
      />

      <div style={styles.controls}>
        {!state.isConnected && !isStarting && (
          <button onClick={handleStartBroadcast} disabled={!wsConnected} style={styles.startButton}>
            Start Broadcast
          </button>
        )}

        {isStarting && (
          <button disabled style={styles.connectingButton}>
            {pendingStart ? 'Creating room...' : 'Connecting...'}
          </button>
        )}

        {state.isConnected && (
          <button onClick={() => void handleStopBroadcast()} style={styles.stopButton}>
            Stop Broadcast
          </button>
        )}
      </div>

      {(state.error || startupError || compositionError) && (
        <p style={styles.error}>
          Error: {startupError ?? compositionError?.message ?? state.error?.message}
        </p>
      )}

      {state.roomId && (
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>Room ID:</span>
          <code style={styles.roomId}>{state.roomId}</code>
        </div>
      )}
    </div>
  )
}

export function BroadcastControls() {
  const { isEnabled } = useFishjamEnabled()

  if (!isEnabled) {
    return (
      <div style={styles.container}>
        <div style={styles.disabledMessage}>
          <p style={styles.disabledText}>Fishjam is not configured.</p>
          <p style={styles.disabledHint}>Set VITE_FISHJAM_ID in your .env file to enable broadcasting.</p>
        </div>
      </div>
    )
  }

  return <BroadcastControlsInner />
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  startButton: {
    padding: '12px 24px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectingButton: {
    padding: '12px 24px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'not-allowed',
  },
  stopButton: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: 0,
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#262626',
    borderRadius: '6px',
  },
  roomLabel: {
    fontSize: '12px',
    color: '#888',
  },
  roomId: {
    fontSize: '12px',
    color: '#22c55e',
    fontFamily: 'monospace',
  },
  disabledMessage: {
    padding: '24px',
    backgroundColor: '#262626',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  disabledText: {
    color: '#f59e0b',
    fontSize: '14px',
    margin: '0 0 8px 0',
  },
  disabledHint: {
    color: '#666',
    fontSize: '12px',
    margin: 0,
  },
}
