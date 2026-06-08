import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
const NAV_LINKS = [
    { path: '/', label: 'Home' },
    { path: '/play/local', label: 'Play' },
    { path: '/play/online', label: 'Play Online' },
    { path: '/watch', label: 'Watch' },
];
export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);
    useEffect(() => {
        const onClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
    const factionLabel = user?.factionPreference === 'mandalorian'
        ? 'Mandalorian'
        : user?.factionPreference === 'imperial'
            ? 'Imperial'
            : 'Auto';
    const handleLogout = async () => {
        setUserMenuOpen(false);
        setMenuOpen(false);
        await logout();
        navigate('/');
    };
    return (_jsxs("header", { className: "relative bg-space-bg/95 border-b border-mando-gold/20 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 h-14", children: [_jsxs("div", { className: "max-w-6xl mx-auto h-full px-4 flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2 shrink-0", children: [_jsx("span", { className: "text-mando-gold text-xl", "aria-hidden": true, children: "\u2726" }), _jsx("span", { className: "text-mando-gold font-semibold hidden sm:inline", children: "The Way of Chess" })] }), _jsx("nav", { className: "hidden md:flex items-center gap-4 sm:gap-6", children: NAV_LINKS.map(({ path, label }) => (_jsx(Link, { to: path, className: `text-sm transition-colors ${isActive(path) ? 'text-mando-gold' : 'text-mando-silver hover:text-mando-gold'}`, children: label }, path))) }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("button", { type: "button", className: "md:hidden text-mando-gold text-2xl leading-none px-2 py-1", "aria-label": menuOpen ? 'Close menu' : 'Open menu', "aria-expanded": menuOpen, onClick: () => setMenuOpen((o) => !o), children: "\u2261" }), isAuthenticated && user ? (_jsxs("div", { className: "relative", ref: userMenuRef, children: [_jsxs("button", { type: "button", onClick: () => setUserMenuOpen((o) => !o), className: "flex items-center gap-2 text-sm text-mando-silver hover:text-mando-gold transition-colors px-2 py-1", children: [_jsx("span", { className: "hidden sm:inline font-semibold", children: user.username }), _jsxs("span", { className: "text-xs text-mando-gold/80 hidden md:inline", children: ["(", factionLabel, ")"] }), _jsx("span", { className: "text-mando-gold", children: "\u25BE" })] }), userMenuOpen && (_jsxs("div", { className: "absolute right-0 top-full mt-1 w-40 rounded-lg border border-mando-gold/30 bg-space-bg shadow-xl py-1", children: [_jsx(Link, { to: "/profile/me", className: "block px-4 py-2 text-sm text-mando-silver hover:bg-mando-gold/10 hover:text-mando-gold", onClick: () => setUserMenuOpen(false), children: "Profile" }), _jsx("button", { type: "button", className: "w-full text-left px-4 py-2 text-sm text-mando-silver hover:bg-mando-gold/10 hover:text-imperial-red", onClick: handleLogout, children: "Log Out" })] }))] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/login", children: _jsx(Button, { variant: "ghost", size: "sm", children: "Log In" }) }), _jsx(Link, { to: "/register", children: _jsx(Button, { variant: "secondary", size: "sm", children: "Register" }) })] }))] })] }), menuOpen && (_jsx("nav", { className: "md:hidden absolute top-14 left-0 right-0 bg-space-bg/98 border-b border-mando-gold/20 flex flex-col py-2 z-50", "aria-label": "Mobile navigation", children: NAV_LINKS.map(({ path, label }) => (_jsx(Link, { to: path, className: `w-full text-left px-6 py-3 text-sm transition-colors ${isActive(path)
                        ? 'text-mando-gold bg-mando-gold/10'
                        : 'text-mando-silver hover:bg-mando-gold/10 hover:text-mando-gold'}`, onClick: () => setMenuOpen(false), children: label }, path))) }))] }));
}
