import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function BetSlip({ odds, onPlace }) {
    const [stake, setStake] = useState(25);
    const [loading, setLoading] = useState(false);
    const [ok, setOk] = useState(null);
    const [err, setErr] = useState(null);
    const payout = Math.round(stake * odds * 100) / 100;
    return (_jsxs("div", { className: "glass rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-white/80", children: "Odds" }), _jsx("span", { className: "font-semibold", children: odds.toFixed(2) })] }), _jsxs("div", { className: "mt-3", children: [_jsx("label", { className: "text-white/80 text-sm", htmlFor: "stake-usd", children: "Stake (USD)" }), _jsx("input", { id: "stake-usd", type: "number", value: stake, onChange: (e) => setStake(Number(e.target.value)), className: "mt-1 w-full rounded-md bg-white/10 p-2 outline-none", placeholder: "Enter amount" })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsx("span", { className: "text-white/80", children: "Potential payout" }), _jsxs("span", { className: "font-semibold text-brand-green", children: ["$", payout.toFixed(2)] })] }), _jsx("button", { className: `mt-4 w-full rounded-md font-semibold py-2 pressable ${loading ? 'bg-white/20 text-white/70' : 'bg-brand-green text-black'}`, disabled: loading || !isFinite(stake) || stake <= 0, onClick: async () => {
                    setLoading(true);
                    setOk(null);
                    setErr(null);
                    try {
                        await onPlace(stake);
                        setOk(`Bet $${stake.toFixed(2)} placed`);
                    }
                    catch (e) {
                        setErr('Failed to place bet');
                    }
                    finally {
                        setLoading(false);
                    }
                }, children: loading ? 'Placing…' : 'Place Bet' }), _jsxs("div", { "aria-live": "polite", className: "mt-2 text-sm", children: [ok && _jsx("div", { className: "rounded-lg border border-brand-green/40 bg-brand-green/15 text-brand-green px-3 py-2", children: ok }), err && _jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2", children: err })] })] }));
}
