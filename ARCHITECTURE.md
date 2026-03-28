# ARCHITECTURE.md — StreamGenius v2

## Overview

StreamGenius is an AI co-pilot for live streams. It listens to the host's speech in real time, detects topics worth visualizing, fetches relevant content, and composites graphic overlays onto the video feed — all live.

```
Host speaks into mic
        │
        ▼
  ┌─────────────┐        ┌──────────────────┐
  │  Fishjam     │ audio  │  Fishjam Agent   │
  │  WebRTC Room │───────▶│  (server)        │
  └─────────────┘        └────────┬─────────┘
                                  │ PCM audio
                                  ▼
                         ┌────────────────┐
                         │ Gemini Live API │
                         │ (native audio) │
                         └───┬────────┬───┘
                  transcript │        │ function calls
                             ▼        ▼
                    ┌──────────┐  ┌──────────────┐
                    │ Overlay  │  │  Fetchers     │
                    │ WebSocket│  │  (YouTube,    │
                    │ :3001    │  │   Gemini Pro) │
                    └────┬─────┘  └──────┬───────┘
                         │               │
                         ▼               ▼
                    ┌─────────────────────────┐
                    │   Browser Dashboard      │
                    │   (approve / skip)        │
                    └────────────┬──────────────┘
                                 │ approved
                                 ▼
                    ┌─────────────────────────┐
                    │  Smelter WASM Compositor │
                    │  camera + overlays       │
                    └────────────┬──────────────┘
                                 │ MediaStream
                                 ▼
                         Fishjam broadcast
                         to all viewers
```

## Two rendering worlds

The app has two distinct rendering contexts that must not be mixed:

| Context | Technology | Elements | Where |
|---------|-----------|----------|-------|
| **Video composition** | Smelter WASM | `View`, `Text`, `Image`, `InputStream`, `Rescaler` | [SmelterScene.tsx](client/src/SmelterScene.tsx), [overlays/](client/src/overlays/) |
| **Dashboard UI** | React DOM | `<div>`, `<button>`, `<span>`, etc. | [dashboard/](client/src/dashboard/) |

Smelter components look like React but render to a WebGL canvas via a custom reconciler. They do **not** support CSS — only Smelter's `ViewStyleProps` (no `position`, no `margin*`, `left`/`right` are mutually exclusive).

---

## Client architecture

### Entry & providers

- [main.tsx](client/src/main.tsx) — React root, renders `<App />`
- [App.tsx](client/src/App.tsx) — Top-level component. Waits for `fishjamId` from server before mounting `<FishjamProvider>` (line 18-24). Splits into `<AppContent>` which wires up Fishjam room join, mic, Smelter, and the dashboard layout.
- [FishjamProvider.tsx](client/src/FishjamProvider.tsx) — Thin wrapper around `@fishjam-cloud/react-client`. Re-exports `useCustomSource` and `usePeers`.

### Room join & microphone (App.tsx)

Two-phase connection to avoid stale closures:

