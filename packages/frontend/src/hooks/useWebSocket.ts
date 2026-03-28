import { useEffect, useRef, useState } from 'react'
import { useOverlayStore } from '../store/overlays'
import type { ClientMessage, ServerMessage } from '@streamgenius/shared'
import { serverMessageSchema } from '@streamgenius/shared'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const RECONNECT_DELAY = 3000

interface FishjamCallbacks {
  onRoomCreated?: (roomId: string, streamerToken: string) => void
  onRoomClosed?: (roomId: string) => void
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
  if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
    return
  }

  clearReconnectTimer()
  globalState = { ...globalState, reconnecting: true }
  notifyListeners()

  const ws = new WebSocket(WS_URL)
  globalWs = ws

  ws.onopen = () => {
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
    if (globalWs === ws) {
      globalWs = null
    }

    globalState = { ...globalState, isConnected: false, sessionId: null }
    notifyListeners()
    scheduleReconnect()
  }

  ws.onerror = () => {}

  globalState.sendMessage = (message: ClientMessage) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify(message))
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

        if (
          globalWs?.readyState === WebSocket.OPEN ||
          globalWs?.readyState === WebSocket.CONNECTING
        ) {
          globalWs.close()
        }

        globalWs = null
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
