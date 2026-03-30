import { unified } from 'unified'
import remarkParse from 'remark-parse'

type AstNode = {
  type: string
  depth?: number
  position?: { start: { offset: number }; end: { offset: number } }
  children?: AstNode[]
}

function isChunkBoundary(node: AstNode): boolean {
  return node.type === 'heading' && (node.depth ?? 99) <= 2
}

export function chunkMarkdown(markdown: string): string[] {
  if (!markdown.trim()) return []

  const tree = unified().use(remarkParse).parse(markdown) as AstNode
  const children = (tree.children ?? []) as AstNode[]
  if (children.length === 0) return []

  const groups: Array<AstNode[]> = []
  let current: AstNode[] = []

  for (const node of children) {
    if (isChunkBoundary(node)) {
      if (current.length > 0) {
        groups.push(current)
      }
      current = [node]
    } else {
      current.push(node)
    }
  }

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
    .map((group) => {
      const start = group[0].position!.start.offset!
      const end = group[group.length - 1].position!.end.offset!
      return markdown.slice(start, end).trim()
    })
    .filter((chunk) => chunk.length > 0)
}

export function joinShortChunks(chunks: string[], minWords = 30): string[] {
  const result: string[] = []
  let buffer = ''

  for (const chunk of chunks) {
    const wc = chunk.split(/\s+/).length
    if (wc < minWords) {
      buffer += (buffer ? '\n\n' : '') + chunk
      continue
    }
    const combined = buffer ? buffer + '\n\n' + chunk : chunk
    result.push(combined.trim())
    buffer = ''
  }

  if (buffer) result.push(buffer.trim())
  return result
}
