import type { OverlayProposal } from '@streamgenius/shared'

export interface GeminiProxyOptions {
  onTranscript: (text: string, isFinal: boolean) => void
  onOverlayProposal: (proposal: OverlayProposal) => void
  onError: (error: Error) => void
}

export interface GeminiProxy {
  sendAudio: (base64Audio: string) => Promise<void>
  close: () => void
}

export function createGeminiProxy(options: GeminiProxyOptions): GeminiProxy {
  const { onTranscript, onError } = options
  void options.onOverlayProposal
  let isConnected = false

  async function connect() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      onError(new Error('GEMINI_API_KEY not set'))
      return
    }

    // TODO: Implement Gemini Live API WebSocket connection
    // This will use the Gemini Live API for real-time audio processing
    // For now, this is a stub implementation

    isConnected = true
    console.log('Gemini proxy connected (stub)')
  }

  connect().catch(onError)

  return {
    async sendAudio(_base64Audio: string) {
      if (!isConnected) {
        console.log('Gemini proxy not connected, buffering audio...')
        return
      }

      // TODO: Send audio to Gemini Live API
      // The API will return:
      // 1. Transcripts (partial and final)
      // 2. Tool calls when intents are detected

      // Stub: Echo back a mock transcript
      if (Math.random() < 0.1) {
        onTranscript('Sample transcript...', false)
      }
    },

    close() {
      isConnected = false
      console.log('Gemini proxy closed')
    },
  }
}
