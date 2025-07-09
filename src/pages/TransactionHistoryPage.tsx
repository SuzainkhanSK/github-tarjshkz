import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Coins,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileText,
  Share2,
  Printer,
  X,
  Plus,
  Minus,
  BarChart3,
  PieChart,
  List,
  Grid,
  CalendarDays,
  RefreshCw,
  Target,
  Trophy,
  Gift,
  Gamepad2,
  Users,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  user_id: string
  type: 'earn' | 'redeem'
  points: number
  description: string
  task_type?: string
  created_at: string
}

interface FilterOptions {
  type: 'all' | 'earn' | 'redeem'
  taskType: 'all' | 'signup' | 'spin_win' | 'scratch_earn' | 'telegram' | 'youtube' | 'instagram' | 'twitter'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  pointsRange: { min: number; max: number }
  customDateRange: { start: string; end: string }
}

interface ChartData {
  date: string
  earned: number
  redeemed: number
  net: number
}

const TransactionHistoryPage: React.FC = () => {
  const { user, userProfile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list')
  const [sortBy, setSortBy] = useState<'date' | 'points' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [showCharts, setShowCharts] = useState(true)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    taskType: 'all',
    dateRange: 'all',
    pointsRange: { min: 0, max: 10000 },
    customDateRange: { start: '', end: '' }
  })

  useEffect(() => {
    if (user?.id) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    if (!user?.id || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast.error('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!transaction.description.toLowerCase().includes(searchLower) &&
            !transaction.type.toLowerCase().includes(searchLower) &&
            !(transaction.task_type?.toLowerCase().includes(searchLower))) {
          return false
        }
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false
      }

      // Task type filter
      if (filters.taskType !== 'all' && transaction.task_type !== filters.taskType) {
        return false
      }

      // Points range filter
      if (transaction.points < filters.pointsRange.min || transaction.points > filters.pointsRange.max) {
        return false
      }

      // Date range filter
      const transactionDate = new Date(transaction.created_at)
      const now = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          if (transactionDate.toDateString() !== now.toDateString()) return false
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (transactionDate < weekAgo) return false
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (transactionDate < monthAgo) return false
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          if (transactionDate < yearAgo) return false
          break
        case 'custom':
          if (filters.customDateRange.start && transactionDate < new Date(filters.customDateRange.start)) return false
          if (filters.customDateRange.end && transactionDate > new Date(filters.customDateRange.end)) return false
          break
      }

      return true
    })

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'points':
          comparison = a.points - b.points
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, filters, sortBy, sortOrder])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEarned = filteredTransactions
      .filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.points, 0)
    
    const totalRedeemed = filteredTransactions
      .filter(t => t.type === 'redeem')
      .reduce((sum, t) => sum + t.points, 0)
    
    const netPoints = totalEarned - totalRedeemed
    const totalTransactions = filteredTransactions.length
    
    const avgTransaction = totalTransactions > 0 ? 
      filteredTransactions.reduce((sum, t) => sum + t.points, 0) / totalTransactions : 0

    return {
      totalEarned,
      totalRedeemed,
      netPoints,
      totalTransactions,
      avgTransaction
    }
  }, [filteredTransactions])

  // Generate chart data
  const chartData = useMemo(() => {
    const data: { [key: string]: ChartData } = {}
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0]
      
      if (!data[date]) {
        data[date] = { date, earned: 0, redeemed: 0, net: 0 }
      }
      
      if (transaction.type === 'earn') {
        data[date].earned += transaction.points
      } else {
        data[date].redeemed += transaction.points
      }
      
      data[date].net = data[date].earned - data[date].redeemed
    })
    
    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredTransactions])

  const getTaskTypeIcon = (taskType?: string) => {
    switch (taskType) {
      case 'signup': return <Star className="h-4 w-4" />
      case 'spin_win': return <Target className="h-4 w-4" />
      case 'scratch_earn': return <Trophy className="h-4 w-4" />
      case 'telegram': return <Users className="h-4 w-4" />
      case 'youtube': return <Gamepad2 className="h-4 w-4" />
      default: return <Gift className="h-4 w-4" />
    }
  }

  const getTaskTypeColor = (taskType?: string) => {
    switch (taskType) {
      case 'signup': return 'text-yellow-400'
      case 'spin_win': return 'text-blue-400'
      case 'scratch_earn': return 'text-purple-400'
      case 'telegram': return 'text-blue-500'
      case 'youtube': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Points', 'Description', 'Task Type']
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type,
        t.points,
        `"${t.description}"`,
        t.task_type || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Transactions exported to CSV!')
  }

  const exportToPDF = () => {
    // In a real implementation, you would use a PDF library like jsPDF
    toast.info('PDF export feature coming soon!')
  }

  const handleBulkAction = (action: 'export' | 'delete') => {
    if (selectedTransactions.length === 0) {
      toast.error('Please select transactions first')
      return
    }

    switch (action) {
      case 'export':
        exportToCSV()
        break
      case 'delete':
        toast.info('Bulk delete feature coming soon!')
        break
    }
  }

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  const selectAllTransactions = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([])
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id))
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading transaction history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Transaction History
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Track your earnings, spending, and point balance over time
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <span className="text-green-400 text-sm font-medium">+{stats.totalEarned}</span>
          </div>
          <h3 className="text-white font-semibold">Total Earned</h3>
          <p className="text-gray-300 text-sm">{filteredTransactions.filter(t => t.type === 'earn').length} transactions</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-8 w-8 text-red-400" />
            <span className="text-red-400 text-sm font-medium">-{stats.totalRedeemed}</span>
          </div>
          <h3 className="text-white font-semibold">Total Redeemed</h3>
          <p className="text-gray-300 text-sm">{filteredTransactions.filter(t => t.type === 'redeem').length} transactions</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <Coins className="h-8 w-8 text-yellow-400" />
            <span className={`text-sm font-medium ${stats.netPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.netPoints >= 0 ? '+' : ''}{stats.netPoints}
            </span>
          </div>
          <h3 className="text-white font-semibold">Net Points</h3>
          <p className="text-gray-300 text-sm">Current balance: {userProfile?.points || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <History className="h-8 w-8 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">{stats.totalTransactions}</span>
          </div>
          <h3 className="text-white font-semibold">Total Transactions</h3>
          <p className="text-gray-300 text-sm">Avg: {Math.round(stats.avgTransaction)} points</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 text-purple-400" />
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
            >
              {showCharts ? 'Hide' : 'Show'}
            </button>
          </div>
          <h3 className="text-white font-semibold">Analytics</h3>
          <p className="text-gray-300 text-sm">Charts & insights</p>
        </div>
      </motion.div>

      {/* Charts Section */}
      <AnimatePresence>
        {showCharts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Transaction Trends</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Interactive charts coming soon!</p>
                <p className="text-gray-500 text-sm">Will show earnings vs spending over time</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-400/30 transition-colors"
            >
              <Download className="h-5 w-5" />
              Export
            </button>

            <button
              onClick={fetchTransactions}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-400/30 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="earn">Earned</option>
                    <option value="redeem">Redeemed</option>
                  </select>
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
                  <select
                    value={filters.taskType}
                    onChange={(e) => setFilters(prev => ({ ...prev, taskType: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Sources</option>
                    <option value="signup">Signup Bonus</option>
                    <option value="spin_win">Spin & Win</option>
                    <option value="scratch_earn">Scratch & Earn</option>
                    <option value="telegram">Telegram Tasks</option>
                    <option value="youtube">YouTube Tasks</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="date">Date</option>
                      <option value="points">Points</option>
                      <option value="type">Type</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.customDateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        customDateRange: { ...prev.customDateRange, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.customDateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        customDateRange: { ...prev.customDateRange, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions */}
        {selectedTransactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30"
          >
            <span className="text-blue-300 font-medium">
              {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 bg-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-500/40 transition-colors"
              >
                Export Selected
              </button>
              <button
                onClick={() => setSelectedTransactions([])}
                className="px-3 py-1 bg-gray-500/30 text-gray-400 rounded-lg text-sm hover:bg-gray-500/40 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-20">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-400">
              {searchTerm || filters.type !== 'all' || filters.dateRange !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Start earning points to see your transaction history here!'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl">
              <input
                type="checkbox"
                checked={selectedTransactions.length === filteredTransactions.length}
                onChange={selectAllTransactions}
                className="rounded border-gray-300"
              />
              <span className="text-gray-300 text-sm">
                Select all {filteredTransactions.length} transactions
              </span>
            </div>

            {/* Transaction Items */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/10 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
                      selectedTransactions.includes(transaction.id)
                        ? 'border-blue-400/50 bg-blue-400/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction.id)}
                            onChange={() => toggleTransactionSelection(transaction.id)}
                            className="rounded border-gray-300"
                          />
                          
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            transaction.type === 'earn' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {transaction.type === 'earn' ? (
                              <Plus className="h-6 w-6" />
                            ) : (
                              <Minus className="h-6 w-6" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{transaction.description}</h3>
                              {transaction.task_type && (
                                <div className={`flex items-center gap-1 ${getTaskTypeColor(transaction.task_type)}`}>
                                  {getTaskTypeIcon(transaction.task_type)}
                                  <span className="text-xs font-medium capitalize">
                                    {transaction.task_type.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                            </div>
                            <div className="text-gray-400 text-sm">points</div>
                          </div>

                          <button
                            onClick={() => setExpandedTransaction(
                              expandedTransaction === transaction.id ? null : transaction.id
                            )}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedTransaction === transaction.id ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedTransaction === transaction.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/20"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Transaction ID:</span>
                                <p className="text-white font-mono">{transaction.id.slice(0, 8)}...</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Type:</span>
                                <p className="text-white capitalize">{transaction.type}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Completed</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 ${
                      selectedTransactions.includes(transaction.id)
                        ? 'border-blue-400/50 bg-blue-400/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        className="rounded border-gray-300"
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'earn' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'earn' ? (
                          <Plus className="h-5 w-5" />
                        ) : (
                          <Minus className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-white font-semibold mb-2 line-clamp-2">
                      {transaction.description}
                    </h3>

                    <div className={`text-2xl font-bold mb-2 ${
                      transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                    </div>

                    <p className="text-gray-400 text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>

                    {transaction.task_type && (
                      <div className={`flex items-center gap-1 mt-2 ${getTaskTypeColor(transaction.task_type)}`}>
                        {getTaskTypeIcon(transaction.task_type)}
                        <span className="text-xs font-medium capitalize">
                          {transaction.task_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-center py-20">
                  <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Calendar View</h3>
                  <p className="text-gray-400">Calendar view coming soon!</p>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default TransactionHistoryPage