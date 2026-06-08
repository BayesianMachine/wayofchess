import '@fastify/jwt'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { redis } from '../redis/client.js'
import { jtiBlacklistKey } from '../redis/keys.js'

const JWT_ISSUER = process.env.JWT_ISSUER ?? 'mandalorian-chess'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'mandalorian-chess-client'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; username: string; jti: string }
    user: { sub: string; username: string; jti: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify({
      allowedIss: JWT_ISSUER,
      allowedAud: JWT_AUDIENCE,
    })
  } catch {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }

  const { jti } = request.user
  if (jti) {
    const blacklisted = await redis.get(jtiBlacklistKey(jti))
    if (blacklisted) {
      reply.code(401).send({ error: 'Token revoked' })
    }
  }
}
