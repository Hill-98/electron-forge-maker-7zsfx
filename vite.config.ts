import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig({
  build: {
    outDir: 'dist',
    target: ['node16'],
    minify: false,
    lib: {
      entry: 'src/index.ts',
      fileName(format, entry) {
        return format === 'es' ? entry.concat('.js') : entry.concat('.cjs')
      },
      formats: ['cjs'],
    },
    reportCompressedSize: false,
    rolldownOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((v) => `node:${v}`),
        ...Object.keys(pkg.dependencies),
      ],
    },
  },
  plugins: [dts({ rollupTypes: true })],
})
