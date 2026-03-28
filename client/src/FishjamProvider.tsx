import {
  FishjamProvider as FishjamContextProvider,
  useCustomSource,
  usePeers,
} from "@fishjam-cloud/react-client";
import type { ReactNode } from "react";

export { useCustomSource, usePeers };

export function FishjamProvider({ fishjamId, children }: { fishjamId: string; children: ReactNode }) {
  return <FishjamContextProvider fishjamId={fishjamId}>{children}</FishjamContextProvider>;
}
