// Centralized Redis key helpers — keeps key patterns consistent across services

export const gameStateKey = (gameId: string) => `game:${gameId}:state`
export const spectatorKey = (gameId: string) => `game:${gameId}:spectators`
export const matchmakingQueueKey = (category: string) => `matchmaking:${category}:queue`
export const matchmakingUserTcKey = (userId: string) => `matchmaking:user:${userId}:tc`
export const sessionKey = (userId: string) => `session:${userId}`
export const jtiBlacklistKey = (jti: string) => `blacklist:${jti}`

export const TTL = {
  gameState: 60 * 60 * 4, // 4 hours
  spectatorCount: 60 * 60 * 2, // 2 hours
  matchmakingQueue: 60 * 5, // 5 minutes
  jtiBlacklist: 60 * 60, // 1 hour (= access token lifetime)
  sessionCache: 60 * 15, // 15 minutes
} as const

// SECURITY NOTE: All redis.set() / redis.hset() calls for gameState should use TTL.gameState
// See GameService.ts setActiveGame / persistMove (redis.hset + redis.expire)

// SECURITY NOTE: spectator counts should use TTL.spectatorCount on redis.set()
// See SpectatorService.ts and SpectatorGateway.ts

// SECURITY NOTE: matchmaking user TC keys should use TTL.matchmakingQueue on redis.set()
// See routes/matchmaking.ts join handler (redis.set without TTL)

// SECURITY NOTE: JTI blacklist entries should use TTL.jtiBlacklist
// See AuthService.logout and middleware/authenticate.ts

// SECURITY NOTE: session cache should use TTL.sessionCache
// See AuthService.ts login (redis.set sessionKey)

// Game state hash fields
export const GAME_STATE_FIELDS = {
  fen: 'fen',
  whiteMs: 'white_ms',
  blackMs: 'black_ms',
  lastMoveAt: 'last_move_at',
  status: 'status',
} as const

/** @deprecated Use TTL.gameState */
export const GAME_STATE_TTL = TTL.gameState
/** @deprecated Use TTL.sessionCache */
export const SESSION_TTL = TTL.sessionCache
