function envTruthy(name: string): boolean {
  const v = process.env[name]?.toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/** When true, `analyzeWithGeminiPro` never calls Google (no quota / billing). */
export function mockGeminiEnabled(): boolean {
  return envTruthy('MOCK_GEMINI')
}

/** When true, YouTube + Custom Search fetchers return local data without network. */
export function mockFetchersEnabled(): boolean {
  return envTruthy('MOCK_FETCHERS')
}
