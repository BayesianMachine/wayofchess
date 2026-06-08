import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { GameService } from '../services/GameService.js'
import { authenticate } from '../middleware/authenticate.js'
import prisma from '../db/prisma.js'
import { gameStateKey, GAME_STATE_FIELDS } from '../redis/keys.js'
import { redis } from '../redis/client.js'

const gameService = new GameService()

const TIME_CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'] as const

const ChallengeBodySchema = z.object({
  timeControlBaseSec: z.number().int().positive(),
  timeControlIncSec: z.number().int().min(0),
  category: z.enum(TIME_CATEGORIES),
})

const LobbyQuerySchema = z.object({
  category: z.enum(TIME_CATEGORIES).optional(),
})

function timeControlLabel(baseSec: number, incSec: number): string {
  const baseMin = baseSec / 60
  if (Number.isInteger(baseMin)) {
    return `${baseMin}+${incSec}`
  }
  return `${baseSec}+${incSec}`
}

async function getPlayerRating(userId: string | null, category: string): Promise<number> {
  if (!userId) return 1200
  const rating = await prisma.userRating.findUnique({
    where: { userId_category: { userId, category } },
    select: { rating: true },
  })
  return rating?.rating ?? 1200
}

async function gamesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/lobby',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = LobbyQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const games = await gameService.getGameForLobby(parsed.data.category)
      const summaries = await Promise.all(
        games.map(async (game) => {
          const [whiteRating, blackRating] = await Promise.all([
            getPlayerRating(game.whiteUserId, game.category),
            getPlayerRating(game.blackUserId, game.category),
          ])

          return {
            id: game.id,
            mode: game.mode as 'online' | 'local' | 'ai',
            status: game.status as 'waiting' | 'active' | 'ended',
            result: game.result as '1-0' | '0-1' | '1/2-1/2' | null,
            endReason: game.endReason,
            timeControl: {
              baseSec: game.timeControlBaseSec,
              incrementSec: game.timeControlIncSec,
              category: game.category,
              label: timeControlLabel(game.timeControlBaseSec, game.timeControlIncSec),
            },
            whitePlayer: game.whitePlayer
              ? { id: game.whitePlayer.id, username: game.whitePlayer.username, rating: whiteRating }
              : null,
            blackPlayer: game.blackPlayer
              ? { id: game.blackPlayer.id, username: game.blackPlayer.username, rating: blackRating }
              : null,
            startedAt: game.startedAt?.toISOString() ?? null,
            endedAt: game.endedAt?.toISOString() ?? null,
          }
        }),
      )

      return reply.send(summaries)
    },
  )

  fastify.post(
    '/challenge',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ChallengeBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const { id: gameId } = await gameService.createGame({
        whiteUserId: request.user.sub,
        blackUserId: null,
        mode: 'online',
        timeControlBaseSec: parsed.data.timeControlBaseSec,
        timeControlIncSec: parsed.data.timeControlIncSec,
        category: parsed.data.category,
      })

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      return reply.code(201).send({
        gameId,
        inviteUrl: `${frontendUrl}/play/${gameId}`,
      })
    },
  )

  fastify.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const game = await prisma.game.findUnique({
        where: { id: request.params.id },
        include: {
          whitePlayer: { select: { id: true, username: true } },
          blackPlayer: { select: { id: true, username: true } },
        },
      })

      if (!game) {
        return reply.code(404).send({ error: 'Game not found' })
      }

      return reply.send(game)
    },
  )

  fastify.get(
    '/:id/state',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const gameId = request.params.id
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { status: true },
      })

      if (!game) {
        return reply.code(404).send({ error: 'Game not found' })
      }

      const state = await gameService.getGameState(gameId)
      if (!state) {
        return reply.code(404).send({ error: 'Game state not found' })
      }

      const raw = await redis.hgetall(gameStateKey(gameId))
      const status =
        (raw[GAME_STATE_FIELDS.status] as 'waiting' | 'active' | 'ended' | undefined) ??
        (game.status as 'waiting' | 'active' | 'ended')

      const moves = await prisma.move.findMany({
        where: { gameId },
        orderBy: [{ moveNumber: 'asc' }, { color: 'asc' }],
        select: {
          san: true,
          fromSq: true,
          toSq: true,
          promotion: true,
        },
      })

      return reply.send({
        fen: state.fen,
        moves: moves.map((m) => ({
          san: m.san,
          from: m.fromSq,
          to: m.toSq,
          ...(m.promotion ? { promotion: m.promotion } : {}),
        })),
        clocks: {
          whiteMs: state.whiteMs,
          blackMs: state.blackMs,
        },
        status,
      })
    },
  )

  fastify.get(
    '/:id/moves',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const gameId = request.params.id
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { id: true },
      })

      if (!game) {
        return reply.code(404).send({ error: 'Game not found' })
      }

      const moves = await prisma.move.findMany({
        where: { gameId },
        orderBy: [{ moveNumber: 'asc' }, { color: 'asc' }],
      })

      return reply.send(moves)
    },
  )
}

export default fp(
  async (fastify) => {
    await fastify.register(gamesRoutes, { prefix: '/api/v1/games' })
  },
  {
    name: 'games-routes',
    fastify: '4.x',
  },
)

export async function registerGamesRoutes(app: FastifyInstance): Promise<void> {
  await app.register(gamesRoutes, { prefix: '/api/v1/games' })
}
