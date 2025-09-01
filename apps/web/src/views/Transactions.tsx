import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetUserTransactionsQuery, useExportTransactionsQuery } from '../store/services/api'
import Page from '../components/Page'

type TransactionType = 'deposit' | 'withdrawal' | 'betStake' | 'betPayout' | 'tokenPurchase' | ''
type TransactionStatus = 'pending' | 'completed' | 'failed' | ''

interface Transaction {
  _id: string
  type: TransactionType
  status: TransactionStatus
  amountUSD: number
  amountTokens: number
  paymentProvider?: string
  externalId?: string
  timestamp: string
}

export default function Transactions() {
  const user = useSelector((s: RootState) => s.auth.user)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    type: '' as TransactionType,
    status: '' as TransactionStatus,
    from: '',
    to: ''
  })

  // Prepare query parameters
  const queryParams = useMemo(() => {
    if (!user?.id) return null
    return {
      userId: user.id,
      page,
      limit: 20,
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to })
    }
  }, [user?.id, page, filters])

  const { data, isLoading, error } = useGetUserTransactionsQuery(queryParams!, {
    skip: !queryParams
  })

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleExportCSV = async () => {
    if (!user?.id) return
    
    try {
      const exportParams = {
        userId: user.id,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to })
      }
      
      // Since RTK Query doesn't handle blob downloads well, use fetch directly
      const params = new URLSearchParams()
      if (exportParams.type) params.append('type', exportParams.type)
      if (exportParams.status) params.append('status', exportParams.status)
      if (exportParams.from) params.append('from', exportParams.from)
      if (exportParams.to) params.append('to', exportParams.to)
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${apiUrl}/transactions/user/${user.id}/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'transactions.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export transactions:', error)
    }
  }

  const formatAmount = (amountUSD: number, amountTokens: number) => {
    if (amountUSD > 0) return `$${amountUSD.toFixed(2)}`
    if (amountTokens > 0) return `${amountTokens} tokens`
    return '—'
  }

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return '↓'
      case 'withdrawal': return '↑'
      case 'betStake': return '🎯'
      case 'betPayout': return '💰'
      case 'tokenPurchase': return '🪙'
      default: return '—'
    }
  }

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  if (!user) {
    return (
      <Page title="Transactions">
        <div className="text-center py-12">
          <p className="text-white/60">Please log in to view your transactions.</p>
        </div>
      </Page>
    )
  }

  return (
    <Page title="Transactions">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                  aria-label="Filter by transaction type"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="betStake">Bet Stake</option>
                  <option value="betPayout">Bet Payout</option>
                  <option value="tokenPurchase">Token Purchase</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                  aria-label="Filter by transaction status"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                  aria-label="Filter from date"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-brand-pink focus:outline-none"
                  aria-label="Filter to date"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFilters({ type: '', status: '', from: '', to: '' })
                  setPage(1)
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-lg bg-brand-green text-black hover:bg-brand-green/90 transition-colors font-medium"
              >
                Export CSV
              </button>
            </div>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {isLoading && (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="mt-2 text-white/60">Loading transactions...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <p className="text-red-400">Failed to load transactions. Please try again.</p>
            </div>
          )}

          {data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Provider</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/70">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {data.items.map((transaction: Transaction) => (
                      <motion.tr
                        key={transaction._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon(transaction.type)}</span>
                            <span className="font-medium capitalize">{transaction.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {formatAmount(transaction.amountUSD, transaction.amountTokens)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)} bg-current/10`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/60">
                          {transaction.paymentProvider || '—'}
                        </td>
                        <td className="px-6 py-4 text-white/60">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-white/40 text-xs font-mono">
                          {transaction.externalId || transaction._id.slice(-8)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.items.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-white/60">No transactions found with the current filters.</p>
                </div>
              )}

              {/* Pagination */}
              {data.total > data.limit && (
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    Showing {Math.min((data.page - 1) * data.limit + 1, data.total)} to {Math.min(data.page * data.limit, data.total)} of {data.total} transactions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-white/20 rounded">
                      Page {data.page} of {Math.ceil(data.total / data.limit)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(data.total / data.limit)}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </Page>
  )
}
