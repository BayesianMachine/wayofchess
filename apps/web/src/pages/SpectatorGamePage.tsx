import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Board from '@/components/board/Board'
import MoveList from '@/components/board/MoveList'
import PlayerPanel from '@/components/ui/PlayerPanel'
import GameResultOverlay from '@/components/ui/GameResultOverlay'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { apiClient } from '@/lib/apiClient'
import { socketClient } from '@/lib/socketClient'
import {
  Game,
  type Square,
  type Color,
  type Faction,
  type GameResult,
  type EndReason,
  type MoveResult,
  type PromotionPiece,
  type MoveAppliedEvent,
  type GameEndEvent,
} from '@/lib/chessTypes'

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

export default function SpectatorGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [fen, setFen] = useState('')
  const [turn, setTurn] = useState<Color>('w')
  const [moves, setMoves] = useState<MoveResult[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [whiteMs, setWhiteMs] = useState(0)
  const [blackMs, setBlackMs] = useState(0)
  const [whiteName, setWhiteName] = useState('White')
  const [blackName, setBlackName] = useState('Black')
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [status, setStatus] = useState<'active' | 'ended'>('active')
  const [result, setResult] = useState<GameResult | null>(null)
  const [endReason, setEndReason] = useState<EndReason | null>(null)

  const syncFromFen = useCallback((nextFen: string, moveList: MoveResult[]) => {
    const g = new Game(nextFen)
    const state = g.getState()
    setFen(state.fen)
    setTurn(state.turn)
    setMoves(moveList)
  }, [])

  useEffect(() => {
    if (!gameId) return

    socketClient.connect()

    const load = async () => {
      try {
        const [meta, gameState] = await Promise.all([
          apiClient.get<{
            whitePlayer: { username: string } | null
            blackPlayer: { username: string } | null
          }>(`/api/v1/games/${gameId}`),
          apiClient.get<{
            fen: string
            moves: Array<{ san: string; from: string; to: string; promotion?: string }>
            clocks: { whiteMs: number; blackMs: number }
            status: 'waiting' | 'active' | 'ended'
          }>(`/api/v1/games/${gameId}/state`),
        ])

        setWhiteName(meta.whitePlayer?.username ?? 'White')
        setBlackName(meta.blackPlayer?.username ?? 'Black')
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
        navigate('/watch')
      } finally {
        setLoading(false)
      }
    }

    load()
    socketClient.emit('spectate:join', { gameId })

    const unsubs = [
      socketClient.on('move:applied', (e) => {
        const event = e as MoveAppliedEvent
        if (event.gameId !== gameId) return
        const move = apiMoveToResult(event.move)
        setMoves((prev) => {
          const next = [...prev, move]
          syncFromFen(event.fen, next)
          return next
        })
        setLastMove({ from: move.from, to: move.to })
        setWhiteMs(event.clocks.whiteMs)
        setBlackMs(event.clocks.blackMs)
        const count =
          typeof event.spectatorCount === 'number'
            ? event.spectatorCount
            : parseInt(String(event.spectatorCount), 10) || 0
        setSpectatorCount(count)
      }),
      socketClient.on('game:end', (e) => {
        const event = e as GameEndEvent
        if (event.gameId !== gameId) return
        setStatus('ended')
        setResult(event.result)
        setEndReason(event.reason)
      }),
    ]

    return () => unsubs.forEach((off) => off())
  }, [gameId, navigate, syncFromFen])

  if (loading || !fen) {
    return <LoadingSpinner />
  }

  return (
    <div
      className="grid gap-3 max-w-6xl mx-auto px-4 py-4 min-h-[calc(100vh-4rem)] grid-cols-1
        [grid-template-areas:'header'_'top'_'board'_'bottom'_'sidebar']
        md:grid-cols-[1fr_min(16rem,28%)]
        md:[grid-template-areas:'header_header'_'top_top'_'board_sidebar'_'bottom_bottom']"
    >
      <p className="[grid-area:header] text-center text-sm text-mando-silver">
        {spectatorCount} spectator{spectatorCount === 1 ? '' : 's'} watching
      </p>

      <div className="[grid-area:top]">
        <PlayerPanel
          username={blackName}
          faction={factionForColor('b')}
          clockMs={blackMs}
          isActive={turn === 'b' && status === 'active'}
          isTop
        />
      </div>

      <div className="[grid-area:board] flex justify-center">
        <Board
          fen={fen}
          orientation="w"
          legalMoves={[]}
          lastMove={lastMove}
          onMove={() => {}}
          interactive={false}
        />
      </div>

      <div className="[grid-area:bottom]">
        <PlayerPanel
          username={whiteName}
          faction={factionForColor('w')}
          clockMs={whiteMs}
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
      </div>

      {status === 'ended' && result && endReason && (
        <GameResultOverlay
          result={result}
          reason={endReason}
          onNewGame={() => navigate('/watch')}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  )
}
