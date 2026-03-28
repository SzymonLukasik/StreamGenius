import type { ClientOverlay, ComparisonData, DeepAnalysisData, WebSearchData, YoutubeData } from '@streamgenius/shared'
import { InputStream, Rescaler, Text, View } from '@swmansion/smelter'
import { useOverlayStore } from '../store/overlays'

export const SMELTER_CAMERA_INPUT_ID = 'camera'
export const SMELTER_OUTPUT_RESOLUTION = {
  width: 1280,
  height: 720,
}

const ACTIVE_OVERLAY_STATUSES = new Set(['approved', 'rendering', 'displayed'])

export function SmelterScene() {
  const overlays = useOverlayStore((state) => state.overlays)
  const activeOverlays = overlays.filter((overlay) => ACTIVE_OVERLAY_STATUSES.has(overlay.status))

  return (
    <View
      style={{
        width: SMELTER_OUTPUT_RESOLUTION.width,
        height: SMELTER_OUTPUT_RESOLUTION.height,
        backgroundColor: '#04060A',
      }}
    >
      <Rescaler
        style={{
          width: SMELTER_OUTPUT_RESOLUTION.width,
          height: SMELTER_OUTPUT_RESOLUTION.height,
          rescaleMode: 'fill',
        }}
      >
        <InputStream inputId={SMELTER_CAMERA_INPUT_ID} />
      </Rescaler>

      {activeOverlays.map((overlay) => (
        <OverlayCard key={overlay.id} overlay={overlay} />
      ))}








    </View>
  )
}

function OverlayCard({ overlay }: { overlay: ClientOverlay }) {
  if (!overlay.data) return null

  switch (overlay.type) {
    case 'youtube_card':
      return <YoutubeOverlay id={overlay.id} data={overlay.data as YoutubeData} />
    case 'fact_banner':
      return <FactBannerOverlay id={overlay.id} data={overlay.data as DeepAnalysisData} />
    case 'web_search':
      return <WebSearchOverlay id={overlay.id} data={overlay.data as WebSearchData} />
    case 'comparison':
      return <ComparisonOverlay id={overlay.id} data={overlay.data as ComparisonData} />
  }

  return null
}

function YoutubeOverlay({ id, data }: { id: string; data: YoutubeData }) {
  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: 300,
        bottom: 60,
        right: 40,
        backgroundColor: '#0A0A10E6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF14',
        direction: 'column',
      }}
    >
      <View style={{ height: 3, width: 300, backgroundColor: '#FF0000' }} />

      <View style={{ height: 162, width: 300, backgroundColor: '#1A1A24', direction: 'column' }}>
        <View style={{ paddingLeft: 10, paddingTop: 10, direction: 'row', height: 40 }}>
          <View style={{ backgroundColor: '#000000B8', borderRadius: 4, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, direction: 'row', height: 20 }}>
            <View style={{ paddingTop: 4, direction: 'column' }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF0000' }} /></View>
            <View style={{ width: 5 }} />
            <Text style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 'bold' as const, color: '#E6E6E6' }}>MENTIONED</Text>
          </View>
        </View>
        <View style={{ height: 30 }} />
        <View style={{ width: 300, direction: 'column' }}>
          <Text style={{ fontFamily: 'Inter', fontSize: 13, color: '#FFFFFF4D', align: 'center' }}>Screenshot placeholder</Text>
        </View>
      </View>

      <View style={{ paddingTop: 12, paddingLeft: 14, paddingRight: 14, paddingBottom: 14, direction: 'column' }}>
        <Text style={styles.youtubeTitle}>{data.title}</Text>
        <View style={{ height: 6 }} />
        <Text style={styles.youtubeSubtitle}>{data.channelName}</Text>
        <View style={{ height: 10 }} />
        <View style={{ direction: 'row' }}>
          <StatPill value={formatCompactNumber(data.viewCount)} label="views" />
          <View style={{ width: 14 }} />
          <StatPill value={formatCompactNumber(data.likeCount)} label="likes" />
        </View>
      </View>
    </View>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF0D', borderRadius: 6, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, direction: 'row' }}>
      <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 'bold' as const, color: '#BFFFFF' }}>{value}</Text>
      <View style={{ width: 4 }} />
      <Text style={{ fontFamily: 'Inter', fontSize: 10, color: '#FFFFFF4D' }}>{label}</Text>
    </View>
  )
}

