import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import type { Color, AiDifficulty } from '@/lib/chessTypes'

type ColorChoice = 'mandalorian' | 'imperial' | 'random'

const DIFFICULTIES: {
  id: AiDifficulty
  name: string
  flavor: string
  lore: string
}[] = [
  {
    id: 'foundling',
    name: 'Foundling',
    flavor: 'A young learner — plays basic moves',
    lore: 'Just beginning the Way. Expect simple, exploratory play.',
  },
  {
    id: 'warrior',
    name: 'Warrior',
    flavor: 'A seasoned fighter — will challenge beginners',
    lore: 'Hardened in countless skirmishes. Punishes loose pieces.',
  },
  {
    id: 'champion',
    name: 'Champion',
    flavor: 'A battle-hardened veteran — strong play',
    lore: 'A veteran of the Great Purge. Rarely blunders.',
  },
  {
    id: 'mand-alor',
    name: "Mand'alor",
    flavor: 'The supreme leader — near-engine strength',
    lore: 'Leader of all Mandalorians. Near-perfect tactical vision.',
  },
]

export interface AiSetupConfig {
  playerColor: Color
  difficulty: AiDifficulty
}

function resolveColor(choice: ColorChoice): Color {
  if (choice === 'mandalorian') return 'w'
  if (choice === 'imperial') return 'b'
  return Math.random() < 0.5 ? 'w' : 'b'
}

export default function AiSetupPage() {
  const navigate = useNavigate()
  const [factionChoice, setFactionChoice] = useState<ColorChoice>('mandalorian')
  const [difficulty, setDifficulty] = useState<AiDifficulty>('warrior')

  const handleStart = () => {
    const playerColor = resolveColor(factionChoice)
    const config: AiSetupConfig = { playerColor, difficulty }
    localStorage.setItem('mando-ai-setup', JSON.stringify(config))
    navigate('/play/ai/game')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-mando-gold mb-2">vs. AI Setup</h1>
      <p className="text-mando-silver/80 mb-8">Choose your faction and challenge level.</p>

      <h2 className="text-lg text-mando-gold mb-3">Your Faction</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        {(
          [
            {
              id: 'mandalorian' as const,
              label: 'Mandalorian',
              desc: 'Play as White — Beskar and honor.',
            },
            {
              id: 'imperial' as const,
              label: 'Imperial',
              desc: 'Play as Black — Order of the Empire.',
            },
            {
              id: 'random' as const,
              label: 'Random',
              desc: 'The Way chooses your color.',
            },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFactionChoice(opt.id)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              factionChoice === opt.id
                ? 'border-mando-gold bg-mando-gold/10'
                : 'border-mando-gold/20 hover:border-mando-gold/40'
            }`}
          >
            <div className="font-semibold text-mando-gold">{opt.label}</div>
            <div className="text-xs text-mando-silver/70 mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>

      <h2 className="text-lg text-mando-gold mb-3">Difficulty</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDifficulty(d.id)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              difficulty === d.id
                ? 'border-mando-gold bg-mando-gold/10'
                : 'border-mando-gold/20 hover:border-mando-gold/40'
            }`}
          >
            <div className="font-semibold text-mando-gold">{d.name}</div>
            <div className="text-sm text-mando-silver italic mt-1">{d.flavor}</div>
            <div className="text-xs text-mando-silver/60 mt-2">{d.lore}</div>
          </button>
        ))}
      </div>

      <Button size="lg" onClick={handleStart}>
        Start Game
      </Button>
    </div>
  )
}
