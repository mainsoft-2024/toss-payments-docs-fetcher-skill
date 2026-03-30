import { Command } from 'commander'
import { fileURLToPath } from 'node:url'
import { registerSearchCommand } from './commands/search.js'
import { registerGetCommand } from './commands/get.js'

export function buildProgram(): Command {
  const program = new Command()
  program
    .name('tosspayments-docs')
    .description('토스페이먼츠 연동 가이드 문서 검색 CLI')
    .option('--refresh', '캐시를 무시하고 문서를 새로 가져옵니다')

  registerSearchCommand(program)
  registerGetCommand(program)

  return program
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  buildProgram().parse()
}
