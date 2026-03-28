import { useCallback, useEffect, useRef, useState } from 'react'
import Smelter, { setWasmBundleUrl } from '@swmansion/smelter-web-wasm'
import { SmelterScene, SMELTER_CAMERA_INPUT_ID, SMELTER_OUTPUT_RESOLUTION } from '../components/SmelterScene'

setWasmBundleUrl('/smelter.wasm')

const SMELTER_OUTPUT_ID = 'program'
const DEFAULT_FRAMERATE = 30

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
        await smelter.registerFont('/Inter.ttf')
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
