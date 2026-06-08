export interface TimeControl {
  baseSec: number
  incrementSec: number
  label: string
}

export const TIME_CONTROLS: TimeControl[] = [
  { baseSec: 60, incrementSec: 0, label: 'Bullet 1+0' },
  { baseSec: 120, incrementSec: 1, label: 'Bullet 2+1' },
  { baseSec: 180, incrementSec: 2, label: 'Blitz 3+2' },
  { baseSec: 300, incrementSec: 0, label: 'Blitz 5+0' },
  { baseSec: 300, incrementSec: 3, label: 'Blitz 5+3' },
  { baseSec: 600, incrementSec: 0, label: 'Rapid 10+0' },
  { baseSec: 600, incrementSec: 5, label: 'Rapid 10+5' },
  { baseSec: 1800, incrementSec: 0, label: 'Classical 30+0' },
  { baseSec: 1800, incrementSec: 20, label: 'Classical 30+20' },
]
