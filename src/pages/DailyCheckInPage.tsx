import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  CheckCircle, 
  Clock, 
  Gift, 
  Award, 
  Zap, 
  Info, 
  RefreshCw,
  Star, 
  Trophy,
  Flame,
  X,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'
import { Link } from 'react-router-dom'

interface CheckInDay {
  day: number
  points: number
  status: 'locked' | 'available' | 'claimed' 
  date?: string
  icon: string
}

const DailyCheckInPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [checkInDays, setCheckInDays] = useState<CheckInDay[]>([
    { day: 1, points: 20, status: 'locked', icon: '⭐' },
    { day: 2, points: 40, status: 'locked', icon: '💎' },
    { day: 3, points: 80, status: 'locked', icon: '🔍' },
    { day: 4, points: 120, status: 'locked', icon: '💎' },
    { day: 5, points: 150, status: 'locked', icon: '🔍' },
    { day: 6, points: 200, status: 'locked', icon: '⭐' },
    { day: 7, points: 300, status: 'locked', icon: '🎁' }
  ])
  const [timeUntilNextCheckIn, setTimeUntilNextCheckIn] = useState<string>('')
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [checkInHistory, setCheckInHistory] = useState<any[]>([])
  const [processingCheckIn, setProcessingCheckIn] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchCheckInStatus()
      const timer = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(timer)
    }
  }, [user])

  const fetchCheckInStatus = async () => {
    if (!user?.id || !isSupabaseConfigured) {
      // Set default state for when database is not connected
      setCanCheckIn(true)
      setCurrentStreak(0)
      return
    }

    try {
      setLoading(true)

      // Get check-in history
      const { data: historyData, error: historyError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_type', 'daily_check_in')
        .order('completed_at', { ascending: false })
        .limit(10)

      if (historyError) throw historyError

      setCheckInHistory(historyData || [])

      // Calculate current streak and next available check-in time
      let streak = 0
      let lastCheckInDate: Date | null = null
      let canCheck = true

      if (historyData && historyData.length > 0) {
        // Get the most recent check-in
        const lastCheckIn = historyData[0]
        lastCheckInDate = new Date(lastCheckIn.completed_at)
        const today = new Date()
        
        // Check if already checked in today
        if (lastCheckInDate.toDateString() === today.toDateString()) {
          canCheck = false
        } else {
          // Check if streak is broken (more than 1 day since last check-in)
          const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceLastCheckIn > 1) {
            // Streak broken
            streak = 0
          } else {
            // Count consecutive days
            let currentDate = new Date(today)
            currentDate.setDate(currentDate.getDate() - 1) // Start from yesterday
            
            let consecutiveDays = 0
            let checkIndex = 0
            
            while (checkIndex < historyData.length) {
              const checkDate = new Date(historyData[checkIndex].completed_at)
              
              // If this check-in was on the current date we're checking
              if (checkDate.toDateString() === currentDate.toDateString()) {
                consecutiveDays++
                currentDate.setDate(currentDate.getDate() - 1) // Move to previous day
                checkIndex++
              } else if (checkDate.toDateString() > currentDate.toDateString()) {
                // This check-in is newer than the date we're checking, skip it
                checkIndex++
              } else {
                // This check-in is older, streak is broken
                break
              }
            }
            
            streak = consecutiveDays
          }
        }
      }

      // Update streak (capped at 6 since day 7 would be claimed today)
      setCurrentStreak(Math.min(streak, 6))
      setCanCheckIn(canCheck)

      // Update check-in days status
      const updatedDays = [...checkInDays]
      
      // Mark days as claimed up to current streak and add dates
      for (let i = 0; i < streak; i++) {
        const claimDate = new Date()
        claimDate.setDate(claimDate.getDate() - (streak - i))
        updatedDays[i].status = 'claimed'
        updatedDays[i].date = formatDate(claimDate)
      }
      
      // Mark next day as available if can check in
      if (canCheck && streak < 7) {
        updatedDays[streak].status = 'available'
      }
      
      setCheckInDays(updatedDays)

      // Calculate time until next check-in
      if (!canCheck && lastCheckInDate) {
        const nextCheckInTime = new Date(lastCheckInDate)
        nextCheckInTime.setDate(nextCheckInTime.getDate() + 1)
        nextCheckInTime.setHours(0, 0, 0, 0)
        updateTimeRemaining(nextCheckInTime)
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error)
      toast.error('Failed to load check-in status')
    } finally {
      setLoading(false)
    }
  }

  const updateTimeRemaining = (nextCheckInTime?: Date) => {
    if (!canCheckIn) {
      const now = new Date()
      
      // If nextCheckInTime is not provided, calculate it
      if (!nextCheckInTime) {
        // Find the most recent check-in
        if (checkInHistory.length > 0) {
          const lastCheckIn = new Date(checkInHistory[0].completed_at)
          nextCheckInTime = new Date(lastCheckIn)
          nextCheckInTime.setDate(nextCheckInTime.getDate() + 1)
          nextCheckInTime.setHours(0, 0, 0, 0)
        } else {
          // Default to tomorrow at midnight if no history
          nextCheckInTime = new Date()
          nextCheckInTime.setDate(nextCheckInTime.getDate() + 1)
          nextCheckInTime.setHours(0, 0, 0, 0)
        }
      }
      
      const diff = nextCheckInTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        // Time has passed, user can check in now
        setCanCheckIn(true)
        setTimeUntilNextCheckIn('')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeUntilNextCheckIn(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }
  }

  const handleCheckIn = async () => {
    if (!canCheckIn || processingCheckIn) return
    
    setProcessingCheckIn(true)
    
    try {
      // Determine which day to claim and points to award
      const dayToClaim = currentStreak < 7 ? currentStreak : 6 // 0-based index
      let pointsToAward = checkInDays[dayToClaim].points
      
      // For day 7, award a random bonus between 300-1000 points
      if (dayToClaim === 6) {
        // Set up probability distribution:
        // 80% chance: 300-400 points
        // 15% chance: 401-600 points
        // 4% chance: 601-800 points
        // 1% chance: 801-1000 points
        const rand = Math.random() * 100
        
        if (rand < 80) { 
          pointsToAward = Math.floor(Math.random() * 101) + 300 // 300-400
        } else if (rand < 95) {
          pointsToAward = Math.floor(Math.random() * 200) + 401 // 401-600
        } else if (rand < 99) {
          pointsToAward = Math.floor(Math.random() * 200) + 601 // 601-800
        } else {
          pointsToAward = Math.floor(Math.random() * 200) + 801 // 801-1000
        }
      }
      
      if (isSupabaseConfigured && user?.id) {
        // Create task record
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            task_type: 'daily_check_in',
            task_id: `day_${dayToClaim + 1}_${new Date().toISOString().split('T')[0]}`,
            completed: true,
            points_earned: pointsToAward,
            completed_at: new Date().toISOString()
          })

        if (taskError) throw taskError

        // Create transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'earn',
            points: pointsToAward,
            description: `Daily Check-in: Day ${dayToClaim + 1} (${pointsToAward} points)`,
            task_type: 'daily_check_in'
          })

        if (transactionError) throw transactionError

        // Update user profile points
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            points: (userProfile?.points || 0) + pointsToAward,
            total_earned: (userProfile?.total_earned || 0) + pointsToAward
          })
          .eq('id', user.id)

        if (profileError) throw profileError
      }
      
      // Update UI state
      const updatedDays = [...checkInDays]
      updatedDays[dayToClaim].status = 'claimed'
      updatedDays[dayToClaim].date = formatDate(new Date())
      
      if (dayToClaim + 1 < 7) {
        updatedDays[dayToClaim + 1].status = 'available'
      }
      
      setCheckInDays(updatedDays)
      setCurrentStreak(currentStreak + 1)
      setCanCheckIn(false)
      
      // Show confetti animation
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
      
      // Show success message
      toast.success(`🎉 Day ${dayToClaim + 1} check-in complete! You earned ${pointsToAward} points!`)
      
      // Refresh profile and check-in status
      await refreshProfile()
      await fetchCheckInStatus()
      
    } catch (error) {
      console.error('Check-in failed:', error)
      toast.error('Failed to complete check-in. Please try again.')
    } finally {
      setProcessingCheckIn(false)
    }
  }

  const getStreakProgress = () => {
    return Math.min(100, (currentStreak / 7) * 100)
  }

  const getMotivationalMessage = () => {
    if (currentStreak === 0) {
      return "Start your streak today!"
    } else if (currentStreak < 3) {
      return "Great start! Keep it going!"
    } else if (currentStreak < 5) {
      return "You're on fire! Don't break the chain!"
    } else if (currentStreak < 7) {
      return "Almost there! The big reward is coming!"
    } else {
      return "Amazing! You've completed a full week!"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Back Button */}
      <div className="flex items-center mb-4">
        <Link 
          to="/special-tasks" 
          className="text-gray-300 hover:text-white flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Special Tasks
        </Link>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-3xl p-8 border-4 border-yellow-400/30 shadow-xl overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Title and Streak */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Daily Check-in
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Check in daily for increasing rewards!
              </p>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-400" />
                  <div>
                    <div className="text-white font-medium">Current Streak</div>
                    <div className="text-2xl font-bold text-yellow-400">{currentStreak} days</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="text-white font-medium">Next Check-in</div>
                    {canCheckIn ? (
                      <div className="text-green-400 font-bold">Available Now!</div>
                    ) : (
                      <div className="text-xl font-mono font-bold text-white">{timeUntilNextCheckIn}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Streak Progress */}
            <div className="w-full md:w-1/3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Weekly Progress</span>
                <span className="text-yellow-400 font-bold">{Math.round(getStreakProgress())}%</span>
              </div>
              <div className="w-full h-6 bg-white/10 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${getStreakProgress()}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <p className="text-gray-300 text-sm mt-2 text-center">{getMotivationalMessage()}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-8 border-4 border-indigo-400/20 shadow-xl overflow-hidden"
        >
          {/* Header with info button */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gift className="h-6 w-6 text-purple-400" />
              Daily Rewards
            </h2>
            
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Info className="h-5 w-5 text-gray-300" />
            </button>
          </div>
          
          {/* Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-blue-500/20 rounded-xl border-2 border-blue-400/30"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-300 font-semibold mb-2">How Daily Check-ins Work</h3>
                    <ul className="text-blue-200 text-sm space-y-1">
                      <li>• Check in once every 24 hours to earn points</li>
                      <li>• Rewards increase each consecutive day</li>
                      <li>• Missing a day resets your streak to zero</li>
                      <li>• Complete all 7 days for a bonus reward (300-1000 points)</li>
                      <li>• Check-ins reset at midnight local time</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reward Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Days 1-4 */}
            <div className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {checkInDays.slice(0, 4).map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`relative ${
                    day.status === 'available' ? 'animate-pulse' : ''
                  }`}
                >
                  <div className={`relative rounded-2xl overflow-hidden shadow-xl ${
                    day.status === 'claimed'
                      ? 'bg-gradient-to-b from-green-400/20 to-green-600/20 border-4 border-green-400/50'
                      : day.status === 'available'
                      ? 'bg-gradient-to-b from-yellow-400/20 to-orange-500/20 border-4 border-yellow-400/50'
                      : 'bg-gradient-to-b from-gray-700/30 to-gray-900/30 border-4 border-gray-600/30'
                  }`}>
                    {/* Day label */}
                    <div className={`py-2 px-3 ${
                      day.status === 'claimed'
                        ? 'bg-green-500/30'
                        : day.status === 'available'
                        ? 'bg-yellow-500/30'
                        : 'bg-gray-700/30'
                      } text-center`}>
                      <span className={`font-bold ${
                        day.status === 'claimed'
                          ? 'text-green-300'
                          : day.status === 'available'
                          ? 'text-yellow-300'
                          : 'text-gray-400'
                      }`}>Day {day.day}</span>
                    </div>
                    
                    {/* Reward content */}
                    <div className="p-4 flex flex-col items-center">
                      <div className="text-4xl mb-2">{day.icon}</div>
                      <div className={`text-center ${
                        day.status === 'claimed'
                          ? 'text-green-300'
                          : day.status === 'available'
                          ? 'text-yellow-300'
                          : 'text-gray-400'
                      }`}>
                        <div className="font-bold text-xl">{day.points}</div>
                        <div className="text-xs mt-1">POINTS</div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="mt-3">
                        {day.status === 'claimed' ? (
                          <div className="bg-green-500/30 rounded-full p-1">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                        ) : day.status === 'available' ? (
                          <motion.div 
                            className="bg-yellow-500/30 rounded-full p-1"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Gift className="h-5 w-5 text-yellow-400" />
                          </motion.div>
                        ) : (
                          <div className="bg-gray-700/30 rounded-full p-1">
                            <Lock className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* Date (if claimed) */}
                      {day.status === 'claimed' && day.date && (
                        <div className="mt-2 text-center text-green-300 text-xs">
                          {day.date}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Day 7 Bonus Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="col-span-2 md:col-span-1 row-span-2"
            >
              <div className={`relative h-full rounded-2xl overflow-hidden shadow-xl ${
                checkInDays[6].status === 'claimed'
                  ? 'bg-gradient-to-b from-purple-400/20 to-purple-600/20 border-4 border-purple-400/50'
                  : checkInDays[6].status === 'available'
                  ? 'bg-gradient-to-b from-yellow-400/20 to-orange-500/20 border-4 border-yellow-400/50'
                  : 'bg-gradient-to-b from-gray-700/30 to-gray-900/30 border-4 border-gray-600/30'
              }`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute text-white text-2xl"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        transform: `rotate(${Math.random() * 360}deg)`
                      }}
                    >
                      ★
                    </div>
                  ))}
                </div>
                
                {/* Day label */}
                <div className={`py-2 px-3 ${
                  checkInDays[6].status === 'claimed'
                    ? 'bg-purple-500/30'
                    : checkInDays[6].status === 'available'
                    ? 'bg-yellow-500/30'
                    : 'bg-gray-700/30'
                  } text-center`}>
                  <span className={`font-bold ${
                    checkInDays[6].status === 'claimed'
                      ? 'text-purple-300'
                      : checkInDays[6].status === 'available'
                      ? 'text-yellow-300'
                      : 'text-gray-400'
                  }`}>Day 7</span>
                </div>
                
                {/* Bonus content */}
                <div className="p-6 flex flex-col items-center justify-center h-full">
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/30 text-purple-300 text-sm rounded-full">
                      <Trophy className="h-4 w-4" />
                      BONUS DAY
                    </span>
                  </div>
                  
                  <div className="text-6xl mb-4 transform transition-transform hover:scale-110">
                    {checkInDays[6].icon}
                  </div>
                  
                  <div className={`text-center ${
                    checkInDays[6].status === 'claimed'
                      ? 'text-purple-300'
                      : checkInDays[6].status === 'available'
                      ? 'text-yellow-300'
                      : 'text-gray-400'
                  }`}>
                    <div className="font-bold text-xl">300-1000</div>
                    <div className="text-xs mt-1">BONUS POINTS</div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="mt-4">
                    {checkInDays[6].status === 'claimed' ? (
                      <div className="bg-purple-500/30 rounded-full p-2">
                        <CheckCircle className="h-6 w-6 text-purple-400" />
                      </div>
                    ) : checkInDays[6].status === 'available' ? (
                      <motion.div 
                        className="bg-yellow-500/30 rounded-full p-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Gift className="h-6 w-6 text-yellow-400" />
                      </motion.div>
                    ) : (
                      <div className="bg-gray-700/30 rounded-full p-2">
                        <Lock className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Date (if claimed) */}
                  {checkInDays[6].status === 'claimed' && checkInDays[6].date && (
                    <div className="mt-3 text-center text-purple-300 text-xs">
                      {checkInDays[6].date}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Days 5-6 */}
            <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
              {checkInDays.slice(4, 6).map((day, index) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`relative ${
                    day.status === 'available' ? 'animate-pulse' : ''
                  }`}
                >
                  <div className={`relative rounded-2xl overflow-hidden shadow-xl ${
                    day.status === 'claimed'
                      ? 'bg-gradient-to-b from-green-400/20 to-green-600/20 border-4 border-green-400/50'
                      : day.status === 'available'
                      ? 'bg-gradient-to-b from-yellow-400/20 to-orange-500/20 border-4 border-yellow-400/50'
                      : 'bg-gradient-to-b from-gray-700/30 to-gray-900/30 border-4 border-gray-600/30'
                  }`}>
                    {/* Day label */}
                    <div className={`py-2 px-3 ${
                      day.status === 'claimed'
                        ? 'bg-green-500/30'
                        : day.status === 'available'
                        ? 'bg-yellow-500/30'
                        : 'bg-gray-700/30'
                      } text-center`}>
                      <span className={`font-bold ${
                        day.status === 'claimed'
                          ? 'text-green-300'
                          : day.status === 'available'
                          ? 'text-yellow-300'
                          : 'text-gray-400'
                      }`}>Day {day.day}</span>
                    </div>
                    
                    {/* Reward content */}
                    <div className="p-4 flex flex-col items-center">
                      <div className="text-4xl mb-2">{day.icon}</div>
                      <div className={`text-center ${
                        day.status === 'claimed'
                          ? 'text-green-300'
                          : day.status === 'available'
                          ? 'text-yellow-300'
                          : 'text-gray-400'
                      }`}>
                        <div className="font-bold text-xl">{day.points}</div>
                        <div className="text-xs mt-1">POINTS</div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="mt-3">
                        {day.status === 'claimed' ? (
                          <div className="bg-green-500/30 rounded-full p-1">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                        ) : day.status === 'available' ? (
                          <motion.div 
                            className="bg-yellow-500/30 rounded-full p-1"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Gift className="h-5 w-5 text-yellow-400" />
                          </motion.div>
                        ) : (
                          <div className="bg-gray-700/30 rounded-full p-1">
                            <Lock className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* Date (if claimed) */}
                      {day.status === 'claimed' && day.date && (
                        <div className="mt-2 text-center text-green-300 text-xs">
                          {day.date}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Check-in Button */}
          <div className="mt-8 text-center">
            <motion.button
              onClick={handleCheckIn}
              disabled={!canCheckIn || processingCheckIn}
              whileHover={{ scale: canCheckIn && !processingCheckIn ? 1.05 : 1 }}
              whileTap={{ scale: canCheckIn && !processingCheckIn ? 0.95 : 1 }}
              className={`px-10 py-4 rounded-full font-bold text-xl shadow-xl transition-all duration-300 ${
                canCheckIn && !processingCheckIn
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-yellow-500/25 border-4 border-yellow-300/30'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed border-4 border-gray-600/30'
              }`}
            >
              {processingCheckIn ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  Processing...
                </div>
              ) : canCheckIn ? (
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6" />
                  Claim Today's Reward
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6" />
                  Come Back Tomorrow
                </div>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Recent Check-ins */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-blue-400" />
          Recent Check-ins
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
          </div>
        ) : checkInHistory.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {checkInHistory.map((checkIn) => (
              <div 
                key={checkIn.id}
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl border-2 border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {checkIn.description || `Day ${checkIn.task_id.split('_')[1]} Check-in`}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(checkIn.completed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-green-400 font-bold text-lg">
                  +{checkIn.points_earned}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No check-in history yet</p>
            <p className="text-gray-500 text-sm">Start checking in daily to see your history here</p>
          </div>
        )}
      </motion.div>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-400/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Pro Tip</h3>
            <p className="text-gray-300">
              Don't break your streak! Check in every day to maximize your rewards. The 7th day bonus can give you up to 1000 points - that's like getting a free premium subscription faster!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Lock icon component
const Lock: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

export default DailyCheckInPage