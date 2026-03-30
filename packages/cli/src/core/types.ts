import type { Category } from './category.js'

export interface DocumentChunk {
  id: number
  chunkId: number
  originTitle: string
  text: string
  wordCount: number
  estimatedTokens: number
}

export interface RawDocument {
  version?: string
  id: number
  title: string
  link: string
  description: string
  keywords: string[]
  category: Category
}

export interface ScoredChunk extends DocumentChunk {
  score: number
  totalTF: number
}

export interface SerializedDocument {
  id: number
  title: string
  link: string
  description: string
  version?: string
  category: Category
  chunks: DocumentChunk[]
}

export interface CacheData {
  fetchedAt: string
  documents: SerializedDocument[]
}
