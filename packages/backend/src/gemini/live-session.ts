import { GoogleGenAI, Modality } from '@google/genai'
import type { LiveServerMessage, Session } from '@google/genai'
import type { FishjamAgent, AgentTrack, IncomingTrackData } from '@fishjam-cloud/js-server-sdk'
import { geminiOutputAudioSettings, inputMimeType } from '@fishjam-cloud/js-server-sdk/gemini'
import type { OverlayProposal } from '@streamgenius/shared'
import { ToolExecutor } from './tool-executor.js'
import { toolDefinitions, systemPrompt } from './tool-definitions.js'

const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'
const TOOL_CALL_DEBOUNCE_MS = 500
const TRANSCRIPT_FINALIZE_DELAY_MS = 2000

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

  // Debounce tool calls - wait 5 seconds before executing
  let pendingToolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = []
  let toolCallTimer: NodeJS.Timeout | null = null

  const executeToolCalls = async (session: Session) => {
    if (pendingToolCalls.length === 0) return

    const toolsToExecute = [...pendingToolCalls]
    pendingToolCalls = []
    toolCallTimer = null

    const functionResponses: Array<{
      id: string
      name: string
      response: { result: unknown }
    }> = []

    for (const tc of toolsToExecute) {
      console.log(`Executing tool: ${tc.name}`, tc.args)
      const result = await toolExecutor.execute({
        name: tc.name,
        args: tc.args,
      })
      functionResponses.push({
        id: tc.id,
        name: tc.name,
        response: { result: result.response },
      })
    }

    if (functionResponses.length > 0) {
      console.log('Sending tool responses back to Gemini:', functionResponses.map((r) => r.name))
      session.sendToolResponse({ functionResponses })
    }
  }

  const queueToolCall = (session: Session, id: string, name: string, args: Record<string, unknown>) => {
    pendingToolCalls.push({ id, name, args })

    // Reset timer on each new tool call
    if (toolCallTimer) {
      clearTimeout(toolCallTimer)
    }
    toolCallTimer = setTimeout(() => executeToolCalls(session), TOOL_CALL_DEBOUNCE_MS)
  }

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

  // Only send final transcripts to frontend - no intermediate updates
  // Gemini sends accumulated text, we just wait for finished=true
  let transcriptBuffer = ''
  let finalizeTimer: NodeJS.Timeout | null = null

  const flushTranscript = () => {
    const text = transcriptBuffer.trim()
    if (text) {
      console.log(`[Transcript] Final: "${text}"`)
      onTranscript(text, true, getSpeakerName())
    }
    transcriptBuffer = ''
    finalizeTimer = null
  }

  const handleInputTranscription = (text: string, finished: boolean) => {
    // Clear any pending finalize timer
    if (finalizeTimer) {
      clearTimeout(finalizeTimer)
      finalizeTimer = null
    }

    // Gemini sends deltas - append to buffer (preserve leading space for word boundaries)
    transcriptBuffer += text

    if (finished) {
      // Gemini signals transcription is complete - send to frontend
      flushTranscript()
    } else {
      // Fallback: finalize after silence in case Gemini doesn't send finished=true
      finalizeTimer = setTimeout(flushTranscript, TRANSCRIPT_FINALIZE_DELAY_MS)
    }
  }

  // Connect to Gemini Live API
  const session = await genAI.live.connect({
    model: GEMINI_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore', // English voice
          },
        },
      },
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
          (tc) => queueToolCall(session, tc.id, tc.name, tc.args),
          handleInputTranscription,
          onReasoning
        )
      },
    },
  })

  // Forward audio from Fishjam to Gemini
  let chunkCount = 0
  let lastLogTime = Date.now()

  const handleTrackData = (trackData: IncomingTrackData) => {
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
  }

  agent.on('trackData', handleTrackData)

  return {
    close: () => {
      if (toolCallTimer) {
        clearTimeout(toolCallTimer)
      }
      if (finalizeTimer) {
        clearTimeout(finalizeTimer)
      }
      agent.off('trackData', handleTrackData)
      session.close()
    },
  }
}

async function handleGeminiMessage(
  message: LiveServerMessage,
  _session: Session,
  outputTrack: AgentTrack,
  agent: FishjamAgent,
  queueToolCall: (tc: { id: string; name: string; args: Record<string, unknown> }) => void,
  handleInputTranscription: (text: string, finished: boolean) => void,
  onReasoning: (text: string) => void
) {
  const serverContent = message.serverContent

  // Handle input audio transcription (what the user said)
  // Gemini Transcription type: { text?: string, finished?: boolean }
  const inputTranscription = (serverContent as Record<string, unknown>)?.inputTranscription as
    | { text?: string; finished?: boolean }
    | undefined
  if (inputTranscription) {
    console.log('[Gemini] inputTranscription:', JSON.stringify(inputTranscription))
  }
  if (inputTranscription?.text) {
    handleInputTranscription(inputTranscription.text, inputTranscription.finished ?? false)
  }

  // Handle output audio transcription (what Gemini is saying)
  const outputTranscription = (serverContent as Record<string, unknown>)?.outputTranscription as
    | { text?: string }
    | undefined
  if (outputTranscription?.text) {
    onReasoning(outputTranscription.text)
  }

  if (!serverContent) {
    // Check for tool calls - queue them for debounced execution
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls || []) {
        if (!fc.name || !fc.id) continue
        console.log(`Tool call queued: ${fc.name}`, fc.args)
        queueToolCall({
          id: fc.id,
          name: fc.name,
          args: (fc.args || {}) as Record<string, unknown>,
        })
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
