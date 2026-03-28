import type { FactData } from '@streamgenius/shared'

interface Props {
  data: FactData
}

export function FactBannerOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '40px',
        right: '40px',
        backgroundColor: 'rgba(30, 64, 175, 0.95)',
        borderRadius: '8px',
        padding: '16px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          i
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: 500,
              color: '#ffffff',
              lineHeight: 1.4,
            }}
          >
            {data.fact}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Source: {data.source}
          </p>
        </div>
      </div>
    </div>
  )
}
