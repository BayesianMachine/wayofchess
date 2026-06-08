import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { squareToCoords } from '@/lib/chessTypes';
import PieceComponent from '@/components/board/PieceComponent';
const OPTIONS = [
    'q',
    'r',
    'b',
    'n',
];
export default function PromotionDialog({ square, color, onSelect, onCancel, boardSize, flipped, }) {
    const sqSize = boardSize / 8;
    let { file, rank } = squareToCoords(square);
    if (flipped) {
        file = 7 - file;
        rank = 7 - rank;
    }
    const left = file * sqSize;
    const top = (7 - rank) * sqSize;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/30", onClick: onCancel, "aria-hidden": true }), _jsx("div", { className: "absolute z-50 flex gap-1 p-1 rounded-md bg-space-bg border border-mando-gold/50 shadow-xl", style: { left, top, width: sqSize * 4, minHeight: sqSize }, children: OPTIONS.map((piece) => (_jsx("button", { type: "button", onClick: () => onSelect(piece), className: "flex-1 flex items-center justify-center rounded hover:bg-mando-gold/20", style: { height: sqSize }, "aria-label": `Promote to ${piece}`, children: _jsx(PieceComponent, { piece: { color, type: piece }, size: sqSize * 0.9 }) }, piece))) })] }));
}
