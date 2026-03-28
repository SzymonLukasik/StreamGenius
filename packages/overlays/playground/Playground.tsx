import { useState } from 'react'
import { FactBannerOverlay, YoutubeCardOverlay, ComparisonOverlay, ViewerHighlightOverlay } from '../src'
import type { FactData, YoutubeData, ComparisonData, ViewerData } from '@streamgenius/shared'

const mockFact: FactData = {
  fact: "The first computer bug was an actual real bug - a moth found trapped in a Harvard Mark II computer in 1947.",
  source: "Grace Hopper's logbook",
  sourceUrl: "https://en.wikipedia.org/wiki/Software_bug",
  confidence: 0.98,
}

const mockYoutube: YoutubeData = {
  videoId: "dQw4w9WgXcQ",
  title: "Building a Real-time AI Assistant with Gemini Live API",
  channelName: "StreamGenius Dev",
  viewCount: 1250000,
  likeCount: 45000,
  thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=640&auto=format&fit=crop",
  publishedAt: "2024-03-01T12:00:00Z",
}

const mockComparison: ComparisonData = {
  itemA: {
    name: "React",
    pros: ["Huge ecosystem", "Virtual DOM", "JSX"],
    cons: ["Boilerplate", "Frequent updates"]
  },
  itemB: {
    name: "Vue",
    pros: ["Easy learning curve", "Reactivity system", "Single File Components"],
    cons: ["Smaller job market", "Less corporate backing"]
  },
  summary: "Both are excellent choices. React is better for large teams, Vue for rapid prototyping."
}

const mockViewer: ViewerData = {
  username: "CodeNinja99",
  comment: "This is exactly what I needed for my next stream! The integration looks seamless.",
  timestamp: Date.now(),
  highlightReason: "Most engaging comment",
}

type OverlayType = 'fact' | 'youtube' | 'comparison' | 'viewer'

export function Playground() {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('fact')

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.title}>Overlay Playground</h2>
        <div style={styles.buttonGroup}>
          <button style={activeOverlay === 'fact' ? styles.activeButton : styles.button} onClick={() => setActiveOverlay('fact')}>Fact Banner</button>
          <button style={activeOverlay === 'youtube' ? styles.activeButton : styles.button} onClick={() => setActiveOverlay('youtube')}>YouTube Card</button>
          <button style={activeOverlay === 'comparison' ? styles.activeButton : styles.button} onClick={() => setActiveOverlay('comparison')}>Comparison</button>
          <button style={activeOverlay === 'viewer' ? styles.activeButton : styles.button} onClick={() => setActiveOverlay('viewer')}>Viewer Highlight</button>
        </div>
      </div>
      
      <div style={styles.previewArea}>
        {/* Simulate the stream video background */}
        <div style={styles.videoMock}>
          <span style={styles.videoLabel}>Stream Video Feed</span>
        </div>
        
        {/* Render the active overlay */}
        {activeOverlay === 'fact' && <FactBannerOverlay data={mockFact} />}
        {activeOverlay === 'youtube' && <YoutubeCardOverlay data={mockYoutube} />}
        {activeOverlay === 'comparison' && <ComparisonOverlay data={mockComparison} />}
        {activeOverlay === 'viewer' && <ViewerHighlightOverlay data={mockViewer} />}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#121212',
    color: '#fff',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#1e1e1e',
    padding: '20px',
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '20px',
    fontWeight: 600
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  button: {
    padding: '12px',
    backgroundColor: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  activeButton: {
    padding: '12px',
    backgroundColor: '#3b82f6',
    border: '1px solid #3b82f6',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: 500
  },
  previewArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  videoMock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(45deg, #1a1a2e 25%, #16213e 25%, #16213e 50%, #1a1a2e 50%, #1a1a2e 75%, #16213e 75%, #16213e 100%)',
    backgroundSize: '40px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
    zIndex: 0
  },
  videoLabel: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: '2px',
    textTransform: 'uppercase'
  }
}
