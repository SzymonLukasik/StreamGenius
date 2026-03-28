import { z } from 'zod'

export const youtubeDataSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnailUrl: z.string().url(),
  viewCount: z.number().int().nonnegative(),
  likeCount: z.number().int().nonnegative(),
  publishedAt: z.string(),
})

export const deepAnalysisDataSchema = z.object({
  claim: z.string(),
  verdict: z.enum(['verified', 'disputed', 'unverified', 'partially_true']),
  explanation: z.string(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      relevance: z.string(),
    })
  ),
  confidence: z.number().min(0).max(1),
})

export const webSearchDataSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      snippet: z.string(),
    })
  ),
})

export const comparisonDataSchema = z.object({
  itemA: z.object({ name: z.string(), pros: z.array(z.string()), cons: z.array(z.string()) }),
  itemB: z.object({ name: z.string(), pros: z.array(z.string()), cons: z.array(z.string()) }),
  summary: z.string(),
})

export const overlayTypeSchema = z.enum([
  'youtube_card',
  'fact_banner',
  'web_search',
  'comparison',
])

export const overlayStatusSchema = z.enum(['fetching', 'ready', 'error'])

export const overlayDataSchema = z.union([
  youtubeDataSchema,
  deepAnalysisDataSchema,
  webSearchDataSchema,
  comparisonDataSchema,
  z.null(),
])

export const overlayProposalSchema = z.object({
  id: z.string().uuid(),
  type: overlayTypeSchema,
  status: overlayStatusSchema,
  trigger: z.string(),
  timestamp: z.number(),
  data: overlayDataSchema,
})

// Client -> Server message schemas
export const audioChunkMessageSchema = z.object({
  kind: z.literal('audio_chunk'),
  data: z.string(),
})

export const textInputMessageSchema = z.object({
  kind: z.literal('text_input'),
  text: z.string(),
})

export const overlayApproveMessageSchema = z.object({
  kind: z.literal('overlay_approve'),
  id: z.string(),
})

export const overlayDismissMessageSchema = z.object({
  kind: z.literal('overlay_dismiss'),
  id: z.string(),
})

export const fishjamJoinMessageSchema = z.object({
  kind: z.literal('fishjam_join'),
  streamerId: z.string(),
})

export const fishjamLeaveMessageSchema = z.object({
  kind: z.literal('fishjam_leave'),
  roomId: z.string(),
})

export const fishjamJoinAsGuestMessageSchema = z.object({
  kind: z.literal('fishjam_join_as_guest'),
  roomId: z.string(),
  guestName: z.string(),
})

export const clientMessageSchema = z.discriminatedUnion('kind', [
  audioChunkMessageSchema,
  textInputMessageSchema,
  overlayApproveMessageSchema,
  overlayDismissMessageSchema,
  fishjamJoinMessageSchema,
  fishjamLeaveMessageSchema,
  fishjamJoinAsGuestMessageSchema,
])

// Server -> Client message schemas
export const transcriptMessageSchema = z.object({
  kind: z.literal('transcript'),
  text: z.string(),
  isFinal: z.boolean(),
  timestamp: z.number(),
})

export const overlayProposalMessageSchema = z.object({
  kind: z.literal('overlay_proposal'),
  proposal: overlayProposalSchema,
})

export const sessionStatusMessageSchema = z.object({
  kind: z.literal('session_status'),
  connected: z.boolean(),
  sessionId: z.string(),
  reconnecting: z.boolean(),
})

export const fishjamRoomCreatedMessageSchema = z.object({
  kind: z.literal('fishjam_room_created'),
  roomId: z.string(),
  streamerToken: z.string(),
})

export const fishjamRoomClosedMessageSchema = z.object({
  kind: z.literal('fishjam_room_closed'),
  roomId: z.string(),
})

export const fishjamGuestTokenMessageSchema = z.object({
  kind: z.literal('fishjam_guest_token'),
  roomId: z.string(),
  guestToken: z.string(),
  guestName: z.string(),
})

export const reasoningMessageSchema = z.object({
  kind: z.literal('reasoning'),
  text: z.string(),
  timestamp: z.number(),
})

export const serverMessageSchema = z.discriminatedUnion('kind', [
  transcriptMessageSchema,
  overlayProposalMessageSchema,
  sessionStatusMessageSchema,
  fishjamRoomCreatedMessageSchema,
  fishjamRoomClosedMessageSchema,
  fishjamGuestTokenMessageSchema,
  reasoningMessageSchema,
])

export const webSocketMessageSchema = z.union([clientMessageSchema, serverMessageSchema])

export type ValidatedClientMessage = z.infer<typeof clientMessageSchema>
export type ValidatedServerMessage = z.infer<typeof serverMessageSchema>
