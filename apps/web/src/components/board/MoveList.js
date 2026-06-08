import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export default function MoveList({ moves, maxHeight = 400, className = '' }) {
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [moves.length]);
    const rows = [];
    for (let i = 0; i < moves.length; i += 2) {
        rows.push({
            num: Math.floor(i / 2) + 1,
            white: moves[i].san,
            black: moves[i + 1]?.san,
        });
    }
    const lastIndex = moves.length - 1;
    return (_jsxs("div", { className: `overflow-y-auto font-mono text-sm text-mando-silver p-3 rounded-lg border border-mando-gold/20 bg-space-bg/60 ${className}`, style: maxHeight !== undefined ? { maxHeight } : undefined, children: [rows.length === 0 ? (_jsx("p", { className: "text-mando-silver/50 italic text-xs", children: "No moves yet" })) : (_jsx("div", { className: "space-y-1", children: rows.map((row, rowIdx) => {
                    const whiteMoveIdx = rowIdx * 2;
                    const blackMoveIdx = whiteMoveIdx + 1;
                    return (_jsxs("div", { className: "flex gap-2", children: [_jsxs("span", { className: "text-mando-gold/60 w-6 shrink-0", children: [row.num, "."] }), _jsx("span", { className: whiteMoveIdx === lastIndex ? 'text-mando-gold font-semibold' : '', children: row.white }), row.black && (_jsx("span", { className: blackMoveIdx === lastIndex ? 'text-mando-gold font-semibold' : '', children: row.black }))] }, row.num));
                }) })), _jsx("div", { ref: bottomRef })] }));
}
