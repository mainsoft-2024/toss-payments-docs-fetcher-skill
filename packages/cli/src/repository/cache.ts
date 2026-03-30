import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CacheData } from '../core/types.js'

export function getCachePath(): string {
  const thisFile = fileURLToPath(import.meta.url)
  const packageRoot = path.resolve(path.dirname(thisFile), '..', '..')
  return path.join(packageRoot, '.cache', 'documents.json')
}

export async function saveCache(data: CacheData, cachePath?: string): Promise<void> {
  const target = cachePath ?? getCachePath()
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, JSON.stringify(data, null, 2), 'utf-8')
}

export async function loadCache(cachePath?: string): Promise<CacheData | null> {
  const target = cachePath ?? getCachePath()
  try {
    const raw = await fs.readFile(target, 'utf-8')
    return JSON.parse(raw) as CacheData
  } catch {
    return null
  }
}

export function isCacheValid(data: CacheData, maxAgeMs = 24 * 60 * 60 * 1000): boolean {
  const fetchedAt = new Date(data.fetchedAt).getTime()
  return Date.now() - fetchedAt < maxAgeMs
}
