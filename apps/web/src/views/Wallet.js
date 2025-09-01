import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import PnLChart from '../components/PnLChart';
import StripeElementsModal from '../components/StripeElementsModal';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetWalletSummaryQuery, useCreateDepositMutation, useCreateWithdrawMutation, useSendDemoWebhookMutation, useCreateSetupIntentMutation, useListPaymentMethodsQuery, useDeletePaymentMethodMutation } from '../store/services/api';
import { skipToken } from '@reduxjs/toolkit/query';
export default function Wallet() {
    const user = useSelector((s) => s.auth.user);
    const navigate = useNavigate();
    if (!user) {
        return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("div", { className: "text-sm text-white/60", children: "USD balance" }), _jsx("div", { className: "text-4xl font-extrabold", children: "\u2014" }), _jsx("div", { className: "mt-6", children: _jsx("button", { className: "px-4 py-2 rounded bg-brand-pink", onClick: () => navigate('/login'), children: "Log in to view wallet" }) })] }), _jsxs("div", { className: "glass rounded-2xl p-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "PnL" }), _jsx("div", { className: "text-white/60 text-sm", children: "Log in to see your performance" })] })] }));
    }
    const userId = user.id;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    const { data: summary } = useGetWalletSummaryQuery(isObjectId ? userId : skipToken);
    const [createDeposit, { isLoading: depLoading }] = useCreateDepositMutation();
    const [createWithdraw, { isLoading: wLoading }] = useCreateWithdrawMutation();
    const [amount, setAmount] = useState(50);
    const [modal, setModal] = useState(null);
    const [paymentMethodModal, setPaymentMethodModal] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [sendWebhook] = useSendDemoWebhookMutation();
    const [createSetupIntent] = useCreateSetupIntentMutation();
    const { data: pms, refetch: refetchPms } = useListPaymentMethodsQuery();
    const [deletePm] = useDeletePaymentMethodMutation();
    async function doDeposit(amount) {
        try {
            await createDeposit({ amountUSD: amount }).unwrap();
            // simulate webhook success in test mode
            await sendWebhook({ type: 'demo.deposit.completed', data: { userId, amountUSD: amount, id: `demo_${Date.now()}` } }).unwrap();
            // Invalidate cached wallet summary and PnL immediately
            try {
                const { api } = await import('../store/services/api');
                const { store } = await import('../store');
                store.dispatch(api.util.invalidateTags([{ type: 'Transaction', id: userId }]));
            }
            catch { }
        }
        catch { }
    }
    async function doWithdraw(amount) {
        try {
            await createWithdraw({ amountUSD: amount }).unwrap();
            // simulate webhook
            await sendWebhook({ type: 'demo.withdrawal.completed', data: { userId, amountUSD: amount, id: `demo_${Date.now()}` } }).unwrap();
            try {
                const { api } = await import('../store/services/api');
                const { store } = await import('../store');
                store.dispatch(api.util.invalidateTags([{ type: 'Transaction', id: userId }]));
            }
            catch { }
        }
        catch { }
    }
    async function handleAddPaymentMethod() {
        try {
            const si = await createSetupIntent().unwrap();
            setClientSecret(si.clientSecret);
            setPaymentMethodModal(true);
        }
        catch (error) {
            console.error('Failed to create setup intent:', error);
        }
    }
    function handlePaymentMethodSuccess() {
        refetchPms();
    }
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "glass rounded-2xl p-6 lg:col-span-1", children: [_jsx("div", { className: "text-sm text-white/60", children: "USD balance" }), _jsxs("div", { className: "text-4xl font-extrabold", children: ["$", (summary?.balanceUSD ?? 125).toFixed(2)] }), _jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 items-center", children: [_jsx("button", { className: "px-4 py-2 rounded bg-brand-green text-black font-semibold", onClick: () => setModal('deposit'), children: "Deposit" }), _jsx("button", { className: "px-4 py-2 rounded bg-white/10", onClick: () => setModal('withdraw'), children: "Withdraw" }), _jsx("button", { className: "px-4 py-2 rounded bg-white/10 col-span-2 hover:bg-white/20 transition-colors font-medium", onClick: handleAddPaymentMethod, children: "Add payment method" })] }), _jsxs("div", { className: "mt-4 text-sm", children: [_jsx("div", { className: "text-white/70 mb-1", children: "Saved payment methods" }), _jsxs("div", { className: "space-y-2", children: [(pms?.items || []).map((pm) => (_jsxs("div", { className: "flex items-center justify-between bg-white/5 rounded px-3 py-2", children: [_jsxs("div", { children: [pm.brand || 'card', " \u2022\u2022\u2022\u2022 ", pm.last4] }), _jsx("button", { className: "px-2 py-1 rounded bg-white/10", onClick: async () => { await deletePm(pm.id).unwrap(); refetchPms(); }, children: "Delete" })] }, pm.id))), (pms?.items || []).length === 0 && _jsx("div", { className: "text-white/50", children: "No payment methods" })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "rounded-lg bg-white/5 p-3", children: [_jsx("div", { className: "text-white/60", children: "Total deposits" }), _jsxs("div", { className: "text-lg font-semibold", children: ["$", (summary?.totalDepositsUSD ?? 400).toFixed(0)] })] }), _jsxs("div", { className: "rounded-lg bg-white/5 p-3", children: [_jsx("div", { className: "text-white/60", children: "Total withdrawals" }), _jsxs("div", { className: "text-lg font-semibold", children: ["$", (summary?.totalWithdrawalsUSD ?? 275).toFixed(0)] })] }), _jsxs("div", { className: "rounded-lg bg-white/5 p-3 col-span-2", children: [_jsx("div", { className: "text-white/60", children: "Lifetime PnL" }), _jsxs("div", { className: "text-lg font-semibold text-brand-green", children: ["$", (summary?.lifetimePnlUSD ?? 125).toFixed(0)] })] })] }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: () => navigate('/transactions'), className: "w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium", children: "View transaction history" }) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "glass rounded-2xl p-6 lg:col-span-2", children: [_jsx("h3", { className: "text-lg font-semibold", children: "PnL" }), _jsx(PnLChart, {})] }), _jsx(AnimatePresence, { children: !!modal && (_jsxs(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children: [_jsx("div", { className: "absolute inset-0 bg-black/60", onClick: () => setModal(null) }), _jsxs(motion.div, { initial: { y: 30, scale: 0.96, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, exit: { y: 10, scale: 0.98, opacity: 0 }, transition: { type: 'spring', stiffness: 300, damping: 28 }, className: "relative glass rounded-2xl p-6 w-[min(92vw,420px)]", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: modal === 'deposit' ? 'Deposit funds' : 'Withdraw funds' }), modal === 'withdraw' && (_jsx("div", { className: "text-xs text-white/70 mb-2", children: "Minimum withdrawal is $10." })), _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: [25, 50, 100, 250].map((v) => (_jsxs("button", { onClick: () => setAmount(v), className: `px-3 py-1 rounded ${amount === v ? 'bg-white/20' : 'bg-white/10'}`, children: ["$", v] }, v))) }), _jsx("input", { type: "number", min: modal === 'withdraw' ? 10 : 1, step: 1, value: amount, onChange: (e) => setAmount(Math.max(modal === 'withdraw' ? 10 : 1, Number(e.target.value))), className: "w-full rounded bg-white/10 p-2 mb-4", placeholder: "Amount (USD)" }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { className: "px-4 py-2 rounded bg-white/10", onClick: () => setModal(null), children: "Cancel" }), modal === 'deposit' ? (_jsx("button", { className: "px-4 py-2 rounded bg-brand-green text-black font-semibold", disabled: depLoading || amount <= 0, onClick: async () => { await doDeposit(amount); setModal(null); }, children: "Deposit" })) : (_jsx("button", { className: "px-4 py-2 rounded bg-white/20", disabled: wLoading || amount < 10, onClick: async () => { await doWithdraw(amount); setModal(null); }, children: "Withdraw" }))] })] })] })) }), _jsx(StripeElementsModal, { isOpen: paymentMethodModal, onClose: () => setPaymentMethodModal(false), onSuccess: handlePaymentMethodSuccess, clientSecret: clientSecret })] }));
}
