import type { OverlayProposal } from './overlay.js'

// Client -> Server messages
export interface AudioChunkMessage {
  kind: 'audio_chunk'
  data: string
}

export interface TextInputMessage {
  kind: 'text_input'
  text: string
}

export interface OverlayApproveMessage {
  kind: 'overlay_approve'
  id: string
}

export interface OverlayDismissMessage {
  kind: 'overlay_dismiss'
  id: string
}

export interface FishjamJoinMessage {
  kind: 'fishjam_join'
  streamerId: string
}

export interface FishjamLeaveMessage {
  kind: 'fishjam_leave'
  roomId: string
}

export interface FishjamJoinAsGuestMessage {
  kind: 'fishjam_join_as_guest'
  roomId: string
  guestName: string
}

export type ClientMessage =
  | AudioChunkMessage
  | TextInputMessage
  | OverlayApproveMessage
  | OverlayDismissMessage
  | FishjamJoinMessage
  | FishjamLeaveMessage
  | FishjamJoinAsGuestMessage

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

export interface FishjamRoomCreatedMessage {
  kind: 'fishjam_room_created'
  roomId: string
  streamerToken: string
}

export interface FishjamRoomClosedMessage {
  kind: 'fishjam_room_closed'
  roomId: string
}

export interface FishjamGuestTokenMessage {
  kind: 'fishjam_guest_token'
  roomId: string
  guestToken: string
  guestName: string
}

export interface ReasoningMessage {
  kind: 'reasoning'
  text: string
  timestamp: number
}

export type ServerMessage =
  | TranscriptMessage
  | OverlayProposalMessage
  | SessionStatusMessage
  | FishjamRoomCreatedMessage
  | FishjamRoomClosedMessage
  | FishjamGuestTokenMessage
  | ReasoningMessage

export type WebSocketMessage = ClientMessage | ServerMessage

export function isClientMessage(msg: WebSocketMessage): msg is ClientMessage {
  return msg.kind === 'audio_chunk' || msg.kind === 'overlay_approve' || msg.kind === 'overlay_dismiss'
}

export function isServerMessage(msg: WebSocketMessage): msg is ServerMessage {
  return msg.kind === 'transcript' || msg.kind === 'overlay_proposal' || msg.kind === 'session_status'
}
