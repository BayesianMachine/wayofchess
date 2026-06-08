import { z } from 'zod'

// Auth
export const RegisterBodySchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const RefreshBodySchema = z.object({
  refreshToken: z.string(),
})

export const AccessTokenResponseSchema = z.object({
  accessToken: z.string(),
})

// Users
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().url().nullable(),
  factionPreference: z.enum(['mandalorian', 'imperial', 'auto']),
  countryCode: z.string().length(2).nullable(),
  createdAt: z.string().datetime(),
  ratings: z.array(
    z.object({
      category: z.enum(['bullet', 'blitz', 'rapid', 'classical']),
      rating: z.number(),
      peakRating: z.number(),
      gamesPlayed: z.number(),
      wins: z.number(),
      draws: z.number(),
      losses: z.number(),
    }),
  ),
})

export const UpdateProfileBodySchema = z.object({
  avatarUrl: z.string().url().optional(),
  factionPreference: z.enum(['mandalorian', 'imperial', 'auto']).optional(),
  countryCode: z.string().length(2).optional(),
})

// Games
export const TimeControlSchema = z.object({
  baseSec: z.number().int().positive(),
  incrementSec: z.number().int().min(0),
  category: z.enum(['bullet', 'blitz', 'rapid', 'classical']),
  label: z.string(),
})

export const GameSummarySchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(['online', 'local', 'ai']),
  status: z.enum(['waiting', 'active', 'ended']),
  result: z.enum(['1-0', '0-1', '1/2-1/2']).nullable(),
  endReason: z.string().nullable(),
  timeControl: TimeControlSchema,
  whitePlayer: z
    .object({ id: z.string(), username: z.string(), rating: z.number() })
    .nullable(),
  blackPlayer: z
    .object({ id: z.string(), username: z.string(), rating: z.number() })
    .nullable(),
  startedAt: z.string().datetime().nullable(),
  endedAt: z.string().datetime().nullable(),
})

export const GameStateSchema = z.object({
  fen: z.string(),
  moves: z.array(
    z.object({
      san: z.string(),
      from: z.string(),
      to: z.string(),
      promotion: z.string().optional(),
    }),
  ),
  clocks: z.object({
    whiteMs: z.number(),
    blackMs: z.number(),
  }),
  status: z.enum(['waiting', 'active', 'ended']),
})

export const ChallengeResponseSchema = z.object({
  gameId: z.string().uuid(),
  inviteUrl: z.string().url(),
})

// AI Games
export const StartAiGameBodySchema = z.object({
  difficulty: z.enum(['foundling', 'warrior', 'champion', 'mand-alor']),
  playerColor: z.enum(['w', 'b', 'random']),
  timeControlBaseSec: z.number().int().positive().optional(),
  timeControlIncSec: z.number().int().min(0).optional(),
})

export const SubmitAiMoveBodySchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
})

export const AiMoveResponseSchema = z.object({
  playerMove: z.object({ san: z.string(), from: z.string(), to: z.string() }),
  aiMove: z
    .object({ san: z.string(), from: z.string(), to: z.string() })
    .nullable(),
  fen: z.string(),
  isGameOver: z.boolean(),
  result: z.enum(['1-0', '0-1', '1/2-1/2']).nullable(),
  endReason: z.string().nullable(),
})

// Inferred TypeScript types
export type RegisterBody = z.infer<typeof RegisterBodySchema>
export type LoginBody = z.infer<typeof LoginBodySchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>
export type TimeControl = z.infer<typeof TimeControlSchema>
export type GameSummary = z.infer<typeof GameSummarySchema>
export type GameState = z.infer<typeof GameStateSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type StartAiGameBody = z.infer<typeof StartAiGameBodySchema>
export type SubmitAiMoveBody = z.infer<typeof SubmitAiMoveBodySchema>
export type AiMoveResponse = z.infer<typeof AiMoveResponseSchema>
