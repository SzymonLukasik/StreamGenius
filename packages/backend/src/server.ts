import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { clientMessageSchema, type ServerMessage } from '@streamgenius/shared'
import { createGeminiLiveSession, type GeminiLiveSession } from './gemini/live-session.js'
import { initFishjamService, getFishjamService } from './services/fishjam.js'
import { getThumbnailBuffer } from './fetchers/youtube.js'

interface ServerOptions {
  port: number
  fishjamId?: string
  fishjamManagementToken?: string
}

interface ClientConnection {
  id: string
  ws: WebSocket
  roomId: string | null
  role: 'host' | 'guest' | null
  name: string | null
}

interface Room {
  id: string
  hostConnectionId: string
  geminiSession: GeminiLiveSession | null
  participants: Set<string> // connection IDs
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

  // HTTP server for thumbnail serving + WebSocket upgrade
  const httpServer = createHttpServer((req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for Smelter WASM fetching thumbnails
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Serve cached PNG thumbnails: /thumbnails/:id.png
    const match = req.url?.match(/^\/thumbnails\/([a-f0-9-]+)\.png$/)
    if (match) {
      const buffer = getThumbnailBuffer(match[1])
      if (buffer) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buffer.length })
        res.end(buffer)
        return
      }
      res.writeHead(404)
      res.end('Not found')
      return
    }

    res.writeHead(404)
    res.end()
  })

  const wss = new WebSocketServer({ server: httpServer })
  const clients = new Map<string, ClientConnection>()
  const rooms = new Map<string, Room>()

  // Broadcast to all participants in a room
  function broadcastToRoom(roomId: string, message: ServerMessage) {
    const room = rooms.get(roomId)
    if (!room) return

    for (const connectionId of room.participants) {
      const client = clients.get(connectionId)
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message))
      }
    }
  }

  wss.on('connection', (ws) => {
    const clientId = randomUUID()
    const connection: ClientConnection = {
      id: clientId,
      ws,
      roomId: null,
      role: null,
      name: null,
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
            console.log('Audio chunk received via WebSocket (ignored - use Fishjam)')
            break
          case 'text_input':
            console.log(`Text input: ${message.text}`)
            break
          case 'overlay_approve':
            console.log(`Overlay approved: ${message.id}`)
            break
          case 'overlay_dismiss':
            console.log(`Overlay dismissed: ${message.id}`)
            break
          case 'fishjam_join':
            await handleFishjamJoin(connection, message.streamerId)
            break
          case 'fishjam_leave':
            await handleFishjamLeave(connection, message.roomId)
            break
          case 'fishjam_join_as_guest':
            await handleFishjamJoinAsGuest(connection, message.roomId, message.guestName)
            break
        }
      } catch (err) {
        console.error('Error processing message:', err)
      }
    })

    ws.on('close', async () => {
      console.log(`Client disconnected: ${clientId}`)

      // Remove from room participants
      if (connection.roomId) {
        const room = rooms.get(connection.roomId)
        if (room) {
          room.participants.delete(clientId)

          // If host disconnected, close the room
          if (room.hostConnectionId === clientId) {
            room.geminiSession?.close()
            rooms.delete(connection.roomId)

            try {
              const fishjam = getFishjamService()
              await fishjam.closeRoom(connection.roomId)
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      }

      clients.delete(clientId)
    })

    ws.on('error', (err) => {
      console.error(`WebSocket error for ${clientId}:`, err)
    })
  })

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

      // Create room and add host
      const room: Room = {
        id: roomId,
        hostConnectionId: connection.id,
        geminiSession: null,
        participants: new Set([connection.id]),
      }
      rooms.set(roomId, room)

      connection.roomId = roomId
      connection.role = 'host'
      connection.name = 'Host'

      // Create Gemini Live session - broadcasts to all room participants
      room.geminiSession = await createGeminiLiveSession(agent, {
        onTranscript: (text, isFinal, speakerId) => {
          broadcastToRoom(roomId, {
            kind: 'transcript',
            text: speakerId ? `[${speakerId}] ${text}` : text,
            isFinal,
            timestamp: Date.now(),
          })
        },
        onReasoning: (text) => {
          broadcastToRoom(roomId, {
            kind: 'reasoning',
            text,
            timestamp: Date.now(),
          })
        },
        onOverlayProposal: (proposal) => {
          broadcastToRoom(roomId, {
            kind: 'overlay_proposal',
            proposal,
          })
        },
        onError: (err) => {
          console.error('Gemini Live session error:', err)
          broadcastToRoom(roomId, {
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

      const activeRoomId = connection.roomId
      if (activeRoomId) {
        const room = rooms.get(activeRoomId)
        room?.geminiSession?.close()
        rooms.delete(activeRoomId)

        try {
          const fishjam = getFishjamService()
          await fishjam.closeRoom(activeRoomId)
        } catch (cleanupError) {
          console.error('Failed to clean up room after startup error:', cleanupError)
        } finally {
          if (connection.roomId === activeRoomId) {
            connection.roomId = null
            connection.role = null
            connection.name = null
          }
        }
      }

      sendMessage(connection.ws, {
        kind: 'server_error',
        message: `Failed to start broadcast: ${formatError(error)}`,
      })
    }
  }

  async function handleFishjamJoinAsGuest(
    connection: ClientConnection,
    roomId: string,
    guestName: string
  ) {
    console.log(`Guest "${guestName}" requesting to join room: ${roomId}`)
    try {
      const fishjam = getFishjamService()
      const { guestToken } = await fishjam.createGuestToken(roomId, guestName)

      // Add guest to room participants
      const room = rooms.get(roomId)
      if (room) {
        room.participants.add(connection.id)
        connection.roomId = roomId
        connection.role = 'guest'
        connection.name = guestName
        console.log(`Guest "${guestName}" added to room ${roomId}, total participants: ${room.participants.size}`)
      }

      sendMessage(connection.ws, {
        kind: 'fishjam_guest_token',
        roomId,
        guestToken,
        guestName,
      })

      console.log(`Guest token created for "${guestName}" in room ${roomId}`)
    } catch (error) {
      console.error('Failed to create guest token:', error)
      sendMessage(connection.ws, {
        kind: 'server_error',
        message: `Failed to join room: ${formatError(error)}`,
      })
    }
  }

  async function handleFishjamLeave(connection: ClientConnection, roomId: string) {
    try {
      const room = rooms.get(roomId)

      if (room) {
        room.participants.delete(connection.id)

        // If host is leaving, close everything
        if (room.hostConnectionId === connection.id) {
          room.geminiSession?.close()
          rooms.delete(roomId)

          const fishjam = getFishjamService()
          await fishjam.closeRoom(roomId)
        }
      }

      connection.roomId = null
      connection.role = null

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

  httpServer.listen(port, () => {
    console.log(`HTTP + WebSocket server started on port ${port}`)
  })

  return {
    close: () => {
      for (const [, room] of rooms) {
        room.geminiSession?.close()
      }
      for (const [, client] of clients) {
        client.ws.close()
      }
      wss.close()
      httpServer.close()
    },
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
