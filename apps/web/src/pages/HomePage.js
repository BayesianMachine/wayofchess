import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};
const features = [
    {
        icon: '◈',
        title: 'Two Factions',
        desc: 'Mandalorian Covert vs. Imperial Remnant. Choose your allegiance.',
    },
    {
        icon: '◉',
        title: 'True Chess Engine',
        desc: 'Full FIDE rules with server-authoritative move validation.',
    },
    {
        icon: '◎',
        title: 'Four AI Levels',
        desc: "From Foundling to Mand'alor — find your challenge.",
    },
];
export default function HomePage() {
    const navigate = useNavigate();
    const [liveCount, setLiveCount] = useState(null);
    useEffect(() => {
        const fetchLobby = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/games/lobby`);
                if (!res.ok) {
                    setLiveCount(0);
                    return;
                }
                const data = (await res.json());
                setLiveCount(Array.isArray(data) ? data.length : 0);
            }
            catch {
                setLiveCount(0);
            }
        };
        fetchLobby();
        const id = setInterval(fetchLobby, 30000);
        return () => clearInterval(id);
    }, []);
    const tickerText = liveCount === null
        ? '…'
        : liveCount > 0
            ? `${liveCount} game${liveCount === 1 ? '' : 's'} live right now`
            : 'Be the first to start a game';
    return (_jsxs("div", { className: "flex flex-col", children: [_jsx("section", { className: "min-h-screen flex flex-col items-center justify-center px-6 text-center", children: _jsxs(motion.div, { variants: container, initial: "hidden", animate: "show", className: "max-w-2xl", children: [_jsx(motion.h1, { variants: item, className: "text-5xl md:text-7xl font-bold text-mando-gold tracking-tight", children: "The Way of Chess" }), _jsx(motion.p, { variants: item, className: "text-xl text-mando-silver/80 italic mt-3", children: "This Is The Way." }), _jsxs(motion.div, { variants: item, className: "flex flex-col sm:flex-row gap-4 justify-center mt-10", children: [_jsx(Button, { size: "lg", onClick: () => navigate('/play/ai'), children: "Play vs AI" }), _jsx(Button, { size: "lg", variant: "secondary", onClick: () => navigate('/play/local'), children: "Play Local" })] }), _jsx(motion.div, { variants: item, className: "mt-4 flex justify-center", children: _jsx(Button, { size: "lg", variant: "ghost", className: "max-w-xs w-full sm:w-auto", onClick: () => navigate('/play/online'), children: "Play Online" }) })] }) }), _jsx("section", { className: "max-w-5xl mx-auto px-6 pb-16 w-full", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: features.map((f) => (_jsxs("div", { className: "bg-space-bg border border-mando-gold/15 rounded-lg p-6 flex flex-col gap-2", children: [_jsx("span", { className: "text-2xl text-mando-gold", "aria-hidden": true, children: f.icon }), _jsx("h3", { className: "text-mando-silver font-semibold", children: f.title }), _jsx("p", { className: "text-mando-silver/60 text-sm", children: f.desc })] }, f.title))) }) }), _jsx("div", { className: "sticky bottom-0 border-t border-mando-gold/15 bg-space-bg/90 backdrop-blur-sm py-2 px-4 text-center text-sm text-mando-silver/70", role: "status", "aria-live": "polite", children: tickerText })] }));
}
