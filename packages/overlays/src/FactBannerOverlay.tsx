import type { DeepAnalysisData } from '@streamgenius/shared'

interface Props {
  data: DeepAnalysisData
}

const verdictColors: Record<DeepAnalysisData['verdict'], { bg: string; badge: string }> = {
  verified: { bg: 'rgba(34, 197, 94, 0.95)', badge: '#166534' },
  disputed: { bg: 'rgba(239, 68, 68, 0.95)', badge: '#991b1b' },
  partially_true: { bg: 'rgba(234, 179, 8, 0.95)', badge: '#854d0e' },
  unverified: { bg: 'rgba(107, 114, 128, 0.95)', badge: '#374151' },
}

const verdictLabels: Record<DeepAnalysisData['verdict'], string> = {
  verified: 'Verified',
  disputed: 'Disputed',
  partially_true: 'Partially True',
  unverified: 'Unverified',
}

export function FactBannerOverlay({ data }: Props) {
  const colors = verdictColors[data.verdict]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: '40px',
        right: '40px',
        backgroundColor: colors.bg,
        borderRadius: '12px',
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
            backgroundColor: colors.badge,
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            flexShrink: 0,
          }}
        >
          {verdictLabels[data.verdict]}
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
            {data.claim}
          </p>
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.4,
            }}
          >
            {data.explanation}
          </p>
          {data.sources.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {data.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'underline',
                  }}
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
