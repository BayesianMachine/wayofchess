import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, coordsToSquare, } from '@/lib/chessTypes';
const initialState = {
    mode: null,
    chess: null,
    fen: '',
    turn: 'w',
    status: 'idle',
    result: null,
    endReason: null,
    moves: [],
    selectedSquare: null,
    legalMovesFromSelected: [],
    lastMove: null,
    isCheck: false,
    playerColor: 'w',
    aiDifficulty: null,
    aiThinking: false,
};
function detectGameEnd(game) {
    const end = game.getGameEndResult();
    if (!end)
        return null;
    return { result: end.result, reason: end.reason };
}
function applyMoveToState(game, moveResult, set, get) {
    const state = game.getState();
    const end = detectGameEnd(game);
    set({
        fen: state.fen,
        turn: state.turn,
        moves: [...get().moves, moveResult],
        lastMove: { from: moveResult.from, to: moveResult.to },
        isCheck: state.isCheck,
        selectedSquare: null,
        legalMovesFromSelected: [],
    });
    if (end) {
        get().endGame(end.result, end.reason);
    }
}
export const useGameStore = create()(persist((set, get) => ({
    ...initialState,
    initFromFen: (fen) => {
        set({ chess: new Game(fen) });
    },
    startLocalGame: (_timeControlBaseSec, _timeControlIncSec) => {
        const chess = new Game();
        const state = chess.getState();
        set({
            ...initialState,
            mode: 'local',
            chess,
            fen: state.fen,
            turn: state.turn,
            status: 'active',
            playerColor: 'w',
        });
    },
    startAiGame: (playerColor, difficulty) => {
        const chess = new Game();
        const state = chess.getState();
        set({
            ...initialState,
            mode: 'ai',
            chess,
            fen: state.fen,
            turn: state.turn,
            status: 'active',
            playerColor,
            aiDifficulty: difficulty,
        });
    },
    selectSquare: (square) => {
        const { chess, selectedSquare, status } = get();
        if (!chess || status !== 'active')
            return;
        if (selectedSquare === square) {
            set({ selectedSquare: null, legalMovesFromSelected: [] });
            return;
        }
        if (selectedSquare) {
            const moved = get().submitMove(selectedSquare, square);
            if (!moved) {
                const piece = chess.getPiece(square);
                const turn = chess.getState().turn;
                if (piece && piece.color === turn) {
                    const legal = chess.getLegalMovesFrom(square);
                    set({ selectedSquare: square, legalMovesFromSelected: legal });
                }
                else {
                    set({ selectedSquare: null, legalMovesFromSelected: [] });
                }
            }
            return;
        }
        const piece = chess.getPiece(square);
        const turn = chess.getState().turn;
        if (piece && piece.color === turn) {
            const legal = chess.getLegalMovesFrom(square);
            set({ selectedSquare: square, legalMovesFromSelected: legal });
        }
    },
    submitMove: (from, to, promotion) => {
        const { chess, status } = get();
        if (!chess || status !== 'active')
            return false;
        const moveResult = chess.move(from, to, promotion);
        if (!moveResult)
            return false;
        applyMoveToState(chess, moveResult, set, get);
        return true;
    },
    applyAiMove: (from, to, promotion) => {
        get().submitMove(from, to, promotion);
    },
    endGame: (result, reason) => {
        set({
            status: 'ended',
            result,
            endReason: reason,
            selectedSquare: null,
            legalMovesFromSelected: [],
        });
    },
    resign: (color) => {
        const result = color === 'w' ? '0-1' : '1-0';
        get().endGame(result, 'resignation');
    },
    reset: () => {
        set({ ...initialState, chess: null });
    },
    setAiThinking: (thinking) => set({ aiThinking: thinking }),
}), {
    name: 'mando-chess-game',
    partialize: (state) => {
        if (state.status !== 'active')
            return {};
        return {
            mode: state.mode,
            fen: state.fen,
            turn: state.turn,
            status: state.status,
            result: state.result,
            endReason: state.endReason,
            moves: state.moves,
            playerColor: state.playerColor,
            aiDifficulty: state.aiDifficulty,
        };
    },
    merge: (persisted, current) => {
        const p = persisted;
        if (!p || !p.fen || p.status !== 'active') {
            return current;
        }
        return {
            ...current,
            ...p,
            chess: null,
            selectedSquare: null,
            legalMovesFromSelected: [],
            lastMove: null,
            isCheck: false,
            aiThinking: false,
        };
    },
    onRehydrateStorage: () => (state) => {
        if (state && state.fen && state.status === 'active') {
            state.chess = new Game(state.fen);
        }
    },
}));
export function getLegalMovesForBoard(game) {
    if (!game)
        return [];
    const byFrom = new Map();
    for (const m of game.getState().legalMoves) {
        const targets = byFrom.get(m.from) ?? [];
        targets.push(m.to);
        byFrom.set(m.from, targets);
    }
    return Array.from(byFrom.entries()).map(([from, legalTargets]) => ({ from, legalTargets }));
}
export function findKingSquare(game, color) {
    const board = game.getBoard();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const cell = board[r][f];
            if (cell && cell.type === 'k' && cell.color === color) {
                return coordsToSquare(f, 7 - r);
            }
        }
    }
    return null;
}
