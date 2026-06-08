import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Header from '@/components/ui/Header'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'

const HomePage = lazy(() => import('@/pages/HomePage'))
const LocalSetupPage = lazy(() => import('@/pages/LocalSetupPage'))
const AiSetupPage = lazy(() => import('@/pages/AiSetupPage'))
const LocalGamePage = lazy(() => import('@/pages/LocalGamePage'))
const AiGamePage = lazy(() => import('@/pages/AiGamePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const MatchmakingPage = lazy(() => import('@/pages/MatchmakingPage'))
const OnlineGamePage = lazy(() => import('@/pages/OnlineGamePage'))
const SpectatorLobbyPage = lazy(() => import('@/pages/SpectatorLobbyPage'))
const SpectatorGamePage = lazy(() => import('@/pages/SpectatorGamePage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-14">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/play/local" element={<LocalSetupPage />} />
                <Route path="/play/ai" element={<AiSetupPage />} />
                <Route path="/play/local/game" element={<LocalGamePage />} />
                <Route path="/play/ai/game" element={<AiGamePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/play/online" element={<MatchmakingPage />} />
                <Route path="/play/online/:gameId" element={<OnlineGamePage />} />
                <Route path="/watch" element={<SpectatorLobbyPage />} />
                <Route path="/watch/:gameId" element={<SpectatorGamePage />} />
                <Route path="/profile/me" element={<ProfilePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}
