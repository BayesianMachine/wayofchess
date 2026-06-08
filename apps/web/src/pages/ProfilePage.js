import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RankBadge from '@/components/ui/RankBadge';
import RankProgressBar from '@/components/ui/RankProgressBar';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { getRankTitle, getNextRank, } from '@/lib/chessTypes';
const CATEGORY_LABELS = {
    bullet: 'Bullet',
    blitz: 'Blitz',
    rapid: 'Rapid',
    classical: 'Classical',
};
function resolveFaction(pref) {
    if (pref === 'mandalorian' || pref === 'imperial')
        return pref;
    return 'mandalorian';
}
function timeLabel(baseSec, incSec) {
    const baseMin = baseSec / 60;
    if (Number.isInteger(baseMin))
        return `${baseMin}+${incSec}`;
    return `${baseSec}+${incSec}`;
}
function resultForUser(game, userId) {
    const isWhite = game.whiteUserId === userId;
    const delta = isWhite ? game.whiteEloDelta : game.blackEloDelta;
    if (!game.result)
        return { label: 'D', delta };
    if (game.result === '1/2-1/2')
        return { label: 'D', delta };
    if (game.result === '1-0')
        return { label: isWhite ? 'W' : 'L', delta };
    return { label: isWhite ? 'L' : 'W', delta };
}
export default function ProfilePage() {
    const { username: paramUsername } = useParams();
    const location = useLocation();
    const authUser = useAuthStore((s) => s.user);
    const setAuth = useAuthStore((s) => s.setAuth);
    const accessToken = useAuthStore((s) => s.accessToken);
    const isMe = location.pathname === '/profile/me' || paramUsername === 'me';
    const username = isMe ? authUser?.username : paramUsername;
    const [profile, setProfile] = useState(null);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [factionPref, setFactionPref] = useState('auto');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saveError, setSaveError] = useState(null);
    useEffect(() => {
        if (!username) {
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const [prof, recent] = await Promise.all([
                    apiClient.get(`/api/v1/users/${username}`),
                    apiClient.get(`/api/v1/users/${username}/games`),
                ]);
                setProfile(prof);
                setGames(recent);
                if (isMe) {
                    setFactionPref(prof.factionPreference);
                    setAvatarUrl(prof.avatarUrl ?? '');
                }
            }
            catch {
                setProfile(null);
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, [username, isMe]);
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaveError(null);
        try {
            const body = {
                factionPreference: factionPref,
            };
            if (avatarUrl.trim())
                body.avatarUrl = avatarUrl.trim();
            const updated = await apiClient.patch('/api/v1/users/me', body);
            if (authUser && accessToken) {
                setAuth({
                    ...authUser,
                    avatarUrl: updated.avatarUrl,
                    factionPreference: updated.factionPreference,
                }, accessToken);
            }
            setProfile((p) => p
                ? {
                    ...p,
                    avatarUrl: updated.avatarUrl,
                    factionPreference: updated.factionPreference,
                }
                : p);
            setEditOpen(false);
        }
        catch {
            setSaveError('Failed to update profile');
        }
    };
    if (loading)
        return _jsx(LoadingSpinner, {});
    if (!profile) {
        return (_jsx("div", { className: "text-center py-16 text-mando-silver", children: "User not found." }));
    }
    const totalGames = profile.totalWins + profile.totalDraws + profile.totalLosses;
    const winRate = totalGames > 0 ? Math.round((profile.totalWins / totalGames) * 100) : 0;
    const displayFaction = resolveFaction(profile.factionPreference);
    const profileFaction = profile.factionPreference === 'auto' ? 'mandalorian' : profile.factionPreference;
    const primaryRating = profile.ratings[0]?.rating ?? 1200;
    const highestElo = profile.ratings.length > 0
        ? Math.max(...profile.ratings.map((r) => r.rating))
        : primaryRating;
    const bestRatingEntry = profile.ratings.reduce((best, r) => (!best || r.rating > best.rating ? r : best), null);
    const bestCategoryNext = bestRatingEntry
        ? getNextRank(bestRatingEntry.rating, profileFaction)
        : null;
    const nextRankCallout = bestRatingEntry && bestCategoryNext
        ? `${bestCategoryNext.eloRequired - bestRatingEntry.rating} more ELO in ${CATEGORY_LABELS[bestRatingEntry.category]} to reach ${bestCategoryNext.title}`
        : null;
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-6 py-12", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-mando-gold", children: profile.username }), _jsxs("p", { className: "text-mando-silver/80 mt-1", children: [getRankTitle(primaryRating, displayFaction), " \u00B7 Member since", ' ', new Date(profile.createdAt).toLocaleDateString()] })] }), isMe && (_jsx(Button, { variant: "secondary", onClick: () => setEditOpen(true), children: "Edit Profile" }))] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 rounded-lg border border-mando-gold/20 bg-space-bg/60", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-mando-gold", children: profile.totalWins }), _jsx("div", { className: "text-xs text-mando-silver", children: "Wins" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-mando-silver", children: profile.totalDraws }), _jsx("div", { className: "text-xs text-mando-silver", children: "Draws" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-imperial-red", children: profile.totalLosses }), _jsx("div", { className: "text-xs text-mando-silver", children: "Losses" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-mando-gold", children: [winRate, "%"] }), _jsx("div", { className: "text-xs text-mando-silver", children: "Win Rate" })] })] }), _jsxs("section", { className: "mb-8 p-4 rounded-lg border border-mando-gold/20 bg-space-bg/60", children: [_jsx("h2", { className: "text-sm text-mando-silver/60 uppercase tracking-wider mb-2", children: "Your Rank" }), _jsx(RankBadge, { elo: highestElo, faction: profileFaction, size: "lg" }), _jsx("div", { className: "mt-3", children: _jsx(RankProgressBar, { elo: highestElo, faction: profileFaction, showLabel: true }) }), nextRankCallout && (_jsx("p", { className: "text-sm text-mando-silver/70 mt-1", children: nextRankCallout }))] }), _jsx("h2", { className: "text-lg font-semibold text-mando-gold mb-4", children: "Ratings" }), _jsx("div", { className: "grid sm:grid-cols-2 gap-4 mb-10", children: profile.ratings.map((r) => (_jsxs("div", { className: "p-4 rounded-lg border border-mando-gold/20 bg-space-bg", children: [_jsx("h3", { className: "text-mando-gold font-semibold mb-2", children: CATEGORY_LABELS[r.category] }), _jsx("p", { className: "text-2xl font-bold text-mando-silver", children: r.rating }), _jsxs("p", { className: "text-xs text-mando-silver/70 mt-1", children: [r.gamesPlayed, " games"] }), _jsxs("p", { className: "text-xs text-mando-silver/50 mt-1", children: ["Peak: ", r.peakRating] }), _jsx("div", { className: "mt-2", children: _jsx(RankBadge, { elo: r.rating, faction: profileFaction, size: "sm" }) })] }, r.category))) }), _jsx("h2", { className: "text-lg font-semibold text-mando-gold mb-4", children: "Recent Games" }), games.length === 0 ? (_jsx("p", { className: "text-mando-silver text-sm", children: "No completed games yet." })) : (_jsx("div", { className: "overflow-x-auto rounded-lg border border-mando-gold/20", children: _jsxs("table", { className: "w-full text-sm text-mando-silver", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-mando-gold/20 text-mando-gold text-left", children: [_jsx("th", { className: "p-3", children: "Result" }), _jsx("th", { className: "p-3", children: "Opponent" }), _jsx("th", { className: "p-3", children: "ELO" }), _jsx("th", { className: "p-3", children: "Time" }), _jsx("th", { className: "p-3", children: "Date" })] }) }), _jsx("tbody", { children: games.map((g) => {
                                const { label, delta } = resultForUser(g, profile.id);
                                const isWhite = g.whiteUserId === profile.id;
                                const opponent = isWhite ? g.blackPlayer : g.whitePlayer;
                                const resultClass = label === 'W'
                                    ? 'text-mando-gold'
                                    : label === 'L'
                                        ? 'text-imperial-red'
                                        : 'text-mando-silver';
                                return (_jsxs("tr", { className: "border-b border-mando-gold/10", children: [_jsx("td", { className: `p-3 font-bold ${resultClass}`, children: label }), _jsx("td", { className: "p-3", children: opponent ? (_jsx(Link, { to: `/profile/${opponent.username}`, className: "text-mando-gold hover:underline", children: opponent.username })) : ('—') }), _jsx("td", { className: "p-3", children: delta !== null ? (delta >= 0 ? `+${delta}` : delta) : '—' }), _jsxs("td", { className: "p-3", children: [timeLabel(g.timeControlBaseSec, g.timeControlIncSec), " (", g.category, ")"] }), _jsx("td", { className: "p-3", children: g.endedAt ? new Date(g.endedAt).toLocaleDateString() : '—' })] }, g.id));
                            }) })] }) })), _jsx(Modal, { isOpen: editOpen, onClose: () => setEditOpen(false), title: "Edit Profile", children: _jsxs("form", { onSubmit: handleSaveProfile, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-mando-silver mb-1", children: "Faction preference" }), _jsxs("select", { value: factionPref, onChange: (e) => setFactionPref(e.target.value), className: "w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver", children: [_jsx("option", { value: "auto", children: "Auto" }), _jsx("option", { value: "mandalorian", children: "Mandalorian" }), _jsx("option", { value: "imperial", children: "Imperial" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-mando-silver mb-1", children: "Avatar URL" }), _jsx("input", { type: "url", value: avatarUrl, onChange: (e) => setAvatarUrl(e.target.value), placeholder: "https://...", className: "w-full px-3 py-2 rounded-md bg-space-bg border border-mando-gold/30 text-mando-silver" })] }), saveError && _jsx("p", { className: "text-imperial-red text-sm", children: saveError }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "submit", children: "Save" }), _jsx(Button, { variant: "ghost", type: "button", onClick: () => setEditOpen(false), children: "Cancel" })] })] }) })] }));
}
