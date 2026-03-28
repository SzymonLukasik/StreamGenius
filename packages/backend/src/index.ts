import { createServer } from './server.js'

const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10)

async function main() {
  const server = createServer({ port: WS_PORT })

  console.log(`StreamGenius Backend`)
  console.log(`WebSocket server listening on port ${WS_PORT}`)

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
