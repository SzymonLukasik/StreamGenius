import type { ClientOverlay, ComparisonData, DeepAnalysisData, WebSearchData, YoutubeData } from '@streamgenius/shared'
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
        backgroundColor: '#04060AFF',
      }}
    >
      <Rescaler
        style={{
          width: SMELTER_OUTPUT_RESOLUTION.width,
          height: SMELTER_OUTPUT_RESOLUTION.height,
        }}
        mode="fill"
      >
        <InputStream inputId={SMELTER_CAMERA_INPUT_ID} />
      </Rescaler>

      <View
        style={{
          top: 80,
          left: 40,
          width: 1080,
          direction: 'column',
        }}
      >
        {activeOverlays.map((overlay) => (
          <View
            key={overlay.id}
            id={`overlay-${overlay.id}`}
            style={{ paddingTop: 16, direction: 'column' }}
          >
            <OverlayCard overlay={overlay} />
          </View>
        ))}
      </View>

      <View
        style={{
          top: 20,
          left: 20,
          width: 200,
          height: 48,
          backgroundColor: '#000000D0',
          borderRadius: 8,
          paddingLeft: 12,
          paddingTop: 8,
          borderWidth: 1,
          borderColor: '#FFFFFF1F',
          direction: 'row',
        }}
      >
        <View
          style={{
            width: 44,
            height: 24,
            backgroundColor: '#DC2626FF',
            borderRadius: 4,
            paddingLeft: 8,
            paddingTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: '#FFFFFFFF',
              fontWeight: 'bold',
              fontFamily: 'Inter',
            }}
          >
            LIVE
          </Text>
        </View>

        <View style={{ width: 10, height: 1 }} />

        <View style={{ width: 130, height: 36, direction: 'column' }}>
          <Text
            style={{
              fontSize: 14,
              color: '#F8FAFCFF',
              fontWeight: 'bold',
              fontFamily: 'Inter',
            }}
          >
            StreamGenius Live
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: '#CBD5E1FF',
              fontWeight: 'medium',
              fontFamily: 'Inter',
            }}
          >
            Composed by Smelter
          </Text>
        </View>
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
    case 'comparison':
      return <ComparisonOverlay data={overlay.data as ComparisonData} />
  }

  return null
}

function YoutubeOverlay({ data }: { data: YoutubeData }) {
  return (
    <CardShell accentColor="#DC2626FF" eyebrow="YouTube">
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
    <CardShell accentColor="#2563EBFF" eyebrow={`Search - ${data.query}`}>
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
    <CardShell accentColor="#7C3AEDFF" eyebrow={`${data.itemA.name} vs ${data.itemB.name}`}>
      <View style={{ direction: 'row', width: 980 }}>
        <View style={{ width: 482, paddingRight: 16, direction: 'column' }}>
          <Text style={styles.colTitle}>{data.itemA.name}</Text>
          {data.itemA.pros.map((pro, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#4ADE80FF' }}>+ {pro}</Text>
          ))}
          {data.itemA.cons.map((con, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#F87171FF' }}>- {con}</Text>
          ))}
        </View>
        <View style={{ width: 482, direction: 'column' }}>
          <Text style={styles.colTitle}>{data.itemB.name}</Text>
          {data.itemB.pros.map((pro, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#4ADE80FF' }}>+ {pro}</Text>
          ))}
          {data.itemB.cons.map((con, i) => (
            <Text key={i} style={{ ...styles.colBody, color: '#F87171FF' }}>- {con}</Text>
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
        width: 1080,
        backgroundColor: '#08111FD0',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFFFFF1A',
        paddingLeft: 22,
        paddingRight: 22,
        paddingTop: 18,
        paddingBottom: 18,
        direction: 'column',
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
          width: 600,
          height: 30,
          backgroundColor: accentColor,
          borderRadius: 15,
          paddingLeft: 10,
          paddingRight: 10,
          paddingTop: 5,
          paddingBottom: 5,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: '#F8FAFCFF',
            fontWeight: 'bold',
            align: 'center',
            width: 580,
          }}
        >
          {eyebrow}
        </Text>
      </View>

      <View style={{ paddingTop: 14, direction: 'column', width: 980 }}>{children}</View>
    </View>
  )
}

const styles = {
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    color: '#F8FAFCFF',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
    width: 980,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 26,
    color: '#D6E0EAFF',
    wrap: 'word' as const,
    width: 980,
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#94A3B8FF',
    wrap: 'word' as const,
    width: 980,
  },
  resultTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 26,
    color: '#E2E8F0FF',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
    width: 980,
  },
  colTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 34,
    color: '#F8FAFCFF',
    fontWeight: 'bold' as const,
    width: 460,
    wrap: 'word' as const,
  },
  colBody: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 26,
    color: '#D6E0EAFF',
    width: 460,
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
      return '#16A34AFF'
    case 'disputed':
      return '#DC2626FF'
    case 'partially_true':
      return '#D97706FF'
    case 'unverified':
      return '#475569FF'
  }
}

function formatVerdict(verdict: DeepAnalysisData['verdict']): string {
  return verdict.replace('_', ' ')
}