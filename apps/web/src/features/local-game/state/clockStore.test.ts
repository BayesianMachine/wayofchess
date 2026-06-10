import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClockStore } from './clockStore'

beforeEach(() => {
  vi.useFakeTimers()
  useClockStore.getState().reset()
})

afterEach(() => {
  useClockStore.getState().reset()
  vi.useRealTimers()
})

describe('local clock store', () => {
  it('decrements only the active clock', () => {
    useClockStore.getState().init(10, 0)
    useClockStore.getState().startFor('w')
    vi.advanceTimersByTime(500)

    expect(useClockStore.getState().whiteMs).toBe(9_500)
    expect(useClockStore.getState().blackMs).toBe(10_000)
  })

  it('adds the configured increment after a move', () => {
    useClockStore.getState().init(10, 2)
    useClockStore.getState().setClocks(9_400, 10_000)
    useClockStore.getState().addIncrement('w')

    expect(useClockStore.getState().whiteMs).toBe(11_400)
  })

  it('reports a timeout after the active clock reaches zero', () => {
    useClockStore.getState().init(1, 0)
    useClockStore.getState().startFor('w')
    vi.advanceTimersByTime(1_100)

    expect(useClockStore.getState().flagCheck()).toBe('w')
    expect(useClockStore.getState().isRunning).toBe(false)
  })
})
