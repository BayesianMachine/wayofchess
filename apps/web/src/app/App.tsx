import { ErrorBoundary, ToastProvider } from '@/shared/ui'
import AppRoutes from './routes'
import LandscapeGuard from './LandscapeGuard'
import PwaStatus from './PwaStatus'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LandscapeGuard />
        <main className="app-content min-h-screen">
          <AppRoutes />
        </main>
        <PwaStatus />
      </ToastProvider>
    </ErrorBoundary>
  )
}
