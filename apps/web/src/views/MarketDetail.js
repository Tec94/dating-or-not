import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate, useParams } from 'react-router-dom';
import BetSlip from '../components/BetSlip';
import ParlaySlip from '../components/ParlaySlip';
import { useSelector } from 'react-redux';
import Page from '../components/Page';
import { motion } from 'framer-motion';
import LikeButton from '../components/LikeButton';
import { api, useGetMarketQuery, useGetMatchQuery, useGetUserQuery, useLikeMarketMutation } from '../store/services/api';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import CollapsibleChat from '../components/CollapsibleChat';
const sampleBets = [
    { id: 'b1', type: 'date_happens', desc: 'Will the first date take place within 7 days?', odds: 1.39 },
    { id: 'b2', type: 'drinks_over_2', desc: 'Will they have 2 or more drinks?', odds: 3.03 },
];
export default function MarketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [likeMarket] = useLikeMarketMutation();
    const dispatch = useDispatch();
    const [betLikes, setBetLikes] = useState({});
    const isValidObjectId = (v) => !!v && /^[a-fA-F0-9]{24}$/.test(v);
    const shouldSkip = !isValidObjectId(id);
    const { data: market, isError } = useGetMarketQuery(id, { skip: shouldSkip });
    const { data: match } = useGetMatchQuery(market?.matchId, { skip: shouldSkip || !market?.matchId });
    const { data: userA } = useGetUserQuery(match?.userA, { skip: !match?.userA });
    const { data: userB } = useGetUserQuery(match?.userB, { skip: !match?.userB });
    const isFallback = shouldSkip || !!isError;
    const [marketLikes, setMarketLikes] = useState(0);
    const [marketLiked, setMarketLiked] = useState(false);
    const [marketJustLiked, setMarketJustLiked] = useState(false);
    useEffect(() => {
        if (market?.likes != null)
            setMarketLikes(market.likes);
    }, [market?.likes]);
    async function place(stake) {
        try {
            const payoutUSD = Math.round(stake * Number((market?.standardBets?.[0] || market?.customBets?.[0])?.odds ?? sampleBets[0].odds) * 100) / 100;
            const existing = JSON.parse(sessionStorage.getItem('activeBets') || '[]');
            const entry = { type: 'bet', payoutUSD, marketId: id };
            sessionStorage.setItem('activeBets', JSON.stringify([entry, ...existing]));
        }
        catch { }
    }
    const user = useSelector((s) => s.auth.user);
    return (_jsxs(Page, { children: [_jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("button", { onClick: () => navigate(-1), className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm", children: "\u2190 Back" }), _jsxs("div", { className: "flex items-center gap-3 glass rounded-xl px-3 py-2", children: [_jsxs("div", { className: "flex -space-x-2", children: [_jsx("img", { src: userA?.avatarUrl || 'https://i.pravatar.cc/28?img=12', className: "w-7 h-7 rounded-full border border-black/50", alt: "A" }), _jsx("img", { src: userB?.avatarUrl || 'https://i.pravatar.cc/28?img=22', className: "w-7 h-7 rounded-full border border-black/50", alt: "B" })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-sm font-semibold", children: [(userA?.username || 'User A'), " \u00D7 ", (userB?.username || 'User B')] }), _jsxs("div", { className: "text-xs text-white/70 flex gap-3", children: [_jsxs("span", { children: ["Likes: ", _jsx("span", { className: "font-semibold", children: marketLikes })] }), _jsxs("span", { children: ["Bets: ", _jsx("span", { className: "font-semibold", children: (market?.standardBets?.length || 0) + (market?.customBets?.length || 0) })] }), _jsxs("span", { children: ["Top odds: ", _jsx("span", { className: "font-semibold", children: Number(Math.max(...((market?.standardBets || []).map((b) => b.odds || 0)), ...((market?.customBets || []).map((b) => b.odds || 0)), 0)).toFixed(2) })] })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2 space-y-4", children: [isFallback && (_jsx("div", { className: "rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-sm p-3", children: "Showing demo content (backend is offline or market id is not valid)." })), (market ? (market.standardBets || market.customBets || [])
                                : sampleBets.map((sb) => ({ _id: sb.id, betType: sb.type, description: sb.desc, odds: sb.odds, likes: 0 }))).map((b, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 }, className: "glass rounded-2xl p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-semibold text-lg truncate", title: b.description, children: b.description }), _jsxs("div", { className: "mt-2 text-xs text-white/70", children: ["Odds: ", _jsx("span", { className: "font-semibold", children: Number(b.odds).toFixed(2) })] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(LikeButton, { betId: b._id, initialLikes: betLikes[b._id] ?? b.likes, onLiked: (newLikes, delta) => {
                                                    setBetLikes((prev) => ({ ...prev, [b._id]: newLikes }));
                                                    if (id && isValidObjectId(id)) {
                                                        // Adjust market likes in feed cache by the delta, not always +1
                                                        dispatch(api.util.updateQueryData('listMarkets', { page: 1, limit: 20 }, (draft) => {
                                                            const item = draft?.items?.find((it) => String(it._id || it.id) === String(id));
                                                            if (item)
                                                                item.likes = Math.max(0, (item.likes || 0) + (delta || 0));
                                                        }));
                                                    }
                                                } }) })] }) }, b._id))), _jsx(CollapsibleChat, { marketId: id })] }), _jsxs("div", { className: "md:col-span-1 space-y-4", children: [_jsx(BetSlip, { odds: Number((market?.standardBets?.[0] || market?.customBets?.[0])?.odds ?? sampleBets[0].odds), onPlace: place }), user && (_jsxs(_Fragment, { children: [_jsxs("button", { className: `w-full rounded-xl py-2 transition-colors ${marketJustLiked ? 'bg-brand-green text-black' : 'bg-white/10 hover:bg-white/15'}`, onClick: async () => {
                                            if (!id)
                                                return;
                                            // Instant optimistic feedback
                                            setMarketLiked((v) => !v);
                                            setMarketLikes((v) => Math.max(0, v + (marketLiked ? -1 : 1)));
                                            setMarketJustLiked(true);
                                            setTimeout(() => setMarketJustLiked(false), 350);
                                            if (isValidObjectId(id)) {
                                                dispatch(api.util.updateQueryData('listMarkets', { page: 1, limit: 20 }, (draft) => {
                                                    const item = draft?.items?.find((it) => String(it._id || it.id) === String(id));
                                                    if (item)
                                                        item.likes = Math.max(0, (item.likes || 0) + (marketLiked ? -1 : 1));
                                                }));
                                            }
                                            try {
                                                const res = await likeMarket({ marketId: id }).unwrap();
                                                if (typeof res?.likes === 'number') {
                                                    setMarketLikes(res.likes);
                                                    if (typeof res?.liked === 'boolean')
                                                        setMarketLiked(res.liked);
                                                    if (isValidObjectId(id)) {
                                                        dispatch(api.util.updateQueryData('listMarkets', { page: 1, limit: 20 }, (draft) => {
                                                            const item = draft?.items?.find((it) => String(it._id || it.id) === String(id));
                                                            if (item)
                                                                item.likes = res.likes;
                                                        }));
                                                    }
                                                }
                                            }
                                            catch {
                                                // keep optimistic value on failure
                                            }
                                        }, children: [marketLiked ? '💚' : '❤️', " Like this market ", marketLikes ? `(${marketLikes})` : ''] }), _jsx(ParlaySlip, { marketId: id, initialLegs: (market
                                            ? (market.standardBets || market.customBets || [])
                                            : sampleBets.map((sb) => ({ _id: sb.id, description: sb.desc, odds: sb.odds }))).map((b) => ({ betId: b._id, title: b.description, selection: 'yes', odds: b.odds })) })] }))] })] })] }));
}
