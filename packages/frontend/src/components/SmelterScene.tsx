import type { ClientOverlay, ComparisonData, DeepAnalysisData, WebSearchData, YoutubeData } from '@streamgenius/shared'
import { InputStream, Rescaler, Text, View } from '@swmansion/smelter'
import { useOverlayStore } from '../store/overlays'

export const SMELTER_CAMERA_INPUT_ID = 'camera'
export const SMELTER_OUTPUT_RESOLUTION = {
  width: 1280,
  height: 720,
}

const { width: OUT_W, height: OUT_H } = SMELTER_OUTPUT_RESOLUTION

const ACTIVE_OVERLAY_STATUSES = new Set(['approved', 'rendering', 'displayed'])

/** Smelter: absolutely positioned Views need explicit width *and* height or they inherit the full parent box. */
const YT_W = 252
const YT_THUMB_W = 108
const YT_THUMB_H = 64
/** Bar + thumb row + divider + stats row (explicit heights for Smelter layout). */
const YT_BODY_H = 8 + YT_THUMB_H + 8
const YT_FOOTER_H = 36
const YT_H = 2 + YT_BODY_H + 1 + YT_FOOTER_H

const FACT_W = 1040
const FACT_H = 80

const SEARCH_W = 268
const SEARCH_H = 200

const COMP_W = 456
const COMP_H = 196

const STACK_SHIFT = 10

export function SmelterScene() {
  const overlays = useOverlayStore((state) => state.overlays)
  const activeOverlays = overlays.filter((overlay) => ACTIVE_OVERLAY_STATUSES.has(overlay.status))

  return (
    <View
      style={{
        width: OUT_W,
        height: OUT_H,
        backgroundColor: '#04060A',
      }}
    >
      <Rescaler
        style={{
          width: OUT_W,
          height: OUT_H,
          rescaleMode: 'fill',
        }}
      >
        <InputStream inputId={SMELTER_CAMERA_INPUT_ID} />
      </Rescaler>

      {activeOverlays.map((overlay, index) => (
        <OverlayCard key={overlay.id} overlay={overlay} stackIndex={index} />
      ))}
    </View>
  )
}

function OverlayCard({ overlay, stackIndex }: { overlay: ClientOverlay; stackIndex: number }) {
  if (!overlay.data) return null

  const shift = stackIndex * STACK_SHIFT

  switch (overlay.type) {
    case 'youtube_card':
      return <YoutubeOverlay id={overlay.id} data={overlay.data as YoutubeData} stackShift={shift} />
    case 'fact_banner':
      return <FactBannerOverlay id={overlay.id} data={overlay.data as DeepAnalysisData} stackShift={shift} />
    case 'web_search':
      return <WebSearchOverlay id={overlay.id} data={overlay.data as WebSearchData} stackShift={shift} />
    case 'comparison':
      return <ComparisonOverlay id={overlay.id} data={overlay.data as ComparisonData} stackShift={shift} />
    default:
      return null
  }
}

function YoutubeOverlay({ id, data, stackShift }: { id: string; data: YoutubeData; stackShift: number }) {
  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: YT_W,
        height: YT_H,
        right: 24,
        bottom: 20 + stackShift,
        backgroundColor: '#0C0C12F0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF18',
        direction: 'column',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: YT_W, height: 2, backgroundColor: '#E50914' }} />

      <View style={{ width: YT_W, height: YT_BODY_H, direction: 'row', paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ width: YT_THUMB_W, height: YT_THUMB_H, borderRadius: 6, overflow: 'hidden' }}>
          {data.thumbnailUrl ? (
            <View style={{ width: YT_THUMB_W, height: YT_THUMB_H, backgroundColor: '#252530' }}><Text style={{ color: 'white', fontSize: 10, fontFamily: 'Inter' }}>THUMB</Text></View>
          ) : (
            <View style={{ width: YT_THUMB_W, height: YT_THUMB_H, backgroundColor: '#252530' }} />
          )}
        </View>

        <View style={{ width: 8 }} />

        <View style={{ width: YT_W - 16 - YT_THUMB_W - 8, height: YT_THUMB_H, direction: 'column' }}>
          <View
            style={{
              backgroundColor: '#00000080',
              borderRadius: 4,
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 2,
              paddingBottom: 2,
              direction: 'row',
              height: 16,
            }}
          >
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#E50914' }} />
            <View style={{ width: 4 }} />
            <Text style={styles.ytBadge}>YT</Text>
          </View>
          <View style={{ height: 2 }} />
          <Text style={{ ...styles.ytTitle, width: YT_W - 16 - YT_THUMB_W - 8, height: 28 }}>{truncate(data.title, 64)}</Text>
          <View style={{ height: 2 }} />
          <Text style={{ ...styles.ytChannel, width: YT_W - 16 - YT_THUMB_W - 8, height: 13 }}>{truncate(data.channelName, 32)}</Text>
        </View>
      </View>

      <View style={{ width: YT_W, height: 1, backgroundColor: '#FFFFFF10' }} />

      <View style={{ width: YT_W, height: YT_FOOTER_H, direction: 'row', paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}>
        <StatPill value={formatCompactNumber(data.viewCount)} label="views" />
        <View style={{ width: 8 }} />
        <StatPill value={formatCompactNumber(data.likeCount)} label="likes" />
      </View>
    </View>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF0D',
        borderRadius: 5,
        paddingLeft: 7,
        paddingRight: 7,
        paddingTop: 3,
        paddingBottom: 3,
        direction: 'row',
        height: 22,
      }}
    >
      <Text style={styles.pillValue}>{value}</Text>
      <View style={{ width: 3 }} />
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  )
}

