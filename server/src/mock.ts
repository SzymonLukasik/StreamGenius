import { v4 as uuid } from "uuid";
import type { OverlayServer } from "./overlay-server.js";
import type { OverlayProposal } from "./types.js";

// Simulates Gemini function calls on a timer so the frontend
// can be developed without any API keys or Fishjam/Gemini connection.
// Enable with: MOCK_MODE=true npm run dev

const MOCK_PROPOSALS: Omit<OverlayProposal, "id" | "timestamp">[] = [
  {
    type: "youtube_card",
    status: "ready",
    trigger: '"check out this Fireship video about React 20"',
    data: {
      title: "React 20 Is Here — 5 Things You Need To Know",
      thumbnailUrl: "https://i.ytimg.com/vi/placeholder/hqdefault.jpg",
      channelName: "Fireship",
      viewCount: 1_240_000,
      publishedAt: "2026-03-15T00:00:00Z",
      videoUrl: "https://youtube.com/watch?v=placeholder",
    },
  },
  {
    type: "fact_banner",
    status: "ready",
    trigger: '"60% of developers now use server components"',
    data: {
      claim: "60% of developers now use server components",
      verified: true,
      correction: null,
      source: "State of JS 2025 Survey",
      sourceUrl: "https://stateofjs.com/2025",
    },
  },
  {
    type: "comparison",
    status: "ready",
    trigger: '"Smelter is way more flexible than OBS for overlays"',
    data: {
      itemA: "Smelter",
      itemB: "OBS",
      rows: [
        { label: "API type", valueA: "Declarative React", valueB: "Manual GUI" },
        { label: "Overlay updates", valueA: "React state", valueB: "Scene switch" },
        { label: "Compositing", valueA: "GPU (WASM)", valueB: "CPU + GPU" },
        { label: "Programmatic", valueA: "Full SDK", valueB: "Websocket plugin" },
      ],
    },
  },
  {
    type: "viewer_highlight",
    status: "ready",
    trigger: "viewer question about context windows",
    data: {
      username: "kw_dev",
      message: "How does Gemini's 1M context window actually compare to Claude in practice?",
      relevanceReason: "Directly relevant to current LLM discussion",
    },
  },
  {
    type: "fact_banner",
    status: "ready",
    trigger: '"the hackathon has a $10K first prize"',
    data: {
      claim: "SWM x Gemini Hackathon first prize is $10,000 in GCP credits",
      verified: true,
      correction: null,
      source: "hackathon.swmansion.com",
      sourceUrl: "https://hackathon.swmansion.com",
    },
  },
];

export function startMockMode(overlayServer: OverlayServer) {
  console.log("[mock] Running in MOCK MODE — sending fake proposals every 8s");
  console.log("[mock] Set MOCK_MODE= (empty) to disable");

  let index = 0;

  // Send a transcript update first
  setTimeout(() => {
    overlayServer.broadcast({
      kind: "session_status",
      connected: true,
      geminiConnected: true,
    });
  }, 1000);

  // Send transcript lines
  const transcripts = [
    "So today we're going to talk about the hackathon...",
    "We built this project using Smelter and Fishjam from Software Mansion.",
    "Check out this Fireship video about React 20, it's really good.",
    "The stats say 60% of developers now use server components.",
    "Smelter is way more flexible than OBS for overlay workflows.",
  ];

  let tIdx = 0;
  setInterval(() => {
    if (tIdx < transcripts.length) {
      overlayServer.broadcast({
        kind: "transcript",
        text: transcripts[tIdx],
        isFinal: true,
        timestamp: Date.now(),
      });
      tIdx++;
    }
  }, 6000);

  // Send overlay proposals
  setInterval(() => {
    if (index >= MOCK_PROPOSALS.length) {
      index = 0; // Loop
    }

    const mock = MOCK_PROPOSALS[index];
    const id = uuid();

    // First send "fetching"
    overlayServer.broadcast({
      kind: "overlay_proposal",
      proposal: {
        id,
        type: mock.type,
        status: "fetching",
        trigger: mock.trigger,
        timestamp: Date.now(),
        data: null,
      },
    });

    // Then send "ready" after 1.5s
    setTimeout(() => {
      overlayServer.broadcast({
        kind: "overlay_proposal",
        proposal: {
          id,
          ...mock,
          timestamp: Date.now(),
        },
      });
    }, 1500);

    index++;
  }, 8000);
}
