import { useEffect, useCallback } from 'react'
import { socketClient } from '@/lib/socketClient'
import type { MoveAppliedEvent, GameEndEvent } from '@/lib/chessTypes'

interface UseGameOptions {
  gameId: string
  onMoveApplied: (event: MoveAppliedEvent) => void
  onGameEnd: (event: GameEndEvent) => void
  onDrawOffered: (byColor: 'w' | 'b') => void
  onDrawDeclined: () => void
  onOpponentDisconnected: (remainingMs: number) => void
  onOpponentReconnected: () => void
}

export function useGame(options: UseGameOptions) {
  const { gameId } = options

  useEffect(() => {
    if (!socketClient.instance) return

    socketClient.emit('game:join', { gameId })

    const unsubs = [
      socketClient.on('move:applied', (e) => options.onMoveApplied(e as MoveAppliedEvent)),
      socketClient.on('game:end', (e) => options.onGameEnd(e as GameEndEvent)),
      socketClient.on('draw:offered', (payload) => {
        const { byColor } = payload as { byColor: 'w' | 'b' }
        options.onDrawOffered(byColor)
      }),
      socketClient.on('draw:declined', () => options.onDrawDeclined()),
      socketClient.on('opponent:disconnected', (payload) => {
        const { remainingMs } = payload as { remainingMs: number }
        options.onOpponentDisconnected(remainingMs)
      }),
      socketClient.on('opponent:reconnected', () => options.onOpponentReconnected()),
    ]

    return () => unsubs.forEach((off) => off())
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      socketClient.emit('move:submit', { gameId, from, to, promotion })
    },
    [gameId],
  )

  const resign = useCallback(() => {
    socketClient.emit('resign', { gameId })
  }, [gameId])

  const offerDraw = useCallback(() => {
    socketClient.emit('draw:offer', { gameId })
  }, [gameId])

  const respondDraw = useCallback(
    (accept: boolean) => {
      socketClient.emit('draw:respond', { gameId, accept })
    },
    [gameId],
  )

  return { submitMove, resign, offerDraw, respondDraw }
}
