import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Board, MoveList } from '@/features/chess-board'
import { Button, GameResultOverlay, Modal, PlayerPanel, useToast } from '@/shared/ui'
import { useLocalGameStore } from '@/features/local-game/state/localGameStore'
import { useClockStore } from '@/features/local-game/state/clockStore'
import type { Square, PromotionPiece, Color, MoveResult } from '@/shared/types'
import { narrativeService } from '@/features/local-game/services/narrativeService'
import { loadClock, loadPreferences } from '../services/gameRepository'
import {
  archiveCurrentGame,
  checkpointCurrentClock,
  checkpointCurrentGame,
  timeoutResult,
} from '../services/persistenceService'
import { reconcileClock } from '../services/clockRecovery'

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
    selectSquare,
    submitMove,
    resign,
    endGame,
    reset,
    warning,
    setWarning,
  } = useLocalGameStore()

  const { whiteMs, blackMs, startFor, addIncrement, flagCheck, reset: resetClock } =
    useClockStore()

  const legalMoves = useMemo(
    () =>
      selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [],
    [selectedSquare, legalMovesFromSelected]
  )
  const handledMoveCount = useRef(moves.length)

  useEffect(() => {
    narrativeService.setToastFn(showToast)
    void loadPreferences().then((preferences) => {
      narrativeService.setEnabled(preferences?.narrativeEnabled ?? true)
    })
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
    if (!fen || status === 'idle') {
      navigate('/', { replace: true })
      return
    }
    setClockEnabled(useLocalGameStore.getState().timeControlBaseSec > 0)
  }, [fen, status, navigate])

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

  useEffect(() => {
    if (!clockEnabled || status !== 'active') return
    const id = setInterval(() => {
      void checkpointCurrentClock().catch(() => {
        setWarning('Clock persistence failed. Play can continue in this tab.')
      })
    }, 5000)
    return () => clearInterval(id)
  }, [clockEnabled, status, setWarning])

  useEffect(() => {
    if (moves.length <= handledMoveCount.current) {
      handledMoveCount.current = moves.length
      return
    }
    handledMoveCount.current = moves.length
    const last = moves.at(-1)
    const mover: Color = turn === 'w' ? 'b' : 'w'
    if (last) triggerMoveNarrative(last, mover)

    if (clockEnabled && useClockStore.getState().isRunning) {
      addIncrement(mover)
      if (status === 'active') startFor(turn)
    }

    void checkpointCurrentGame().catch(() => {
      setWarning('This move could not be saved, but play can continue.')
    })
  }, [moves, turn, status, clockEnabled, addIncrement, startFor, setWarning])

  useEffect(() => {
    const checkpointAndSuspend = () => {
      if (document.visibilityState === 'hidden') {
        void checkpointCurrentClock()
        useClockStore.getState().suspend()
      } else {
        void (async () => {
          const persisted = await loadClock()
          if (!persisted) return
          const reconciled = reconcileClock(persisted)
          useClockStore.getState().restore(
            {
              whiteMs: reconciled.whiteMs,
              blackMs: reconciled.blackMs,
              incrementMs: persisted.incrementMs,
              activeColor: reconciled.timedOutColor ? null : persisted.activeColor,
              isRunning: reconciled.timedOutColor ? false : persisted.isRunning,
            },
            !reconciled.timedOutColor
          )
          if (reconciled.warning) setWarning(reconciled.warning)
          if (reconciled.timedOutColor) {
            endGame(timeoutResult(reconciled.timedOutColor), 'timeout')
          }
        })()
      }
    }
    const pageHide = () => {
      void checkpointCurrentClock()
      useClockStore.getState().suspend()
    }
    document.addEventListener('visibilitychange', checkpointAndSuspend)
    window.addEventListener('pagehide', pageHide)
    return () => {
      document.removeEventListener('visibilitychange', checkpointAndSuspend)
      window.removeEventListener('pagehide', pageHide)
    }
  }, [endGame, setWarning])

  useEffect(() => {
    if (status !== 'ended') return
    useClockStore.getState().stop()
    void archiveCurrentGame().catch(() => {
      setWarning('The completed game could not be added to history.')
    })
  }, [status, setWarning])

  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      submitMove(from, to, promotion)
    },
    [submitMove]
  )

  const handleNewGame = async () => {
    await archiveCurrentGame().catch(() => undefined)
    reset()
    resetClock()
    navigate('/')
  }

  const handleHome = async () => {
    await archiveCurrentGame().catch(() => undefined)
    navigate('/')
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
      className="grid gap-3 max-w-6xl mx-auto px-2 py-3 sm:px-4 sm:py-4 min-h-dvh grid-cols-1
        [grid-template-areas:'top'_'board'_'bottom'_'sidebar']
        md:h-dvh md:overflow-hidden
        md:grid-cols-[1fr_min(16rem,28%)]
        md:[grid-template-areas:'top_top'_'board_sidebar'_'bottom_bottom']"
    >
      {warning && (
        <div role="status" className="[grid-area:top] z-10 justify-self-center self-start mt-1 border border-mando-gold/40 bg-space-bg px-3 py-1 text-xs text-mando-silver">
          {warning}
        </div>
      )}
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
          onHome={handleHome}
        />
      )}
    </div>
  )
}
