import { randomUUID } from 'crypto'
import type { OverlayProposal, OverlayType, OverlayData } from '@streamgenius/shared'
import { fetchYoutubeVideo } from '../fetchers/youtube.js'
import { searchGoogle } from '../fetchers/search.js'
import { analyzeWithGeminiPro } from '../fetchers/gemini-pro.js'

export interface ToolExecutorCallbacks {
  onOverlayProposal: (proposal: OverlayProposal) => void
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface ToolResponse {
  name: string
  response: unknown
}

const DEDUP_WINDOW_MS = 30000 // 30 seconds
const SIMILARITY_THRESHOLD = 0.6

interface CachedResult {
  type: OverlayType
  data: OverlayData
  trigger: string
  timestamp: number
}

export class ToolExecutor {
  private recentCalls: Array<{ name: string; query: string; timestamp: number }> = []
  private lastSearchResult: CachedResult | null = null

  constructor(private callbacks: ToolExecutorCallbacks) {}

  async execute(toolCall: ToolCall): Promise<ToolResponse> {
    const { name, args } = toolCall

    // Extract query for deduplication
    const query = this.extractQuery(name, args)

    // Check for duplicates (skip show_overlay as it's intentional)
    if (name !== 'show_overlay' && query && this.isDuplicate(query)) {
      console.log(`Skipping duplicate tool call: ${name} with query "${query}"`)
      return { name, response: { skipped: true, reason: 'duplicate_query' } }
    }

    // Track this call
    if (query) {
      this.recentCalls.push({ name, query, timestamp: Date.now() })
      this.cleanupOldCalls()
    }

    try {
      let response: unknown

      switch (name) {
        // Search tools - return data to Gemini for evaluation
        case 'search_youtube':
          response = await this.handleSearchYoutube(args as { query: string; channel?: string })
          break

        case 'search_web':
          response = await this.handleSearchWeb(args as { query: string })
          break

        case 'analyze_claim':
          response = await this.handleAnalyzeClaim(
            args as {
              claim: string
              verdict?: 'verified' | 'disputed' | 'partially_true' | 'unverified'
              explanation?: string
              confidence?: number
            }
          )
          break

        // Display tool - creates overlay for viewers
        case 'show_overlay':
          response = await this.handleShowOverlay(
            args as { overlay_type: OverlayType; data: OverlayData }
          )
          break

        default:
          throw new Error(`Unknown tool: ${name}`)
      }

      return { name, response }
    } catch (error) {
      console.error(`Tool execution failed: ${name}`, error)
      return { name, response: { error: String(error) } }
    }
  }

  private async handleSearchYoutube(args: { query: string; channel?: string }) {
    console.log(`Searching YouTube for: ${args.query}`)
    const video = await fetchYoutubeVideo(args.query, args.channel)

    if (!video) {
      this.lastSearchResult = null
      return { found: false, message: 'No video found for this query' }
    }

    // Cache the result for show_overlay
    this.lastSearchResult = {
      type: 'youtube_card',
      data: video,
      trigger: args.query,
      timestamp: Date.now(),
    }

    console.log(`Found video:`, JSON.stringify(video, null, 2))

    return {
      found: true,
      video: {
        videoId: video.videoId,
        title: video.title,
        channelName: video.channelName,
        thumbnailUrl: video.thumbnailUrl,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        publishedAt: video.publishedAt,
      },
    }
  }

