import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useOverlayStore, type TranscriptMessage } from '../store/overlays'

// Assign consistent colors to speakers
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

function ChatBubble({ message, isLeft }: { message: TranscriptMessage; isLeft: boolean }) {
  const color = getSpeakerColor(message.speaker)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        marginBottom: '8px',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: color,
          marginBottom: '2px',
          fontWeight: 600,
        }}
      >
        {message.speaker}
      </span>
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: isLeft ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
          backgroundColor: isLeft ? '#333' : color,
          color: '#fff',
          fontSize: '13px',
          lineHeight: 1.4,
          opacity: message.isFinal ? 1 : 0.7,
        }}
      >
        {message.text}
      </div>
    </div>
  )
}

export function ControlPanel() {
  const transcriptMessages = useOverlayStore((s) => s.transcriptMessages)
  const reasoning = useOverlayStore((s) => s.reasoning)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcriptMessages])

  // Track which speakers we've seen to alternate sides
  const speakerOrder: string[] = []
  transcriptMessages.forEach((msg) => {
    if (!speakerOrder.includes(msg.speaker)) {
      speakerOrder.push(msg.speaker)
    }
  })

  return (
    <div style={styles.container}>
      <div style={styles.transcriptContainer}>
        <h3 style={styles.label}>Live Transcript</h3>
        <div ref={scrollRef} style={styles.chatContainer}>
          {transcriptMessages.length > 0 ? (
            transcriptMessages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isLeft={speakerOrder.indexOf(msg.speaker) % 2 === 0}
              />
            ))
          ) : (
            <span style={styles.placeholder}>Start broadcasting to see live transcription...</span>
          )}
        </div>
      </div>

      <div style={styles.reasoningContainer}>
        <h3 style={styles.label}>AI Reasoning</h3>
        <div style={styles.content}>
          {reasoning ? (
            <ReactMarkdown>{reasoning}</ReactMarkdown>
          ) : (
            <span style={styles.placeholder}>AI thoughts will appear here...</span>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  transcriptContainer: {},
  reasoningContainer: {},
  label: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  chatContainer: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    minHeight: '120px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  content: {
    padding: '15px',
    backgroundColor: '#252525',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: 1.6,
    minHeight: '80px',
    maxHeight: '200px',
    overflowY: 'auto',
    color: '#ddd',
  },
  placeholder: {
    color: '#666',
    fontStyle: 'italic',
  },
}
