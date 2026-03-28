import { FishjamClient, FishjamWSNotifier } from "@fishjam-cloud/js-server-sdk";
import * as GeminiIntegration from "@fishjam-cloud/js-server-sdk/gemini";
import { Modality } from "@google/genai";
import { v4 as uuid } from "uuid";
import type { OverlayServer } from "./overlay-server.js";
import type { OverlayProposal, OverlayType } from "./types.js";
import { executeFetcher } from "./fetchers/index.js";

// --- Gemini function calling tool definitions ---
const TOOLS = [
  {
    name: "show_youtube_card",
    description:
      "Call this when the host mentions a YouTube video, channel, or online video content. Extract the search query from what they said.",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query for the YouTube video",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "verify_fact",
    description:
      "Call this when the host states a specific statistic, number, or factual claim that can be verified.",
    parameters: {
      type: "object" as const,
      properties: {
        claim: { type: "string", description: "The factual claim to verify" },
        source: {
          type: "string",
          description: "Who or what the host attributed the claim to, if any",
        },
      },
      required: ["claim"],
    },
  },
  {
    name: "create_comparison",
    description:
      "Call this when the host compares two things, products, technologies, or concepts.",
    parameters: {
      type: "object" as const,
      properties: {
        item_a: { type: "string", description: "First item being compared" },
        item_b: { type: "string", description: "Second item being compared" },
        criteria: {
          type: "string",
          description: "What aspect they are comparing",
        },
      },
      required: ["item_a", "item_b"],
    },
  },
  {
    name: "pin_viewer_comment",
    description:
      "Call this when a viewer's question or comment in chat is highly relevant to the current discussion topic.",
    parameters: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "The current discussion topic",
        },
      },
      required: ["topic"],
    },
  },
];

const FUNCTION_TO_OVERLAY: Record<string, OverlayType> = {
  show_youtube_card: "youtube_card",
  verify_fact: "fact_banner",
  create_comparison: "comparison",
  pin_viewer_comment: "viewer_highlight",
};

const GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

const SYSTEM_INSTRUCTION = `You are StreamGenius, an AI co-pilot for live streams and video production.

Your job is to LISTEN to the host and detect when they mention content that should become a visual overlay on their stream. You have 4 tools available — use them ONLY when the host clearly references something specific:

- show_youtube_card: when a specific video, channel, or YouTube content is mentioned
- verify_fact: when a specific statistic, number, or verifiable claim is stated  
- create_comparison: when the host explicitly compares two things
- pin_viewer_comment: when a viewer comment is directly relevant to the current topic

Be CONSERVATIVE. Do NOT trigger on every sentence. Only trigger when the host clearly references something that would benefit from a visual overlay. Wait for specific entities, numbers, or comparisons — not vague references.

Do NOT generate spoken responses. You are audio-in only. Your only output is function calls.`;

export async function startAgent(overlayServer: OverlayServer) {
  const fishjamId = process.env.FISHJAM_ID;
  const fishjamToken = process.env.FISHJAM_TOKEN;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!fishjamId || !fishjamToken || !googleApiKey) {
    throw new Error(
      "Missing env vars: FISHJAM_ID, FISHJAM_TOKEN, GOOGLE_API_KEY"
    );
  }

  // Initialize clients
  const fishjamClient = new FishjamClient({
    fishjamId,
    managementToken: fishjamToken,
  });

  const genAi = GeminiIntegration.createClient({
    apiKey: googleApiKey,
  });

  // Monitor room-level events
  const notifier = new FishjamWSNotifier({ fishjamId, managementToken: fishjamToken });
  for (const evt of ["peerConnected", "peerDisconnected", "trackAdded", "trackRemoved", "peerAdded", "peerDeleted"] as const) {
    notifier.on(evt, (data: any) => console.log(`[notifier] ${evt}:`, JSON.stringify(data).slice(0, 200)));
  }

  // Create room + agent
  const room = await fishjamClient.createRoom();
  console.log(`[agent] Created Fishjam room: ${room.id}`);

  // Create a peer token for the host browser
  const { peerToken } = await fishjamClient.createPeer(room.id);

  const { agent } = await fishjamClient.createAgent(room.id, {
    subscribeMode: "auto",
    output: GeminiIntegration.geminiInputAudioSettings, // 16kHz
  }, {
    onClose: (code, reason) => console.log(`[agent] WS closed: ${code} ${reason}`),
    onError: (err) => console.error(`[agent] WS error:`, err),
  });

  // Debug: log non-trackData events only (trackData is too noisy)
  const origEmit = agent.emit.bind(agent);
  agent.emit = (event: string, ...args: any[]) => {
    if (event !== "trackData") {
      console.log(`[agent] Event: ${event}`, typeof args[0] === 'object' ? Object.keys(args[0]) : args[0]);
    }
    return origEmit(event, ...args);
  };

  // Transcript buffering — accumulate ~10s of text before finalizing
  let transcriptBuffer = "";
  let transcriptBufferStart = Date.now();

  // Connect to Gemini Live API
  const session = await genAi.live.connect({
    model: GEMINI_MODEL,
    config: {
      responseModalities: [Modality.AUDIO], // Native audio model requires AUDIO; we ignore audio responses
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: TOOLS }],
      inputAudioTranscription: {}, // Transcribe host speech → transcript panel
    },
    callbacks: {
      onopen: () => console.log("[gemini] WebSocket connected"),
      onerror: (e) => console.error("[gemini] WebSocket error:", e),
      onclose: (e) => console.log("[gemini] WebSocket closed:", e.code, e.reason),
      onmessage: async (msg) => {
        // Debug: log all Gemini messages
        const keys = Object.keys(msg).filter(k => (msg as any)[k] != null);
        console.log(`[gemini] Message keys: ${keys.join(", ")}`);

        // Handle function calls from Gemini
        if (msg.toolCall) {
          for (const call of msg.toolCall.functionCalls || []) {
            console.log(
              `[agent] Gemini function call: ${call.name}(${JSON.stringify(call.args)})`
            );
            handleFunctionCall(
              call.name,
              call.args as Record<string, string>,
              call.id,
              session,
              overlayServer
            );
          }
        }

        // Host speech transcription — buffer into ~10s segments
        if (msg.serverContent?.inputTranscription?.text) {
          const text = msg.serverContent.inputTranscription.text;
          const finished = !!msg.serverContent.inputTranscription.finished;
          transcriptBuffer += (transcriptBuffer ? " " : "") + text;

          if (finished || Date.now() - transcriptBufferStart > 10_000) {
            overlayServer.broadcast({
              kind: "transcript",
              text: transcriptBuffer,
              isFinal: true,
              timestamp: Date.now(),
            });
            transcriptBuffer = "";
            transcriptBufferStart = Date.now();
          } else {
            // Send partial so the UI stays responsive
            overlayServer.broadcast({
              kind: "transcript",
              text: transcriptBuffer,
              isFinal: false,
              timestamp: Date.now(),
            });
          }
        }
      },
    },
  });

  // Tell browser that Gemini is connected + send room credentials
  overlayServer.broadcast({
    kind: "session_status",
    connected: true,
    geminiConnected: true,
    fishjamId,
    peerToken,
  });

  // Forward room audio → Gemini
  let audioChunks = 0;
  agent.on("trackData", ({ data }: { data: Buffer }) => {
    audioChunks++;
    if (audioChunks === 1) console.log("[agent] First audio chunk received from room");
    if (audioChunks % 100 === 0) console.log(`[agent] Audio chunks forwarded to Gemini: ${audioChunks}`);
    session.sendRealtimeInput({
      audio: {
        mimeType: GeminiIntegration.inputMimeType,
        data: Buffer.from(data).toString("base64"),
      },
    });
  });

  console.log(
    `[agent] Listening. Room ID: ${room.id} — share this with viewers.`
  );
  return { room, agent, session };
}

// --- Function call handler (fork pattern) ---

async function handleFunctionCall(
  name: string,
  args: Record<string, string>,
  callId: string,
  geminiSession: any,
  overlayServer: OverlayServer
) {
  const proposalId = uuid();
  const overlayType = FUNCTION_TO_OVERLAY[name];
  if (!overlayType) return;

  // Fork A: immediately tell browser we're working on it
  const proposal: OverlayProposal = {
    id: proposalId,
    type: overlayType,
    status: "fetching",
    trigger: JSON.stringify(args),
    timestamp: Date.now(),
    data: null,
  };
  overlayServer.broadcast({ kind: "overlay_proposal", proposal });

  try {
    // Fork B: execute content fetcher
    const data = await executeFetcher(name, args);

    // Return result to Gemini (close the function call loop)
    await geminiSession.sendToolResponse({
      functionResponses: [
        {
          id: callId,
          response: { result: "Content fetched and displayed as overlay." },
        },
      ],
    });

    // Send ready proposal to browser
    overlayServer.broadcast({
      kind: "overlay_proposal",
      proposal: { ...proposal, status: "ready", data },
    });
  } catch (err) {
    console.error(`[agent] Fetcher failed for ${name}:`, err);
    overlayServer.broadcast({
      kind: "overlay_proposal",
      proposal: { ...proposal, status: "error" },
    });
  }
}
