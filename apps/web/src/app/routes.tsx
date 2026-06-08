import { Navigate, Route, Routes } from 'react-router-dom'
import { LocalGamePage, LocalSetupPage } from '@/features/local-game'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LocalSetupPage />} />
      <Route path="/game" element={<LocalGamePage />} />
      <Route path="/play/local" element={<Navigate to="/" replace />} />
      <Route path="/play/local/game" element={<Navigate to="/game" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
