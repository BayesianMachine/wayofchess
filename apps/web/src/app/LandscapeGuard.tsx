export default function LandscapeGuard() {
  return (
    <aside className="portrait-guard" role="status" aria-live="polite">
      <div className="portrait-guard__icon" aria-hidden="true">
        ↻
      </div>
      <h1>Rotate to landscape</h1>
      <p>The Way of Chess is designed for landscape play.</p>
    </aside>
  )
}
