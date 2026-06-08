import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const features = [
  {
    icon: '◈',
    title: 'Two Factions',
    desc: 'Mandalorian Covert vs. Imperial Remnant. Choose your allegiance.',
  },
  {
    icon: '◉',
    title: 'True Chess Engine',
    desc: 'Full FIDE rules with server-authoritative move validation.',
  },
  {
    icon: '◎',
    title: 'Four AI Levels',
    desc: "From Foundling to Mand'alor — find your challenge.",
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [liveCount, setLiveCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchLobby = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/games/lobby`)
        if (!res.ok) {
          setLiveCount(0)
          return
        }
        const data = (await res.json()) as unknown[]
        setLiveCount(Array.isArray(data) ? data.length : 0)
      } catch {
        setLiveCount(0)
      }
    }

    fetchLobby()
    const id = setInterval(fetchLobby, 30000)
    return () => clearInterval(id)
  }, [])

  const tickerText =
    liveCount === null
      ? '…'
      : liveCount > 0
        ? `${liveCount} game${liveCount === 1 ? '' : 's'} live right now`
        : 'Be the first to start a game'

  return (
    <div className="flex flex-col">
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl"
        >
          <motion.h1
            variants={item}
            className="text-5xl md:text-7xl font-bold text-mando-gold tracking-tight"
          >
            The Way of Chess
          </motion.h1>
          <motion.p
            variants={item}
            className="text-xl text-mando-silver/80 italic mt-3"
          >
            This Is The Way.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          >
            <Button size="lg" onClick={() => navigate('/play/ai')}>
              Play vs AI
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/play/local')}>
              Play Local
            </Button>
          </motion.div>

          <motion.div variants={item} className="mt-4 flex justify-center">
            <Button
              size="lg"
              variant="ghost"
              className="max-w-xs w-full sm:w-auto"
              onClick={() => navigate('/play/online')}
            >
              Play Online
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-space-bg border border-mando-gold/15 rounded-lg p-6 flex flex-col gap-2"
            >
              <span className="text-2xl text-mando-gold" aria-hidden>
                {f.icon}
              </span>
              <h3 className="text-mando-silver font-semibold">{f.title}</h3>
              <p className="text-mando-silver/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="sticky bottom-0 border-t border-mando-gold/15 bg-space-bg/90 backdrop-blur-sm py-2 px-4 text-center text-sm text-mando-silver/70"
        role="status"
        aria-live="polite"
      >
        {tickerText}
      </div>
    </div>
  )
}
