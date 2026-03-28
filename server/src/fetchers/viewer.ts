import type { ViewerHighlightData } from "../types.js";

// In production: scan Fishjam data channel messages for relevant comments.
// For hackathon: we can either:
// 1. Use pre-seeded mock comments
// 2. Use Fishjam's data channel API to receive real chat
// 3. Have a separate chat WebSocket that viewers post to

const MOCK_COMMENTS = [
  { username: "dev_alex", message: "How does this compare to what OpenAI is doing?", relevanceReason: "Related to current AI discussion" },
  { username: "sarah_ml", message: "Can you show the benchmark numbers?", relevanceReason: "Viewer requesting data" },
  { username: "kw_dev", message: "What about the latency in production?", relevanceReason: "Technical question about current topic" },
  { username: "techfan42", message: "This is exactly what I needed for my project!", relevanceReason: "High engagement comment" },
];

export async function fetchViewerComment(
  topic: string
): Promise<ViewerHighlightData> {
  // TODO: Replace with real Fishjam data channel integration
  // For now, return a random mock comment
  const comment = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
  return { ...comment };
}
