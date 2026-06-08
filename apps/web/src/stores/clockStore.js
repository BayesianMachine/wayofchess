import { create } from 'zustand';
const initialState = {
    whiteMs: 0,
    blackMs: 0,
    incrementMs: 0,
    activeColor: null,
    isRunning: false,
    _intervalId: null,
};
export const useClockStore = create((set, get) => ({
    ...initialState,
    init: (baseSec, incrementSec) => {
        const { _intervalId } = get();
        if (_intervalId)
            clearInterval(_intervalId);
        const ms = baseSec * 1000;
        set({
            whiteMs: ms,
            blackMs: ms,
            incrementMs: incrementSec * 1000,
            activeColor: null,
            isRunning: false,
            _intervalId: null,
        });
    },
    startFor: (color) => {
        const { _intervalId } = get();
        if (_intervalId)
            clearInterval(_intervalId);
        const intervalId = setInterval(() => {
            const state = get();
            if (!state.activeColor)
                return;
            if (state.activeColor === 'w') {
                const next = Math.max(0, state.whiteMs - 100);
                set({ whiteMs: next });
                if (next <= 0) {
                    clearInterval(get()._intervalId);
                    set({ _intervalId: null, isRunning: false, activeColor: null });
                }
            }
            else {
                const next = Math.max(0, state.blackMs - 100);
                set({ blackMs: next });
                if (next <= 0) {
                    clearInterval(get()._intervalId);
                    set({ _intervalId: null, isRunning: false, activeColor: null });
                }
            }
        }, 100);
        set({ activeColor: color, isRunning: true, _intervalId: intervalId });
    },
    stop: () => {
        const { _intervalId } = get();
        if (_intervalId)
            clearInterval(_intervalId);
        set({ _intervalId: null, activeColor: null, isRunning: false });
    },
    addIncrement: (color) => {
        if (color === 'w') {
            set((s) => ({ whiteMs: s.whiteMs + s.incrementMs }));
        }
        else {
            set((s) => ({ blackMs: s.blackMs + s.incrementMs }));
        }
    },
    setClocks: (whiteMs, blackMs) => {
        set({ whiteMs, blackMs });
    },
    flagCheck: () => {
        const { whiteMs, blackMs } = get();
        if (whiteMs <= 0) {
            get().stop();
            return 'w';
        }
        if (blackMs <= 0) {
            get().stop();
            return 'b';
        }
        return null;
    },
    reset: () => {
        const { _intervalId } = get();
        if (_intervalId)
            clearInterval(_intervalId);
        set({ ...initialState });
    },
}));
