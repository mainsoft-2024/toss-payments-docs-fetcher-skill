import { describe, it, expect } from 'vitest'
import { BM25Calculator } from '../core/bm25.js'
import { TossPaymentsDocument } from '../core/document.js'
import { SearchMode } from '../core/search-mode.js'

function makeDoc(id: number, version: 'v1' | 'v2' | undefined, markdown: string): TossPaymentsDocument {
  return new TossPaymentsDocument(id, `Doc ${id}`, `https://example.com/doc${id}.md`, '', version, markdown)
}

describe('BM25Calculator', () => {
  it('returns scored chunks sorted by score DESC for a simple corpus', () => {
    const docs = [
      makeDoc(1, 'v2', '# 결제\n결제 결제 결제'),
      makeDoc(2, 'v2', '# 위젯\n위젯 연동'),
      makeDoc(3, 'v2', '# 기타\n기타 내용'),
    ]
    const calc = new BM25Calculator(docs)
    const results = calc.calculate(['결제'], SearchMode.BALANCED)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score)
  })

  it('term in all docs has lower IDF than term in one doc', () => {
    const docs = [
      makeDoc(1, 'v2', '# A\n결제 결제'),
      makeDoc(2, 'v2', '# B\n결제 위젯'),
      makeDoc(3, 'v2', '# C\n결제 빌링'),
    ]
    const calc = new BM25Calculator(docs)
    const commonResults = calc.calculate(['결제'], SearchMode.BALANCED)
    const rareResults = calc.calculate(['위젯'], SearchMode.BALANCED)
    const commonMaxScore = Math.max(...commonResults.map((r) => r.score))
    const rareMaxScore = Math.max(...rareResults.map((r) => r.score))
    expect(rareMaxScore).toBeGreaterThan(commonMaxScore)
  })

  it('matches Korean keywords correctly', () => {
    const docs = [
      makeDoc(1, 'v2', '# 결제 안내\n결제위젯으로 빠르게 연동하세요'),
      makeDoc(2, 'v2', '# API 안내\n서버 API를 사용합니다'),
    ]
    const calc = new BM25Calculator(docs)
    const results = calc.calculate(['결제'], SearchMode.BALANCED)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe(1)
  })

  it('matches multiple keywords joined by pipe operator', () => {
    const docs = [
      makeDoc(1, 'v2', '# 결제\n결제 안내'),
      makeDoc(2, 'v2', '# 위젯\n위젯 안내'),
      makeDoc(3, 'v2', '# 기타\n기타'),
    ]
    const calc = new BM25Calculator(docs)
    const results = calc.calculate(['결제', '위젯'], SearchMode.BALANCED)
    const matchingIds = results.map((r) => r.id)
    expect(matchingIds).toContain(1)
    expect(matchingIds).toContain(2)
    expect(matchingIds).not.toContain(3)
  })

  it('returns empty array when no matches found', () => {
    const docs = [makeDoc(1, 'v2', '# Hello\nsome content here')]
    const calc = new BM25Calculator(docs)
    const results = calc.calculate(['존재하지않는키워드XYZ'], SearchMode.BALANCED)
    expect(results).toEqual([])
  })

  it('shorter doc with same TF gets higher score than longer doc (length normalization)', () => {
    const shortDoc = makeDoc(1, 'v2', '# 결제\n결제 안내')
    const longDoc = makeDoc(2, 'v2', '# 결제\n결제 안내 ' + '추가내용 '.repeat(100))
    const calc = new BM25Calculator([shortDoc, longDoc])
    const results = calc.calculate(['결제'], SearchMode.BALANCED)
    const shortScore = results.find((r) => r.id === 1)?.score ?? 0
    const longScore = results.find((r) => r.id === 2)?.score ?? 0
    expect(shortScore).toBeGreaterThan(longScore)
  })
})
