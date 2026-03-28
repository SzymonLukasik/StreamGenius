import type { OverlayItem } from "../store";
import type { OverlayType } from "../types";

interface Props {
  pending: OverlayItem[];
  fetching: OverlayItem[];
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
}

const COLORS: Record<OverlayType, { c: string; bg: string; label: string }> = {
  youtube_card: { c: "#f87171", bg: "#f8717115", label: "YouTube" },
  fact_banner: { c: "#fb923c", bg: "#fb923c15", label: "Fact check" },
  comparison: { c: "#818cf8", bg: "#818cf815", label: "Comparison" },
  viewer_highlight: { c: "#5eead4", bg: "#5eead415", label: "Viewer Q" },
};

export function ActionQueue({ pending, fetching, onApprove, onSkip }: Props) {
  return (
    <div style={S.panel}>
      <div style={S.header}>AI action queue</div>

      {pending.length === 0 && fetching.length === 0 && (
        <div style={S.empty}>AI is listening — proposals will appear here...</div>
      )}

      {fetching.map((item) => {
        const t = COLORS[item.proposal.type];
        return (
          <div key={item.proposal.id} style={{ ...S.card, opacity: 0.6, borderLeftColor: t.c }}>
            <span style={{ ...S.badge, color: t.c, background: t.bg }}>{t.label}</span>
            <div style={S.trigger}>{item.proposal.trigger}</div>
            <div style={S.progressTrack}><div style={S.progressBar} /></div>
          </div>
        );
      })}

      {pending.map((item) => {
        const t = COLORS[item.proposal.type];
        return (
          <div key={item.proposal.id} style={{ ...S.card, borderLeftColor: t.c }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ ...S.badge, color: t.c, background: t.bg }}>{t.label}</span>
              <span style={{ fontSize: 10, color: "#ffffff4d" }}>{ago(item.proposal.timestamp)}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{title(item)}</div>
            <div style={S.trigger}>{item.proposal.trigger}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onApprove(item.proposal.id)} style={S.approveBtn}>Show</button>
              <button onClick={() => onSkip(item.proposal.id)} style={S.skipBtn}>Skip</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function title(item: OverlayItem): string {
  const d = item.proposal.data;
  if (!d) return "Loading...";
  if ("title" in d) return d.title;
  if ("claim" in d) return d.claim;
  if ("itemA" in d) return `${d.itemA} vs ${d.itemB}`;
  if ("message" in d) return `@${d.username}: ${d.message}`;
  return "";
}

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  return s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

const S: Record<string, React.CSSProperties> = {
  panel: { flex: 1, padding: 12, overflowY: "auto", borderBottom: "1px solid #ffffff0d" },
  header: { fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, color: "#ffffff4d", marginBottom: 8 },
  empty: { color: "#ffffff33", fontStyle: "italic", fontSize: 13 },
  card: { background: "#1a1a26", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "3px solid #ffffff1a" },
  badge: { fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500 },
  trigger: { fontSize: 11, color: "#ffffff66", marginBottom: 8, lineHeight: 1.4 },
  approveBtn: { fontSize: 11, padding: "4px 12px", borderRadius: 6, background: "#1d9e75", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" },
  skipBtn: { fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "transparent", color: "#ffffff66", border: "1px solid #ffffff1a", cursor: "pointer", fontFamily: "inherit" },
  progressTrack: { height: 3, background: "#ffffff0d", borderRadius: 2, overflow: "hidden", marginTop: 6 },
  progressBar: { width: "60%", height: "100%", background: "#1d9e75", borderRadius: 2 },
};
