import { randomUUID } from 'crypto'
import type { OverlayProposal, OverlayType } from '@streamgenius/shared'
import { fetchYoutubeVideo } from '../fetchers/youtube.js'
import { searchGoogle } from '../fetchers/search.js'

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

const toolToOverlayType: Record<string, OverlayType> = {
  fetch_youtube_video: 'youtube_card',
  verify_fact: 'fact_banner',
  create_comparison: 'comparison',
  highlight_viewer: 'viewer_highlight',
}

export class ToolExecutor {
  constructor(private callbacks: ToolExecutorCallbacks) {}

  async execute(toolCall: ToolCall): Promise<ToolResponse> {
    const { name, args } = toolCall
    const overlayId = randomUUID()
    const overlayType = toolToOverlayType[name] || 'fact_banner'

    // Send fetching status immediately
    this.sendProposal(overlayId, overlayType, 'fetching', args)

    try {
      let data: unknown

      switch (name) {
        case 'fetch_youtube_video':
          data = await this.handleYoutubeVideo(args as { query: string; channelName?: string })
          break
        case 'verify_fact':
          data = await this.handleVerifyFact(args as { claim: string; context?: string })
          break
        case 'create_comparison':
          data = await this.handleComparison(
            args as { itemA: string; itemB: string; aspectsToCompare?: string[] }
          )
          break
        case 'highlight_viewer':
          data = this.handleViewerHighlight(args as { username: string; comment: string })
          break
        default:
          throw new Error(`Unknown tool: ${name}`)
      }

      // Send ready status with data
      this.sendProposal(overlayId, overlayType, 'ready', args, data)

      return { name, response: data }
    } catch (error) {
      console.error(`Tool execution failed: ${name}`, error)
      this.sendProposal(overlayId, overlayType, 'error', args)
      return { name, response: { error: String(error) } }
    }
  }

  private sendProposal(
    id: string,
    type: OverlayType,
    status: 'fetching' | 'ready' | 'error',
    trigger: Record<string, unknown>,
    data: unknown = null
  ): void {
    const proposal: OverlayProposal = {
      id,
      type,
      status,
      trigger: JSON.stringify(trigger),
      timestamp: Date.now(),
      data: data as OverlayProposal['data'],
    }
    this.callbacks.onOverlayProposal(proposal)
  }

  private async handleYoutubeVideo(args: {
    query: string
    channelName?: string
  }): Promise<unknown> {
    const result = await fetchYoutubeVideo(args.query, args.channelName)
    return result
  }

  private async handleVerifyFact(args: { claim: string; context?: string }): Promise<unknown> {
    // Search for sources to verify the fact
    const searchResults = await searchGoogle(args.claim)

    // For now, return search results as fact verification
    // In production, this would use Gemini Pro to analyze and verify
    return {
      fact: args.claim,
      source: searchResults[0]?.title || 'Web Search',
      sourceUrl: searchResults[0]?.link || '',
      confidence: 0.8,
      context: args.context,
    }
  }

  private async handleComparison(args: {
    itemA: string
    itemB: string
    aspectsToCompare?: string[]
  }): Promise<unknown> {
    // In production, this would use Gemini Pro to generate comparison
    // For now, return a structured comparison template
    const aspects = args.aspectsToCompare || ['Performance', 'Ease of Use', 'Community']

    return {
      itemA: {
        name: args.itemA,
        points: aspects.map((aspect) => `${aspect}: Analyzing ${args.itemA}...`),
      },
      itemB: {
        name: args.itemB,
        points: aspects.map((aspect) => `${aspect}: Analyzing ${args.itemB}...`),
      },
      summary: `Comparison between ${args.itemA} and ${args.itemB}`,
    }
  }

  private handleViewerHighlight(args: { username: string; comment: string }): unknown {
    return {
      username: args.username,
      message: args.comment,
      timestamp: Date.now(),
    }
  }
}
