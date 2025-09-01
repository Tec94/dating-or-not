import { configureStore } from '@reduxjs/toolkit'
import { api } from './services/api'
import auth from './auth'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
  preloadedState: (() => {
    try {
      const raw = localStorage.getItem('auth')
      return raw ? { auth: JSON.parse(raw) } : undefined
    } catch { return undefined }
  })(),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Persist auth on change
store.subscribe(() => {
  try {
    const state = store.getState() as any
    localStorage.setItem('auth', JSON.stringify({ user: state.auth.user }))
  } catch {}
})

// Expose store for simple access in router guards/menu
;(window as any).store = store


