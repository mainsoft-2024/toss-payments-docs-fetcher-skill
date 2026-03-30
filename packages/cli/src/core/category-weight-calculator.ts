import type { TossPaymentsDocument } from './document.js'
import { CATEGORY_WEIGHTS, type Category } from './category.js'

export interface BM25Result {
  id: number
  chunkId: number
  score: number
}

export class CategoryWeightCalculator {
  private readonly weights: Record<Category, number>

  constructor(customWeights?: Partial<Record<Category, number>>) {
    this.weights = { ...CATEGORY_WEIGHTS, ...customWeights }
  }

  /**
   * BM25 결과에 category별 가중치를 적용하고 재정렬
   */
  apply(results: BM25Result[], documents: TossPaymentsDocument[]): BM25Result[] {
    const documentMap = new Map(documents.map((d) => [d.id, d]))
    return results
      .map((result) => {
        const document = documentMap.get(result.id)
        if (!document) return result
        const categoryWeight = this.weights[document.category]
        return { ...result, score: result.score * categoryWeight }
      })
      .sort((a, b) => b.score - a.score)
  }
}
