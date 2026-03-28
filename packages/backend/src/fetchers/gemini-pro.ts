import { GoogleGenAI } from '@google/genai'
import type { DeepAnalysisData } from '@streamgenius/shared'
import { deepAnalysisDataSchema } from '@streamgenius/shared'

export async function analyzeWithGeminiPro(
  claim: string,
  topic?: string
): Promise<DeepAnalysisData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return getMockAnalysis(claim)
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

    return getMockAnalysis(claim)
  } catch (error) {
    console.error('Gemini Pro analysis error:', error)
    return getMockAnalysis(claim)
  }
}

function getMockAnalysis(claim: string): DeepAnalysisData {
  return {
    claim,
    verdict: 'unverified',
    explanation: 'Unable to verify this claim at the moment. Please check the sources for more information.',
    sources: [
      {
        title: 'Wikipedia',
        url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(claim.split(' ').slice(0, 3).join('_')),
        relevance: 'General reference',
      },
    ],
    confidence: 0.5,
  }
}
