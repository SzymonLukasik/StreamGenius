// ============================================================
// StreamGenius — Shared Types
// This file exists in BOTH client/src/types.ts and server/src/types.ts
// Keep them in sync. If you change one, change the other.
// ============================================================

// --- Overlay types ---

export type OverlayType =
  | "youtube_card"
  | "fact_banner"
  | "comparison"
  | "viewer_highlight";

export type OverlayStatus = "fetching" | "ready" | "error";

export interface YoutubeData {
  title: string;
  thumbnailUrl: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  videoUrl: string;
}

export interface FactData {
  claim: string;
  verified: boolean;
  correction: string | null;
  source: string;
  sourceUrl: string;
}

export interface ComparisonData {
  itemA: string;
  itemB: string;
  rows: { label: string; valueA: string; valueB: string }[];
}

export interface ViewerHighlightData {
  username: string;
  message: string;
  relevanceReason: string;
}

export type OverlayData =
  | YoutubeData
  | FactData
  | ComparisonData
  | ViewerHighlightData;

export interface OverlayProposal {
  id: string;
  type: OverlayType;
  status: OverlayStatus;
  trigger: string;
  timestamp: number;
  data: OverlayData | null;
}

// --- WebSocket protocol (overlay control only — audio goes through Fishjam) ---

export type ClientMessage =
  | { kind: "overlay_approve"; id: string }
  | { kind: "overlay_dismiss"; id: string };

export type ServerMessage =
  | { kind: "transcript"; text: string; isFinal: boolean; timestamp: number }
  | { kind: "overlay_proposal"; proposal: OverlayProposal }
  | { kind: "session_status"; connected: boolean; geminiConnected: boolean; fishjamId?: string; peerToken?: string };
