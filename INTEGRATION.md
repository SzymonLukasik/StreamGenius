# INTEGRATION.md — Fishjam & Smelter Research

> This document contains findings from thorough API research that CHANGE several
> architectural assumptions in CLAUDE.md. Read this before coding anything related
> to Smelter or Fishjam.

---

## CRITICAL FINDING 1: Fishjam has native Gemini Live integration

**This is huge.** Fishjam provides a built-in bridge between Fishjam rooms and
Google's Gemini Multimodal Live API. We DO NOT need to build our own audio capture,
PCM resampling, or WebSocket-to-Gemini pipeline. Fishjam handles it.

### How it works

Fishjam has an "Agent" concept — a backend participant that joins a room, receives
audio from peers, and can send audio back. The Fishjam server SDK includes a
`GeminiIntegration` helper that:

1. Creates a Google GenAI client with correct audio settings
2. Configures the agent's audio format to match Gemini's requirements (16kHz input, 24kHz output)
3. Provides preset audio settings (`geminiInputAudioSettings`, `geminiOutputAudioSettings`)

### What this means for StreamGenius

Our original plan was:
```
Browser mic → AudioWorklet → PCM resample → WebSocket → Backend → Gemini Live API
```

The new plan using Fishjam agents:
```
Browser mic → Fishjam room (as peer) → Fishjam Agent (backend) → Gemini Live API
```

Fishjam handles the audio transport, format conversion, and streaming. The Agent
receives PCM audio chunks from the room and forwards them to Gemini. Gemini's
responses come back through the same agent.

### NPM packages needed

For the backend agent:
```
npm install @fishjam-cloud/js-server-sdk @google/genai
```

For the frontend client:
```
npm install @fishjam-cloud/react-client
```

### Backend code (from Fishjam docs)

```typescript
import { FishjamClient } from '@fishjam-cloud/js-server-sdk';
import * as GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';

const fishjamClient = new FishjamClient({
  fishjamId: process.env.FISHJAM_ID!,
  managementToken: process.env.FISHJAM_TOKEN!,
});

const genAi = GeminiIntegration.createClient({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Create room + agent
const room = await fishjamClient.createRoom();
const { agent } = await fishjamClient.createAgent(room.id, {
  subscribeMode: 'auto',
  output: GeminiIntegration.geminiInputAudioSettings, // 16kHz preset
});

// Create outgoing audio track for Gemini responses
const agentTrack = agent.createTrack(GeminiIntegration.geminiOutputAudioSettings); // 24kHz preset

// Connect to Gemini
const session = await genAi.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: { responseModalities: [Modality.AUDIO] },
  callbacks: {
    onmessage: (msg) => {
      if (msg.data) {
        const pcmData = Buffer.from(msg.data, 'base64');
        agent.sendData(agentTrack.id, pcmData);
      }
    }
  }
});

// Forward room audio → Gemini
agent.on('trackData', ({ data }) => {
  session.sendRealtimeInput({
    audio: {
      mimeType: GeminiIntegration.inputMimeType,
      data: Buffer.from(data).toString('base64'),
    }
  });
});
```

### Impact on our code

- **DELETE**: `packages/frontend/src/hooks/useAudioCapture.ts` — no longer needed
- **DELETE**: AudioWorklet PCM resampling code — Fishjam handles format conversion
- **CHANGE**: Backend server becomes a Fishjam Agent instead of a raw WebSocket server
- **CHANGE**: Frontend uses `@fishjam-cloud/react-client` to join a room as a peer
- **ADD**: Fishjam credentials needed: `FISHJAM_ID` and `FISHJAM_TOKEN` (get from fishjam.io/app)

### Credentials

- Sign up at https://fishjam.io/app
- Get `fishjamId` and `managementToken`
- These are free for development / hackathon use

---

## CRITICAL FINDING 2: Smelter components are NOT HTML

**Our current overlay components won't work in Smelter.** Smelter uses its own
component system inspired by React Native. Standard DOM elements (`<div>`, `<span>`,
`<table>`) are NOT supported. You must use Smelter-specific components:

| Smelter Component | Purpose | Equivalent HTML |
|-------------------|---------|-----------------|
| `<View>` | Container/layout | `<div>` |
| `<Text>` | Text display | `<span>/<p>` |
| `<Image>` | Image display | `<img>` |
| `<InputStream>` | Video input feed | `<video>` |
| `<Rescaler>` | Resize/position child | CSS transform |
| `<Show>` | Conditional render | Conditional JSX |
| `<Tiles>` | Grid layout | CSS Grid |

