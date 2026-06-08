import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '@/components/board/Board';
import MoveList from '@/components/board/MoveList';
import PlayerPanel from '@/components/ui/PlayerPanel';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import GameResultOverlay from '@/components/ui/GameResultOverlay';
import { useToast } from '@/components/ui/Toast';
import { useGameStore } from '@/stores/gameStore';
import { useClockStore } from '@/stores/clockStore';
import { narrativeService } from '@/lib/narrativeService';
function factionForColor(color) {
    return color === 'w' ? 'mandalorian' : 'imperial';
}
function triggerMoveNarrative(move, moverColor) {
    const moverFaction = factionForColor(moverColor);
    for (const ev of narrativeService.detectMoveEvents(move)) {
        narrativeService.trigger(ev, moverFaction);
    }
}
export default function LocalGamePage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [showDrawModal, setShowDrawModal] = useState(false);
    const [clockEnabled, setClockEnabled] = useState(false);
    const { fen, turn, status, result, endReason, moves, selectedSquare, legalMovesFromSelected, lastMove, startLocalGame, selectSquare, submitMove, resign, endGame, reset, } = useGameStore();
    const { whiteMs, blackMs, init, startFor, addIncrement, flagCheck, reset: resetClock } = useClockStore();
    const legalMoves = useMemo(() => selectedSquare
        ? [{ from: selectedSquare, legalTargets: legalMovesFromSelected }]
        : [], [selectedSquare, legalMovesFromSelected]);
    useEffect(() => {
        narrativeService.setToastFn(showToast);
        const enabled = localStorage.getItem('mando-narrative-enabled') !== 'false';
        narrativeService.setEnabled(enabled);
        narrativeService.triggerGameStart('mandalorian', 1000);
        return () => {
            narrativeService.cancelGameStart();
            narrativeService.setToastFn(() => { });
        };
    }, [showToast]);
    useEffect(() => {
        if (status !== 'ended' || !result || !endReason)
            return;
        narrativeService.triggerGameEnd(result, endReason);
    }, [status, result, endReason]);
    useEffect(() => {
        const raw = localStorage.getItem('mando-local-setup');
        const config = raw
            ? JSON.parse(raw)
            : { timeControlBaseSec: 0, timeControlIncSec: 0 };
        const { status: gameStatus } = useGameStore.getState();
        if (gameStatus === 'idle') {
            startLocalGame(config.timeControlBaseSec, config.timeControlIncSec);
        }
        if (config.timeControlBaseSec > 0) {
            setClockEnabled(true);
            init(config.timeControlBaseSec, config.timeControlIncSec);
            if (useGameStore.getState().status === 'active') {
                startFor('w');
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!clockEnabled || status !== 'active')
            return;
        const id = setInterval(() => {
            const flagged = flagCheck();
            if (flagged) {
                const gameResult = flagged === 'w' ? '0-1' : '1-0';
                endGame(gameResult, 'timeout');
            }
        }, 500);
        return () => clearInterval(id);
    }, [clockEnabled, status, flagCheck, endGame]);
    const handleMove = useCallback((from, to, promotion) => {
        const mover = turn;
        const ok = submitMove(from, to, promotion);
        if (!ok)
            return;
        if (clockEnabled && useClockStore.getState().isRunning) {
            addIncrement(mover);
            const nextTurn = mover === 'w' ? 'b' : 'w';
            if (useGameStore.getState().status === 'active') {
                startFor(nextTurn);
            }
        }
        const last = useGameStore.getState().moves.at(-1);
        if (last)
            triggerMoveNarrative(last, mover);
    }, [turn, submitMove, clockEnabled, addIncrement, startFor]);
    const handleNewGame = () => {
        reset();
        resetClock();
        navigate('/play/local');
    };
    if (!fen) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[50vh] text-mando-silver", children: "Loading game..." }));
    }
    return (_jsxs("div", { className: "grid gap-3 max-w-6xl mx-auto px-4 py-4 min-h-[calc(100vh-4rem)] grid-cols-1\r\n        [grid-template-areas:'top'_'board'_'bottom'_'sidebar']\r\n        md:grid-cols-[1fr_min(16rem,28%)]\r\n        md:[grid-template-areas:'top_top'_'board_sidebar'_'bottom_bottom']", children: [_jsx("div", { className: "[grid-area:top]", children: _jsx(PlayerPanel, { username: "Black", faction: "imperial", clockMs: clockEnabled ? blackMs : 0, isActive: turn === 'b' && status === 'active', isTop: true }) }), _jsx("div", { className: "[grid-area:board] flex justify-center", children: _jsx(Board, { fen: fen, orientation: "w", legalMoves: legalMoves, lastMove: lastMove, selectedSquare: selectedSquare, onSquareClick: selectSquare, onMove: handleMove, interactive: status === 'active' }) }), _jsx("div", { className: "[grid-area:bottom]", children: _jsx(PlayerPanel, { username: "White", faction: "mandalorian", clockMs: clockEnabled ? whiteMs : 0, isActive: turn === 'w' && status === 'active', isTop: false }) }), _jsxs("div", { className: "[grid-area:sidebar] flex flex-col min-h-0 md:max-h-[min(70vh,640px)]", children: [_jsx("h3", { className: "text-mando-gold text-sm font-semibold mb-2 shrink-0", children: "Moves" }), _jsx(MoveList, { moves: moves, maxHeight: undefined, className: "flex-1 min-h-[100px] overflow-y-auto" }), status === 'active' && (_jsxs("div", { className: "flex flex-wrap gap-2 justify-center mt-3 pt-2 border-t border-mando-gold/20 shrink-0", children: [_jsx(Button, { variant: "danger", size: "sm", onClick: () => resign('w'), children: "Resign White" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => setShowDrawModal(true), children: "Offer Draw" }), _jsx(Button, { variant: "danger", size: "sm", onClick: () => resign('b'), children: "Resign Black" })] }))] }), _jsxs(Modal, { isOpen: showDrawModal, onClose: () => setShowDrawModal(false), title: "Draw Offer", size: "sm", children: [_jsx("p", { className: "text-mando-silver mb-6", children: "Offer draw to your opponent?" }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { onClick: () => {
                                    endGame('1/2-1/2', 'agreement');
                                    setShowDrawModal(false);
                                }, children: "Accept" }), _jsx(Button, { variant: "ghost", onClick: () => setShowDrawModal(false), children: "Decline" })] })] }), status === 'ended' && result && endReason && (_jsx(GameResultOverlay, { result: result, reason: endReason, onNewGame: handleNewGame, onHome: () => navigate('/') }))] }));
}
