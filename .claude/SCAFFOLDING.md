# StreamGenius Implementation Plan

## Overview

StreamGenius is an AI co-pilot for live streamers that:
1. Captures microphone audio and sends to Gemini Live API
2. Detects intents (YouTube mentions, facts, comparisons) via function calling
3. Fetches data from external APIs (YouTube, Google Search, Wikipedia)
4. Generates overlay proposals for creator approval
5. Renders overlays via **Smelter** (video compositor)
6. Broadcasts composed video via **Fishjam** (WebRTC SFU)

---

## Architecture

```
[Microphone] -> [WebSocket] -> [Backend] -> [Gemini Live API]
                                   |
                                   v (Tool Calls)
                            [Fetchers: YouTube, Search, Wiki]
                                   |
                                   v
[Camera] -> [Smelter Compositor] <- [Overlay Proposals]
                   |
                   v
            [Fishjam WebRTC] -> [Viewers]
```

---

## Project Structure

```
StreamGenius/
├── packages/
│   ├── shared/           # @streamgenius/shared - Types, schemas, validations
│   ├── backend/          # @streamgenius/backend - WebSocket server, Gemini proxy
│   ├── frontend/         # @streamgenius/frontend - React control panel
│   └── overlays/         # @streamgenius/overlays - Smelter overlay components
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── turbo.json
```

---

## Implementation Phases

### Phase 1: Monorepo Foundation

**Files to create:**
- `pnpm-workspace.yaml` - Workspace configuration
- `package.json` - Root package with turbo scripts
- `tsconfig.base.json` - Shared TypeScript config
- `turbo.json` - Build orchestration

**Commands:**
```bash
pnpm init
pnpm add -D turbo typescript
mkdir -p packages/{shared,backend,frontend,overlays}
```

---

### Phase 2: Shared Package

**`packages/shared/src/types/`**

| File | Purpose |
|------|---------|
| `websocket.ts` | Client/Server message types |
| `overlay.ts` | OverlayProposal, YoutubeData, FactData, ComparisonData, ViewerData |
| `session.ts` | Session status types |

**`packages/shared/src/schemas/`**

| File | Purpose |
|------|---------|
| `client-messages.ts` | Zod schemas: `audio_chunk`, `overlay_approve`, `overlay_dismiss` |
| `server-messages.ts` | Zod schemas: `transcript`, `overlay_proposal`, `session_status` |
| `overlay.ts` | OverlayProposal validation |

**Key Types:**
```typescript
// Client -> Server
type ClientMessage =
  | { kind: 'audio_chunk'; data: string }      // Base64 PCM
  | { kind: 'overlay_approve'; id: string }
  | { kind: 'overlay_dismiss'; id: string }

// Server -> Client
type ServerMessage =
  | { kind: 'transcript'; text: string; isFinal: boolean; timestamp: number }
  | { kind: 'overlay_proposal'; proposal: OverlayProposal }
  | { kind: 'session_status'; connected: boolean; sessionId: string; reconnecting: boolean }
```

---

### Phase 3: Backend WebSocket Server

**`packages/backend/src/`**

| File | Purpose |
|------|---------|
| `server.ts` | WebSocket server setup with `ws` |
| `websocket/connection-manager.ts` | Session tracking, Gemini session binding |
| `websocket/message-handler.ts` | Zod validation, message routing |
| `config/index.ts` | Environment configuration |

**Key Implementation:**
- Single persistent WebSocket per client
- Connection manager tracks `Map<sessionId, { ws, geminiSession }>`
- Message handler validates with Zod before processing

---

### Phase 4: Gemini Live API Integration

**`packages/backend/src/gemini/`**

| File | Purpose |
|------|---------|
| `live-session.ts` | Gemini Live API wrapper, audio streaming |
| `tool-definitions.ts` | Function declarations for Gemini |
| `tool-executor.ts` | Execute tools, build overlay proposals |

**Tool Definitions:**
1. `fetch_youtube_video(query, channelName?)` - YouTube card overlay
2. `verify_fact(claim, context?)` - Fact banner overlay
3. `create_comparison(itemA, itemB, aspects?)` - Comparison overlay
4. `highlight_viewer(username, comment)` - Viewer highlight overlay

**Fork Processing Pattern:**
1. Gemini triggers tool call
2. Immediately send `{ status: 'fetching' }` to client
3. Execute fetcher in parallel
4. Send `{ status: 'ready', data: ... }` on completion
5. Return result to Gemini for conversation continuity

---

### Phase 5: Data Fetchers

**`packages/backend/src/fetchers/`**

| File | API | Purpose |
|------|-----|---------|
| `youtube.ts` | YouTube Data API v3 | Video metadata, thumbnails, stats |
| `google-search.ts` | Programmable Search | Fact verification sources |
| `wikipedia.ts` | Wikipedia API | Quick facts lookup |
| `gemini-pro.ts` | Gemini 2.0 Flash | Analysis, comparison generation |

**`packages/backend/src/cache/fallback-cache.ts`**
- Cache successful responses
- Return cached data on API timeout (3s)
- Pre-warm with common queries for demos

---

### Phase 6: Smelter Video Compositor

**Dependencies:**
```bash
cd packages/frontend
pnpm add @swmansion/smelter-web-wasm @swmansion/smelter
```

**Vite Config (WASM support):**
```typescript
// vite.config.ts
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  optimizeDeps: { exclude: ['@swmansion/smelter-web-wasm'] }
});
```

