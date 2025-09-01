import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useCreateParlayMutation } from '../store/services/api';
import { motion, LayoutGroup } from 'framer-motion';
export default function ParlaySlip({ initialLegs = [], marketId }) {
    const [legs, setLegs] = useState(initialLegs);
    const [stake, setStake] = useState(20);
    const [mode, setMode] = useState('power');
    const [createParlay, { isLoading }] = useCreateParlayMutation();
    const [ok, setOk] = useState(null);
    const [err, setErr] = useState(null);
    function selectionMultiplier(l) {
        switch (l.selection) {
            case 'no':
                return l.odds * 1.1;
            case 'under':
                return l.odds * 1.15;
            case 'over':
            case 'yes':
            default:
                return l.odds;
        }
    }
    const baseMultiplier = useMemo(() => legs.reduce((acc, l) => acc * selectionMultiplier(l), 1), [legs]);
    const tier = legs.length;
    const tierMultiplier = useMemo(() => {
        const powerTable = { 2: 3.0, 3: 5.0, 4: 10.0, 5: 20.0 };
        const flexTable = { 2: 2.0, 3: 2.25, 4: 5.0, 5: 10.0 };
        const tierTarget = (mode === 'flex' ? flexTable[tier] : powerTable[tier]);
        // Combine baseMultiplier (affected by selections) with tier target.
        // We take the max so that certain selections can push payout above the floor tier.
        const combined = Math.max(baseMultiplier, tierTarget ?? baseMultiplier);
        return combined;
    }, [mode, tier, baseMultiplier]);
    const payout = Math.round(stake * tierMultiplier * 100) / 100;
    function setSelection(idx, sel) {
        setLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, selection: sel } : l)));
    }
    async function submit() {
        setOk(null);
        setErr(null);
        try {
            await createParlay({ legs: legs.map(({ betId, selection }) => ({ betId, selection })), stakeUSD: stake }).unwrap();
            const payoutUSD = Math.round(stake * tierMultiplier * 100) / 100;
            try {
                const existing = JSON.parse(sessionStorage.getItem('activeBets') || '[]');
                const active = [{ type: 'parlay', payoutUSD, marketId }, ...existing];
                sessionStorage.setItem('activeBets', JSON.stringify(active));
            }
            catch { }
            setOk(`Parlay active · Stake $${stake} → Payout $${payoutUSD.toFixed(2)}`);
        }
        catch (e) {
            setErr('Failed to place parlay');
        }
    }
    return (_jsxs("div", { className: "glass rounded-2xl p-4", children: [_jsxs("div", { className: "font-semibold mb-3 flex items-center justify-between", children: [_jsxs("span", { children: ["Build Parlay (", legs.length, ")"] }), _jsxs("div", { className: "bg-white/5 rounded-xl p-1 text-xs", children: [_jsx("button", { className: `px-2 py-1 rounded-lg ${mode === 'power' ? 'bg-brand-green text-black' : ''}`, onClick: () => setMode('power'), children: "Power" }), _jsx("button", { className: `px-2 py-1 rounded-lg ${mode === 'flex' ? 'bg-brand-green text-black' : ''}`, onClick: () => setMode('flex'), children: "Flex" })] })] }), _jsxs("div", { className: "space-y-3", children: [legs.map((l, i) => (_jsxs("div", { className: "rounded-2xl bg-white/5 p-3 relative overflow-hidden", children: [_jsx("button", { className: "absolute right-2 top-2 text-white/60 hover:text-white", "aria-label": "Remove leg", onClick: () => setLegs(prev => prev.filter((_, idx) => idx !== i)), children: "\u2715" }), _jsxs("div", { className: "text-sm text-white/80 font-medium", children: [l.title, l.line != null ? ` • ${l.line}` : ''] }), _jsx(LayoutGroup, { id: `leg-${i}`, children: _jsx("div", { className: "mt-2 flex gap-2 text-xs relative", children: ['yes', 'no', 'over', 'under'].map((opt) => {
                                        const selected = l.selection === opt;
                                        return (_jsxs("button", { onClick: () => setSelection(i, opt), className: `relative px-3 py-1 rounded-full border overflow-hidden ${selected ? 'border-transparent' : 'border-white/20'}`, children: [selected && (_jsx(motion.span, { layoutId: `chip-bg-${i}`, className: "absolute inset-0 rounded-full bg-brand-green", transition: { type: 'spring', stiffness: 400, damping: 30 } })), _jsx("span", { className: `relative ${selected ? 'text-black font-semibold' : 'text-white/90 line-through decoration-white/30 decoration-2'}`, children: opt.toUpperCase() })] }, opt));
                                    }) }) })] }, i))), legs.length === 0 && _jsx("div", { className: "text-white/60 text-sm", children: "Add legs from the market to start a parlay." })] }), _jsxs("div", { className: "mt-4 rounded-2xl bg-white/5 p-3", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: "Tier multiplier" }), _jsxs("span", { className: "font-semibold", children: ["\u00D7 ", tierMultiplier.toFixed(2)] })] }), _jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "text-sm text-white/70", htmlFor: "stake", children: "Stake (USD)" }), _jsx("input", { id: "stake", type: "number", className: "mt-1 w-full rounded bg-white/10 p-2", value: stake, onChange: (e) => setStake(Number(e.target.value)) })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-sm", children: [_jsx("span", { children: "Potential payout" }), _jsxs("span", { className: "font-semibold text-brand-green", children: ["$", payout.toFixed(2)] })] })] }), _jsx("button", { disabled: isLoading || legs.length < 2, onClick: submit, className: "mt-4 w-full rounded-xl bg-brand-pink py-2 font-semibold disabled:opacity-60", children: isLoading ? 'Placing…' : 'Place Parlay' }), _jsxs("div", { "aria-live": "polite", className: "mt-2 text-sm", children: [ok && _jsx("div", { className: "rounded-lg border border-brand-green/40 bg-brand-green/15 text-brand-green px-3 py-2", children: ok }), err && _jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2", children: err })] })] }));
}
