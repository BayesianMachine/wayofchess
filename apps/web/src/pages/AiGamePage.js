import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '@/components/board/Board';
import MoveList from '@/components/board/MoveList';
import PlayerPanel from '@/components/ui/PlayerPanel';
import Button from '@/components/ui/Button';
import GameResultOverlay from '@/components/ui/GameResultOverlay';
import { useToast } from '@/components/ui/Toast';
import { useGameStore } from '@/stores/gameStore';
import { narrativeService } from '@/lib/narrativeService';
import { stockfishWorker } from '@/lib/stockfishWorker';
const DIFFICULTY_LABELS = {
    foundling: 'Foundling',
    warrior: 'Warrior',
    champion: 'Champion',
    'mand-alor': "Mand'alor",
};
function factionForColor(color) {
    return color === 'w' ? 'mandalorian' : 'imperial';
}
function triggerMoveNarrative(move, moverColor) {
    const moverFaction = factionForColor(moverColor);
    for (const ev of narrativeService.detectMoveEvents(move)) {
        narrativeService.trigger(ev, moverFaction);
    }
}
export default function AiGamePage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { fen, turn, status, result, endReason, moves, selectedSquare, legalMovesFromSelected, lastMove, playerColor, aiDifficulty, aiThinking, startAiGame, selectSquare, submitMove, resign, reset, setAiThinking, applyAiMove, } = useGameStore();
    const aiColor = playerColor === 'w' ? 'b' : 'w';
    const legalMoves = useMemo(() => selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [], [selectedSquare, legalMovesFromSelected]);
    const playerFaction = playerColor === 'w' ? 'mandalorian' : 'imperial';
    useEffect(() => {
        narrativeService.setToastFn(showToast);
        const enabled = localStorage.getItem('mando-narrative-enabled') !== 'false';
        narrativeService.setEnabled(enabled);
        const raw = localStorage.getItem('mando-ai-setup');
        if (!raw) {
            navigate('/play/ai');
            return;
        }
        const cfg = JSON.parse(raw);
        const startFaction = factionForColor(cfg.playerColor);
        narrativeService.triggerGameStart(startFaction, 1000);
        if (useGameStore.getState().status === 'idle') {
            startAiGame(cfg.playerColor, cfg.difficulty);
        }
        return () => {
            narrativeService.cancelGameStart();
            narrativeService.setToastFn(() => { });
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (status !== 'ended' || !result || !endReason)
            return;
        narrativeService.triggerGameEnd(result, endReason);
    }, [status, result, endReason]);
    useEffect(() => {
        if (status !== 'active')
            return;
        if (turn !== aiColor)
            return;
        if (aiThinking)
            return;
        setAiThinking(true);
        stockfishWorker
            .getBestMove(fen, aiDifficulty ?? 'warrior')
            .then((uciMove) => {
            if (!uciMove || useGameStore.getState().status !== 'active')
                return;
            const from = uciMove.slice(0, 2);
            const to = uciMove.slice(2, 4);
            const promotion = uciMove.length === 5 ? uciMove[4] : undefined;
            applyAiMove(from, to, promotion);
            const last = useGameStore.getState().moves.at(-1);
            if (last)
                triggerMoveNarrative(last, aiColor);
        })
            .finally(() => {
            setAiThinking(false);
        });
    }, [turn, status, aiThinking, fen, aiColor, aiDifficulty, setAiThinking, applyAiMove]);
    const handleMove = useCallback((from, to, promotion) => {
        if (turn !== playerColor)
            return;
        const ok = submitMove(from, to, promotion);
        if (!ok)
            return;
        const last = useGameStore.getState().moves.at(-1);
        if (last)
            triggerMoveNarrative(last, playerColor);
    }, [turn, playerColor, submitMove]);
    const handleSquareClick = (sq) => {
        if (turn !== playerColor || status !== 'active')
            return;
        selectSquare(sq);
    };
    const aiFaction = playerColor === 'w' ? 'imperial' : 'mandalorian';
    const diffLabel = aiDifficulty ? DIFFICULTY_LABELS[aiDifficulty] : 'Warrior';
    if (!fen) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[50vh] text-mando-silver", children: "Loading game..." }));
    }
    return (_jsxs("div", { className: "grid gap-3 max-w-6xl mx-auto px-4 py-4 min-h-[calc(100vh-4rem)] grid-cols-1\r\n        [grid-template-areas:'top'_'board'_'bottom'_'sidebar']\r\n        md:grid-cols-[1fr_min(16rem,28%)]\r\n        md:[grid-template-areas:'top_top'_'board_sidebar'_'bottom_bottom']", children: [_jsx("div", { className: "[grid-area:top]", children: _jsx(PlayerPanel, { username: `${diffLabel} AI`, faction: aiFaction, clockMs: 0, isActive: turn === aiColor && status === 'active', isTop: true, thinking: aiThinking }) }), _jsx("div", { className: "[grid-area:board] flex justify-center", children: _jsx(Board, { fen: fen, orientation: playerColor, legalMoves: legalMoves, lastMove: lastMove, selectedSquare: selectedSquare, onSquareClick: handleSquareClick, onMove: handleMove, interactive: turn === playerColor && status === 'active' }) }), _jsx("div", { className: "[grid-area:bottom]", children: _jsx(PlayerPanel, { username: "You", faction: playerFaction, clockMs: 0, isActive: turn === playerColor && status === 'active', isTop: false }) }), _jsxs("div", { className: "[grid-area:sidebar] flex flex-col min-h-0 md:max-h-[min(70vh,640px)]", children: [_jsx("h3", { className: "text-mando-gold text-sm font-semibold mb-2 shrink-0", children: "Moves" }), _jsx(MoveList, { moves: moves, maxHeight: undefined, className: "flex-1 min-h-[100px] overflow-y-auto" }), status === 'active' && (_jsx("div", { className: "flex justify-center mt-3 pt-2 border-t border-mando-gold/20 shrink-0", children: _jsx(Button, { variant: "danger", size: "sm", onClick: () => resign(playerColor), children: "Resign" }) }))] }), status === 'ended' && result && endReason && (_jsx(GameResultOverlay, { result: result, reason: endReason, onNewGame: () => {
                    reset();
                    navigate('/play/ai');
                }, onHome: () => navigate('/') }))] }));
}
