import { View, Text } from "@swmansion/smelter";
import type { ComparisonData } from "../types";

export function ComparisonTable({ data }: { data: ComparisonData }) {
  return (
    <View
      style={{
        backgroundColor: "#000000D9",
        borderRadius: 12,
        padding: 14,
        width: 360,
      }}
    >
      {/* Header */}
      <View
        style={{
          direction: "row",
          paddingBottom: 18,
          borderColor: "#FFFFFF1A",
          borderWidth: 0,
        }}
      >
        <View style={{ width: 120 }} />
        <Text
          style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "bold", width: 110 }}
        >
          {data.itemA}
        </Text>
        <Text
          style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "bold", width: 110 }}
        >
          {data.itemB}
        </Text>
      </View>

      {/* Rows */}
      {data.rows.map((row, i) => (
        <View
          key={i}
          style={{
            direction: "row",
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 13, color: "#888888", width: 120 }}>
            {row.label}
          </Text>
          <Text style={{ fontSize: 13, color: "#DDDDDD", width: 110 }}>
            {row.valueA}
          </Text>
          <Text style={{ fontSize: 13, color: "#DDDDDD", width: 110 }}>
            {row.valueB}
          </Text>
        </View>
      ))}
    </View>
  );
}