  private async handleSearchWeb(args: { query: string }) {
    console.log(`Searching web for: ${args.query}`)
    const results = await searchGoogle(args.query, 3)

    const webSearchData = {
      query: args.query,
      results: results.map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
      })),
    }

    // Cache the result for show_overlay
    this.lastSearchResult = {
      type: 'web_search',
      data: webSearchData,
      trigger: args.query,
      timestamp: Date.now(),
    }

    console.log(`Web search results:`, JSON.stringify(webSearchData, null, 2))

    return webSearchData
  }

  private async handleAnalyzeClaim(args: {
    claim: string
    verdict?: 'verified' | 'disputed' | 'partially_true' | 'unverified'
    explanation?: string
    confidence?: number
  }) {
    console.log(`Analyzing claim: ${args.claim}`)

    let analysis

    // If Gemini Live provided verdict/explanation, use that (fallback mode)
    if (args.verdict && args.explanation) {
      console.log('Using Gemini Live provided analysis')
      analysis = {
        claim: args.claim,
        verdict: args.verdict,
        explanation: args.explanation,
        sources: [],
        confidence: args.confidence ?? 0.7,
      }
    } else {
      // Try Gemini Pro API for deeper analysis with sources
      console.log('Calling Gemini API for deep analysis...')
      analysis = await analyzeWithGeminiPro(args.claim)
    }

    // Cache the result for show_overlay
    this.lastSearchResult = {
      type: 'fact_banner',
      data: analysis,
      trigger: args.claim,
      timestamp: Date.now(),
    }

    console.log(`Claim analysis:`, JSON.stringify(analysis, null, 2))

    return {
      success: true,
      analysis,
      message: 'Analysis complete. Call show_overlay with overlay_type fact_banner to display.',
    }
  }

  private async handleShowOverlay(args: { overlay_type: OverlayType; data?: OverlayData }) {
    const { overlay_type } = args
    const overlayId = randomUUID()

    // Use cached search result if available (preferred), otherwise fall back to args.data
    const cached = this.lastSearchResult
    const isValidCache = cached && Date.now() - cached.timestamp < 60000 // 1 minute validity

    let overlayData: OverlayData
    let actualType: OverlayType

    if (isValidCache && cached.type === overlay_type) {
      // Use the actual fetched data from the search
      overlayData = cached.data
      actualType = cached.type
      console.log(`Showing overlay: ${actualType} (using cached search result)`)
    } else if (isValidCache) {
      // Type mismatch but we have cached data - use it anyway
      overlayData = cached.data
      actualType = cached.type
      console.log(`Showing overlay: ${actualType} (using cached data, type corrected from ${overlay_type})`)
    } else {
      // No valid cache - shouldn't happen in normal flow
      console.warn(`No cached search result for show_overlay, args:`, args)
      return { success: false, error: 'No search result to display. Call a search tool first.' }
    }

    // Clear cache after use
    this.lastSearchResult = null

    console.log(`Overlay data:`, JSON.stringify(overlayData, null, 2))

    this.sendProposal(overlayId, actualType, 'ready', overlayData, cached.trigger)

    return { success: true, overlayId }
  }

  private sendProposal(
    id: string,
    type: OverlayType,
    status: 'fetching' | 'ready' | 'error',
    data: OverlayData,
    trigger: string
  ): void {
    const proposal: OverlayProposal = {
      id,
      type,
      status,
      trigger,
      timestamp: Date.now(),
      data,
    }
    this.callbacks.onOverlayProposal(proposal)
  }

  private extractQuery(name: string, args: Record<string, unknown>): string | null {
    switch (name) {
      case 'search_youtube':
      case 'search_web':
        return (args.query as string) || null
      case 'analyze_claim':
        return (args.claim as string) || null
      default:
        return null
    }
  }

  private isDuplicate(query: string): boolean {
    const now = Date.now()
    const normalizedQuery = query.toLowerCase().trim()

    for (const call of this.recentCalls) {
      // Skip old calls
      if (now - call.timestamp > DEDUP_WINDOW_MS) continue

      // Check similarity
      const normalizedRecent = call.query.toLowerCase().trim()
      const similarity = this.calculateSimilarity(normalizedQuery, normalizedRecent)

      if (similarity >= SIMILARITY_THRESHOLD) {
        return true
      }
    }

    return false
  }

  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2))
    const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2))

    if (wordsA.size === 0 || wordsB.size === 0) return 0

    let intersection = 0
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++
    }

    return intersection / Math.max(wordsA.size, wordsB.size)
  }

  private cleanupOldCalls(): void {
    const now = Date.now()
    this.recentCalls = this.recentCalls.filter((call) => now - call.timestamp <= DEDUP_WINDOW_MS)
  }
}
