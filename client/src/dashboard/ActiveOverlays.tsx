import type { OverlayItem } from "../store";
import type { OverlayType } from "../types";

interface Props {
  overlays: OverlayItem[];
  onDismiss: (id: string) => void;
}

const DOT: Record<OverlayType, string> = {
  youtube_card: "#f87171",
  fact_banner: "#fb923c",
  comparison: "#818cf8",
  viewer_highlight: "#5eead4",
};

export function ActiveOverlays({ overlays, onDismiss }: Props) {
  return (
    <div style={{ padding: 12, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: 1.5, color: "#ffffff4d", marginBottom: 8 }}>
        Active overlays
      </div>
      {overlays.length === 0 && <div style={{ color: "#ffffff33", fontStyle: "italic", fontSize: 12 }}>No overlays on screen</div>}
      {overlays.map((o) => (
        <div key={o.proposal.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#1a1a26", borderRadius: 6, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: DOT[o.proposal.type] }} />
            <span style={{ fontSize: 12, textTransform: "capitalize" as const }}>{o.proposal.type.replace("_", " ")}</span>
          </div>
          <button onClick={() => onDismiss(o.proposal.id)} style={{ fontSize: 11, color: "#ffffff4d", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>hide</button>
        </div>
      ))}
    </div>
  );
}
