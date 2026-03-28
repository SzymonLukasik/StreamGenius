import type { YoutubeData } from "../types.js";

const API_KEY = process.env.YOUTUBE_API_KEY;

export async function fetchYoutubeCard(query: string): Promise<YoutubeData> {
  if (!API_KEY) throw new Error("YOUTUBE_API_KEY not set");

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.items?.length) throw new Error(`No results for: ${query}`);

  const videoId = searchData.items[0].id.videoId;
  const snippet = searchData.items[0].snippet;

  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();

  return {
    title: snippet.title,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
    channelName: snippet.channelTitle,
    viewCount: Number(statsData.items?.[0]?.statistics?.viewCount ?? 0),
    publishedAt: snippet.publishedAt,
    videoUrl: `https://youtube.com/watch?v=${videoId}`,
  };
}
