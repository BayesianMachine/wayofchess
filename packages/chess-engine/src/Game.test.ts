import { describe, it, expect } from 'vitest'
import { Game } from './index.js'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('Game', () => {
  describe('initial state', () => {
    it('has correct starting FEN, white to move, and 20 legal moves', () => {
      const game = new Game()
      const state = game.getState()

      expect(game.toFEN()).toBe(START_FEN)
      expect(state.fen).toBe(START_FEN)
      expect(state.turn).toBe('w')
      expect(state.legalMoves).toHaveLength(20)
      expect(state.isCheck).toBe(false)
      expect(state.isCheckmate).toBe(false)
      expect(state.isGameOver).toBe(false)
    })
  })

  describe("Scholar's Mate", () => {
    it('delivers checkmate on the 7th move', () => {
      const game = new Game()

      expect(game.move('e2', 'e4')?.san).toBe('e4')
      expect(game.move('e7', 'e5')?.san).toBe('e5')
      expect(game.move('d1', 'h5')?.san).toBe('Qh5')
      expect(game.move('b8', 'c6')?.san).toBe('Nc6')
      expect(game.move('f1', 'c4')?.san).toBe('Bc4')
      expect(game.move('g8', 'f6')?.san).toBe('Nf6')

      const mate = game.move('h5', 'f7')
      expect(mate).not.toBeNull()
      expect(mate?.san).toBe('Qxf7#')
      expect(mate?.isCheck).toBe(true)
      expect(mate?.isCheckmate).toBe(true)

      const state = game.getState()
      expect(state.isCheckmate).toBe(true)
      expect(state.isGameOver).toBe(true)

      const end = game.getGameEndResult()
      expect(end?.result).toBe('1-0')
      expect(end?.reason).toBe('checkmate')
    })
  })

  describe('stalemate', () => {
    it('detects stalemate in a known position', () => {
      const game = new Game('5k2/5P2/5K2/8/8/8/8/8 b - - 0 1')
      const state = game.getState()

      expect(state.isStalemate).toBe(true)
      expect(state.isDraw).toBe(true)
      expect(state.isGameOver).toBe(true)
      expect(state.legalMoves).toHaveLength(0)

      const end = game.getGameEndResult()
      expect(end?.result).toBe('1/2-1/2')
      expect(end?.reason).toBe('stalemate')
    })
  })

  describe('illegal moves', () => {
    it('returns null for backward pawn move', () => {
      const game = new Game()
      expect(game.move('e2', 'e3')).not.toBeNull()
      expect(game.move('e3', 'e2')).toBeNull()
    })

    it('returns null when moving onto a friendly piece', () => {
      const game = new Game()
      expect(game.move('e2', 'e4')).not.toBeNull()
      expect(game.move('g1', 'f3')).toBeNull()
    })
  })

  describe('en passant', () => {
    it('includes en passant capture in legal moves', () => {
      const game = new Game(START_FEN)
      game.move('e2', 'e4')
      game.move('d7', 'd5')
      game.move('e4', 'e5')
      game.move('f7', 'f5')

      const state = game.getState()
      expect(state.enPassantTarget).toBe('f6')

      const epDestinations = game.getLegalMovesFrom('e5')
      expect(epDestinations).toContain('f6')

      const epMove = state.legalMoves.find((m) => m.from === 'e5' && m.to === 'f6')
      expect(epMove).toBeDefined()
      expect(epMove?.flags).toContain('e')

      const result = game.move('e5', 'f6')
      expect(result).not.toBeNull()
      expect(result?.captured).toBe('p')
    })
  })

  describe('castling', () => {
    it('allows castling and strips castling rights after castling', () => {
      const game = new Game()

      game.move('e2', 'e4')
      game.move('e7', 'e5')
      game.move('g1', 'f3')
      game.move('g8', 'f6')
      game.move('f1', 'c4')
      game.move('f8', 'c5')
      game.move('e1', 'g1')

      let state = game.getState()
      expect(state.castlingRights.white.kingSide).toBe(false)
      expect(state.castlingRights.white.queenSide).toBe(false)

      game.move('e8', 'g8')

      state = game.getState()
      expect(state.castlingRights.black.kingSide).toBe(false)
      expect(state.castlingRights.black.queenSide).toBe(false)

      const fresh = new Game()
      fresh.move('e2', 'e4')
      fresh.move('e7', 'e5')
      fresh.move('g1', 'f3')
      fresh.move('g8', 'f6')
      fresh.move('f1', 'c4')
      fresh.move('f8', 'c5')

      const beforeCastle = fresh.getState()
      expect(beforeCastle.castlingRights.white.kingSide).toBe(true)
      expect(beforeCastle.castlingRights.black.kingSide).toBe(true)

      const whiteCastle = beforeCastle.legalMoves.find(
        (m) => m.piece === 'k' && m.from === 'e1' && m.to === 'g1',
      )
      expect(whiteCastle).toBeDefined()
    })
  })

  describe('promotion', () => {
    it('promotes a pawn to a queen on a8', () => {
      const game = new Game('8/P7/8/8/8/8/8/k6K w - - 0 1')
      const result = game.move('a7', 'a8', 'q')

      expect(result).not.toBeNull()
      expect(result?.promotion).toBe('q')

      const piece = game.getPiece('a8')
      expect(piece).toEqual({ type: 'q', color: 'w' })
    })
  })

  describe('insufficient material', () => {
    it('detects insufficient material for a draw', () => {
      const game = new Game('k7/8/K7/8/8/8/8/7B w - - 0 1')
      const state = game.getState()

      expect(state.isInsufficientMaterial).toBe(true)
      expect(state.isDraw).toBe(true)
      expect(game.isInsufficientMaterial()).toBe(true)
    })
  })

  describe('undo', () => {
    it('restores the starting position after undo', () => {
      const game = new Game()
      game.move('e2', 'e4')
      game.move('e7', 'e5')
      expect(game.undo()).toBe(true)
      expect(game.undo()).toBe(true)
      expect(game.toFEN()).toBe(START_FEN)
    })
  })

  describe('getLegalMovesFrom', () => {
    it('returns no legal moves for a pinned piece', () => {
      // White Kf1, Nf2 pinned to king by black Rf8 on the f-file
      const game = new Game('5rk1/8/8/8/8/8/5N2/5K2 w - - 0 1')
      const destinations = game.getLegalMovesFrom('f2')
      expect(destinations).toHaveLength(0)
    })
  })

  describe('getHistory', () => {
    it('returns three moves with correct SANs', () => {
      const game = new Game()
      game.move('e2', 'e4')
      game.move('e7', 'e5')
      game.move('g1', 'f3')

      const history = game.getHistory()
      expect(history).toHaveLength(3)
      expect(history[0].san).toBe('e4')
      expect(history[1].san).toBe('e5')
      expect(history[2].san).toBe('Nf3')
    })
  })

  describe('loadPGN round-trip', () => {
    it('loads PGN and matches expected final FEN', () => {
      const game = new Game()
      game.move('e2', 'e4')
      game.move('e7', 'e5')
      game.move('g1', 'f3')
      const expectedFen = game.toFEN()
      const pgn = game.toPGN()

      const loaded = new Game()
      expect(loaded.loadPGN(pgn)).toBe(true)
      expect(loaded.toFEN()).toBe(expectedFen)
      expect(loaded.getHistory()).toHaveLength(3)
    })
  })
})
