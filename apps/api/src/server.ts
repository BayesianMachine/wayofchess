import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwtPlugin from '@fastify/jwt'
import { authenticate } from './middleware/authenticate.js'
import authRoutes from './routes/auth.js'
import gamesRoutes from './routes/games.js'
import matchmakingRoutes from './routes/matchmaking.js'
import usersRoutes from './routes/users.js'
import { setupSocketServer } from './gateways/socketServer.js'
import { MatchmakingService } from './services/MatchmakingService.js'
import { GameService } from './services/GameService.js'
import { redis } from './redis/client.js'
import prisma from './db/prisma.js'

const PORT = Number(process.env.PORT ?? 3000)
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const BODY_LIMIT = Number(process.env.BODY_LIMIT ?? 65536)

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    bodyLimit: BODY_LIMIT,
  })

  app.addHook('onRequest', (req, reply, done) => {
    reply.header('X-Request-Id', req.id)
    done()
  })

  // ── Security plugins ─────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? (process.env.NODE_ENV === 'production' ? false : true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'wss:', 'ws:'],
      },
    },
    crossOriginEmbedderPolicy: false, // needed for Socket.IO
  })
  await app.register(rateLimit, {
    global: true,
    max: Number(
      process.env.RATE_LIMIT_MAX ??
        (process.env.NODE_ENV === 'production' ? 200 : 1000),
    ),
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
    }),
  })

  // ── JWT ───────────────────────────────────────────────────────────────────
  await app.register(jwtPlugin, { secret: JWT_SECRET })
  app.decorate('authenticate', authenticate)

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
  }))

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes)
  await app.register(gamesRoutes)
  await app.register(matchmakingRoutes)
  await app.register(usersRoutes)

  // ── Socket.io ─────────────────────────────────────────────────────────────
  const io = setupSocketServer(app)

  // ── Matchmaking loop ──────────────────────────────────────────────────────
  const gameService = new GameService()
  const matchmakingService = new MatchmakingService(io.of('/game'), gameService)
  matchmakingService.start()

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`)
    await app.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  return app
}

async function start() {
  const app = await buildServer()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    app.log.info(`API server running on port ${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
