import { useEffect, useRef, useState } from 'react'
import { useOverlayStore } from '../store/overlays'
import type { ClientMessage, ServerMessage } from '@streamgenius/shared'
import { serverMessageSchema } from '@streamgenius/shared'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const RECONNECT_DELAY = 3000

interface FishjamCallbacks {
  onRoomCreated?: (roomId: string, streamerToken: string) => void
  onRoomClosed?: (roomId: string) => void
  onGuestToken?: (roomId: string, guestToken: string, guestName: string) => void
  onError?: (message: string) => void
}

interface WebSocketState {
  isConnected: boolean
  sessionId: string | null
  reconnecting: boolean
  sendMessage: (message: ClientMessage) => void
}

let fishjamCallbacks: FishjamCallbacks = {}

let globalWs: WebSocket | null = null
/** Socket we treat as authoritative; stale instances (e.g. Strict Mode teardown) close only after open to avoid "closed before established". */
let activeSocket: WebSocket | null = null
let globalState: WebSocketState = {
  isConnected: false,
  sessionId: null,
  reconnecting: false,
  sendMessage: () => {},
}
const listeners = new Set<() => void>()
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function scheduleReconnect() {
  if (reconnectTimer !== null || listeners.size === 0) return

  globalState = { ...globalState, reconnecting: true }
  notifyListeners()

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (listeners.size > 0) {
      connect()
    }
  }, RECONNECT_DELAY)
}

function connect() {
  if (activeSocket?.readyState === WebSocket.OPEN || activeSocket?.readyState === WebSocket.CONNECTING) {
    return
  }

  clearReconnectTimer()
  globalState = { ...globalState, reconnecting: true }
  notifyListeners()

  const ws = new WebSocket(WS_URL)
  globalWs = ws
  activeSocket = ws

  ws.onopen = () => {
    if (activeSocket !== ws) {
      ws.close()
      return
    }
    globalState = { ...globalState, isConnected: true, reconnecting: false }
    notifyListeners()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      const result = serverMessageSchema.safeParse(data)

      if (!result.success) {
        console.error('Invalid server message:', result.error)
        return
      }

      handleServerMessage(result.data)
    } catch (err) {
      console.error('Failed to parse message:', err)
    }
  }

  ws.onclose = () => {
    // Another socket replaced this one, or we're ignoring a dead connection
    if (activeSocket !== null && activeSocket !== ws) {
      return
    }
    activeSocket = null
    globalWs = null

    globalState = { ...globalState, isConnected: false, sessionId: null }
    notifyListeners()
    scheduleReconnect()
  }

  ws.onerror = () => {}

  globalState.sendMessage = (message: ClientMessage) => {
    if (activeSocket?.readyState === WebSocket.OPEN) {
      activeSocket.send(JSON.stringify(message))
    }
  }
}

function handleServerMessage(message: ServerMessage) {
  const store = useOverlayStore.getState()

  switch (message.kind) {
    case 'session_status':
      globalState = {
        ...globalState,
        isConnected: message.connected,
        sessionId: message.sessionId,
        reconnecting: message.reconnecting,
      }
      notifyListeners()
      break

    case 'transcript':
      store.setTranscript(message.text, message.isFinal)
      break

    case 'overlay_proposal':
      store.addOverlay(message.proposal)
      break

    case 'fishjam_room_created':
      fishjamCallbacks.onRoomCreated?.(message.roomId, message.streamerToken)
      break

    case 'fishjam_room_closed':
      fishjamCallbacks.onRoomClosed?.(message.roomId)
      break

    case 'fishjam_guest_token':
      fishjamCallbacks.onGuestToken?.(message.roomId, message.guestToken, message.guestName)
      break

    case 'reasoning':
      store.setReasoning(message.text)
      break

    case 'server_error':
      fishjamCallbacks.onError?.(message.message)
      break
  }
}

export function setFishjamCallbacks(callbacks: FishjamCallbacks) {
  fishjamCallbacks = callbacks
}

export function useWebSocket(): WebSocketState {
  const [, setTick] = useState(0)
  const forceUpdate = useRef<() => void>()

  forceUpdate.current = () => setTick((t) => t + 1)

  useEffect(() => {
    const update = () => forceUpdate.current?.()
    listeners.add(update)
    connect()

    return () => {
      listeners.delete(update)

      if (listeners.size === 0) {
        clearReconnectTimer()

        activeSocket = null

        const ws = globalWs
        globalWs = null

        // Closing while CONNECTING triggers a noisy browser warning; stale sockets exit in onopen.
        if (ws?.readyState === WebSocket.OPEN) {
          ws.close()
        }

        globalState = {
          ...globalState,
          isConnected: false,
          sessionId: null,
          reconnecting: false,
        }
      }
    }
  }, [])

  return globalState
}
