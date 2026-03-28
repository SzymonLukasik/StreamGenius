import { useEffect, useRef, useCallback } from "react";
import type { ServerMessage, ClientMessage } from "../types";
import type { Action } from "../store";

const WS_URL = import.meta.env.VITE_OVERLAY_WS_URL || "ws://localhost:3001";

export function useOverlaySocket(dispatch: React.Dispatch<Action>) {
  const wsRef = useRef<WebSocket | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg: ServerMessage = JSON.parse(event.data);
        switch (msg.kind) {
          case "transcript":
            dispatchRef.current({
              type: "TRANSCRIPT",
              text: msg.text,
              isFinal: msg.isFinal,
              timestamp: msg.timestamp,
            });
            break;
          case "overlay_proposal":
            dispatchRef.current({ type: "OVERLAY_PROPOSAL", proposal: msg.proposal });
            break;
          case "session_status":
            dispatchRef.current({
              type: "SESSION_STATUS",
              connected: msg.connected,
              geminiConnected: msg.geminiConnected,
              fishjamId: msg.fishjamId,
              peerToken: msg.peerToken,
            });
            break;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        dispatchRef.current({ type: "SESSION_STATUS", connected: false, geminiConnected: false });
        retryTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
