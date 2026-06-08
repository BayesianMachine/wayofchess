import { motion } from 'framer-motion'

interface EvalBarProps {
  whiteFraction: number
  height?: number
}

export default function EvalBar({ whiteFraction, height = 200 }: EvalBarProps) {
  const clamped = Math.max(0, Math.min(1, whiteFraction))
  const blackPct = (1 - clamped) * 100

  return (
    <div
      className="relative flex flex-col w-2 h-full rounded-sm overflow-hidden border border-mando-gold/20"
      style={{ height }}
    >
      <span className="absolute top-0 left-0 right-0 z-10 text-center text-[9px] text-imperial-red/70 font-mono leading-none pt-0.5">
        B
      </span>
      <div className="flex flex-col flex-1 min-h-0 mt-3 mb-3">
        <motion.div
          className="w-full bg-imperial-gray shrink-0 transition-all duration-700"
          animate={{ height: `${blackPct}%` }}
          transition={{ duration: 0.7 }}
        />
        <div className="w-full flex-1 min-h-[3px] bg-mando-silver transition-all duration-700" />
      </div>
      <span className="absolute bottom-0 left-0 right-0 z-10 text-center text-[9px] text-mando-silver/70 font-mono leading-none pb-0.5">
        W
      </span>
    </div>
  )
}
