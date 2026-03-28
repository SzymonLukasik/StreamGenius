// Types
export type {
  OverlayType,
  OverlayStatus,
  ClientOverlayStatus,
  YoutubeData,
  DeepAnalysisData,
  WebSearchData,
  OverlayData,
  OverlayProposal,
  ClientOverlay,
} from './types/overlay.js'

export type {
  AudioChunkMessage,
  TextInputMessage,
  OverlayApproveMessage,
  OverlayDismissMessage,
  FishjamJoinMessage,
  FishjamLeaveMessage,
  ClientMessage,
  TranscriptMessage,
  OverlayProposalMessage,
  SessionStatusMessage,
  FishjamRoomCreatedMessage,
  FishjamRoomClosedMessage,
  ReasoningMessage,
  ServerErrorMessage,
  ServerMessage,
  WebSocketMessage,
} from './types/websocket.js'

export { isClientMessage, isServerMessage } from './types/websocket.js'

// Validators
export {
  youtubeDataSchema,
  deepAnalysisDataSchema,
  webSearchDataSchema,
  overlayTypeSchema,
  overlayStatusSchema,
  overlayDataSchema,
  overlayProposalSchema,
  audioChunkMessageSchema,
  textInputMessageSchema,
  overlayApproveMessageSchema,
  overlayDismissMessageSchema,
  fishjamJoinMessageSchema,
  fishjamLeaveMessageSchema,
  clientMessageSchema,
  transcriptMessageSchema,
  overlayProposalMessageSchema,
  sessionStatusMessageSchema,
  fishjamRoomCreatedMessageSchema,
  fishjamRoomClosedMessageSchema,
  reasoningMessageSchema,
  serverErrorMessageSchema,
  serverMessageSchema,
  webSocketMessageSchema,
} from './validators/index.js'

export type { ValidatedClientMessage, ValidatedServerMessage } from './validators/index.js'
