import { describe, it, expect } from 'vitest'
import { chunkMarkdown, joinShortChunks } from '../core/document-chunker.js'

describe('chunkMarkdown', () => {
  it('splits at H1 boundaries', () => {
    const md = '# 결제\n결제 내용\n# 위젯\n위젯 내용'
    const chunks = chunkMarkdown(md)
    expect(chunks.length).toBe(2)
    expect(chunks[0]).toContain('결제 내용')
    expect(chunks[1]).toContain('위젯 내용')
  })

  it('splits at H2 boundaries', () => {
    const md = '## Sub1\n내용일\n## Sub2\n내용이'
    const chunks = chunkMarkdown(md)
    expect(chunks.length).toBe(2)
    expect(chunks[0]).toContain('내용일')
    expect(chunks[1]).toContain('내용이')
  })

  it('H3 and deeper headers do NOT create new chunks', () => {
    const md = '# 섹션\n내용\n### H3제목\n서브내용'
    const chunks = chunkMarkdown(md)
    expect(chunks.length).toBe(1)
  })

  it('returns empty array for empty markdown', () => {
    const chunks = chunkMarkdown('')
    expect(chunks).toEqual([])
  })
})

describe('joinShortChunks', () => {
  it('merges chunks with fewer than 30 words with adjacent chunk', () => {
    const short = '짧은 내용'
    const long = Array(30).fill('단어').join(' ')
    const result = joinShortChunks([short, long])
    expect(result.length).toBe(1)
    expect(result[0]).toContain('짧은 내용')
    expect(result[0]).toContain('단어')
  })

  it('keeps chunks with 30 or more words separate', () => {
    const chunk1 = Array(30).fill('단어').join(' ')
    const chunk2 = Array(30).fill('단어').join(' ')
    const result = joinShortChunks([chunk1, chunk2])
    expect(result.length).toBe(2)
  })

  it('merges consecutive short chunks into one', () => {
    const short1 = '첫 번째'
    const short2 = '두 번째'
    const short3 = '세 번째'
    const result = joinShortChunks([short1, short2, short3])
    expect(result.length).toBe(1)
    expect(result[0]).toContain('첫 번째')
    expect(result[0]).toContain('두 번째')
    expect(result[0]).toContain('세 번째')
  })
})
