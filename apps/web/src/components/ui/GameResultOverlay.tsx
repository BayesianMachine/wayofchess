import { motion } from 'framer-motion'
import type { GameResult, EndReason } from '@/lib/chessTypes'
import Button from '@/components/ui/Button'

interface GameResultOverlayProps {
  result: GameResult
  reason: EndReason
  onNewGame: () => void
  onHome: () => void
}

const REASON_LABELS: Record<EndReason, string> = {
  checkmate: 'by Checkmate',
  stalemate: 'Stalemate',
  timeout: 'on Time',
  resignation: 'by Resignation',
  agreement: 'by Agreement',
  insufficient_material: 'Insufficient Material',
  threefold_repetition: 'Threefold Repetition',
  fifty_move_rule: '50-Move Rule',
  abort: 'Game Aborted',
  unknown: 'Game Ended',
}

function getResultTitle(result: GameResult): { text: string; className: string } {
  switch (result) {
    case '1-0':
      return { text: 'White Wins', className: 'text-mando-silver' }
    case '0-1':
      return { text: 'Black Wins', className: 'text-imperial-gray' }
    case '1/2-1/2':
      return { text: 'Draw', className: 'text-mando-gold' }
    default:
      return { text: result, className: 'text-mando-silver' }
  }
}

function getNarrativeQuote(result: GameResult, reason: EndReason): string {
  if (reason === 'stalemate' || reason === 'agreement' || result === '1/2-1/2') {
    return 'The Darksaber changes no hands today.'
  }
  if (result === '1-0') {
    return 'Beskar Victory — the Covert stands.'
  }
  if (result === '0-1') {
    return 'The Empire reigns. Resistance is futile.'
  }
  return 'This Is The Way.'
}

function getReasonSubtitle(reason: EndReason): string {
  return REASON_LABELS[reason] ?? reason
}

export default function GameResultOverlay({
  result,
  reason,
  onNewGame,
  onHome,
}: GameResultOverlayProps) {
  const { text, className } = getResultTitle(result)
  const quote = getNarrativeQuote(result, reason)
  const subtitle = getReasonSubtitle(reason)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <motion.div
        className="w-full max-w-md rounded-xl border border-mando-gold/40 bg-space-bg p-8 shadow-2xl text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <p className="text-sm italic text-mando-gold/90 mb-4">{quote}</p>
        <h2 className={`text-4xl font-bold mb-2 ${className}`}>{text}</h2>
        <p className="text-mando-silver/70 text-sm mb-8">{subtitle}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onNewGame}>New Game</Button>
          <Button variant="ghost" onClick={onHome}>
            Home
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
