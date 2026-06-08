import { useEffect, useCallback } from 'react';
import { socketClient } from '@/lib/socketClient';
export function useGame(options) {
    const { gameId } = options;
    useEffect(() => {
        if (!socketClient.instance)
            return;
        socketClient.emit('game:join', { gameId });
        const unsubs = [
            socketClient.on('move:applied', (e) => options.onMoveApplied(e)),
            socketClient.on('game:end', (e) => options.onGameEnd(e)),
            socketClient.on('draw:offered', (payload) => {
                const { byColor } = payload;
                options.onDrawOffered(byColor);
            }),
            socketClient.on('draw:declined', () => options.onDrawDeclined()),
            socketClient.on('opponent:disconnected', (payload) => {
                const { remainingMs } = payload;
                options.onOpponentDisconnected(remainingMs);
            }),
            socketClient.on('opponent:reconnected', () => options.onOpponentReconnected()),
        ];
        return () => unsubs.forEach((off) => off());
    }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps
    const submitMove = useCallback((from, to, promotion) => {
        socketClient.emit('move:submit', { gameId, from, to, promotion });
    }, [gameId]);
    const resign = useCallback(() => {
        socketClient.emit('resign', { gameId });
    }, [gameId]);
    const offerDraw = useCallback(() => {
        socketClient.emit('draw:offer', { gameId });
    }, [gameId]);
    const respondDraw = useCallback((accept) => {
        socketClient.emit('draw:respond', { gameId, accept });
    }, [gameId]);
    return { submitMove, resign, offerDraw, respondDraw };
}
