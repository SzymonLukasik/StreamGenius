import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDir = dirname(fileURLToPath(import.meta.url))
const targetPath = resolve(scriptDir, '../public/smelter.wasm')
const smelterEntryPath = require.resolve('@swmansion/smelter-web-wasm')
const sourcePath = resolve(dirname(smelterEntryPath), '../../../smelter-browser-render/dist/smelter.wasm')

if (!existsSync(sourcePath)) {
  throw new Error(`Smelter WASM bundle not found at ${sourcePath}`)
}

mkdirSync(dirname(targetPath), { recursive: true })
copyFileSync(sourcePath, targetPath)
