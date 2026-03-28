import { View, Text, Image } from "@swmansion/smelter";
import type { YoutubeData } from "../types";

export function YoutubeCard({ data }: { data: YoutubeData }) {
  const views =
    data.viewCount >= 1_000_000
      ? `${(data.viewCount / 1_000_000).toFixed(1)}M views`
      : data.viewCount >= 1_000
        ? `${Math.round(data.viewCount / 1_000)}K views`
        : `${data.viewCount} views`;

  return (
    <View
      style={{
        backgroundColor: "#000000CC",
        borderRadius: 12,
        padding: 12,
        direction: "row",
      }}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 80,
          height: 60,
          backgroundColor: "#E24B4A",
          borderRadius: 8,
          paddingRight: 12,
          overflow: "hidden",
        }}
      >
        {data.thumbnailUrl && (
          <Image imageId="yt-thumb" style={{ width: 80, height: 60 }} />
        )}
      </View>

      {/* Info */}
      <View style={{ direction: "column" }}>
        <Text style={{ fontSize: 16, color: "#FFFFFF", fontWeight: "bold" }}>
          {data.title}
        </Text>
        <Text style={{ fontSize: 13, color: "#AAAAAA" }}>
          {data.channelName} · {views}
        </Text>
      </View>
    </View>
  );
}
