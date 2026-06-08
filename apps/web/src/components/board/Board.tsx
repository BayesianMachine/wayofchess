import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import type { Square, Color, Piece, PromotionPiece } from '@/lib/chessTypes'
import { Game, squareToCoords, coordsToSquare } from '@/lib/chessTypes'
import BoardBackground from '@/components/board/BoardBackground'
import SquareHighlight from '@/components/board/SquareHighlight'
import PieceComponent from '@/components/board/PieceComponent'
import PromotionDialog from '@/components/board/PromotionDialog'
import CheckRing from '@/components/board/CheckRing'

interface BoardProps {
  fen: string
  orientation: Color
  legalMoves: Array<{ from: Square; legalTargets: Square[] }>
  lastMove: { from: Square; to: Square } | null
  onMove: (from: Square, to: Square, promotion?: PromotionPiece) => void
  interactive?: boolean
  selectedSquare?: Square | null
  onSquareClick?: (square: Square) => void
}

function computeBoardSize(): number {
  return Math.min(window.innerWidth * 0.9, window.innerHeight * 0.85, 600)
}

function clientToSquare(
  clientX: number,
  clientY: number,
  boardRect: DOMRect,
  boardSize: number,
  flipped: boolean
): Square | null {
  const sqSize = boardSize / 8
  const x = clientX - boardRect.left
  const y = clientY - boardRect.top
  if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null

  let file = Math.floor(x / sqSize)
  let rank = 7 - Math.floor(y / sqSize)
  if (flipped) {
    file = 7 - file
    rank = 7 - rank
  }
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return coordsToSquare(file, rank)
}

