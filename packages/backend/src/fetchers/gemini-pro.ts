import { GoogleGenAI } from '@google/genai'
import type { DeepAnalysisData } from '@streamgenius/shared'

export async function analyzeWithGeminiPro(
  claim: string,
  _topic?: string
): Promise<DeepAnalysisData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, using mock analysis')
    return getMockAnalysis(claim)
  }

  console.log('Starting Gemini API analysis for claim:', claim)

  try {
    const genAI = new GoogleGenAI({ apiKey })

    const prompt = `You are a fact-checker. Analyze this claim: "${claim}"

Determine if this claim is true, false, or uncertain. Provide:
1. verdict: "verified" (claim is true), "disputed" (claim is false), "partially_true", or "unverified"
2. explanation: 1-2 sentence explanation
3. sources: 2-3 relevant source URLs
4. confidence: 0.0-1.0

Example for "Python is faster than C++":
{
  "verdict": "disputed",
  "explanation": "C++ is generally faster than Python. Python is an interpreted language while C++ is compiled, making C++ significantly faster for most computational tasks.",
  "sources": [
    {"title": "Python vs C++ Performance", "url": "https://benchmarksgame-team.pages.debian.net/benchmarksgame/", "relevance": "Performance benchmarks"},
    {"title": "Stack Overflow Discussion", "url": "https://stackoverflow.com/questions/801657/is-python-faster-and-lighter-than-c", "relevance": "Developer community insights"}
  ],
  "confidence": 0.95
}

Now analyze: "${claim}"
Return ONLY the JSON object, no other text.`

    console.log('Calling Gemini 2.5 Flash...')

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const text = result.text || ''
    console.log('Gemini API raw response:', text)

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as Omit<DeepAnalysisData, 'claim'>
        console.log('Successfully parsed analysis:', parsed.verdict)
        return { claim, ...parsed }
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw:', jsonMatch[0])
      }
    }

    console.warn('Could not parse Gemini response, using mock')
    return getMockAnalysis(claim)
  } catch (error) {
    console.error('Gemini API error:', error instanceof Error ? error.message : error)
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
