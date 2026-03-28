import { useEffect, useRef, useState } from 'react'
import { useFishjamBroadcast } from '../hooks/useFishjamBroadcast'
import { useWebSocket, setFishjamCallbacks } from '../hooks/useWebSocket'
import { useFishjamEnabled } from '../providers/FishjamProvider'
import { StreamPreview } from './StreamPreview'

type Mode = 'idle' | 'host' | 'guest'

function BroadcastControlsInner() {
  const {
    state,
    startBroadcast,
    stopBroadcast,
    videoStream,
    isMuted,
    toggleMute,
    joinAsGuest,
    compositionReady,
    compositionError,
  } = useFishjamBroadcast()
  const { sendMessage, isConnected: wsConnected } = useWebSocket()
  const [streamerId] = useState(() => `streamer_${Date.now()}`)
  const [pendingStart, setPendingStart] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const [guestRoomId, setGuestRoomId] = useState('')
  const [guestName, setGuestName] = useState('')
  const [copied, setCopied] = useState(false)
  const [startupError, setStartupError] = useState<string | null>(null)
  const pendingStartRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinRoom = params.get('join')
    const name = params.get('name')

    if (joinRoom) {
      setGuestRoomId(joinRoom)
      setMode('guest')
    }

    if (name) {
      setGuestName(name)
    }
  }, [])

  useEffect(() => {
    pendingStartRef.current = pendingStart
  }, [pendingStart])

  useEffect(() => {
    setFishjamCallbacks({
      onRoomCreated: async (roomId, streamerToken) => {
        setStartupError(null)
        if (pendingStartRef.current) {
          pendingStartRef.current = false
          setPendingStart(false)
          try {
            await startBroadcast(streamerToken, roomId)
            setMode('host')
          } catch (err) {
            console.error('Failed to start broadcast:', err)
          }
        }
      },
      onGuestToken: async (roomId, guestToken) => {
        setStartupError(null)
        if (mode === 'guest' && pendingStartRef.current) {
          pendingStartRef.current = false
          setPendingStart(false)
          try {
            await joinAsGuest(guestToken, roomId)
          } catch (err) {
            console.error('Failed to join as guest:', err)
          }
        }
      },
      onRoomClosed: () => {
        setMode('idle')
      },
      onError: (message) => {
        pendingStartRef.current = false
        setPendingStart(false)
        setStartupError(message)
      },
    })

    return () => {
      setFishjamCallbacks({})
    }
  }, [joinAsGuest, mode, startBroadcast])

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

  const handleJoinAsGuest = () => {
    if (!wsConnected || !guestRoomId || !guestName) {
      console.error('Missing roomId or name')
      return
    }

    setStartupError(null)
    pendingStartRef.current = true
    setPendingStart(true)
    setMode('guest')
    sendMessage({ kind: 'fishjam_join_as_guest', roomId: guestRoomId, guestName })
  }

  const handleStopBroadcast = async () => {
    if (state.roomId) {
      sendMessage({ kind: 'fishjam_leave', roomId: state.roomId })
    }

    pendingStartRef.current = false
    setPendingStart(false)
    setStartupError(null)
    await stopBroadcast()
    setMode('idle')
  }

  const handleCopyLink = () => {
    if (state.roomId) {
      const baseUrl = window.location.origin
      const url = `${baseUrl}?join=${state.roomId}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      console.log('Invite link:', url)
    }
  }

  const isStarting = pendingStart || state.isConnecting

  return (
    <div style={styles.container}>
      <StreamPreview
        stream={videoStream}
        compositionReady={compositionReady}
        compositionError={mode === 'host' ? compositionError?.message ?? null : null}
      />

      {mode === 'idle' && !state.isConnected && !isStarting && (
        <>
          <div style={styles.controls}>
            <button onClick={handleStartBroadcast} disabled={!wsConnected} style={styles.startButton}>
              Start as Host
            </button>
          </div>

          <div style={styles.divider}>
            <span>or join as guest</span>
          </div>

          <div style={styles.guestForm}>
            <input
              type="text"
              placeholder="Room ID"
              value={guestRoomId}
              onChange={(e) => setGuestRoomId(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Your Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              style={styles.input}
            />
            <button
              onClick={handleJoinAsGuest}
              disabled={!wsConnected || !guestRoomId || !guestName}
              style={styles.joinButton}
            >
              Join as Guest
            </button>
          </div>
        </>
      )}

      {mode === 'guest' && !state.isConnected && !isStarting && (
        <div style={styles.guestForm}>
          <input
            type="text"
            placeholder="Room ID"
            value={guestRoomId}
            onChange={(e) => setGuestRoomId(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleJoinAsGuest}
            disabled={!wsConnected || !guestRoomId || !guestName}
            style={styles.joinButton}
          >
            Join as Guest
          </button>
          <button onClick={() => setMode('idle')} style={styles.backButton}>
            Back
          </button>
        </div>
      )}

      {isStarting && (
        <div style={styles.controls}>
          <button disabled style={styles.connectingButton}>
            {pendingStart ? 'Creating room...' : 'Connecting...'}
          </button>
        </div>
      )}

      {state.isConnected && (
        <div style={styles.controls}>
          <button onClick={toggleMute} style={isMuted ? styles.muteButtonActive : styles.muteButton}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={handleStopBroadcast} style={styles.stopButton}>
            {mode === 'host' ? 'Stop Broadcast' : 'Leave Room'}
          </button>
        </div>
      )}

      {(state.error || startupError || (mode === 'host' && compositionError)) && (
        <p style={styles.error}>
          Error: {startupError ?? (mode === 'host' ? compositionError?.message : null) ?? state.error?.message}
        </p>
      )}

      {state.roomId && mode === 'host' && (
        <div style={styles.roomInfo}>
          <div style={styles.roomHeader}>
            <span style={styles.roomLabel}>Room ID:</span>
            <code style={styles.roomId}>{state.roomId}</code>
          </div>
          <button onClick={handleCopyLink} style={styles.copyButton}>
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      )}

      {state.roomId && mode === 'guest' && (
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>Connected as:</span>
          <span style={styles.guestNameDisplay}>{guestName}</span>
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
  muteButton: {
    padding: '12px 24px',
    backgroundColor: '#6b7280',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  muteButtonActive: {
    padding: '12px 24px',
    backgroundColor: '#f59e0b',
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
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#262626',
    borderRadius: '6px',
  },
  roomHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  copyButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#666',
    fontSize: '12px',
  },
  guestForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  input: {
    padding: '10px 12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
  },
  joinButton: {
    padding: '12px 24px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #444',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  guestNameDisplay: {
    fontSize: '14px',
    color: '#8b5cf6',
    fontWeight: 600,
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
