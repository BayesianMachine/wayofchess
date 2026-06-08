import '@fastify/jwt'
import bcrypt from 'bcrypt'
import { randomUUID, createHash } from 'crypto'
import type { FastifyInstance } from 'fastify'
import type { User, UserRating } from '@prisma/client'
import prisma from '../db/prisma.js'
import { redis } from '../redis/client.js'
import { sessionKey, jtiBlacklistKey, TTL } from '../redis/keys.js'

const BCRYPT_ROUNDS = 12
// Access token lifetime: defaults to 15m; set JWT_ACCESS_EXPIRES_IN or JWT_EXPIRY_SECONDS (seconds, must stay < 1h for security)
const ACCESS_TOKEN_EXPIRY = parseInt(
  process.env.JWT_ACCESS_EXPIRES_IN ?? process.env.JWT_EXPIRY_SECONDS ?? '900',
  10,
)
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(
  process.env.JWT_REFRESH_EXPIRES_IN
    ? String(Math.ceil(Number(process.env.JWT_REFRESH_EXPIRES_IN) / 86400))
    : (process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? '7'),
  10,
)
const JWT_ISSUER = process.env.JWT_ISSUER ?? 'mandalorian-chess'
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'mandalorian-chess-client'
const TIME_CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'] as const

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

function signAccessToken(
  fastify: FastifyInstance,
  user: Pick<User, 'id' | 'username'>,
): string {
  const jti = randomUUID()
  return fastify.jwt.sign(
    { sub: user.id, username: user.username, jti },
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
    },
  )
}

export type SafeUser = Omit<User, 'passwordHash' | 'email'>

export type UserWithRatings = Omit<User, 'passwordHash' | 'email'> & {
  ratings: UserRating[]
}

function omitSensitiveUser<T extends User>(user: T): Omit<T, 'passwordHash' | 'email'> {
  const { passwordHash: _ph, email: _em, ...safe } = user
  return safe
}

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string,
  ): Promise<SafeUser> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })
    if (existing) {
      if (existing.username === username) throw new Error('USERNAME_TAKEN')
      throw new Error('EMAIL_TAKEN')
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { username, email, passwordHash, factionPreference: 'auto' },
      })
      await tx.userRating.createMany({
        data: TIME_CATEGORIES.map((cat) => ({ userId: created.id, category: cat })),
      })
      return created
    })

    return omitSensitiveUser(user)
  }

  static async login(
    email: string,
    password: string,
    fastify: FastifyInstance,
  ): Promise<{
    accessToken: string
    refreshToken: string
    user: Pick<User, 'id' | 'username' | 'avatarUrl' | 'factionPreference'>
  }> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('INVALID_CREDENTIALS')

    const accessToken = signAccessToken(fastify, user)

    const rawToken = randomUUID()
    const tokenHash = hashRefreshToken(rawToken)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
      },
    })

    await redis.set(sessionKey(user.id), tokenHash, 'EX', TTL.sessionCache)

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        factionPreference: user.factionPreference,
      },
    }
  }

  static async refresh(
    rawRefreshToken: string,
    fastify: FastifyInstance,
  ): Promise<{ accessToken: string }> {
    const tokenHash = hashRefreshToken(rawRefreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt < new Date()
    ) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user) throw new Error('INVALID_REFRESH_TOKEN')

    // TODO(security): rotate refresh tokens — revoke this token and issue a new refresh token
    const accessToken = signAccessToken(fastify, user)

    return { accessToken }
  }

  static async logout(
    userId: string,
    rawRefreshToken: string,
    accessTokenJti?: string,
  ): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken)
    await prisma.refreshToken.updateMany({
      where: { userId, tokenHash },
      data: { revokedAt: new Date() },
    })
    await redis.del(sessionKey(userId))

    if (accessTokenJti) {
      await redis.set(jtiBlacklistKey(accessTokenJti), '1', 'EX', TTL.jtiBlacklist)
    }
  }

  static async getUserById(userId: string): Promise<UserWithRatings | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ratings: true },
    })
    if (!user) return null
    return omitSensitiveUser(user) as UserWithRatings
  }
}
