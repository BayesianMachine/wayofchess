import { type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Default mock data factories
// ---------------------------------------------------------------------------

export function makeLobbyGame(overrides?: Partial<LobbyGame>): LobbyGame {
  return {
    id: 'mock-game-id',
    whitePlayer: { id: 'p1', username: 'Din Djarin' },
    blackPlayer: { id: 'p2', username: 'Moff Gideon' },
    timeControl: { label: '5+3', category: 'Blitz' },
    startedAt: new Date(Date.now() - 120_000).toISOString(),
    spectatorCount: 5,
    moveCount: 14,
    ...overrides,
  }
}

export function makeGameMeta(overrides?: Partial<GameMeta>): GameMeta {
  return {
    id: 'mock-game-id',
    whiteUserId: 'test-user-id',
    blackUserId: 'opponent-id',
    timeControlBaseSec: 300,
    timeControlIncSec: 3,
    category: 'Blitz',
    status: 'active',
    whitePlayer: { id: 'test-user-id', username: 'TestUser' },
    blackPlayer: { id: 'opponent-id', username: 'Opponent' },
    ...overrides,
  }
}

export function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: [],
    clocks: { whiteMs: 300_000, blackMs: 300_000 },
    status: 'active',
    ...overrides,
  }
}

export function makeProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: 'test-user-id',
    username: 'TestUser',
    avatarUrl: null,
    factionPreference: 'auto',
    ratings: [
      { category: 'bullet', rating: 1200, peakRating: 1250 },
      { category: 'blitz', rating: 1350, peakRating: 1400 },
      { category: 'rapid', rating: 1100, peakRating: 1150 },
      { category: 'classical', rating: 1000, peakRating: 1000 },
    ],
    totalWins: 10,
    totalDraws: 3,
    totalLosses: 7,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeRecentGame(overrides?: Partial<RecentGame>): RecentGame {
  return {
    id: 'recent-game-id',
    whiteUserId: 'test-user-id',
    blackUserId: 'opponent-id',
    result: '1-0',
    category: 'Blitz',
    timeControlBaseSec: 300,
    timeControlIncSec: 3,
    endedAt: new Date(Date.now() - 3600_000).toISOString(),
    whiteEloDelta: 12,
    blackEloDelta: -12,
    whitePlayer: { id: 'test-user-id', username: 'TestUser' },
    blackPlayer: { id: 'opponent-id', username: 'Opponent' },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Route helper class
// ---------------------------------------------------------------------------

export class ApiMocks {
  constructor(private page: Page) {}

  async lobby(games: LobbyGame[] = [makeLobbyGame()]) {
    await this.page.route('**/api/v1/games/lobby', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(games),
      })
    })
  }

  async gameMeta(gameId: string, meta: GameMeta = makeGameMeta()) {
    await this.page.route(`**/api/v1/games/${gameId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(meta),
      })
    })
  }

  async gameState(gameId: string, state: GameState = makeGameState()) {
    await this.page.route(`**/api/v1/games/${gameId}/state`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state),
      })
    })
  }

  async profile(username: string, profile: UserProfile = makeProfile()) {
    await this.page.route(`**/api/v1/users/${username}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      })
    })
  }

  async recentGames(username: string, games: RecentGame[] = [makeRecentGame()]) {
    await this.page.route(`**/api/v1/users/${username}/games**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(games),
      })
    })
  }

  async matchmakingJoin(response: { queued: boolean } = { queued: true }) {
    await this.page.route('**/api/v1/matchmaking/join', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    })
  }

  async matchmakingLeave() {
    await this.page.route('**/api/v1/matchmaking/leave', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
  }

  async challenge(gameId = 'challenge-game-id') {
    const inviteUrl = `http://localhost:5173/play/online/${gameId}`
    await this.page.route('**/api/v1/games/challenge', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ gameId, inviteUrl }),
      })
    })
    return inviteUrl
  }

  async login(user = {
    id: 'test-user-id',
    username: 'TestUser',
    avatarUrl: null,
    factionPreference: 'auto',
  }) {
    await this.page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user,
        }),
      })
    })
  }

  async register() {
    await this.page.route('**/api/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '2', username: 'newuser', email: 'new@example.com' },
        }),
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Type declarations
// ---------------------------------------------------------------------------

interface LobbyGame {
  id: string
  whitePlayer: { id: string; username: string } | null
  blackPlayer: { id: string; username: string } | null
  timeControl: { label: string; category: string }
  startedAt: string | null
  spectatorCount?: number
  moveCount?: number
}

interface GameMeta {
  id: string
  whiteUserId: string | null
  blackUserId: string | null
  timeControlBaseSec: number
  timeControlIncSec: number
  category: string
  status: string
  whitePlayer: { id: string; username: string } | null
  blackPlayer: { id: string; username: string } | null
}

interface GameState {
  fen: string
  moves: Array<{ san: string; from: string; to: string; promotion?: string }>
  clocks: { whiteMs: number; blackMs: number }
  status: 'waiting' | 'active' | 'ended'
}

interface UserProfile {
  id: string
  username: string
  avatarUrl: string | null
  factionPreference: string
  ratings: Array<{ category: string; rating: number; peakRating: number }>
  totalWins: number
  totalDraws: number
  totalLosses: number
  createdAt: string
}

interface RecentGame {
  id: string
  whiteUserId: string | null
  blackUserId: string | null
  result: string | null
  category: string
  timeControlBaseSec: number
  timeControlIncSec: number
  endedAt: string | null
  whiteEloDelta: number | null
  blackEloDelta: number | null
  whitePlayer: { id: string; username: string } | null
  blackPlayer: { id: string; username: string } | null
}