### Styling differences

Smelter styling looks like React Native inline styles, NOT CSS. Key differences:
- No CSS classes, no external stylesheets
- No `background: rgba(...)` — use Smelter's color format
- No `border-radius`, `box-shadow`, `overflow: hidden`
- Positioning uses `top`, `left`, `width`, `height` in the style prop
- View supports `direction: "column" | "row"` for layout (like flexbox)

### What this means for our overlays

**All 4 overlay components need to be rewritten** using Smelter primitives:

```typescript
// WRONG (current code)
function FactBannerOverlay({ data }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.8)", borderRadius: 10, padding: 12 }}>
      <span style={{ fontSize: 9, color: "#fff" }}>VERIFIED</span>
      <span style={{ fontSize: 11, color: "#e0e0e0" }}>{data.claim}</span>
    </div>
  );
}

// CORRECT (Smelter components)
import { View, Text } from "@swmansion/smelter";

function FactBannerOverlay({ data }) {
  return (
    <View style={{ backgroundColor: "#000000CC", padding: 12 }}>
      <Text style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "bold" }}>
        VERIFIED
      </Text>
      <Text style={{ fontSize: 16, color: "#E0E0E0" }}>
        {data.claim}
      </Text>
    </View>
  );
}
```

### Available Smelter style properties for View

From ViewStyleProps docs:
- `width`, `height` — dimensions
- `top`, `left`, `bottom`, `right` — absolute positioning
- `backgroundColor` — background color (hex string with alpha)
- `direction` — `"row"` | `"column"`
- `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`
- `margin`, `marginTop`, etc.
- `overflow` — `"visible"` | `"hidden"` | `"fit"`
- `borderColor`, `borderWidth`
- `borderRadius` — IS supported (unlike my note above)

### Available Text style properties

From TextStyleProps docs:
- `fontSize` — number (pixels)
- `color` — hex string
- `fontWeight` — number or string
- `fontFamily` — must register custom fonts first
- `lineHeight` — number
- `align` — `"left"` | `"center"` | `"right"`
- `wrap` — `"none"` | `"word"` | `"glyph"`

---

## CRITICAL FINDING 3: Smelter ↔ Fishjam connection via MediaStream

The Smelter WASM engine outputs a `MediaStream` which can be fed into Fishjam
as a custom source. Fishjam's docs explicitly show this integration:

### Smelter side — register output as MediaStream

```typescript
import Smelter, { setWasmBundleUrl } from "@swmansion/smelter-web-wasm";
import { View, InputStream, Rescaler, Text } from "@swmansion/smelter";

// IMPORTANT: must set WASM bundle URL before creating Smelter instance
setWasmBundleUrl("/assets/smelter.wasm");

const smelter = new Smelter({ framerate: 30 });
await smelter.init();

// Register camera as input
await smelter.registerInput('camera', { type: 'camera' });

// Register output as a MediaStream (not WHIP, not canvas)
const { stream } = await smelter.registerOutput(
  'main-output',
  <StreamScene />,  // React component defining the composition
  {
    type: 'stream',  // ← this gives us a MediaStream object
    video: {
      resolution: { width: 1920, height: 1080 },
    },
    audio: true,
  }
);

await smelter.start();

// `stream` is now a standard MediaStream object
// Feed it to Fishjam as a custom source
```

### Fishjam side — consume MediaStream via custom source

```typescript
import { useCustomSource } from "@fishjam-cloud/react-client";

function App() {
  const { setStream } = useCustomSource("smelter-output");

  // When Smelter produces a stream, feed it to Fishjam
  useEffect(() => {
    if (smelterStream) {
      setStream(smelterStream);
    }
  }, [smelterStream, setStream]);

  return <div>...</div>;
}
```

### The complete pipeline

```
Camera (getUserMedia)
  ↓ registered as Smelter input
Smelter WASM (browser)
  ↓ composites camera + overlay components
  ↓ outputs MediaStream
Fishjam Custom Source (useCustomSource hook)
  ↓ sends composed stream as a peer track
Fishjam Server (SFU)
  ↓ relays via WebRTC
Viewers (other peers in the room)
```

