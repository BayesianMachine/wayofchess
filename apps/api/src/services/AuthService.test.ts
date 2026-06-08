import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/prisma.js', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('../redis/client.js', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    setex: vi.fn(),
  },
}))

import { AuthService } from './AuthService.js'
import prisma from '../db/prisma.js'
import { redis } from '../redis/client.js'
import bcrypt from 'bcrypt'

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hash',
  avatarUrl: null,
  factionPreference: 'auto',
  countryCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSeenAt: new Date(),
}

function mockFastify() {
  return {
    jwt: {
      sign: vi.fn().mockReturnValue('mock-access-token'),
    },
  } as unknown as Parameters<typeof AuthService.login>[2]
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('hashes password before storing', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      let createArgs: { data: { passwordHash: string } } | undefined
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        const tx = {
          user: {
            create: vi.fn((args: { data: { passwordHash: string } }) => {
              createArgs = args
              return Promise.resolve(mockUser)
            }),
          },
          userRating: {
            createMany: vi.fn().mockResolvedValue({ count: 4 }),
          },
        }
        return fn(tx as never)
      })

      const result = await AuthService.register(
        'testuser',
        'test@example.com',
        'plaintext',
      )

      expect(createArgs!.data.passwordHash).not.toBe('plaintext')
      expect(createArgs!.data.passwordHash.startsWith('$2')).toBe(true)
      expect(result.username).toBe('testuser')
      expect(result).not.toHaveProperty('passwordHash')
      expect(result).not.toHaveProperty('email')
    })

    it('throws if username already exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockUser,
        username: 'taken',
        email: 'other@example.com',
      } as never)

      await expect(
        AuthService.register('taken', 'new@example.com', 'pass'),
      ).rejects.toThrow('USERNAME_TAKEN')
    })

    it('throws if email already exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockUser,
        username: 'other',
        email: 'taken@example.com',
      } as never)

      await expect(
        AuthService.register('newuser', 'taken@example.com', 'pass'),
      ).rejects.toThrow('EMAIL_TAKEN')
    })
  })

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('correct-pass', 1)
      const user = { ...mockUser, passwordHash: hash }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never)
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: 'rt-1',
        userId: '1',
        tokenHash: 'hash',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      } as never)

      const result = await AuthService.login(
        'test@example.com',
        'correct-pass',
        mockFastify(),
      )

      expect(result).toHaveProperty('accessToken', 'mock-access-token')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.username).toBe('testuser')
      expect(redis.set).toHaveBeenCalled()
    })

    it('throws on wrong password', async () => {
      const hash = await bcrypt.hash('correct-pass', 1)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      } as never)

      await expect(
        AuthService.login('test@example.com', 'wrong-pass', mockFastify()),
      ).rejects.toThrow('INVALID_CREDENTIALS')
    })

    it('throws on unknown email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(
        AuthService.login('nobody@example.com', 'pass', mockFastify()),
      ).rejects.toThrow('INVALID_CREDENTIALS')
    })
  })
})
