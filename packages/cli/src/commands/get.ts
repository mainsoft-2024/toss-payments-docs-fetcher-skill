import type { Command } from 'commander'
import { DocumentRepository } from '../repository/document-repository.js'

export function registerGetCommand(program: Command): void {
  program
    .command('get')
    .description('ID로 토스페이먼츠 문서 조회')
    .requiredOption('--id <n>', '문서 ID', (v) => parseInt(v, 10))
    .action(async (opts: { id: number }) => {
      const repo = await DocumentRepository.initialize({ refresh: program.opts().refresh })
      const doc = repo.getDocumentById(opts.id)
      if (!doc) {
        process.stderr.write('문서를 찾을 수 없습니다.\n')
        process.exit(1)
      }
      const content = [
        `# ${doc.title}`,
        `* ID: ${doc.id}`,
        `* 링크: ${doc.link}`,
        `* 설명: ${doc.description}`,
        '',
        ...doc.chunks.map((c) => c.text),
      ].join('\n')
      process.stdout.write(content + '\n')
    })
}