function FactBannerOverlay({ id, data, stackShift }: { id: string; data: DeepAnalysisData; stackShift: number }) {
  const config = verdictConfig[data.verdict]
  const innerW = FACT_W - 3

  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: FACT_W,
        height: FACT_H,
        left: Math.round((OUT_W - FACT_W) / 2),
        bottom: 16 + stackShift,
        direction: 'row',
        backgroundColor: '#0A0A12F0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFFFFF14',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 3, height: FACT_H, backgroundColor: config.accent }} />

      <View style={{ width: innerW, height: FACT_H, direction: 'row', paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ width: 86, height: 64, direction: 'column' }}>
          <View
            style={{
              backgroundColor: config.badgeBg,
              borderWidth: 1,
              borderColor: `${config.accent}44`,
              borderRadius: 4,
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 3,
              paddingBottom: 3,
              height: 22,
            }}
          >
            <Text style={{ ...styles.factBadge, color: config.badgeText, width: 74, height: 16, align: 'center' }}>{config.label}</Text>
          </View>
        </View>

        <View style={{ width: 10 }} />

        <View style={{ width: innerW - 86 - 10 - 10 - 48, height: 64, direction: 'column' }}>
          <Text style={{ ...styles.factClaim, width: innerW - 86 - 10 - 10 - 48, height: 18 }}>{truncate(data.claim, 96)}</Text>
          <View style={{ height: 4 }} />
          <Text style={{ ...styles.factExplain, width: innerW - 86 - 10 - 10 - 48, height: 32 }}>{truncate(data.explanation, 140)}</Text>
        </View>

        <View style={{ width: 10 }} />

        <View style={{ width: 48, height: 64, direction: 'column', top: 2 }}>
          <View
            style={{
              backgroundColor: `${config.accent}22`,
              borderWidth: 1,
              borderColor: `${config.accent}55`,
              borderRadius: 16,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              height: 26,
            }}
          >
            <Text style={{ ...styles.factPct, color: config.accent, width: 32, height: 18, align: 'center' as const }}>
              {Math.round(data.confidence * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function WebSearchOverlay({ id, data, stackShift }: { id: string; data: WebSearchData; stackShift: number }) {
  const results = data.results.slice(0, 2)
  const innerPad = 10

  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: SEARCH_W,
        height: SEARCH_H,
        right: 24,
        top: 48 + stackShift,
        backgroundColor: '#0C0C12F0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF18',
        direction: 'column',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: SEARCH_W, height: 2, backgroundColor: '#4285F4' }} />

      <View
        style={{
          width: SEARCH_W,
          height: 32,
          paddingLeft: innerPad,
          paddingRight: innerPad,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Text style={{ ...styles.searchQuery, width: SEARCH_W - innerPad * 2, height: 18 }}>{truncate(data.query, 52)}</Text>
      </View>

      <View style={{ width: SEARCH_W, height: 1, backgroundColor: '#FFFFFF12' }} />

      <View style={{ width: SEARCH_W, height: SEARCH_H - 2 - 32 - 1, paddingLeft: innerPad, paddingRight: innerPad, paddingTop: 8, paddingBottom: 8, direction: 'column' }}>
        {results.map((result, i) => (
          <View key={i} style={{ width: SEARCH_W - innerPad * 2, height: i === 0 ? 72 : 68, direction: 'column' }}>
            <View
              style={{
                width: SEARCH_W - innerPad * 2,
                height: i === 0 ? 72 : 68,
                backgroundColor: '#FFFFFF08',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#FFFFFF10',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 6,
                paddingBottom: 6,
                direction: 'column',
              }}
            >
              <Text style={{ ...styles.searchTitle, width: SEARCH_W - innerPad * 2 - 16, height: 34 }}>{truncate(result.title, 64)}</Text>
              <Text style={{ ...styles.searchLink, width: SEARCH_W - innerPad * 2 - 16, height: 12 }}>{truncate(result.link, 40)}</Text>
              <View style={{ height: 2 }} />
              <Text style={{ ...styles.searchSnippet, width: SEARCH_W - innerPad * 2 - 16, height: 28 }}>{truncate(result.snippet, 90)}</Text>
            </View>
            {i === 0 && results.length > 1 ? <View style={{ height: 6 }} /> : null}
          </View>
        ))}
      </View>
    </View>
  )
}

function ComparisonOverlay({ id, data, stackShift }: { id: string; data: ComparisonData; stackShift: number }) {
  const colW = Math.floor((COMP_W - 24 - 12) / 2)
  const aPros = data.itemA.pros.slice(0, 2)
  const aCons = data.itemA.cons.slice(0, 2)
  const bPros = data.itemB.pros.slice(0, 2)
  const bCons = data.itemB.cons.slice(0, 2)

  return (
    <View
      id={`overlay-${id}`}
      style={{
        width: COMP_W,
        height: COMP_H,
        left: 24,
        top: 48 + stackShift,
        backgroundColor: '#0C0C12F0',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFFFFF18',
        direction: 'column',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: COMP_W, height: 2, backgroundColor: '#A855F7' }} />

      <View style={{ width: COMP_W, height: 118, direction: 'row', paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 6 }}>
        <View style={{ width: colW, height: 104, direction: 'column' }}>
          <Text style={{ ...styles.compName, width: colW, height: 18 }}>{truncate(data.itemA.name, 28)}</Text>
          <View style={{ height: 4 }} />
          {aPros.map((p, i) => (
            <Text key={`a-pro-${i}`} style={{ ...styles.compLine, color: '#4ADE80', width: colW, height: 16 }}>
              + {truncate(p, 42)}
            </Text>
          ))}
          {aCons.map((c, i) => (
            <Text key={`a-con-${i}`} style={{ ...styles.compLine, color: '#F87171', width: colW, height: 16 }}>
              − {truncate(c, 42)}
            </Text>
          ))}
        </View>

        <View style={{ width: 12 }} />

        <View style={{ width: colW, height: 104, direction: 'column' }}>
          <Text style={{ ...styles.compName, width: colW, height: 18 }}>{truncate(data.itemB.name, 28)}</Text>
          <View style={{ height: 4 }} />
          {bPros.map((p, i) => (
            <Text key={`b-pro-${i}`} style={{ ...styles.compLine, color: '#4ADE80', width: colW, height: 16 }}>
              + {truncate(p, 42)}
            </Text>
          ))}
          {bCons.map((c, i) => (
            <Text key={`b-con-${i}`} style={{ ...styles.compLine, color: '#F87171', width: colW, height: 16 }}>
              − {truncate(c, 42)}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ width: COMP_W, height: 1, backgroundColor: '#FFFFFF10' }} />

      <View style={{ width: COMP_W, height: COMP_H - 2 - 118 - 1, paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 8 }}>
        <Text style={{ ...styles.compSummary, width: COMP_W - 20, height: 52 }}>{truncate(data.summary, 220)}</Text>
      </View>
    </View>
  )
}

const styles = {
  ytBadge: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: 'bold' as const,
    color: '#E8E8EC',
    width: 40,
    height: 12,
  },
  ytTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#F4F4F8',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  ytChannel: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 13,
    color: '#B8B8C8',
    wrap: 'word' as const,
  },
  pillValue: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: '#C4F0FF',
    height: 14,
  },
  pillLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#9898A8',
    height: 14,
  },
  factBadge: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  factClaim: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#F0F0F5',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  factExplain: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 14,
    color: '#C8C8D8',
    wrap: 'word' as const,
  },
  factPct: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  searchQuery: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: '#E8EAEF',
    wrap: 'word' as const,
  },
  searchTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#5B9FFF',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  searchLink: {
    fontFamily: 'Inter',
    fontSize: 8,
    lineHeight: 11,
    color: '#6BCB8F',
    wrap: 'word' as const,
  },
  searchSnippet: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#A8A8B8',
    wrap: 'word' as const,
  },
  compName: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#F0F0F5',
    fontWeight: 'bold' as const,
    wrap: 'word' as const,
  },
  compLine: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 14,
    wrap: 'word' as const,
  },
  compSummary: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 14,
    color: '#C8D0DC',
    wrap: 'word' as const,
  },
}

const verdictConfig: Record<DeepAnalysisData['verdict'], { label: string; accent: string; badgeBg: string; badgeText: string }> = {
  verified: { label: 'VERIFIED', accent: '#34A853', badgeBg: '#34A85326', badgeText: '#34A853' },
  disputed: { label: 'DISPUTED', accent: '#EA4335', badgeBg: '#EA433526', badgeText: '#EA4335' },
  partially_true: { label: 'PARTIAL', accent: '#FBBC04', badgeBg: '#FBBC0426', badgeText: '#FBBC04' },
  unverified: { label: 'UNVERIFIED', accent: '#9AA0A6', badgeBg: '#9AA0A626', badgeText: '#9AA0A6' },
}

function truncate(s: string, maxChars: number): string {
  const t = s.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, Math.max(0, maxChars - 3))}...`
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K'
  return value.toString()
}