function FactBannerOverlay({ id, data }: { id: string; data: DeepAnalysisData }) {
  const config = verdictConfig[data.verdict]
  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: 1200,
        left: 40,
        bottom: 48,
        backgroundColor: '#0A0A10E0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF14',
        direction: 'row',
      }}
    >
      <View style={{ width: 3, backgroundColor: config.accent }} />

      <View style={{ direction: 'row', paddingTop: 14, paddingBottom: 14, paddingLeft: 18, paddingRight: 22, width: 1197 }}>
        <View style={{ width: 110, direction: 'row' }}>
          <View style={{ backgroundColor: config.badgeBg, borderWidth: 1, borderColor: config.accent + '44', borderRadius: 5, paddingLeft: 9, paddingRight: 9, paddingTop: 4, paddingBottom: 4, direction: 'column', height: 26 }}>
            <Text style={{ fontSize: 10, color: config.badgeText, fontWeight: 'bold' as const, fontFamily: 'Inter' }}>{config.label}</Text>
          </View>
        </View>

        <View style={{ width: 14 }} />

        <View style={{ width: 893, direction: 'column' }}>
          <Text style={styles.claim}>{data.claim}</Text>
          <View style={{ height: 6 }} />
          <Text style={styles.explanation}>{data.explanation}</Text>
        </View>

        <View style={{ width: 14 }} />

        <View style={{ direction: 'column', width: 66, paddingTop: 4 }}>
          <View style={{ backgroundColor: config.accent + '18', borderWidth: 1, borderColor: config.accent + '33', borderRadius: 20, paddingLeft: 10, paddingRight: 10, paddingTop: 3, paddingBottom: 3, direction: 'column' }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold' as const, color: config.accent, fontFamily: 'Inter', align: 'center' }}>{Math.round(data.confidence * 100)}%</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function WebSearchOverlay({ id, data }: { id: string; data: WebSearchData }) {
  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: 310,
        right: 40,
        top: 60,
        backgroundColor: '#0A0A10E6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF14',
        direction: 'column',
      }}
    >
      <View style={{ height: 3, width: 310, backgroundColor: '#4285F4' }} />

      <View style={{ paddingTop: 12, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderWidth: 1, borderColor: '#FFFFFF0F', direction: 'row' }}>
        <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 'medium' as const, color: '#FFFFFF8C' }}>{data.query}</Text>
      </View>

      <View style={{ paddingTop: 10, paddingLeft: 14, paddingRight: 14, paddingBottom: 14, direction: 'column' }}>
        {data.results.slice(0, 3).map((result, i) => (
          <View key={i} style={{ direction: 'column' }}>
            <View style={{ backgroundColor: '#FFFFFF0A', borderWidth: 1, borderColor: '#FFFFFF0F', borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10, direction: 'column' }}>
              <Text style={styles.webSearchTitle}>{result.title}</Text>
              <View style={{ height: 3 }} />
              <Text style={styles.webSearchLink}>{result.link}</Text>
              <View style={{ height: 4 }} />
              <Text style={styles.webSearchSnippet}>{result.snippet}</Text>
            </View>
            {i !== 2 && <View style={{ height: 8 }} />}
          </View>
        ))}
      </View>
    </View>
  )
}

function ComparisonOverlay({ id, data }: { id: string; data: ComparisonData }) {
  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: 600,
        right: 40,
        top: 60,
        backgroundColor: '#0A0A10E6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF14',
        direction: 'column',
      }}
    >
      <View style={{ height: 3, width: 600, backgroundColor: '#A855F7' }} />

      <View style={{ paddingTop: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 12, direction: 'row', width: 600 }}>
        <View style={{ width: 276, direction: 'column', paddingRight: 8 }}>
          <Text style={styles.comparisonTitle}>{data.itemA.name}</Text>
          <View style={{ height: 8 }} />
          {data.itemA.pros.map((p, i) => (
            <Text key={`pro-${i}`} style={{ ...styles.comparisonItem, color: '#4ADE80' }}>+ {p}</Text>
          ))}
          {data.itemA.cons.map((c, i) => (
            <Text key={`con-${i}`} style={{ ...styles.comparisonItem, color: '#F87171' }}>- {c}</Text>
          ))}
        </View>

        <View style={{ width: 16 }} />

        <View style={{ width: 276, direction: 'column', paddingLeft: 8 }}>
          <Text style={styles.comparisonTitle}>{data.itemB.name}</Text>
          <View style={{ height: 8 }} />
          {data.itemB.pros.map((p, i) => (
            <Text key={`pro-${i}`} style={{ ...styles.comparisonItem, color: '#4ADE80' }}>+ {p}</Text>
          ))}
          {data.itemB.cons.map((c, i) => (
            <Text key={`con-${i}`} style={{ ...styles.comparisonItem, color: '#F87171' }}>- {c}</Text>
          ))}
        </View>
      </View>

      <View style={{ paddingTop: 12, paddingLeft: 16, paddingRight: 16, paddingBottom: 16, borderWidth: 1, borderColor: '#FFFFFF0F', direction: 'column' }}>
        <Text style={styles.comparisonItem}>{data.summary}</Text>
      </View>
    </View>
  )
}

const styles = {
  claim: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: '#F0F0F5',
    fontWeight: 'medium' as const,
    wrap: 'word' as const,
  },
  explanation: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF99',
    wrap: 'word' as const,
  },
  youtubeTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#F0F0F5',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  youtubeSubtitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF73',
    wrap: 'word' as const,
  },
  webSearchTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#4285F4',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  webSearchLink: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 14,
    color: '#34A853B3',
    wrap: 'word' as const,
  },
  webSearchSnippet: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF73',
    wrap: 'word' as const,
  },
  comparisonTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: '#F0F0F5',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  comparisonItem: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#D6E0EA',
    wrap: 'word' as const,
  },
}

const verdictConfig: Record<DeepAnalysisData['verdict'], { label: string; accent: string; badgeBg: string; badgeText: string }> = {
  verified: { label: 'VERIFIED', accent: '#34A853', badgeBg: '#34A85326', badgeText: '#34A853' },
  disputed: { label: 'DISPUTED', accent: '#EA4335', badgeBg: '#EA433526', badgeText: '#EA4335' },
  partially_true: { label: 'PARTIALLY TRUE', accent: '#FBBC04', badgeBg: '#FBBC0426', badgeText: '#FBBC04' },
  unverified: { label: 'UNVERIFIED', accent: '#9AA0A6', badgeBg: '#9AA0A626', badgeText: '#9AA0A6' },
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K'
  return value.toString()
}
