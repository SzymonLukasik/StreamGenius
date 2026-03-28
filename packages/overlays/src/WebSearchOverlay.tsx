import type { WebSearchData } from '@streamgenius/shared'

interface Props {
  data: WebSearchData
}

export function WebSearchOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '40px',
        width: '320px',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ fontSize: '14px' }}>&#x1F50D;</span>
        <span
          style={{
            fontSize: '13px',
            color: '#9ca3af',
            fontWeight: 500,
          }}
        >
          {data.query}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.results.map((result, i) => (
          <a
            key={i}
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            <h4
              style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#60a5fa',
                lineHeight: 1.3,
              }}
            >
              {result.title}
            </h4>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: '11px',
                color: '#6b7280',
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
                fontSize: '12px',
                color: '#9ca3af',
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
