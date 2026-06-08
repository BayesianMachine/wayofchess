import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate.js'
import prisma from '../db/prisma.js'
import { redis } from '../redis/client.js'
import { matchmakingQueueKey, matchmakingUserTcKey } from '../redis/keys.js'

const TIME_CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'] as const

const JoinBodySchema = z.object({
  timeControlBaseSec: z.number().int().positive(),
  timeControlIncSec: z.number().int().min(0),
  category: z.enum(TIME_CATEGORIES),
})

const StatusQuerySchema = z.object({
  category: z.enum(TIME_CATEGORIES),
})

async function matchmakingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/join',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = JoinBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const { category } = parsed.data
      const userId = request.user.sub

      const userRating = await prisma.userRating.findUnique({
        where: { userId_category: { userId, category } },
        select: { rating: true },
      })
      const rating = userRating?.rating ?? 1200
      const score = rating * 1e6 + Date.now()

      await redis.zadd(matchmakingQueueKey(category), score, userId)
      await redis.set(matchmakingUserTcKey(userId), category)

      return reply.send({ queued: true, category })
    },
  )

  fastify.post(
    '/leave',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.sub
      const category = await redis.get(matchmakingUserTcKey(userId))

      if (category) {
        await redis.zrem(matchmakingQueueKey(category), userId)
        await redis.del(matchmakingUserTcKey(userId))
      }

      return reply.send({ left: true })
    },
  )

  fastify.get(
    '/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = StatusQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const queueSize = await redis.zcard(matchmakingQueueKey(parsed.data.category))
      return reply.send({ queueSize })
    },
  )
}

export default fp(
  async (fastify) => {
    await fastify.register(matchmakingRoutes, { prefix: '/api/v1/matchmaking' })
  },
  {
    name: 'matchmaking-routes',
    fastify: '4.x',
  },
)

export async function registerMatchmakingRoutes(app: FastifyInstance): Promise<void> {
  await app.register(matchmakingRoutes, { prefix: '/api/v1/matchmaking' })
}
