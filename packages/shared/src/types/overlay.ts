export type OverlayType = 'youtube_card' | 'fact_banner' | 'comparison' | 'viewer_highlight'

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

export interface FactData {
  fact: string
  source: string
  sourceUrl: string
  confidence: number
}

export interface ComparisonData {
  itemA: {
    name: string
    pros: string[]
    cons: string[]
  }
  itemB: {
    name: string
    pros: string[]
    cons: string[]
  }
  summary: string
}

export interface ViewerData {
  username: string
  comment: string
  timestamp: number
  highlightReason: string
}

export type OverlayData = YoutubeData | FactData | ComparisonData | ViewerData | null

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
