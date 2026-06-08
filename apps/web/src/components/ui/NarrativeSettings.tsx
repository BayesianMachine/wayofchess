import { useState } from 'react'
import { narrativeService } from '@/lib/narrativeService'

const STORAGE_KEY = 'mando-narrative-enabled'

function readEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

export default function NarrativeSettings() {
  const [enabled, setEnabled] = useState(readEnabled)

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    narrativeService.setEnabled(next)
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-mando-silver text-sm">Narrative Commentary</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-mando-gold/60' : 'bg-space-bg border border-mando-gold/30'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
            enabled ? 'translate-x-5 bg-mando-gold' : 'translate-x-0 bg-mando-silver/50'
          }`}
        />
      </button>
    </div>
  )
}
