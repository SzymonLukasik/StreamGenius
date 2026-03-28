import { mockFetchersEnabled } from '../config/dev-mocks.js'

export interface SearchResult {
  title: string
  link: string
  snippet: string
}

const GOOGLE_SEARCH_API = 'https://www.googleapis.com/customsearch/v1'

export async function searchGoogle(query: string, numResults = 3): Promise<SearchResult[]> {
  if (mockFetchersEnabled()) {
    console.log(`[MOCK_FETCHERS] Skipping Google Search; mock results for:`, query.slice(0, 80))
    return getMockSearchResults(query, numResults)
  }

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_CX

  if (!apiKey || !cx) {
    console.error('GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX not set')
    return getMockSearchResults(query)
  }

  try {
    const url = new URL(GOOGLE_SEARCH_API)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', cx)
    url.searchParams.set('q', query)
    url.searchParams.set('num', String(numResults))

    const response = await fetch(url.toString())
    if (!response.ok) throw new Error(`Google Search API error: ${response.status}`)
    const data = (await response.json()) as { items?: Array<{ title: string; link: string; snippet: string }> }

    if (!data.items || data.items.length === 0) {
      return getMockSearchResults(query)
    }

    return data.items.map(
      (item: { title: string; link: string; snippet: string }): SearchResult => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })
    )
  } catch (error) {
    console.error('Google Search API error:', error)
    return getMockSearchResults(query)
  }
}

function getMockSearchResults(query: string, numResults = 3): SearchResult[] {
  const base: SearchResult[] = [
    {
      title: `Information about: ${query}`,
      link: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(query.replace(/\s+/g, '_')),
      snippet: `This is a search result snippet about ${query}. More details can be found at the source.`,
    },
    {
      title: `${query} - Latest Research`,
      link: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(query),
      snippet: `Academic and research papers related to ${query}.`,
    },
    {
      title: `FAQ: ${query}`,
      link: 'https://example.com/faq?q=' + encodeURIComponent(query),
      snippet: `Common questions and answers about ${query}.`,
    },
  ]
  return base.slice(0, Math.min(numResults, base.length))
}
