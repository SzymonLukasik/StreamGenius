import { useState } from 'react'
import { FactBannerOverlay, YoutubeCardOverlay, WebSearchOverlay } from '../src'
import type { DeepAnalysisData, YoutubeData, WebSearchData } from '@streamgenius/shared'

const mockFact: DeepAnalysisData = {
  claim: "The first computer bug was an actual real bug - a moth found trapped in a Harvard Mark II computer in 1947.",
  verdict: 'verified',
  explanation: "Grace Hopper's team documented a real moth causing a relay failure. The logbook entry is preserved at the Smithsonian.",
  sources: [
    { title: "Smithsonian Institution", url: "https://americanhistory.si.edu", relevance: "primary" },
    { title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Software_bug", relevance: "secondary" },
  ],
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

const mockWebSearch: WebSearchData = {
  query: "React vs Vue 2024 performance benchmarks",
  results: [
    {
      title: "React vs Vue: Performance Comparison 2024",
      link: "https://dev.to/react-vs-vue-2024",
      snippet: "In-depth benchmarks comparing React 18 and Vue 3 across real-world scenarios including SSR, hydration, and runtime updates.",
    },
    {
      title: "Which framework is faster? Vue 3 vs React",
      link: "https://vueschool.io/articles/vuejs-tutorials/vue-vs-react",
      snippet: "Vue 3's reactivity system offers significant improvements. Here's how it stacks up against React in 2024.",
    },
    {
      title: "State of JS 2023 - Frontend Frameworks",
      link: "https://2023.stateofjs.com/en-US/libraries/front-end-frameworks",
      snippet: "Annual survey results showing developer satisfaction, usage, and trends across all major JavaScript frameworks.",
    },
  ],
}

const OVERLAYS = [
  { id: 'fact',      label: 'Fact Banner',   icon: 'ℹ', accent: '#34A853' },
  { id: 'youtube',   label: 'YouTube Card',  icon: '▶', accent: '#FF0000' },
  { id: 'websearch', label: 'Web Search',    icon: '⌕', accent: '#4285F4' },
] as const

type OverlayType = typeof OVERLAYS[number]['id']

const FONT = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif'

export function Playground() {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('fact')
  const active = OVERLAYS.find(o => o.id === activeOverlay)!

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: FONT,
        backgroundColor: '#08080f',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          backgroundColor: '#0d0d18',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '22px 20px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4285F4 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              ◈
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.2px' }}>
                StreamGenius
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3px' }}>
                Overlay Playground
              </div>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div
          style={{
            padding: '16px 20px 8px',
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          Overlays
        </div>

        {/* Nav items */}
        <nav style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {OVERLAYS.map(overlay => {
            const isActive = activeOverlay === overlay.id
            return (
              <button
                key={overlay.id}
                onClick={() => setActiveOverlay(overlay.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#f0f0f5' : 'rgba(255,255,255,0.45)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: isActive ? overlay.accent + '22' : 'rgba(255,255,255,0.05)',
                    border: isActive ? `1px solid ${overlay.accent}44` : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: isActive ? overlay.accent : 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }}
                >
                  {overlay.icon}
                </span>
                {overlay.label}
                {isActive && (
                  <div
                    style={{
                      marginLeft: 'auto',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: overlay.accent,
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
            lineHeight: 1.6,
          }}
        >
          Preview mode · 16:9
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header
          style={{
            height: '48px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: active.accent,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
            {active.label}
          </span>
        </header>

        {/* Preview canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            backgroundColor: '#08080f',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '960px',
              aspectRatio: '16 / 9',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Video background */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #0f1923 0%, #111827 40%, #0a1628 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.08)',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  fontFamily: FONT,
                }}
              >
                Stream Video Feed
              </span>
            </div>

            {/* Active overlay */}
            {activeOverlay === 'fact'      && <FactBannerOverlay data={mockFact} />}
            {activeOverlay === 'youtube'   && <YoutubeCardOverlay data={mockYoutube} />}
            {activeOverlay === 'websearch' && <WebSearchOverlay data={mockWebSearch} />}
          </div>
        </div>
      </main>
    </div>
  )
}
