import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { squareToCoords } from '@/lib/chessTypes';
function squarePosition(sq, size, flipped) {
    const sqSize = size / 8;
    let { file, rank } = squareToCoords(sq);
    if (flipped) {
        file = 7 - file;
        rank = 7 - rank;
    }
    return { left: file * sqSize, top: (7 - rank) * sqSize, sqSize };
}
export default function SquareHighlight({ size, flipped, selectedSquare, legalSquares, lastMove, checkSquare, }) {
    const highlights = [];
    if (selectedSquare)
        highlights.push({ sq: selectedSquare, type: 'selected' });
    for (const sq of legalSquares)
        highlights.push({ sq, type: 'legal' });
    if (lastMove) {
        highlights.push({ sq: lastMove.from, type: 'last' });
        highlights.push({ sq: lastMove.to, type: 'last' });
    }
    if (checkSquare)
        highlights.push({ sq: checkSquare, type: 'check' });
    const bgClass = {
        selected: 'bg-highlight-selected',
        legal: 'bg-highlight-legal',
        last: 'bg-highlight-lastMove',
        check: 'bg-highlight-check',
    };
    return (_jsx("div", { className: "absolute inset-0 pointer-events-none", style: { width: size, height: size }, children: highlights.map(({ sq, type }, i) => {
            const { left, top, sqSize } = squarePosition(sq, size, flipped);
            if (type === 'legal') {
                return (_jsx("div", { className: "absolute flex items-center justify-center", style: { left, top, width: sqSize, height: sqSize }, children: _jsx("div", { className: "w-3 h-3 rounded-full bg-highlight-legal" }) }, `${sq}-${type}-${i}`));
            }
            if (type === 'last') {
                return (_jsx(motion.div, { className: `absolute ${bgClass[type]}`, style: { left, top, width: sqSize, height: sqSize }, initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }, `${sq}-${type}-${i}`));
            }
            return (_jsx("div", { className: `absolute ${bgClass[type]}`, style: { left, top, width: sqSize, height: sqSize } }, `${sq}-${type}-${i}`));
        }) }));
}
