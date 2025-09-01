import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, Navigate, Link, useLocation } from 'react-router-dom';
import Landing from '../views/Landing';
import Dashboard from '../views/Dashboard';
import SwipeDeck from '../views/SwipeDeck';
import Onboarding from '../views/Onboarding';
import DatingProfile from '../views/DatingProfile';
import Matches from '../views/Matches';
import MarketList from '../views/MarketList';
import MarketDetail from '../views/MarketDetail';
import Wallet from '../views/Wallet';
import Transactions from '../views/Transactions';
import Settings from '../views/Settings';
import MarketsAdmin from '../views/MarketsAdmin';
import BottomNav from '../components/BottomNav';
import LiveUpdatesManager from '../components/LiveUpdatesManager';
import { useSelector } from 'react-redux';
import Login from '../views/Login';
const App = () => {
    const user = useSelector((s) => s.auth.user);
    const location = useLocation();
    return (_jsx(LiveUpdatesManager, { children: _jsxs("div", { className: "min-h-screen bg-gradient-to-b from-brand-dark to-black", children: [_jsx("header", { className: "sticky top-0 z-10 bg-transparent backdrop-blur-md", children: _jsxs("div", { className: "max-w-6xl mx-auto flex items-center justify-between p-4", children: [_jsx(Link, { to: "/", className: "text-xl font-bold text-white", children: "Dating-or-Not" }), user && _jsx(UserMenu, { username: user.username, avatarUrl: user.avatarUrl })] }) }), _jsx("main", { className: "max-w-6xl mx-auto p-4 pb-24", children: _jsx(ErrorBoundary, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/home", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/dating", element: _jsx(SwipeDeck, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(Onboarding, {}) }), _jsx(Route, { path: "/profile", element: _jsx(DatingProfile, {}) }), _jsx(Route, { path: "/matches", element: _jsx(Matches, {}) }), _jsx(Route, { path: "/markets", element: _jsx(MarketList, {}) }), _jsx(Route, { path: "/markets/:id", element: _jsx(MarketDetail, {}) }), _jsx(Route, { path: "/wallet", element: _jsx(Wallet, {}) }), _jsx(Route, { path: "/transactions", element: _jsx(Transactions, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/admin/markets", element: _jsx(RequireAdmin, { children: _jsx(MarketsAdmin, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }) }) }), location.pathname !== '/home' && _jsx(BottomNav, {})] }) }));
};
export default App;
function UserMenu({ username, avatarUrl }) {
    const [open, setOpen] = React.useState(false);
    const close = () => setOpen(false);
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "group flex items-center gap-2 text-sm rounded-full px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-pink/50 transition-colors", children: [_jsx("img", { src: avatarUrl || 'https://i.pravatar.cc/40', alt: "pfp", className: "w-8 h-8 rounded-full ring-1 ring-white/10 group-hover:ring-brand-pink/60 transition-colors" }), _jsx("span", { className: "text-white/90", children: username })] }), _jsx(AnimatePresence, { children: open && (_jsxs(motion.div, { initial: { opacity: 0, y: -8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.98 }, transition: { type: 'spring', stiffness: 300, damping: 26 }, className: "absolute right-0 mt-2 w-56 rounded-xl p-2 text-sm bg-black/80 border border-white/10 shadow-xl backdrop-blur-md", children: [_jsx(Link, { to: "/dating", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Dating" }), _jsx(Link, { to: "/matches", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "My Matches" }), _jsx(Link, { to: "/profile", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Dating Profile" }), _jsx(Link, { to: "/markets", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Bets" }), _jsx(Link, { to: "/wallet", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Wallet" }), _jsx(Link, { to: "/transactions", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Transactions" }), _jsx(Link, { to: "/settings", onClick: close, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Settings" }), _jsx(AdminMenuItem, { onClick: close })] })) })] }));
}
function AdminMenuItem({ onClick }) {
    const user = window.store?.getState?.().auth.user;
    if (!user || user.role !== 'admin')
        return null;
    return (_jsx(Link, { to: "/admin/markets", onClick: onClick, className: "block px-3 py-2 rounded hover:bg-white/10 transition-colors", children: "Admin" }));
}
function RequireAdmin({ children }) {
    // Basic client-side guard; server enforces too
    try {
        const state = window.store?.getState?.();
        const user = state?.auth?.user;
        if (user?.role === 'admin')
            return children;
    }
    catch { }
    return _jsx(Navigate, { to: "/" });
}
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err) { console.error(err); }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("h2", { className: "text-lg font-semibold mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-white/70 text-sm", children: "Please refresh the page or try again." })] }));
        }
        return this.props.children;
    }
}
