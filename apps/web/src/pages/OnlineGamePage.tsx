import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Board from '@/components/board/Board'
import MoveList from '@/components/board/MoveList'
import PlayerPanel from '@/components/ui/PlayerPanel'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import GameResultOverlay from '@/components/ui/GameResultOverlay'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { useGame } from '@/hooks/useGame'
import { apiClient } from '@/lib/apiClient'
import { socketClient } from '@/lib/socketClient'
import { narrativeService } from '@/lib/narrativeService'
import {
  Game,
  type Square,
  type PromotionPiece,
  type Color,
  type Faction,
  type GameResult,
  type EndReason,
  type MoveResult,
  type MoveAppliedEvent,
  type GameEndEvent,
} from '@/lib/chessTypes'

interface GameMeta {
  id: string
  whiteUserId: string | null
  blackUserId: string | null
  timeControlBaseSec: number
  timeControlIncSec: number
  category: string
  status: string
  whitePlayer: { id: string; username: string } | null
  blackPlayer: { id: string; username: string } | null
}

function factionForColor(color: Color): Faction {
  return color === 'w' ? 'mandalorian' : 'imperial'
}

function apiMoveToResult(m: {
  san: string
  from: string
  to: string
  promotion?: string
}): MoveResult {
  return {
    san: m.san,
    from: m.from as Square,
    to: m.to as Square,
    piece: 'p',
    flags: '',
    isCheck: false,
    isCheckmate: false,
    ...(m.promotion ? { promotion: m.promotion as PromotionPiece } : {}),
  }
}

function triggerMoveNarrative(move: MoveResult, moverColor: Color) {
  const moverFaction = factionForColor(moverColor)
  for (const ev of narrativeService.detectMoveEvents(move)) {
    narrativeService.trigger(ev, moverFaction)
  }
}

