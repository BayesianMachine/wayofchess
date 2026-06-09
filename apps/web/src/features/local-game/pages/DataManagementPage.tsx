import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import {
  clearAllData,
  createBackup,
  importBackup,
} from '../services/gameRepository'
import {
  LOCAL_SETUP_STORAGE_KEY,
  NARRATIVE_ENABLED_STORAGE_KEY,
} from '../config/storageKeys'
import { useClockStore } from '../state/clockStore'
import { useLocalGameStore } from '../state/localGameStore'

export default function DataManagementPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = async () => {
    const backup = await createBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mandalorian-chess-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Backup exported.')
  }

  const handleImport = async (file: File) => {
    try {
      await importBackup(JSON.parse(await file.text()))
      setMessage('Backup imported successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Backup import failed.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    await clearAllData()
    localStorage.removeItem('mando-chess-game')
    localStorage.removeItem(LOCAL_SETUP_STORAGE_KEY)
    localStorage.removeItem(NARRATIVE_ENABLED_STORAGE_KEY)
    useLocalGameStore.getState().reset()
    useClockStore.getState().reset()
    navigate('/')
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-7">
        <h1 className="text-2xl font-bold text-mando-gold">Backup & Data</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
      </header>
      {message && <p role="status" className="mb-5 border border-mando-gold/30 p-3 text-sm text-mando-silver">{message}</p>}
      <section className="space-y-3 border-b border-mando-gold/20 pb-6">
        <h2 className="font-semibold text-mando-silver">Backup transfer</h2>
        <p className="text-sm text-mando-silver/70">Export active play, completed history, clocks, and preferences.</p>
        <div className="flex gap-3">
          <Button onClick={handleExport}>Export Backup</Button>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>Import Backup</Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImport(file)
            }}
          />
        </div>
      </section>
      <section className="pt-6">
        <h2 className="font-semibold text-imperial-red">Reset local data</h2>
        <p className="text-sm text-mando-silver/70 my-2">Deletes the active game, all history, preferences, and legacy storage.</p>
        {confirmReset ? (
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReset}>Confirm Reset</Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset Local Data</Button>
        )}
      </section>
    </main>
  )
}

