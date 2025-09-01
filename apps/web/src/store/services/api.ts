import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

async function baseQueryWithCsrf(args: any, api: any, extraOptions: any) {
  const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
  const headers = new Headers((args?.headers as any) || {})
  if (csrf) headers.set('x-csrf-token', csrf)
  const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'
  const baseUrl = String(rawBaseUrl).trim().replace(/\/$/, '')
  const raw = typeof args === 'string' ? { url: args } : { ...(args || {}) }
  const result = await fetchBaseQuery({ baseUrl, credentials: 'include' })({ ...raw, headers }, api, extraOptions)
  if ((result as any).error?.status === 401) {
    // Attempt refresh once
    await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', credentials: 'include' })
    const retry = await fetchBaseQuery({ baseUrl, credentials: 'include' })({ ...raw, headers }, api, extraOptions)
    return retry
  }
  return result
}

const rawBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'
const baseUrl = String(rawBaseUrl).trim().replace(/\/$/, '')

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithCsrf as any,
  tagTypes: ['User', 'Match', 'Market', 'Bet', 'Transaction'],
  endpoints: (builder) => ({
    // Auth
    register: builder.mutation<{ id: string; username: string; email: string }, { username: string; email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<{ user: { id: string; username: string; email: string } }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    // Users
    getUser: builder.query<any, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    // Matches
    createMatch: builder.mutation<any, { userA: string; userB: string }>({
      query: (body) => ({ url: '/matches', method: 'POST', body }),
      invalidatesTags: ['Match'],
    }),
    getMatch: builder.query<any, string>({
      query: (id) => `/matches/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Match', id }],
    }),
    sendMessage: builder.mutation<any, { matchId: string; messageText: string }>({
      query: ({ matchId, ...body }) => ({ url: `/matches/${matchId}/message`, method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Match', id: arg.matchId }],
    }),

    // Bets / Markets
    createMarket: builder.mutation<any, { matchId: string }>({
      query: (body) => ({ url: '/bets/market/create', method: 'POST', body }),
      invalidatesTags: ['Market', 'Bet'],
    }),
    getMarket: builder.query<any, string>({
      query: (id) => `/bets/market/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Market', id }],
    }),
    listMarkets: builder.query<{ items: any[]; page: number; limit: number }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => `/bets/markets?page=${page}&limit=${limit}`,
      providesTags: ['Market'],
    }),
    listMarketsCursor: builder.query<{ items: any[]; hasMore: boolean; nextCursor: string | null; prevCursor: string | null }, { limit?: number; cursor?: string; direction?: 'forward' | 'backward' }>({
      query: ({ limit = 20, cursor, direction = 'forward' } = {}) => {
        const params = new URLSearchParams({ 
          limit: limit.toString(),
          direction 
        })
        if (cursor) params.append('cursor', cursor)
        return `/bets/markets/cursor?${params.toString()}`
      },
      providesTags: ['Market'],
    }),
    placeBet: builder.mutation<any, { betId: string; stakeTokens?: number; stakeUSD?: number }>({
      query: ({ betId, ...body }) => ({ url: `/bets/${betId}/place`, method: 'POST', body }),
      invalidatesTags: ['Bet'],
    }),
    createParlay: builder.mutation<any, { legs: { betId: string; selection: 'yes'|'no'|'over'|'under' }[]; stakeUSD: number }>({
      query: (body) => ({ url: '/bets/parlay', method: 'POST', body }),
      invalidatesTags: ['Bet'],
    }),

    // Likes
    likeBet: builder.mutation<{ likes: number; liked?: boolean }, { betId: string }>({
      query: ({ betId }) => ({ url: `/bets/${betId}/like`, method: 'POST' }),
      invalidatesTags: ['Market'],
    }),
    likeMarket: builder.mutation<{ likes: number; liked?: boolean }, { marketId: string }>({
      query: ({ marketId }) => ({ url: `/bets/market/${marketId}/like`, method: 'POST' }),
      invalidatesTags: ['Market'],
    }),

    // Transactions
    getUserTransactions: builder.query<{ items: any[]; total: number; page: number; limit: number }, { userId: string; page?: number; limit?: number; type?: string; status?: string; from?: string; to?: string }>({
      query: ({ userId, page = 1, limit = 50, type, status, from, to }) => {
        const params = new URLSearchParams({ 
          page: page.toString(), 
          limit: limit.toString() 
        })
        if (type) params.append('type', type)
        if (status) params.append('status', status)
        if (from) params.append('from', from)
        if (to) params.append('to', to)
        return `/transactions/user/${userId}?${params.toString()}`
      },
      providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
    }),
    getUserTransactionsCursor: builder.query<{ items: any[]; hasMore: boolean; nextCursor: string | null; prevCursor: string | null }, { userId: string; limit?: number; cursor?: string; direction?: 'forward' | 'backward'; type?: string; status?: string; from?: string; to?: string }>({
      query: ({ userId, limit = 20, cursor, direction = 'forward', type, status, from, to }) => {
        const params = new URLSearchParams({ 
          limit: limit.toString(),
          direction 
        })
        if (cursor) params.append('cursor', cursor)
        if (type) params.append('type', type)
        if (status) params.append('status', status)
        if (from) params.append('from', from)
        if (to) params.append('to', to)
        return `/transactions/user/${userId}/cursor?${params.toString()}`
      },
      providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
    }),
    exportTransactions: builder.query<Blob, { userId: string; type?: string; status?: string; from?: string; to?: string }>({
      query: ({ userId, type, status, from, to }) => {
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        if (status) params.append('status', status)
        if (from) params.append('from', from)
        if (to) params.append('to', to)
        return {
          url: `/transactions/user/${userId}/export?${params.toString()}`,
          responseHandler: (response: Response) => response.blob(),
        }
      },
    }),
    createSetupIntent: builder.mutation<{ clientSecret: string }, void>({
      query: () => ({ url: '/transactions/payment-methods/setup-intent', method: 'POST' }),
    }),
    listPaymentMethods: builder.query<{ items: { id: string; brand?: string; last4?: string }[] }, void>({
      query: () => `/transactions/payment-methods`,
    }),
    deletePaymentMethod: builder.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/transactions/payment-methods/${id}`, method: 'DELETE' }),
    }),
    createDeposit: builder.mutation<any, { amountUSD: number }>({
      query: (body) => ({ url: '/transactions/deposit', method: 'POST', body }),
    }),
    createWithdraw: builder.mutation<any, { amountUSD: number }>({
      query: (body) => ({ url: '/transactions/withdraw', method: 'POST', body }),
    }),
    sendDemoWebhook: builder.mutation<any, { type: 'demo.deposit.completed'|'demo.withdrawal.completed'; data: { userId: string; amountUSD: number; id?: string } }>({
      query: (body) => ({ url: '/transactions/demo/webhook', method: 'POST', body, headers: { 'content-type': 'application/json' } }),
    }),

    // Discovery & Matching
    getDiscoveryFeed: builder.query<{ users: any[]; count: number; hasMore: boolean }, { limit?: number; maxDistance?: number; ageMin?: number; ageMax?: number }>({
      query: ({ limit = 20, maxDistance = 50, ageMin, ageMax } = {}) => {
        const params = new URLSearchParams({ 
          limit: limit.toString(),
          maxDistance: maxDistance.toString()
        })
        if (ageMin) params.append('ageMin', ageMin.toString())
        if (ageMax) params.append('ageMax', ageMax.toString())
        return `/discovery/feed?${params.toString()}`
      },
      providesTags: ['User'],
    }),
    swipe: builder.mutation<{ success: boolean; matched: boolean; message: string; match?: any }, { targetUserId: string; action: 'like' | 'pass' }>({
      query: (body) => ({ url: '/discovery/swipe', method: 'POST', body }),
      invalidatesTags: ['Match'],
    }),
    getActiveMatches: builder.query<{ matches: any[]; count: number }, void>({
      query: () => '/discovery/matches',
      providesTags: ['Match'],
    }),
    getOddsPreview: builder.mutation<{ personalizedOdds: number; explanation: string; confidence: number; fairnessScore: number; factors: any }, { matchId: string; betType: string }>({
      query: (body) => ({ url: '/discovery/odds-preview', method: 'POST', body }),
    }),

    // User Profile Updates
    updateUser: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'User', id: arg.id }],
    }),
    uploadPhoto: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({ url: '/users/upload-photo', method: 'POST', body: formData }),
    }),

    // Seed Data
    createDummyMatches: builder.mutation<{ ok: boolean; message: string; matches: string[]; users: Array<{id: string; username: string}> }, void>({
      query: () => ({ url: '/seed/user-matches', method: 'POST' }),
      invalidatesTags: ['Match'],
    }),
    getWalletSummary: builder.query<any, string>({
      query: (userId) => `/wallet/summary/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'Transaction', id: userId }],
    }),
    getWalletPnl: builder.query<{ range: string; points: { t: string; v: number }[] }, { userId: string; range: string }>({
      query: ({ userId, range }) => `/wallet/pnl/${userId}?range=${encodeURIComponent(range)}`,
      providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetUserQuery,
  useCreateMatchMutation,
  useGetMatchQuery,
  useSendMessageMutation,
  useCreateMarketMutation,
  useGetMarketQuery,
  useListMarketsQuery,
  usePlaceBetMutation,
  useGetUserTransactionsQuery,
  useGetUserTransactionsCursorQuery,
  useExportTransactionsQuery,
  useListMarketsCursorQuery,
  useGetDiscoveryFeedQuery,
  useSwipeMutation,
  useGetActiveMatchesQuery,
  useGetOddsPreviewMutation,
  useUpdateUserMutation,
  useUploadPhotoMutation,
  useCreateDummyMatchesMutation,
  useCreateSetupIntentMutation,
  useListPaymentMethodsQuery,
  useDeletePaymentMethodMutation,
  useCreateDepositMutation,
  useCreateWithdrawMutation,
  useSendDemoWebhookMutation,
  useCreateParlayMutation,
  useGetWalletSummaryQuery,
  useGetWalletPnlQuery,
  useLikeBetMutation,
  useLikeMarketMutation,
} = api


