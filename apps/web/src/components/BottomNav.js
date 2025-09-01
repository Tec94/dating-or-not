import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
function NavButton({ to, label, emoji }) {
    const location = useLocation();
    const active = location.pathname.startsWith(to);
    return (_jsxs(Link, { to: to, className: `flex flex-col items-center justify-center gap-1 rounded-2xl px-6 py-3 pressable text-sm ${active ? 'bg-white/20' : 'bg-white/10'}`, children: [_jsx("span", { className: "text-2xl", "aria-hidden": true, children: emoji }), _jsx("span", { className: "text-sm", children: label })] }));
}
export default function BottomNav() {
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/60 backdrop-blur-md", children: _jsxs("div", { className: "max-w-6xl mx-auto grid grid-cols-3 gap-3 p-3", children: [_jsx(NavButton, { to: "/dating", label: "Dating", emoji: "\u2764\uFE0F" }), _jsx(NavButton, { to: "/markets", label: "Bets", emoji: "\uD83C\uDFB2" }), _jsx(NavButton, { to: "/wallet", label: "Wallet", emoji: "\uD83D\uDCB5" })] }) }));
}
