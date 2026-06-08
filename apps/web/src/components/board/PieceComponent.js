import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion } from 'framer-motion';
import MandoK from '@/assets/pieces/characters/mando-king.svg';
import MandoQ from '@/assets/pieces/characters/mando-queen.svg';
import MandoB from '@/assets/pieces/characters/mando-bishop.svg';
import MandoN from '@/assets/pieces/characters/mando-knight.svg';
import MandoR from '@/assets/pieces/characters/mando-rook.svg';
import MandoP from '@/assets/pieces/characters/mando-pawn.svg';
import ImpK from '@/assets/pieces/characters/imperial-king.svg';
import ImpQ from '@/assets/pieces/characters/imperial-queen.svg';
import ImpB from '@/assets/pieces/characters/imperial-bishop.svg';
import ImpN from '@/assets/pieces/characters/imperial-knight.svg';
import ImpR from '@/assets/pieces/characters/imperial-rook.svg';
import ImpP from '@/assets/pieces/characters/imperial-pawn.svg';
const PIECE_MAP = {
    'w-k': MandoK,
    'w-q': MandoQ,
    'w-b': MandoB,
    'w-n': MandoN,
    'w-r': MandoR,
    'w-p': MandoP,
    'b-k': ImpK,
    'b-q': ImpQ,
    'b-b': ImpB,
    'b-n': ImpN,
    'b-r': ImpR,
    'b-p': ImpP,
};
const WHITE_SYMBOLS = {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
};
const BLACK_SYMBOLS = {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
};
const CHARACTER_LABELS = {
    'w-k': 'DIN',
    'w-q': 'GROGU',
    'w-b': 'ARMORER',
    'w-n': 'BO',
    'w-r': 'PAZ',
    'w-p': 'MANDO',
    'b-k': 'VADER',
    'b-q': 'GIDEON',
    'b-b': 'TROOPER',
    'b-n': 'SCOUT',
    'b-r': 'DARK',
    'b-p': 'IMP',
};
function PieceContent({ piece, size }) {
    const key = `${piece.color}-${piece.type}`;
    const imageUrl = PIECE_MAP[key];
    const iconSize = size * 1.02;
    const label = CHARACTER_LABELS[key];
    if (imageUrl) {
        return (_jsxs("div", { className: `relative flex items-center justify-center rounded-full ${piece.color === 'w'
                ? 'bg-slate-950/85 ring-2 ring-mando-gold shadow-[0_0_10px_rgba(201,154,46,0.45)]'
                : 'bg-black/90 ring-2 ring-red-500 shadow-[0_0_10px_rgba(192,57,43,0.45)]'}`, style: { width: iconSize, height: iconSize }, children: [_jsx("img", { src: imageUrl, alt: "", draggable: false, className: "pointer-events-none block object-contain", style: { width: iconSize * 0.9, height: iconSize * 0.9 } }), _jsx("span", { className: `absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded px-1 font-bold leading-none ${piece.color === 'w'
                        ? 'bg-mando-gold text-slate-950'
                        : 'bg-red-600 text-white'}`, style: { fontSize: Math.max(7, size * 0.13) }, children: label })] }));
    }
    const symbol = piece.color === 'w' ? WHITE_SYMBOLS[piece.type] : BLACK_SYMBOLS[piece.type];
    return (_jsx("span", { className: piece.color === 'w'
            ? 'text-mando-silver drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            : 'text-imperial-gray', style: { fontSize: size * 0.75, lineHeight: 1 }, children: symbol }));
}
export default function PieceComponent({ piece, size, isDragging = false, isCapturing = false, }) {
    return (_jsx("div", { className: `flex items-center justify-center select-none ${isDragging ? 'opacity-30' : ''}`, style: { width: size, height: size }, children: _jsx(AnimatePresence, { children: !isCapturing && (_jsx(motion.div, { className: "flex items-center justify-center", exit: { scale: 0, opacity: 0 }, transition: { duration: 0.15 }, children: _jsx(PieceContent, { piece: piece, size: size }) }, `${piece.color}-${piece.type}`)) }) }));
}