1. **Join room** — [App.tsx:49-57](client/src/App.tsx#L49-L57): Effect fires once `peerToken` arrives from server. Uses `joinedRef` guard.
2. **Start mic** — [App.tsx:61-68](client/src/App.tsx#L61-L68): Separate effect waits for `peerStatus === "connected"` before calling `toggleMicrophone()`. Uses `micStartedRef` guard.

`toggleMicrophone()` both captures the device AND publishes to the room (unlike `startMicrophone()` which only captures locally).

### State management

[store.ts](client/src/store.ts) — Single `useReducer` managing all app state.

**State shape** (line 11-18):
```
overlays[]          — overlay proposals in various lifecycle stages
transcript[]        — buffered transcript segments
serverConnected     — overlay WebSocket status
geminiConnected     — Gemini Live API status
fishjamId           — room credentials from server
peerToken           — peer credentials from server
```

**Actions**: `OVERLAY_PROPOSAL`, `OVERLAY_APPROVE`, `OVERLAY_SKIP`, `OVERLAY_DISMISS`, `TRANSCRIPT`, `SESSION_STATUS`

**Selectors** (line 117-130):
- `getPending()` — overlays with `status: "ready"` awaiting user decision
- `getFetching()` — overlays still loading content
- `getActive()` — approved overlays currently on screen

### Overlay WebSocket

[useOverlaySocket.ts](client/src/hooks/useOverlaySocket.ts) — Connects to `ws://localhost:3001`. Auto-reconnects on close (2s delay). Dispatches incoming messages (`transcript`, `overlay_proposal`, `session_status`) to the store reducer. Exposes `send()` for approve/dismiss messages.

The `dispatchRef` pattern (line 10) avoids stale closure issues with the WebSocket `onmessage` handler.

### Video composition (Smelter)

[useSmelter.ts](client/src/hooks/useSmelter.ts) — Initializes the Smelter WASM runtime:

1. `setWasmBundleUrl("/smelter.wasm")` — line 8
2. Creates `SmelterInstance` — line 45
3. Registers camera input as `"camera"` — line 52
4. Registers output with the scene component — line 55-63
5. Calls `smelter.start()` — line 67
6. Returns `{ stream, previewRef, ready, error }`

The output `MediaStream` is displayed in a `<video>` preview and (when re-enabled) fed to Fishjam via `useCustomSource`.

[SmelterScene.tsx](client/src/SmelterScene.tsx) — The composition tree:

```
View (root, 1280x720)
├── Rescaler (full frame)
│   └── InputStream "camera"
├── View (lower-third stack, bottom-left)      ← line 30-46
│   └── [active overlays with 300ms transitions]
└── View (top-right branding badge)            ← line 49-67
    └── Text "StreamGenius"
```

`OverlaySwitch` (line 72-85) routes each overlay's `type` to its renderer component.

### Overlay components (Smelter primitives only)

| Component | File | Purpose |
|-----------|------|---------|
| `YoutubeCard` | [YoutubeCard.tsx](client/src/overlays/YoutubeCard.tsx) | Video title, thumbnail, channel, view count |
| `FactBanner` | [FactBanner.tsx](client/src/overlays/FactBanner.tsx) | Claim + verified/disputed badge with optional correction |
| `ComparisonTable` | [ComparisonTable.tsx](client/src/overlays/ComparisonTable.tsx) | Side-by-side item comparison with dynamic rows |
| `ViewerHighlight` | [ViewerHighlight.tsx](client/src/overlays/ViewerHighlight.tsx) | Pinned viewer comment with avatar + relevance reason |

All use `View` and `Text` from `@swmansion/smelter`. No HTML elements.

### Dashboard components (React DOM)

| Component | File | Purpose |
|-----------|------|---------|
| `StatusBar` | [StatusBar.tsx](client/src/dashboard/StatusBar.tsx) | Connection indicators (server, Gemini, Smelter) + active overlay count |
| `TranscriptPanel` | [TranscriptPanel.tsx](client/src/dashboard/TranscriptPanel.tsx) | Scrolling live transcript with partial/final styling |
| `ActionQueue` | [ActionQueue.tsx](client/src/dashboard/ActionQueue.tsx) | Pending overlays with Show/Skip buttons + fetching indicators |
| `ActiveOverlays` | [ActiveOverlays.tsx](client/src/dashboard/ActiveOverlays.tsx) | Currently displayed overlays with Hide button |

---

## Server architecture

### Entry point

[main.ts](server/src/main.ts) — Starts the overlay WebSocket server on port 3001, then either launches the real Fishjam+Gemini agent or falls back to mock mode (`MOCK_MODE=true`).

### Fishjam Agent + Gemini bridge

[agent.ts](server/src/agent.ts) — The core of the server. Orchestrates:

1. **Room creation** — line 126: `fishjamClient.createRoom()`
2. **Peer for host browser** — line 131: `fishjamClient.createPeer(room.id)` → returns `peerToken`
3. **Agent creation** — line 132-138: Fishjam Agent subscribes to room audio, outputs 16kHz PCM
4. **Room event monitoring** — line 120-123: `FishjamWSNotifier` logs peer/track lifecycle events
5. **Gemini Live API session** — line 154-214: Connects with native audio model, function calling tools, and input transcription

**Gemini config** (line 154-161):
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Response modality: `AUDIO` (required by native audio model; audio responses are ignored)
- System instruction: conservative trigger rules (line 85-96)
- Tools: 4 function declarations (line 10-74)
- Input audio transcription enabled

**Audio forwarding** — line 227-237: Agent `trackData` events → base64-encoded → `session.sendRealtimeInput()`. Logged every 100 chunks.

**Transcript buffering** — line 149-151, 188-211: Accumulates ~10 seconds of transcribed text before broadcasting a final segment. Sends partial updates for UI responsiveness.

**Function call handling** — line 172-184: When Gemini emits a `toolCall`, each function call is routed to `handleFunctionCall()`.

### Function call handler

[agent.ts:247-295](server/src/agent.ts#L247-L295) — The "fork pattern":

1. **Fork A** (immediate): Broadcasts `overlay_proposal { status: "fetching" }` to the browser
2. **Fork B** (async): Calls `executeFetcher()` to get content data
3. On success: sends Gemini a tool response + broadcasts `{ status: "ready", data }`
4. On failure: broadcasts `{ status: "error" }`

### Content fetchers

[fetchers/index.ts](server/src/fetchers/index.ts) — Routes Gemini function names to fetcher implementations (line 7-23).

| Fetcher | File | Data source | Status |
|---------|------|-------------|--------|
| `show_youtube_card` | [youtube.ts](server/src/fetchers/youtube.ts) | YouTube Data API v3 (search + statistics) | Real API |
| `verify_fact` | [fact.ts](server/src/fetchers/fact.ts) | Google Custom Search + Gemini Flash 2.0 | Real API |
| `create_comparison` | [comparison.ts](server/src/fetchers/comparison.ts) | Gemini Flash 2.0 (structured JSON) | Real API |
| `pin_viewer_comment` | [viewer.ts](server/src/fetchers/viewer.ts) | Hardcoded mock comments | Mock |

### Overlay WebSocket server

[overlay-server.ts](server/src/overlay-server.ts) — Plain `ws` server on port 3001. Maintains a client set and broadcasts `ServerMessage` JSON to all connected browsers.

Key detail: caches the latest `session_status` message (line 46-49) and replays it to newly connecting clients (line 21-22), so late-joining browsers receive `fishjamId` and `peerToken`.

---

## Shared types

[client/src/types.ts](client/src/types.ts) and [server/src/types.ts](server/src/types.ts) must stay synchronized manually. They define:

- `OverlayType` — `"youtube_card" | "fact_banner" | "comparison" | "viewer_highlight"`
- `OverlayProposal` — id, type, status, trigger, timestamp, data
- `ServerMessage` — `transcript | overlay_proposal | session_status`
- `ClientMessage` — `overlay_approve | overlay_dismiss`
- Data interfaces: `YoutubeData`, `FactData`, `ComparisonData`, `ViewerHighlightData`

---

## Communication channels

| Channel | Transport | Port | Purpose |
|---------|-----------|------|---------|
| Host audio | Fishjam WebRTC | Fishjam Cloud | Mic → room → agent → Gemini |
| Overlay protocol | WebSocket | 3001 | Proposals, transcripts, session status |
| Viewer video | Fishjam WebRTC | Fishjam Cloud | Smelter output → broadcast |

---

## Overlay lifecycle

```
Gemini function call
        │
        ▼
  ┌─────────────┐
  │  fetching    │ ← proposal broadcast immediately
  └──────┬──────┘
         │ fetcher completes
         ▼
  ┌─────────────┐
  │   ready      │ ← appears in ActionQueue
  └──────┬──────┘
    Skip │    │ Approve
         ▼    ▼
  ┌────────┐ ┌───────────┐
  │ skipped│ │  approved  │ ← rendered in SmelterScene
  └────────┘ └─────┬─────┘
                    │ Dismiss (manual or auto-timer)
                    ▼
              ┌───────────┐
              │ dismissed  │ ← removed from scene
              └───────────┘
```

---

## Environment variables

| Variable | Required | Used by |
|----------|----------|---------|
| `FISHJAM_ID` | Yes | agent.ts — room creation |
| `FISHJAM_TOKEN` | Yes | agent.ts — management token |
| `GOOGLE_API_KEY` | Yes | agent.ts (Gemini Live), fact.ts, comparison.ts |
| `YOUTUBE_API_KEY` | Yes | youtube.ts |
| `GOOGLE_SEARCH_API_KEY` | No | fact.ts (falls back to model knowledge) |
| `GOOGLE_SEARCH_CX` | No | fact.ts (Custom Search engine ID) |
| `MOCK_MODE` | No | main.ts — skip real agent, send fake proposals |
| `PORT` | No | main.ts — overlay WS port (default 3001) |

---

## Key constraints & gotchas

1. **React 18 required** — Smelter's bundled reconciler uses `ReactCurrentOwner` removed in React 19.
2. **WASM file must be copied** — `cp node_modules/@swmansion/smelter-browser-render/dist/smelter.wasm public/smelter.wasm` after install.
3. **Cross-origin isolation** — Smelter WASM needs `SharedArrayBuffer`, requiring COOP/COEP headers in [vite.config.ts](client/vite.config.ts).
4. **Smelter styling** — No CSS. `left`/`right` are mutually exclusive. No `position` or `margin*`. Only `"linear"`, `"bounce"`, or cubic bezier easing.
5. **Native audio model** — `responseModalities` must include `Modality.AUDIO` even though we ignore audio output.
6. **toggleMicrophone vs startMicrophone** — Only `toggleMicrophone()` publishes to the room.
7. **Custom source disabled** — [App.tsx:82-89](client/src/App.tsx#L82-L89) — Smelter→Fishjam bridge commented out due to "track already added" errors.
