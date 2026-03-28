# NEXT_STEPS.md — StreamGenius

Status as of 2026-03-28. Transcript + overlay pipeline is working end-to-end.

## What's working

- Host mic -> Fishjam room -> Agent -> Gemini Live API (audio flowing)
- Gemini input transcription -> overlay WebSocket -> browser transcript panel
- Gemini function calls -> content fetchers -> overlay proposals in dashboard
- 4 overlay components rendering in Smelter (View/Text/Image primitives)
- Dashboard UI: StatusBar, TranscriptPanel, ActionQueue, ActiveOverlays
- Mock mode (MOCK_MODE=true) for frontend dev without API keys
- All 4 fetchers implemented: YouTube (real API), fact/comparison (Gemini Pro), viewer (mock)

## Priority 1 — Demo-critical

### 1. Re-enable Smelter -> Fishjam custom source
**File:** `client/src/App.tsx:82-89` (currently commented out)

The composed Smelter video (camera + overlays) needs to be fed into Fishjam
as a custom source so viewers see the overlay-composited stream. Currently
disabled due to "track already added" errors — the mic track and custom
source conflict. Fix: set the custom source stream only after mic is fully
started, possibly with a small delay or by using the `setStream` guard.

### 2. Auto-dismiss timer for overlays
Overlays stay on screen indefinitely. Add a 20-second auto-dismiss:
- In `store.ts`: add a timeout per overlay that dispatches `OVERLAY_DISMISS`
- Or in `App.tsx`: `setTimeout(() => handleDismiss(id), 20_000)` when approving

### 3. Tune Gemini system prompt
**File:** `server/src/agent.ts` — `SYSTEM_INSTRUCTION`

Test with real speech and adjust:
- Reduce false positive triggers (currently may fire too often)
- Test with hackathon demo script topics
- Consider adding a cooldown between function calls

### 4. Build fallback cache for demo topics
Pre-warm responses for planned demo topics so the demo doesn't depend on
live API latency. Store canned overlay data in `server/src/mock.ts` or a
separate cache file, keyed by function name + args.

## Priority 2 — Polish

### 5. YouTube thumbnail image registration
**File:** `client/src/overlays/YoutubeCard.tsx`

The `<Image imageId="yt-thumb" />` component references a Smelter image
that's never registered. Need to call `smelter.registerImage("yt-thumb", { url })`
when a YouTube overlay is approved, or switch to a placeholder.

### 6. Overlay transition animations
`SmelterScene.tsx` already has `transition={{ durationMs: 300, easingFunction: "linear" }}`
but this needs testing with actual overlay show/hide. Consider:
- Slide-up entrance from bottom
- Fade-out on dismiss
- `"bounce"` easing for attention

### 7. Remove debug logging
Before the demo, clean up verbose logging in:
- `server/src/agent.ts` — emit override, chunk counters, Gemini message keys, notifier events
- `client/src/App.tsx` — peerStatus/micOn debug logs

### 8. Add postinstall script for WASM
**File:** `client/package.json`

```json
"scripts": {
  "postinstall": "cp node_modules/@swmansion/smelter-browser-render/dist/smelter.wasm public/smelter.wasm"
}
```

## Priority 3 — Nice to have

### 9. Real viewer comments (Fishjam data channel)
**File:** `server/src/fetchers/viewer.ts`

Currently returns mock comments. To make `pin_viewer_comment` work for real:
- Set up a Fishjam data channel for viewer chat messages
- Store recent messages in a ring buffer
- When Gemini calls `pin_viewer_comment`, search buffer for relevant message

### 10. Viewer page
No viewer-facing page exists yet. Viewers would join the same Fishjam room
and see the composed stream. Needs a simple page with `usePeers()` to
display the host's video track.

### 11. Error recovery
- Reconnect Gemini session if it disconnects mid-stream
- Handle Fishjam room expiry (sandbox rooms may timeout)
- Show user-facing error in StatusBar when agent/Gemini goes down
