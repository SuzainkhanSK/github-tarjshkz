import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Star,
  Play,
  Music,
  Tv,
  Smartphone,
  Globe,
  Crown,
  Heart,
  Zap,
  ShoppingCart,
  User,
  Mail,
  MapPin,
  MessageSquare,
  History,
  RefreshCw,
  Eye,
  Calendar,
  Award,
  TrendingUp,
  Package,
  Send,
  Key,
  FileText,
  Copy,
  Check
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Subscription {
  id: string
  name: string
  category: 'streaming' | 'music' | 'social' | 'other'
  icon: React.ComponentType<any>
  color: string
  description: string
  plans: SubscriptionPlan[]
  popular?: boolean
}

interface SubscriptionPlan {
  duration: string
  points: number
  originalPrice: string
  discount?: number
}

interface RedemptionRequest {
  id: string
  user_id: string
  subscription_id: string
  subscription_name: string
  duration: string
  points_cost: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  user_email: string
  user_country: string
  user_notes?: string
  activation_code?: string
  instructions?: string
  expires_at?: string
  created_at: string
  completed_at?: string
}

interface SubscriptionAvailability {
  id: string
  subscription_id: string
  duration: string
  in_stock: boolean
}

const RewardsPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRedemptionModal, setShowRedemptionModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionRequest[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingRedemption, setProcessingRedemption] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionRequest | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState<SubscriptionAvailability[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // Form data for redemption
  const [formData, setFormData] = useState({
    email: '',
    country: '',
    notes: ''
  })

  // Available subscriptions
  const subscriptions: Subscription[] = [
    {
      id: 'youtube_premium',
      name: 'YouTube Premium',
      category: 'streaming',
      icon: Play,
      color: 'from-red-500 to-red-600',
      description: 'Ad-free videos, background play, YouTube Music included',
      popular: true,
      plans: [
        { duration: '1 Month', points: 1000, originalPrice: '$11.99' },
        { duration: '2 Months', points: 1900, originalPrice: '$23.98', discount: 5 },
        { duration: '3 Months', points: 2700, originalPrice: '$35.97', discount: 10 },
        { duration: '6 Months', points: 5200, originalPrice: '$71.94', discount: 15 },
        { duration: '1 Year', points: 9500, originalPrice: '$143.88', discount: 20 }
      ]
    },
    {
      id: 'netflix',
      name: 'Netflix',
      category: 'streaming',
      icon: Tv,
      color: 'from-red-600 to-red-700',
      description: 'Unlimited movies and TV shows, 4K streaming',
      popular: true,
      plans: [
        { duration: '1 Month', points: 1400, originalPrice: '$15.49' },
        { duration: '2 Months', points: 2650, originalPrice: '$30.98', discount: 5 },
        { duration: '3 Months', points: 3800, originalPrice: '$46.47', discount: 10 },
        { duration: '6 Months', points: 7300, originalPrice: '$92.94', discount: 15 },
        { duration: '1 Year', points: 13500, originalPrice: '$185.88', discount: 20 }
      ]
    },
    {
      id: 'amazon_prime',
      name: 'Amazon Prime Video',
      category: 'streaming',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      description: 'Prime Video, free shipping, Prime Music',
      plans: [
        { duration: '1 Month', points: 1200, originalPrice: '$14.98' },
        { duration: '3 Months', points: 3200, originalPrice: '$44.94', discount: 10 },
        { duration: '6 Months', points: 6000, originalPrice: '$89.88', discount: 15 },
        { duration: '1 Year', points: 11000, originalPrice: '$179.76', discount: 20 }
      ]
    },
    {
      id: 'spotify_premium',
      name: 'Spotify Premium',
      category: 'music',
      icon: Music,
      color: 'from-green-500 to-green-600',
      description: 'Ad-free music, offline downloads, high quality',
      popular: true,
      plans: [
        { duration: '1 Month', points: 900, originalPrice: '$9.99' },
        { duration: '2 Months', points: 1700, originalPrice: '$19.98', discount: 5 },
        { duration: '3 Months', points: 2400, originalPrice: '$29.97', discount: 10 },
        { duration: '6 Months', points: 4500, originalPrice: '$59.94', discount: 15 },
        { duration: '1 Year', points: 8200, originalPrice: '$119.88', discount: 20 }
      ]
    },
    {
      id: 'jiosaavn_pro',
      name: 'JioSaavn Pro',
      category: 'music',
      icon: Heart,
      color: 'from-orange-500 to-orange-600',
      description: 'High quality music, ad-free, unlimited downloads',
      plans: [
        { duration: '1 Month', points: 700, originalPrice: '$1.99' },
        { duration: '3 Months', points: 1800, originalPrice: '$5.97', discount: 10 },
        { duration: '6 Months', points: 3200, originalPrice: '$11.94', discount: 15 },
        { duration: '1 Year', points: 5500, originalPrice: '$23.88', discount: 20 }
      ]
    },
    {
      id: 'disney_hotstar',
      name: 'Disney+ Hotstar',
      category: 'streaming',
      icon: Star,
      color: 'from-blue-600 to-indigo-600',
      description: 'Disney, Marvel, Star Wars, live sports',
      plans: [
        { duration: '1 Month', points: 800, originalPrice: '$7.99' },
        { duration: '3 Months', points: 2100, originalPrice: '$23.97', discount: 10 },
        { duration: '6 Months', points: 3800, originalPrice: '$47.94', discount: 15 },
        { duration: '1 Year', points: 6500, originalPrice: '$95.88', discount: 20 }
      ]
    },
    {
      id: 'apple_music',
      name: 'Apple Music',
      category: 'music',
      icon: Music,
      color: 'from-gray-700 to-gray-800',
      description: 'Lossless audio, spatial audio, exclusive content',
      plans: [
        { duration: '1 Month', points: 1100, originalPrice: '$10.99' },
        { duration: '2 Months', points: 2000, originalPrice: '$21.98', discount: 5 },
        { duration: '3 Months', points: 2900, originalPrice: '$32.97', discount: 10 },
        { duration: '6 Months', points: 5500, originalPrice: '$65.94', discount: 15 },
        { duration: '1 Year', points: 10000, originalPrice: '$131.88', discount: 20 }
      ]
    },
    {
      id: 'sony_liv',
      name: 'Sony LIV',
      category: 'streaming',
      icon: Tv,
      color: 'from-purple-500 to-purple-600',
      description: 'Live TV, movies, sports, original shows',
      plans: [
        { duration: '1 Month', points: 600, originalPrice: '$4.99' },
        { duration: '3 Months', points: 1500, originalPrice: '$14.97', discount: 10 },
        { duration: '6 Months', points: 2700, originalPrice: '$29.94', discount: 15 },
        { duration: '1 Year', points: 4500, originalPrice: '$59.88', discount: 20 }
      ]
    },
    {
      id: 'telegram_premium',
      name: 'Telegram Premium',
      category: 'social',
      icon: Send,
      color: 'from-blue-400 to-blue-500',
      description: 'Faster downloads, exclusive stickers, voice-to-text',
      plans: [
        { duration: '1 Month', points: 500, originalPrice: '$4.99' },
        { duration: '3 Months', points: 1300, originalPrice: '$14.97', discount: 10 },
        { duration: '6 Months', points: 2400, originalPrice: '$29.94', discount: 15 },
        { duration: '1 Year', points: 4000, originalPrice: '$59.88', discount: 20 }
      ]
    }
  ]

  const categories = [
    { id: 'all', name: 'All Services', icon: Globe },
    { id: 'streaming', name: 'Streaming', icon: Tv },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'social', name: 'Social', icon: Smartphone },
    { id: 'other', name: 'Other', icon: Crown }
  ]

  useEffect(() => {
    if (user?.id) {
      fetchRedemptionHistory()
      fetchAvailabilityData()
    }
  }, [user])

  const fetchRedemptionHistory = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      setHistoryLoading(true)
      const { data, error } = await supabase
        .from('redemption_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRedemptionHistory(data || [])
    } catch (error) {
      console.error('Failed to fetch redemption history:', error)
      toast.error('Failed to load redemption history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchAvailabilityData = async () => {
    if (!isSupabaseConfigured) return

    try {
      setAvailabilityLoading(true)
      const { data, error } = await supabase
        .from('subscription_availability')
        .select('*')

      if (error) throw error
      setAvailabilityData(data || [])
    } catch (error) {
      console.error('Failed to fetch availability data:', error)
      // Don't show error toast to users as this is background data
    } finally {
      setAvailabilityLoading(false)
    }
  }

  // Check if a subscription plan is in stock
  const isInStock = (subscriptionId: string, duration: string): boolean => {
    // If no availability data yet, assume everything is in stock
    if (availabilityData.length === 0) return true
    
    // Find the matching availability record
    const availabilityRecord = availabilityData.find(
      record => record.subscription_id === subscriptionId && record.duration === duration
    )
    
    // If no record found, assume it's in stock
    if (!availabilityRecord) return true
    
    // Return the in_stock status
    return availabilityRecord.in_stock
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleRedemption = (subscription: Subscription, plan: SubscriptionPlan) => {
    if (!userProfile || userProfile.points < plan.points) {
      toast.error('Insufficient points for this redemption')
      return
    }

    // Check if the subscription plan is in stock
    if (!isInStock(subscription.id, plan.duration)) {
      toast.error('This subscription plan is currently out of stock')
      return
    }

    setSelectedSubscription(subscription)
    setSelectedPlan(plan)
    setFormData({
      email: userProfile.email || '',
      country: '',
      notes: ''
    })
    setShowRedemptionModal(true)
  }

  const processRedemption = async () => {
    if (!selectedSubscription || !selectedPlan || !user?.id) return

    if (!formData.email || !formData.country) {
      toast.error('Please fill in all required fields')
      return
    }

    setProcessingRedemption(true)

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured')
      }

      // Check if user has enough points
      if (userProfile!.points < selectedPlan.points) {
        throw new Error('Insufficient points')
      }

      // Check if the subscription is still in stock
      if (!isInStock(selectedSubscription.id, selectedPlan.duration)) {
        throw new Error('This subscription plan is currently out of stock')
      }

      // Create redemption request
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('redemption_requests')
        .insert({
          user_id: user.id,
          subscription_id: selectedSubscription.id,
          subscription_name: selectedSubscription.name,
          duration: selectedPlan.duration,
          points_cost: selectedPlan.points,
          user_email: formData.email,
          user_country: formData.country,
          user_notes: formData.notes || null,
          status: 'pending'
        })
        .select()
        .single()

      if (redemptionError) throw redemptionError

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'redeem',
          points: selectedPlan.points,
          description: `Redeemed: ${selectedSubscription.name} (${selectedPlan.duration})`,
          task_type: 'redemption'
        })

      if (transactionError) throw transactionError

      // Update user profile points
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          points: userProfile!.points - selectedPlan.points
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Refresh profile and history
      await Promise.all([
        refreshProfile(),
        fetchRedemptionHistory()
      ])

      toast.success('🎉 Redemption request submitted successfully!')
      setShowRedemptionModal(false)
      setSelectedSubscription(null)
      setSelectedPlan(null)

    } catch (error: any) {
      console.error('Redemption error:', error)
      toast.error(error.message || 'Failed to process redemption')
    } finally {
      setProcessingRedemption(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-400" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-400" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20'
      case 'processing': return 'text-blue-400 bg-blue-400/20'
      case 'completed': return 'text-green-400 bg-green-400/20'
      case 'failed': return 'text-red-400 bg-red-400/20'
      case 'cancelled': return 'text-gray-400 bg-gray-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const handleViewRedemptionDetails = (redemption: RedemptionRequest) => {
    setSelectedRedemption(redemption)
    setShowCodeModal(true)
    setCopiedCode(false)
  }

  const copyActivationCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      toast.success('Activation code copied to clipboard!')
      setTimeout(() => setCopiedCode(false), 3000)
    } catch (error) {
      toast.error('Failed to copy code to clipboard')
    }
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
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Rewards Store
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Redeem your points for premium subscriptions and exclusive services
        </p>
        
        {/* User Balance */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-400/30">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-bold text-2xl">{userProfile?.points || 0}</p>
                <p className="text-gray-300 text-sm">Available Points</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) {
                fetchRedemptionHistory()
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            <History className="h-5 w-5" />
            <span className="text-white font-medium">Redemption History</span>
          </button>
        </div>
      </motion.div>

      {/* Redemption History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                Your Redemption History
              </h3>
              <button
                onClick={fetchRedemptionHistory}
                disabled={historyLoading}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
              </div>
            ) : redemptionHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {redemptionHistory.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          {request.subscription_name} ({request.duration})
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-red-400 font-bold">-{request.points_cost} points</p>
                        <p className={`text-sm capitalize ${getStatusColor(request.status).split(' ')[0]}`}>
                          {request.status}
                        </p>
                      </div>
                      
                      {request.status === 'completed' && (
                        <button
                          onClick={() => handleViewRedemptionDetails(request)}
                          className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No redemptions yet</p>
                <p className="text-gray-500 text-sm">Start redeeming your points for amazing rewards!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
              placeholder="Search subscriptions..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Subscriptions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredSubscriptions.map((subscription, index) => (
          <motion.div
            key={subscription.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group"
          >
            {/* Popular Badge */}
            {subscription.popular && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                🔥 Popular
              </div>
            )}

            {/* Service Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${subscription.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <subscription.icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{subscription.name}</h3>
                <p className="text-gray-300 text-sm">{subscription.description}</p>
              </div>
            </div>

            {/* Plans */}
            <div className="space-y-3">
              {subscription.plans.map((plan, planIndex) => {
                const canAfford = (userProfile?.points || 0) >= plan.points
                const planInStock = isInStock(subscription.id, plan.duration)
                
                return (
                  <div
                    key={planIndex}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      !planInStock
                        ? 'border-red-600/30 bg-red-800/30'
                        : canAfford 
                          ? 'border-white/20 hover:border-purple-400/50 hover:bg-white/10' 
                          : 'border-gray-600/30 bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className={`font-semibold ${
                          !planInStock
                            ? 'text-red-300'
                            : canAfford ? 'text-white' : 'text-gray-500'
                        }`}>
                          {plan.duration}
                        </h4>
                        <p className={`text-sm ${
                          !planInStock
                            ? 'text-red-400'
                            : canAfford ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Worth {plan.originalPrice}
                          {plan.discount && (
                            <span className="ml-2 text-green-400 font-medium">
                              {plan.discount}% OFF
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          !planInStock
                            ? 'text-red-300'
                            : canAfford ? 'text-purple-400' : 'text-gray-500'
                        }`}>
                          {plan.points} points
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => handleRedemption(subscription, plan)}
                      disabled={!canAfford || !planInStock}
                      whileHover={canAfford && planInStock ? { scale: 1.02 } : {}}
                      whileTap={canAfford && planInStock ? { scale: 0.98 } : {}}
                      className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                        !planInStock
                          ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                          : canAfford
                            ? `bg-gradient-to-r ${subscription.color} text-white hover:shadow-lg`
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {!planInStock ? (
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Out of Stock
                        </div>
                      ) : canAfford ? (
                        <div className="flex items-center justify-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Redeem Now
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Coins className="h-4 w-4" />
                          Insufficient Points
                        </div>
                      )}
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Redemption Modal */}
      <AnimatePresence>
        {showRedemptionModal && selectedSubscription && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRedemptionModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <selectedSubscription.icon className="h-6 w-6 text-purple-400" />
                Confirm Redemption
              </h3>
              
              {/* Order Summary */}
              <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
                <h4 className="text-white font-semibold mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Service:</span>
                    <span className="text-white font-medium">{selectedSubscription.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white font-medium">{selectedPlan.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Value:</span>
                    <span className="text-white font-medium">{selectedPlan.originalPrice}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-2">
                    <span className="text-gray-300">Cost:</span>
                    <span className="text-purple-400 font-bold">{selectedPlan.points} points</span>
                  </div>
                </div>
              </div>

              {/* User Details Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Country *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="IN">India</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="BR">Brazil</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MessageSquare className="inline h-4 w-4 mr-1" />
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Any special instructions or preferences..."
                  />
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-yellow-300 font-semibold mb-1">Important Notice</h5>
                    <ul className="text-yellow-200 text-sm space-y-1">
                      <li>• Processing time: 24-48 hours</li>
                      <li>• You'll receive activation details via email</li>
                      <li>• Points will be deducted immediately</li>
                      <li>• Refunds are not available once processed</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRedemptionModal(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processRedemption}
                  disabled={processingRedemption || !formData.email || !formData.country}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingRedemption ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Confirm Redemption
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activation Code Modal */}
      <AnimatePresence>
        {showCodeModal && selectedRedemption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCodeModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Key className="h-6 w-6 text-green-400" />
                Activation Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">
                    {selectedRedemption.subscription_name} ({selectedRedemption.duration})
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Completed on {new Date(selectedRedemption.completed_at || '').toLocaleDateString()}
                  </p>
                </div>
                
                {selectedRedemption.activation_code ? (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      Activation Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="bg-black/30 p-3 rounded-lg flex-1 font-mono text-green-300 break-all whitespace-pre-wrap">
                        {selectedRedemption.activation_code}
                      </div>
                      <button
                        onClick={() => copyActivationCode(selectedRedemption.activation_code!)}
                        className="p-2 bg-green-500/30 hover:bg-green-500/40 rounded-lg transition-colors"
                      >
                        {copiedCode ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-green-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <p className="text-yellow-300 text-sm">
                        No activation code available. Please check your email for details or contact support.
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedRedemption.instructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Instructions
                    </label>
                    <div className="bg-white/10 p-4 rounded-lg text-white text-sm whitespace-pre-wrap">
                      {selectedRedemption.instructions}
                    </div>
                  </div>
                )}
                
                {selectedRedemption.expires_at && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expires on {new Date(selectedRedemption.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-purple-400" />
          How Redemption Works
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">1</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Choose Service</h3>
            <p className="text-gray-300 text-sm">Select your preferred subscription and duration</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">2</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Fill Details</h3>
            <p className="text-gray-300 text-sm">Provide your email and delivery preferences</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">3</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Processing</h3>
            <p className="text-gray-300 text-sm">We process your request within 24-48 hours</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">4</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Enjoy</h3>
            <p className="text-gray-300 text-sm">Receive activation details and enjoy your subscription</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-400/20 rounded-xl border border-blue-400/30">
          <p className="text-blue-300 text-sm">
            <strong>💡 Pro Tip:</strong> Longer duration plans offer better value with discount rates up to 20% off! 
            Check the "Popular\" badges for our most redeemed services.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default RewardsPage