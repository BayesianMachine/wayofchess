import { z } from 'zod'

// Client → Server events
export const JoinGamePayloadSchema = z.object({ gameId: z.string().uuid() })
export const SpectateJoinPayloadSchema = z.object({ gameId: z.string().uuid() })
export const SubmitMovePayloadSchema = z.object({
  gameId: z.string().uuid(),
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
})
export const DrawOfferPayloadSchema = z.object({ gameId: z.string().uuid() })
export const DrawRespondPayloadSchema = z.object({
  gameId: z.string().uuid(),
  accept: z.boolean(),
})
export const ResignPayloadSchema = z.object({ gameId: z.string().uuid() })

// Server → Client events
export const GameStartEventSchema = z.object({
  gameId: z.string().uuid(),
  white: z.object({ id: z.string(), username: z.string(), rating: z.number() }),
  black: z.object({ id: z.string(), username: z.string(), rating: z.number() }),
  timeControl: z.object({
    baseSec: z.number(),
    incrementSec: z.number(),
    label: z.string(),
  }),
  fen: z.string(),
})

export const MoveAppliedEventSchema = z.object({
  gameId: z.string().uuid(),
  move: z.object({
    san: z.string(),
    from: z.string(),
    to: z.string(),
    promotion: z.string().optional(),
  }),
  fen: z.string(),
  clocks: z.object({ whiteMs: z.number(), blackMs: z.number() }),
  spectatorCount: z.number(),
})

export const MoveRejectedEventSchema = z.object({
  gameId: z.string().uuid(),
  reason: z.string(),
})

export const GameEndEventSchema = z.object({
  gameId: z.string().uuid(),
  result: z.enum(['1-0', '0-1', '1/2-1/2']),
  reason: z.enum([
    'checkmate',
    'stalemate',
    'insufficient_material',
    'threefold_repetition',
    'fifty_move_rule',
    'resignation',
    'timeout',
    'agreement',
    'abort',
  ]),
  eloDeltas: z.object({ white: z.number(), black: z.number() }).nullable(),
})

export const DrawOfferedEventSchema = z.object({
  gameId: z.string().uuid(),
  byColor: z.enum(['w', 'b']),
})

export const DrawDeclinedEventSchema = z.object({ gameId: z.string().uuid() })

export const OpponentDisconnectedEventSchema = z.object({
  gameId: z.string().uuid(),
  remainingMs: z.number(),
})

// Inferred types
export type JoinGamePayload = z.infer<typeof JoinGamePayloadSchema>
export type SubmitMovePayload = z.infer<typeof SubmitMovePayloadSchema>
export type GameStartEvent = z.infer<typeof GameStartEventSchema>
export type MoveAppliedEvent = z.infer<typeof MoveAppliedEventSchema>
export type MoveRejectedEvent = z.infer<typeof MoveRejectedEventSchema>
export type GameEndEvent = z.infer<typeof GameEndEventSchema>
export type DrawOfferedEvent = z.infer<typeof DrawOfferedEventSchema>
export type GameEndResult = z.infer<typeof GameEndEventSchema>
