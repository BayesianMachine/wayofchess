import type { Namespace, Socket } from 'socket.io'
import { redis } from '../redis/client.js'
import { spectatorKey } from '../redis/keys.js'

type GameSocket = Socket & {
  data: { userId: string | null; spectatingGameId?: string }
}

export class SpectatorGateway {
  constructor(private namespace: Namespace) {}

  handleConnection(socket: GameSocket) {
    socket.on('spectate:join', async ({ gameId }: { gameId: string }) => {
      socket.join(`game-${gameId}`)
      await redis.incr(spectatorKey(gameId))
      socket.data.spectatingGameId = gameId
    })

    socket.on('disconnect', async () => {
      const gameId = socket.data.spectatingGameId as string | undefined
      if (gameId) {
        const count = await redis.decr(spectatorKey(gameId))
        if (count < 0) await redis.set(spectatorKey(gameId), '0')
      }
    })
  }
}
