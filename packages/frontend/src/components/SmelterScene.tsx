import type { ClientOverlay, DeepAnalysisData, WebSearchData, YoutubeData } from '@streamgenius/shared'
import type { ReactNode } from 'react'
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

      <View
        style={{
          left: 36,
          bottom: 34,
          width: 1208,
          direction: 'column',
        }}
      >
        {activeOverlays.map((overlay) => (
          <View
            key={overlay.id}
            id={`overlay-${overlay.id}`}
            style={{ paddingBottom: 14 }}
            transition={{ durationMs: 240, easingFunction: 'linear' }}
          >
            <OverlayCard overlay={overlay} />
          </View>
        ))}
      </View>

      <View
        style={{
          top: 20,
          right: 20,
          backgroundColor: '#000000B8',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: '#FFFFFF1F',
        }}
      >
        <Text
          style={{
            fontSize: 20,
            color: '#F8FAFC',
            fontWeight: 'bold',
          }}
        >
          StreamGenius Live
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#CBD5E1',
            fontWeight: 'medium',
          }}
        >
          Composed by Smelter
        </Text>
      </View>
    </View>
  )
}

function OverlayCard({ overlay }: { overlay: ClientOverlay }) {
  if (!overlay.data) return null

  switch (overlay.type) {
    case 'youtube_card':
      return <YoutubeOverlay data={overlay.data as YoutubeData} />
    case 'fact_banner':
      return <FactBannerOverlay data={overlay.data as DeepAnalysisData} />
    case 'web_search':
      return <WebSearchOverlay data={overlay.data as WebSearchData} />
  }
}

function YoutubeOverlay({ data }: { data: YoutubeData }) {
  return (
    <CardShell accentColor="#DC2626" eyebrow="YouTube">
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.body}>{formatYoutubeMeta(data)}</Text>
      <Text style={styles.caption}>{formatPublishedDate(data.publishedAt)}</Text>
    </CardShell>
  )
}

function FactBannerOverlay({ data }: { data: DeepAnalysisData }) {
  return (
    <CardShell accentColor={getVerdictColor(data.verdict)} eyebrow={`Fact check - ${formatVerdict(data.verdict)}`}>
      <Text style={styles.title}>{data.claim}</Text>
      <Text style={styles.body}>{data.explanation}</Text>
      <Text style={styles.caption}>Confidence {Math.round(data.confidence * 100)}%</Text>
    </CardShell>
  )
}

function WebSearchOverlay({ data }: { data: WebSearchData }) {
  return (
    <CardShell accentColor="#2563EB" eyebrow={`Search - ${data.query}`}>
      {data.results.slice(0, 3).map((result, index) => (
        <View key={`${result.link}-${index}`} style={{ paddingBottom: index === 2 ? 0 : 10 }}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.body}>{result.snippet}</Text>
        </View>
      ))}
    </CardShell>
  )
}

function CardShell({
  accentColor,
  eyebrow,
  children,
}: {
  accentColor: string
  eyebrow: string
  children: ReactNode
}) {
  return (
    <View
      style={{
        width: 1080,
        backgroundColor: '#08111FEE',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFFFFF1A',
        paddingHorizontal: 22,
        paddingVertical: 18,
        boxShadow: [
          {
            offsetY: 18,
            blurRadius: 36,
            color: '#02061788',
          },
        ],
      }}
    >
      <View
        style={{
          width: 320,
          backgroundColor: accentColor,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: '#F8FAFC',
            fontWeight: 'bold',
            align: 'center',
          }}
        >
          {eyebrow}
        </Text>
      </View>

      <View style={{ paddingTop: 14 }}>{children}</View>
    </View>
  )
}

const styles = {
  title: {
    fontSize: 28,
    color: '#F8FAFC',
    fontWeight: 'bold' as const,
    maxWidth: 980,
    wrap: 'word' as const,
  },
  body: {
    fontSize: 18,
    color: '#D6E0EA',
    maxWidth: 980,
    wrap: 'word' as const,
  },
  caption: {
    fontSize: 14,
    color: '#94A3B8',
    maxWidth: 980,
    wrap: 'word' as const,
  },
  resultTitle: {
    fontSize: 20,
    color: '#E2E8F0',
    fontWeight: 'bold' as const,
    maxWidth: 980,
    wrap: 'word' as const,
  },
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatYoutubeMeta(data: YoutubeData): string {
  return [
    data.channelName,
    `${formatCompactNumber(data.viewCount)} views`,
    `${formatCompactNumber(data.likeCount)} likes`,
  ].join(' - ')
}

function formatPublishedDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getVerdictColor(verdict: DeepAnalysisData['verdict']): string {
  switch (verdict) {
    case 'verified':
      return '#16A34A'
    case 'disputed':
      return '#DC2626'
    case 'partially_true':
      return '#D97706'
    case 'unverified':
      return '#475569'
  }
}

function formatVerdict(verdict: DeepAnalysisData['verdict']): string {
  return verdict.replace('_', ' ')
}
