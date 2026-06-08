import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { TIME_CONTROLS } from '@/lib/chessTypes'

export interface LocalSetupConfig {
  timeControlBaseSec: number
  timeControlIncSec: number
}

const NO_CLOCK: LocalSetupConfig = { timeControlBaseSec: 0, timeControlIncSec: 0 }

export default function LocalSetupPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<LocalSetupConfig>(NO_CLOCK)

  const selectTimeControl = (baseSec: number, incrementSec: number) => {
    setSelected({ timeControlBaseSec: baseSec, timeControlIncSec: incrementSec })
  }

  const handleStart = () => {
    localStorage.setItem('mando-local-setup', JSON.stringify(selected))
    navigate('/play/local/game')
  }

  const isNoClock =
    selected.timeControlBaseSec === 0 && selected.timeControlIncSec === 0

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-mando-gold mb-2">Pass & Play Setup</h1>
      <p className="text-mando-silver/80 mb-8">Choose a time control for your local match.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {TIME_CONTROLS.map((tc) => {
          const active =
            !isNoClock &&
            selected.timeControlBaseSec === tc.baseSec &&
            selected.timeControlIncSec === tc.incrementSec
          return (
            <button
              key={tc.label}
              type="button"
              onClick={() => selectTimeControl(tc.baseSec, tc.incrementSec)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
                  : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'
              }`}
            >
              {tc.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setSelected(NO_CLOCK)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            isNoClock
              ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
              : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'
          }`}
        >
          No Clock
        </button>
      </div>

      <Button size="lg" onClick={handleStart}>
        Start Game
      </Button>
    </div>
  )
}
