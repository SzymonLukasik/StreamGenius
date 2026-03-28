import { useEffect, useRef, useState, useCallback } from 'react'

interface AudioCaptureState {
  isCapturing: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

const SAMPLE_RATE = 16000
const CHUNK_INTERVAL_MS = 100

export function useAudioCapture(onAudioChunk: (base64: string) => void): AudioCaptureState {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback(async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      streamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioContextRef.current = audioContext

      console.log('Audio capture started (stub implementation)')
      setIsCapturing(true)

      intervalRef.current = window.setInterval(() => {
        const mockPcm = new Uint8Array(SAMPLE_RATE * (CHUNK_INTERVAL_MS / 1000) * 2)
        const base64 = btoa(String.fromCharCode(...mockPcm))
        onAudioChunk(base64)
      }, CHUNK_INTERVAL_MS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(message)
      console.error('Audio capture error:', err)
    }
  }, [onAudioChunk])

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    setIsCapturing(false)
    console.log('Audio capture stopped')
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isCapturing,
    error,
    start,
    stop,
  }
}