---

## CRITICAL FINDING 4: Smelter scene is a React component tree

The composition layout is defined as a React component that gets passed to
`smelter.registerOutput()`. This component uses Smelter primitives and
can use React state/hooks to dynamically update the composition.

### Our StreamScene component

```typescript
import { View, InputStream, Rescaler, Text, Show, Image } from "@swmansion/smelter";
import { useInputStreams } from "@swmansion/smelter";

// This component IS the video composition
function StreamScene({ overlays }) {
  return (
    <View style={{ backgroundColor: "#000000" }}>
      {/* Camera feed fills the full output */}
      <Rescaler style={{ width: 1920, height: 1080 }}>
        <InputStream inputId="camera" />
      </Rescaler>

      {/* Overlays positioned absolutely on top */}
      {overlays.map(overlay => (
        <View
          key={overlay.id}
          style={{
            position: "absolute",
            bottom: 80,
            left: 40,
            // ... positioning depends on overlay type
          }}
        >
          <OverlayRenderer overlay={overlay} />
        </View>
      ))}
    </View>
  );
}
```

### Dynamic updates

When React state changes (e.g. new overlay approved), the component re-renders,
and Smelter automatically updates the video composition. This is the key insight:
**overlay show/hide is just React state management**. No imperative API calls needed.

### Transitions

Smelter supports transitions on components:

```typescript
<View
  style={{ bottom: 20, left: 20 }}
  transition={{ durationMs: 300, easingFunction: "ease_in_out" }}
>
  <FactBanner data={...} />
</View>
```

When the component appears or its style changes, Smelter animates the transition.
This gives us overlay fade-in/slide-in for free.

---

## CRITICAL FINDING 5: WASM bundle must be served correctly

The `@swmansion/smelter-web-wasm` package includes a WASM binary that must be
served by your web server. You need to:

1. Copy the WASM file to your public assets directory
2. Call `setWasmBundleUrl()` before creating any Smelter instance

For Vite:
```typescript
// In your app initialization
import { setWasmBundleUrl } from "@swmansion/smelter-web-wasm";
setWasmBundleUrl("/smelter.wasm");
```

You may need to configure Vite to serve the WASM file correctly:
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@swmansion/smelter-web-wasm']
  }
});
```

The WASM file is ~15-20MB. Pre-download it before hackathon day.

---

## REVISED ARCHITECTURE

Based on these findings, the architecture changes significantly:

### Before (our original plan)
```
Browser:
  - AudioWorklet captures mic → PCM → WebSocket → Backend
  - Backend proxies to Gemini Live API
  - Overlays rendered as CSS-positioned HTML divs
  - Smelter and Fishjam were vaguely "to be integrated"

Problems:
  - Custom audio pipeline (AudioWorklet + PCM resampling) = complex and fragile
  - Overlay components use HTML/CSS = won't work in Smelter
  - No clear Smelter ↔ Fishjam connection path
```

### After (using Fishjam + Smelter correctly)
```
Browser (host):
  ┌─────────────────────────────────────────────────┐
  │ Fishjam React Client                            │
  │  - Joins room as peer                           │
  │  - Mic audio automatically sent to room         │
  │  - Uses useCustomSource() to feed Smelter       │
  │    output as the peer's video track             │
  │                                                 │
  │ Smelter WASM                                    │
  │  - Camera registered as input                   │
  │  - StreamScene component defines composition    │
  │  - Overlay components use View/Text/Image       │
  │  - Output = MediaStream → fed to Fishjam        │
  │                                                 │
  │ Dashboard UI (separate from Smelter)            │
  │  - Transcript panel (regular React/HTML)        │
  │  - Action queue (regular React/HTML)            │
  │  - Controls (regular React/HTML)                │
  └────────────────────┬────────────────────────────┘
                       │ Fishjam room (WebRTC)
                       │
  ┌────────────────────┴────────────────────────────┐
  │ Fishjam Cloud Server (SFU)                      │
  │  - Relays audio/video between peers             │
  │  - Agent receives host's mic audio              │
  │  - Agent sends Gemini audio responses           │
  └────────────────────┬────────────────────────────┘
                       │
  ┌────────────────────┴────────────────────────────┐
  │ Backend (our server — Node.js or Python)        │
  │                                                 │
  │ Fishjam Agent:                                  │
  │  - Receives mic audio from room (16kHz PCM)     │
  │  - Forwards to Gemini Live API                  │
  │  - Receives function calls from Gemini          │
  │  - Executes content fetchers                    │
  │  - Sends overlay proposals to browser via WS    │
  │  - (Optional) Sends Gemini voice back to room   │
  │                                                 │
  │ Content fetchers:                               │
  │  - YouTube, Google Search, Wikipedia            │
  │  - Gemini 3.1 Pro for fact verification         │
  │                                                 │
  │ WebSocket server:                               │
  │  - Sends overlay proposals to browser           │
  │  - Receives approval/dismiss from browser       │
  └─────────────────────────────────────────────────┘
                       │
  ┌────────────────────┴────────────────────────────┐
  │ Viewers                                         │
  │  - Join same Fishjam room as peers              │
  │  - See composed stream (camera + overlays)      │
  │  - Hear host audio + optionally Gemini audio    │
  └─────────────────────────────────────────────────┘
