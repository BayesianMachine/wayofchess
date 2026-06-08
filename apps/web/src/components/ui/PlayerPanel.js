import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import RankBadge from '@/components/ui/RankBadge';
function formatClock(ms) {
    if (ms <= 0)
        return '0:00';
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
function clockDisplayClasses(clockMs) {
    const base = 'font-mono text-xl tabular-nums';
    if (clockMs < 10000)
        return `${base} text-imperial-red animate-clock-danger`;
    if (clockMs < 30000)
        return `${base} text-white text-yellow-400`;
    return `${base} text-white`;
}
export default function PlayerPanel({ username, faction, clockMs, isActive, isTop, thinking = false, elo, }) {
    const factionLabel = faction === 'mandalorian' ? 'Mandalorian' : 'Imperial';
    return (_jsxs("div", { className: `flex items-center gap-4 px-4 py-2 rounded-lg border border-mando-gold/20 bg-space-bg/80 ${isTop ? 'flex-row' : 'flex-row-reverse'}`, children: [_jsxs("div", { className: `flex-1 ${isTop ? 'text-left' : 'text-right'}`, children: [_jsx("div", { className: "font-semibold text-mando-silver", children: username }), elo !== undefined && (_jsx("div", { className: `mt-1 ${isTop ? '' : 'flex justify-end'}`, children: _jsx(RankBadge, { elo: elo, faction: faction, size: "sm" }) })), _jsx("div", { className: "text-xs text-mando-gold/80", children: factionLabel })] }), thinking ? (_jsx("div", { className: "px-4 py-2 text-xl text-mando-gold animate-pulse", children: "\u00B7\u00B7\u00B7" })) : (_jsx("div", { className: `px-4 py-2 rounded-md bg-imperial-gray/40 ${isActive ? 'animate-clock-pulse ring-1 ring-mando-gold/40' : ''}`, children: _jsx("span", { className: clockDisplayClasses(clockMs), children: formatClock(clockMs) }) }))] }));
}
