import type { Command } from 'commander'
import { DocumentRepository } from '../repository/document-repository.js'
import { SearchMode } from '../core/search-mode.js'

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('키워드로 토스페이먼츠 문서 검상')
    .requiredOption('--version <v1|v2>', 'API 버전 (v1 또는 v2)')
    .requiredOption('--keywords <words...>', '검상 키워드 (하나 이상)')
    .option('--top <n>', '반환할 최대 결과 수', (v) => parseInt(v, 10), 10)
    .option('--mode <broad|balanced|precise>', '검상 모드 (BM25 파라미터 조정)', SearchMode.BALANCED)
    .option('--max-tokens <n>', '출력 토큰 한도', (v) => parseInt(v, 10), 25000)
    .action(async (opts: { version: string; keywords: string[]; top: number; mode: string; maxTokens: number }) => {
      const repo = await DocumentRepository.initialize({ refresh: program.opts().refresh })
      const result = repo.search(
        opts.version as 'v1' | 'v2',
        opts.keywords,
        opts.top,
        opts.mode as SearchMode,
        opts.maxTokens,
      )
      process.stdout.write(result + '\n')
    })
}
