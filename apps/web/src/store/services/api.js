import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
async function baseQueryWithCsrf(args, api, extraOptions) {
    const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1];
    const headers = new Headers(args?.headers || {});
    if (csrf)
        headers.set('x-csrf-token', csrf);
    const rawBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';
    const baseUrl = String(rawBaseUrl).trim().replace(/\/$/, '');
    const raw = typeof args === 'string' ? { url: args } : { ...(args || {}) };
    const result = await fetchBaseQuery({ baseUrl, credentials: 'include' })({ ...raw, headers }, api, extraOptions);
    if (result.error?.status === 401) {
        // Attempt refresh once
        await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
        const retry = await fetchBaseQuery({ baseUrl, credentials: 'include' })({ ...raw, headers }, api, extraOptions);
        return retry;
    }
    return result;
}
const rawBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';
const baseUrl = String(rawBaseUrl).trim().replace(/\/$/, '');
export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithCsrf,
    tagTypes: ['User', 'Match', 'Market', 'Bet', 'Transaction'],
    endpoints: (builder) => ({
        // Auth
        register: builder.mutation({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),
        login: builder.mutation({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        }),
        // Users
        getUser: builder.query({
            query: (id) => `/users/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'User', id }],
        }),
        // Matches
        createMatch: builder.mutation({
            query: (body) => ({ url: '/matches', method: 'POST', body }),
            invalidatesTags: ['Match'],
        }),
        getMatch: builder.query({
            query: (id) => `/matches/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Match', id }],
        }),
        sendMessage: builder.mutation({
            query: ({ matchId, ...body }) => ({ url: `/matches/${matchId}/message`, method: 'POST', body }),
            invalidatesTags: (_r, _e, arg) => [{ type: 'Match', id: arg.matchId }],
        }),
        // Bets / Markets
        createMarket: builder.mutation({
            query: (body) => ({ url: '/bets/market/create', method: 'POST', body }),
            invalidatesTags: ['Market', 'Bet'],
        }),
        getMarket: builder.query({
            query: (id) => `/bets/market/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Market', id }],
        }),
        listMarkets: builder.query({
            query: ({ page = 1, limit = 20 } = {}) => `/bets/markets?page=${page}&limit=${limit}`,
            providesTags: ['Market'],
        }),
        listMarketsCursor: builder.query({
            query: ({ limit = 20, cursor, direction = 'forward' } = {}) => {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    direction
                });
                if (cursor)
                    params.append('cursor', cursor);
                return `/bets/markets/cursor?${params.toString()}`;
            },
            providesTags: ['Market'],
        }),
        placeBet: builder.mutation({
            query: ({ betId, ...body }) => ({ url: `/bets/${betId}/place`, method: 'POST', body }),
            invalidatesTags: ['Bet'],
        }),
        createParlay: builder.mutation({
            query: (body) => ({ url: '/bets/parlay', method: 'POST', body }),
            invalidatesTags: ['Bet'],
        }),
        // Likes
        likeBet: builder.mutation({
            query: ({ betId }) => ({ url: `/bets/${betId}/like`, method: 'POST' }),
            invalidatesTags: ['Market'],
        }),
        likeMarket: builder.mutation({
            query: ({ marketId }) => ({ url: `/bets/market/${marketId}/like`, method: 'POST' }),
            invalidatesTags: ['Market'],
        }),
        // Transactions
        getUserTransactions: builder.query({
            query: ({ userId, page = 1, limit = 50, type, status, from, to }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString()
                });
                if (type)
                    params.append('type', type);
                if (status)
                    params.append('status', status);
                if (from)
                    params.append('from', from);
                if (to)
                    params.append('to', to);
                return `/transactions/user/${userId}?${params.toString()}`;
            },
            providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
        }),
        getUserTransactionsCursor: builder.query({
            query: ({ userId, limit = 20, cursor, direction = 'forward', type, status, from, to }) => {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    direction
                });
                if (cursor)
                    params.append('cursor', cursor);
                if (type)
                    params.append('type', type);
                if (status)
                    params.append('status', status);
                if (from)
                    params.append('from', from);
                if (to)
                    params.append('to', to);
                return `/transactions/user/${userId}/cursor?${params.toString()}`;
            },
            providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
        }),
        exportTransactions: builder.query({
            query: ({ userId, type, status, from, to }) => {
                const params = new URLSearchParams();
                if (type)
                    params.append('type', type);
                if (status)
                    params.append('status', status);
                if (from)
                    params.append('from', from);
                if (to)
                    params.append('to', to);
                return {
                    url: `/transactions/user/${userId}/export?${params.toString()}`,
                    responseHandler: (response) => response.blob(),
                };
            },
        }),
        createSetupIntent: builder.mutation({
            query: () => ({ url: '/transactions/payment-methods/setup-intent', method: 'POST' }),
        }),
        listPaymentMethods: builder.query({
            query: () => `/transactions/payment-methods`,
        }),
        deletePaymentMethod: builder.mutation({
            query: (id) => ({ url: `/transactions/payment-methods/${id}`, method: 'DELETE' }),
        }),
        createDeposit: builder.mutation({
            query: (body) => ({ url: '/transactions/deposit', method: 'POST', body }),
        }),
        createWithdraw: builder.mutation({
            query: (body) => ({ url: '/transactions/withdraw', method: 'POST', body }),
        }),
        sendDemoWebhook: builder.mutation({
            query: (body) => ({ url: '/transactions/demo/webhook', method: 'POST', body, headers: { 'content-type': 'application/json' } }),
        }),
        // Discovery & Matching
        getDiscoveryFeed: builder.query({
            query: ({ limit = 20, maxDistance = 50, ageMin, ageMax } = {}) => {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    maxDistance: maxDistance.toString()
                });
                if (ageMin)
                    params.append('ageMin', ageMin.toString());
                if (ageMax)
                    params.append('ageMax', ageMax.toString());
                return `/discovery/feed?${params.toString()}`;
            },
            providesTags: ['User'],
        }),
        swipe: builder.mutation({
            query: (body) => ({ url: '/discovery/swipe', method: 'POST', body }),
            invalidatesTags: ['Match'],
        }),
        getActiveMatches: builder.query({
            query: () => '/discovery/matches',
            providesTags: ['Match'],
        }),
        getOddsPreview: builder.mutation({
            query: (body) => ({ url: '/discovery/odds-preview', method: 'POST', body }),
        }),
        // User Profile Updates
        updateUser: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
            invalidatesTags: (_r, _e, arg) => [{ type: 'User', id: arg.id }],
        }),
        uploadPhoto: builder.mutation({
            query: (formData) => ({ url: '/users/upload-photo', method: 'POST', body: formData }),
        }),
        // Seed Data
        createDummyMatches: builder.mutation({
            query: () => ({ url: '/seed/user-matches', method: 'POST' }),
            invalidatesTags: ['Match'],
        }),
        getWalletSummary: builder.query({
            query: (userId) => `/wallet/summary/${userId}`,
            providesTags: (_r, _e, userId) => [{ type: 'Transaction', id: userId }],
        }),
        getWalletPnl: builder.query({
            query: ({ userId, range }) => `/wallet/pnl/${userId}?range=${encodeURIComponent(range)}`,
            providesTags: (_r, _e, arg) => [{ type: 'Transaction', id: arg.userId }],
        }),
    }),
});
export const { useRegisterMutation, useLoginMutation, useGetUserQuery, useCreateMatchMutation, useGetMatchQuery, useSendMessageMutation, useCreateMarketMutation, useGetMarketQuery, useListMarketsQuery, usePlaceBetMutation, useGetUserTransactionsQuery, useGetUserTransactionsCursorQuery, useExportTransactionsQuery, useListMarketsCursorQuery, useGetDiscoveryFeedQuery, useSwipeMutation, useGetActiveMatchesQuery, useGetOddsPreviewMutation, useUpdateUserMutation, useUploadPhotoMutation, useCreateDummyMatchesMutation, useCreateSetupIntentMutation, useListPaymentMethodsQuery, useDeletePaymentMethodMutation, useCreateDepositMutation, useCreateWithdrawMutation, useSendDemoWebhookMutation, useCreateParlayMutation, useGetWalletSummaryQuery, useGetWalletPnlQuery, useLikeBetMutation, useLikeMarketMutation, } = api;
