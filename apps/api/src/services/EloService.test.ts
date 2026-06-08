import { describe, it, expect } from 'vitest'
import { EloService } from './EloService.js'

const elo = new EloService()

describe('EloService', () => {
  it('equal players: white wins → ~+20 delta', () => {
    const K = elo.calculateKFactor(100, 'blitz')
    const E = elo.calculateExpected(1200, 1200)
    const newRating = elo.calculateNewRating(1200, E, 1, K)
    expect(newRating).toBe(1210)
  })

  it('heavy underdog wins → large gain', () => {
    const K = elo.calculateKFactor(5, 'blitz')
    const E = elo.calculateExpected(800, 1400)
    const newRating = elo.calculateNewRating(800, E, 1, K)
    expect(newRating).toBeGreaterThan(830)
  })

  it('heavy favorite wins → small gain', () => {
    const K = elo.calculateKFactor(100, 'blitz')
    const E = elo.calculateExpected(1800, 1000)
    const newRating = elo.calculateNewRating(1800, E, 1, K)
    expect(newRating).toBe(1800)
  })

  it('K factor: < 30 games → 40, >= 30 → 20', () => {
    expect(elo.calculateKFactor(0, 'blitz')).toBe(40)
    expect(elo.calculateKFactor(29, 'blitz')).toBe(40)
    expect(elo.calculateKFactor(30, 'blitz')).toBe(20)
  })

  it('K factor: classical always 20', () => {
    expect(elo.calculateKFactor(0, 'classical')).toBe(20)
  })

  it('rating floored at 100', () => {
    const K = elo.calculateKFactor(100, 'blitz')
    const E = elo.calculateExpected(100, 3000)
    const newRating = elo.calculateNewRating(100, E, 0, K)
    expect(newRating).toBe(100)
  })

  it('draw between equal players → no change', () => {
    const K = elo.calculateKFactor(100, 'blitz')
    const E = elo.calculateExpected(1200, 1200)
    const newRating = elo.calculateNewRating(1200, E, 0.5, K)
    expect(newRating).toBe(1200)
  })

  it('400-point underdog win gains more than equal-rated win', () => {
    const newPlayerK = elo.calculateKFactor(5, 'blitz')
    const upsetExpected = elo.calculateExpected(1000, 1400)
    const upsetGain =
      elo.calculateNewRating(1000, upsetExpected, 1, newPlayerK) - 1000

    const establishedK = elo.calculateKFactor(100, 'blitz')
    const normalExpected = elo.calculateExpected(1200, 1200)
    const normalGain =
      elo.calculateNewRating(1200, normalExpected, 1, establishedK) - 1200

    expect(upsetGain).toBeGreaterThan(normalGain)
    expect(upsetGain).toBeGreaterThan(30)
  })
})
