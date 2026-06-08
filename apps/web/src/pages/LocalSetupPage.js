import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { TIME_CONTROLS } from '@/lib/chessTypes';
const NO_CLOCK = { timeControlBaseSec: 0, timeControlIncSec: 0 };
export default function LocalSetupPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(NO_CLOCK);
    const selectTimeControl = (baseSec, incrementSec) => {
        setSelected({ timeControlBaseSec: baseSec, timeControlIncSec: incrementSec });
    };
    const handleStart = () => {
        localStorage.setItem('mando-local-setup', JSON.stringify(selected));
        navigate('/play/local/game');
    };
    const isNoClock = selected.timeControlBaseSec === 0 && selected.timeControlIncSec === 0;
    return (_jsxs("div", { className: "max-w-lg mx-auto px-6 py-12", children: [_jsx("h1", { className: "text-3xl font-bold text-mando-gold mb-2", children: "Pass & Play Setup" }), _jsx("p", { className: "text-mando-silver/80 mb-8", children: "Choose a time control for your local match." }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-8", children: [TIME_CONTROLS.map((tc) => {
                        const active = !isNoClock &&
                            selected.timeControlBaseSec === tc.baseSec &&
                            selected.timeControlIncSec === tc.incrementSec;
                        return (_jsx("button", { type: "button", onClick: () => selectTimeControl(tc.baseSec, tc.incrementSec), className: `px-3 py-1.5 rounded-full text-sm border transition-colors ${active
                                ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
                                : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'}`, children: tc.label }, tc.label));
                    }), _jsx("button", { type: "button", onClick: () => setSelected(NO_CLOCK), className: `px-3 py-1.5 rounded-full text-sm border transition-colors ${isNoClock
                            ? 'bg-mando-gold/30 border-mando-gold text-mando-gold'
                            : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/60'}`, children: "No Clock" })] }), _jsx(Button, { size: "lg", onClick: handleStart, children: "Start Game" })] }));
}
