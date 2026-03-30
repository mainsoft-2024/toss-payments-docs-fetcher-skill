import { describe, it, expect, vi } from 'vitest'
import { buildProgram } from '../cli.js'

vi.mock('../repository/document-repository.js', () => ({
  DocumentRepository: {
    initialize: vi.fn().mockResolvedValue({
      search: vi.fn().mockReturnValue('스터비 결과'),
      getDocumentById: vi.fn().mockReturnValue({ title: '테스트', chunks: [] }),
    }),
  },
}))

describe('CLI argument parsing', () => {
  it('search command parses --version, --keywords, --top correctly', async () => {
    const program = buildProgram()
    const parsed: { version?: string; keywords?: string[]; top?: number } = {}
    program.commands
      .find((c) => c.name() === 'search')!
      .action((opts) => {
        parsed.version = opts.version
        parsed.keywords = opts.keywords
        parsed.top = opts.top
      })
    await program.parseAsync(['node', 'cli.js', 'search', '--version', 'v2', '--keywords', '결제', '--top', '5'])
    expect(parsed.version).toBe('v2')
    expect(parsed.keywords).toEqual(['결제'])
    expect(parsed.top).toBe(5)
  })

  it('get command parses --id correctly', async () => {
    const program = buildProgram()
    const parsed: { id?: number } = {}
    program.commands
      .find((c) => c.name() === 'get')!
      .action((opts) => {
        parsed.id = opts.id
      })
    await program.parseAsync(['node', 'cli.js', 'get', '--id', '3'])
    expect(parsed.id).toBe(3)
  })

  it('search command exits with error when --version is missing', () => {
    const program = buildProgram()
    program.exitOverride()
    expect(() => program.parse(['node', 'cli.js', 'search', '--keywords', '결제'])).toThrow()
  })

  it('search command exits with error when --keywords is missing', () => {
    const program = buildProgram()
    program.exitOverride()
    expect(() => program.parse(['node', 'cli.js', 'search', '--version', 'v2'])).toThrow()
  })

  it('get command exits with error when --id is missing', () => {
    const program = buildProgram()
    program.exitOverride()
    expect(() => program.parse(['node', 'cli.js', 'get'])).toThrow()
  })
})
