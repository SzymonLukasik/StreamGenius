import type { OverlayProposal } from './overlay.js';
export interface AudioChunkMessage {
    kind: 'audio_chunk';
    data: string;
}
export interface OverlayApproveMessage {
    kind: 'overlay_approve';
    id: string;
}
export interface OverlayDismissMessage {
    kind: 'overlay_dismiss';
    id: string;
}
export type ClientMessage = AudioChunkMessage | OverlayApproveMessage | OverlayDismissMessage;
export interface TranscriptMessage {
    kind: 'transcript';
    text: string;
    isFinal: boolean;
    timestamp: number;
}
export interface OverlayProposalMessage {
    kind: 'overlay_proposal';
    proposal: OverlayProposal;
}
export interface SessionStatusMessage {
    kind: 'session_status';
    connected: boolean;
    sessionId: string;
    reconnecting: boolean;
}
export type ServerMessage = TranscriptMessage | OverlayProposalMessage | SessionStatusMessage;
export type WebSocketMessage = ClientMessage | ServerMessage;
export declare function isClientMessage(msg: WebSocketMessage): msg is ClientMessage;
export declare function isServerMessage(msg: WebSocketMessage): msg is ServerMessage;
//# sourceMappingURL=websocket.d.ts.map