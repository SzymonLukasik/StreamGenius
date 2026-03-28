import { useState, useEffect, useRef, useCallback, type ReactElement } from "react";
import SmelterInstance from "@swmansion/smelter-web-wasm";
import { setWasmBundleUrl } from "@swmansion/smelter-web-wasm";

// IMPORTANT: Set WASM bundle URL before any Smelter instance is created.
// The WASM file must be served by Vite from the public/ directory.
// Copy it there from node_modules/@swmansion/smelter-web-wasm/dist/ after npm install.
setWasmBundleUrl("/smelter.wasm");

interface UseSmelterOptions {
  scene: ReactElement; // The Smelter composition component
  resolution?: { width: number; height: number };
  framerate?: number;
}

interface UseSmelterResult {
  stream: MediaStream | null; // Feed this to Fishjam via useCustomSource
  previewRef: React.RefObject<HTMLVideoElement | null>; // Attach to a <video> for local preview
  ready: boolean;
  error: string | null;
}

export function useSmelter({
  scene,
  resolution = { width: 1280, height: 720 },
  framerate = 30,
}: UseSmelterOptions): UseSmelterResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const smelterRef = useRef<SmelterInstance | null>(null);

  // We store the scene in a ref so we can update it without re-running the effect.
  // The Smelter output was registered with the initial scene; updates happen
  // via React's normal re-render cycle inside the Smelter scene component.
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const smelter = new SmelterInstance({ framerate });
        smelterRef.current = smelter;
        await smelter.init();

        if (cancelled) return;

        // Register camera as input
        await smelter.registerInput("camera", { type: "camera" });

        // Register output — produces a MediaStream
        const { stream: outputStream } = await smelter.registerOutput(
          "main",
          sceneRef.current,
          {
            type: "stream",
            video: { resolution },
            audio: true,
          }
        );

        if (cancelled) return;

        await smelter.start();

        setStream(outputStream);
        setReady(true);

        // Show preview in local video element
        if (previewRef.current) {
          previewRef.current.srcObject = outputStream;
          previewRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to init Smelter"
          );
          console.error("[smelter] Init failed:", err);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      smelterRef.current?.terminate();
    };
  }, [framerate, resolution.width, resolution.height]);

  return { stream, previewRef, ready, error };
}
