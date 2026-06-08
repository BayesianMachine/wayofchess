import { useEffect, useCallback, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '@/components/board/Board'
import MoveList from '@/components/board/MoveList'
import PlayerPanel from '@/components/ui/PlayerPanel'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import GameResultOverlay from '@/components/ui/GameResultOverlay'
import { useToast } from '@/components/ui/Toast'
import { useGameStore } from '@/stores/gameStore'
import { useClockStore } from '@/stores/clockStore'
import type { Square, PromotionPiece, Color, MoveResult } from '@/lib/chessTypes'
import { narrativeService } from '@/lib/narrativeService'
import type { LocalSetupConfig } from '@/pages/LocalSetupPage'

function factionForColor(color: Color): 'mandalorian' | 'imperial' {
  return color === 'w' ? 'mandalorian' : 'imperial'
}

function triggerMoveNarrative(move: MoveResult, moverColor: Color) {
  const moverFaction = factionForColor(moverColor)
  for (const ev of narrativeService.detectMoveEvents(move)) {
    narrativeService.trigger(ev, moverFaction)
  }
}

export default function LocalGamePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showDrawModal, setShowDrawModal] = useState(false)
  const [clockEnabled, setClockEnabled] = useState(false)

  const {
    fen,
    turn,
    status,
    result,
    endReason,
    moves,
    selectedSquare,
    legalMovesFromSelected,
    lastMove,
    startLocalGame,
    selectSquare,
    submitMove,
    resign,
    endGame,
    reset,
  } = useGameStore()

  const { whiteMs, blackMs, init, startFor, addIncrement, flagCheck, reset: resetClock } =
    useClockStore()

  const legalMoves = useMemo(
    () =>
      selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [],
    [selectedSquare, legalMovesFromSelected]
  )

  useEffect(() => {
    narrativeService.setToastFn(showToast)
    const enabled = localStorage.getItem('mando-narrative-enabled') !== 'false'
    narrativeService.setEnabled(enabled)
    narrativeService.triggerGameStart('mandalorian', 1000)

    return () => {
      narrativeService.cancelGameStart()
      narrativeService.setToastFn(() => {})
    }
  }, [showToast])

  useEffect(() => {
    if (status !== 'ended' || !result || !endReason) return
    narrativeService.triggerGameEnd(result, endReason)
  }, [status, result, endReason])

  useEffect(() => {
    const raw = localStorage.getItem('mando-local-setup')
    const config: LocalSetupConfig = raw
      ? JSON.parse(raw)
      : { timeControlBaseSec: 0, timeControlIncSec: 0 }

    const { status: gameStatus } = useGameStore.getState()
    if (gameStatus === 'idle') {
      startLocalGame(config.timeControlBaseSec, config.timeControlIncSec)
    }

    if (config.timeControlBaseSec > 0) {
      setClockEnabled(true)
      init(config.timeControlBaseSec, config.timeControlIncSec)
      if (useGameStore.getState().status === 'active') {
        startFor('w')
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clockEnabled || status !== 'active') return

    const id = setInterval(() => {
      const flagged = flagCheck()
      if (flagged) {
        const gameResult = flagged === 'w' ? '0-1' : '1-0'
        endGame(gameResult, 'timeout')
      }
    }, 500)

    return () => clearInterval(id)
  }, [clockEnabled, status, flagCheck, endGame])

  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      const mover = turn
      const ok = submitMove(from, to, promotion)
      if (!ok) return

      if (clockEnabled && useClockStore.getState().isRunning) {
        addIncrement(mover)
        const nextTurn = mover === 'w' ? 'b' : 'w'
        if (useGameStore.getState().status === 'active') {
          startFor(nextTurn)
        }
      }

      const last = useGameStore.getState().moves.at(-1)
      if (last) triggerMoveNarrative(last, mover)
    },
    [turn, submitMove, clockEnabled, addIncrement, startFor]
  )

  const handleNewGame = () => {
    reset()
    resetClock()
    navigate('/play/local')
  }

  if (!fen) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-mando-silver">
        Loading game...
      </div>
    )
  }

  return (
    <div
      className="grid gap-3 max-w-6xl mx-auto px-4 py-4 min-h-[calc(100vh-4rem)] grid-cols-1
        [grid-template-areas:'top'_'board'_'bottom'_'sidebar']
        md:grid-cols-[1fr_min(16rem,28%)]
        md:[grid-template-areas:'top_top'_'board_sidebar'_'bottom_bottom']"
    >
      <div className="[grid-area:top]">
        <PlayerPanel
          username="Black"
          faction="imperial"
          clockMs={clockEnabled ? blackMs : 0}
          isActive={turn === 'b' && status === 'active'}
          isTop
        />
      </div>

      <div className="[grid-area:board] flex justify-center">
        <Board
          fen={fen}
          orientation="w"
          legalMoves={legalMoves}
          lastMove={lastMove}
          selectedSquare={selectedSquare}
          onSquareClick={selectSquare}
          onMove={handleMove}
          interactive={status === 'active'}
        />
      </div>

      <div className="[grid-area:bottom]">
        <PlayerPanel
          username="White"
          faction="mandalorian"
          clockMs={clockEnabled ? whiteMs : 0}
          isActive={turn === 'w' && status === 'active'}
          isTop={false}
        />
      </div>

      <div className="[grid-area:sidebar] flex flex-col min-h-0 md:max-h-[min(70vh,640px)]">
        <h3 className="text-mando-gold text-sm font-semibold mb-2 shrink-0">Moves</h3>
        <MoveList
          moves={moves}
          maxHeight={undefined}
          className="flex-1 min-h-[100px] overflow-y-auto"
        />
        {status === 'active' && (
          <div className="flex flex-wrap gap-2 justify-center mt-3 pt-2 border-t border-mando-gold/20 shrink-0">
            <Button variant="danger" size="sm" onClick={() => resign('w')}>
              Resign White
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDrawModal(true)}>
              Offer Draw
            </Button>
            <Button variant="danger" size="sm" onClick={() => resign('b')}>
              Resign Black
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        title="Draw Offer"
        size="sm"
      >
        <p className="text-mando-silver mb-6">Offer draw to your opponent?</p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              endGame('1/2-1/2', 'agreement')
              setShowDrawModal(false)
            }}
          >
            Accept
          </Button>
          <Button variant="ghost" onClick={() => setShowDrawModal(false)}>
            Decline
          </Button>
        </div>
      </Modal>

      {status === 'ended' && result && endReason && (
        <GameResultOverlay
          result={result}
          reason={endReason}
          onNewGame={handleNewGame}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}
