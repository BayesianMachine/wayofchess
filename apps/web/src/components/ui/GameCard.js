import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
function formatElapsed(startedAt) {
    if (!startedAt)
        return '—';
    const totalSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
}
export default function GameCard({ game, onClick }) {
    const [elapsed, setElapsed] = useState(() => formatElapsed(game.startedAt));
    useEffect(() => {
        setElapsed(formatElapsed(game.startedAt));
        if (!game.startedAt)
            return;
        const id = setInterval(() => setElapsed(formatElapsed(game.startedAt)), 1000);
        return () => clearInterval(id);
    }, [game.startedAt]);
    const whiteName = game.whitePlayer?.username ?? 'White';
    const blackName = game.blackPlayer?.username ?? 'Black';
    const spectators = game.spectatorCount ?? 0;
    return (_jsxs("button", { type: "button", onClick: onClick, className: "text-left w-full bg-space-bg border border-mando-gold/20 rounded-lg p-4 cursor-pointer hover:border-mando-gold/50 transition-colors", children: [_jsxs("div", { className: "mb-2", children: [_jsx("span", { className: "text-mando-silver font-semibold", children: whiteName }), _jsx("span", { className: "mx-2 text-mando-silver/40", children: "vs" }), _jsx("span", { className: "text-imperial-gray font-semibold", children: blackName })] }), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "bg-mando-blue/20 text-mando-blue text-xs px-2 py-0.5 rounded", children: game.timeControl.label }), _jsx("span", { className: "text-mando-silver/60 text-xs", children: elapsed })] }), _jsxs("p", { className: "text-mando-silver/50 text-xs", children: [_jsx("span", { "aria-hidden": true, children: "\u25C9" }), " ", spectators, " watching", game.moveCount != null && (_jsxs("span", { className: "ml-2", children: ["\u00B7 ", game.moveCount, " move", game.moveCount === 1 ? '' : 's'] }))] })] }));
}
