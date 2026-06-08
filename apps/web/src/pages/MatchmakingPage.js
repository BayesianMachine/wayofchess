import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { socketClient } from '@/lib/socketClient';
import { TIME_CONTROLS } from '@/lib/chessTypes';
const CATEGORY_LABELS = {
    bullet: 'Bullet',
    blitz: 'Blitz',
    rapid: 'Rapid',
    classical: 'Classical',
};
const CATEGORIES = ['bullet', 'blitz', 'rapid', 'classical'];
export default function MatchmakingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
    const [selectedTc, setSelectedTc] = useState(TIME_CONTROLS[2]);
    const [searching, setSearching] = useState(false);
    const [searchSeconds, setSearchSeconds] = useState(0);
    const [queueSize, setQueueSize] = useState(0);
    const [error, setError] = useState(null);
    const [inviteUrl, setInviteUrl] = useState(null);
    const [challengeLoading, setChallengeLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);
    useEffect(() => {
        if (!accessToken)
            return;
        socketClient.connect(accessToken);
    }, [accessToken]);
    const fetchQueueStatus = useCallback(async () => {
        try {
            const data = await apiClient.get(`/api/v1/matchmaking/status?category=${selectedTc.category}`);
            setQueueSize(data.queueSize);
        }
        catch {
            setQueueSize(0);
        }
    }, [selectedTc.category]);
    useEffect(() => {
        fetchQueueStatus();
        const id = setInterval(fetchQueueStatus, 5000);
        return () => clearInterval(id);
    }, [fetchQueueStatus]);
    useEffect(() => {
        if (!searching) {
            setSearchSeconds(0);
            return;
        }
        const id = setInterval(() => setSearchSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [searching]);
    useEffect(() => {
        if (!searching)
            return;
        const off = socketClient.on('game:start', (payload) => {
            const { gameId } = payload;
            setSearching(false);
            navigate(`/play/online/${gameId}`);
        });
        return () => {
            off();
        };
    }, [searching, navigate]);
    const handleFindGame = async () => {
        setError(null);
        try {
            await apiClient.post('/api/v1/matchmaking/join', {
                timeControlBaseSec: selectedTc.baseSec,
                timeControlIncSec: selectedTc.incrementSec,
                category: selectedTc.category,
            });
            setSearching(true);
        }
        catch {
            setError('Failed to join matchmaking queue');
        }
    };
    const handleCancel = async () => {
        try {
            await apiClient.post('/api/v1/matchmaking/leave');
        }
        catch {
            // ignore
        }
        setSearching(false);
    };
    const handleChallenge = async () => {
        setChallengeLoading(true);
        setError(null);
        try {
            const data = await apiClient.post('/api/v1/games/challenge', {
                timeControlBaseSec: selectedTc.baseSec,
                timeControlIncSec: selectedTc.incrementSec,
                category: selectedTc.category,
            });
            const url = data.inviteUrl.replace(/\/play\/([^/]+)$/, '/play/online/$1');
            setInviteUrl(url);
            setCopied(false);
        }
        catch {
            setError('Failed to create challenge link');
        }
        finally {
            setChallengeLoading(false);
        }
    };
    const copyInvite = async () => {
        if (!inviteUrl)
            return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch {
            setError('Could not copy link');
        }
    };
    if (authLoading || !isAuthenticated) {
        return _jsx(LoadingSpinner, {});
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-6 py-12", children: [_jsx("h1", { className: "text-3xl font-bold text-mando-gold mb-2", children: "Play Online" }), _jsx("p", { className: "text-mando-silver/80 mb-8", children: "Find an opponent or challenge a friend." }), CATEGORIES.map((cat) => {
                const options = TIME_CONTROLS.filter((tc) => tc.category === cat);
                if (options.length === 0)
                    return null;
                return (_jsxs("div", { className: "mb-6", children: [_jsx("h2", { className: "text-sm font-semibold text-mando-gold mb-2", children: CATEGORY_LABELS[cat] }), _jsx("div", { className: "flex flex-wrap gap-2", children: options.map((tc) => {
                                const isActive = selectedTc.label === tc.label;
                                return (_jsx("button", { type: "button", disabled: searching, onClick: () => setSelectedTc(tc), className: `px-4 py-2 rounded-full text-sm border transition-colors ${isActive
                                        ? 'active bg-mando-gold/20 border-mando-gold text-mando-gold'
                                        : 'border-mando-gold/30 text-mando-silver hover:border-mando-gold/50'}`, children: tc.label }, tc.label));
                            }) })] }, cat));
            }), error && _jsx("p", { className: "text-imperial-red text-sm mb-4", children: error }), searching ? (_jsxs("div", { className: "rounded-xl border border-mando-gold/30 bg-space-bg/80 p-8 text-center", children: [_jsx(motion.div, { className: "w-16 h-16 mx-auto mb-6 rounded-full border-2 border-mando-gold", animate: { scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }, transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }), _jsx("p", { className: "text-mando-gold font-semibold mb-2", children: "Finding your opponent..." }), _jsxs("p", { className: "text-mando-silver text-sm mb-1", children: ["Searching for ", searchSeconds, "s"] }), _jsx("p", { className: "text-mando-silver/70 text-sm mb-2", children: selectedTc.label }), _jsxs("p", { className: "text-mando-silver/60 text-sm mb-6", children: ["~", queueSize, " player", queueSize === 1 ? '' : 's', " searching in", ' ', CATEGORY_LABELS[selectedTc.category]] }), _jsx(Button, { variant: "secondary", onClick: handleCancel, children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-sm text-mando-silver mb-6", children: ["~", queueSize, " player", queueSize === 1 ? '' : 's', " searching in", ' ', CATEGORY_LABELS[selectedTc.category]] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Button, { onClick: handleFindGame, children: "Find Game" }), _jsx(Button, { variant: "secondary", onClick: handleChallenge, disabled: challengeLoading, children: "Challenge a friend" })] })] })), _jsxs(Modal, { isOpen: !!inviteUrl, onClose: () => setInviteUrl(null), title: "Challenge Link", size: "md", children: [_jsx("p", { className: "text-mando-silver text-sm mb-4", children: "Share this link with your opponent:" }), _jsx("code", { className: "block text-mando-gold text-sm break-all mb-6 p-3 rounded bg-space-bg border border-mando-gold/20", children: inviteUrl }), _jsxs("div", { className: "flex gap-3 items-center", children: [_jsx(Button, { onClick: copyInvite, children: copied ? 'Copied!' : 'Copy' }), _jsx(Button, { variant: "ghost", onClick: () => setInviteUrl(null), children: "Close" })] })] })] }));
}
