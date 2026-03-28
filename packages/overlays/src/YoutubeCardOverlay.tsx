import type { YoutubeData } from '@streamgenius/shared'

interface Props {
  data: YoutubeData
}

export function YoutubeCardOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '40px',
        width: '320px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <img
        src={data.thumbnailUrl}
        alt={data.title}
        style={{
          width: '100%',
          height: '180px',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          padding: '12px',
        }}
      >
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {data.title}
        </h3>
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '12px',
            color: '#aaaaaa',
          }}
        >
          {data.channelName}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            color: '#888888',
          }}
        >
          <span>{formatNumber(data.viewCount)} views</span>
          <span>{formatNumber(data.likeCount)} likes</span>
        </div>
      </div>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}
