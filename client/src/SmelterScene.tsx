import { View, InputStream, Rescaler, Text } from "@swmansion/smelter";
import type { OverlayItem } from "./store";
import { YoutubeCard } from "./overlays/YoutubeCard";
import { FactBanner } from "./overlays/FactBanner";
import { ComparisonTable } from "./overlays/ComparisonTable";
import { ViewerHighlight } from "./overlays/ViewerHighlight";

// ============================================================
// This component defines the video composition.
// It uses ONLY Smelter components (View, Text, Image, InputStream, Rescaler).
// NO HTML elements (<div>, <span>, <table>) allowed here.
//
// When React state changes (overlay added/removed), Smelter
// automatically re-renders the video composition.
// ============================================================

interface Props {
  activeOverlays: OverlayItem[];
}

export function SmelterScene({ activeOverlays }: Props) {
  return (
    <View style={{ backgroundColor: "#000000" }}>
      {/* Camera fills the full output */}
      <Rescaler>
        <InputStream inputId="camera" />
      </Rescaler>

      {/* Lower third: overlay stack from bottom */}
      <View
        style={{
          bottom: 40,
          left: 40,
          width: 1200,
        }}
      >
        {activeOverlays.map((item) => (
          <View
            key={item.proposal.id}
            style={{ paddingBottom: 12 }}
            transition={{ durationMs: 300, easingFunction: "linear" }}
          >
            <OverlaySwitch item={item} />
          </View>
        ))}
      </View>

      {/* Top right: branding */}
      <View
        style={{
          top: 20,
          right: 20,
          backgroundColor: "#00000099",
          padding: 8,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "#FFFFFF99",
            fontWeight: "bold",
          }}
        >
          StreamGenius
        </Text>
      </View>
    </View>
  );
}

function OverlaySwitch({ item }: { item: OverlayItem }) {
  if (!item.proposal.data) return null;

  switch (item.proposal.type) {
    case "youtube_card":
      return <YoutubeCard data={item.proposal.data as any} />;
    case "fact_banner":
      return <FactBanner data={item.proposal.data as any} />;
    case "comparison":
      return <ComparisonTable data={item.proposal.data as any} />;
    case "viewer_highlight":
      return <ViewerHighlight data={item.proposal.data as any} />;
  }
}
