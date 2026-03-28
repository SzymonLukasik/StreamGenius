import { GoogleGenAI, Modality } from '@google/genai'
import type { LiveServerMessage, Session } from '@google/genai'
import type { FishjamAgent, AgentTrack, IncomingTrackData } from '@fishjam-cloud/js-server-sdk'
import { geminiOutputAudioSettings, inputMimeType } from '@fishjam-cloud/js-server-sdk/gemini'
import type { OverlayProposal } from '@streamgenius/shared'
import { ToolExecutor } from './tool-executor.js'
import { toolDefinitions, systemPrompt } from './tool-definitions.js'

const GEMINI_MODEL = 'gemini-3.1-flash-live-preview'

export interface GeminiLiveSessionOptions {
  onTranscript: (text: string, isFinal: boolean, speakerId?: string) => void
  onReasoning: (text: string) => void
  onOverlayProposal: (proposal: OverlayProposal) => void
  onError: (error: Error) => void
}

export interface GeminiLiveSession {
  close: () => void
}

export async function createGeminiLiveSession(
  agent: FishjamAgent,
  options: GeminiLiveSessionOptions
): Promise<GeminiLiveSession> {
  const { onTranscript, onReasoning, onOverlayProposal, onError } = options

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set')
  }

  const genAI = new GoogleGenAI({ apiKey })
  const toolExecutor = new ToolExecutor({ onOverlayProposal })

  // Create output track for Gemini responses (24kHz)
  const outputTrack: AgentTrack = agent.createTrack(geminiOutputAudioSettings)

  // Track speakers by peerId
  const speakerMap = new Map<string, { name: string; lastActive: number }>()
  let speakerCounter = 0
  let lastActiveSpeaker: string | undefined

  const getSpeakerName = () => {
    if (!lastActiveSpeaker) return undefined
    return speakerMap.get(lastActiveSpeaker)?.name
  }

  // Connect to Gemini Live API
  const session = await genAI.live.connect({
    model: GEMINI_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: toolDefinitions }],
    },
    callbacks: {
      onopen: () => {
        console.log('Gemini Live session opened')
      },
      onerror: (err: Event | Error) => {
        console.error('Gemini Live error:', err)
        onError(err instanceof Error ? err : new Error(String(err)))
      },
      onclose: (event: Event) => {
        console.log('Gemini Live session closed', event)
      },
      onmessage: async (message: LiveServerMessage) => {
        await handleGeminiMessage(
          message,
          session,
          outputTrack,
          agent,
          toolExecutor,
          (text, isFinal) => onTranscript(text, isFinal, getSpeakerName()),
          onReasoning
        )
      },
    },
  })

  // Forward audio from Fishjam to Gemini
  let chunkCount = 0
  let lastLogTime = Date.now()

  agent.on('trackData', (trackData: IncomingTrackData) => {
    const peerId = trackData.peerId as string
    const trackMetadata = (trackData as { track?: { metadata?: { name?: string } } }).track?.metadata

    // Register new speakers
    if (!speakerMap.has(peerId)) {
      speakerCounter++
      // Use metadata name if available, otherwise default to Speaker N
      const name = trackMetadata?.name || `Speaker ${speakerCounter}`
      speakerMap.set(peerId, { name, lastActive: Date.now() })
      console.log(`New speaker detected: ${name} (peerId: ${peerId})`, trackMetadata ? `metadata: ${JSON.stringify(trackMetadata)}` : '')
    }

    // Update last active speaker
    const speaker = speakerMap.get(peerId)!
    speaker.lastActive = Date.now()
    lastActiveSpeaker = peerId

    chunkCount++
    const now = Date.now()

    // Log chunk rate every 5 seconds
    if (now - lastLogTime >= 5000) {
      console.log(`Audio chunks sent: ${chunkCount} in last 5s (${(chunkCount / 5).toFixed(1)}/sec)`)
      console.log(`Active speakers: ${[...speakerMap.values()].map((s) => s.name).join(', ')}`)
      chunkCount = 0
      lastLogTime = now
    }

    session.sendRealtimeInput({
      audio: {
        mimeType: inputMimeType,
        data: Buffer.from(trackData.data).toString('base64'),
      },
    })
  })

  return {
    close: () => {
      session.close()
    },
  }
}

async function handleGeminiMessage(
  message: LiveServerMessage,
  session: Session,
  outputTrack: AgentTrack,
  agent: FishjamAgent,
  toolExecutor: ToolExecutor,
  onTranscript: (text: string, isFinal: boolean) => void,
  onReasoning: (text: string) => void
) {
  const serverContent = message.serverContent

  // Handle input audio transcription (what the user said)
  const inputTranscription = (serverContent as Record<string, unknown>)?.inputTranscription as
    | { text?: string }
    | undefined
  if (inputTranscription?.text) {
    onTranscript(inputTranscription.text, true)
  }

  // Handle output audio transcription (what Gemini is saying)
  const outputTranscription = (serverContent as Record<string, unknown>)?.outputTranscription as
    | { text?: string }
    | undefined
  if (outputTranscription?.text) {
    onReasoning(outputTranscription.text)
  }

  if (!serverContent) {
    // Check for tool calls
    if (message.toolCall) {
      const functionResponses: Array<{
        id: string
        name: string
        response: { result: unknown }
      }> = []

      for (const fc of message.toolCall.functionCalls || []) {
        if (!fc.name || !fc.id) continue
        console.log(`Tool called: ${fc.name}`, fc.args)

        const result = await toolExecutor.execute({
          name: fc.name,
          args: (fc.args || {}) as Record<string, unknown>,
        })

        // Collect responses to send back to Gemini
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result: result.response },
        })
      }

      // Send all tool responses back to Gemini
      if (functionResponses.length > 0) {
        console.log('Sending tool responses back to Gemini:', functionResponses.map((r) => r.name))
        session.sendToolResponse({ functionResponses })
      }
    }
    return
  }

  // Handle interruption - stop Gemini's audio output when user starts speaking
  if (serverContent.interrupted) {
    agent.interruptTrack(outputTrack.id)
  }

  // Handle model turn (audio/text responses)
  if (serverContent.modelTurn?.parts) {
    for (const part of serverContent.modelTurn.parts) {
      // Handle audio output - forward to Fishjam
      if (part.inlineData?.data) {
        const pcmData = Buffer.from(part.inlineData.data, 'base64')
        agent.sendData(outputTrack.id, pcmData)
      }
    }
  }
}
