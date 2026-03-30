import type { TossPaymentsDocument } from '../core/document.js'
import { categories, type Category } from '../core/category.js'

export interface LlmsTxtEntry {
  title: string
  url: string
  description: string
}

const ENTRY_PATTERN = /^- \[([^\]]+)\]\(([^)]+)\):\s*(.+)$/

export function parseLlmsTxt(text: string): LlmsTxtEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .flatMap((line) => {
      const match = ENTRY_PATTERN.exec(line)
      if (!match) return []
      return [{ title: match[1], url: match[2], description: match[3].trim() }]
    })
}

export function detectVersion(url: string, title?: string): string | undefined {
  // 1. Explicit /v1/ or /v2/ in URL path
  if (url.includes('/v1/')) return 'v1'
  if (url.includes('/v2/')) return 'v2'

  // 2. Title-based detection
  if (title) {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('version 1')) return 'v1'
    if (lowerTitle.includes('version 2')) return 'v2'
  }

  // 3. URL keyword fallback: sdk and guides paths are v1
  if (['sdk', 'guides'].some((keyword) => url.includes(keyword))) return 'v1'

  return undefined
}

export function extractCategory(url: string): Category {
  try {
    const pathname = new URL(url).pathname
    for (const category of categories) {
      if (pathname.startsWith(`/${category}`)) return category
    }
  } catch {
    // malformed URL — fall through to unknown
  }
  return 'unknown'
}

export async function fetchAndParseAllDocs(llmsTxtUrl: string): Promise<TossPaymentsDocument[]> {
  process.stderr.write('Fetching llms.txt...\n')
  const { TossPaymentsDocument: Doc } = await import('../core/document.js')

  const response = await fetch(llmsTxtUrl)
  if (!response.ok) {
    throw new Error('Failed to fetch llms.txt')
  }
  const text = await response.text()
  const entries = parseLlmsTxt(text)

  process.stderr.write('Fetching documents...\n')

  const docs: TossPaymentsDocument[] = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    try {
      const mdResponse = await fetch(entry.url)
      if (!mdResponse.ok) continue
      const markdown = await mdResponse.text()
      const version = detectVersion(entry.url, entry.title)
      const category = extractCategory(entry.url)
      docs.push(new Doc(i, entry.title, entry.url, entry.description, version, markdown, category))
    } catch {
      process.stderr.write('Skipping document due to fetch error\n')
    }
  }

  process.stderr.write('Documents fetched successfully\n')
  return docs
}
