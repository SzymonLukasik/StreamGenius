import type { YoutubeData } from '@streamgenius/shared'
import { mockFetchersEnabled } from '../config/dev-mocks.js'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function fetchYoutubeVideo(
  query: string,
  channelName?: string
): Promise<YoutubeData | null> {
  if (mockFetchersEnabled()) {
    console.log(`[MOCK_FETCHERS] Skipping YouTube API; mock video for:`, query.slice(0, 80))
    return getMockYoutubeData(query)
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return getMockYoutubeData(query)
  }

  try {
    const searchQuery = channelName ? `${query} ${channelName}` : query

    // Search for videos
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`)
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', searchQuery)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '1')
    searchUrl.searchParams.set('key', apiKey)

    const searchResponse = await fetch(searchUrl.toString())
    if (!searchResponse.ok) throw new Error(`YouTube search API error: ${searchResponse.status}`)
    const searchData = (await searchResponse.json()) as {
      items?: Array<{ id?: { videoId?: string } }>
    }

    const videoId = searchData.items?.[0]?.id?.videoId
    if (!videoId) {
      console.log('No video found for query:', query)
      return getMockYoutubeData(query)
    }

    // Get video details
    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`)
    videoUrl.searchParams.set('part', 'snippet,statistics')
    videoUrl.searchParams.set('id', videoId)
    videoUrl.searchParams.set('key', apiKey)

    const videoResponse = await fetch(videoUrl.toString())
    if (!videoResponse.ok) throw new Error(`YouTube video API error: ${videoResponse.status}`)
    const videoData = (await videoResponse.json()) as {
      items?: Array<{
        snippet: {
          title: string
          channelTitle: string
          publishedAt: string
          thumbnails: {
            high?: { url: string }
            default?: { url: string }
          }
        }
        statistics: {
          viewCount: string
          likeCount: string
        }
      }>
    }
    const video = videoData.items?.[0]

    if (!video) {
      return getMockYoutubeData(query)
    }

    return {
      videoId,
      title: video.snippet.title,
      channelName: video.snippet.channelTitle,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || '',
      viewCount: parseInt(video.statistics.viewCount, 10) || 0,
      likeCount: parseInt(video.statistics.likeCount, 10) || 0,
      publishedAt: video.snippet.publishedAt,
    }
  } catch (error) {
    console.error('YouTube API error:', error)
    return getMockYoutubeData(query)
  }
}

function getMockYoutubeData(query: string): YoutubeData {
  return {
    videoId: 'dQw4w9WgXcQ',
    title: `Video about: ${query}`,
    channelName: 'Sample Channel',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    viewCount: 1000000,
    likeCount: 50000,
    publishedAt: new Date().toISOString(),
  }
}
