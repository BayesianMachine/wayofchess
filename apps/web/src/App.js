import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Header from '@/components/ui/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
const HomePage = lazy(() => import('@/pages/HomePage'));
const LocalSetupPage = lazy(() => import('@/pages/LocalSetupPage'));
const AiSetupPage = lazy(() => import('@/pages/AiSetupPage'));
const LocalGamePage = lazy(() => import('@/pages/LocalGamePage'));
const AiGamePage = lazy(() => import('@/pages/AiGamePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const MatchmakingPage = lazy(() => import('@/pages/MatchmakingPage'));
const OnlineGamePage = lazy(() => import('@/pages/OnlineGamePage'));
const SpectatorLobbyPage = lazy(() => import('@/pages/SpectatorLobbyPage'));
const SpectatorGamePage = lazy(() => import('@/pages/SpectatorGamePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(ToastProvider, { children: _jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-14", children: _jsx(Suspense, { fallback: _jsx(LoadingSpinner, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/play/local", element: _jsx(LocalSetupPage, {}) }), _jsx(Route, { path: "/play/ai", element: _jsx(AiSetupPage, {}) }), _jsx(Route, { path: "/play/local/game", element: _jsx(LocalGamePage, {}) }), _jsx(Route, { path: "/play/ai/game", element: _jsx(AiGamePage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/play/online", element: _jsx(MatchmakingPage, {}) }), _jsx(Route, { path: "/play/online/:gameId", element: _jsx(OnlineGamePage, {}) }), _jsx(Route, { path: "/watch", element: _jsx(SpectatorLobbyPage, {}) }), _jsx(Route, { path: "/watch/:gameId", element: _jsx(SpectatorGamePage, {}) }), _jsx(Route, { path: "/profile/me", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/profile/:username", element: _jsx(ProfilePage, {}) })] }) }) })] }) }) }));
}
