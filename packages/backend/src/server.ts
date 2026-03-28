import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { clientMessageSchema, type ServerMessage } from '@streamgenius/shared'
import { createGeminiProxy, type GeminiProxy } from './gemini/proxy.js'

interface ServerOptions {
  port: number
}

interface ClientConnection {
  id: string
  ws: WebSocket
  geminiProxy: GeminiProxy | null
}

export function createServer(options: ServerOptions) {
  const { port } = options
  const wss = new WebSocketServer({ port })
  const clients = new Map<string, ClientConnection>()

  wss.on('connection', (ws) => {
    const clientId = randomUUID()
    const connection: ClientConnection = {
      id: clientId,
      ws,
      geminiProxy: null,
    }
    clients.set(clientId, connection)

    console.log(`Client connected: ${clientId}`)

    sendMessage(ws, {
      kind: 'session_status',
      connected: true,
      sessionId: clientId,
      reconnecting: false,
    })

    ws.on('message', async (data) => {
      try {
        const raw = JSON.parse(data.toString())
        const result = clientMessageSchema.safeParse(raw)

        if (!result.success) {
          console.error('Invalid message:', result.error)
          return
        }

        const message = result.data

        switch (message.kind) {
          case 'audio_chunk':
            await handleAudioChunk(connection, message.data)
            break
          case 'overlay_approve':
            console.log(`Overlay approved: ${message.id}`)
            break
          case 'overlay_dismiss':
            console.log(`Overlay dismissed: ${message.id}`)
            break
        }
      } catch (err) {
        console.error('Error processing message:', err)
      }
    })

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`)
      connection.geminiProxy?.close()
      clients.delete(clientId)
    })

    ws.on('error', (err) => {
      console.error(`WebSocket error for ${clientId}:`, err)
    })
  })

  console.log(`WebSocket server started on port ${port}`)

  return {
    close: () => {
      for (const [, client] of clients) {
        client.geminiProxy?.close()
        client.ws.close()
      }
      wss.close()
    },
  }
}

async function handleAudioChunk(connection: ClientConnection, audioData: string) {
  if (!connection.geminiProxy) {
    connection.geminiProxy = createGeminiProxy({
      onTranscript: (text, isFinal) => {
        sendMessage(connection.ws, {
          kind: 'transcript',
          text,
          isFinal,
          timestamp: Date.now(),
        })
      },
      onOverlayProposal: (proposal) => {
        sendMessage(connection.ws, {
          kind: 'overlay_proposal',
          proposal,
        })
      },
      onError: (err) => {
        console.error('Gemini proxy error:', err)
      },
    })
  }

  await connection.geminiProxy.sendAudio(audioData)
}

function sendMessage(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}
