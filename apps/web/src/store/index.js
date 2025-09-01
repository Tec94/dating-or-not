import { configureStore } from '@reduxjs/toolkit';
import { api } from './services/api';
import auth from './auth';
export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        auth,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
    preloadedState: (() => {
        try {
            const raw = localStorage.getItem('auth');
            return raw ? { auth: JSON.parse(raw) } : undefined;
        }
        catch {
            return undefined;
        }
    })(),
});
// Persist auth on change
store.subscribe(() => {
    try {
        const state = store.getState();
        localStorage.setItem('auth', JSON.stringify({ user: state.auth.user }));
    }
    catch { }
});
window.store = store;
