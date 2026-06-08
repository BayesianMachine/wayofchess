import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getRankProgress, getNextRank } from '@/lib/chessTypes';
export default function RankProgressBar({ elo, faction, showLabel = false, }) {
    const progress = getRankProgress(elo);
    const nextRank = getNextRank(elo, faction);
    const atMaxRank = progress === 1;
    const fillClass = atMaxRank
        ? 'bg-mando-gold'
        : faction === 'mandalorian'
            ? 'bg-mando-blue'
            : 'bg-imperial-red';
    return (_jsxs("div", { children: [_jsx("div", { className: "w-full h-1.5 bg-white/10 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${fillClass}`, style: { width: `${progress * 100}%` } }) }), showLabel &&
                (atMaxRank ? (_jsx("p", { className: "text-xs text-mando-gold/70 mt-1", children: "Maximum rank achieved" })) : nextRank ? (_jsxs("p", { className: "text-xs text-mando-silver/60 mt-1", children: [nextRank.eloRequired - elo, " ELO to ", nextRank.title] })) : null)] }));
}
