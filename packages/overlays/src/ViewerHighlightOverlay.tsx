import type { ViewerData } from '@streamgenius/shared'

interface Props {
  data: ViewerData
}

export function ViewerHighlightOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '40px',
        maxWidth: '400px',
        backgroundColor: 'rgba(139, 92, 246, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          {data.username.charAt(0).toUpperCase()}
        </div>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
          }}
        >
          {data.username}
        </span>
      </div>

      <p
        style={{
          margin: '0 0 8px 0',
          fontSize: '15px',
          color: '#ffffff',
          lineHeight: 1.4,
        }}
      >
        &ldquo;{data.comment}&rdquo;
      </p>

      <p
        style={{
          margin: 0,
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {data.highlightReason}
      </p>
    </div>
  )
}
