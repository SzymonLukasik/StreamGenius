import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

import { createServer } from './server.js'

const PORT = parseInt(process.env.PORT || '3001', 10)
const FISHJAM_ID = process.env.FISHJAM_ID
const FISHJAM_MANAGEMENT_TOKEN = process.env.FISHJAM_MANAGEMENT_TOKEN

async function main() {
  console.log(`StreamGenius Backend`)
  console.log(`Environment check:`)
  console.log(`  FISHJAM_ID: ${FISHJAM_ID ? '***' + FISHJAM_ID.slice(-4) : 'NOT SET'}`)
  console.log(`  FISHJAM_MANAGEMENT_TOKEN: ${FISHJAM_MANAGEMENT_TOKEN ? '***' + FISHJAM_MANAGEMENT_TOKEN.slice(-4) : 'NOT SET'}`)
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'NOT SET'}`)

  const server = createServer({
    port: PORT,
    fishjamId: FISHJAM_ID,
    fishjamManagementToken: FISHJAM_MANAGEMENT_TOKEN,
  })

  console.log(`WebSocket server listening on port ${PORT}`)

  process.on('SIGINT', () => {
    console.log('Shutting down...')
    server.close()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
