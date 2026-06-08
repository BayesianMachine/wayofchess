import prisma from '../db/prisma.js'

export interface EloUpdate {
  whiteEloDelta: number
  blackEloDelta: number
  newWhiteRating: number
  newBlackRating: number
}

export class EloService {
  calculateKFactor(gamesPlayed: number, category: string): number {
    if (category === 'classical') return 20
    return gamesPlayed < 30 ? 40 : 20
  }

  calculateExpected(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  }

  calculateNewRating(current: number, expected: number, actual: number, k: number): number {
    return Math.max(100, Math.round(current + k * (actual - expected)))
  }

  async updateRatings(gameId: string): Promise<EloUpdate> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: { include: { ratings: true } },
        blackPlayer: { include: { ratings: true } },
      },
    })

    if (
      !game ||
      !game.whiteUserId ||
      !game.blackUserId ||
      !game.result ||
      game.mode !== 'online'
    ) {
      throw new Error('Cannot update ELO: invalid game')
    }

    const whiteRating = game.whitePlayer?.ratings.find((r) => r.category === game.category)
    const blackRating = game.blackPlayer?.ratings.find((r) => r.category === game.category)

    if (!whiteRating || !blackRating) {
      throw new Error('Cannot update ELO: invalid game')
    }

    let whiteActual: number
    let blackActual: number
    switch (game.result) {
      case '1-0':
        whiteActual = 1
        blackActual = 0
        break
      case '0-1':
        whiteActual = 0
        blackActual = 1
        break
      case '1/2-1/2':
        whiteActual = 0.5
        blackActual = 0.5
        break
      default:
        throw new Error('Cannot update ELO: invalid game')
    }

    const currentWhiteRating = whiteRating.rating
    const currentBlackRating = blackRating.rating

    const whiteK = this.calculateKFactor(whiteRating.gamesPlayed, game.category)
    const blackK = this.calculateKFactor(blackRating.gamesPlayed, game.category)

    const whiteExpected = this.calculateExpected(currentWhiteRating, currentBlackRating)
    const blackExpected = this.calculateExpected(currentBlackRating, currentWhiteRating)

    const newWhiteRating = this.calculateNewRating(
      currentWhiteRating,
      whiteExpected,
      whiteActual,
      whiteK,
    )
    const newBlackRating = this.calculateNewRating(
      currentBlackRating,
      blackExpected,
      blackActual,
      blackK,
    )

    const whiteEloDelta = newWhiteRating - currentWhiteRating
    const blackEloDelta = newBlackRating - currentBlackRating

    await prisma.$transaction([
      prisma.userRating.update({
        where: {
          userId_category: { userId: game.whiteUserId, category: game.category },
        },
        data: {
          rating: newWhiteRating,
          peakRating: { set: Math.max(whiteRating.peakRating, newWhiteRating) },
          gamesPlayed: { increment: 1 },
          wins: whiteActual === 1 ? { increment: 1 } : undefined,
          draws: whiteActual === 0.5 ? { increment: 1 } : undefined,
          losses: whiteActual === 0 ? { increment: 1 } : undefined,
        },
      }),
      prisma.userRating.update({
        where: {
          userId_category: { userId: game.blackUserId, category: game.category },
        },
        data: {
          rating: newBlackRating,
          peakRating: { set: Math.max(blackRating.peakRating, newBlackRating) },
          gamesPlayed: { increment: 1 },
          wins: blackActual === 1 ? { increment: 1 } : undefined,
          draws: blackActual === 0.5 ? { increment: 1 } : undefined,
          losses: blackActual === 0 ? { increment: 1 } : undefined,
        },
      }),
      prisma.game.update({
        where: { id: gameId },
        data: {
          whiteEloAfter: newWhiteRating,
          blackEloAfter: newBlackRating,
          whiteEloDelta,
          blackEloDelta,
        },
      }),
    ])

    return { whiteEloDelta, blackEloDelta, newWhiteRating, newBlackRating }
  }
}
