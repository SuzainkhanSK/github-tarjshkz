import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Trophy, 
  Gift, 
  Coins, 
  History, 
  Star,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Gamepad2,
  Users,
  MessageCircle,
  Mail,
  ArrowRight,
  Play,
  Tv,
  Package,
  Music,
  Heart,
  Smartphone,
  Globe,
  Crown,
  Check,
  Database,
  X,
  Calendar
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'
import DashboardSupportCard from '../components/DashboardSupportCard'
import SupportButton from '../components/SupportButton'
import { Link as RouterLink } from 'react-router-dom'
import PremiumSubscriptions from '../components/PremiumSubscriptions'

const Dashboard: React.FC = () => {
  const { userProfile, user, checkAndAwardSignupBonus, refreshProfile } = useAuth()
  const [stats, setStats] = useState({
    todayEarned: 0,
    tasksCompleted: 0,
    totalTransactions: 0,
    weeklyEarned: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [fixingBonus, setFixingBonus] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Only show loading if we have a user and Supabase is configured
    if (user?.id && isSupabaseConfigured) {
      setLoading(true)
      checkDatabaseConnection()
    } else {
      setLoading(false)
      setDatabaseConnected(false)
      setConnectionError(null)
    }

    // Show confetti animation on initial load
    setTimeout(() => {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }, 1000)
  }, [user])

  const checkDatabaseConnection = async () => {
    if (!isSupabaseConfigured) {
      setDatabaseConnected(false)
      setConnectionError('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      // Fast connection check with short timeout
      const connectionPromise = supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )

      await Promise.race([connectionPromise, timeoutPromise])

      setDatabaseConnected(true)
      setConnectionError(null)
      
      // Fetch dashboard data in background - don't block UI
      fetchDashboardData().catch((error) => {
        console.warn('Dashboard data fetch failed (non-critical):', error)
      })
    } catch (error: any) {
      console.warn('Database connection check failed (non-critical):', error)
      setDatabaseConnected(false)
      
      // Set user-friendly error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Connection timeout')) {
        setConnectionError('Network connection failed. Please check your internet connection.')
      } else if (error.message?.includes('timeout')) {
        setConnectionError('Database connection timed out. Please try again.')
      } else {
        setConnectionError('Unable to connect to database. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    if (!user?.id || !isSupabaseConfigured || !databaseConnected) return

    try {
      // Check if userProfile is available
      if (!userProfile) {
        throw new Error('No user profile available')
      }

      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Use individual queries instead of the problematic function
      const queries = [
        Promise.race([
          supabase.from('transactions').select('points').eq('user_id', user.id).eq('type', 'earn').gte('created_at', today),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('transactions').select('points').eq('user_id', user.id).eq('type', 'earn').gte('created_at', weekAgo),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('tasks').select('id').eq('user_id', user.id).eq('completed', true),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('transactions').select('id').eq('user_id', user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ])
      ]

      // Execute queries with individual error handling
      const results = await Promise.allSettled(queries)

      // Process results safely
      const [todayResult, weeklyResult, tasksResult, transactionsResult] = results

      setStats({
        todayEarned: todayResult.status === 'fulfilled' && todayResult.value?.data 
          ? todayResult.value.data.reduce((sum: number, t: any) => sum + t.points, 0) 
          : 0,
        tasksCompleted: tasksResult.status === 'fulfilled' && tasksResult.value?.data 
          ? tasksResult.value.data.length 
          : 0,
        totalTransactions: transactionsResult.status === 'fulfilled' && transactionsResult.value?.data 
          ? transactionsResult.value.data.length 
          : 0,
        weeklyEarned: weeklyResult.status === 'fulfilled' && weeklyResult.value?.data 
          ? weeklyResult.value.data.reduce((sum: number, t: any) => sum + t.points, 0) 
          : 0
      })

      // Fetch recent transactions separately
      fetchRecentActivity()
    } catch (error) {
      console.warn('Dashboard data fetch failed (non-critical):', error)
      // Set default values on error
      setStats({
        todayEarned: 0,
        tasksCompleted: 0,
        totalTransactions: 0,
        weeklyEarned: 0
      })
    }
  }

  const fetchRecentActivity = async () => {
    if (!user?.id || !isSupabaseConfigured || !databaseConnected) return

    try {
      setActivityLoading(true)

      // Create a promise with timeout for recent transactions
      const transactionsPromise = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Recent activity timeout')), 5000)
      )

      const { data, error } = await Promise.race([
        transactionsPromise,
        timeoutPromise
      ]) as any

      if (error) throw error
      
      setRecentTransactions(data || [])
    } catch (error) {
      console.warn('Recent activity fetch failed (non-critical):', error)
      setRecentTransactions([])
      // Only show toast for non-timeout errors to avoid spamming the user
      if (error.message && !error.message.includes('timeout')) {
        toast.error('Failed to load recent activity')
      }
    } finally {
      setActivityLoading(false)
    }
  }

  const handleFixSignupBonus = async () => {
    if (!user?.id || !isSupabaseConfigured) return
    
    setFixingBonus(true)
    try {
      await checkAndAwardSignupBonus()
      await refreshProfile()
      await fetchDashboardData()
      toast.success('Signup bonus check completed!')
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } catch (error: any) {
      console.warn('Signup bonus fix failed (non-critical):', error)
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error('Failed to check signup bonus. Please try again.')
      }
    } finally {
      setFixingBonus(false)
    }
  }

 const quickActions = [
    {
      title: 'Spin & Win',
      description: 'Spin the wheel for a chance to win points',
      icon: Trophy,
      color: 'from-yellow-400 to-orange-500',
      href: '/games/spin-win'
    },
    {
      title: 'Scratch & Earn',
      description: 'Scratch cards to reveal hidden prizes',
      icon: Award,
      color: 'from-purple-400 to-pink-500',
      href: '/games/scratch-earn'
    },
    {
      title: 'Daily Check-in',
      description: 'Check in daily for increasing rewards',
      icon: Calendar,
      color: 'from-yellow-500 to-orange-600', 
      href: '/special-tasks/daily-check-in',
      popular: true
    },
    {
      title: 'Trivia Quiz',
      description: 'Test your knowledge and earn points',
      icon: Gamepad2,
      color: 'from-blue-400 to-cyan-500',
      href: '/games/trivia-quiz' 
    },
    {
      title: 'Leaderboard',
      description: 'Compete for top positions and earn bonus rewards',
      icon: Award,
      color: 'from-purple-500 to-indigo-600',
      href: '/leaderboard',
      popular: true
    }
  ];

  const statCards = [
    {
      title: 'Current Balance',
      value: userProfile?.points || 0,
      icon: Coins,
      color: 'from-green-400 to-green-600',
      suffix: ' Points',
      increase: '+15%'
    },
    {
      title: 'Today\'s Earnings',
      value: stats.todayEarned,
      icon: TrendingUp,
      color: 'from-blue-400 to-blue-600',
      suffix: ' Points',
      increase: '+5%'
    },
    {
      title: 'Tasks Completed',
      value: stats.tasksCompleted,
      icon: Award,
      color: 'from-purple-400 to-purple-600',
      suffix: ' Tasks',
      increase: '+3'
    },
    {
      title: 'Weekly Earned',
      value: stats.weeklyEarned,
      icon: Calendar,
      color: 'from-orange-400 to-orange-600',
      suffix: ' Points',
      increase: '+20%'
    }
  ]

  // Confetti animation
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            initial={{ 
              top: "50%", 
              left: "50%",
              scale: 0,
              opacity: 1,
              backgroundColor: ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4', '#9370DB'][Math.floor(Math.random() * 6)]
            }}
            animate={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              scale: Math.random() * 2 + 1,
              opacity: 0
            }}
            transition={{ 
              duration: Math.random() * 2 + 1,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    );
  };

  // Show minimal loading only when actually fetching data
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Show skeleton content instead of full loading screen */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30 animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-4 w-3/4"></div>
          <div className="h-6 bg-white/20 rounded w-1/2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-pulse">
              <div className="h-12 w-12 bg-white/20 rounded-xl mb-4"></div>
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {renderConfetti()}
      
      {/* Database Setup Notice */}
      {(!databaseConnected || !isSupabaseConfigured) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Database className="h-6 w-6 text-blue-300 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-blue-200 font-semibold mb-2">
                {!isSupabaseConfigured ? 'Complete Your Setup' : 'Connection Issue'}
              </h3>
              <p className="text-blue-100 text-sm mb-3">
                {!isSupabaseConfigured 
                  ? 'To unlock all features including points tracking, tasks, and rewards, please connect your database. Click the "Connect to Supabase" button in the top right corner to get started.'
                  : connectionError || 'Unable to connect to the database. Some features may be limited.'
                }
              </p>
              {!isSupabaseConfigured && (
                <div className="bg-blue-400/20 rounded-lg p-3 border border-blue-400/30">
                  <p className="text-blue-200 text-xs font-medium">
                    🎁 Once connected, you'll automatically receive your 100 welcome bonus points!
                  </p>
                </div>
              )}
              {connectionError && isSupabaseConfigured && (
                <button
                  onClick={checkDatabaseConnection}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 rounded-lg text-blue-200 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Signup Bonus Missing Notice */}
      {databaseConnected && isSupabaseConfigured && userProfile && userProfile.points === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-300 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-200 font-semibold mb-2">Missing Welcome Bonus?</h3>
              <p className="text-yellow-100 text-sm mb-4">
                It looks like you haven't received your 100 welcome bonus points yet. This might happen if there was an issue during account creation.
              </p>
              <button
                onClick={handleFixSignupBonus}
                disabled={fixingBonus}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-lg text-yellow-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixingBonus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {fixingBonus ? 'Checking...' : 'Claim Welcome Bonus'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-yellow-400/30 overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-xl"
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
            className="absolute bottom-10 right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-xl"
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

        {/* Floating coins animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-800 font-bold text-xs"
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                opacity: 0
              }}
              animate={{ 
                y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                opacity: [0, 0.7, 0],
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 10 + Math.random() * 5,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut"
              }}
            >
              <Coins className="h-3 w-3" />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
              Welcome back, {userProfile?.full_name || 'User'}!
              <motion.span
                className="ml-2 inline-block"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: 3, repeatDelay: 5 }}
              >
                👋
              </motion.span>
            </h1>
            <motion.p 
              className="text-gray-200 text-base sm:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              You have <motion.span 
                className="font-bold text-yellow-400"
                animate={{ 
                  scale: [1, 1.1, 1],
                  textShadow: ["0px 0px 0px rgba(255,204,0,0)", "0px 0px 8px rgba(255,204,0,0.5)", "0px 0px 0px rgba(255,204,0,0)"]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >{userProfile?.points || 0} points</motion.span> ready to use
              <motion.span
                className="ml-1 inline-block"
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 1, repeat: 2, repeatDelay: 6 }}
              >
                ✨
              </motion.span>
            </motion.p>
            {(!databaseConnected || !isSupabaseConfigured) && (
              <p className="text-yellow-300 text-sm mt-2">
                {!isSupabaseConfigured 
                  ? 'Connect to Supabase to start earning and tracking points'
                  : 'Reconnect to database to sync your latest points'
                }
              </p>
            )}
          </div>
          <motion.div 
            className="hidden md:block"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.5
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
              transition={{ 
                scale: { duration: 0.5 },
                rotate: { duration: 2, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <motion.img 
                  src="https://i.ibb.co/R4TBHtVV/erasebg-transformed.png" 
                  alt="Premium Access Zone" 
                  className="h-24 w-auto"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ 
              y: -5,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              scale: 1.02
            }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className={`w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.5)", "0 0 0 rgba(255,255,255,0)"]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  <stat.icon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="bg-green-500/20 px-2 py-1 rounded-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span className="text-green-400 text-xs sm:text-sm font-medium">{stat.increase}</span>
              </motion.div>
            </div>
            
            <motion.h3 
              className="text-xl sm:text-2xl font-bold text-white mb-1"
              animate={{ 
                textShadow: ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 8px rgba(255,255,255,0.3)", "0px 0px 0px rgba(255,255,255,0)"]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
            >
              {stat.value.toLocaleString()}{stat.suffix}
            </motion.h3>
            
            <p className="text-gray-300 text-xs sm:text-sm">{stat.title}</p>
            
            {/* Animated progress indicator */}
            <motion.div 
              className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <motion.div 
                className={`h-full bg-gradient-to-r ${stat.color}`}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, (stat.value / (stat.value + 50)) * 100)}%` }}
                transition={{ duration: 1, delay: 1 + index * 0.1 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Explore Premium Subscriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-6">
          <motion.span
            animate={{ 
              textShadow: ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 10px rgba(255,255,255,0.5)", "0px 0px 0px rgba(255,255,255,0)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Explore Premium Subscriptions
          </motion.span>
        </h2>
        
        <PremiumSubscriptions />
      </motion.div>

      {/* Quick Actions and Support */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-yellow-400" />
            <span>Quick Actions</span>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-2 w-2 h-2 bg-yellow-400 rounded-full"
            />
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                className="group block relative"
              >
                <RouterLink
                  to={action.href}
                  className="bg-white/10 rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden block"
                >
                  {/* Background animation */}
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-xl`}
                      animate={{ 
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  
                  {/* Popular badge */}
                  {action.popular && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🔥 Popular
                      </motion.div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10`}
                    whileHover={{ rotate: 5 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </motion.div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 relative z-10">{action.title}</h3>
                  <p className="text-gray-300 text-sm relative z-10">{action.description}</p>
                  
                  {/* Animated arrow */}
                  <motion.div
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </motion.div>
                </RouterLink>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support Card */}
        <DashboardSupportCard />
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
              x: [0, 20, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, -20, 0],
              y: [0, 20, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <motion.h2 
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
              <Star className="h-5 sm:h-6 w-5 sm:w-6 text-blue-400" />
            </motion.div>
            Recent Activity
          </motion.h2>
          
          <motion.button 
            onClick={fetchRecentActivity}
            disabled={activityLoading}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${activityLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        
        {databaseConnected && isSupabaseConfigured ? (
          activityLoading && recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <motion.div 
                className="w-10 h-10 border-b-2 border-blue-400 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {(recentTransactions as any[]).map((transaction: any, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)"
                  }}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'earn' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      animate={{ 
                        boxShadow: [
                          "0 0 0 rgba(255,255,255,0)", 
                          "0 0 10px rgba(255,255,255,0.3)", 
                          "0 0 0 rgba(255,255,255,0)"
                        ]
                      }}
                      transition={{ 
                        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      {transaction.type === 'earn' ? '+' : '-'}
                    </motion.div>
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">{transaction.description}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(transaction.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <motion.div 
                    className={`font-bold ${
                      transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                      textShadow: [
                        "0 0 0 rgba(255,255,255,0)", 
                        "0 0 8px rgba(255,255,255,0.3)", 
                        "0 0 0 rgba(255,255,255,0)"
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 4,
                      delay: index * 0.5
                    }}
                  >
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.8
                }}
              >
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-gray-400">No recent activity yet</p>
              <p className="text-gray-500 text-sm">
                Complete tasks to see your activity here
              </p>
              <motion.button 
                onClick={fetchRecentActivity} 
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Activity
                </div>
              </motion.button>
            </motion.div>
          )
        ) : (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.8
              }}
            >
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            </motion.div>
            <p className="text-gray-400">No recent activity yet</p>
            <p className="text-gray-500 text-sm">
              {(!databaseConnected || !isSupabaseConfigured)
                ? 'Connect to database to start tracking your activity' 
                : 'Complete tasks to see your activity here'
              }
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Support Button */}
      <SupportButton />
    </div>
  )
}

export default Dashboard