import type { DocumentChunk } from './types.js'
import type { TossPaymentsDocument } from './document.js'
import { BM25_CONFIGS, MIN_SCORE_RATIO, type SearchMode } from './search-mode.js'

export interface BM25Score {
  id: number
  chunkId: number
  score: number
  totalTF: number
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class BM25Calculator {
  private readonly allChunks: DocumentChunk[]
  private readonly avgDocLength: number
  private readonly N: number

  constructor(documents: TossPaymentsDocument[]) {
    this.allChunks = documents.flatMap((d) => d.getChunks())
    const totalWords = this.allChunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)
    this.N = this.allChunks.length
    this.avgDocLength = this.N > 0 ? totalWords / this.N : 1
  }

  calculate(keywords: string[], searchMode: SearchMode): BM25Score[] {
    if (this.allChunks.length === 0) return []

    const escapedKeywords = [...new Set(keywords.map((k) => escapeRegExp(k.trim())))]
    const regexp = new RegExp(escapedKeywords.join('|'), 'gi')
    const config = BM25_CONFIGS[searchMode]

    const { termFrequencies, docFrequencies } = this.calculateFrequencies(regexp)
    const scores = this.calculateScores(termFrequencies, docFrequencies, config)

    scores.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.totalTF - a.totalTF))

    return this.applyRelativeFilter(scores, searchMode)
  }

  private calculateFrequencies(regexp: RegExp): {
    termFrequencies: Record<number, Record<string, number>>
    docFrequencies: Record<string, number>
  } {
    const termFrequencies: Record<number, Record<string, number>> = {}
    const docFrequencies: Record<string, number> = {}

    for (const chunk of this.allChunks) {
      const matches = Array.from(chunk.text.matchAll(regexp))
      const termCounts: Record<string, number> = {}

      for (const match of matches) {
        const term = match[0].toLowerCase()
        termCounts[term] = (termCounts[term] || 0) + 1
      }

      if (Object.keys(termCounts).length > 0) {
        termFrequencies[chunk.chunkId] = termCounts
        for (const term of Object.keys(termCounts)) {
          docFrequencies[term] = (docFrequencies[term] || 0) + 1
        }
      }
    }

    return { termFrequencies, docFrequencies }
  }

  private calculateScores(
    termFrequencies: Record<number, Record<string, number>>,
    docFrequencies: Record<string, number>,
    config: { k1: number; b: number },
  ): BM25Score[] {
    return this.allChunks
      .filter((chunk) => termFrequencies[chunk.chunkId])
      .map((chunk) => {
        const tf = termFrequencies[chunk.chunkId]
        const len = chunk.wordCount

        const score = Object.keys(tf)
          .map((term) => {
            const df = docFrequencies[term]
            // BM25+: always non-negative IDF
            const idf = Math.log((this.N - df + 0.5) / (df + 0.5) + 1)
            const numerator = tf[term] * (config.k1 + 1)
            const denominator = tf[term] + config.k1 * (1 - config.b + config.b * (len / this.avgDocLength))
            return idf * (numerator / denominator)
          })
          .reduce((sum, v) => sum + v, 0)

        const totalTF = Object.values(tf).reduce((sum, v) => sum + v, 0)

        return { id: chunk.id, chunkId: chunk.chunkId, score, totalTF }
      })
  }

  /**
   * 최고 점수 대비 상대적 임계값을 적용하여 필터링
   */
  private applyRelativeFilter(scores: BM25Score[], searchMode: SearchMode): BM25Score[] {
    const minScoreRatio = MIN_SCORE_RATIO[searchMode]
    if (scores.length === 0) return scores
    const maxScore = scores[0].score
    const relativeThreshold = maxScore * this.getThresholdRatio(minScoreRatio)
    const filtered = scores.filter((s) => s.score >= relativeThreshold)
    return filtered.length > 0 ? filtered : [scores[0]]
  }

  /**
   * minScore 값을 상대적 비율로 매핑
   */
  private getThresholdRatio(minScore: number): number {
    // minScore 0.1~1.0 -> 비율 0.05~0.7로 매핑
    return Math.max(0.05, Math.min(0.7, minScore * 0.7))
  }
}
