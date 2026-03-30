import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { saveCache, loadCache, isCacheValid } from '../repository/cache.js'
import type { CacheData } from '../core/types.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'toss-cache-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('cache', () => {
  it('saveCache writes JSON file to cache directory', async () => {
    const cachePath = path.join(tmpDir, 'documents.json')
    const data: CacheData = { fetchedAt: new Date().toISOString(), documents: [] }
    await saveCache(data, cachePath)
    const raw = await fs.readFile(cachePath, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.fetchedAt).toBe(data.fetchedAt)
  })

  it('loadCache reads and deserializes cached documents', async () => {
    const cachePath = path.join(tmpDir, 'documents.json')
    const data: CacheData = { fetchedAt: new Date().toISOString(), documents: [] }
    await fs.writeFile(cachePath, JSON.stringify(data))
    const loaded = await loadCache(cachePath)
    expect(loaded).not.toBeNull()
    expect(loaded?.fetchedAt).toBe(data.fetchedAt)
  })

  it('loadCache returns null when cache file does not exist', async () => {
    const cachePath = path.join(tmpDir, 'nonexistent.json')
    const loaded = await loadCache(cachePath)
    expect(loaded).toBeNull()
  })

  it('isCacheValid returns true for cache less than 24 hours old', () => {
    const data: CacheData = {
      fetchedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      documents: [],
    }
    expect(isCacheValid(data)).toBe(true)
  })

  it('isCacheValid returns false for cache older than 24 hours', () => {
    const data: CacheData = {
      fetchedAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      documents: [],
    }
    expect(isCacheValid(data)).toBe(false)
  })
})
