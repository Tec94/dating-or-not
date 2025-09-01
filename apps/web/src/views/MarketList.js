import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { Fade } from 'react-awesome-reveal';
import Page from '../components/Page';
import { useSelector } from 'react-redux';
import { useListMarketsQuery } from '../store/services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
// Social feed style items
const markets = [
    { id: 'm1', user: 'Jamie', avatar: '🧑‍🎤', title: 'Alex × Taylor — Will the date happen?', odds: 1.39, time: '2m', comments: 12, likes: 58 },
    { id: 'm2', user: 'Priya', avatar: '🧑‍💻', title: 'Sam × Chris — Drinks ≥ 2?', odds: 3.03, time: '10m', comments: 7, likes: 22 },
    { id: 'm3', user: 'Leo', avatar: '🧑‍🚀', title: 'Will there be a first kiss?', odds: 2.1, time: '1h', comments: 3, likes: 9 },
];
export default function MarketList() {
    const user = useSelector((s) => s.auth.user);
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { data, refetch } = useListMarketsQuery({ page, limit: 20 });
    const [feedItems, setFeedItems] = useState([]);
    useEffect(() => {
        if (data?.items) {
            setFeedItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
        }
    }, [data?.items, page]);
    const feed = feedItems.length ? feedItems : markets;
    const [activeBets, setActiveBets] = useState([]);
    // Load banner from session (set after placing bet/parlay), then clear
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('activeBets');
            if (raw) {
                const parsed = (JSON.parse(raw) || []).filter((it) => it && typeof it === 'object' && typeof it.payoutUSD === 'number' && it.payoutUSD > 0);
                setActiveBets(parsed);
                // Write back cleaned list
                sessionStorage.setItem('activeBets', JSON.stringify(parsed));
            }
        }
        catch { }
    }, []);
    // If not logged in, show public feed only and CTA to login
    if (!user) {
        return (_jsxs(Page, { children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Public Wins & Markets" }), _jsx("button", { className: "px-3 py-2 rounded bg-brand-pink", onClick: () => navigate('/login'), children: "Log in to bet" })] }), _jsx("div", { className: "space-y-4", children: _jsx(Fade, { cascade: true, damping: 0.1, children: feed.map((m) => (_jsx("div", { className: "glass rounded-2xl p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl", children: m.avatar }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-white/60", children: [_jsx("span", { className: "font-medium text-white", children: m.author?.username ?? m.user ?? 'User' }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: m.time ?? '' })] }), _jsx("div", { className: "font-semibold text-lg mt-1", children: m.title || `${m.author?.username ?? 'User'} — Market` }), _jsxs("div", { className: "mt-2 text-sm", children: ["Top odds: ", _jsx("span", { className: "font-bold", children: (m.topOdds ?? m.odds)?.toFixed ? (m.topOdds ?? m.odds).toFixed(2) : (m.topOdds ?? m.odds) })] }), _jsxs("div", { className: "mt-3 flex items-center gap-6 text-white/70 text-sm", children: [_jsxs("span", { className: "flex items-center gap-1", children: ["\uD83D\uDCAC ", _jsx("span", { children: m.comments ?? 0 })] }), _jsxs("span", { className: "flex items-center gap-1", children: ["\u2764\uFE0F ", _jsx("span", { children: m.likes ?? 0 })] })] })] })] }) }, m.id))) }) })] }));
    }
    return (_jsx(Page, { children: _jsxs("div", { className: "space-y-4", children: [_jsx(AnimatePresence, { children: activeBets.length > 0 && (_jsx(motion.div, { initial: { y: -12, opacity: 0, scale: 0.98 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: -12, opacity: 0, scale: 0.98 }, transition: { type: 'spring', stiffness: 350, damping: 26 }, className: "rounded-2xl border border-brand-green/40 bg-brand-green/15 text-brand-green px-4 py-3", children: _jsx(CollapsibleActiveBets, { items: activeBets }) })) }), _jsxs(Fade, { cascade: true, damping: 0.1, children: [feed.map((m) => (_jsx(Link, { to: `/markets/${m.id ?? m._id}`, className: "block glass rounded-2xl p-4 hover:bg-white/10", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl", children: m.avatar }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-white/60", children: [_jsx("span", { className: "font-medium text-white", children: m.author?.username ?? m.user ?? 'User' }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: m.time ?? '' })] }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("div", { className: "font-semibold text-lg flex-1", children: m.title || `${m.author?.username ?? 'User'} — Market` }), !!m.status && (_jsx("span", { className: `text-xs px-2 py-1 rounded-full ${m.status === 'open' ? 'bg-brand-green/20 text-brand-green' : m.status === 'closed' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-white/10 text-white/70'}`, children: m.status }))] }), _jsxs("div", { className: "mt-2 text-sm", children: ["Top odds: ", _jsx("span", { className: "font-bold", children: (m.topOdds ?? m.odds)?.toFixed ? (m.topOdds ?? m.odds).toFixed(2) : (m.topOdds ?? m.odds) })] }), _jsxs("div", { className: "mt-3 flex items-center gap-6 text-white/70 text-sm", children: [_jsxs("span", { className: "flex items-center gap-1", children: ["\uD83D\uDCAC ", _jsx("span", { children: m.comments ?? 0 })] }), _jsxs("span", { className: "flex items-center gap-1", children: ["\u2764\uFE0F ", _jsx("span", { children: m.likes ?? 0 })] })] })] })] }) }, m.id ?? m._id))), _jsx("div", { className: "flex justify-center mt-2", children: _jsx("button", { className: "px-4 py-2 rounded bg-white/10", onClick: () => setPage((p) => p + 1), children: "Load more" }) })] })] }) }));
}
function CollapsibleActiveBets({ items }) {
    const [open, setOpen] = useState(true);
    return (_jsxs("div", { children: [_jsx("button", { onClick: () => setOpen(v => !v), className: "w-full text-left", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "font-semibold", children: ["Active ", items.length > 1 ? 'Bets' : items[0]?.type === 'parlay' ? 'Parlay' : 'Bet'] }), _jsx(motion.span, { initial: false, animate: { rotate: open ? 0 : 180, opacity: 1, scale: 1 }, transition: { type: 'spring', stiffness: 350, damping: 26 }, className: "px-2 py-1 rounded bg-white/10 text-xs select-none pointer-events-none inline-flex items-center justify-center", "aria-hidden": true, children: _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M12 6l6 10H6L12 6z", fill: "#34d399" }) }) })] }) }), _jsx(AnimatePresence, { initial: false, children: open && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, className: "overflow-hidden", children: _jsx("div", { className: "mt-2 grid gap-2", children: items.map((it, idx) => {
                            const label = `${it.type === 'parlay' ? 'Parlay' : 'Bet'} · Payout $${(Number(it.payoutUSD ?? 0)).toFixed(2)}`;
                            const to = it.marketId ? `/markets/${it.marketId}` : '#';
                            return (_jsx(Link, { to: to, className: "block rounded-lg bg-white/5 px-3 py-2 hover:bg-white/10", children: _jsx("div", { className: "text-sm", children: label }) }, idx));
                        }) }) })) })] }));
}
