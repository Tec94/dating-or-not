import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useGetUserTransactionsQuery } from '../store/services/api';
import Page from '../components/Page';
export default function Transactions() {
    const user = useSelector((s) => s.auth.user);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        from: '',
        to: ''
    });
    // Prepare query parameters
    const queryParams = useMemo(() => {
        if (!user?.id)
            return null;
        return {
            userId: user.id,
            page,
            limit: 20,
            ...(filters.type && { type: filters.type }),
            ...(filters.status && { status: filters.status }),
            ...(filters.from && { from: filters.from }),
            ...(filters.to && { to: filters.to })
        };
    }, [user?.id, page, filters]);
    const { data, isLoading, error } = useGetUserTransactionsQuery(queryParams, {
        skip: !queryParams
    });
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page when filters change
    };
    const handleExportCSV = async () => {
        if (!user?.id)
            return;
        try {
            const exportParams = {
                userId: user.id,
                ...(filters.type && { type: filters.type }),
                ...(filters.status && { status: filters.status }),
                ...(filters.from && { from: filters.from }),
                ...(filters.to && { to: filters.to })
            };
            // Since RTK Query doesn't handle blob downloads well, use fetch directly
            const params = new URLSearchParams();
            if (exportParams.type)
                params.append('type', exportParams.type);
            if (exportParams.status)
                params.append('status', exportParams.status);
            if (exportParams.from)
                params.append('from', exportParams.from);
            if (exportParams.to)
                params.append('to', exportParams.to);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/transactions/user/${user.id}/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        }
        catch (error) {
            console.error('Failed to export transactions:', error);
        }
    };
    const formatAmount = (amountUSD, amountTokens) => {
        if (amountUSD > 0)
            return `$${amountUSD.toFixed(2)}`;
        if (amountTokens > 0)
            return `${amountTokens} tokens`;
        return '—';
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'deposit': return '↓';
            case 'withdrawal': return '↑';
            case 'betStake': return '🎯';
            case 'betPayout': return '💰';
            case 'tokenPurchase': return '🪙';
            default: return '—';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'pending': return 'text-yellow-400';
            case 'failed': return 'text-red-400';
            default: return 'text-white/60';
        }
    };
    if (!user) {
        return (_jsx(Page, { title: "Transactions", children: _jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-white/60", children: "Please log in to view your transactions." }) }) }));
    }
    return (_jsx(Page, { title: "Transactions", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsx(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: "glass rounded-2xl p-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-4 items-end", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 flex-1", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/70 mb-2", children: "Type" }), _jsxs("select", { value: filters.type, onChange: (e) => handleFilterChange('type', e.target.value), className: "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", "aria-label": "Filter by transaction type", children: [_jsx("option", { value: "", children: "All Types" }), _jsx("option", { value: "deposit", children: "Deposit" }), _jsx("option", { value: "withdrawal", children: "Withdrawal" }), _jsx("option", { value: "betStake", children: "Bet Stake" }), _jsx("option", { value: "betPayout", children: "Bet Payout" }), _jsx("option", { value: "tokenPurchase", children: "Token Purchase" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/70 mb-2", children: "Status" }), _jsxs("select", { value: filters.status, onChange: (e) => handleFilterChange('status', e.target.value), className: "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", "aria-label": "Filter by transaction status", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "failed", children: "Failed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/70 mb-2", children: "From Date" }), _jsx("input", { type: "date", value: filters.from, onChange: (e) => handleFilterChange('from', e.target.value), className: "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", "aria-label": "Filter from date" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/70 mb-2", children: "To Date" }), _jsx("input", { type: "date", value: filters.to, onChange: (e) => handleFilterChange('to', e.target.value), className: "w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none", "aria-label": "Filter to date" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => {
                                            setFilters({ type: '', status: '', from: '', to: '' });
                                            setPage(1);
                                        }, className: "px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium", children: "Clear Filters" }), _jsx("button", { onClick: handleExportCSV, className: "px-4 py-2 rounded-lg bg-brand-green text-black hover:bg-brand-green/90 transition-colors font-medium", children: "Export CSV" })] })] }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, className: "glass rounded-2xl overflow-hidden", children: [isLoading && (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" }), _jsx("p", { className: "mt-2 text-white/60", children: "Loading transactions..." })] })), error && (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-red-400", children: "Failed to load transactions. Please try again." }) })), data && (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-white/5 border-b border-white/10", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "Type" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "Amount" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "Status" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "Provider" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "Date" }), _jsx("th", { className: "px-6 py-4 text-left text-sm font-medium text-white/70", children: "ID" })] }) }), _jsx("tbody", { className: "divide-y divide-white/10", children: data.items.map((transaction) => (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "hover:bg-white/5 transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-lg", children: getTypeIcon(transaction.type) }), _jsx("span", { className: "font-medium capitalize", children: transaction.type.replace(/([A-Z])/g, ' $1').trim() })] }) }), _jsx("td", { className: "px-6 py-4 font-medium", children: formatAmount(transaction.amountUSD, transaction.amountTokens) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)} bg-current/10`, children: transaction.status }) }), _jsx("td", { className: "px-6 py-4 text-white/60", children: transaction.paymentProvider || '—' }), _jsx("td", { className: "px-6 py-4 text-white/60", children: new Date(transaction.timestamp).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 text-white/40 text-xs font-mono", children: transaction.externalId || transaction._id.slice(-8) })] }, transaction._id))) })] }) }), data.items.length === 0 && (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-white/60", children: "No transactions found with the current filters." }) })), data.total > data.limit && (_jsxs("div", { className: "px-6 py-4 border-t border-white/10 flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-white/60", children: ["Showing ", Math.min((data.page - 1) * data.limit + 1, data.total), " to ", Math.min(data.page * data.limit, data.total), " of ", data.total, " transactions"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage(page - 1), disabled: page <= 1, className: "px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Previous" }), _jsxs("span", { className: "px-3 py-1 bg-white/20 rounded", children: ["Page ", data.page, " of ", Math.ceil(data.total / data.limit)] }), _jsx("button", { onClick: () => setPage(page + 1), disabled: page >= Math.ceil(data.total / data.limit), className: "px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Next" })] })] }))] }))] })] }) }));
}
