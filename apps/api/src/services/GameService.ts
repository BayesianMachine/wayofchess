import { Game } from '@mandalorian-chess/chess-engine'
import type {
  MoveResult,
  GameResult,
  EndReason,
  Color,
  Square,
  PromotionPiece,
} from '@mandalorian-chess/chess-engine'
import type { Game as PrismaGame } from '@prisma/client'
import prisma from '../db/prisma.js'
import { redis } from '../redis/client.js'
import {
  gameStateKey,
  GAME_STATE_TTL,
  GAME_STATE_FIELDS,
} from '../redis/keys.js'

interface GameStateCache {
  fen: string
  whiteMs: number
  blackMs: number
  lastMoveAt: number
}

interface CreateGameParams {
  whiteUserId: string | null
  blackUserId: string | null
  mode: 'online' | 'local' | 'ai'
  timeControlBaseSec: number
  timeControlIncSec: number
  category: string
}

export type SubmitMoveResult =
  | {
      valid: true
      move: MoveResult
      fen: string
      clocks: { whiteMs: number; blackMs: number }
      isGameOver: boolean
      result: GameResult | null
      endReason: EndReason | null
    }
  | { valid: false; reason: string }

function parseRedisGameState(raw: Record<string, string>): GameStateCache | null {
  const fen = raw[GAME_STATE_FIELDS.fen]
  const whiteMs = raw[GAME_STATE_FIELDS.whiteMs]
  const blackMs = raw[GAME_STATE_FIELDS.blackMs]
  const lastMoveAt = raw[GAME_STATE_FIELDS.lastMoveAt]
  if (!fen || whiteMs === undefined || blackMs === undefined || lastMoveAt === undefined) {
    return null
  }
  return {
    fen,
    whiteMs: Number(whiteMs),
    blackMs: Number(blackMs),
    lastMoveAt: Number(lastMoveAt),
  }
}

export class GameService {
  private readonly activeGames = new Map<string, Game>()

  private async writeRedisGameState(
    gameId: string,
    fields: Record<string, string>,
  ): Promise<void> {
    const key = gameStateKey(gameId)
    await redis.hset(key, fields)
    await redis.expire(key, GAME_STATE_TTL)
  }

  async createGame(params: CreateGameParams): Promise<{ id: string }> {
    const game = await prisma.game.create({
      data: {
        ...params,
        status: 'waiting',
      },
    })

    const engine = new Game()
    this.activeGames.set(game.id, engine)

    const baseMs = params.timeControlBaseSec * 1000
    const now = Date.now()
    await this.writeRedisGameState(game.id, {
      [GAME_STATE_FIELDS.fen]: engine.toFEN(),
      [GAME_STATE_FIELDS.whiteMs]: baseMs.toString(),
      [GAME_STATE_FIELDS.blackMs]: baseMs.toString(),
      [GAME_STATE_FIELDS.lastMoveAt]: now.toString(),
      [GAME_STATE_FIELDS.status]: 'waiting',
    })

    return { id: game.id }
  }

