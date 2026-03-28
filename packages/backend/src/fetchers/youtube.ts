import type { YoutubeData } from '@streamgenius/shared'
import { Jimp } from 'jimp'
import { randomUUID } from 'crypto'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// In-memory cache of PNG thumbnails served via HTTP
const thumbnailCache = new Map<string, Buffer>()

export function getThumbnailBuffer(id: string): Buffer | undefined {
  return thumbnailCache.get(id)
}

async function fetchThumbnailAsPngUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) return undefined
    const buffer = Buffer.from(await response.arrayBuffer())

    // Convert to PNG using Jimp (Smelter WASM doesn't support JPEG)
    const image = await Jimp.read(buffer)
    const pngBuffer = await image.getBuffer('image/png')

    // Store in cache and return an HTTP URL that Smelter can load
    const id = randomUUID()
    thumbnailCache.set(id, pngBuffer)

    const port = process.env.PORT || 3001
    return `http://localhost:${port}/thumbnails/${id}.png`
  } catch (err) {
    console.error('Failed to fetch/convert thumbnail:', err)
    return undefined
  }
}

export async function fetchYoutubeVideo(
  query: string,
  channelName?: string
): Promise<YoutubeData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set')
    return await getMockYoutubeData(query)
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
      return await getMockYoutubeData(query)
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
      return await getMockYoutubeData(query)
    }

    const thumbnailUrl = video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || ''
    const thumbnailPngUrl = await fetchThumbnailAsPngUrl(thumbnailUrl)

    return {
      videoId,
      title: video.snippet.title,
      channelName: video.snippet.channelTitle,
      thumbnailUrl,
      thumbnailPngUrl,
      viewCount: parseInt(video.statistics.viewCount, 10) || 0,
      likeCount: parseInt(video.statistics.likeCount, 10) || 0,
      publishedAt: video.snippet.publishedAt,
    }
  } catch (error) {
    console.error('YouTube API error:', error)
    return await getMockYoutubeData(query)
  }
}

async function getMockYoutubeData(query: string): Promise<YoutubeData> {
  const thumbnailUrl = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
  const thumbnailPngUrl = await fetchThumbnailAsPngUrl(thumbnailUrl)

  return {
    videoId: 'dQw4w9WgXcQ',
    title: `Video about: ${query}`,
    channelName: 'Sample Channel',
    thumbnailUrl,
    thumbnailPngUrl,
    viewCount: 1000000,
    likeCount: 50000,
    publishedAt: new Date().toISOString(),
  }
}
