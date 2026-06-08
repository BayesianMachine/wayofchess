import type { Namespace, Socket } from 'socket.io'
import { GameService } from '../services/GameService.js'
import { redis } from '../redis/client.js'
import { spectatorKey } from '../redis/keys.js'
import prisma from '../db/prisma.js'
import type { Square, PromotionPiece, GameResult, EndReason } from '@mandalorian-chess/chess-engine'

const gameService = new GameService()

type GameSocket = Socket & {
  data: {
    userId: string | null
    username: string
    gameId?: string
    playerColor?: 'w' | 'b'
  }
}

export class GameGateway {
  private disconnectTimers = new Map<string, NodeJS.Timeout>()

  constructor(private namespace: Namespace) {}

  handleConnection(socket: GameSocket) {
    if (socket.data.userId) {
      socket.join(`user-${socket.data.userId}`)
    }

    socket.on('game:join', async ({ gameId }: { gameId: string }) => {
      const userId = socket.data.userId
      if (!userId) {
        socket.emit('error', { message: 'Auth required' })
        return
      }

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game) {
        socket.emit('error', { message: 'Game not found' })
        return
      }

      if (userId !== game.whiteUserId && userId !== game.blackUserId) {
        socket.emit('error', { message: 'Not a player in this game' })
        return
      }

      socket.join(`game-${gameId}`)
      socket.data.gameId = gameId
      socket.data.playerColor = game.whiteUserId === userId ? 'w' : 'b'

      const timerKey = `${gameId}:${userId}`
      const pendingTimer = this.disconnectTimers.get(timerKey)
      if (pendingTimer) {
        clearTimeout(pendingTimer)
        this.disconnectTimers.delete(timerKey)
        socket.to(`game-${gameId}`).emit('opponent:reconnected', { gameId })
      }
    })

    socket.on(
      'move:submit',
      async ({
        gameId,
        from,
        to,
        promotion,
      }: {
        gameId: string
        from: string
        to: string
        promotion?: string
      }) => {
        const userId = socket.data.userId
        if (!userId) {
          socket.emit('error', { message: 'Auth required' })
          return
        }

        const result = await gameService.submitMove(
          gameId,
          userId,
          from as Square,
          to as Square,
          promotion as PromotionPiece | undefined,
        )

        if (!result.valid) {
          socket.emit('move:rejected', { gameId, reason: result.reason })
          return
        }

        const spectatorCount = (await redis.get(spectatorKey(gameId))) ?? '0'

        this.namespace.to(`game-${gameId}`).emit('move:applied', {
          gameId,
          move: result.move,
          fen: result.fen,
          clocks: result.clocks,
          spectatorCount,
        })

        if (result.isGameOver && result.result && result.endReason) {
          this.namespace.to(`game-${gameId}`).emit('game:end', {
            gameId,
            result: result.result,
            reason: result.endReason,
            eloDeltas: null,
          })
        }
      },
    )

    socket.on('draw:offer', async ({ gameId }: { gameId: string }) => {
      const userId = socket.data.userId
      if (!userId) {
        socket.emit('error', { message: 'Auth required' })
        return
      }

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || (userId !== game.whiteUserId && userId !== game.blackUserId)) {
        socket.emit('error', { message: 'Not a player in this game' })
        return
      }

      const byColor = game.whiteUserId === userId ? 'w' : 'b'
      this.namespace.to(`game-${gameId}`).emit('draw:offered', { gameId, byColor })
    })

    socket.on('draw:respond', async ({ gameId, accept }: { gameId: string; accept: boolean }) => {
      const userId = socket.data.userId
      if (!userId) {
        socket.emit('error', { message: 'Auth required' })
        return
      }

      if (accept) {
        await gameService.endGame(gameId, '1/2-1/2', 'agreement')
        this.namespace.to(`game-${gameId}`).emit('game:end', {
          gameId,
          result: '1/2-1/2' as GameResult,
          reason: 'agreement' as EndReason,
          eloDeltas: null,
        })
      } else {
        this.namespace.to(`game-${gameId}`).emit('draw:declined', { gameId })
      }
    })

    socket.on('resign', async ({ gameId }: { gameId: string }) => {
      const userId = socket.data.userId
      if (!userId) {
        socket.emit('error', { message: 'Auth required' })
        return
      }

      const game = await prisma.game.findUnique({ where: { id: gameId } })
      if (!game || (userId !== game.whiteUserId && userId !== game.blackUserId)) {
        socket.emit('error', { message: 'Not a player in this game' })
        return
      }

      const playerColor = game.whiteUserId === userId ? 'w' : 'b'
      const result: GameResult = playerColor === 'w' ? '0-1' : '1-0'

      await gameService.endGame(gameId, result, 'resignation')
      this.namespace.to(`game-${gameId}`).emit('game:end', {
        gameId,
        result,
        reason: 'resignation',
        eloDeltas: null,
      })
    })

    socket.on('disconnect', () => {
      const gameId = socket.data.gameId
      if (!gameId || !socket.data.userId) return

      const userId = socket.data.userId

      socket.to(`game-${gameId}`).emit('opponent:disconnected', { gameId, remainingMs: 60000 })

      const timer = setTimeout(async () => {
        const sockets = await this.namespace.in(`game-${gameId}`).fetchSockets()
        const playerReconnected = sockets.some((s) => s.data.userId === userId)
        if (!playerReconnected) {
          const result: GameResult = socket.data.playerColor === 'w' ? '0-1' : '1-0'
          await gameService.endGame(gameId, result, 'timeout')
          this.namespace.to(`game-${gameId}`).emit('game:end', {
            gameId,
            result,
            reason: 'timeout',
            eloDeltas: null,
          })
        }
      }, 60_000)

      this.disconnectTimers.set(`${gameId}:${userId}`, timer)
    })
  }
}
