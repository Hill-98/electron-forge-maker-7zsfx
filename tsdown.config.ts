import { defineConfig } from 'tsdown'

export default defineConfig({
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
