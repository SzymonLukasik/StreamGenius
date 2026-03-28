import { startAgent } from "./agent.js";
import { startOverlayServer } from "./overlay-server.js";
import { startMockMode } from "./mock.js";

const OVERLAY_WS_PORT = Number(process.env.PORT) || 3001;
const MOCK_MODE = process.env.MOCK_MODE === "true";

async function main() {
  console.log("[streamgenius] Starting server...");

  // 1. Start the overlay WebSocket server (browser connects here for proposals)
  const overlayServer = startOverlayServer(OVERLAY_WS_PORT);

  if (MOCK_MODE) {
    // Mock mode: send fake proposals on a timer (no API keys needed)
    startMockMode(overlayServer);
  } else {
    // Production: Start the Fishjam Agent (bridges room audio to Gemini Live API)
    try {
      await startAgent(overlayServer);
      console.log("[streamgenius] Agent connected to Fishjam + Gemini");
    } catch (err) {
      console.error("[streamgenius] Agent failed to start:", err);
      console.log("[streamgenius] Falling back to MOCK MODE");
      startMockMode(overlayServer);
    }
  }

  console.log(`[streamgenius] Overlay WS: ws://localhost:${OVERLAY_WS_PORT}`);
  if (MOCK_MODE) console.log("[streamgenius] MOCK_MODE=true — sending fake proposals");
}

main();
