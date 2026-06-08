import { redis } from '../redis/client.js'
import { matchmakingQueueKey, matchmakingUserTcKey } from '../redis/keys.js'
import { GameService } from './GameService.js'
import type { Namespace } from 'socket.io'

const CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'] as const
const INITIAL_ELO_WINDOW = 200
const EXPANDED_ELO_WINDOW = 400
const EXPAND_AFTER_MS = 60_000

const TIME_CONTROL_BASE_SEC: Record<(typeof CATEGORIES)[number], number> = {
  bullet: 60,
  blitz: 300,
  rapid: 600,
  classical: 1800,
}

const SCORE_SCALE = 1e6

interface QueueEntry {
  userId: string
  rating: number
  enqueuedAt: number
}

function decodeScore(score: number): { rating: number; enqueuedAt: number } {
  const enqueuedAt = score % SCORE_SCALE
  const rating = Math.floor(score / SCORE_SCALE)
  return { rating, enqueuedAt }
}

function eloWindow(enqueuedAt: number): number {
  return Date.now() - enqueuedAt < EXPAND_AFTER_MS ? INITIAL_ELO_WINDOW : EXPANDED_ELO_WINDOW
}

function parseQueueEntries(raw: string[]): QueueEntry[] {
  const entries: QueueEntry[] = []
  for (let i = 0; i < raw.length; i += 2) {
    const userId = raw[i]
    const score = Number(raw[i + 1])
    if (!userId || Number.isNaN(score)) continue
    const { rating, enqueuedAt } = decodeScore(score)
    entries.push({ userId, rating, enqueuedAt })
  }
  return entries
}

export class MatchmakingService {
  constructor(
    private gameNs: Namespace,
    private gameService: GameService,
  ) {}

  start() {
    setInterval(() => {
      void this.runMatchLoop()
    }, 2000)
  }

  async runMatchLoop(): Promise<void> {
    for (const category of CATEGORIES) {
      const raw = await redis.zrangebyscore(
        matchmakingQueueKey(category),
        '-inf',
        '+inf',
        'WITHSCORES',
      )
      const entries = parseQueueEntries(raw)
      const matched = new Set<string>()

      for (let i = 0; i < entries.length; i++) {
        const a = entries[i]
        if (matched.has(a.userId)) continue

        const windowA = eloWindow(a.enqueuedAt)
        let partner: QueueEntry | null = null

        for (let j = i + 1; j < entries.length; j++) {
          const b = entries[j]
          if (matched.has(b.userId)) continue

          const windowB = eloWindow(b.enqueuedAt)
          const window = Math.max(windowA, windowB)
          if (Math.abs(a.rating - b.rating) <= window) {
            partner = b
            break
          }
        }

        if (!partner) continue

        matched.add(a.userId)
        matched.add(partner.userId)

        await redis.zrem(matchmakingQueueKey(category), a.userId, partner.userId)
        await redis.del(matchmakingUserTcKey(a.userId), matchmakingUserTcKey(partner.userId))

        const swap = Math.random() < 0.5
        const white = swap ? partner : a
        const black = swap ? a : partner

        const timeControlBaseSec = TIME_CONTROL_BASE_SEC[category]

        const { id: gameId } = await this.gameService.createGame({
          whiteUserId: white.userId,
          blackUserId: black.userId,
          mode: 'online',
          timeControlBaseSec,
          timeControlIncSec: 0,
          category,
        })

        await this.gameService.startGame(gameId)

        const payload = {
          gameId,
          white: { id: white.userId },
          black: { id: black.userId },
          timeControl: { baseSec: timeControlBaseSec, label: category },
        }

        this.gameNs.to(`user-${white.userId}`).emit('game:start', payload)
        this.gameNs.to(`user-${black.userId}`).emit('game:start', payload)
      }
    }
  }
}
