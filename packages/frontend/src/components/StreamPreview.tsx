import { useRef, useEffect } from 'react'

interface StreamPreviewProps {
  stream: MediaStream | null
  isLive: boolean
}

export function StreamPreview({ stream, isLive }: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && stream) {
      videoElement.srcObject = stream
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [stream])

  return (
    <div style={styles.container}>
      <div style={styles.videoWrapper}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderText}>Camera not active</span>
          </div>
        )}

        {isLive && (
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            <span>LIVE</span>
          </div>
        )}
      </div>

      <div style={styles.info}>
        <p style={styles.infoText}>
          {stream ? 'Camera active' : 'Start broadcast to enable camera'}
        </p>
        {/* Smelter overlay composition will be integrated here */}
        <p style={styles.note}>Smelter compositor integration pending</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  videoWrapper: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '16 / 9',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: '200px',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    color: '#666',
    fontSize: '14px',
  },
  liveIndicator: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    animation: 'pulse 1.5s infinite',
  },
  info: {
    padding: '8px 0',
  },
  infoText: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  note: {
    fontSize: '11px',
    color: '#555',
    margin: '4px 0 0 0',
    fontStyle: 'italic',
  },
}
