import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetWalletPnlQuery } from '../store/services/api';
import { AnimatePresence, motion } from 'framer-motion';
const demoWeek = [
    { t: 'Mon', v: -20 },
    { t: 'Tue', v: 10 },
    { t: 'Wed', v: 35 },
    { t: 'Thu', v: 15 },
    { t: 'Fri', v: 60 },
    { t: 'Sat', v: 45 },
    { t: 'Sun', v: 80 },
];
const demoMonth = Array.from({ length: 30 }, (_, i) => ({ t: String(i + 1), v: Math.round((Math.sin(i / 5) + i / 10) * 20) }));
export default function PnLChart() {
    const [range, setRange] = useState('7d');
    const user = useSelector((s) => s.auth.user);
    const isObjectId = user && /^[0-9a-fA-F]{24}$/.test(user.id);
    const { data: apiData } = useGetWalletPnlQuery(isObjectId ? { userId: user.id, range } : skipToken);
    const serverPoints = apiData?.points?.map((p) => ({ t: p.t.slice(5), v: p.v }));
    const hasData = !!(serverPoints && serverPoints.length);
    const lastRangeRef = useRef(null);
    const lastPointsRef = useRef(null);
    useEffect(() => {
        if (hasData) {
            lastRangeRef.current = range;
            lastPointsRef.current = serverPoints || null;
        }
    }, [hasData, range, serverPoints]);
    let effectiveRange = range;
    if (!hasData) {
        if (lastRangeRef.current)
            effectiveRange = lastRangeRef.current;
        else
            effectiveRange = range === '90d' || range === 'ytd' || range === 'all' ? '30d' : '7d';
    }
    const data = useMemo(() => {
        if (hasData && serverPoints)
            return serverPoints;
        // If no server data yet, show empty line at zero to reflect $0 balance, not demo
        return Array.from({ length: 7 }, (_, i) => ({ t: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], v: 0 }));
    }, [hasData, serverPoints]);
    const max = Math.max(...data.map((d) => d.v), 0);
    const min = Math.min(...data.map((d) => d.v), 0);
    // Expand chart to use available space better
    const height = 300;
    const containerRef = useRef(null);
    const [width, setWidth] = useState(760);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const obs = new ResizeObserver(() => {
            setWidth(Math.max(320, el.clientWidth));
        });
        obs.observe(el);
        setWidth(Math.max(320, el.clientWidth));
        return () => obs.disconnect();
    }, []);
    const padLeft = 60;
    const padRight = 24;
    const padTop = 32;
    const padBottom = 36;
    const span = max - min || 1;
    const coords = data.map((d, i) => {
        const x = padLeft + (i * (width - padLeft - padRight)) / (data.length - 1 || 1);
        const y = padTop + ((max - d.v) * (height - padTop - padBottom)) / span;
        return { x, y };
    });
    const points = coords.map(({ x, y }) => `${x},${y}`).join(' ');
    // Tooltip state
    const [hover, setHover] = useState(null);
    function handleMove(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.round(((x - padLeft) / (width - padLeft - padRight)) * (data.length - 1));
        const clamped = Math.max(0, Math.min(data.length - 1, idx));
        const d = data[clamped];
        const p = coords[clamped];
        setHover({ x: p.x, y: p.y, label: d.t, value: d.v, idx: clamped });
    }
    return (_jsxs("div", { ref: containerRef, children: [_jsxs("div", { className: "flex items-center gap-2 text-sm mb-2", children: [_jsx("button", { onClick: () => setRange('7d'), className: `px-3 py-1 rounded ${range === '7d' ? 'bg-white/15' : 'bg-white/5'}`, children: "7D" }), _jsx("button", { onClick: () => setRange('30d'), className: `px-3 py-1 rounded ${range === '30d' ? 'bg-white/15' : 'bg-white/5'}`, children: "30D" }), _jsx("button", { onClick: () => setRange('90d'), className: `px-3 py-1 rounded ${range === '90d' ? 'bg-white/15' : 'bg-white/5'}`, children: "90D" }), _jsx("button", { onClick: () => setRange('ytd'), className: `px-3 py-1 rounded ${range === 'ytd' ? 'bg-white/15' : 'bg-white/5'}`, children: "YTD" }), _jsx("button", { onClick: () => setRange('all'), className: `px-3 py-1 rounded ${range === 'all' ? 'bg-white/15' : 'bg-white/5'}`, children: "ALL" })] }), _jsxs("svg", { width: width, height: height, className: "w-full", onMouseMove: handleMove, onMouseLeave: () => setHover(null), children: [Array.from({ length: 5 }, (_, i) => {
                        const val = max - (i * span) / 4;
                        const y = padTop + ((max - val) * (height - padTop - padBottom)) / span;
                        return _jsxs("g", { children: [_jsx("line", { x1: padLeft, x2: width - padRight, y1: y, y2: y, stroke: "rgba(255,255,255,0.08)" }), _jsxs("text", { x: padLeft - 12, y: y + 4, textAnchor: "end", fontSize: "12", fill: "rgba(255,255,255,0.7)", children: ["$", val.toFixed(0)] })] }, i);
                    }), data.map((d, i) => (_jsx("text", { x: padLeft + (i * (width - padLeft - padRight)) / (data.length - 1 || 1), y: height - 10, textAnchor: "middle", fontSize: "11", fill: "rgba(255,255,255,0.6)", children: d.t }, i))), _jsx("polyline", { fill: "none", stroke: "#00d084", strokeWidth: "3", points: points, className: "pointer-events-none" }), coords.map((p, i) => {
                        const active = hover?.idx === i;
                        return (_jsxs("g", { onMouseEnter: () => setHover({ x: p.x, y: p.y, label: data[i].t, value: data[i].v, idx: i }), onMouseLeave: () => setHover(null), className: "cursor-pointer", children: [_jsx("circle", { cx: p.x, cy: p.y, r: active ? 10 : 0, fill: "none", stroke: "#00d084", strokeOpacity: active ? 0.3 : 0, strokeWidth: 3, className: "transition-[r,stroke-opacity] duration-150 ease-out" }), _jsx("circle", { cx: p.x, cy: p.y, r: active ? 5.5 : 3.5, fill: "#00d084", fillOpacity: active ? 1 : 0.85, className: "transition-[r,fill-opacity] duration-150 ease-out" })] }, i));
                    }), _jsx("line", { x1: padLeft, x2: width - padRight, y1: padTop + ((max - 0) * (height - padTop - padBottom)) / span, y2: padTop + ((max - 0) * (height - padTop - padBottom)) / span, stroke: "rgba(255,255,255,0.2)" }), _jsx(AnimatePresence, { children: hover && ((() => {
                            const tipW = 90;
                            const pad = 10;
                            const flipLeft = hover.x + tipW + pad > width - padRight;
                            const rx = flipLeft ? hover.x - tipW - pad : hover.x + pad;
                            const ry = hover.y - 32;
                            return (_jsxs(motion.g, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.15, ease: 'easeOut' }, children: [_jsx("rect", { x: rx, y: ry, width: tipW, height: 26, rx: 6, fill: "rgba(0,0,0,0.8)" }), _jsxs("text", { x: rx + 8, y: ry + 16, fontSize: 12, fill: "#fff", children: ["$", hover.value.toFixed(2)] })] }, `tip-${hover.idx}`));
                        })()) })] })] }));
}
