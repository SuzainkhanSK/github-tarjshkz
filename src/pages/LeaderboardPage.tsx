import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  X,
  Users,
  Sparkles,
  Zap,
  Gift,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured, type Database } from '../lib/supabase'
import toast from 'react-hot-toast'
import LazyImage from '../components/LazyImage'

interface LeaderboardUser {
  id: string
  email: string
  full_name?: string
  points: number
  profile_image?: string
  rank?: number
}

interface RewardTier {
  rank: number
  minPoints: number
  maxPoints: number
  icon: React.ReactNode
  color: string
  label: string
  description: string
}

const LeaderboardPage: React.FC = () => {
  const { user, userProfile } = useAuth()
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRewardsInfo, setShowRewardsInfo] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [nextRewardDate, setNextRewardDate] = useState<Date | null>(null)
  const [timeUntilReward, setTimeUntilReward] = useState<string>('')

  useEffect(() => {
    fetchLeaderboard()
    calculateNextRewardDate()
    
    const interval = setInterval(() => {
      if (nextRewardDate) {
        updateTimeUntilReward()
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [user])

  const calculateNextRewardDate = () => {
    const now = new Date()
    let nextReward = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    setNextRewardDate(nextReward)
    updateTimeUntilReward()
  }

  const updateTimeUntilReward = () => {
    if (!nextRewardDate) return
    
    const now = new Date()
    const diff = nextRewardDate.getTime() - now.getTime()
    
    if (diff <= 0) {
      calculateNextRewardDate()
      return
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    setTimeUntilReward(`${days}d ${hours}h`)
  }

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Database not configured. Please connect to Supabase to view leaderboard.')
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      
      // Use the RPC function to get leaderboard users
      const { data: topUsers, error: topUsersError } = await supabase
        .rpc('get_leaderboard_users', { limit_param: 10 })

      if (topUsersError) throw topUsersError

      if (!topUsers || topUsers.length === 0) {
        setLeaderboardUsers([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Process user names to handle null/undefined
      const processedUsers = topUsers.map(user => ({
        ...user,
        full_name: user.full_name || (user.email ? user.email.split('@')[0] : 'Anonymous User'),
        points: user.points || 0
      }))

      const rankedUsers = processedUsers.map((u, index) => ({
        ...u,
        rank: index + 1
      }))

      setLeaderboardUsers(rankedUsers)

      if (user?.id) {
        const currentUserInTop = rankedUsers.find(u => u.id === user.id)
        
        if (currentUserInTop) {
          setUserRank(currentUserInTop.rank)
        } else {
          // Get current user's profile using the profiles table directly
          const { data: currentUserData, error: currentUserError } = await supabase
            .from('profiles')
            .select('id, email, full_name, points, profile_image, created_at')
            .eq('id', user.id)
            .single()

          if (currentUserError) throw currentUserError
          
          if (currentUserData) {
            // Count users with more points than current user
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .gt('points', currentUserData.points || 0)

            if (countError) throw countError
            
            setUserRank((count || 0) + 1)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      toast.error('Failed to load leaderboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const rewardTiers: RewardTier[] = [
    {
      rank: 1,
      minPoints: 500,
      maxPoints: 2000,
      icon: <Crown className="h-5 w-5" />,
      color: 'from-yellow-400 to-yellow-600',
      label: '1st Place',
      description: 'Earn 500-2000 bonus points'
    },
    {
      rank: 2,
      minPoints: 400,
      maxPoints: 1000,
      icon: <Medal className="h-5 w-5" />,
      color: 'from-gray-300 to-gray-500',
      label: '2nd Place',
      description: 'Earn 400-1000 bonus points'
    },
    {
      rank: 3,
      minPoints: 300,
      maxPoints: 800,
      icon: <Award className="h-5 w-5" />,
      color: 'from-amber-600 to-amber-800',
      label: '3rd Place',
      description: 'Earn 300-800 bonus points'
    }
  ]

  const getRewardDistribution = (rank: number): string => {
    switch (rank) {
      case 1:
        return '60% chance: 500-800 pts | 25% chance: 801-1200 pts | 10% chance: 1201-1600 pts | 5% chance: 1601-2000 pts'
      case 2:
        return '70% chance: 400-600 pts | 20% chance: 601-800 pts | 8% chance: 801-900 pts | 2% chance: 901-1000 pts'
      case 3:
        return '75% chance: 300-500 pts | 20% chance: 501-650 pts | 4% chance: 651-750 pts | 1% chance: 751-800 pts'
      default:
        return ''
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <Crown className="h-4 w-4 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
            <Medal className="h-4 w-4 text-white" />
          </div>
        )
      case 3:
        return (
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center shadow-lg">
            <Award className="h-4 w-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">{rank}</span>
          </div>
        )
    }
  }

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return 'st'
    if (rank === 2) return 'nd'
    if (rank === 3) return 'rd'
    return 'th'
  }

  const getPlaceholderImage = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
      case 2:
        return 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150'
      case 3:
        return 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150'
      default:
        return `https://images.pexels.com/photos/${1000000 + rank * 11}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=150`
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Compete with other users and earn bonus rewards!
        </p>
        
        {userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 inline-block"
          >
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Your Current Rank</p>
                <p className="text-2xl font-bold text-yellow-400">
                  #{userRank}<span className="text-sm">{getRankSuffix(userRank)}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Top 3 Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-transparent rounded-3xl blur-xl"></div>
        
        <div className="relative bg-gradient-to-b from-indigo-900/30 to-transparent backdrop-blur-sm rounded-3xl p-8 border border-indigo-500/30">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" /> 
              Top Players
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchLeaderboard}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowRewardsInfo(!showRewardsInfo)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors text-sm"
              >
                <Info className="h-4 w-4 text-blue-400" />
                <span className="text-white">Rewards Info</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* 2nd Place */}
            <div className="order-1 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="text-center">
                    <div className="text-gray-300 text-sm font-bold">2<span className="text-xs">nd</span></div>
                    <div className="w-10 h-10 mx-auto">
                      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 0L24.4903 13.8197H39.0211L27.2654 22.3607L31.7557 36.1803L20 27.6393L8.2443 36.1803L12.7346 22.3607L0.97887 13.8197H15.5097L20 0Z" fill="#D1D5DB"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-gray-400 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
                  {!loading && leaderboardUsers[1] ? (
                    <LazyImage
                      src={leaderboardUsers[1].profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[1].full_name || leaderboardUsers[1].email)}&background=random`}
                      alt={leaderboardUsers[1].full_name || 'Second Place'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 animate-pulse"></div>
                  )}
                </div>
              </motion.div>
              
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold text-lg">
                  {!loading ? (leaderboardUsers[1]?.full_name || 'Anonymous User') : 'Loading...'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {!loading && leaderboardUsers[1] ? (
                    <span className="flex items-center justify-center gap-1">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{leaderboardUsers[1].points.toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="w-16 h-4 bg-gray-700 rounded animate-pulse inline-block"></span>
                  )}
                </p>
              </div>
              
              <div className="mt-4 h-32 w-full bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-lg relative">
                <div className="absolute inset-x-0 -top-2 flex justify-center">
                  <div className="px-3 py-1 bg-gray-400 rounded-full text-gray-900 text-xs font-bold">
                    2nd
                  </div>
                </div>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="order-2 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                  <div className="text-center">
                    <div className="text-yellow-300 text-sm font-bold">1<span className="text-xs">st</span></div>
                    <div className="w-14 h-14 mx-auto">
                      <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M28 0L34.2863 19.3373H54.6085L38.1611 31.3254L44.4474 50.6627L28 38.6746L11.5526 50.6627L17.8389 31.3254L1.39155 19.3373H21.7137L28 0Z" fill="#FCD34D"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-4 border-yellow-400 overflow-hidden bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-lg shadow-yellow-500/20">
                  {!loading && leaderboardUsers[0] ? (
                    <LazyImage
                      src={leaderboardUsers[0].profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[0].full_name || leaderboardUsers[0].email)}&background=random`}
                      alt={leaderboardUsers[0].full_name || 'First Place'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-yellow-700 animate-pulse"></div>
                  )}
                </div>
                
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-full h-full text-yellow-400" />
                </motion.div>
              </motion.div>
              
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold text-xl">
                  {!loading ? (leaderboardUsers[0]?.full_name || 'Anonymous User') : 'Loading...'}
                </h3>
                <p className="text-yellow-300 text-lg font-bold">
                  {!loading && leaderboardUsers[0] ? (
                    <span className="flex items-center justify-center gap-1">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <span>{leaderboardUsers[0].points.toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="w-20 h-6 bg-yellow-700 rounded animate-pulse inline-block"></span>
                  )}
                </p>
              </div>
              
              <div className="mt-4 h-40 w-full bg-gradient-to-t from-yellow-400/30 to-yellow-400/10 rounded-t-lg relative">
                <div className="absolute inset-x-0 -top-2 flex justify-center">
                  <div className="px-3 py-1 bg-yellow-400 rounded-full text-yellow-900 text-xs font-bold">
                    1st
                  </div>
                </div>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="order-3 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="text-center">
                    <div className="text-amber-600 text-sm font-bold">3<span className="text-xs">rd</span></div>
                    <div className="w-10 h-10 mx-auto">
                      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 0L24.4903 13.8197H39.0211L27.2654 22.3607L31.7557 36.1803L20 27.6393L8.2443 36.1803L12.7346 22.3607L0.97887 13.8197H15.5097L20 0Z" fill="#B45309"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-700 overflow-hidden bg-gradient-to-br from-amber-800 to-amber-950">
                  {!loading && leaderboardUsers[2] ? (
                    <LazyImage
                      src={leaderboardUsers[2].profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboardUsers[2].full_name || leaderboardUsers[2].email)}&background=random`}
                      alt={leaderboardUsers[2].full_name || 'Third Place'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-800 animate-pulse"></div>
                  )}
                </div>
              </motion.div>
              
              <div className="mt-4 text-center">
                <h3 className="text-white font-bold text-lg">
                  {!loading ? (leaderboardUsers[2]?.full_name || 'Anonymous User') : 'Loading...'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {!loading && leaderboardUsers[2] ? (
                    <span className="flex items-center justify-center gap-1">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-300">{leaderboardUsers[2].points.toLocaleString()}</span>
                    </span>
                  ) : (
                    <span className="w-16 h-4 bg-amber-800 rounded animate-pulse inline-block"></span>
                  )}
                </p>
              </div>
              
              <div className="mt-4 h-24 w-full bg-gradient-to-t from-amber-700/30 to-amber-700/10 rounded-t-lg relative">
                <div className="absolute inset-x-0 -top-2 flex justify-center">
                  <div className="px-3 py-1 bg-amber-700 rounded-full text-amber-100 text-xs font-bold">
                    3rd
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-400" />
          Top 10 Players
        </h2>
        
        <div className="space-y-3">
          {loading ? (
            [...Array(10)].map((_, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : (
            leaderboardUsers.map((leaderUser, index) => (
              <motion.div
                key={leaderUser.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-300 ${
                  user?.id === leaderUser.id ? 'border-2 border-blue-500/50 bg-blue-500/10' : 'border border-white/10'
                }`}
              >
                {getRankBadge(index + 1)}
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/30 to-purple-500/30">
                      <LazyImage
                        src={leaderUser.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderUser.full_name || leaderUser.email)}&background=random`}
                        alt={leaderUser.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {index < 3 && (
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        'bg-amber-700'
                      }`}>
                        {index === 0 ? (
                          <Crown className="h-3 w-3 text-yellow-900" />
                        ) : index === 1 ? (
                          <Medal className="h-3 w-3 text-gray-800" />
                        ) : (
                          <Award className="h-3 w-3 text-amber-200" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {leaderUser.full_name || 'Anonymous User'} 
                      {user?.id === leaderUser.id && <span className="ml-2 text-blue-400 text-xs">(You)</span>}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {leaderUser.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`text-right ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-300' : 
                      index === 2 ? 'text-amber-500' : 
                      'text-blue-400'
                    }`}>
                      <div className="flex items-center gap-1 justify-end">
                        <Zap className="h-4 w-4" />
                        <span className="font-bold">{leaderUser.points.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Leaderboard Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-400" />
            Leaderboard Rewards
          </h2>
          
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2 border border-white/20">
            <Calendar className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-white text-sm">Next Reward</p>
              <p className="text-blue-400 text-xs font-mono">
                {nextRewardDate ? nextRewardDate.toLocaleDateString() : 'Loading...'}
              </p>
            </div>
            <Clock className="h-4 w-4 text-yellow-400" />
            <p className="text-yellow-400 text-sm font-mono">{timeUntilReward}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {rewardTiers.map((tier) => (
            <motion.div
              key={tier.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + tier.rank * 0.1 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center`}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold">{tier.label}</h3>
                  <p className="text-gray-300 text-sm">{tier.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Min Reward</span>
                  <span className="text-white font-medium">{tier.minPoints} points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Max Reward</span>
                  <span className="text-white font-medium">{tier.maxPoints} points</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${tier.color}`}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300 text-xs">
                  {getRewardDistribution(tier.rank)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-300 font-semibold mb-1">How Rewards Work</h4>
              <p className="text-blue-200 text-sm">
                Leaderboard positions are calculated based on total points. Rewards are distributed on the 1st of each month to the top 3 users. Stay active and earn points to climb the ranks!
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rewards Info Modal */}
      <AnimatePresence>
        {showRewardsInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRewardsInfo(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                  Leaderboard Reward System
                </h3>
                <button
                  onClick={() => setShowRewardsInfo(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-300">
                  Our leaderboard rewards the most active and successful members of our community. 
                  At the beginning of each month, the top 3 users on the leaderboard receive bonus points 
                  based on their ranking.
                </p>
                
                <div className="space-y-4">
                  {rewardTiers.map((tier) => (
                    <div key={tier.rank} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${tier.color} rounded-lg flex items-center justify-center`}>
                          {tier.icon}
                        </div>
                        <div>
                          <h4 className="text-white font-bold">{tier.label}</h4>
                          <p className="text-gray-300 text-sm">{tier.minPoints}-{tier.maxPoints} bonus points</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 rounded-lg p-3">
                        <h5 className="text-white text-sm font-medium mb-2">Reward Distribution:</h5>
                        <p className="text-gray-300 text-xs">
                          {getRewardDistribution(tier.rank)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-1">How to Climb the Ranks</h4>
                      <ul className="text-purple-200 text-sm space-y-1">
                        <li>• Complete daily tasks and special missions</li>
                        <li>• Play games like Spin & Win and Scratch & Earn</li>
                        <li>• Invite friends through the referral program</li>
                        <li>• Participate in quizzes and limited-time events</li>
                        <li>• Check in daily for consecutive login bonuses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LeaderboardPage