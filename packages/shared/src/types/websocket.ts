import type { OverlayProposal } from './overlay.js'

// Client -> Server messages
export interface AudioChunkMessage {
  kind: 'audio_chunk'
  data: string
}

export interface OverlayApproveMessage {
  kind: 'overlay_approve'
  id: string
}

export interface OverlayDismissMessage {
  kind: 'overlay_dismiss'
  id: string
}

export type ClientMessage = AudioChunkMessage | OverlayApproveMessage | OverlayDismissMessage

// Server -> Client messages
export interface TranscriptMessage {
  kind: 'transcript'
  text: string
  isFinal: boolean
  timestamp: number
}

export interface OverlayProposalMessage {
  kind: 'overlay_proposal'
  proposal: OverlayProposal
}

export interface SessionStatusMessage {
  kind: 'session_status'
  connected: boolean
  sessionId: string
  reconnecting: boolean
}

export type ServerMessage = TranscriptMessage | OverlayProposalMessage | SessionStatusMessage

export type WebSocketMessage = ClientMessage | ServerMessage

export function isClientMessage(msg: WebSocketMessage): msg is ClientMessage {
  return msg.kind === 'audio_chunk' || msg.kind === 'overlay_approve' || msg.kind === 'overlay_dismiss'
}

export function isServerMessage(msg: WebSocketMessage): msg is ServerMessage {
  return msg.kind === 'transcript' || msg.kind === 'overlay_proposal' || msg.kind === 'session_status'
}
