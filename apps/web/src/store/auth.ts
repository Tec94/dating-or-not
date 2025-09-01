import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = { id: string; username: string; role?: 'user'|'admin'; avatarUrl?: string }

type AuthState = {
  user: AuthUser | null
}

const initialState: AuthState = { user: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
  },
})

export const { setUser } = authSlice.actions
export default authSlice.reducer


