# CLAUDE.md — StreamGenius v2

> Read INTEGRATION.md first for the full Smelter + Fishjam API research.
> This file covers project structure, what's built, and what to do next.

## What is this

AI co-pilot for live streams. Host speaks → Gemini detects intent via function calling → backend fetches content → overlay proposed in dashboard → host approves → Smelter composites onto video → Fishjam broadcasts to viewers.

Hackathon: Software Mansion x Gemini, March 28 2026, Kraków. Track 2: Real-Time Multimodal AI.

## Key architecture decisions

1. **Fishjam handles ALL audio.** No custom AudioWorklet or PCM resampling. The Fishjam Agent receives room audio and forwards to Gemini Live API using their native integration helper.
2. **Smelter runs in browser (WASM).** Camera → Smelter compositor → MediaStream output → Fishjam custom source → broadcast to viewers.
3. **Smelter components are NOT HTML.** Use `View`, `Text`, `Image`, `InputStream`, `Rescaler` from `@swmansion/smelter`. No `<div>`, `<span>`, `<table>` inside the video composition.
4. **Dashboard UI IS HTML.** The action queue, transcript panel, status bar are regular React components with HTML elements. They exist outside Smelter.
5. **Two communication channels.** Fishjam Agent WebSocket = audio. Our own WebSocket = overlay proposals.
6. **Visual overlays only.** No AI voice output. Gemini is audio-in, text/function-call-out.

## Project structure

```
streamgenius/
├── client/                    ← React + Vite + Smelter WASM + Fishjam React
│   ├── src/
│   │   ├── main.tsx           ← Entry, wraps in FishjamProvider
│   │   ├── App.tsx            ← Split-screen: preview+transcript | queue+overlays
│   │   ├── FishjamProvider.tsx ← Fishjam React client setup (create() API)
│   │   ├── SmelterScene.tsx   ← VIDEO COMPOSITION (Smelter components only)
│   │   ├── store.ts           ← useReducer: overlay state machine + transcript
│   │   ├── types.ts           ← Shared types (keep in sync with server)
│   │   ├── hooks/
│   │   │   ├── useSmelter.ts  ← Init WASM, register camera, output MediaStream
│   │   │   └── useOverlaySocket.ts ← WebSocket for overlay proposals
│   │   ├── overlays/          ← SMELTER COMPONENTS (View/Text/Image only)
│   │   │   ├── YoutubeCard.tsx
│   │   │   ├── FactBanner.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── ViewerHighlight.tsx
│   │   └── dashboard/         ← REGULAR REACT HTML
│   │       ├── StatusBar.tsx
│   │       ├── TranscriptPanel.tsx
│   │       ├── ActionQueue.tsx
│   │       └── ActiveOverlays.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                    ← Node.js: Fishjam Agent + Gemini + overlay WS
│   ├── src/
│   │   ├── main.ts            ← Entry: starts agent + overlay WS server
│   │   ├── agent.ts           ← Fishjam Agent ↔ Gemini Live API bridge
│   │   ├── overlay-server.ts  ← WebSocket server for overlay proposals
│   │   ├── types.ts           ← Shared types (keep in sync with client)
│   │   └── fetchers/
│   │       ├── index.ts       ← Routes function name → fetcher
│   │       ├── youtube.ts     ← IMPLEMENTED (YouTube Data API v3)
│   │       ├── fact.ts        ← IMPLEMENTED (Google Search + Gemini Pro)
│   │       ├── comparison.ts  ← IMPLEMENTED (Gemini Pro structured JSON)
│   │       └── viewer.ts      ← MOCK (needs Fishjam data channel)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── CLAUDE.md                  ← YOU ARE HERE
├── INTEGRATION.md             ← Smelter + Fishjam API research (READ FIRST)
└── README.md
```

## NPM packages

### Client
- `@fishjam-cloud/react-client` — Fishjam React hooks (useCustomSource, usePeers, etc.)
- `@swmansion/smelter` — Smelter React components (View, Text, Image, InputStream)
- `@swmansion/smelter-web-wasm` — Smelter WASM runtime for browser
- `react`, `react-dom` — React 19
- `vite`, `@vitejs/plugin-react` — bundler

### Server
- `@fishjam-cloud/js-server-sdk` — Fishjam server SDK (Agent, room management)
- `@google/genai` — Google Gemini SDK
- `ws` — WebSocket server for overlay messages
- `uuid` — overlay proposal IDs
- `tsx` — TypeScript execution

## Environment variables (server/.env)

