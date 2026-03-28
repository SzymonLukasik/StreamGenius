interface Props {
  serverConnected: boolean;
  geminiConnected: boolean;
  smelterReady: boolean;
  smelterError: string | null;
  activeCount: number;
}

export function StatusBar({ serverConnected, geminiConnected, smelterReady, smelterError, activeCount }: Props) {
  return (
    <div style={S.bar}>
      <div style={S.left}>
        <div style={{ ...S.dot, background: serverConnected && smelterReady ? "#4ade80" : "#f87171" }} />
        <span style={S.brand}>StreamGenius</span>
        {smelterReady && <span style={{ ...S.badge, borderColor: "#4ade8040", color: "#4ade80" }}>SMELTER OK</span>}
        {geminiConnected && <span style={{ ...S.badge, borderColor: "#818cf840", color: "#818cf8" }}>GEMINI LIVE</span>}
        {!serverConnected && <span style={{ ...S.badge, borderColor: "#f8717140", color: "#f87171" }}>OFFLINE</span>}
      </div>
      <div style={S.right}>
        <span style={S.stat}>{activeCount} overlays active</span>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  bar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #ffffff0d", background: "#12121a", flexShrink: 0 },
  left: { display: "flex", alignItems: "center", gap: 10 },
  right: { display: "flex", alignItems: "center", gap: 12 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  brand: { fontSize: 14, fontWeight: 500 },
  badge: { fontSize: 11, padding: "2px 8px", border: "1px solid", borderRadius: 6 },
  stat: { fontSize: 12, color: "#ffffff99" },
};
