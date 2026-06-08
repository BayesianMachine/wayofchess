import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getRankTitle, getRankTier } from '@/lib/chessTypes';
const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-sm',
    md: 'text-sm px-2.5 py-1 rounded',
    lg: 'text-base px-3 py-1.5 rounded',
};
const factionClasses = {
    mandalorian: 'bg-mando-blue/15 text-mando-silver border border-mando-blue/30',
    imperial: 'bg-imperial-red/15 text-imperial-red border border-imperial-red/30',
};
const sigils = {
    mandalorian: '⬡',
    imperial: '⬤',
};
export default function RankBadge({ elo, faction, size = 'md' }) {
    const tier = getRankTier(elo);
    const title = getRankTitle(elo, faction);
    const isTopRank = tier.minElo >= 1800;
    const className = [
        'inline-flex items-center font-medium',
        sizeClasses[size],
        isTopRank
            ? 'bg-mando-gold/20 text-mando-gold border border-mando-gold/50'
            : factionClasses[faction],
    ].join(' ');
    return (_jsxs("span", { className: className, children: [_jsx("span", { className: "text-[0.6em] mr-1 opacity-70", "aria-hidden": true, children: sigils[faction] }), title] }));
}
