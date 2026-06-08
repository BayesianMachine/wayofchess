import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastItem {
  id: string
  message: string
  duration: number
}

const ToastContext = createContext<{
  showToast: (msg: string, duration?: number) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const [current, setCurrent] = useState<ToastItem | null>(null)

  useEffect(() => {
    if (current === null && queue.length > 0) {
      const [next, ...rest] = queue
      setCurrent(next)
      setQueue(rest)
    }
  }, [current, queue])

  const showToast = useCallback((message: string, duration = 3500) => {
    setQueue((q) => [...q, { id: crypto.randomUUID(), message, duration }])
  }, [])

  const dismiss = useCallback(() => setCurrent(null), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <AnimatePresence onExitComplete={dismiss}>
          {current && (
            <ToastMessage
              key={current.id}
              item={current}
              onDismiss={() => setCurrent(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(t)
  }, [item, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="bg-space-bg/95 backdrop-blur-sm border border-mando-gold/40 rounded-md px-5 py-2.5 text-mando-silver italic text-sm shadow-none"
    >
      {item.message}
    </motion.div>
  )
}

export function useToast(): { showToast: (message: string, duration?: number) => void } {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
