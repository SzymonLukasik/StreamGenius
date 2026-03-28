import { GoogleGenAI, Modality } from '@google/genai'
import type { LiveServerMessage } from '@google/genai'
import type { FishjamAgent, AgentTrack, IncomingTrackData } from '@fishjam-cloud/js-server-sdk'
import { geminiOutputAudioSettings, inputMimeType } from '@fishjam-cloud/js-server-sdk/gemini'
import type { OverlayProposal } from '@streamgenius/shared'
import { toolDefinitions, systemPrompt } from './tool-definitions.js'
import { ToolExecutor } from './tool-executor.js'

const GEMINI_MODEL = 'gemini-3.1-flash-live-preview'

export interface GeminiLiveSessionOptions {
  onTranscript: (text: string, isFinal: boolean) => void
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

  // Connect to Gemini Live API
  const session = await genAI.live.connect({
    model: GEMINI_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
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
        console.log('Gemini message received:', JSON.stringify(message).slice(0, 200))
        await handleGeminiMessage(message, outputTrack, agent, toolExecutor, onTranscript, onReasoning)
      },
    },
  })

  // Forward audio from Fishjam to Gemini
  let audioChunkCount = 0
  agent.on('trackData', (trackData: IncomingTrackData) => {
    audioChunkCount++
    if (audioChunkCount % 50 === 1) {
      console.log(`Forwarding audio chunk #${audioChunkCount} to Gemini (${trackData.data.length} bytes)`)
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
  outputTrack: AgentTrack,
  agent: FishjamAgent,
  toolExecutor: ToolExecutor,
  onTranscript: (text: string, isFinal: boolean) => void,
  onReasoning: (text: string) => void
) {
  const serverContent = message.serverContent

  // Handle input audio transcription (what the user said)
  // This is nested inside serverContent
  const inputTranscription = (serverContent as Record<string, unknown>)?.inputTranscription as { text?: string } | undefined
  if (inputTranscription?.text) {
    console.log('User said:', inputTranscription.text)
    onTranscript(inputTranscription.text, true)
  }

  // Handle output audio transcription (what Gemini is saying)
  const outputTranscription = (serverContent as Record<string, unknown>)?.outputTranscription as { text?: string } | undefined
  if (outputTranscription?.text) {
    console.log('Gemini said:', outputTranscription.text)
    onReasoning(outputTranscription.text)
  }

  if (!serverContent) {
    // Check for tool calls
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls || []) {
        if (!fc.name) continue
        console.log(`Tool called: ${fc.name}`, fc.args)
        await toolExecutor.execute({
          name: fc.name,
          args: (fc.args || {}) as Record<string, unknown>,
        })
      }
    }
    return
  }

  // Handle interruption
  if (serverContent.interrupted) {
    console.log('Agent was interrupted by user')
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
