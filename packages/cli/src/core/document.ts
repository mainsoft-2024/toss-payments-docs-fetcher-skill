import type { DocumentChunk, SerializedDocument } from './types.js'
import type { Category } from './category.js'
import { chunkMarkdown, joinShortChunks } from './document-chunker.js'
import { TokenEstimator } from './token-estimator.js'

function extractHeading(chunkText: string, fallback: string): string {
  const match = chunkText.match(/^#{1,6}\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

export class TossPaymentsDocument {
  private readonly _id: number
  private readonly _title: string
  private readonly _link: string
  private readonly _description: string
  private readonly _version: string | undefined
  private readonly _category: Category
  readonly chunks: DocumentChunk[]

  constructor(
    id: number,
    title: string,
    link: string,
    description: string,
    version: string | undefined,
    markdown: string,
    category: Category = 'unknown',
  ) {
    this._id = id
    this._title = title
    this._link = link
    this._description = description
    this._version = version
    this._category = category

    const rawChunks = joinShortChunks(chunkMarkdown(markdown))
    this.chunks = rawChunks.map((text, index) => ({
      id,
      chunkId: id * 1000 + index,
      originTitle: extractHeading(text, title),
      text,
      wordCount: text.split(/\s+/).length,
      estimatedTokens: TokenEstimator.estimate(text),
    }))
  }

  get id(): number {
    return this._id
  }
  get title(): string {
    return this._title
  }
  get link(): string {
    return this._link
  }
  get description(): string {
    return this._description
  }
  get version(): string | undefined {
    return this._version
  }
  get category(): Category {
    return this._category
  }

  getChunks(): DocumentChunk[] {
    return this.chunks
  }

  getChunkWithWindow(chunkId: number, windowSize = 1): DocumentChunk[] {
    const idx = this.chunks.findIndex((c) => c.chunkId === chunkId)
    if (idx === -1) return []
    const start = Math.max(0, idx - windowSize)
    const end = Math.min(this.chunks.length, idx + windowSize + 1)
    return this.chunks.slice(start, end)
  }

  toJSON(): SerializedDocument {
    return {
      id: this._id,
      title: this._title,
      link: this._link,
      description: this._description,
      version: this._version,
      category: this._category,
      chunks: this.chunks,
    }
  }
}
