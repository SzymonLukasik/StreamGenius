import { useEffect, useRef } from "react";
import { useAppState, getPending, getFetching, getActive } from "./store";
import { useOverlaySocket } from "./hooks/useOverlaySocket";
import { useSmelter } from "./hooks/useSmelter";
import { FishjamProvider, useCustomSource } from "./FishjamProvider";
import { useConnection, useMicrophone } from "@fishjam-cloud/react-client";
import { SmelterScene } from "./SmelterScene";
import { StatusBar } from "./dashboard/StatusBar";
import { TranscriptPanel } from "./dashboard/TranscriptPanel";
import { ActionQueue } from "./dashboard/ActionQueue";
import { ActiveOverlays } from "./dashboard/ActiveOverlays";

export function App() {
  const [state, dispatch] = useAppState();
  const { send } = useOverlaySocket(dispatch);

  // Wait until the server sends fishjamId before mounting FishjamProvider
  if (!state.fishjamId) {
    return (
      <div style={styles.root}>
        <div style={styles.connecting}>Connecting to StreamGenius server...</div>
      </div>
    );
  }

  return (
    <FishjamProvider fishjamId={state.fishjamId}>
      <AppContent state={state} dispatch={dispatch} send={send} />
    </FishjamProvider>
  );
}

function AppContent({
  state,
  dispatch,
  send,
}: {
  state: ReturnType<typeof useAppState>[0];
  dispatch: ReturnType<typeof useAppState>[1];
  send: (msg: any) => void;
}) {
  const active = getActive(state);
  const pending = getPending(state);
  const fetching = getFetching(state);

  // Step 1: Join the Fishjam room
  const { joinRoom, peerStatus } = useConnection();
  const joinedRef = useRef(false);
  useEffect(() => {
    if (state.peerToken && !joinedRef.current) {
      joinedRef.current = true;
      console.log("[app] Joining Fishjam room...");
      joinRoom({ peerToken: state.peerToken }).catch((err) =>
        console.error("[app] Join error:", err)
      );
    }
  }, [state.peerToken, joinRoom]);

  // Step 2: Start mic once connected (separate effect so toggleMicrophone has fresh peerStatus)
  const { toggleMicrophone, isMicrophoneOn } = useMicrophone();
  const micStartedRef = useRef(false);
  useEffect(() => {
    if (peerStatus === "connected" && !isMicrophoneOn && !micStartedRef.current) {
      micStartedRef.current = true;
      console.log("[app] Connected, toggling microphone on...");
      toggleMicrophone().then(() => console.log("[app] Microphone toggled on"));
    }
  }, [peerStatus, isMicrophoneOn, toggleMicrophone]);

  // Debug
  useEffect(() => {
    console.log("[app] peerStatus:", peerStatus, "micOn:", isMicrophoneOn);
  }, [peerStatus, isMicrophoneOn]);

  // Initialize Smelter with the composition scene
  const { stream, previewRef, ready: smelterReady, error: smelterError } = useSmelter({
    scene: <SmelterScene activeOverlays={active} />,
    resolution: { width: 1280, height: 720 },
    framerate: 30,
  });

  // TODO: Feed Smelter output to Fishjam as a custom source
  // Disabled for now — causes "track already added" errors. Re-enable once
  // the basic transcript + overlay flow is confirmed working.
  // const { setStream } = useCustomSource("smelter-output");
  // useEffect(() => {
  //   if (stream) setStream(stream);
  //   return () => { setStream(null); };
  // }, [stream, setStream]);

  const handleApprove = (id: string) => {
    dispatch({ type: "OVERLAY_APPROVE", id });
    send({ kind: "overlay_approve", id });
  };
  const handleSkip = (id: string) => dispatch({ type: "OVERLAY_SKIP", id });
  const handleDismiss = (id: string) => {
    dispatch({ type: "OVERLAY_DISMISS", id });
    send({ kind: "overlay_dismiss", id });
  };

  return (
    <div style={styles.root}>
      <StatusBar
        serverConnected={state.serverConnected}
        geminiConnected={state.geminiConnected}
        smelterReady={smelterReady}
        smelterError={smelterError}
        activeCount={active.length}
      />
      <div style={styles.split}>
        <div style={styles.left}>
          <div style={styles.preview}>
            <video ref={previewRef} autoPlay muted playsInline style={styles.video} />
            {!smelterReady && (
              <div style={styles.loading}>
                {smelterError ? `Smelter error: ${smelterError}` : "Initializing Smelter..."}
              </div>
            )}
          </div>
          <TranscriptPanel transcript={state.transcript} />
        </div>
        <div style={styles.right}>
          <ActionQueue pending={pending} fetching={fetching} onApprove={handleApprove} onSkip={handleSkip} />
          <ActiveOverlays overlays={active} onDismiss={handleDismiss} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  connecting: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff44", fontSize: 14 },
  split: { flex: 1, display: "grid", gridTemplateColumns: "1.6fr 1fr", overflow: "hidden" },
  left: { display: "flex", flexDirection: "column", borderRight: "1px solid #ffffff0d", overflow: "hidden" },
  right: { display: "flex", flexDirection: "column", overflow: "auto" },
  preview: { position: "relative", background: "#111827", flexShrink: 0 },
  video: { width: "100%", height: "auto", maxHeight: "50vh", display: "block", objectFit: "contain" },
  loading: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff66", fontSize: 14, background: "#111827" },
};
