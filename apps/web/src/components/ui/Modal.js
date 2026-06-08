import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const panelRef = useRef(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);
    useEffect(() => {
        if (isOpen)
            panelRef.current?.focus();
    }, [isOpen]);
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", children: [_jsx(motion.div, { className: "fixed inset-0 bg-black/60", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, "aria-hidden": true }), _jsxs(motion.div, { ref: panelRef, role: "dialog", "aria-modal": true, tabIndex: -1, className: `relative z-10 w-full ${sizeClasses[size]} bg-space-bg border border-mando-gold/30 rounded-lg p-6 shadow-xl`, initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, children: [title && _jsx("h2", { className: "text-xl font-semibold text-mando-gold mb-4", children: title }), children] })] })) }));
}
