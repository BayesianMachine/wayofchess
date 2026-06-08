import '@fastify/jwt'
import fp from 'fastify-plugin'
import { z } from 'zod'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  RegisterBodySchema,
  LoginBodySchema,
  RefreshBodySchema,
} from '@mandalorian-chess/shared-types'
import { AuthService } from '../services/AuthService.js'

const RegisterBodySchemaStrict = RegisterBodySchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

const AUTH_ERROR_STATUS: Record<string, number> = {
  USERNAME_TAKEN: 409,
  EMAIL_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH_TOKEN: 401,
}

function sendAuthError(error: unknown, reply: FastifyReply): void {
  if (error instanceof Error && error.message in AUTH_ERROR_STATUS) {
    reply
      .code(AUTH_ERROR_STATUS[error.message]!)
      .send({ error: error.message })
    return
  }
  reply.code(500).send({ error: 'Internal Server Error' })
}

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/register',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
          keyGenerator: (req) => `register:${req.ip}`,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = RegisterBodySchemaStrict.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      try {
        const user = await AuthService.register(
          parsed.data.username,
          parsed.data.email,
          parsed.data.password,
        )
        return reply.code(201).send({ user })
      } catch (error) {
        sendAuthError(error, reply)
      }
    },
  )

  fastify.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `login:${req.ip}`,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = LoginBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      try {
        const result = await AuthService.login(
          parsed.data.email,
          parsed.data.password,
          fastify,
        )
        return reply.code(200).send(result)
      } catch (error) {
        sendAuthError(error, reply)
      }
    },
  )

  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = RefreshBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
    }

    try {
      const result = await AuthService.refresh(parsed.data.refreshToken, fastify)
      return reply.code(200).send(result)
    } catch (error) {
      sendAuthError(error, reply)
    }
  })

  fastify.post(
    '/logout',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = RefreshBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
      }

      try {
        await AuthService.logout(
          request.user.sub,
          parsed.data.refreshToken,
          request.user.jti,
        )
        return reply.code(204).send()
      } catch (error) {
        sendAuthError(error, reply)
      }
    },
  )
}

export default fp(
  async (fastify) => {
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
  },
  {
    name: 'auth-routes',
    fastify: '4.x',
  },
)
