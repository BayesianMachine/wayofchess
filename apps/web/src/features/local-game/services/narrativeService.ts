import type { EndReason, GameResult, MoveResult } from '@/shared/types'
import { NARRATIVE_ENABLED_STORAGE_KEY } from '../config/storageKeys'

type NarrativeEvent =
  | 'gameStart'
  | 'check'
  | 'checkmateWin'
  | 'checkmateLose'
  | 'stalemate'
  | 'enPassant'
  | 'promotion'
  | 'castling'
  | 'resignation'
  | 'timeout'

export type Faction = 'mandalorian' | 'imperial'

const MESSAGES: Record<NarrativeEvent, { mandalorian: string; imperial: string }> = {
  gameStart: {
    mandalorian: 'This Is The Way.',
    imperial: 'By order of the Empire, the board is set.',
  },
  check: {
    mandalorian: 'Mudhorn Warning — your king is exposed.',
    imperial: "The Emperor's gaze falls upon your king.",
  },
  checkmateWin: {
    mandalorian: 'Beskar Victory — the Covert stands.',
    imperial: 'The Empire reigns. Resistance is futile.',
  },
  checkmateLose: {
    mandalorian: 'You have been bested. Regroup, Foundling.',
    imperial: 'The Mandalorian falls. Long live the Empire.',
  },
  stalemate: {
    mandalorian: 'The Darksaber changes no hands today.',
    imperial: 'A stalemate — the Empire shows restraint.',
  },
  enPassant: {
    mandalorian: 'A phantom strike — Mandalorian stealth.',
    imperial: 'Imperial efficiency — striking the unseen.',
  },
  promotion: {
    mandalorian: 'A Foundling becomes a Mandalorian warrior.',
    imperial: 'A Stormtrooper rises to Officer rank.',
  },
  castling: {
    mandalorian: 'The Covert regroups — king and rook unite.',
    imperial: 'Imperial formation — the king retreats.',
  },
  resignation: {
    mandalorian: 'A warrior knows when to regroup.',
    imperial: 'The Empire accepts your surrender.',
  },
  timeout: {
    mandalorian: 'Time has run out, Foundling.',
    imperial: 'The Imperial clock waits for no one.',
  },
}

const STALEMATE_REASONS: EndReason[] = [
  'stalemate',
  'insufficient_material',
  'threefold_repetition',
  'fifty_move_rule',
  'agreement',
]

let _showToast: ((msg: string, duration?: number) => void) | null = null
let _enabled = true
let _gameStartTimer: ReturnType<typeof setTimeout> | null = null

function readEnabledFromStorage(): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(NARRATIVE_ENABLED_STORAGE_KEY) !== 'false'
}

_enabled = readEnabledFromStorage()

export const narrativeService = {
  setToastFn(fn: (msg: string, duration?: number) => void) {
    _showToast = fn
  },
  setEnabled(enabled: boolean) {
    _enabled = enabled
  },
  trigger(event: NarrativeEvent, faction: Faction) {
    if (!_enabled || !_showToast) return
    _showToast(MESSAGES[event][faction])
  },
  triggerGameStart(faction: Faction, delay = 1000) {
    if (_gameStartTimer) clearTimeout(_gameStartTimer)
    _gameStartTimer = setTimeout(() => {
      _gameStartTimer = null
      this.trigger('gameStart', faction)
    }, delay)
  },
  cancelGameStart() {
    if (_gameStartTimer) {
      clearTimeout(_gameStartTimer)
      _gameStartTimer = null
    }
  },
  detectMoveEvents(move: MoveResult): NarrativeEvent[] {
    const events: NarrativeEvent[] = []
    const flags = move.flags ?? ''

    if (flags.includes('e')) events.push('enPassant')
    if (flags.includes('k') || flags.includes('q')) events.push('castling')
    if (move.promotion) events.push('promotion')
    if (move.isCheck && !move.isCheckmate) events.push('check')
    return events
  },
  triggerGameEnd(result: GameResult, reason: EndReason) {
    if (!_enabled) return

    if (reason === 'checkmate') {
      if (result === '1-0') {
        this.trigger('checkmateWin', 'mandalorian')
        this.trigger('checkmateLose', 'imperial')
      } else if (result === '0-1') {
        this.trigger('checkmateWin', 'imperial')
        this.trigger('checkmateLose', 'mandalorian')
      }
      return
    }

    if (STALEMATE_REASONS.includes(reason) || result === '1/2-1/2') {
      this.trigger('stalemate', 'mandalorian')
      return
    }

    if (reason === 'timeout') {
      const loser: Faction = result === '1-0' ? 'imperial' : 'mandalorian'
      this.trigger('timeout', loser)
      return
    }

    if (reason === 'resignation') {
      const resigner: Faction = result === '1-0' ? 'imperial' : 'mandalorian'
      this.trigger('resignation', resigner)
    }
  },
}
