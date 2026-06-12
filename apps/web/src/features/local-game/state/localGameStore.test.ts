import { beforeEach, describe, expect, it } from 'vitest'
import { useClockStore } from './clockStore'
import { useLocalGameStore } from './localGameStore'

beforeEach(() => {
  useClockStore.getState().reset()
  useLocalGameStore.getState().reset()
})

describe('local game store', () => {
  it("ends the game and records Scholar's Mate as checkmate", () => {
    const game = useLocalGameStore.getState()
    game.startLocalGame()

    expect(game.submitMove('e2', 'e4')).toBe(true)
    expect(game.submitMove('e7', 'e5')).toBe(true)
    expect(game.submitMove('d1', 'h5')).toBe(true)
    expect(game.submitMove('b8', 'c6')).toBe(true)
    expect(game.submitMove('f1', 'c4')).toBe(true)
    expect(game.submitMove('g8', 'f6')).toBe(true)
    expect(game.submitMove('h5', 'f7')).toBe(true)

    const state = useLocalGameStore.getState()
    expect(state.status).toBe('ended')
    expect(state.result).toBe('1-0')
    expect(state.endReason).toBe('checkmate')
    expect(state.isCheck).toBe(true)
    expect(state.selectedSquare).toBeNull()
    expect(state.legalMovesFromSelected).toEqual([])
    expect(state.moves.at(-1)).toMatchObject({
      san: 'Qxf7#',
      isCheck: true,
      isCheckmate: true,
    })
    expect(state.submitMove('a7', 'a6')).toBe(false)
  })
})
