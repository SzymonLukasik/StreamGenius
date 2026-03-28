import type { WebSearchData } from '@streamgenius/shared'

interface Props {
  data: WebSearchData
}

const FONT = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif'

export function WebSearchOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        right: '40px',
        width: '310px',
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
      {/* Google multicolor top bar */}
      <div
        style={{
          height: '3px',
          background: 'linear-gradient(90deg, #4285F4 0%, #EA4335 33%, #FBBC04 66%, #34A853 100%)',
        }}
      />

      {/* Query header */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>&#x1F50D;</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.55)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.query}
        </span>
      </div>

      {/* Results */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.results.map((result, i) => (
          <a
            key={i}
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '10px 12px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
            }}
          >
            <h4
              style={{
                margin: '0 0 3px 0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#4285F4',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {result.title}
            </h4>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: '10px',
                color: 'rgba(52,168,83,0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {result.link}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {result.snippet}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
