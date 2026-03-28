import type { ComparisonData } from '@streamgenius/shared'

interface Props {
  data: ComparisonData
}

export function ComparisonOverlay({ data }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        <ComparisonColumn item={data.itemA} color="#22c55e" />
        <ComparisonColumn item={data.itemB} color="#3b82f6" />
      </div>
      {data.summary && (
        <p
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '13px',
            color: '#aaaaaa',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {data.summary}
        </p>
      )}
    </div>
  )
}

interface ColumnProps {
  item: ComparisonData['itemA']
  color: string
}

function ComparisonColumn({ item, color }: ColumnProps) {
  return (
    <div>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: color,
        }}
      >
        {item.name}
      </h3>

      {item.pros.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h4
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              color: '#22c55e',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Pros
          </h4>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 16px',
              fontSize: '12px',
              color: '#cccccc',
              lineHeight: 1.6,
            }}
          >
            {item.pros.map((pro, i) => (
              <li key={i}>{pro}</li>
            ))}
          </ul>
        </div>
      )}

      {item.cons.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Cons
          </h4>
          <ul
            style={{
              margin: 0,
              padding: '0 0 0 16px',
              fontSize: '12px',
              color: '#cccccc',
              lineHeight: 1.6,
            }}
          >
            {item.cons.map((con, i) => (
              <li key={i}>{con}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