export default function Board({
  fen,
  orientation,
  legalMoves,
  lastMove,
  onMove,
  interactive = true,
  selectedSquare = null,
  onSquareClick,
}: BoardProps) {
  const flipped = orientation === 'b'
  const [boardSize, setBoardSize] = useState(computeBoardSize)
  const [dragFrom, setDragFrom] = useState<Square | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 })
  const [promotionPending, setPromotionPending] = useState<{
    from: Square
    to: Square
    color: Color
  } | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [captureOverlay, setCaptureOverlay] = useState<{
    square: Square
    piece: Piece
    exiting: boolean
  } | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const prevFenRef = useRef(fen)
  const prevInCheckRef = useRef(false)
  const sqSize = boardSize / 8

  useEffect(() => {
    const onResize = () => setBoardSize(computeBoardSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const game = useMemo(() => new Game(fen), [fen])
  const board = game.getBoard()
  const { isCheck: inCheck, turn } = game.getState()

  useEffect(() => {
    if (inCheck && !prevInCheckRef.current) {
      setIsShaking(true)
      const t = setTimeout(() => setIsShaking(false), 300)
      prevInCheckRef.current = inCheck
      return () => clearTimeout(t)
    }
    prevInCheckRef.current = inCheck
  }, [fen, inCheck])

  useEffect(() => {
    if (fen === prevFenRef.current) return

    if (lastMove) {
      const prevGame = new Game(prevFenRef.current)
      const mover = prevGame.getPiece(lastMove.from)
      const victim = prevGame.getPiece(lastMove.to)
      if (victim && mover && victim.color !== mover.color) {
        setCaptureOverlay({ square: lastMove.to, piece: victim, exiting: false })
        const startExit = requestAnimationFrame(() => {
          setCaptureOverlay((c) => (c ? { ...c, exiting: true } : null))
        })
        const clear = setTimeout(() => setCaptureOverlay(null), 200)
        prevFenRef.current = fen
        return () => {
          cancelAnimationFrame(startExit)
          clearTimeout(clear)
        }
      }
    }

    prevFenRef.current = fen
  }, [fen, lastMove])

  const checkSquare = useMemo(() => {
    if (!inCheck) return null
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const cell = board[r][f]
        if (cell && cell.type === 'k' && cell.color === turn) {
          return coordsToSquare(f, 7 - r)
        }
      }
    }
    return null
  }, [board, inCheck, turn])

  const legalTargetsForSelected = useMemo(() => {
    if (!selectedSquare) return []
    const entry = legalMoves.find((m) => m.from === selectedSquare)
    return entry?.legalTargets ?? []
  }, [legalMoves, selectedSquare])

  const pieces: Array<{ square: Square; piece: Piece }> = useMemo(() => {
    const list: Array<{ square: Square; piece: Piece }> = []
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const cell = board[r][f]
        if (cell) {
          list.push({
            square: coordsToSquare(f, 7 - r),
            piece: { type: cell.type as Piece['type'], color: cell.color as Color },
          })
        }
      }
    }
    return list
  }, [board])

  const squareStyle = useCallback(
    (sq: Square) => {
      let { file, rank } = squareToCoords(sq)
      if (flipped) {
        file = 7 - file
        rank = 7 - rank
      }
      return {
        left: file * sqSize,
        top: (7 - rank) * sqSize,
        width: sqSize,
        height: sqSize,
      }
    },
    [flipped, sqSize]
  )

  const isLegalTarget = useCallback(
    (from: Square, to: Square) => {
      const entry = legalMoves.find((m) => m.from === from)
      return entry?.legalTargets.includes(to) ?? false
    },
    [legalMoves]
  )

  const needsPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      const piece = game.getPiece(from)
      if (!piece || piece.type !== 'p') return false
      const { rank: toRank } = squareToCoords(to)
      return (piece.color === 'w' && toRank === 7) || (piece.color === 'b' && toRank === 0)
    },
    [game]
  )

  const attemptMove = useCallback(
    (from: Square, to: Square) => {
      if (!isLegalTarget(from, to)) return
      if (needsPromotion(from, to)) {
        const piece = game.getPiece(from)!
        setPromotionPending({ from, to, color: piece.color })
        return
      }
      onMove(from, to)
    },
    [game, isLegalTarget, needsPromotion, onMove]
  )

  const handleSquareClick = (sq: Square) => {
    if (!interactive) return
    onSquareClick?.(sq)
  }

  const handleMouseDown = (e: React.MouseEvent, sq: Square, piece: Piece) => {
    if (!interactive || piece.color !== turn) return
    e.preventDefault()
    setDragFrom(sq)
    setIsDragging(true)
    setGhostPos({ x: e.clientX, y: e.clientY })
    onSquareClick?.(sq)
  }

  useEffect(() => {
    if (!isDragging || !dragFrom) return

    const onMouseMove = (e: MouseEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY })
    }

    const onMouseUp = (e: MouseEvent) => {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        const target = clientToSquare(e.clientX, e.clientY, rect, boardSize, flipped)
        if (target) attemptMove(dragFrom, target)
      }
      setDragFrom(null)
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, dragFrom, boardSize, flipped, attemptMove])

  const dragPiece = dragFrom ? pieces.find((p) => p.square === dragFrom)?.piece : null

  const pieceLayoutId = useCallback(
    (square: Square) => {
      if (lastMove?.to === square) return `piece-${lastMove.from}`
      return `piece-${square}`
    },
    [lastMove]
  )

  const displayRanks = flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const displayFiles = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]

  return (
    <div
      className={`relative inline-block${isShaking ? ' animate-board-shake' : ''}`}
      ref={boardRef}
    >
      <BoardBackground size={boardSize} flipped={flipped} />
      <SquareHighlight
        size={boardSize}
        flipped={flipped}
        selectedSquare={selectedSquare}
        legalSquares={legalTargetsForSelected}
        lastMove={lastMove}
        checkSquare={checkSquare}
      />

      {/* Click targets */}
      <div className="absolute inset-0" style={{ width: boardSize, height: boardSize }}>
        {displayRanks.map((rankIdx) =>
          displayFiles.map((fileIdx) => {
            const sq = coordsToSquare(fileIdx, rankIdx)
            return (
              <button
                key={sq}
                type="button"
                className="absolute p-0 border-0 bg-transparent cursor-pointer"
                style={squareStyle(sq)}
                onClick={() => handleSquareClick(sq)}
                aria-label={`Square ${sq}`}
              />
            )
          })
        )}
      </div>

      {inCheck && checkSquare && (
        <div
          className="absolute pointer-events-none z-[5]"
          style={squareStyle(checkSquare)}
        >
          <CheckRing squareSize={sqSize} />
        </div>
      )}

      {/* Pieces */}
      <div className="absolute inset-0 pointer-events-none" style={{ width: boardSize, height: boardSize }}>
        <LayoutGroup>
          {pieces.map(({ square, piece }) => {
            if (isDragging && square === dragFrom) return null
            if (
              captureOverlay &&
              !captureOverlay.exiting &&
              square === captureOverlay.square
            ) {
              return null
            }
            return (
              <div
                key={square}
                className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                style={squareStyle(square)}
                onMouseDown={(e) => handleMouseDown(e, square, piece)}
              >
                <motion.div
                  layoutId={pieceLayoutId(square)}
                  layout="position"
                  transition={{ type: 'spring', stiffness: 500, damping: 40, duration: 0.12 }}
                >
                  <PieceComponent piece={piece} size={sqSize} />
                </motion.div>
              </div>
            )
          })}
          {captureOverlay && (
            <div
              key={`capture-${captureOverlay.square}`}
              className="absolute pointer-events-none"
              style={squareStyle(captureOverlay.square)}
            >
              <PieceComponent
                piece={captureOverlay.piece}
                size={sqSize}
                isCapturing={captureOverlay.exiting}
              />
            </div>
          )}
        </LayoutGroup>
      </div>

      {promotionPending && (
        <PromotionDialog
          square={promotionPending.to}
          color={promotionPending.color}
          boardSize={boardSize}
          flipped={flipped}
          onSelect={(p) => {
            onMove(promotionPending.from, promotionPending.to, p)
            setPromotionPending(null)
          }}
          onCancel={() => setPromotionPending(null)}
        />
      )}

      {isDragging && dragPiece && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{
            left: ghostPos.x - sqSize / 2,
            top: ghostPos.y - sqSize / 2,
            width: sqSize,
            height: sqSize,
          }}
        >
          <PieceComponent piece={dragPiece} size={sqSize} isDragging />
        </div>
      )}
    </div>
  )
}
