# StreamGenius

AI co-pilot for live streams & video production.

```
streamgenius/
├── client/         ← React + Smelter WASM + Fishjam (runs in browser)
├── server/         ← Fishjam Agent + Gemini Live + overlay WebSocket
├── CLAUDE.md       ← Full project context for AI agents
└── INTEGRATION.md  ← Smelter + Fishjam API research
```

## Quick start (mock mode — no API keys needed)

```bash
# Terminal 1 — server (mock mode sends fake overlay proposals)
cd server
cp .env.example .env
npm install
npm run dev

# Terminal 2 — client
cd client
npm install
# Copy Smelter WASM binary to public directory
cp node_modules/@swmansion/smelter-browser-render/dist/smelter.wasm public/smelter.wasm
npm run dev
```

Client: http://localhost:5173
Server: ws://localhost:3001

Mock mode sends fake overlay proposals every 8 seconds so you can
develop the full frontend without Fishjam or Gemini credentials.

## Real mode (with Fishjam + Gemini)

1. Sign up at https://fishjam.io/app → get FISHJAM_ID and FISHJAM_TOKEN
2. Get a Google API key with Gemini access
3. Get a YouTube Data API key from Google Cloud Console
4. Edit server/.env:
   ```
   MOCK_MODE=false
   FISHJAM_ID=your_id
   FISHJAM_TOKEN=your_token
   GOOGLE_API_KEY=your_key
   YOUTUBE_API_KEY=your_key
   ```
5. Restart the server

## For AI agents

Read `CLAUDE.md` for full project context, architecture decisions,
and prioritized task list. Read `INTEGRATION.md` for Smelter and
Fishjam API research.
