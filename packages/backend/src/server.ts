import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { clientMessageSchema, type ServerMessage } from '@streamgenius/shared'
import { createGeminiLiveSession, type GeminiLiveSession } from './gemini/live-session.js'
import { initFishjamService, getFishjamService } from './services/fishjam.js'

interface ServerOptions {
  port: number
  fishjamId?: string
  fishjamManagementToken?: string
}

interface ClientConnection {
  id: string
  ws: WebSocket
  geminiSession: GeminiLiveSession | null
  roomId: string | null
}

export function createServer(options: ServerOptions) {
  const { port, fishjamId, fishjamManagementToken } = options

  // Initialize Fishjam service if credentials are provided
  if (fishjamId && fishjamManagementToken) {
    initFishjamService({ fishjamId, managementToken: fishjamManagementToken })
    console.log('Fishjam service initialized')
  } else {
    console.warn('Fishjam credentials not provided, broadcasting disabled')
  }

  const wss = new WebSocketServer({ port })
  const clients = new Map<string, ClientConnection>()

  wss.on('connection', (ws) => {
    const clientId = randomUUID()
    const connection: ClientConnection = {
      id: clientId,
      ws,
      geminiSession: null,
      roomId: null,
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
            // Audio now flows through Fishjam agent -> Gemini Live
            // This endpoint is kept for backwards compatibility but does nothing
            console.log('Audio chunk received via WebSocket (ignored - use Fishjam)')
            break
          case 'text_input':
            // Text input can still be used for manual testing
            console.log(`Text input: ${message.text}`)
            break
          case 'overlay_approve':
            console.log(`Overlay approved: ${message.id}`)
            // TODO: Update overlay state, trigger display
            break
          case 'overlay_dismiss':
            console.log(`Overlay dismissed: ${message.id}`)
            // TODO: Update overlay state, remove from queue
            break
          case 'fishjam_join':
            await handleFishjamJoin(connection, message.streamerId)
            break
          case 'fishjam_leave':
            await handleFishjamLeave(connection, message.roomId)
            break
        }
      } catch (err) {
        console.error('Error processing message:', err)
      }
    })

    ws.on('close', async () => {
      console.log(`Client disconnected: ${clientId}`)

      // Close Gemini session
      connection.geminiSession?.close()

      // Clean up Fishjam room if exists
      if (connection.roomId) {
        try {
          const fishjam = getFishjamService()
          await fishjam.closeRoom(connection.roomId)
        } catch {
          // Ignore errors during cleanup
        }
      }

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
        client.geminiSession?.close()
        client.ws.close()
      }
      wss.close()
    },
  }
}

async function handleFishjamJoin(connection: ClientConnection, streamerId: string) {
  console.log(`handleFishjamJoin called for streamer: ${streamerId}`)
  try {
    if (connection.roomId) {
      await handleFishjamLeave(connection, connection.roomId)
    }

    const fishjam = getFishjamService()
    console.log('Creating Fishjam room...')
    const { roomId, streamerToken, agent } = await fishjam.createStreamRoom(streamerId)
    console.log(`Room created: ${roomId}`)

    connection.roomId = roomId

    // Create Gemini Live session connected to the Fishjam agent
    // Audio flows: Streamer -> Fishjam Room -> Agent -> Gemini Live API
    connection.geminiSession = await createGeminiLiveSession(agent, {
      onTranscript: (text, isFinal) => {
        sendMessage(connection.ws, {
          kind: 'transcript',
          text,
          isFinal,
          timestamp: Date.now(),
        })
      },
      onReasoning: (text) => {
        sendMessage(connection.ws, {
          kind: 'reasoning',
          text,
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
        console.error('Gemini Live session error:', err)
        sendMessage(connection.ws, {
          kind: 'server_error',
          message: `Gemini session error: ${formatError(err)}`,
        })
      },
    })

    console.log(`Gemini Live session created for room ${roomId}`)

    sendMessage(connection.ws, {
      kind: 'fishjam_room_created',
      roomId,
      streamerToken,
    })
  } catch (error) {
    console.error('Failed to create Fishjam room:', error)

    connection.geminiSession?.close()
    connection.geminiSession = null

    if (connection.roomId) {
      try {
        const fishjam = getFishjamService()
        await fishjam.closeRoom(connection.roomId)
      } catch (cleanupError) {
        console.error('Failed to clean up room after startup error:', cleanupError)
      } finally {
        connection.roomId = null
      }
    }

    sendMessage(connection.ws, {
      kind: 'server_error',
      message: `Failed to start broadcast: ${formatError(error)}`,
    })
  }
}

async function handleFishjamLeave(connection: ClientConnection, roomId: string) {
  try {
    // Close Gemini session first
    connection.geminiSession?.close()
    connection.geminiSession = null

    const fishjam = getFishjamService()
    await fishjam.closeRoom(roomId)

    connection.roomId = null

    sendMessage(connection.ws, {
      kind: 'fishjam_room_closed',
      roomId,
    })
  } catch (error) {
    console.error('Failed to close Fishjam room:', error)
    sendMessage(connection.ws, {
      kind: 'server_error',
      message: `Failed to stop broadcast: ${formatError(error)}`,
    })
  }
}

function sendMessage(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}
