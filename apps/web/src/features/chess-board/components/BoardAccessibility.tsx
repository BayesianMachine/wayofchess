import type { CSSProperties } from 'react'

interface BoardAccessibilityProps {
  lastMove: { from: string; to: string; san: string } | null
  isCheck: boolean
  isCheckmate: boolean
}

const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function BoardAccessibility({ lastMove, isCheck, isCheckmate }: BoardAccessibilityProps) {
  return (
    <>
      <div aria-live="polite" aria-atomic="true" style={srOnlyStyle}>
        {lastMove && `Move: ${lastMove.san}`}
      </div>
      <div aria-live="assertive" aria-atomic="true" style={srOnlyStyle}>
        {isCheckmate ? 'Checkmate' : isCheck ? 'Check!' : ''}
      </div>
    </>
  )
}
