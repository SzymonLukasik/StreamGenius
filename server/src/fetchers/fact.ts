import type { FactData } from "../types.js";

const SEARCH_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX;
const GEMINI_KEY = process.env.GOOGLE_API_KEY;

export async function fetchFactVerification(
  claim: string,
  source?: string
): Promise<FactData> {
  // Step 1: Search the web
  const snippets = await searchGoogle(claim);

  // Step 2: Ask Gemini 3.1 Pro to verify
  const prompt = `Verify this claim: "${claim}"${source ? ` (attributed to: ${source})` : ""}

Web search results:
${snippets.join("\n")}

Respond with ONLY valid JSON, no markdown:
{"verified": true/false, "correction": "corrected statement or null if accurate", "source": "most authoritative source name", "sourceUrl": "url"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

  return {
    claim,
    verified: parsed.verified ?? false,
    correction: parsed.correction ?? null,
    source: parsed.source ?? "Unknown",
    sourceUrl: parsed.sourceUrl ?? "",
  };
}

async function searchGoogle(query: string): Promise<string[]> {
  if (!SEARCH_KEY || !SEARCH_CX) {
    // Fallback: use Gemini's own knowledge
    return [`No web search configured. Verifying from model knowledge.`];
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${SEARCH_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(query)}&num=3`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.items ?? []).map(
    (item: any) => `${item.title}: ${item.snippet} (${item.link})`
  );
}
