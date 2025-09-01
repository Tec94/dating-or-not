import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useListMarketsQuery } from '../store/services/api';
export default function MarketsAdmin() {
    const { data } = useListMarketsQuery({ page: 1, limit: 50 });
    const [selected, setSelected] = useState(null);
    const [outcomes, setOutcomes] = useState({});
    useEffect(() => { setOutcomes({}); }, [selected?._id]);
    async function seedMarkets() {
        await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:4000'}/seed/markets`, { method: 'POST' });
    }
    return (_jsxs("div", { className: "max-w-5xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Admin: Markets" }), _jsx("button", { className: "px-3 py-2 rounded bg-white/10", onClick: seedMarkets, children: "Seed demo markets" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "glass rounded-2xl p-4", children: [_jsx("h2", { className: "font-semibold mb-2", children: "Open Markets" }), _jsx("div", { className: "space-y-2", children: (data?.items || []).map((m) => (_jsxs("button", { onClick: () => setSelected(m), className: `w-full text-left rounded-lg px-3 py-2 ${selected?._id === m._id ? 'bg-white/15' : 'bg-white/5'} hover:bg-white/10`, children: [_jsx("div", { className: "font-medium", children: m._id }), _jsxs("div", { className: "text-xs text-white/60", children: ["Top odds: ", Number(m.topOdds || 0).toFixed(2), " \u00B7 Likes: ", m.likes || 0] })] }, m._id))) })] }), _jsxs("div", { className: "glass rounded-2xl p-4", children: [!selected && _jsx("div", { className: "text-white/70 text-sm", children: "Select a market" }), selected && _jsx(MarketDetailAdmin, { market: selected, outcomes: outcomes, setOutcomes: setOutcomes })] })] })] }));
}
function MarketDetailAdmin({ market, outcomes, setOutcomes }) {
    const [bets, setBets] = useState([...(market.standardBets || []), ...(market.customBets || [])]);
    async function closeMarket() {
        await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:4000'}/admin/market/${market._id}/close`, { method: 'POST', credentials: 'include', headers: withCsrf() });
    }
    async function settleMarket() {
        await fetch(`${import.meta.env?.VITE_API_URL || 'http://localhost:4000'}/admin/market/${market._id}/settle`, { method: 'POST', credentials: 'include', headers: { ...withCsrf(), 'content-type': 'application/json' }, body: JSON.stringify({ outcomes }) });
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "font-semibold", children: ["Market ", market._id] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-2 rounded bg-white/10", onClick: closeMarket, children: "Close" }), _jsx("button", { className: "px-3 py-2 rounded bg-brand-green text-black font-semibold", onClick: settleMarket, children: "Settle" })] })] }), _jsx("div", { className: "space-y-2", children: bets.map((b) => (_jsxs("div", { className: "rounded-lg bg-white/5 p-2 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: b.description }), _jsxs("div", { className: "text-xs text-white/60", children: ["Odds: ", Number(b.odds).toFixed(2)] })] }), _jsxs("div", { className: "flex gap-2 text-sm", children: [_jsx("button", { className: `px-3 py-1 rounded ${outcomes[b._id] === 'win' ? 'bg-brand-green text-black' : 'bg-white/10'}`, onClick: () => setOutcomes({ ...outcomes, [b._id]: 'win' }), children: "Win" }), _jsx("button", { className: `px-3 py-1 rounded ${outcomes[b._id] === 'lose' ? 'bg-red-500/70' : 'bg-white/10'}`, onClick: () => setOutcomes({ ...outcomes, [b._id]: 'lose' }), children: "Lose" })] })] }, b._id))) })] }));
}
function withCsrf() {
    const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1];
    return csrf ? { 'x-csrf-token': csrf } : {};
}
