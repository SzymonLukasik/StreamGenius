import type { ComparisonData } from '@streamgenius/shared'

interface Props {
  data: ComparisonData
}

const FONT = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif'
const COLOR_A = '#34A853'  // Google green
const COLOR_B = '#4285F4'  // Google blue

export function ComparisonOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '580px',
        backgroundColor: 'rgba(10, 10, 16, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255,255,255,0.05) inset',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Comparison
        </span>
      </div>

      {/* Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          padding: '20px 0',
        }}
      >
        <ComparisonColumn item={data.itemA} color={COLOR_A} align="right" />

        {/* VS divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.5px',
            }}
          >
            VS
          </div>
        </div>

        <ComparisonColumn item={data.itemB} color={COLOR_B} align="left" />
      </div>

      {/* Summary */}
      {data.summary && (
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {data.summary}
          </p>
        </div>
      )}
    </div>
  )
}

interface ColumnProps {
  item: ComparisonData['itemA']
  color: string
  align: 'left' | 'right'
}

function ComparisonColumn({ item, color, align }: ColumnProps) {
  const isRight = align === 'right'

  return (
    <div style={{ padding: isRight ? '0 0 0 24px' : '0 24px 0 0', textAlign: align }}>
      <h3
        style={{
          margin: '0 0 14px 0',
          fontSize: '17px',
          fontWeight: 700,
          color,
          letterSpacing: '-0.2px',
        }}
      >
        {item.name}
      </h3>

      {item.pros.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#34A853',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Pros
          </div>
          {item.pros.map((pro, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                flexDirection: isRight ? 'row-reverse' : 'row',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#34A853', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                {pro}
              </span>
            </div>
          ))}
        </div>
      )}

      {item.cons.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              color: '#EA4335',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Cons
          </div>
          {item.cons.map((con, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                flexDirection: isRight ? 'row-reverse' : 'row',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '10px', color: '#EA4335', flexShrink: 0 }}>✗</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                {con}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
