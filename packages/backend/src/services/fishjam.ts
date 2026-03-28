import { FishjamClient, RoomType, type RoomId, type FishjamAgent } from '@fishjam-cloud/js-server-sdk'
import { geminiInputAudioSettings } from '@fishjam-cloud/js-server-sdk/gemini'

export interface FishjamConfig {
  fishjamId: string
  managementToken: string
}

export interface RoomInfo {
  roomId: string
  createdAt: Date
  streamerConnected: boolean
  viewerCount: number
  agent?: FishjamAgent
}

export interface CreateRoomResult {
  roomId: string
  streamerToken: string
  agent: FishjamAgent
}

export interface CreateViewerResult {
  viewerToken: string
}

export class FishjamService {
  private client: FishjamClient
  private activeRooms = new Map<string, RoomInfo>()

  constructor(config: FishjamConfig) {
    this.client = new FishjamClient({
      fishjamId: config.fishjamId,
      managementToken: config.managementToken,
    })
  }

  async createStreamRoom(streamerId: string): Promise<CreateRoomResult> {
    // Use conference room type for multiple speakers with audio
    const room = await this.client.createRoom({
      roomType: RoomType.Conference,
    })

    // Create peer token for the host/streamer
    const { peerToken: streamerToken } = await this.client.createPeer(room.id, {
      metadata: { role: 'host', streamerId, name: 'Host' },
    })

    // Create an agent that subscribes to audio in Gemini-compatible format (16kHz)
    const { agent } = await this.client.createAgent(room.id, {
      subscribeMode: 'auto',
      output: geminiInputAudioSettings,
    })

    this.activeRooms.set(room.id, {
      roomId: room.id,
      createdAt: new Date(),
      streamerConnected: false,
      viewerCount: 0,
      agent,
    })

    console.log(`Created room ${room.id} with agent for streamer ${streamerId}`)

    return { roomId: room.id, streamerToken, agent }
  }

  async createGuestToken(roomId: string, guestName: string): Promise<{ guestToken: string }> {
    const { peerToken: guestToken } = await this.client.createPeer(roomId as RoomId, {
      metadata: { role: 'guest', name: guestName },
    })

    console.log(`Created guest token for ${guestName} in room ${roomId}`)

    return { guestToken }
  }

  async createViewerToken(roomId: string, viewerId?: string): Promise<CreateViewerResult> {
    const { peerToken: viewerToken } = await this.client.createPeer(roomId as RoomId, {
      metadata: { role: 'viewer', viewerId: viewerId || `viewer_${Date.now()}` },
    })

    const roomInfo = this.activeRooms.get(roomId)
    if (roomInfo) {
      roomInfo.viewerCount++
    }

    console.log(`Created viewer token for room ${roomId}`)

    return { viewerToken }
  }

  async closeRoom(roomId: string): Promise<void> {
    await this.client.deleteRoom(roomId as RoomId)
    this.activeRooms.delete(roomId)
    console.log(`Closed room ${roomId}`)
  }

  getRoomInfo(roomId: string): RoomInfo | undefined {
    return this.activeRooms.get(roomId)
  }

  getActiveRooms(): Map<string, RoomInfo> {
    return this.activeRooms
  }

  markStreamerConnected(roomId: string): void {
    const roomInfo = this.activeRooms.get(roomId)
    if (roomInfo) {
      roomInfo.streamerConnected = true
    }
  }

  decrementViewerCount(roomId: string): void {
    const roomInfo = this.activeRooms.get(roomId)
    if (roomInfo && roomInfo.viewerCount > 0) {
      roomInfo.viewerCount--
    }
  }
}

let fishjamService: FishjamService | null = null

export function initFishjamService(config: FishjamConfig): FishjamService {
  fishjamService = new FishjamService(config)
  return fishjamService
}

export function getFishjamService(): FishjamService {
  if (!fishjamService) {
    throw new Error('FishjamService not initialized. Call initFishjamService first.')
  }
  return fishjamService
}