  async startGame(gameId: string): Promise<void> {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'active', startedAt: new Date() },
    })

    const now = Date.now().toString()
    const key = gameStateKey(gameId)
    await redis.hset(key, GAME_STATE_FIELDS.status, 'active', GAME_STATE_FIELDS.lastMoveAt, now)
    await redis.expire(key, GAME_STATE_TTL)
  }

  async submitMove(
    gameId: string,
    userId: string,
    from: Square,
    to: Square,
    promotion?: PromotionPiece,
  ): Promise<SubmitMoveResult> {
    const dbGame = await prisma.game.findUnique({ where: { id: gameId } })
    if (!dbGame) {
      return { valid: false, reason: 'game not found' }
    }

    if (userId !== dbGame.whiteUserId && userId !== dbGame.blackUserId) {
      return { valid: false, reason: 'not a player' }
    }

    const playerColor: Color = userId === dbGame.whiteUserId ? 'w' : 'b'

    let engine = this.activeGames.get(gameId)
    if (!engine) {
      const raw = await redis.hgetall(gameStateKey(gameId))
      const fen = raw[GAME_STATE_FIELDS.fen] ?? dbGame.finalFen
      if (!fen) {
        return { valid: false, reason: 'game state unavailable' }
      }
      engine = new Game(fen)
      this.activeGames.set(gameId, engine)
    }

    if (engine.getState().turn !== playerColor) {
      return { valid: false, reason: 'not your turn' }
    }

    const state = await redis.hgetall(gameStateKey(gameId))
    const now = Date.now()
    const elapsed = now - Number(state[GAME_STATE_FIELDS.lastMoveAt] ?? now)
    const movingClockMs = Number(
      playerColor === 'w' ? state[GAME_STATE_FIELDS.whiteMs] : state[GAME_STATE_FIELDS.blackMs],
    )
    const incMs = dbGame.timeControlIncSec * 1000

    if (movingClockMs - elapsed <= 0) {
      const timeoutResult: GameResult = playerColor === 'w' ? '0-1' : '1-0'
      void this.endGame(gameId, timeoutResult, 'timeout').catch(console.error)
      return { valid: false, reason: 'timeout' }
    }

    const moveResult = engine.move(from, to, promotion)
    if (moveResult === null) {
      return { valid: false, reason: 'illegal move' }
    }

    const newClockMs = Math.max(0, movingClockMs - elapsed) + incMs
    const newWhiteMs =
      playerColor === 'w' ? newClockMs : Number(state[GAME_STATE_FIELDS.whiteMs] ?? 0)
    const newBlackMs =
      playerColor === 'b' ? newClockMs : Number(state[GAME_STATE_FIELDS.blackMs] ?? 0)

    await this.writeRedisGameState(gameId, {
      [GAME_STATE_FIELDS.fen]: engine.toFEN(),
      [GAME_STATE_FIELDS.whiteMs]: newWhiteMs.toString(),
      [GAME_STATE_FIELDS.blackMs]: newBlackMs.toString(),
      [GAME_STATE_FIELDS.lastMoveAt]: now.toString(),
    })

    const moveCount = await prisma.move.count({ where: { gameId } })
    prisma.move
      .create({
        data: {
          gameId,
          moveNumber: Math.ceil((moveCount + 1) / 2),
          color: playerColor,
          san: moveResult.san,
          fromSq: from,
          toSq: to,
          promotion: promotion ?? null,
          fenAfter: engine.toFEN(),
          whiteClockMs: newWhiteMs,
          blackClockMs: newBlackMs,
        },
      })
      .catch(console.error)

    const endResult = engine.getGameEndResult()
    const isGameOver = endResult !== null
    const result = endResult?.result ?? null
    const endReason = endResult?.reason ?? null

    if (isGameOver && result && endReason) {
      void this.endGame(gameId, result, endReason).catch(console.error)
    }

    return {
      valid: true,
      move: moveResult,
      fen: engine.toFEN(),
      clocks: { whiteMs: newWhiteMs, blackMs: newBlackMs },
      isGameOver,
      result,
      endReason,
    }
  }

  async endGame(gameId: string, result: GameResult, reason: EndReason): Promise<void> {
    let engine = this.activeGames.get(gameId)
    if (!engine) {
      const raw = await redis.hgetall(gameStateKey(gameId))
      const fen = raw[GAME_STATE_FIELDS.fen]
      if (fen) {
        engine = new Game(fen)
      }
    }

    const finalFen = engine?.toFEN() ?? (await prisma.game.findUnique({ where: { id: gameId } }))?.finalFen ?? ''
    const pgn = engine?.toPGN() ?? ''

    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'ended',
        result,
        endReason: reason,
        finalFen,
        pgn,
        endedAt: new Date(),
      },
    })

    this.activeGames.delete(gameId)
    await redis.del(gameStateKey(gameId))
  }

  async getGameState(gameId: string): Promise<GameStateCache | null> {
    const raw = await redis.hgetall(gameStateKey(gameId))
    const cached = parseRedisGameState(raw)
    if (cached) return cached

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { finalFen: true, timeControlBaseSec: true },
    })
    if (!game?.finalFen) return null

    const baseMs = game.timeControlBaseSec * 1000
    return {
      fen: game.finalFen,
      whiteMs: baseMs,
      blackMs: baseMs,
      lastMoveAt: Date.now(),
    }
  }

  async getGameForLobby(
    category?: string,
  ): Promise<
    (PrismaGame & {
      whitePlayer: { id: string; username: string } | null
      blackPlayer: { id: string; username: string } | null
    })[]
  > {
    return prisma.game.findMany({
      where: {
        status: 'active',
        mode: 'online',
        ...(category ? { category } : {}),
      },
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })
  }
}
