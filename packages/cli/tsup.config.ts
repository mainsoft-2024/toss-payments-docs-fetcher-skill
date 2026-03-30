import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  outDir: '../../skills/tosspayments-docs/scripts',
  format: ['esm'],
  target: 'node22',
  clean: true,
  dts: false,
  shims: true,
  noExternal: [/.*/],
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire } from "module";\nconst require = createRequire(import.meta.url);',
  },
})
