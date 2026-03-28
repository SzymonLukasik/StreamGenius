import { create } from 'zustand'
import type { OverlayProposal, ClientOverlay, ClientOverlayStatus } from '@streamgenius/shared'

export interface TranscriptMessage {
  id: string
  speaker: string
  text: string
  timestamp: number
  isFinal: boolean
}

interface OverlayState {
  overlays: ClientOverlay[]
  transcript: string
  transcriptFinal: boolean
  transcriptMessages: TranscriptMessage[]
  reasoning: string

  addOverlay: (proposal: OverlayProposal) => void
  updateOverlayStatus: (id: string, status: ClientOverlayStatus) => void
  removeOverlay: (id: string) => void
  setTranscript: (text: string, isFinal: boolean) => void
  setReasoning: (text: string) => void
  clearReasoning: () => void
  clearTranscript: () => void
}

// Parse speaker from transcript text like "[Speaker 1] Hello world"
function parseTranscript(text: string): { speaker: string; message: string } {
  const match = text.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return { speaker: match[1], message: match[2] }
  }
  return { speaker: 'Unknown', message: text }
}

// Time window to accumulate messages from same speaker (ms)
const ACCUMULATE_WINDOW_MS = 10000

// Intelligently merge new text with existing text
function mergeText(existing: string, incoming: string): string {
  if (!existing) return incoming
  if (!incoming) return existing

  const existingLower = existing.toLowerCase().trim()
  const incomingLower = incoming.toLowerCase().trim()

  // Case 1: Incoming is an extension of existing (Gemini sent accumulated text)
  // e.g., existing="Python", incoming="Python is faster"
  if (incomingLower.startsWith(existingLower)) {
    return incoming
  }

  // Case 2: Existing ends with start of incoming (overlap)
  // e.g., existing="Python is", incoming="is faster" -> "Python is faster"
  for (let i = Math.min(existing.length, 20); i > 0; i--) {
    const existingEnd = existingLower.slice(-i)
    if (incomingLower.startsWith(existingEnd)) {
      return existing + incoming.slice(i)
    }
  }

  // Case 3: Check if incoming continues a partial word
  // e.g., existing="Py", incoming="thon" -> "Python"
  const lastWord = existing.split(/\s+/).pop() || ''
  const firstWord = incoming.split(/\s+/)[0] || ''

  // If last char of existing is a letter and first char of incoming is a letter (no space)
  // and together they could form a word, concatenate without space
  if (lastWord && firstWord &&
      /[a-zA-Z]$/.test(existing) &&
      /^[a-zA-Z]/.test(incoming) &&
      !existing.endsWith(' ') &&
      lastWord.length < 10) {
    return existing + incoming
  }

  // Case 4: Default - append with space
  return existing + ' ' + incoming
}

export const useOverlayStore = create<OverlayState>((set) => ({
  overlays: [],
  transcript: '',
  transcriptFinal: false,
  transcriptMessages: [],
  reasoning: '',

  addOverlay: (proposal) =>
    set((state) => {
      const existing = state.overlays.find((o) => o.id === proposal.id)
      if (existing) {
        const newStatus: ClientOverlayStatus =
          proposal.status === 'error' ? 'skipped' : proposal.status
        return {
          overlays: state.overlays.map((o) =>
            o.id === proposal.id ? { ...o, status: newStatus, data: proposal.data } : o
          ),
        }
      }

      const clientOverlay: ClientOverlay = {
        ...proposal,
        status: proposal.status === 'error' ? 'skipped' : proposal.status,
      }

      return {
        overlays: [...state.overlays, clientOverlay],
      }
    }),

  updateOverlayStatus: (id, status) =>
    set((state) => ({
      overlays: state.overlays.map((o) => (o.id === id ? { ...o, status } : o)),
    })),

  removeOverlay: (id) =>
    set((state) => ({
      overlays: state.overlays.filter((o) => o.id !== id),
    })),

  setTranscript: (text, isFinal) =>
    set((state) => {
      const { speaker, message } = parseTranscript(text)

      // Skip empty messages
      if (!message.trim()) {
        return { transcript: text, transcriptFinal: isFinal }
      }

      const now = Date.now()
      const lastMsg = state.transcriptMessages[state.transcriptMessages.length - 1]

      // Update last message if same speaker and within time window
      if (lastMsg && lastMsg.speaker === speaker && now - lastMsg.timestamp < ACCUMULATE_WINDOW_MS) {
        // Intelligently merge the text
        const mergedText = mergeText(lastMsg.text, message)
        return {
          transcript: text,
          transcriptFinal: isFinal,
          transcriptMessages: [
            ...state.transcriptMessages.slice(0, -1),
            { ...lastMsg, text: mergedText, timestamp: now, isFinal },
          ],
        }
      }

      // New message (different speaker or too much time passed)
      return {
        transcript: text,
        transcriptFinal: isFinal,
        transcriptMessages: [
          ...state.transcriptMessages,
          {
            id: `msg-${Date.now()}`,
            speaker,
            text: message,
            timestamp: now,
            isFinal,
          },
        ],
      }
    }),

  setReasoning: (text) =>
    set((state) => ({
      reasoning: state.reasoning + text,
    })),

  clearReasoning: () =>
    set({
      reasoning: '',
    }),

  clearTranscript: () =>
    set({
      transcript: '',
      transcriptFinal: false,
      transcriptMessages: [],
    }),
}))
