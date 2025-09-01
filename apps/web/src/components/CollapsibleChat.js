import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatPanel from './ChatPanel';
export default function CollapsibleChat({ marketId }) {
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { className: "mt-4", children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "w-full text-left rounded-2xl px-4 py-3 bg-brand-green/20 border border-brand-green/40 text-white flex items-center justify-between", children: [_jsx("span", { className: "font-semibold", children: "Chatroom for this market" }), _jsx("span", { children: open ? '▲' : '▼' })] }), _jsx(AnimatePresence, { initial: false, children: open && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, className: "overflow-hidden", children: _jsx(ChatPanel, { marketId: marketId, active: true }) })) })] }));
}
