import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useEffect, } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [queue, setQueue] = useState([]);
    const [current, setCurrent] = useState(null);
    useEffect(() => {
        if (current === null && queue.length > 0) {
            const [next, ...rest] = queue;
            setCurrent(next);
            setQueue(rest);
        }
    }, [current, queue]);
    const showToast = useCallback((message, duration = 3500) => {
        setQueue((q) => [...q, { id: crypto.randomUUID(), message, duration }]);
    }, []);
    const dismiss = useCallback(() => setCurrent(null), []);
    return (_jsxs(ToastContext.Provider, { value: { showToast }, children: [children, _jsx("div", { style: {
                    position: 'fixed',
                    top: 80,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 9999,
                }, children: _jsx(AnimatePresence, { onExitComplete: dismiss, children: current && (_jsx(ToastMessage, { item: current, onDismiss: () => setCurrent(null) }, current.id)) }) })] }));
}
function ToastMessage({ item, onDismiss, }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, item.duration);
        return () => clearTimeout(t);
    }, [item, onDismiss]);
    return (_jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.25 }, className: "bg-space-bg/95 backdrop-blur-sm border border-mando-gold/40 rounded-md px-5 py-2.5 text-mando-silver italic text-sm shadow-none", children: item.message }));
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
