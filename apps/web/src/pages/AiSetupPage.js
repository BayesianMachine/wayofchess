import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
const DIFFICULTIES = [
    {
        id: 'foundling',
        name: 'Foundling',
        flavor: 'A young learner — plays basic moves',
        lore: 'Just beginning the Way. Expect simple, exploratory play.',
    },
    {
        id: 'warrior',
        name: 'Warrior',
        flavor: 'A seasoned fighter — will challenge beginners',
        lore: 'Hardened in countless skirmishes. Punishes loose pieces.',
    },
    {
        id: 'champion',
        name: 'Champion',
        flavor: 'A battle-hardened veteran — strong play',
        lore: 'A veteran of the Great Purge. Rarely blunders.',
    },
    {
        id: 'mand-alor',
        name: "Mand'alor",
        flavor: 'The supreme leader — near-engine strength',
        lore: 'Leader of all Mandalorians. Near-perfect tactical vision.',
    },
];
function resolveColor(choice) {
    if (choice === 'mandalorian')
        return 'w';
    if (choice === 'imperial')
        return 'b';
    return Math.random() < 0.5 ? 'w' : 'b';
}
export default function AiSetupPage() {
    const navigate = useNavigate();
    const [factionChoice, setFactionChoice] = useState('mandalorian');
    const [difficulty, setDifficulty] = useState('warrior');
    const handleStart = () => {
        const playerColor = resolveColor(factionChoice);
        const config = { playerColor, difficulty };
        localStorage.setItem('mando-ai-setup', JSON.stringify(config));
        navigate('/play/ai/game');
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-6 py-12", children: [_jsx("h1", { className: "text-3xl font-bold text-mando-gold mb-2", children: "vs. AI Setup" }), _jsx("p", { className: "text-mando-silver/80 mb-8", children: "Choose your faction and challenge level." }), _jsx("h2", { className: "text-lg text-mando-gold mb-3", children: "Your Faction" }), _jsx("div", { className: "grid sm:grid-cols-3 gap-3 mb-10", children: [
                    {
                        id: 'mandalorian',
                        label: 'Mandalorian',
                        desc: 'Play as White — Beskar and honor.',
                    },
                    {
                        id: 'imperial',
                        label: 'Imperial',
                        desc: 'Play as Black — Order of the Empire.',
                    },
                    {
                        id: 'random',
                        label: 'Random',
                        desc: 'The Way chooses your color.',
                    },
                ].map((opt) => (_jsxs("button", { type: "button", onClick: () => setFactionChoice(opt.id), className: `p-4 rounded-lg border text-left transition-colors ${factionChoice === opt.id
                        ? 'border-mando-gold bg-mando-gold/10'
                        : 'border-mando-gold/20 hover:border-mando-gold/40'}`, children: [_jsx("div", { className: "font-semibold text-mando-gold", children: opt.label }), _jsx("div", { className: "text-xs text-mando-silver/70 mt-1", children: opt.desc })] }, opt.id))) }), _jsx("h2", { className: "text-lg text-mando-gold mb-3", children: "Difficulty" }), _jsx("div", { className: "grid sm:grid-cols-2 gap-3 mb-10", children: DIFFICULTIES.map((d) => (_jsxs("button", { type: "button", onClick: () => setDifficulty(d.id), className: `p-4 rounded-lg border text-left transition-colors ${difficulty === d.id
                        ? 'border-mando-gold bg-mando-gold/10'
                        : 'border-mando-gold/20 hover:border-mando-gold/40'}`, children: [_jsx("div", { className: "font-semibold text-mando-gold", children: d.name }), _jsx("div", { className: "text-sm text-mando-silver italic mt-1", children: d.flavor }), _jsx("div", { className: "text-xs text-mando-silver/60 mt-2", children: d.lore })] }, d.id))) }), _jsx(Button, { size: "lg", onClick: handleStart, children: "Start Game" })] }));
}
