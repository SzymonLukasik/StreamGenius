import { useReducer } from "react";
import type { OverlayProposal } from "./types";

// --- State ---

export interface OverlayItem {
  proposal: OverlayProposal;
  displayStatus: "approved" | "displayed" | "dismissed" | "skipped" | null;
}

export interface AppState {
  overlays: OverlayItem[];
  transcript: { text: string; isFinal: boolean; timestamp: number }[];
  serverConnected: boolean;
  geminiConnected: boolean;
  fishjamId: string | null;
  peerToken: string | null;
}

const initialState: AppState = {
  overlays: [],
  transcript: [],
  serverConnected: false,
  geminiConnected: false,
  fishjamId: null,
  peerToken: null,
};

// --- Actions ---

export type Action =
  | { type: "OVERLAY_PROPOSAL"; proposal: OverlayProposal }
  | { type: "OVERLAY_APPROVE"; id: string }
  | { type: "OVERLAY_SKIP"; id: string }
  | { type: "OVERLAY_DISMISS"; id: string }
  | { type: "TRANSCRIPT"; text: string; isFinal: boolean; timestamp: number }
  | { type: "SESSION_STATUS"; connected: boolean; geminiConnected: boolean; fishjamId?: string; peerToken?: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "OVERLAY_PROPOSAL": {
      const idx = state.overlays.findIndex(
        (o) => o.proposal.id === action.proposal.id
      );
      if (idx >= 0) {
        const updated = [...state.overlays];
        updated[idx] = { ...updated[idx], proposal: action.proposal };
        return { ...state, overlays: updated };
      }
      return {
        ...state,
        overlays: [
          ...state.overlays,
          { proposal: action.proposal, displayStatus: null },
        ],
      };
    }
    case "OVERLAY_APPROVE":
      return {
        ...state,
        overlays: state.overlays.map((o) =>
          o.proposal.id === action.id ? { ...o, displayStatus: "approved" } : o
        ),
      };
    case "OVERLAY_SKIP":
      return {
        ...state,
        overlays: state.overlays.map((o) =>
          o.proposal.id === action.id ? { ...o, displayStatus: "skipped" } : o
        ),
      };
    case "OVERLAY_DISMISS":
      return {
        ...state,
        overlays: state.overlays.map((o) =>
          o.proposal.id === action.id
            ? { ...o, displayStatus: "dismissed" }
            : o
        ),
      };
    case "TRANSCRIPT": {
      const entry = {
        text: action.text,
        isFinal: action.isFinal,
        timestamp: action.timestamp,
      };
      if (!action.isFinal && state.transcript.length > 0) {
        const last = state.transcript[state.transcript.length - 1];
        if (!last.isFinal) {
          return {
            ...state,
            transcript: [...state.transcript.slice(0, -1), entry],
          };
        }
      }
      return { ...state, transcript: [...state.transcript, entry] };
    }
    case "SESSION_STATUS":
      return {
        ...state,
        serverConnected: action.connected,
        geminiConnected: action.geminiConnected,
        fishjamId: action.fishjamId ?? state.fishjamId,
        peerToken: action.peerToken ?? state.peerToken,
      };
    default:
      return state;
  }
}

export function useAppState() {
  return useReducer(reducer, initialState);
}

// --- Selectors ---

export const getPending = (s: AppState) =>
  s.overlays.filter(
    (o) => o.displayStatus === null && o.proposal.status === "ready"
  );

export const getFetching = (s: AppState) =>
  s.overlays.filter(
    (o) => o.displayStatus === null && o.proposal.status === "fetching"
  );

export const getActive = (s: AppState) =>
  s.overlays.filter(
    (o) => o.displayStatus === "approved" || o.displayStatus === "displayed"
  );
