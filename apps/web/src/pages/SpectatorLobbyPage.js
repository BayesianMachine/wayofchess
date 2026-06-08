import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import GameCard from '@/components/ui/GameCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/apiClient';
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'bullet', label: 'Bullet' },
    { key: 'blitz', label: 'Blitz' },
    { key: 'rapid', label: 'Rapid' },
    { key: 'classical', label: 'Classical' },
];
export default function SpectatorLobbyPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [allGames, setAllGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchLobby = useCallback(async () => {
        try {
            const data = await apiClient.get('/api/v1/games/lobby');
            setAllGames(data);
        }
        catch {
            setAllGames([]);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        setLoading(true);
        fetchLobby();
        const id = setInterval(fetchLobby, 10000);
        return () => clearInterval(id);
    }, [fetchLobby]);
    const games = useMemo(() => {
        if (filter === 'all')
            return allGames;
        return allGames.filter((g) => g.timeControl.category === filter);
    }, [allGames, filter]);
    return (_jsxs("div", { className: "max-w-6xl mx-auto px-6 py-12", children: [_jsxs("header", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl text-mando-gold font-bold", children: "Live Games" }), _jsx("p", { className: "text-mando-silver/60 mt-1", children: "Watch ongoing battles" }), _jsxs("p", { className: "text-sm text-mando-silver/50 mt-2", children: [games.length, " game", games.length === 1 ? '' : 's', " in progress"] })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-8", children: FILTERS.map((f) => (_jsx("button", { type: "button", onClick: () => setFilter(f.key), className: `px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === f.key
                        ? 'bg-mando-gold/20 border-mando-gold text-mando-gold'
                        : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/50'}`, children: f.label }, f.key))) }), loading ? (_jsx(LoadingSpinner, {})) : games.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-4", children: [_jsx("p", { className: "text-mando-silver/80", children: "No live games right now." }), _jsx(Button, { onClick: () => navigate('/play/local'), children: "Start a Game" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: games.map((game) => (_jsx(GameCard, { game: game, onClick: () => navigate(`/watch/${game.id}`) }, game.id))) }))] }));
}
