import { View, Text } from "@swmansion/smelter";
import type { ViewerHighlightData } from "../types";

export function ViewerHighlight({ data }: { data: ViewerHighlightData }) {
  return (
    <View
      style={{
        backgroundColor: "#3C1E50E0",
        borderRadius: 12,
        padding: 12,
        width: 280,
      }}
    >
      {/* Header */}
      <View style={{ direction: "row", paddingBottom: 6 }}>
        {/* Avatar circle */}
        <View
          style={{
            width: 32,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#7F77DD",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: "#FFFFFF",
              fontWeight: "bold",
              align: "center",
            }}
          >
            {data.username.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: "#CECBF6", fontWeight: "bold" }}>
          Pinned by AI
        </Text>
      </View>

      {/* Message */}
      <Text style={{ fontSize: 14, color: "#E8E8F0", wrap: "word" }}>
        {data.message}
      </Text>

      {/* Attribution */}
      <Text style={{ fontSize: 11, color: "#8888AA" }}>
        @{data.username} · {data.relevanceReason}
      </Text>
    </View>
  );
}
