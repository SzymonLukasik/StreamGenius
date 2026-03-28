import { GoogleGenAI } from '@google/genai'
import type { DeepAnalysisData } from '@streamgenius/shared'
import { deepAnalysisDataSchema } from '@streamgenius/shared'
import { mockGeminiEnabled } from '../config/dev-mocks.js'

export async function analyzeWithGeminiPro(
  claim: string,
  topic?: string
): Promise<DeepAnalysisData> {
  if (mockGeminiEnabled()) {
    console.log(
      `[MOCK_GEMINI] Skipping Gemini Pro API (set MOCK_GEMINI=0 to use real model). Claim:`,
      claim.slice(0, 100)
    )
    return getRichMockAnalysis(claim)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log('[gemini-pro] GEMINI_API_KEY not set; using local mock analysis')
    return getRichMockAnalysis(claim)
  }

  try {
    const genAI = new GoogleGenAI({ apiKey })

    const prompt = `Analyze this claim for accuracy: "${claim}"
${topic ? `Context/Topic: ${topic}` : ''}

Respond in JSON format only (no markdown code blocks):
{
  "verdict": "verified" | "disputed" | "unverified" | "partially_true",
  "explanation": "Brief explanation of the analysis (1-2 sentences)",
  "sources": [
    {"title": "Source name", "url": "https://...", "relevance": "Why this source is relevant"}
  ],
  "confidence": 0.0-1.0
}

Be concise. Include 2-3 credible sources if possible. Return ONLY the JSON object.`

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const text = result.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const validated = deepAnalysisDataSchema.safeParse({ claim, ...JSON.parse(jsonMatch[0]) })
      if (validated.success) return validated.data
    }

    console.warn('[gemini-pro] Could not parse model JSON; using mock analysis')
    return getRichMockAnalysis(claim)
  } catch (error) {
    console.error('Gemini Pro analysis error:', error)
    return getRichMockAnalysis(claim)
  }
}

/** Deterministic dev/mock payload so overlays look realistic without hitting the API. */
export function getRichMockAnalysis(claim: string): DeepAnalysisData {
  const verdicts: DeepAnalysisData['verdict'][] = [
    'verified',
    'partially_true',
    'disputed',
    'unverified',
  ]
  const idx = Math.abs(claim.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % verdicts.length
  const verdict = verdicts[idx]

  const explanations: Record<DeepAnalysisData['verdict'], string> = {
    verified:
      '[Mock] This reads as broadly consistent with common references (local dev data only).',
    partially_true:
      '[Mock] Some parts of the claim are supported; wording or scope may be overstated.',
    disputed:
      '[Mock] Strong sources would contest this phrasing or the implied conclusion.',
    unverified:
      '[Mock] Not enough to verify from synthetic sources — replace MOCK_GEMINI for real checks.',
  }

  return {
    claim,
    verdict,
    explanation: explanations[verdict],
    sources: [
      {
        title: 'StreamGenius mock source A',
        url: 'https://example.com/streamgenius-mock-a',
        relevance: 'Placeholder for development',
      },
      {
        title: 'StreamGenius mock source B',
        url: 'https://example.com/streamgenius-mock-b',
        relevance: 'Set MOCK_GEMINI=false and GEMINI_API_KEY for live Gemini Pro',
      },
    ],
    confidence: Math.min(0.92, 0.55 + idx * 0.1 + (claim.length % 7) * 0.02),
  }
}
