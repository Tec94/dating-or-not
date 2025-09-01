import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Fade, Zoom } from 'react-awesome-reveal';
import Page from '../components/Page';
export default function Landing() {
    return (_jsx(Page, { children: _jsxs("section", { className: "text-center py-20", children: [_jsxs(Fade, { cascade: true, damping: 0.1, children: [_jsxs("h1", { className: "text-5xl md:text-7xl font-extrabold tracking-tight", children: ["Date. ", _jsx("span", { className: "text-brand-pink", children: "Bet." }), " Win."] }), _jsx("p", { className: "mt-6 text-lg text-white/80 max-w-2xl mx-auto", children: "Swipe like Tinder. Bet like DraftKings. All in one playful, privacy-first experience." })] }), _jsxs("div", { className: "mt-10 flex justify-center gap-4", children: [_jsx(Zoom, { children: _jsx(Link, { to: "/home", className: "px-6 py-3 rounded-full bg-brand-pink text-white font-semibold hover:opacity-90 pressable", children: "Try Demo" }) }), _jsx(Zoom, { delay: 150, children: _jsx(Link, { to: "/dating", className: "px-6 py-3 rounded-full glass font-semibold hover:opacity-90", children: "Start Swiping" }) })] }), _jsx("div", { className: "mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch", children: _jsxs(Fade, { cascade: true, damping: 0.15, children: [_jsx(Feature, { title: "Tinder-like Swipes", desc: "Physics-based card deck for fast likes & passes" }), _jsx(Feature, { title: "Live Betting Odds", desc: "FanDuel-style markets with instant payout calc" }), _jsx(Feature, { title: "Wallet & Tokens", desc: "Deposit, withdraw, and track your winnings" })] }) })] }) }));
}
function Feature({ title, desc }) {
    return (_jsxs("div", { className: "glass rounded-2xl p-6 text-left", children: [_jsx("h3", { className: "text-xl font-semibold", children: title }), _jsx("p", { className: "text-white/70 mt-2", children: desc })] }));
}
