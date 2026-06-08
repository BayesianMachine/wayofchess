import '@fastify/jwt'
import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { UserService } from '../services/UserService.js'
import { authenticate } from '../middleware/authenticate.js'

const userService = new UserService()

const UpdateProfileSchema = z.object({
  avatarUrl: z.string().url().optional(),
  factionPreference: z.enum(['mandalorian', 'imperial', 'auto']).optional(),
  countryCode: z.string().length(2).optional(),
})

const GamesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

async function usersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.patch(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = UpdateProfileSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const profile = await userService.updateProfile(request.user.sub, parsed.data)
      return reply.send(profile)
    },
  )

  fastify.get(
    '/me/games',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = GamesQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const games = await userService.getRecentGames(
        request.user.sub,
        parsed.data.limit,
        parsed.data.offset,
      )
      return reply.send(games)
    },
  )

  fastify.get(
    '/:username',
    async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
      const profile = await userService.getPublicProfile(request.params.username)
      if (!profile) {
        return reply.code(404).send({ error: 'User not found' })
      }
      return reply.send(profile)
    },
  )

  fastify.get(
    '/:username/games',
    async (
      request: FastifyRequest<{ Params: { username: string } }>,
      reply: FastifyReply,
    ) => {
      const parsed = GamesQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      const profile = await userService.getPublicProfile(request.params.username)
      if (!profile) {
        return reply.code(404).send({ error: 'User not found' })
      }

      const games = await userService.getRecentGames(
        profile.id,
        parsed.data.limit,
        parsed.data.offset,
      )
      return reply.send(games)
    },
  )
}

export default fp(
  async (fastify) => {
    await fastify.register(usersRoutes, { prefix: '/api/v1/users' })
  },
  {
    name: 'users-routes',
    fastify: '4.x',
  },
)

export async function registerUsersRoutes(app: FastifyInstance): Promise<void> {
  await app.register(usersRoutes, { prefix: '/api/v1/users' })
}
