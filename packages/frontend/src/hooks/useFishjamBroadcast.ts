import { useCallback, useEffect, useRef, useState } from 'react'
import { useConnection, useCustomSource, useMicrophone, usePeers } from '@fishjam-cloud/react-client'
import { useSmelterComposition } from './useSmelterComposition'

const SMELTER_SOURCE_ID = 'smelter-output'
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 360 },
    aspectRatio: { ideal: 16 / 9 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: false,
}

interface BroadcastState {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  roomId: string | null
}

interface UseFishjamBroadcastResult {
  state: BroadcastState
  startBroadcast: (peerToken: string, roomId: string) => Promise<void>
  joinAsGuest: (peerToken: string, roomId: string) => Promise<void>
  stopBroadcast: () => Promise<void>
  videoStream: MediaStream | null
  audioStream: MediaStream | null
  isMuted: boolean
  toggleMute: () => Promise<void>
  compositionReady: boolean
  compositionError: Error | null
}

export function useFishjamBroadcast(): UseFishjamBroadcastResult {
  const { joinRoom, leaveRoom, peerStatus } = useConnection()
  const { startMicrophone, stopMicrophone, microphoneStream, isMicrophoneMuted, toggleMicrophoneMute } = useMicrophone()
  const { remotePeers } = usePeers()
  const { setStream: setCustomSourceStream } = useCustomSource(SMELTER_SOURCE_ID)
  const { composedStream, isReady, error: compositionError, startComposition, stopComposition } =
    useSmelterComposition()
  const localCameraStreamRef = useRef<MediaStream | null>(null)
  const roleRef = useRef<'host' | 'guest' | null>(null)

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

  const stopLocalCamera = useCallback(() => {
    localCameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    localCameraStreamRef.current = null
  }, [])

  const startBroadcast = useCallback(
    async (peerToken: string, roomId: string) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }))

      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
        localCameraStreamRef.current = cameraStream

        const videoTrack = cameraStream.getVideoTracks()[0]
        const settings = videoTrack?.getSettings()
        console.log('[Camera] Resolution:', settings?.width, 'x', settings?.height, 'aspect:', settings?.aspectRatio)

        const stream = await startComposition(cameraStream)
        await setCustomSourceStream(stream)

        const [, microphoneError] = await startMicrophone()
        if (microphoneError) {
          throw new Error(`Failed to start microphone: ${microphoneError.name}`)
        }

        await joinRoom({ peerToken })
        roleRef.current = 'host'

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          roomId,
        }))
      } catch (err) {
        stopMicrophone()
        leaveRoom()
        await setCustomSourceStream(null).catch(() => {})
        await stopComposition().catch(() => {})
        stopLocalCamera()

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: err as Error,
        }))
        throw err
      }
    },
    [
      joinRoom,
      leaveRoom,
      setCustomSourceStream,
      startComposition,
      startMicrophone,
      stopComposition,
      stopLocalCamera,
      stopMicrophone,
    ]
  )

  const joinAsGuest = useCallback(
    async (peerToken: string, roomId: string) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }))

      try {
        await joinRoom({ peerToken })
        roleRef.current = 'guest'

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          roomId,
        }))
      } catch (err) {
        leaveRoom()
        roleRef.current = null

        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: err as Error,
        }))
        throw err
      }
    },
    [joinRoom, leaveRoom]
  )

  const stopBroadcast = useCallback(async () => {
    await setCustomSourceStream(null).catch(() => {})
    await stopComposition().catch(() => {})
    stopLocalCamera()
    stopMicrophone()
    leaveRoom()
    roleRef.current = null

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      roomId: null,
    })
  }, [leaveRoom, setCustomSourceStream, stopComposition, stopLocalCamera, stopMicrophone])

  const guestVideoStream =
    remotePeers.flatMap((peer) => peer.customVideoTracks).find((track) => track.stream)?.stream ?? null
  const videoStream = roleRef.current === 'guest' ? guestVideoStream : composedStream

  return {
    state,
    startBroadcast,
    joinAsGuest,
    stopBroadcast,
    videoStream,
    audioStream: microphoneStream ?? null,
    isMuted: isMicrophoneMuted,
    toggleMute: toggleMicrophoneMute,
    compositionReady: isReady,
    compositionError,
  }
}
