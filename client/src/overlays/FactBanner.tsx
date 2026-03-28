import { View, Text } from "@swmansion/smelter";
import type { FactData } from "../types";

export function FactBanner({ data }: { data: FactData }) {
  const badgeColor = data.verified ? "#1D9E75" : "#E24B4A";

  return (
    <View
      style={{
        backgroundColor: "#000000CC",
        borderRadius: 12,
        padding: 12,
        direction: "row",
      }}
    >
      {/* Badge */}
      <View
        style={{
          backgroundColor: badgeColor,
          borderRadius: 6,
          padding: 6,
          paddingLeft: 10,
          paddingRight: 22,
        }}
      >
        <Text style={{ fontSize: 12, color: "#FFFFFF", fontWeight: "bold" }}>
          {data.verified ? "VERIFIED" : "DISPUTED"}
        </Text>
      </View>

      {/* Claim text */}
      <View style={{ direction: "column" }}>
        <Text style={{ fontSize: 15, color: "#E0E0E0" }}>
          {data.correction ?? data.claim}
        </Text>
        <Text style={{ fontSize: 11, color: "#888888" }}>
          Source: {data.source}
        </Text>
      </View>
    </View>
  );
}
