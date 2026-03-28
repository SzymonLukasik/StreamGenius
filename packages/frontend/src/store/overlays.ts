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

      // If not final, update the last message from this speaker (live update)
      if (!isFinal) {
        const lastMsg = state.transcriptMessages[state.transcriptMessages.length - 1]
        if (lastMsg && lastMsg.speaker === speaker && !lastMsg.isFinal) {
          // Update last message in place
          return {
            transcript: text,
            transcriptFinal: isFinal,
            transcriptMessages: [
              ...state.transcriptMessages.slice(0, -1),
              { ...lastMsg, text: message },
            ],
          }
        }
        // New interim message
        return {
          transcript: text,
          transcriptFinal: isFinal,
          transcriptMessages: [
            ...state.transcriptMessages,
            {
              id: `msg-${Date.now()}`,
              speaker,
              text: message,
              timestamp: Date.now(),
              isFinal: false,
            },
          ],
        }
      }

      // Final message - mark last interim as final or add new
      const lastMsg = state.transcriptMessages[state.transcriptMessages.length - 1]
      if (lastMsg && lastMsg.speaker === speaker && !lastMsg.isFinal) {
        return {
          transcript: text,
          transcriptFinal: isFinal,
          transcriptMessages: [
            ...state.transcriptMessages.slice(0, -1),
            { ...lastMsg, text: message, isFinal: true },
          ],
        }
      }

      // New final message
      return {
        transcript: text,
        transcriptFinal: isFinal,
        transcriptMessages: [
          ...state.transcriptMessages,
          {
            id: `msg-${Date.now()}`,
            speaker,
            text: message,
            timestamp: Date.now(),
            isFinal: true,
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
