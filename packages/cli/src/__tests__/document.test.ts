import { describe, it, expect } from 'vitest'
import { TossPaymentsDocument } from '../core/document.js'

function makeDoc(): TossPaymentsDocument {
  const md = [
    '# 첫 번째 섹션',
    Array(30).fill('단어').join(' '),
    '# 두 번째 섹션',
    Array(30).fill('단어').join(' '),
    '# 세 번째 섹션',
    Array(30).fill('단어').join(' '),
  ].join('\n')
  return new TossPaymentsDocument(3, '테스트 문서', 'https://example.com/test.md', '설명', 'v2', md)
}

describe('TossPaymentsDocument', () => {
  it('getChunkWithWindow(chunkId, 1) returns [prev, target, next] for middle chunk', () => {
    const doc = makeDoc()
    const middleChunk = doc.chunks[1]
    const result = doc.getChunkWithWindow(middleChunk.chunkId, 1)
    expect(result.length).toBe(3)
    expect(result[1].chunkId).toBe(middleChunk.chunkId)
  })

  it('getChunkWithWindow(chunkId, 1) returns [target, next] for first chunk', () => {
    const doc = makeDoc()
    const firstChunk = doc.chunks[0]
    const result = doc.getChunkWithWindow(firstChunk.chunkId, 1)
    expect(result.length).toBe(2)
    expect(result[0].chunkId).toBe(firstChunk.chunkId)
  })

  it('getChunkWithWindow(chunkId, 1) returns [prev, target] for last chunk', () => {
    const doc = makeDoc()
    const lastChunk = doc.chunks[doc.chunks.length - 1]
    const result = doc.getChunkWithWindow(lastChunk.chunkId, 1)
    expect(result.length).toBe(2)
    expect(result[result.length - 1].chunkId).toBe(lastChunk.chunkId)
  })

  it('getChunkWithWindow(chunkId, 0) returns only the target chunk', () => {
    const doc = makeDoc()
    const chunk = doc.chunks[1]
    const result = doc.getChunkWithWindow(chunk.chunkId, 0)
    expect(result.length).toBe(1)
    expect(result[0].chunkId).toBe(chunk.chunkId)
  })

  it('getChunkWithWindow with invalid chunkId returns empty array', () => {
    const doc = makeDoc()
    const result = doc.getChunkWithWindow(99999, 1)
    expect(result).toEqual([])
  })

  it('assigns chunkId as id * 1000 + chunkIndex', () => {
    const md = '# A\n' + Array(30).fill('단어').join(' ') + '\n# B\n' + Array(30).fill('단어').join(' ')
    const doc = new TossPaymentsDocument(3, 'Test', 'https://example.com', '', undefined, md)
    expect(doc.chunks[0].chunkId).toBe(3000)
    expect(doc.chunks[1].chunkId).toBe(3001)
    expect(doc.chunks[0].id).toBe(3)
  })
})
