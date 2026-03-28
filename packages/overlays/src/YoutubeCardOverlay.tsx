import type { YoutubeData } from '@streamgenius/shared'

interface Props {
  data: YoutubeData
}

const FONT = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif'

export function YoutubeCardOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        right: '40px',
        width: '300px',
        backgroundColor: 'rgba(10, 10, 16, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* YouTube red top border */}
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #FF0000 0%, #cc0000 100%)',
        }}
      />

      {/* Thumbnail */}
      <div style={{ position: 'relative' }}>
        <img
          src={data.thumbnailUrl}
          alt={data.title}
          style={{
            width: '100%',
            height: '162px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* "Mentioned in stream" label */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            borderRadius: '4px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#FF0000',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Mentioned
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#f0f0f5',
            lineHeight: 1.35,
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
            margin: '0 0 10px 0',
            fontSize: '11px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {data.channelName}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '14px',
          }}
        >
          <StatPill icon="▶" value={formatNumber(data.viewCount)} label="views" />
          <StatPill icon="♥" value={formatNumber(data.likeCount)} label="likes" />
        </div>
      </div>
    </div>
  )
}

function StatPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '6px',
        padding: '4px 8px',
      }}
    >
      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>{icon}</span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
        {value}
      </span>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}
