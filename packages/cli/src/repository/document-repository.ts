import { BM25Calculator } from '../core/bm25.js'
import { TossPaymentsDocument } from '../core/document.js'
import { loadCache, saveCache, isCacheValid } from './cache.js'
import { fetchAndParseAllDocs } from './llms-txt-parser.js'
import { CategoryWeightCalculator } from '../core/category-weight-calculator.js'
import { SynonymDictionary } from '../core/synonym-dictionary.js'
import { TokenEstimator } from '../core/token-estimator.js'
import { SearchMode } from '../core/search-mode.js'
import type { SerializedDocument } from '../core/types.js'

const LLMS_TXT_URL = 'https://docs.tosspayments.com/llms.txt'
const TRUNCATION_WARNING = '\n\n... (내용이 더 있습니다...)'

export class DocumentRepository {
  private readonly documentV1BM25: BM25Calculator
  private readonly documentV2BM25: BM25Calculator
  private readonly allDocuments: TossPaymentsDocument[]
  private readonly categoryWeightCalculator: CategoryWeightCalculator
  private readonly synonymDictionary: SynonymDictionary

  constructor(documents: TossPaymentsDocument[]) {
    this.allDocuments = documents
    const v1 = documents.filter((d) => d.version === 'v1')
    const v2 = documents.filter((d) => d.version === 'v2')
    const general = documents.filter((d) => d.version == null)
    this.documentV1BM25 = new BM25Calculator(v1.concat(general))
    this.documentV2BM25 = new BM25Calculator(v2.concat(general))
    this.categoryWeightCalculator = new CategoryWeightCalculator()
    this.synonymDictionary = new SynonymDictionary()
  }

  search(
    version: 'v1' | 'v2',
    keywords: string[],
    topN = 10,
    searchMode: SearchMode = SearchMode.BALANCED,
    maxTokens = 25000,
  ): string {
    const calc = version === 'v1' ? this.documentV1BM25 : this.documentV2BM25
    const expandedKeywords = this.synonymDictionary.convertToSynonyms(keywords)
    const bm25Results = calc.calculate(expandedKeywords, searchMode)
    const weightedResults = this.categoryWeightCalculator.apply(bm25Results, this.allDocuments)
    const topResults = weightedResults.slice(0, topN)
    return this.formatResults(topResults, maxTokens)
  }

  getDocumentById(id: number): TossPaymentsDocument | undefined {
    return this.allDocuments.find((d) => d.id === id)
  }

  private formatResults(results: { id: number; chunkId: number; score: number }[], maxTokens: number): string {
    const groupedByDocId = new Map<number, number[]>()
    for (const result of results) {
      if (!groupedByDocId.has(result.id)) groupedByDocId.set(result.id, [])
      groupedByDocId.get(result.id)!.push(result.chunkId)
    }
    // deduplicate and sort chunkIds per doc
    for (const [docId, chunkIds] of groupedByDocId) {
      groupedByDocId.set(
        docId,
        [...new Set(chunkIds)].sort((a, b) => a - b),
      )
    }

    const docs: string[] = []
    let usedTokens = 0

    for (const [docId, chunkIds] of groupedByDocId) {
      if (usedTokens >= maxTokens) break

      const doc = this.allDocuments.find((d) => d.id === docId)
      if (!doc) continue

      const windowChunks = chunkIds.flatMap((cid) => doc.getChunkWithWindow(cid, 1))
      const uniqueChunks = [...new Map(windowChunks.map((c) => [c.chunkId, c])).values()].sort(
        (a, b) => a.chunkId - b.chunkId,
      )

      if (uniqueChunks.length === 0) continue

      const header = `# 원본문서 제목 : ${doc.title}\n* 원본문서 ID : ${doc.id}`
      const headerTokens = TokenEstimator.estimate(header)
      if (usedTokens + headerTokens >= maxTokens) break

      const truncated = this.smartTruncateChunks(uniqueChunks, maxTokens - usedTokens - headerTokens)
      if (!truncated) continue

      docs.push(header)
      docs.push(truncated.text)
      usedTokens += headerTokens + truncated.tokens
    }

    return docs.join('\n\n---\n\n')
  }

  private smartTruncateChunks(
    chunks: { text: string; estimatedTokens: number }[],
    remainingTokens: number,
  ): { text: string; tokens: number } | null {
    if (chunks.length === 0 || remainingTokens <= 0) return null

    const selected: string[] = []
    let usedTokens = 0
    let truncated = false

    for (const chunk of chunks) {
      if (usedTokens + chunk.estimatedTokens <= remainingTokens) {
        selected.push(chunk.text)
        usedTokens += chunk.estimatedTokens
      } else {
        truncated = true
        break
      }
    }

    if (selected.length === 0) return null

    const content = selected.join('\n\n')
    const fullText = content + (truncated ? TRUNCATION_WARNING : '')
    const finalTokens = usedTokens + (truncated ? TokenEstimator.estimate(TRUNCATION_WARNING) : 0)
    return { text: fullText, tokens: finalTokens }
  }

  static async initialize(options?: { refresh?: boolean }): Promise<DocumentRepository> {
    if (!options?.refresh) {
      const cached = await loadCache()
      if (cached && isCacheValid(cached)) {
        const docs = cached.documents.map(
          (d: SerializedDocument) =>
            new TossPaymentsDocument(d.id, d.title, d.link, d.description, d.version, '', d.category),
        )
        return new DocumentRepository(docs)
      }
    }

    const docs = await fetchAndParseAllDocs(LLMS_TXT_URL)
    await saveCache({ fetchedAt: new Date().toISOString(), documents: docs.map((d) => d.toJSON()) })
    return new DocumentRepository(docs)
  }
}
