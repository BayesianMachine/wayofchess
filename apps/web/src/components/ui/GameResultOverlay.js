import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
const REASON_LABELS = {
    checkmate: 'by Checkmate',
    stalemate: 'Stalemate',
    timeout: 'on Time',
    resignation: 'by Resignation',
    agreement: 'by Agreement',
    insufficient_material: 'Insufficient Material',
    threefold_repetition: 'Threefold Repetition',
    fifty_move_rule: '50-Move Rule',
    abort: 'Game Aborted',
    unknown: 'Game Ended',
};
function getResultTitle(result) {
    switch (result) {
        case '1-0':
            return { text: 'White Wins', className: 'text-mando-silver' };
        case '0-1':
            return { text: 'Black Wins', className: 'text-imperial-gray' };
        case '1/2-1/2':
            return { text: 'Draw', className: 'text-mando-gold' };
        default:
            return { text: result, className: 'text-mando-silver' };
    }
}
function getNarrativeQuote(result, reason) {
    if (reason === 'stalemate' || reason === 'agreement' || result === '1/2-1/2') {
        return 'The Darksaber changes no hands today.';
    }
    if (result === '1-0') {
        return 'Beskar Victory — the Covert stands.';
    }
    if (result === '0-1') {
        return 'The Empire reigns. Resistance is futile.';
    }
    return 'This Is The Way.';
}
function getReasonSubtitle(reason) {
    return REASON_LABELS[reason] ?? reason;
}
export default function GameResultOverlay({ result, reason, onNewGame, onHome, }) {
    const { text, className } = getResultTitle(result);
    const quote = getNarrativeQuote(result, reason);
    const subtitle = getReasonSubtitle(reason);
    return (_jsx("div", { className: "fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4", children: _jsxs(motion.div, { className: "w-full max-w-md rounded-xl border border-mando-gold/40 bg-space-bg p-8 shadow-2xl text-center", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 300, damping: 24 }, children: [_jsx("p", { className: "text-sm italic text-mando-gold/90 mb-4", children: quote }), _jsx("h2", { className: `text-4xl font-bold mb-2 ${className}`, children: text }), _jsx("p", { className: "text-mando-silver/70 text-sm mb-8", children: subtitle }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx(Button, { onClick: onNewGame, children: "New Game" }), _jsx(Button, { variant: "ghost", onClick: onHome, children: "Home" })] })] }) }));
}
