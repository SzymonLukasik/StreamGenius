interface Props {
  transcript: { text: string; isFinal: boolean; timestamp: number }[];
}

export function TranscriptPanel({ transcript }: Props) {
  return (
    <div style={S.panel}>
      <div style={S.header}>Live transcript</div>
      <div style={S.entries}>
        {transcript.length === 0 && <div style={S.empty}>Start speaking — transcript will appear here...</div>}
        {transcript.map((e, i) => (
          <p key={i} style={{ margin: "0 0 4px", color: e.isFinal ? "#ffffffeb" : "#ffffff55", fontSize: 13, lineHeight: 1.6 }}>{e.text}</p>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  panel: { flex: 1, display: "flex", flexDirection: "column", padding: 12, overflow: "hidden" },
  header: { fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1.5, color: "#ffffff4d", marginBottom: 8 },
  entries: { flex: 1, overflowY: "auto" },
  empty: { color: "#ffffff33", fontStyle: "italic", fontSize: 13 },
};
