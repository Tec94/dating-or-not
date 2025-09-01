import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
export default function Dashboard() {
    const navigate = useNavigate();
    const tiles = [
        { title: 'Dating', desc: 'Swipe and match', to: '/dating', emoji: '❤️' },
        { title: 'Bets', desc: 'View markets & parlays', to: '/markets', emoji: '🎲' },
        { title: 'Wallet', desc: 'Balance & PnL', to: '/wallet', emoji: '💵' },
        { title: 'Settings', desc: 'Profile & privacy', to: '/settings', emoji: '⚙️' },
    ];
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch", children: tiles.map((t, i) => (_jsxs(motion.button, { onClick: () => navigate(t.to), className: "md:col-span-1 glass rounded-2xl p-6 h-full text-left cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-pink", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 }, children: [_jsx("div", { className: "text-2xl", "aria-hidden": true, children: t.emoji }), _jsx("h2", { className: "text-lg font-semibold mt-2", children: t.title }), _jsx("p", { className: "text-white/70", children: t.desc })] }, t.title))) }));
}
