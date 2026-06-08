import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    game: {
      findMany: vi.fn(),
    },
  },
}))

import { UserService } from './UserService.js'
import prisma from '../db/prisma.js'

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserService()
  })

  describe('getPublicProfile', () => {
    it('returns null for unknown user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const profile = await userService.getPublicProfile('nobody')

      expect(profile).toBeNull()
    })

    it('returns user data without password hash', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        username: 'alice',
        avatarUrl: null,
        factionPreference: 'mandalorian',
        countryCode: 'US',
        createdAt: new Date('2024-01-01'),
        ratings: [
          {
            category: 'blitz',
            rating: 1200,
            peakRating: 1250,
            gamesPlayed: 10,
            wins: 5,
            draws: 2,
            losses: 3,
          },
        ],
      } as never)

      const profile = await userService.getPublicProfile('alice')

      expect(profile).not.toBeNull()
      expect(profile?.username).toBe('alice')
      expect(profile?.totalWins).toBe(5)
      expect(profile?.totalDraws).toBe(2)
      expect(profile?.totalLosses).toBe(3)
      expect(profile).not.toHaveProperty('passwordHash')
      expect(profile).not.toHaveProperty('email')
    })
  })

  describe('updateProfile', () => {
    it('calls prisma update with correct data', async () => {
      const updated = {
        id: 'user-1',
        username: 'alice',
        avatarUrl: 'https://example.com/a.png',
        factionPreference: 'imperial',
        countryCode: 'CA',
      }
      vi.mocked(prisma.user.update).mockResolvedValue(updated as never)

      const result = await userService.updateProfile('user-1', {
        avatarUrl: 'https://example.com/a.png',
        factionPreference: 'imperial',
        countryCode: 'CA',
      })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          avatarUrl: 'https://example.com/a.png',
          factionPreference: 'imperial',
          countryCode: 'CA',
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          factionPreference: true,
          countryCode: true,
        },
      })
      expect(result).toEqual(updated)
    })
  })

  describe('getRecentGames', () => {
    it('returns empty array for a user with no games', async () => {
      vi.mocked(prisma.game.findMany).mockResolvedValue([])

      const games = await userService.getRecentGames('user-1')

      expect(games).toEqual([])
      expect(prisma.game.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ whiteUserId: 'user-1' }, { blackUserId: 'user-1' }],
            status: 'ended',
          },
        }),
      )
    })
  })
})
