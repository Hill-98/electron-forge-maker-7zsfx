import { ok } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { defineConfig } from 'tsdown'

const SevenZVersion = execSync(`${import.meta.dirname}\\bin\\7zr.exe`, {
  encoding: 'utf-8',
})
  .split('\n')[1]
  .split(' ')[2]
  .trim()
console.warn(`7-Zip version: ${SevenZVersion}`)
ok(/^\d+\.\d+$/.test(SevenZVersion))

export default defineConfig({
  define: {
    'process.env.SEVENZ_VERSION': JSON.stringify(SevenZVersion),
  },
  dts: true,
  entry: './src/index.ts',
  exports: {
    packageJson: false,
  },
  format: 'cjs',
  inputOptions: {
    experimental: {
      attachDebugInfo: 'none',
    },
  },
  outputOptions: {
    comments: false,
  },
})
