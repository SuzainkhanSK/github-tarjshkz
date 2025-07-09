import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Share2, 
  Users, 
  Coins, 
  TrendingUp, 
  Copy, 
  Check, 
  Gift, 
  Award,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Mail,
  MessageCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

interface Referral {
  id: string
  referred_id: string
  referral_code: string
  level: number
  status: 'pending' | 'completed'
  points_awarded: number
  created_at: string
  completed_at?: string
  profiles?: {
    email: string
    full_name?: string
  }
}

interface ReferralEarning {
  id: string
  referred_id: string
  transaction_id: string
  original_points: number
  commission_percentage: number
  commission_points: number
  level: number
  created_at: string
  profiles?: {
    email: string
    full_name?: string
  }
}

const ReferralProgramPage: React.FC = () => {
  const { user, userProfile } = useAuth()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralLink, setReferralLink] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
    level1Referrals: 0,
    level2Referrals: 0,
    level3Referrals: 0
  })
  const [showEarnings, setShowEarnings] = useState(false)
  const [showReferrals, setShowReferrals] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'level' | 'points'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 1 | 2 | 3>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchReferralCode()
      fetchReferrals()
      fetchEarnings()
    }
  }, [user])

  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/register?ref=${referralCode}`)
    }
  }, [referralCode])

  const fetchReferralCode = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      // Check if user already has a referral code
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data?.referral_code) {
        setReferralCode(data.referral_code)
      } else {
        // Generate a new referral code
        const { data: newCode, error: codeError } = await supabase
          .rpc('generate_referral_code', { user_id_param: user.id })

        if (codeError) throw codeError
        setReferralCode(newCode)
      }
    } catch (error) {
      console.error('Failed to fetch/generate referral code:', error)
      toast.error('Failed to generate referral code')
    }
  }

  const fetchReferrals = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          profiles:referred_id(email, full_name)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setReferrals(data || [])
      
      // Calculate stats
      const totalReferrals = data?.length || 0
      const pendingReferrals = data?.filter(r => r.status === 'pending').length || 0
      const completedReferrals = data?.filter(r => r.status === 'completed').length || 0
      const level1Referrals = data?.filter(r => r.level === 1).length || 0
      const level2Referrals = data?.filter(r => r.level === 2).length || 0
      const level3Referrals = data?.filter(r => r.level === 3).length || 0
      const totalEarnings = data?.reduce((sum, r) => sum + (r.status === 'completed' ? r.points_awarded : 0), 0) || 0
      
      setStats(prev => ({
        ...prev,
        totalReferrals,
        pendingReferrals,
        completedReferrals,
        level1Referrals,
        level2Referrals,
        level3Referrals,
        totalEarnings: prev.totalEarnings // Will be updated after fetching earnings
      }))
    } catch (error) {
      console.error('Failed to fetch referrals:', error)
      toast.error('Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }

  const fetchEarnings = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('referral_earnings')
        .select(`
          *,
          profiles:referred_id(email, full_name)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setEarnings(data || [])
      
      // Calculate commission earnings
      const commissionEarnings = data?.reduce((sum, e) => sum + e.commission_points, 0) || 0
      
      // Update total earnings in stats
      setStats(prev => ({
        ...prev,
        totalEarnings: prev.totalEarnings + commissionEarnings
      }))
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchReferrals(),
      fetchEarnings()
    ])
    setRefreshing(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const shareViaWhatsApp = () => {
    const text = `Join Premium Access Zone and get free premium subscriptions! Use my referral code: ${referralCode} or sign up here: ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')
  }

  const shareViaTwitter = () => {
    const text = `Join Premium Access Zone and get free premium subscriptions! Use my referral code: ${referralCode}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank')
  }

  const shareViaTelegram = () => {
    const text = `Join Premium Access Zone and get free premium subscriptions! Use my referral code: ${referralCode} or sign up here: ${referralLink}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = 'Join Premium Access Zone - Free Subscriptions!'
    const body = `Hey,\n\nI'm using Premium Access Zone to get free premium subscriptions like Netflix, YouTube Premium, and more!\n\nUse my referral code: ${referralCode} when you sign up, or click this link: ${referralLink}\n\nYou'll get 100 welcome points and I'll get a bonus too!\n\nEnjoy!`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  // Filter and sort referrals
  const filteredReferrals = referrals.filter(referral => {
    // Apply search filter
    const searchMatch = 
      referral.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply level filter
    const levelMatch = levelFilter === 'all' || referral.level === levelFilter
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || referral.status === statusFilter
    
    return searchMatch && levelMatch && statusMatch
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'level':
        comparison = a.level - b.level
        break
      case 'points':
        comparison = a.points_awarded - b.points_awarded
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Filter and sort earnings
  const filteredEarnings = earnings.filter(earning => {
    // Apply search filter
    const searchMatch = 
      earning.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Apply level filter
    const levelMatch = levelFilter === 'all' || earning.level === levelFilter
    
    return searchMatch && levelMatch
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case 'level':
        comparison = a.level - b.level
        break
      case 'points':
        comparison = a.commission_points - b.commission_points
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

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
            Referral Program
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Invite friends, earn points, and build your referral network!
        </p>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-10 right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Share2 className="h-6 w-6 text-purple-400" />
                Your Referral Code
              </h2>
              
              {referralCode ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="bg-black/30 px-6 py-4 rounded-xl border border-purple-400/30">
                    <span className="text-2xl font-mono font-bold text-purple-400">{referralCode}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode)}
                    className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-400/30 text-purple-400 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-black/30 px-6 py-4 rounded-xl border border-purple-400/30 animate-pulse">
                    <span className="text-2xl font-mono font-bold text-purple-400">Loading...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-black/30 p-6 rounded-xl border border-purple-400/30 flex-shrink-0">
              <h3 className="text-lg font-bold text-white mb-3">Referral Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Referrals</p>
                  <p className="text-white font-bold text-xl">{stats.totalReferrals}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-purple-400 font-bold text-xl">{stats.totalEarnings}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-purple-400" />
              Your Referral Link
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-black/30 px-4 py-3 rounded-xl border border-purple-400/30 w-full overflow-hidden">
                <p className="text-purple-300 font-mono text-sm truncate">{referralLink}</p>
              </div>
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-400/30 text-purple-400 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Share Your Code</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl border border-green-400/30 text-green-400 transition-colors flex items-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                  <path d="M9.5 13.5c.5 1 1.5 1 2.5 1s2-.5 2.5-1" />
                </svg>
                WhatsApp
              </button>
              
              <button
                onClick={shareViaFacebook}
                className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl border border-blue-400/30 text-blue-400 transition-colors flex items-center gap-2"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </button>
              
              <button
                onClick={shareViaTwitter}
                className="px-4 py-3 bg-blue-400/20 hover:bg-blue-400/30 rounded-xl border border-blue-300/30 text-blue-300 transition-colors flex items-center gap-2"
              >
                <Twitter className="h-5 w-5" />
                Twitter
              </button>
              
              <button
                onClick={shareViaTelegram}
                className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl border border-blue-500/30 text-blue-500 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Telegram
              </button>
              
              <button
                onClick={shareViaEmail}
                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl border border-red-400/30 text-red-400 transition-colors flex items-center gap-2"
              >
                <Mail className="h-5 w-5" />
                Email
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Gift className="h-6 w-6 text-blue-400" />
          How Our 3-Tier Referral Program Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl p-6 border border-yellow-400/30">
            <div className="w-16 h-16 bg-yellow-500/30 rounded-full flex items-center justify-center mb-4 text-2xl">
              1️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Primary Referral</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Coins className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Earn <strong className="text-yellow-400">500 points</strong> when your direct referral completes their first task</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Receive <strong className="text-yellow-400">10% commission</strong> on all their future earnings</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl p-6 border border-purple-400/30">
            <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mb-4 text-2xl">
              2️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Secondary Referral</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Coins className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Earn <strong className="text-purple-400">200 points</strong> when your referral's referral completes their first task</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Receive <strong className="text-purple-400">5% commission</strong> on all their future earnings</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl p-6 border border-blue-400/30">
            <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mb-4 text-2xl">
              3️⃣
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tertiary Referral</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <Coins className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Earn <strong className="text-blue-400">100 points</strong> when your Level 3 referral completes their first task</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Receive <strong className="text-blue-400">2% commission</strong> on all their future earnings</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-6 bg-red-500/20 rounded-xl border border-red-400/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Important Notice</h3>
              <p className="text-gray-300 mb-2">
                Fake referrals, self-referrals, or any fraudulent activity is strictly prohibited and will result in:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-300">
                <li>Immediate account suspension</li>
                <li>Forfeiture of all earned points</li>
                <li>Permanent ban from the platform</li>
              </ul>
              <p className="text-gray-300 mt-2">
                We have automated systems in place to detect suspicious referral patterns. Please refer genuine users only.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/20 pb-2">
        <button
          onClick={() => {
            setShowReferrals(true)
            setShowEarnings(false)
          }}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            showReferrals ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>My Referrals</span>
            <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">
              {stats.totalReferrals}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => {
            setShowReferrals(false)
            setShowEarnings(true)
          }}
          className={`px-4 py-2 rounded-t-lg transition-colors ${
            showEarnings ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <span>Commission Earnings</span>
            <span className="bg-green-500/30 text-green-300 text-xs px-2 py-0.5 rounded-full">
              {earnings.length}
            </span>
          </div>
        </button>
        
        <div className="ml-auto">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Referrals List */}
      <AnimatePresence>
        {showReferrals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                {/* Level Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Level:</span>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="all">All Levels</option>
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="level">Level</option>
                    <option value="points">Points</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Referrals Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
              </div>
            ) : filteredReferrals.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10 border-b border-white/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">User</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Level</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Points</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredReferrals.map((referral) => (
                        <tr key={referral.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{referral.profiles?.full_name || 'User'}</p>
                                <p className="text-gray-400 text-sm">{referral.profiles?.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              referral.level === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                              referral.level === 2 ? 'bg-purple-500/20 text-purple-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              Level {referral.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              referral.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {referral.status === 'completed' ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${
                              referral.status === 'completed' ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              {referral.status === 'completed' ? `+${referral.points_awarded}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Referrals Yet</h3>
                <p className="text-gray-400 mb-6">
                  Share your referral code with friends to start earning points!
                </p>
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Copy className="h-5 w-5" />
                  Copy Referral Link
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Earnings List */}
      <AnimatePresence>
        {showEarnings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  />
                </div>

                {/* Level Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Level:</span>
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="all">All Levels</option>
                    <option value={1}>Level 1 (10%)</option>
                    <option value={2}>Level 2 (5%)</option>
                    <option value={3}>Level 3 (2%)</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="level">Level</option>
                    <option value="points">Points</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Earnings Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
              </div>
            ) : filteredEarnings.length > 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10 border-b border-white/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">User</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Level</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Original Points</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Commission</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredEarnings.map((earning) => (
                        <tr key={earning.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{earning.profiles?.full_name || 'User'}</p>
                                <p className="text-gray-400 text-sm">{earning.profiles?.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              earning.level === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                              earning.level === 2 ? 'bg-purple-500/20 text-purple-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              Level {earning.level} ({earning.commission_percentage}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {earning.original_points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-green-400 font-medium">
                              +{earning.commission_points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                            {new Date(earning.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Commission Earnings Yet</h3>
                <p className="text-gray-400 mb-6">
                  You'll earn commission when your referrals complete tasks and earn points!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">How do I earn from referrals?</h3>
            <p className="text-gray-300">
              You earn in two ways: first, you get bonus points when your referrals complete their first task (500/200/100 points depending on level). Second, you earn ongoing commission on all points they earn (10%/5%/2% depending on level).
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">What is a 3-tier referral system?</h3>
            <p className="text-gray-300">
              Our 3-tier system allows you to earn from three levels of referrals: people you directly refer (Level 1), people they refer (Level 2), and people those Level 2 referrals bring in (Level 3).
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">When do referrals become "completed"?</h3>
            <p className="text-gray-300">
              A referral is marked as "completed" when the referred user completes their first task or game on the platform. This triggers the bonus point award to you.
            </p>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Is there a limit to how many people I can refer?</h3>
            <p className="text-gray-300">
              No, there's no limit! You can refer as many people as you want and earn from all of them. The more active users you refer, the more commission you'll earn.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ReferralProgramPage