```

### Key change: two communication channels

The backend now has TWO connections:
1. **Fishjam Agent WebSocket** — for audio (mic → Gemini → room)
2. **Our own WebSocket** — for overlay proposals (backend → browser dashboard)

The Fishjam Agent handles all audio. Our WebSocket only handles overlay
control messages (proposals, approvals, dismissals, transcript updates).
This is a cleaner separation.

---

## WHAT NEEDS TO CHANGE IN THE CODEBASE

### Files to DELETE
- `packages/frontend/src/hooks/useAudioCapture.ts` — Fishjam handles audio
- All AudioWorklet-related code

### Files to REWRITE
- `packages/overlays/src/*.tsx` — rewrite using Smelter components (View, Text, Image)
  instead of HTML div/span. This is the biggest change.
- `packages/backend/src/server.ts` — add Fishjam Agent initialization alongside
  the existing WebSocket server for overlay messages
- `packages/frontend/src/App.tsx` — wrap in FishjamContextProvider, add Smelter
  initialization, connect the two
- `packages/frontend/src/components/StreamPreview.tsx` — replace with actual
  Smelter compositor + Fishjam custom source

### Files to ADD
- `packages/frontend/src/SmelterScene.tsx` — the Smelter composition component
  (camera + dynamic overlays)
- `packages/frontend/src/hooks/useSmelter.ts` — Smelter init, input/output
  registration, lifecycle management
- `packages/backend/src/agent.ts` — Fishjam Agent setup + Gemini Live bridge

### Files that stay the same
- `packages/shared/src/index.ts` — types unchanged (overlay schemas still valid)
- `packages/frontend/src/store.ts` — state machine unchanged
- `packages/frontend/src/hooks/useWebSocket.ts` — still needed for overlay messages
- `packages/frontend/src/components/ActionQueue.tsx` — unchanged (regular React)
- `packages/frontend/src/components/ActiveOverlays.tsx` — unchanged (regular React)
- `packages/frontend/src/components/StatusBar.tsx` — unchanged (regular React)
- `packages/frontend/src/components/TranscriptPanel.tsx` — unchanged (regular React)
- `packages/backend/src/fetchers/*.ts` — unchanged (content fetching logic)

### New dependencies

```
# Frontend
npm install @fishjam-cloud/react-client @swmansion/smelter @swmansion/smelter-web-wasm

# Backend
npm install @fishjam-cloud/js-server-sdk @google/genai
```

### New environment variables

```
# Fishjam (get from https://fishjam.io/app)
FISHJAM_ID=
FISHJAM_TOKEN=

# Google Gemini (hackathon credits)
GOOGLE_API_KEY=
```

---

## REVISED WORK SPLIT

### Person A — Fishjam Agent + Gemini bridge
**Pre-hackathon:**
- Sign up at fishjam.io/app, get credentials
- Study Gemini Live Integration tutorial: https://documentation.fishjam.io/docs/next/tutorials/gemini-live-integration
- Study Agent internals: https://documentation.fishjam.io/docs/next/explanation/agent-internals
- Build `packages/backend/src/agent.ts` — the Fishjam Agent that bridges room audio to Gemini
- Add function calling to Gemini session (our 4 tools)
- Test: agent joins room, receives audio, forwards to Gemini, gets transcripts back

**Hackathon day:**
- Connect real Gemini API with hackathon credits
- Wire function calls → fetchers → overlay proposals
- Test end-to-end audio pipeline

### Person B — Backend fetchers + overlay WebSocket (unchanged)
**Pre-hackathon:**
- Build content fetchers (YouTube, Search, Wikipedia)
- Build the separate WebSocket server for overlay proposals
- Build fallback cache

**Hackathon day:**
- Wire to real APIs
- Add Gemini 3.1 Pro fact verification

### Person C — Frontend dashboard + Fishjam client
**Pre-hackathon:**
- Study Fishjam React Quick Start: https://documentation.fishjam.io/docs/next/tutorials/react-quick-start
- Wrap app in FishjamContextProvider
- Build room joining flow (connect to Fishjam, start mic)
- Dashboard components (unchanged — these are regular React)

**Hackathon day:**
- Connect to real Fishjam room
- Wire Smelter output → Fishjam custom source
- Integration testing

### Person D — Smelter overlays + composition (MOST CHANGED ROLE)
**Pre-hackathon:**
- Study Smelter WASM quick start: https://smelter.dev/ts-sdk/guides/quick-start-wasm/
- Study Smelter components: View, Text, Image, InputStream, Rescaler, Show
- Study transitions: https://smelter.dev/ts-sdk/guides/transitions/
- Run `npx create-smelter-app` and experiment with the starter project
- **REWRITE all 4 overlay components** using Smelter primitives
- Build the StreamScene component (camera + overlays composition)
- Build `useSmelter` hook (init, register camera, register output, lifecycle)
- Test: camera feed with hardcoded overlays composited on top

**Hackathon day:**
- Integrate with live overlay data from dashboard state
- Add transitions (fade in/out on overlay show/hide)
- Connect Smelter MediaStream output → Fishjam custom source
- Polish overlay positioning and styling

---

## REQUIRED READING FOR THE TEAM

| Person | Must read | URL |
|--------|-----------|-----|
| Everyone | Fishjam architecture | https://documentation.fishjam.io/docs/next/explanation/architecture |
| Person A | Gemini Live Integration tutorial | https://documentation.fishjam.io/docs/next/tutorials/gemini-live-integration |
| Person A | Agent internals | https://documentation.fishjam.io/docs/next/explanation/agent-internals |
| Person C | React Quick Start | https://documentation.fishjam.io/docs/next/tutorials/react-quick-start |
| Person C | Custom sources (Smelter→Fishjam) | https://documentation.fishjam.io/docs/next/how-to/client/custom-sources |
| Person D | Smelter WASM quick start | https://smelter.dev/ts-sdk/guides/quick-start-wasm/ |
| Person D | Smelter components reference | https://smelter.dev/ts-sdk/components/view |
| Person D | Smelter transitions | https://smelter.dev/ts-sdk/guides/transitions/ |
| Person D | Smelter+Fishjam example | https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client/minimal-smelter |
| Person D | View styling props | https://smelter.dev/ts-sdk/components/props/view-style-props/ |
| Person D | Text styling props | https://smelter.dev/ts-sdk/components/props/text-style-props/ |

---

## RISK ASSESSMENT UPDATE

### Reduced risks
- **Audio pipeline complexity** — eliminated. Fishjam handles everything.
- **PCM resampling bugs** — eliminated. Fishjam presets match Gemini's format.
- **Smelter↔Fishjam connection** — documented, with example code and a reference app.

### New risks
- **Fishjam Cloud dependency** — we now depend on Fishjam's cloud service (fishjam.io). If it's down, nothing works. Mitigation: have fallback mode that skips Fishjam and uses raw getUserMedia + CSS overlays.
- **Smelter WASM bundle size** — ~15-20MB download. Must be pre-cached. On slow hackathon WiFi, first load will be painful.
- **Smelter component learning curve** — Person D must learn a new component system. Not hard (it's React Native-like), but unfamiliar.
- **Overlay rewrite scope** — all 4 overlay components need rewriting with Smelter components. The layout logic changes (no CSS flexbox/grid — use Smelter's View direction and positioning).

### Mitigation strategy
Keep the current HTML-based overlay components as a **fallback**. If Smelter integration fails on hackathon day, StreamPreview.tsx renders overlays as CSS-positioned divs over a `<video>` element. It looks almost as good — we just lose true video composition. This fallback is already built and working.
