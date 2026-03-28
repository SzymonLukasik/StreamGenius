import { useEffect, useRef } from 'react'
import { useOverlayStore, type TranscriptMessage } from '../store/overlays'

const speakerColors: Record<string, string> = {}
const colorPalette = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']
let colorIndex = 0

function getSpeakerColor(speaker: string): string {
  if (!speakerColors[speaker]) {
    speakerColors[speaker] = colorPalette[colorIndex % colorPalette.length]
    colorIndex++
  }
  return speakerColors[speaker]
}

export function TranscriptPanel() {
  const transcriptMessages = useOverlayStore((s) => s.transcriptMessages)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcriptMessages])

  const speakerOrder: string[] = []
  transcriptMessages.forEach((msg) => {
    if (!speakerOrder.includes(msg.speaker)) {
      speakerOrder.push(msg.speaker)
    }
  })

  return (
    <div style={styles.container}>
      <div ref={scrollRef} style={styles.scrollArea}>
        {transcriptMessages.length > 0 ? (
          transcriptMessages.map((msg) => (
            <TranscriptBubble
              key={msg.id}
              message={msg}
              isLeft={speakerOrder.indexOf(msg.speaker) % 2 === 0}
            />
          ))
        ) : (
          <div style={styles.empty}>
            <span style={styles.emptyText}>Waiting for audio...</span>
            <span style={styles.emptyHint}>Live transcription will appear here</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TranscriptBubble({
  message,
  isLeft,
}: {
  message: TranscriptMessage
  isLeft: boolean
}) {
  const color = getSpeakerColor(message.speaker)

  return (
    <div
      style={{
        ...styles.bubble,
        alignItems: isLeft ? 'flex-start' : 'flex-end',
      }}
    >
      <span style={{ ...styles.speaker, color }}>{message.speaker}</span>
      <div
        style={{
          ...styles.message,
          backgroundColor: isLeft ? '#1f1f23' : color,
          borderRadius: isLeft ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
          opacity: message.isFinal ? 1 : 0.7,
        }}
      >
        {message.text}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '4px',
    minHeight: '120px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#555',
  },
  emptyHint: {
    fontSize: '11px',
    color: '#444',
  },
  bubble: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  speaker: {
    fontSize: '10px',
    fontWeight: 600,
    marginBottom: '3px',
  },
  message: {
    maxWidth: '85%',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '13px',
    lineHeight: 1.4,
  },
}
