import type { ComparisonData } from "../types.js";

const GEMINI_KEY = process.env.GOOGLE_API_KEY;

export async function fetchComparison(
  itemA: string,
  itemB: string,
  criteria?: string
): Promise<ComparisonData> {
  const prompt = `Compare "${itemA}" vs "${itemB}"${criteria ? ` focusing on: ${criteria}` : ""}.

Return ONLY valid JSON, no markdown:
{"itemA": "${itemA}", "itemB": "${itemB}", "rows": [{"label": "aspect", "valueA": "value", "valueB": "value"}]}

Keep it to 3-5 rows. Be concise — these values appear on a small stream overlay.`;

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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
