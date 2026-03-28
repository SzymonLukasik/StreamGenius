# StreamGenius

AI co-pilot for live streaming that automatically generates and manages overlay graphics in real-time.

## Overview

StreamGenius listens to streamer audio, detects intents using Gemini Live API, and proposes overlay graphics (YouTube cards, fact banners, comparisons, viewer highlights) that the streamer can approve with a single click.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers (frontend + backend)
pnpm dev

# Run Overlay Playground (Test environment for stream graphics)
pnpm --filter @streamgenius/overlays playground

# Or run individual packages
pnpm --filter @streamgenius/frontend dev
pnpm --filter @streamgenius/backend dev
```

## Project Structure

```
packages/
  shared/     # @streamgenius/shared - Types, validators, WebSocket contracts
  backend/    # @streamgenius/backend - Node.js WebSocket hub + Gemini proxy
  frontend/   # @streamgenius/frontend - Vite + React control panel
  overlays/   # @streamgenius/overlays - Smelter overlay components
```

## Packages

### @streamgenius/shared
Shared types and Zod validators for WebSocket message contracts.

### @streamgenius/backend
WebSocket server that:
- Receives audio chunks from the frontend
- Proxies audio to Gemini Live API
- Executes tool calls (YouTube, Google Search)
- Broadcasts overlay proposals to clients

### @streamgenius/frontend
React control panel for streamers:
- Audio capture and streaming
- Live transcript display
- Overlay approval/dismissal queue

### @streamgenius/overlays
React components designed for Smelter video compositor:
- YoutubeCardOverlay
- FactBannerOverlay
- ComparisonOverlay
- ViewerHighlightOverlay

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
GEMINI_API_KEY=         # Google AI Studio API key
YOUTUBE_API_KEY=        # YouTube Data API v3 key
GOOGLE_SEARCH_API_KEY=  # Google Custom Search API key
GOOGLE_SEARCH_CX=       # Custom Search Engine ID
PORT=3001               # HTTP server port
WS_PORT=3002            # WebSocket server port
```

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format

# Build all packages
pnpm build
```

## Branch Conventions

- `master` - Production-ready code
- `develop` - Integration branch
- `feature/<package>/<description>` - Feature branches
- `fix/<package>/<description>` - Bug fixes

## Architecture

See [DOKUMENTACJA.md](.claude/DOKUMENTACJA.md) for full architectural documentation (in Polish).

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Package Manager**: pnpm workspaces
- **Frontend**: React 18, Vite, Zustand
- **Backend**: Node.js, ws, Zod
- **AI**: Gemini Live API, Gemini Pro
- **Video**: Smelter (compositor), Fishjam (broadcasting)