```
FISHJAM_ID=           # from https://fishjam.io/app
FISHJAM_TOKEN=        # from https://fishjam.io/app
GOOGLE_API_KEY=       # Gemini API key (hackathon credits)
YOUTUBE_API_KEY=      # from Google Cloud Console (free)
GOOGLE_SEARCH_API_KEY= # optional (free)
GOOGLE_SEARCH_CX=     # optional (free)
```

## Data flow

```
Host browser                          Server                        External
───────────                          ──────                        ────────
Mic audio ──→ Fishjam room ──→ Fishjam Agent ──→ Gemini Live API
                                       │                              │
                                       │         ←── function call ───┘
                                       │
                                       ├──→ Content fetcher (YouTube/Search/Gemini Pro)
                                       │
                                       ├──→ overlay_proposal {fetching} ──→ Browser dashboard
                                       │
                                       ├──→ overlay_proposal {ready} ──→ Browser dashboard
                                       │
Host clicks approve ──────────────────────────────────────→ Store dispatch
                                                              │
                                                   SmelterScene re-renders
                                                              │
                                                   Smelter WASM composites
                                                   overlay onto camera
                                                              │
                                                   MediaStream output
                                                              │
                                                   Fishjam custom source
                                                              │
                                                   WebRTC broadcast ──→ Viewers
```

## What's built vs TODO

### DONE
- [x] Full client app structure with Smelter + Fishjam integration
- [x] SmelterScene composition (camera + dynamic overlays)
- [x] 4 overlay components using Smelter primitives (View/Text/Image)
- [x] useSmelter hook (WASM init → camera → MediaStream output)
- [x] Fishjam provider with useCustomSource for Smelter→Fishjam bridge
- [x] Dashboard UI (StatusBar, TranscriptPanel, ActionQueue, ActiveOverlays)
- [x] Overlay state machine (useReducer)
- [x] Overlay WebSocket hook
- [x] Server: Fishjam Agent + Gemini Live bridge with function calling
- [x] Server: overlay WebSocket server
- [x] Server: all 4 fetchers (YouTube implemented, others use Gemini Pro)
- [x] Gemini system prompt + 4 tool schemas
- [x] Types shared between client and server

### TODO — Pre-hackathon
- [ ] Run `cd client && npm install && npm run dev` — verify Vite starts
- [ ] Run `cd server && npm install` — verify deps install
- [ ] Copy Smelter WASM file to `client/public/smelter.wasm` (from node_modules after install)
- [ ] Sign up at https://fishjam.io/app — get FISHJAM_ID + FISHJAM_TOKEN
- [ ] Get YouTube API key from Google Cloud Console
- [ ] Test YouTube fetcher standalone: `YOUTUBE_API_KEY=xxx tsx server/src/fetchers/youtube.ts`
- [ ] Add mock mode to server: send fake overlay proposals on timer (for frontend dev without Gemini)
- [ ] Polish overlay styling in SmelterScene (test with create-smelter-app first)
- [ ] Add overlay transition animations (Smelter supports `transition` prop)
- [ ] Add auto-dismiss timer (overlays disappear after 20s)
- [ ] Build fallback cache (pre-warmed responses for demo topics)
- [ ] Test Smelter WASM renders correctly with camera input

### TODO — Hackathon day
- [ ] Set GOOGLE_API_KEY with hackathon credits
- [ ] Start server → agent connects to Fishjam + Gemini
- [ ] Start client → joins Fishjam room, Smelter starts compositing
- [ ] Test end-to-end: speak → function call → overlay on stream
- [ ] Tune Gemini system prompt (reduce false positive triggers)
- [ ] Run demo script 2-3 times
- [ ] Polish + pitch rehearsal

## Smelter WASM setup note

After `npm install` in client/, you need to copy the WASM file:
```bash
cp node_modules/@swmansion/smelter-browser-render/dist/smelter.wasm public/smelter.wasm
```
Without this, Smelter init will fail. The WASM file is ~15-20MB.
Add a `postinstall` script to automate this.

## Key reference docs

| Topic | URL |
|-------|-----|
| Smelter WASM quick start | https://smelter.dev/ts-sdk/guides/quick-start-wasm/ |
| Smelter components | https://smelter.dev/ts-sdk/components/view |
| Smelter transitions | https://smelter.dev/ts-sdk/guides/transitions/ |
| Fishjam Gemini integration | https://documentation.fishjam.io/docs/next/tutorials/gemini-live-integration |
| Fishjam custom sources (Smelter→Fishjam) | https://documentation.fishjam.io/docs/next/how-to/client/custom-sources |
| Fishjam Agent internals | https://documentation.fishjam.io/docs/next/explanation/agent-internals |
| Fishjam React quick start | https://documentation.fishjam.io/docs/next/tutorials/react-quick-start |
| Smelter+Fishjam example app | https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client/minimal-smelter |
