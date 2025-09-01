import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { Fade } from 'react-awesome-reveal';
import Page from '../components/Page';
import { useSelector } from 'react-redux';
import { useListMarketsCursorQuery } from '../store/services/api';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
export default function MarketListOptimized() {
    const user = useSelector((s) => s.auth.user);
    const navigate = useNavigate();
    const [allMarkets, setAllMarkets] = useState([]);
    const [cursor, setCursor] = useState(undefined);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const { data, isLoading, isFetching } = useListMarketsCursorQuery({
        limit: 20,
        cursor
    });
    // Load data when query succeeds
    useEffect(() => {
        if (data?.items) {
            if (!cursor) {
                // First load - replace all markets
                setAllMarkets(data.items);
            }
            else {
                // Pagination - append new markets
                setAllMarkets(prev => [...prev, ...data.items]);
            }
            setHasLoadedOnce(true);
        }
    }, [data, cursor]);
    const loadMore = useCallback(() => {
        if (data?.hasMore && data?.nextCursor && !isFetching) {
            setCursor(data.nextCursor);
        }
    }, [data?.hasMore, data?.nextCursor, isFetching]);
    // Handle infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
            ) {
                loadMore();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);
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
        return (_jsx(Page, { title: "Markets", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Join the betting action" }), _jsx("p", { className: "text-white/60 mb-6", children: "Log in to see the latest dating markets and place your bets." }), _jsx("button", { className: "px-6 py-3 rounded-lg bg-brand-pink text-white font-medium", onClick: () => navigate('/login'), children: "Log in" })] }) }));
    }
    return (_jsx(Page, { title: "Markets", children: _jsxs("div", { className: "space-y-6", children: [_jsx(AnimatePresence, { children: activeBets.length > 0 && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "glass rounded-2xl p-4 border border-brand-green/30", children: [_jsx("h3", { className: "font-semibold text-brand-green mb-2", children: "\uD83C\uDFAF Active Bets" }), _jsx("div", { className: "space-y-2", children: activeBets.map((bet, i) => (_jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "text-white/80", children: bet.type === 'parlay' ? 'Parlay' : 'Single bet' }), bet.payoutUSD && _jsxs("span", { className: "text-brand-green ml-2", children: ["Potential: $", bet.payoutUSD.toFixed(0)] }), bet.text && _jsx("div", { className: "text-white/60 text-xs mt-1", children: bet.text })] }, i))) }), _jsx("button", { onClick: () => {
                                    setActiveBets([]);
                                    sessionStorage.removeItem('activeBets');
                                }, className: "mt-2 text-xs text-white/50 hover:text-white/70", children: "Dismiss" })] })) }), _jsx("div", { className: "space-y-4", children: (!hasLoadedOnce && isLoading) ? (
                    // Initial loading state
                    _jsx("div", { className: "space-y-4", children: [...Array(3)].map((_, i) => (_jsxs("div", { className: "glass rounded-2xl p-4 animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-white/10 rounded-full" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-white/10 rounded w-24 mb-1" }), _jsx("div", { className: "h-3 bg-white/10 rounded w-16" })] })] }), _jsx("div", { className: "h-5 bg-white/10 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-4 bg-white/10 rounded w-1/2" })] }, i))) })) : (
                    // Actual markets
                    _jsxs(_Fragment, { children: [allMarkets.map((market, index) => (_jsx(Fade, { delay: index * 50, triggerOnce: true, children: _jsxs(Link, { to: `/markets/${market._id}`, className: "block glass rounded-2xl p-4 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02]", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("img", { src: market.author?.avatarUrl || 'https://i.pravatar.cc/40', alt: "pfp", className: "w-10 h-10 rounded-full ring-1 ring-white/10" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-sm", children: market.author?.username || 'Anonymous' }), _jsx("div", { className: "text-xs text-white/60", children: market.time || 'now' })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-brand-green font-bold", children: market.topOdds ? `${Number(market.topOdds).toFixed(1)}x` : '—' }), _jsx("div", { className: "text-xs text-white/60", children: "top odds" })] })] }), _jsx("h3", { className: "font-semibold mb-2 leading-tight", children: market.title || market._id }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-white/60", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { children: market.comments || 0 })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: "\u2764\uFE0F" }), _jsx("span", { children: market.likes || 0 })] }), _jsx("div", { className: "ml-auto", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${market.status === 'open' ? 'bg-green-500/20 text-green-400' :
                                                            market.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-gray-500/20 text-gray-400'}`, children: market.status || 'open' }) })] })] }) }, market._id))), isFetching && allMarkets.length > 0 && (_jsx("div", { className: "flex justify-center py-4", children: _jsxs("div", { className: "flex items-center gap-2 text-white/60", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Loading more markets..."] }) })), hasLoadedOnce && !data?.hasMore && allMarkets.length > 0 && (_jsx("div", { className: "text-center py-4 text-white/40 text-sm", children: "You've reached the end of the markets" })), hasLoadedOnce && allMarkets.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-white/60", children: "No markets available yet." }) }))] })) })] }) }));
}
