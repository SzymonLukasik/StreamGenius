import { useEffect, useRef, useState } from 'react'
import { useOverlayStore } from '../store/overlays'
import type { ClientMessage, ServerMessage } from '@streamgenius/shared'
import { serverMessageSchema } from '@streamgenius/shared'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
const RECONNECT_DELAY = 3000

interface WebSocketState {
  isConnected: boolean
  sessionId: string | null
  reconnecting: boolean
  sendMessage: (message: ClientMessage) => void
}

let globalWs: WebSocket | null = null
let globalState: WebSocketState = {
  isConnected: false,
  sessionId: null,
  reconnecting: false,
  sendMessage: () => {},
}
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function connect() {
  if (globalWs?.readyState === WebSocket.OPEN) return

  globalState = { ...globalState, reconnecting: true }
  notifyListeners()

  globalWs = new WebSocket(WS_URL)

  globalWs.onopen = () => {
    console.log('WebSocket connected')
    globalState = { ...globalState, isConnected: true, reconnecting: false }
    notifyListeners()
  }

  globalWs.onmessage = (event) => {
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

  globalWs.onclose = () => {
    console.log('WebSocket disconnected')
    globalState = { ...globalState, isConnected: false, sessionId: null }
    notifyListeners()

    setTimeout(connect, RECONNECT_DELAY)
  }

  globalWs.onerror = (err) => {
    console.error('WebSocket error:', err)
  }

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
  }
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
    }
  }, [])

  return globalState
}
