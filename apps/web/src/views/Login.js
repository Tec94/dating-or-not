import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Page from '../components/Page';
import { useLoginMutation } from '../store/services/api';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/auth';
import { useNavigate } from 'react-router-dom';
export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('admin1234');
    const [login, { isLoading, error }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    async function onSubmit(e) {
        e.preventDefault();
        try {
            const res = await login({ email, password }).unwrap();
            // Server sets HttpOnly cookie; use returned user for client state
            dispatch(setUser({ id: res.user.id, username: res.user.username, role: res.user?.role || 'user', avatarUrl: 'https://i.pravatar.cc/40' }));
            navigate('/home');
        }
        catch (e) {
            console.error(e);
        }
    }
    return (_jsx(Page, { children: _jsxs("form", { onSubmit: onSubmit, className: "max-w-md mx-auto glass rounded-2xl p-6 space-y-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Log in" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-white/80", htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", className: "mt-1 w-full rounded bg-white/10 p-2", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-white/80", htmlFor: "password", children: "Password" }), _jsx("input", { id: "password", type: "password", className: "mt-1 w-full rounded bg-white/10 p-2", value: password, onChange: (e) => setPassword(e.target.value), required: true })] }), _jsx("button", { className: "w-full rounded bg-brand-pink py-2 font-semibold", disabled: isLoading, children: isLoading ? 'Signing in…' : 'Log in' }), error && _jsx("div", { className: "text-red-400 text-sm", children: "Login failed" })] }) }));
}
