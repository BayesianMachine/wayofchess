import { ErrorBoundary, ToastProvider } from '@/shared/ui'
import AppRoutes from './routes'
import PwaStatus from './PwaStatus'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <main className="min-h-screen">
          <AppRoutes />
        </main>
        <PwaStatus />
      </ToastProvider>
    </ErrorBoundary>
  )
}
