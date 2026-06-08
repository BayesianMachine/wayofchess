import { ErrorBoundary, ToastProvider } from '@/shared/ui'
import AppRoutes from './routes'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <main className="min-h-screen">
          <AppRoutes />
        </main>
      </ToastProvider>
    </ErrorBoundary>
  )
}
