import type { DeepAnalysisData } from '@streamgenius/shared'

interface Props {
  data: DeepAnalysisData
}

const FONT = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif'

const verdictConfig: Record<
  DeepAnalysisData['verdict'],
  { label: string; accent: string; badgeBg: string; badgeText: string }
> = {
  verified:       { label: 'Verified',       accent: '#34A853', badgeBg: 'rgba(52,168,83,0.15)',   badgeText: '#34A853' },
  disputed:       { label: 'Disputed',       accent: '#EA4335', badgeBg: 'rgba(234,67,53,0.15)',   badgeText: '#EA4335' },
  partially_true: { label: 'Partially True', accent: '#FBBC04', badgeBg: 'rgba(251,188,4,0.15)',   badgeText: '#FBBC04' },
  unverified:     { label: 'Unverified',     accent: '#9aa0a6', badgeBg: 'rgba(154,160,166,0.15)', badgeText: '#9aa0a6' },
}

export function FactBannerOverlay({ data }: Props) {
  const config = verdictConfig[data.verdict]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '48px',
        left: '40px',
        right: '40px',
        backgroundColor: 'rgba(10, 10, 16, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* Verdict-colored accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: config.accent,
        }}
      />

      <div
        style={{
          padding: '14px 18px 14px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        {/* Verdict badge */}
        <div
          style={{
            flexShrink: 0,
            marginTop: '2px',
            backgroundColor: config.badgeBg,
            border: `1px solid ${config.accent}44`,
            borderRadius: '5px',
            padding: '4px 9px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: config.badgeText,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            {config.label}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Claim */}
          <p
            style={{
              margin: '0 0 6px 0',
              fontSize: '15px',
              fontWeight: 500,
              color: '#f0f0f5',
              lineHeight: 1.45,
            }}
          >
            {data.claim}
          </p>

          {/* Explanation */}
          <p
            style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.45,
            }}
          >
            {data.explanation}
          </p>

          {/* Sources */}
          {data.sources.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '11px',
                    color: 'rgba(66, 133, 244, 0.8)',
                    textDecoration: 'none',
                    backgroundColor: 'rgba(66,133,244,0.08)',
                    border: '1px solid rgba(66,133,244,0.2)',
                    borderRadius: '4px',
                    padding: '2px 7px',
                  }}
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Confidence badge */}
        <div
          style={{
            flexShrink: 0,
            alignSelf: 'center',
            backgroundColor: `${config.accent}18`,
            border: `1px solid ${config.accent}33`,
            borderRadius: '20px',
            padding: '3px 10px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: config.accent }}>
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
