import { create } from 'zustand'
import type { OverlayProposal, ClientOverlay, ClientOverlayStatus } from '@streamgenius/shared'

interface OverlayState {
  overlays: ClientOverlay[]
  transcript: string
  transcriptFinal: boolean
  reasoning: string

  addOverlay: (proposal: OverlayProposal) => void
  updateOverlayStatus: (id: string, status: ClientOverlayStatus) => void
  removeOverlay: (id: string) => void
  setTranscript: (text: string, isFinal: boolean) => void
  setReasoning: (text: string) => void
  clearReasoning: () => void
}

export const useOverlayStore = create<OverlayState>((set) => ({
  overlays: [],
  transcript: '',
  transcriptFinal: false,
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
    set({
      transcript: text,
      transcriptFinal: isFinal,
    }),

  setReasoning: (text) =>
    set((state) => ({
      reasoning: state.reasoning + text,
    })),

  clearReasoning: () =>
    set({
      reasoning: '',
    }),
}))
