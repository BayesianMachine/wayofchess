import '@fastify/jwt'
import type { FastifyRequest, FastifyReply } from 'fastify'

export async function optionalAuthenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    ;(request as unknown as { user: null }).user = null
  }
}
