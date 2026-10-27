import { ok } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import type { UserConfig } from 'tsdown'

const SevenZOutput = execSync(`"${import.meta.dirname}\\bin\\7zr.exe"`, {
  encoding: 'utf-8',
})
const SevenZVersion = /^7-Zip.*? (\d+\.\d+)(?: |$)/m.exec(SevenZOutput)?.[1]
ok(SevenZVersion, 'Unable to determine the 7-Zip version')
console.warn(`7-Zip version: ${SevenZVersion}`)
ok(/^\d+\.\d+$/.test(SevenZVersion))

const config: UserConfig = {
  define: {
    'process.env.SEVENZ_VERSION': JSON.stringify(SevenZVersion),
  },
  dts: true,
  entry: './src/index.ts',
  exports: {
    packageJson: false,
  },
  format: 'esm',
  inputOptions: {
    experimental: {
      attachDebugInfo: 'none',
    },
  },
  outputOptions: {
    comments: false,
  },
}

export default config
