import { useCallback, useEffect, useRef, useState } from 'react'
// Browser build: no WebView (Chromium) — only View/Text/Image/etc. See SmelterScene.tsx.
import Smelter, { setWasmBundleUrl } from '@swmansion/smelter-web-wasm'
import { SmelterScene, SMELTER_CAMERA_INPUT_ID, SMELTER_OUTPUT_RESOLUTION } from '../components/SmelterScene'

import InterRegularUrl from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf?url'
import InterBoldUrl from '@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf?url'

setWasmBundleUrl('/smelter.wasm')

const SMELTER_OUTPUT_ID = 'program'
/**
 * Smelter WASM composites each frame via WebGPU/WebGL. Chrome often logs
 * "READ-usage buffer was read back without waiting on a fence" — that comes from the
 * browser + Smelter pipeline, not from this file; it cannot be silenced from JS.
 * Slightly lower FPS reduces how often that path runs (fewer logs, a bit less GPU work).
 * If you see WebGL errors mentioning unrelated scripts (e.g. cookie-banner extensions),
 * try a clean profile or disable extensions — they can share the page GL context.
 */
const DEFAULT_FRAMERATE = 24

interface UseSmelterCompositionResult {
  composedStream: MediaStream | null
  isReady: boolean
  error: Error | null
  startComposition: (cameraStream: MediaStream) => Promise<MediaStream>
  stopComposition: () => Promise<void>
}

export function useSmelterComposition(): UseSmelterCompositionResult {
  const smelterRef = useRef<Smelter | null>(null)
  const composedStreamRef = useRef<MediaStream | null>(null)

  const [composedStream, setComposedStream] = useState<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const stopComposition = useCallback(async () => {
    const currentSmelter = smelterRef.current
    smelterRef.current = null

    if (currentSmelter) {
      await currentSmelter.terminate()
    }

    const currentStream = composedStreamRef.current
    composedStreamRef.current = null

    currentStream?.getTracks().forEach((track) => track.stop())

    setComposedStream(null)
    setIsReady(false)
  }, [])

  const startComposition = useCallback(
    async (cameraStream: MediaStream) => {
      await stopComposition()
      setError(null)

      const smelter = new Smelter({ framerate: DEFAULT_FRAMERATE })

      try {
        await smelter.init()
        
        // Fetch and register fonts
        await smelter.registerFont(InterRegularUrl)
        await smelter.registerFont(InterBoldUrl)

        await smelter.registerInput(SMELTER_CAMERA_INPUT_ID, {
          type: 'stream',
          stream: cameraStream,
        })

        const output = await smelter.registerOutput(
          SMELTER_OUTPUT_ID,
          <SmelterScene />,
          {
            type: 'stream',
            video: { resolution: SMELTER_OUTPUT_RESOLUTION },
            audio: false,
          }
        )

        if (!output.stream) {
          throw new Error('Smelter did not return a composed stream')
        }

        await smelter.start()

        smelterRef.current = smelter
        composedStreamRef.current = output.stream
        setComposedStream(output.stream)
        setIsReady(true)

        return output.stream
      } catch (cause) {
        await smelter.terminate().catch(() => {})
        const smelterError =
          cause instanceof Error ? cause : new Error('Failed to start Smelter composition')
        setError(smelterError)
        setComposedStream(null)
        setIsReady(false)
        throw smelterError
      }
    },
    [stopComposition]
  )

  useEffect(() => {
    return () => {
      void stopComposition()
    }
  }, [stopComposition])

  return {
    composedStream,
    isReady,
    error,
    startComposition,
    stopComposition,
  }
}
