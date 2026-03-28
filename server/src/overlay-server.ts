import { WebSocketServer, WebSocket } from "ws";
import type { ServerMessage, ClientMessage } from "./types.js";

export interface OverlayServer {
  broadcast: (msg: ServerMessage) => void;
  wss: WebSocketServer;
}

export function startOverlayServer(port: number): OverlayServer {
  const wss = new WebSocketServer({ port });
  const clients = new Set<WebSocket>();

  // Store the latest session_status so new clients get the full state
  let lastSessionStatus: ServerMessage | null = null;

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("[overlay-ws] Browser connected");

    // Send the latest session status (with fishjamId/peerToken if agent is running)
    if (lastSessionStatus) {
      send(ws, lastSessionStatus);
    } else {
      send(ws, {
        kind: "session_status",
        connected: true,
        geminiConnected: false,
      });
    }

    ws.on("message", (raw) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());
        console.log(`[overlay-ws] ${msg.kind}: ${msg.id}`);
      } catch {}
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("[overlay-ws] Browser disconnected");
    });
  });

  console.log(`[overlay-ws] Listening on port ${port}`);

  function broadcast(msg: ServerMessage) {
    // Cache session_status messages so new clients get the latest
    if (msg.kind === "session_status") {
      lastSessionStatus = msg;
    }

    const data = JSON.stringify(msg);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  return { broadcast, wss };
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
