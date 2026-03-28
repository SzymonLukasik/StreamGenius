import type { OverlayData } from "../types.js";
import { fetchYoutubeCard } from "./youtube.js";
import { fetchFactVerification } from "./fact.js";
import { fetchComparison } from "./comparison.js";
import { fetchViewerComment } from "./viewer.js";

export async function executeFetcher(
  functionName: string,
  args: Record<string, string>
): Promise<OverlayData> {
  switch (functionName) {
    case "show_youtube_card":
      return fetchYoutubeCard(args.query);
    case "verify_fact":
      return fetchFactVerification(args.claim, args.source);
    case "create_comparison":
      return fetchComparison(args.item_a, args.item_b, args.criteria);
    case "pin_viewer_comment":
      return fetchViewerComment(args.topic);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}
