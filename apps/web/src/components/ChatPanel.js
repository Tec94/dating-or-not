import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
export default function ChatPanel({ marketId, roomId, active = true }) {
    const [messages, setMessages] = useState([]);
    const seenKeysRef = useRef(new Set());
    const [input, setInput] = useState('');
    const [mediaOpen, setMediaOpen] = useState(false);
    const socketRef = useRef(null);
    const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';
    const currentUser = useSelector((s) => s.auth.user);
    const meId = currentUser?.id || 'me';
    const [resolvedRoomId, setResolvedRoomId] = useState(roomId);
    const connectedOnceRef = useRef(false);
    useEffect(() => {
        let cancelled = false;
        async function ensureRoomAndConnect() {
            if (!active)
                return;
            if (connectedOnceRef.current)
                return;
            // Resolve room by market
            let theRoomId = roomId;
            if (!theRoomId) {
                try {
                    const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1];
                    const res = await fetch(`${baseUrl}/chat/room/by-market`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
                        credentials: 'include',
                        body: JSON.stringify({ marketId }),
                    });
                    if (res.ok) {
                        const room = await res.json();
                        theRoomId = room?._id;
                        if (!cancelled)
                            setResolvedRoomId(theRoomId);
                    }
                }
                catch { }
            }
            if (!theRoomId)
                return;
            const socket = io(baseUrl, { withCredentials: true, auth: {} });
            socketRef.current = socket;
            connectedOnceRef.current = true;
            socket.removeAllListeners('message');
            socket.emit('join_room', { roomId: theRoomId });
            socket.on('message', (payload) => {
                const msg = payload?.message;
                if (!msg)
                    return;
                const key = String(msg._id || `${msg.createdAt}-${msg.senderId}-${msg.text || ''}`);
                if (seenKeysRef.current.has(key))
                    return;
                seenKeysRef.current.add(key);
                if (seenKeysRef.current.size > 500) {
                    // prevent unbounded growth
                    seenKeysRef.current.clear();
                }
                setMessages((prev) => [...prev, msg]);
            });
        }
        ensureRoomAndConnect();
        return () => { cancelled = true; connectedOnceRef.current = false; socketRef.current?.off('message'); socketRef.current?.disconnect(); };
    }, [active, marketId, roomId, baseUrl]);
    function send() {
        if (!input.trim())
            return;
        const rid = resolvedRoomId || roomId || marketId;
        const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        // Optimistic add to dedupe set and UI
        seenKeysRef.current.add(clientMessageId);
        setMessages((prev) => [...prev, { senderId: meId, text: input, type: 'text', createdAt: new Date().toISOString(), _id: clientMessageId }]);
        socketRef.current?.emit('message_text', { roomId: rid, text: input, clientMessageId });
        setInput('');
    }
    return (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "glass rounded-2xl p-4 h-80 flex flex-col", children: [_jsx("div", { className: "flex-1 overflow-auto space-y-3 pr-2", children: messages.map((m, i) => {
                            const mine = m.senderId === meId;
                            return (_jsxs("div", { className: `flex items-start gap-2 ${mine ? 'justify-end' : 'justify-start'}`, children: [!mine && (_jsx("img", { src: m.sender?.avatarUrl || 'https://i.pravatar.cc/28', alt: "pfp", className: "w-7 h-7 rounded-full" })), _jsxs("div", { className: `max-w-[70%] ${mine ? 'text-right' : 'text-left'}`, children: [_jsx("div", { className: `text-xs mb-1 ${mine ? 'text-white/70' : 'text-white/60'}`, children: m.sender?.username || (mine ? 'You' : 'User') }), _jsx("div", { className: `text-sm rounded px-3 py-2 ${mine ? 'bg-brand-green text-black ml-auto' : 'bg-white/5 text-white'}`, children: m.text })] }), mine && (_jsx("img", { src: m.sender?.avatarUrl || currentUser?.avatarUrl || 'https://i.pravatar.cc/28', alt: "pfp", className: "w-7 h-7 rounded-full" }))] }, i));
                        }) }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter')
                                    send(); }, className: "flex-1 rounded bg-white/10 p-2", placeholder: "Message..." }), _jsx("button", { onClick: () => setMediaOpen(true), className: "px-3 py-2 rounded bg-white/10", children: "Image" }), _jsx("button", { onClick: send, className: "px-3 py-2 rounded bg-brand-pink", children: "Send" })] })] }), _jsx(AnimatePresence, { children: mediaOpen && (_jsxs(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children: [_jsx("div", { className: "absolute inset-0 bg-black/60", onClick: () => setMediaOpen(false) }), _jsxs(motion.div, { initial: { y: 30, scale: 0.96, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, exit: { y: 10, scale: 0.98, opacity: 0 }, transition: { type: 'spring', stiffness: 300, damping: 28 }, className: "relative glass rounded-2xl p-5 w-[min(92vw,420px)]", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Send image" }), _jsx("input", { "aria-label": "Select image", type: "file", accept: "image/*", onChange: async (e) => {
                                        const f = e.target.files?.[0];
                                        if (!f)
                                            return;
                                        try {
                                            const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1];
                                            const res = await fetch(`${baseUrl}/chat/media/presign`, { method: 'POST', headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) }, credentials: 'include', body: JSON.stringify({ filename: f.name, contentType: f.type || 'image/jpeg' }) });
                                            if (!res.ok)
                                                return;
                                            const { key, uploadUrl } = await res.json();
                                            await fetch(uploadUrl, { method: 'PUT', body: await f.arrayBuffer() });
                                            await fetch(`${baseUrl}/chat/media/confirm`, { method: 'POST', headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) }, credentials: 'include', body: JSON.stringify({ roomId: resolvedRoomId || roomId || marketId, key, type: 'image' }) });
                                            setMediaOpen(false);
                                        }
                                        catch { }
                                    } }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx("button", { className: "px-3 py-2 rounded bg-white/10", onClick: () => setMediaOpen(false), children: "Close" }) })] })] })) })] }));
}
