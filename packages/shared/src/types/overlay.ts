export type OverlayType = 'youtube_card' | 'fact_banner' | 'web_search'

export type OverlayStatus = 'fetching' | 'ready' | 'error'

export type ClientOverlayStatus =
  | 'fetching'
  | 'ready'
  | 'approved'
  | 'rendering'
  | 'displayed'
  | 'dismissed'
  | 'skipped'

export interface YoutubeData {
  videoId: string
  title: string
  channelName: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  publishedAt: string
}

export interface DeepAnalysisData {
  claim: string
  verdict: 'verified' | 'disputed' | 'unverified' | 'partially_true'
  explanation: string
  sources: Array<{
    title: string
    url: string
    relevance: string
  }>
  confidence: number
}

export interface WebSearchData {
  query: string
  results: Array<{
    title: string
    link: string
    snippet: string
  }>
}

export type OverlayData = YoutubeData | DeepAnalysisData | WebSearchData | null

export interface OverlayProposal {
  id: string
  type: OverlayType
  status: OverlayStatus
  trigger: string
  timestamp: number
  data: OverlayData
}

export interface ClientOverlay extends Omit<OverlayProposal, 'status'> {
  status: ClientOverlayStatus
}
