import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redisPub, redisSub } from '../redis/client.js'
import type { FastifyInstance } from 'fastify'
import { GameGateway } from './GameGateway.js'
import { SpectatorGateway } from './SpectatorGateway.js'
import jwt from 'jsonwebtoken'

export function setupSocketServer(fastify: FastifyInstance): Server {
  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    },
  })

  // Redis adapter for horizontal scaling
  redisPub.connect().catch(console.error)
  redisSub.connect().catch(console.error)
  io.adapter(createAdapter(redisPub, redisSub))

  // /game namespace
  const gameNs = io.of('/game')

  // JWT auth middleware on namespace
  gameNs.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) {
      // Guest — allowed as spectator only
      socket.data.userId = null
      socket.data.username = 'Guest'
      return next()
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as {
        sub: string
        username: string
      }
      socket.data.userId = payload.sub
      socket.data.username = payload.username
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  const gameGateway = new GameGateway(gameNs)
  const spectatorGateway = new SpectatorGateway(gameNs)

  gameNs.on('connection', (socket) => {
    gameGateway.handleConnection(socket)
    spectatorGateway.handleConnection(socket)
  })

  return io
}
