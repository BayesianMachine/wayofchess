import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GAME_STATE_FIELDS } from '../redis/keys.js'

vi.mock('../db/prisma.js', () => ({
  default: {
    game: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    move: { create: vi.fn(), count: vi.fn() },
  },
}))

vi.mock('../redis/client.js', () => ({
  redis: {
    hset: vi.fn(),
    hgetall: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
  },
}))

import { GameService } from './GameService.js'
import prisma from '../db/prisma.js'
import { redis } from '../redis/client.js'

const GAME_ID = 'game-1'
const WHITE_ID = 'white-user'
const BLACK_ID = 'black-user'
const BASE_MS = 300_000

function defaultDbGame(overrides: Record<string, unknown> = {}) {
  return {
    id: GAME_ID,
    whiteUserId: WHITE_ID,
    blackUserId: BLACK_ID,
    status: 'active',
    mode: 'online',
    timeControlBaseSec: 300,
    timeControlIncSec: 0,
    finalFen: null,
    category: 'blitz',
    ...overrides,
  }
}

function defaultRedisState(fen?: string) {
  const engineFen =
    fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  return {
    [GAME_STATE_FIELDS.fen]: engineFen,
    [GAME_STATE_FIELDS.whiteMs]: String(BASE_MS),
    [GAME_STATE_FIELDS.blackMs]: String(BASE_MS),
    [GAME_STATE_FIELDS.lastMoveAt]: String(Date.now()),
    [GAME_STATE_FIELDS.status]: 'active',
  }
}

describe('GameService', () => {
  let gameService: GameService

  beforeEach(() => {
    vi.clearAllMocks()
    gameService = new GameService()
    vi.mocked(prisma.move.count).mockResolvedValue(0)
    vi.mocked(prisma.move.create).mockResolvedValue({} as never)
  })

  describe('createGame', () => {
    it('stores the game in memory so moves work without reloading from Redis', async () => {
      vi.mocked(prisma.game.create).mockResolvedValue({ id: GAME_ID } as never)
      vi.mocked(redis.hset).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)

      const { id } = await gameService.createGame({
        whiteUserId: WHITE_ID,
        blackUserId: BLACK_ID,
        mode: 'online',
        timeControlBaseSec: 300,
        timeControlIncSec: 0,
        category: 'blitz',
      })

      expect(id).toBe(GAME_ID)
      vi.mocked(prisma.game.findUnique).mockResolvedValue(defaultDbGame() as never)
      vi.mocked(redis.hgetall).mockResolvedValue(defaultRedisState())

      const result = await gameService.submitMove(GAME_ID, WHITE_ID, 'e2', 'e4')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.move.san).toBe('e4')
      }
    })
  })

  describe('submitMove', () => {
    beforeEach(() => {
      vi.mocked(prisma.game.findUnique).mockResolvedValue(defaultDbGame() as never)
      vi.mocked(redis.hgetall).mockResolvedValue(defaultRedisState())
      vi.mocked(redis.hset).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)
    })

    it('accepts a legal move and updates game state', async () => {
      await gameService.createGame({
        whiteUserId: WHITE_ID,
        blackUserId: BLACK_ID,
        mode: 'online',
        timeControlBaseSec: 300,
        timeControlIncSec: 0,
        category: 'blitz',
      })
      vi.mocked(prisma.game.create).mockResolvedValue({ id: GAME_ID } as never)

      const result = await gameService.submitMove(GAME_ID, WHITE_ID, 'e2', 'e4')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.move.san).toBe('e4')
        expect(result.fen).toContain(' b ')
        expect(redis.hset).toHaveBeenCalled()
      }
    })

    it('returns an error for an illegal move', async () => {
      await gameService.createGame({
        whiteUserId: WHITE_ID,
        blackUserId: BLACK_ID,
        mode: 'online',
        timeControlBaseSec: 300,
        timeControlIncSec: 0,
        category: 'blitz',
      })
      vi.mocked(prisma.game.create).mockResolvedValue({ id: GAME_ID } as never)

      const result = await gameService.submitMove(GAME_ID, WHITE_ID, 'e2', 'e5')

      expect(result).toEqual({ valid: false, reason: 'illegal move' })
    })

    it('returns an error when it is the wrong player turn', async () => {
      await gameService.createGame({
        whiteUserId: WHITE_ID,
        blackUserId: BLACK_ID,
        mode: 'online',
        timeControlBaseSec: 300,
        timeControlIncSec: 0,
        category: 'blitz',
      })
      vi.mocked(prisma.game.create).mockResolvedValue({ id: GAME_ID } as never)

      const result = await gameService.submitMove(GAME_ID, BLACK_ID, 'e7', 'e5')

      expect(result).toEqual({ valid: false, reason: 'not your turn' })
    })
  })

  describe('getGameState', () => {
    it('returns null for an unknown game ID', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({})
      vi.mocked(prisma.game.findUnique).mockResolvedValue(null)

      const state = await gameService.getGameState('unknown-id')

      expect(state).toBeNull()
    })
  })

  describe('checkmate', () => {
    it('ends the game after checkmate', async () => {
      vi.mocked(prisma.game.create).mockResolvedValue({ id: GAME_ID } as never)
      vi.mocked(prisma.game.findUnique).mockResolvedValue(defaultDbGame() as never)
      vi.mocked(prisma.game.update).mockResolvedValue({} as never)
      vi.mocked(redis.hset).mockResolvedValue(1)
      vi.mocked(redis.expire).mockResolvedValue(1)
      vi.mocked(redis.del).mockResolvedValue(1)

      await gameService.createGame({
        whiteUserId: WHITE_ID,
        blackUserId: BLACK_ID,
        mode: 'online',
        timeControlBaseSec: 300,
        timeControlIncSec: 0,
        category: 'blitz',
      })

      const moves: Array<{ userId: string; from: 'e2' | 'e7' | 'd1' | 'b8' | 'f1' | 'g8' | 'h5'; to: 'e4' | 'e5' | 'h5' | 'c6' | 'c4' | 'f6' | 'f7' }> = [
        { userId: WHITE_ID, from: 'e2', to: 'e4' },
        { userId: BLACK_ID, from: 'e7', to: 'e5' },
        { userId: WHITE_ID, from: 'd1', to: 'h5' },
        { userId: BLACK_ID, from: 'b8', to: 'c6' },
        { userId: WHITE_ID, from: 'f1', to: 'c4' },
        { userId: BLACK_ID, from: 'g8', to: 'f6' },
        { userId: WHITE_ID, from: 'h5', to: 'f7' },
      ]

      let lastResult: Awaited<ReturnType<GameService['submitMove']>> | null = null
      for (const { userId, from, to } of moves) {
        vi.mocked(redis.hgetall).mockResolvedValue(defaultRedisState())
        lastResult = await gameService.submitMove(GAME_ID, userId, from, to)
        if (!lastResult.valid) break
        if (lastResult.valid && lastResult.isGameOver) break
      }

      expect(lastResult?.valid).toBe(true)
      if (lastResult?.valid) {
        expect(lastResult.isGameOver).toBe(true)
        expect(lastResult.result).toBe('1-0')
        expect(lastResult.endReason).toBe('checkmate')
      }

      await vi.waitFor(() => {
        expect(prisma.game.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: GAME_ID },
            data: expect.objectContaining({ status: 'ended', result: '1-0' }),
          }),
        )
      })
    })
  })
})
