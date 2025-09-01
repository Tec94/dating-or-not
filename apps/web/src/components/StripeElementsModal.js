import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');
function PaymentForm({ onSuccess, onClose, clientSecret }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) {
            setError('Stripe has not loaded yet.');
            return;
        }
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError('Card element not found.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: cardElement,
                }
            });
            if (error) {
                setError(error.message || 'An error occurred');
            }
            else if (setupIntent && setupIntent.status === 'succeeded') {
                onSuccess();
            }
        }
        catch (err) {
            setError('An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-white/90 mb-2", children: "Card Details" }), _jsx("div", { className: "bg-white/10 rounded-lg p-4 border border-white/20", children: _jsx(CardElement, { options: {
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#ffffff',
                                        '::placeholder': {
                                            color: '#94a3b8',
                                        },
                                    },
                                    invalid: {
                                        color: '#ef4444',
                                    },
                                },
                            } }) })] }), error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm", children: error })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors font-medium", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", disabled: !stripe || loading, className: "flex-1 px-4 py-3 rounded-lg bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Adding..."] })) : ('Add Payment Method') })] })] }));
}
export default function StripeElementsModal({ isOpen, onClose, onSuccess, clientSecret }) {
    const handleSuccess = () => {
        onSuccess();
        onClose();
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50" }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, transition: { type: "spring", duration: 0.3 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "glass rounded-2xl p-6 w-full max-w-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Add Payment Method" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-lg hover:bg-white/10 transition-colors", "aria-label": "Close modal", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx(Elements, { stripe: stripePromise, children: _jsx(PaymentForm, { onSuccess: handleSuccess, onClose: onClose, clientSecret: clientSecret }) })] }) })] })) }));
}
