import { useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Board from '@/components/board/Board'
import MoveList from '@/components/board/MoveList'
import PlayerPanel from '@/components/ui/PlayerPanel'
import Button from '@/components/ui/Button'
import GameResultOverlay from '@/components/ui/GameResultOverlay'
import { useToast } from '@/components/ui/Toast'
import { useGameStore } from '@/stores/gameStore'
import { narrativeService } from '@/lib/narrativeService'
import { stockfishWorker } from '@/lib/stockfishWorker'
import type { Square, PromotionPiece, Color, AiDifficulty, MoveResult } from '@/lib/chessTypes'
import type { AiSetupConfig } from '@/pages/AiSetupPage'

const DIFFICULTY_LABELS: Record<AiDifficulty, string> = {
  foundling: 'Foundling',
  warrior: 'Warrior',
  champion: 'Champion',
  'mand-alor': "Mand'alor",
}

function factionForColor(color: Color): 'mandalorian' | 'imperial' {
  return color === 'w' ? 'mandalorian' : 'imperial'
}

function triggerMoveNarrative(move: MoveResult, moverColor: Color) {
  const moverFaction = factionForColor(moverColor)
  for (const ev of narrativeService.detectMoveEvents(move)) {
    narrativeService.trigger(ev, moverFaction)
  }
}

export default function AiGamePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

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
    playerColor,
    aiDifficulty,
    aiThinking,
    startAiGame,
    selectSquare,
    submitMove,
    resign,
    reset,
    setAiThinking,
    applyAiMove,
  } = useGameStore()

  const aiColor: Color = playerColor === 'w' ? 'b' : 'w'

  const legalMoves = useMemo(
    () =>
      selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [],
    [selectedSquare, legalMovesFromSelected]
  )

  const playerFaction = playerColor === 'w' ? 'mandalorian' : 'imperial'

  useEffect(() => {
    narrativeService.setToastFn(showToast)
    const enabled = localStorage.getItem('mando-narrative-enabled') !== 'false'
    narrativeService.setEnabled(enabled)

    const raw = localStorage.getItem('mando-ai-setup')
    if (!raw) {
      navigate('/play/ai')
      return
    }
    const cfg: AiSetupConfig = JSON.parse(raw)
    const startFaction = factionForColor(cfg.playerColor)
    narrativeService.triggerGameStart(startFaction, 1000)

    if (useGameStore.getState().status === 'idle') {
      startAiGame(cfg.playerColor, cfg.difficulty)
    }

    return () => {
      narrativeService.cancelGameStart()
      narrativeService.setToastFn(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== 'ended' || !result || !endReason) return
    narrativeService.triggerGameEnd(result, endReason)
  }, [status, result, endReason])

  useEffect(() => {
    if (status !== 'active') return
    if (turn !== aiColor) return
    if (aiThinking) return

    setAiThinking(true)

    stockfishWorker
      .getBestMove(fen, aiDifficulty ?? 'warrior')
      .then((uciMove) => {
        if (!uciMove || useGameStore.getState().status !== 'active') return
        const from = uciMove.slice(0, 2) as Square
        const to = uciMove.slice(2, 4) as Square
        const promotion = uciMove.length === 5 ? (uciMove[4] as PromotionPiece) : undefined
        applyAiMove(from, to, promotion)

        const last = useGameStore.getState().moves.at(-1)
        if (last) triggerMoveNarrative(last, aiColor)
      })
      .finally(() => {
        setAiThinking(false)
      })
  }, [turn, status, aiThinking, fen, aiColor, aiDifficulty, setAiThinking, applyAiMove])

  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      if (turn !== playerColor) return
      const ok = submitMove(from, to, promotion)
      if (!ok) return

      const last = useGameStore.getState().moves.at(-1)
      if (last) triggerMoveNarrative(last, playerColor)
    },
    [turn, playerColor, submitMove]
  )

  const handleSquareClick = (sq: Square) => {
    if (turn !== playerColor || status !== 'active') return
    selectSquare(sq)
  }

  const aiFaction = playerColor === 'w' ? 'imperial' : 'mandalorian'
  const diffLabel = aiDifficulty ? DIFFICULTY_LABELS[aiDifficulty] : 'Warrior'

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
          username={`${diffLabel} AI`}
          faction={aiFaction}
          clockMs={0}
          isActive={turn === aiColor && status === 'active'}
          isTop
          thinking={aiThinking}
        />
      </div>

      <div className="[grid-area:board] flex justify-center">
        <Board
          fen={fen}
          orientation={playerColor}
          legalMoves={legalMoves}
          lastMove={lastMove}
          selectedSquare={selectedSquare}
          onSquareClick={handleSquareClick}
          onMove={handleMove}
          interactive={turn === playerColor && status === 'active'}
        />
      </div>

      <div className="[grid-area:bottom]">
        <PlayerPanel
          username="You"
          faction={playerFaction}
          clockMs={0}
          isActive={turn === playerColor && status === 'active'}
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
          <div className="flex justify-center mt-3 pt-2 border-t border-mando-gold/20 shrink-0">
            <Button variant="danger" size="sm" onClick={() => resign(playerColor)}>
              Resign
            </Button>
          </div>
        )}
      </div>

      {status === 'ended' && result && endReason && (
        <GameResultOverlay
          result={result}
          reason={endReason}
          onNewGame={() => {
            reset()
            navigate('/play/ai')
          }}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}
