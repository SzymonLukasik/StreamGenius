import { useCallback, useEffect, useState } from 'react'
import { useConnection, useCamera, useMicrophone } from '@fishjam-cloud/react-client'

interface BroadcastState {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  roomId: string | null
}

interface UseFishjamBroadcastResult {
  state: BroadcastState
  startBroadcast: (peerToken: string, roomId: string) => Promise<void>
  stopBroadcast: () => void
  videoStream: MediaStream | null
  audioStream: MediaStream | null
}

export function useFishjamBroadcast(): UseFishjamBroadcastResult {
  const { joinRoom, leaveRoom, peerStatus } = useConnection()
  const { startCamera, stopCamera, cameraStream } = useCamera()
  const { startMicrophone, stopMicrophone, microphoneStream } = useMicrophone()

  const [state, setState] = useState<BroadcastState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    roomId: null,
  })

  // Sync connection state from Fishjam
  useEffect(() => {
    const isConnected = peerStatus === 'connected'
    setState((prev) => ({
      ...prev,
      isConnected,
      isConnecting: prev.isConnecting && !isConnected,
    }))
  }, [peerStatus])

  const startBroadcast = useCallback(
    async (peerToken: string, roomId: string) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }))

      try {
        // Start camera and microphone
        await startCamera()
        await startMicrophone()

        // Join the room with peer token
        await joinRoom({ peerToken })

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          roomId,
        }))
      } catch (err) {
        stopCamera()
        stopMicrophone()

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: err as Error,
        }))
        throw err
      }
    },
    [joinRoom, startCamera, startMicrophone, stopCamera, stopMicrophone]
  )

  const stopBroadcast = useCallback(() => {
    stopCamera()
    stopMicrophone()
    leaveRoom()

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      roomId: null,
    })
  }, [leaveRoom, stopCamera, stopMicrophone])

  return {
    state,
    startBroadcast,
    stopBroadcast,
    videoStream: cameraStream ?? null,
    audioStream: microphoneStream ?? null,
  }
}
