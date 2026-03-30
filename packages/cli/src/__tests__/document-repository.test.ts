import { describe, it, expect } from 'vitest'
import { TossPaymentsDocument } from '../core/document.js'
import { DocumentRepository } from '../repository/document-repository.js'

function longMarkdown(keyword: string): string {
  return `# ${keyword}\n` + Array(50).fill(keyword).join(' ')
}

const v1Doc = new TossPaymentsDocument(1, 'V1 문서', 'https://example.com/v1/doc.md', '', 'v1', longMarkdown('빌링키'))
const v2Doc = new TossPaymentsDocument(
  2,
  'V2 문서',
  'https://example.com/v2/doc.md',
  '',
  'v2',
  longMarkdown('결제위젯'),
)
const generalDoc = new TossPaymentsDocument(
  3,
  '공통 문서',
  'https://example.com/doc.md',
  '',
  undefined,
  longMarkdown('연동'),
)

describe('DocumentRepository', () => {
  it('v2 search only finds v2 and general documents', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const result = repo.search('v2', ['빌링키'])
    expect(result).not.toContain('V1 문서')
  })

  it('v1 search only finds v1 and general documents', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const result = repo.search('v1', ['결제위젯'])
    expect(result).not.toContain('V2 문서')
  })

  it('general documents appear in both v1 and v2 search results', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const v1Result = repo.search('v1', ['연동'])
    const v2Result = repo.search('v2', ['연동'])
    expect(v1Result).toContain('공통 문서')
    expect(v2Result).toContain('공통 문서')
  })

  it('findDocById returns correct document', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const found = repo.getDocumentById(2)
    expect(found?.title).toBe('V2 문서')
  })

  it('findDocById returns undefined for non-existent ID', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const found = repo.getDocumentById(999)
    expect(found).toBeUndefined()
  })

  it('search result formatting includes 원본문서 제목 and 원본문서 ID', () => {
    const repo = new DocumentRepository([v1Doc, v2Doc, generalDoc])
    const result = repo.search('v2', ['결제위젯'])
    expect(result).toContain('원본문서 제목')
    expect(result).toContain('원본문서 ID')
  })
})
