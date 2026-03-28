import type { ClientOverlay, ComparisonData, DeepAnalysisData, WebSearchData, YoutubeData } from '@streamgenius/shared'
import type { ReactNode } from 'react'
import { Image, InputStream, Rescaler, Text, View } from '@swmansion/smelter'
import { useOverlayStore } from '../store/overlays'

export const SMELTER_CAMERA_INPUT_ID = 'camera'
export const SMELTER_OUTPUT_RESOLUTION = {
  width: 960,
  height: 540,
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
        }}
      >
        <InputStream inputId={SMELTER_CAMERA_INPUT_ID} />
      </Rescaler>

      {activeOverlays.length > 0 && (
        <View
          style={{
            left: 24,
            top: SMELTER_OUTPUT_RESOLUTION.height - 160,
            width: 900,
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
      )}

      
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
    case 'comparison':
      return <ComparisonOverlay data={overlay.data as ComparisonData} />
  }

  return null
}

function YoutubeOverlay({ data }: { data: YoutubeData }) {
  const thumbnailSource = data.thumbnailPngUrl || data.thumbnailUrl

  return (
    <CardShell accentColor="#DC2626" eyebrow="YouTube">
      <View style={{ direction: 'row' }}>
        {thumbnailSource && (
          <Image
            source={thumbnailSource}
            style={{
              width: 135,
              height: 76,
            }}
          />
        )}
        <View style={{ paddingLeft: 12, direction: 'column', width: 580 }}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.body}>{formatYoutubeMeta(data)}</Text>
          <Text style={styles.caption}>{formatPublishedDate(data.publishedAt)}</Text>
        </View>
      </View>
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
      {data.results.slice(0, 2).map((result, index) => (
        <View key={`${result.link}-${index}`} style={{ paddingBottom: index === 1 ? 0 : 12, direction: 'column' }}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.body}>{result.snippet.length > 100 ? result.snippet.slice(0, 100) + '…' : result.snippet}</Text>
        </View>
      ))}
    </CardShell>
  )
}

function ComparisonOverlay({ data }: { data: ComparisonData }) {
  return (
    <CardShell accentColor="#7C3AED" eyebrow={`${data.itemA.name} vs ${data.itemB.name}`}>
      <View style={{ direction: 'row', width: 720 }}>
        <View style={{ width: 350, paddingRight: 12, direction: 'column' }}>
          <Text style={styles.colTitle}>{data.itemA.name}</Text>
          {data.itemA.pros.map((pro, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#4ADE80' }}>+ {pro}</Text>
          ))}
          {data.itemA.cons.map((con, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#F87171' }}>- {con}</Text>
          ))}
        </View>
        <View style={{ width: 350, direction: 'column' }}>
          <Text style={styles.colTitle}>{data.itemB.name}</Text>
          {data.itemB.pros.map((pro, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#4ADE80' }}>+ {pro}</Text>
          ))}
          {data.itemB.cons.map((con, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#F87171' }}>- {con}</Text>
          ))}
        </View>
      </View>
      <Text style={styles.caption}>{data.summary}</Text>
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
        width: 800,
        backgroundColor: '#08111FD0',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FFFFFF1A',
        paddingHorizontal: 16,
        paddingVertical: 12,
        direction: 'column',
        boxShadow: [
          {
            offsetY: 12,
            blurRadius: 24,
            color: '#02061788',
          },
        ],
      }}
    >
      <View
        style={{
          width: 450,
          height: 22,
          backgroundColor: accentColor,
          borderRadius: 11,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: '#F8FAFC',
            fontWeight: 'bold',
            align: 'center',
          }}
        >
          {eyebrow}
        </Text>
      </View>

      <View style={{ paddingTop: 10, direction: 'column' }}>{children}</View>
    </View>
  )
}

const styles = {
  title: {
    fontSize: 20,
    color: '#F8FAFC',
    fontWeight: 'bold' as const,
    maxWidth: 720,
    wrap: 'word' as const,
  },
  body: {
    fontSize: 14,
    color: '#D6E0EA',
    maxWidth: 720,
    wrap: 'word' as const,
  },
  caption: {
    fontSize: 11,
    color: '#94A3B8',
    maxWidth: 720,
    wrap: 'word' as const,
  },
  resultTitle: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: 'bold' as const,
    maxWidth: 720,
    wrap: 'word' as const,
  },
  colTitle: {
    fontSize: 20,
    color: '#F8FAFC',
    fontWeight: 'bold' as const,
    maxWidth: 340,
    wrap: 'word' as const,
  },
  colBody: {
    fontSize: 14,
    color: '#D6E0EA',
    maxWidth: 340,
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
