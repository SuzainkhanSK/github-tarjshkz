import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Package,
  Calendar,
  Tag,
  ToggleLeft,
  ToggleRight,
  Play,
  Music,
  Tv,
  Smartphone,
  Globe,
  Crown
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Define the subscription availability interface
interface SubscriptionAvailability {
  id: string
  subscription_id: string
  duration: string
  in_stock: boolean
  created_at: string
  updated_at: string
}

const SubscriptionManagement: React.FC = () => {
  const { hasPermission } = useAdmin()
  const [subscriptions, setSubscriptions] = useState<SubscriptionAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Form data for new subscription
  const [formData, setFormData] = useState({
    subscription_id: '',
    subscription_name: '',
    duration: '',
    category: 'streaming'
  })

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Services', icon: Globe },
    { id: 'streaming', name: 'Streaming', icon: Tv },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'social', name: 'Social', icon: Smartphone },
    { id: 'other', name: 'Other', icon: Crown }
  ]

  // Subscription metadata for display
  const subscriptionMetadata: Record<string, { name: string, category: string, icon: React.ComponentType<any>, color: string }> = {
    youtube_premium: { name: 'YouTube Premium', category: 'streaming', icon: Play, color: 'from-red-500 to-red-600' },
    netflix: { name: 'Netflix', category: 'streaming', icon: Tv, color: 'from-red-600 to-red-700' },
    amazon_prime: { name: 'Amazon Prime Video', category: 'streaming', icon: Package, color: 'from-blue-500 to-blue-600' },
    spotify_premium: { name: 'Spotify Premium', category: 'music', icon: Music, color: 'from-green-500 to-green-600' },
    jiosaavn_pro: { name: 'JioSaavn Pro', category: 'music', icon: Music, color: 'from-orange-500 to-orange-600' },
    disney_hotstar: { name: 'Disney+ Hotstar', category: 'streaming', icon: Tv, color: 'from-blue-600 to-indigo-600' },
    apple_music: { name: 'Apple Music', category: 'music', icon: Music, color: 'from-gray-700 to-gray-800' },
    sony_liv: { name: 'Sony LIV', category: 'streaming', icon: Tv, color: 'from-purple-500 to-purple-600' },
    telegram_premium: { name: 'Telegram Premium', category: 'social', icon: Smartphone, color: 'from-blue-400 to-blue-500' }
  }

  useEffect(() => {
    if (hasPermission('*') || hasPermission('system.manage')) {
      fetchSubscriptionAvailability()
    }
  }, [hasPermission])

  const fetchSubscriptionAvailability = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      toast.error('Supabase is not configured')
      return
    }

    try {
      setRefreshing(true)
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call admin edge function to fetch all subscriptions
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-subscriptions?action=list`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch subscriptions: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()

      if (Array.isArray(data)) {
        setSubscriptions(data)
      } else {
        console.error('Unexpected response format:', data)
        setSubscriptions([])
        toast.error('Received invalid data format from server')
      }
    } catch (error) {
      console.error('Failed to fetch subscription availability:', error)
      toast.error('Failed to load subscription availability data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured) {
      toast.error('Database not configured')
      return
    }

    if (!hasPermission('*') && !hasPermission('system.manage')) {
      toast.error('You do not have permission to update subscription availability')
      return
    }

    setProcessingId(id)

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call admin edge function to toggle subscription
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-subscriptions?action=toggle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id,
            currentStatus
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update subscription: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()

      if (!data || !data.id) {
        throw new Error('Failed to update subscription status')
      }

      // Update local state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, in_stock: !currentStatus } : sub
        )
      )

      toast.success(`Subscription ${!currentStatus ? 'marked as in stock' : 'marked as out of stock'}`)
    } catch (error) {
      console.error('Failed to update subscription availability:', error)
      toast.error('Failed to update subscription availability')
    } finally {
      setProcessingId(null)
    }
  }

  const addNewSubscription = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Database not configured')
      return
    }

    if (!hasPermission('*') && !hasPermission('system.manage')) {
      toast.error('You do not have permission to add subscription availability')
      return
    }

    if (!formData.subscription_id || !formData.duration) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Normalize subscription ID
      const subscriptionId = formData.subscription_id.trim().toLowerCase().replace(/\s+/g, '_')

      // Call admin edge function to add subscription
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-subscriptions?action=add`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_id: subscriptionId,
            duration: formData.duration.trim()
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to add subscription: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()

      // Add to local state
      if (data) {
        setSubscriptions(prev => [...prev, ...data])
        
        // Add to metadata if it's a new subscription
        if (!subscriptionMetadata[subscriptionId]) {
          subscriptionMetadata[subscriptionId] = {
            name: formData.subscription_name || subscriptionId,
            category: formData.category,
            icon: formData.category === 'streaming' ? Tv : 
                  formData.category === 'music' ? Music : 
                  formData.category === 'social' ? Smartphone : Crown,
            color: 'from-gray-500 to-gray-600'
          }
        }
      }

      toast.success('New subscription availability added')
      setShowAddModal(false)
      setFormData({
        subscription_id: '',
        subscription_name: '',
        duration: '',
        category: 'streaming'
      })
    } catch (error) {
      console.error('Failed to add subscription availability:', error)
      toast.error('Failed to add subscription availability')
    } finally {
      setLoading(false)
    }
  }

  const deleteSubscription = async (id: string) => {
    if (!isSupabaseConfigured) {
      toast.error('Database not configured')
      return
    }

    if (!hasPermission('*') && !hasPermission('system.manage')) {
      toast.error('You do not have permission to delete subscription availability')
      return
    }

    if (!confirm('Are you sure you want to delete this subscription availability?')) {
      return
    }

    setProcessingId(id)
    setLoading(true)

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call admin edge function to delete subscription
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-subscriptions?action=delete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete subscription: ${response.status} ${response.statusText}`)
      }

      // Update local state
      setSubscriptions(prev => prev.filter(sub => sub.id !== id))
      toast.success('Subscription availability deleted')
    } catch (error) {
      console.error('Failed to delete subscription availability:', error)
      toast.error('Failed to delete subscription availability')
    } finally {
      setProcessingId(null)
      setLoading(false)
    }
  }

  // Filter subscriptions based on search term, category, and stock status
  const filteredSubscriptions = subscriptions.filter(sub => {
    const subscriptionName = subscriptionMetadata[sub.subscription_id]?.name || sub.subscription_id
    const matchesSearch = 
      subscriptionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subscription_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.duration.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      subscriptionMetadata[sub.subscription_id]?.category === categoryFilter
    
    const matchesStock = 
      stockFilter === 'all' || 
      (stockFilter === 'in_stock' && sub.in_stock) || 
      (stockFilter === 'out_of_stock' && !sub.in_stock)
    
    return matchesSearch && matchesCategory && matchesStock
  })

  // Group subscriptions by subscription_id
  const groupedSubscriptions = filteredSubscriptions.reduce((acc, sub) => {
    const key = sub.subscription_id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(sub)
    return acc
  }, {} as Record<string, SubscriptionAvailability[]>)

  if (!hasPermission('*') && !hasPermission('system.manage')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You do not have permission to access subscription management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
              <p className="text-gray-300">Manage subscription availability and stock status</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-400/30 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add New
              </button>
              <button
                onClick={fetchSubscriptionAvailability}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subscriptions..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    categoryFilter === category.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  stockFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-medium">All</span>
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  stockFilter === 'in_stock'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">In Stock</span>
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Out of Stock</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subscriptions Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
            <p className="text-gray-300">Loading subscription data...</p>
          </div>
        ) : Object.keys(groupedSubscriptions).length === 0 ? (
          <div className="text-center py-20">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Subscriptions Found</h2>
            <p className="text-gray-300 mb-6">
              {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Add your first subscription using the "Add New" button'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              Add New Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSubscriptions).map(([subscriptionId, subscriptionItems]) => {
              const metadata = subscriptionMetadata[subscriptionId] || {
                name: subscriptionId,
                category: 'other',
                icon: Crown,
                color: 'from-gray-500 to-gray-600'
              }
              
              return (
                <motion.div
                  key={subscriptionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${metadata.color} rounded-xl flex items-center justify-center`}>
                      <metadata.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{metadata.name}</h2>
                      <p className="text-gray-300 text-sm">ID: {subscriptionId}</p>
                    </div>
                    <div className="ml-auto text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        metadata.category === 'streaming' ? 'bg-blue-500/20 text-blue-400' :
                        metadata.category === 'music' ? 'bg-green-500/20 text-green-400' :
                        metadata.category === 'social' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {metadata.category}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10 border-b border-white/20">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Duration</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Last Updated</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {subscriptionItems.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-white">{item.duration}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                item.in_stock 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {item.in_stock 
                                  ? <CheckCircle className="h-3 w-3" /> 
                                  : <XCircle className="h-3 w-3" />
                                }
                                {item.in_stock ? 'In Stock' : 'Out of Stock'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                              {new Date(item.updated_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleAvailability(item.id, item.in_stock)}
                                  disabled={processingId === item.id}
                                  className={`p-2 rounded-lg transition-colors ${
                                    item.in_stock
                                      ? 'text-green-400 hover:bg-red-500/20 hover:text-red-400'
                                      : 'text-red-400 hover:bg-green-500/20 hover:text-green-400'
                                  }`}
                                >
                                  {processingId === item.id ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                  ) : item.in_stock ? (
                                    <ToggleRight className="h-5 w-5" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteSubscription(item.id)}
                                  disabled={processingId === item.id}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add New Subscription Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Add New Subscription</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subscription ID
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subscription_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, subscription_id: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="e.g., netflix, youtube_premium"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    Use lowercase with underscores, e.g., "youtube_premium"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subscription_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, subscription_name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="e.g., Netflix, YouTube Premium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="e.g., 1 Month, 3 Months, 1 Year"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  >
                    <option value="streaming">Streaming</option>
                    <option value="music">Music</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewSubscription}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Add Subscription
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SubscriptionManagement