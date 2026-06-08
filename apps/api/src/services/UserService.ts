import prisma from '../db/prisma.js'

export interface PublicProfile {
  id: string
  username: string
  avatarUrl: string | null
  factionPreference: string
  countryCode: string | null
  createdAt: Date
  ratings: Array<{
    category: string
    rating: number
    peakRating: number
    gamesPlayed: number
    wins: number
    draws: number
    losses: number
  }>
  totalWins: number
  totalDraws: number
  totalLosses: number
}

export class UserService {
  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        factionPreference: true,
        countryCode: true,
        createdAt: true,
        ratings: true,
      },
    })
    if (!user) return null
    return {
      ...user,
      totalWins: user.ratings.reduce((s, r) => s + r.wins, 0),
      totalDraws: user.ratings.reduce((s, r) => s + r.draws, 0),
      totalLosses: user.ratings.reduce((s, r) => s + r.losses, 0),
    }
  }

  async getRecentGames(userId: string, limit = 20, offset = 0) {
    return prisma.game.findMany({
      where: {
        OR: [{ whiteUserId: userId }, { blackUserId: userId }],
        status: 'ended',
      },
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } },
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  async updateProfile(
    userId: string,
    data: { avatarUrl?: string; factionPreference?: string; countryCode?: string },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        factionPreference: true,
        countryCode: true,
      },
    })
  }

  async updateLastSeen(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    })
  }
}