**`packages/frontend/src/components/StreamPreview.tsx`**
- Initialize Smelter with `new Smelter(); await smelter.init()`
- Register camera: `smelter.registerInput('camera', { type: 'camera' })`
- Register output: `smelter.registerOutput('main', <CompositorLayout />, { type: 'stream' })`
- Extract MediaStream for Fishjam

**Compositor Layout:**
```tsx
<View style={{ width: 1920, height: 1080 }}>
  <Rescaler><InputStream inputId="camera" /></Rescaler>
  <OverlayRenderer overlays={displayedOverlays} />
</View>
```

---

### Phase 7: Overlay Components

**`packages/overlays/src/components/`**

| Component | Trigger | Position |
|-----------|---------|----------|
| `YoutubeCardOverlay.tsx` | YouTube mention | Bottom-left |
| `FactBannerOverlay.tsx` | Fact/statistic | Bottom banner |
| `ComparisonOverlay.tsx` | A vs B comparison | Top-left |
| `ViewerHighlightOverlay.tsx` | Viewer comment | Top-right |

**Smelter Styling Requirements:**
- All styles MUST be inline (no CSS classes)
- Use Smelter components: `View`, `Text`, `Image`, `Rescaler`
- Transitions via `transition={{ durationMs: 300 }}`

**State Management (`packages/frontend/src/store/overlayStore.ts`):**
```typescript
// Zustand store
interface OverlayState {
  proposals: Map<string, OverlayProposal>;
  addProposal: (p: OverlayProposal) => void;
  approveOverlay: (id: string) => void;    // ready -> displayed
  dismissOverlay: (id: string) => void;    // any -> dismissed
  scheduleAutoDismiss: (id: string, ms: number) => void;  // 25s default
}
```

**Overlay Lifecycle:**
```
fetching -> ready -> approved -> displayed -> dismissed
                  \-> dismissed (manual)
```

---

### Phase 8: Fishjam Broadcasting

**Backend (`packages/backend/src/services/fishjam.service.ts`):**
```typescript
import { FishjamClient } from '@fishjam-cloud/js-server-sdk';

// Create livestream room
const room = await client.createRoom({ roomType: 'livestream' });
const { token } = await client.createLivestreamStreamerToken(room.id);
```

**Frontend (`packages/frontend/src/hooks/useFishjamBroadcast.ts`):**
```typescript
import { useLivestreamStreamer } from '@fishjam-cloud/react-client';

const { connect } = useLivestreamStreamer();
await connect({
  token: streamerToken,
  inputs: { video: smelterOutputStream, audio: smelterOutputStream }
});
```

**API Routes:**
- `POST /api/fishjam/rooms/create` - Create room, return streamer token
- `POST /api/fishjam/rooms/:id/join` - Get viewer token
- `DELETE /api/fishjam/rooms/:id` - Close room

---

### Phase 9: Frontend Control Panel

**`packages/frontend/src/`**

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main layout, providers |
| `components/ControlPanel.tsx` | Creator dashboard |
| `components/OverlayQueue.tsx` | Pending overlays (fetching/ready) |
| `components/StreamPreview.tsx` | Smelter compositor |
| `components/StreamBroadcaster.tsx` | Fishjam controls |
| `hooks/useWebSocket.ts` | Backend connection |
| `hooks/useAudioCapture.ts` | Microphone -> PCM -> Base64 |

---

### Phase 10: Testing & Polish

**Unit Tests:**
- Zod schema validation
- Overlay state transitions
- Message parsing

**Integration Tests:**
- WebSocket message flow
- Gemini tool call handling
- Fetcher responses

**E2E Tests:**
- Full broadcast flow
- Overlay approval cycle
- Reconnection handling

---

## Environment Variables

```env
# Backend
PORT=3001
GEMINI_API_KEY=xxx
YOUTUBE_API_KEY=xxx
GOOGLE_SEARCH_API_KEY=xxx
GOOGLE_SEARCH_CX=xxx
FISHJAM_ID=xxx
FISHJAM_MANAGEMENT_TOKEN=xxx

# Frontend
VITE_WS_URL=ws://localhost:3001
VITE_FISHJAM_ID=xxx
```

---

## Critical Files Summary

| File | Purpose |
|------|---------|
| `packages/shared/src/schemas/client-messages.ts` | WebSocket contract validation |
| `packages/backend/src/gemini/live-session.ts` | Gemini Live API orchestration |
| `packages/backend/src/gemini/tool-executor.ts` | Fork processing, overlay proposals |
| `packages/frontend/src/components/StreamPreview.tsx` | Smelter compositor integration |
| `packages/frontend/src/store/overlayStore.ts` | Overlay lifecycle state machine |
| `packages/frontend/src/hooks/useFishjamBroadcast.ts` | WebRTC broadcasting |
| `packages/overlays/src/components/OverlayRenderer.tsx` | Overlay rendering dispatch |

---

## Verification

1. **Backend WebSocket:** `wscat -c ws://localhost:3001` - send `{"kind":"audio_chunk","data":"..."}`
2. **Gemini Integration:** Speak "show me a React tutorial on YouTube" - verify overlay proposal
3. **Smelter Rendering:** Approve overlay - verify it appears on video preview
4. **Fishjam Broadcast:** Start broadcast - verify stream accessible via viewer token
5. **E2E Flow:** Full cycle from speech -> overlay -> broadcast

---

## Dependencies

**Backend:**
- `ws` - WebSocket server
- `@google/genai` - Gemini Live API
- `zod` - Schema validation

**Frontend:**
- `@swmansion/smelter-web-wasm` - Video compositor
- `@fishjam-cloud/react-client` - WebRTC client
- `zustand` - State management

**Shared:**
- `zod` - Type-safe validation