export default function OnlineGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user, accessToken, isAuthenticated } = useAuth()

  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<GameMeta | null>(null)
  const [playerColor, setPlayerColor] = useState<Color>('w')
  const chessRef = useRef(new Game())
  const [fen, setFen] = useState('')
  const [turn, setTurn] = useState<Color>('w')
  const [status, setStatus] = useState<'active' | 'ended'>('active')
  const [moves, setMoves] = useState<MoveResult[]>([])
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMovesFromSelected, setLegalMovesFromSelected] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [whiteMs, setWhiteMs] = useState(0)
  const [blackMs, setBlackMs] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [endReason, setEndReason] = useState<EndReason | null>(null)
  const [eloDeltas, setEloDeltas] = useState<{ white: number; black: number } | null>(null)
  const [showDrawModal, setShowDrawModal] = useState(false)
  const [drawOfferBy, setDrawOfferBy] = useState<'w' | 'b' | null>(null)
  const [disconnectMs, setDisconnectMs] = useState<number | null>(null)
  const disconnectInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameStartFired = useRef(false)

  const syncFromFen = useCallback((nextFen: string, moveList?: MoveResult[]) => {
    chessRef.current = new Game(nextFen)
    const state = chessRef.current.getState()
    setFen(state.fen)
    setTurn(state.turn)
    if (moveList) setMoves(moveList)
    setSelectedSquare(null)
    setLegalMovesFromSelected([])
  }, [])

  useEffect(() => {
    if (!gameId || !isAuthenticated || !user) {
      navigate('/login')
      return
    }
    if (accessToken) socketClient.connect(accessToken)

    const load = async () => {
      try {
        const [gameMeta, gameState] = await Promise.all([
          apiClient.get<GameMeta>(`/api/v1/games/${gameId}`),
          apiClient.get<{
            fen: string
            moves: Array<{ san: string; from: string; to: string; promotion?: string }>
            clocks: { whiteMs: number; blackMs: number }
            status: 'waiting' | 'active' | 'ended'
          }>(`/api/v1/games/${gameId}/state`),
        ])

        setMeta(gameMeta)
        const color: Color =
          gameMeta.whitePlayer?.id === user.id
            ? 'w'
            : gameMeta.blackPlayer?.id === user.id
              ? 'b'
              : 'w'
        setPlayerColor(color)

        const parsedMoves = gameState.moves.map(apiMoveToResult)

        syncFromFen(gameState.fen, parsedMoves)
        if (parsedMoves.length > 0) {
          const last = parsedMoves[parsedMoves.length - 1]
          setLastMove({ from: last.from, to: last.to })
        }
        setWhiteMs(gameState.clocks.whiteMs)
        setBlackMs(gameState.clocks.blackMs)
        setStatus(gameState.status === 'ended' ? 'ended' : 'active')
      } catch {
        navigate('/play/online')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [gameId, user, isAuthenticated, accessToken, navigate, syncFromFen])

  const handleMoveApplied = useCallback(
    (event: MoveAppliedEvent) => {
      if (event.gameId !== gameId) return

      const from = event.move.from as Square
      const to = event.move.to as Square
      const promotion = event.move.promotion as PromotionPiece | undefined
      const moverColor = chessRef.current.getState().turn

      const moveResult =
        chessRef.current.move(from, to, promotion) ?? apiMoveToResult(event.move)

      setMoves((prev) => {
        const next = [...prev, moveResult]
        syncFromFen(event.fen, next)
        return next
      })
      setLastMove({ from: moveResult.from, to: moveResult.to })
      setWhiteMs(event.clocks.whiteMs)
      setBlackMs(event.clocks.blackMs)

      triggerMoveNarrative(moveResult, moverColor)
    },
    [gameId, syncFromFen],
  )

  const handleGameEnd = useCallback((event: GameEndEvent) => {
    if (event.gameId !== gameId) return
    setStatus('ended')
    setResult(event.result)
    setEndReason(event.reason)
    setEloDeltas(event.eloDeltas)
    setDrawOfferBy(null)
  }, [gameId])

  const { submitMove, resign, offerDraw, respondDraw } = useGame({
    gameId: gameId ?? '',
    onMoveApplied: handleMoveApplied,
    onGameEnd: handleGameEnd,
    onDrawOffered: (byColor) => {
      if (byColor !== playerColor) setDrawOfferBy(byColor)
    },
    onDrawDeclined: () => setDrawOfferBy(null),
    onOpponentDisconnected: (remainingMs) => {
      setDisconnectMs(remainingMs)
      if (disconnectInterval.current) clearInterval(disconnectInterval.current)
      let remaining = remainingMs
      disconnectInterval.current = setInterval(() => {
        remaining -= 1000
        if (remaining <= 0) {
          if (disconnectInterval.current) clearInterval(disconnectInterval.current)
          setDisconnectMs(null)
        } else {
          setDisconnectMs(remaining)
        }
      }, 1000)
    },
    onOpponentReconnected: () => {
      if (disconnectInterval.current) clearInterval(disconnectInterval.current)
      setDisconnectMs(null)
    },
  })

  useEffect(() => {
    return () => {
      if (disconnectInterval.current) clearInterval(disconnectInterval.current)
    }
  }, [])

  const playerFaction = factionForColor(playerColor)

  useEffect(() => {
    narrativeService.setToastFn(showToast)
    const enabled = localStorage.getItem('mando-narrative-enabled') !== 'false'
    narrativeService.setEnabled(enabled)

    return () => {
      narrativeService.cancelGameStart()
      narrativeService.setToastFn(() => {})
    }
  }, [showToast])

  useEffect(() => {
    if (loading || !fen || gameStartFired.current) return
    gameStartFired.current = true
    narrativeService.triggerGameStart(playerFaction, 1000)
  }, [loading, fen, playerFaction])

  useEffect(() => {
    if (status !== 'ended' || !result || !endReason) return
    narrativeService.triggerGameEnd(result, endReason)
  }, [status, result, endReason])

  const selectSquare = useCallback(
    (square: Square) => {
      if (status !== 'active' || turn !== playerColor) return

      if (selectedSquare === square) {
        setSelectedSquare(null)
        setLegalMovesFromSelected([])
        return
      }

      if (selectedSquare && legalMovesFromSelected.includes(square)) {
        submitMove(selectedSquare, square)
        setSelectedSquare(null)
        setLegalMovesFromSelected([])
        return
      }

      const piece = chessRef.current.getPiece(square)
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square)
        setLegalMovesFromSelected(chessRef.current.getLegalMovesFrom(square))
      } else {
        setSelectedSquare(null)
        setLegalMovesFromSelected([])
      }
    },
    [
      status,
      turn,
      playerColor,
      selectedSquare,
      legalMovesFromSelected,
      submitMove,
    ],
  )

  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: PromotionPiece) => {
      if (status !== 'active' || turn !== playerColor) return
      submitMove(from, to, promotion)
      setSelectedSquare(null)
      setLegalMovesFromSelected([])
    },
    [status, turn, playerColor, submitMove],
  )

  const legalMoves = useMemo(
    () =>
      selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [],
    [selectedSquare, legalMovesFromSelected],
  )

  const myEloDelta =
    eloDeltas && playerColor === 'w' ? eloDeltas.white : eloDeltas?.black ?? null

  if (loading || !fen || !meta) {
    return <LoadingSpinner />
  }

  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w'
  const topPlayer = opponentColor === 'b' ? meta.blackPlayer : meta.whitePlayer
  const bottomPlayer = playerColor === 'w' ? meta.whitePlayer : meta.blackPlayer
  const topMs = opponentColor === 'b' ? blackMs : whiteMs
  const bottomMs = playerColor === 'w' ? whiteMs : blackMs

  return (
    <div
      className="grid gap-3 max-w-6xl mx-auto px-4 py-4 min-h-[calc(100vh-4rem)] grid-cols-1
        [grid-template-areas:'banner'_'top'_'board'_'bottom'_'sidebar']
        md:grid-cols-[1fr_min(16rem,28%)]
        md:[grid-template-areas:'banner_banner'_'top_top'_'board_sidebar'_'bottom_bottom']"
    >
      {disconnectMs !== null && (
        <div className="[grid-area:banner] bg-imperial-red/20 border border-imperial-red/50 rounded-lg px-4 py-2 text-center text-sm text-imperial-red">
          Opponent disconnected — {Math.ceil(disconnectMs / 1000)}s to reconnect
        </div>
      )}

      {drawOfferBy && (
        <div className="[grid-area:banner] bg-mando-gold/10 border border-mando-gold/40 rounded-lg px-4 py-3 flex flex-wrap items-center justify-center gap-3">
          <span className="text-mando-silver text-sm">Opponent offered a draw</span>
          <Button
            size="sm"
            onClick={() => {
              respondDraw(true)
              setDrawOfferBy(null)
            }}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              respondDraw(false)
              setDrawOfferBy(null)
            }}
          >
            Decline
          </Button>
        </div>
      )}

      <div className="[grid-area:top]">
        <PlayerPanel
          username={topPlayer?.username ?? (opponentColor === 'b' ? 'Black' : 'White')}
          faction={factionForColor(opponentColor)}
          clockMs={topMs}
          isActive={turn === opponentColor && status === 'active'}
          isTop
        />
      </div>

      <div className="[grid-area:board] flex justify-center">
        <Board
          fen={fen}
          orientation={playerColor}
          legalMoves={legalMoves}
          lastMove={lastMove}
          selectedSquare={selectedSquare}
          onSquareClick={selectSquare}
          onMove={handleMove}
          interactive={status === 'active' && turn === playerColor}
        />
      </div>

      <div className="[grid-area:bottom]">
        <PlayerPanel
          username={bottomPlayer?.username ?? (playerColor === 'w' ? 'White' : 'Black')}
          faction={factionForColor(playerColor)}
          clockMs={bottomMs}
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
          <div className="flex flex-wrap gap-2 justify-center mt-3 pt-2 border-t border-mando-gold/20 shrink-0">
            <Button variant="danger" size="sm" onClick={() => resign()}>
              Resign
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowDrawModal(true)}>
              Offer Draw
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
        <p className="text-mando-silver mb-6">Offer a draw to your opponent?</p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              offerDraw()
              setShowDrawModal(false)
              showToast('Draw offer sent')
            }}
          >
            Send Offer
          </Button>
          <Button variant="ghost" onClick={() => setShowDrawModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {status === 'ended' && result && endReason && (
        <>
          {myEloDelta !== null && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[201] px-4 py-2 rounded-lg bg-space-bg border border-mando-gold/40 text-mando-gold text-sm">
              Rating {myEloDelta >= 0 ? '+' : ''}
              {myEloDelta}
            </div>
          )}
          <GameResultOverlay
            result={result}
            reason={endReason}
            onNewGame={() => navigate('/play/online')}
            onHome={() => navigate('/')}
          />
        </>
      )}
    </div>
  )
}
