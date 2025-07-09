import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Trophy, 
  Gift, 
  Coins, 
  History, 
  Info, 
  Share2, 
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

interface Prize {
  id: string
  label: string
  points: number
  color: string
  probability: number
  icon: string
}

interface SpinResult {
  prize: Prize
  timestamp: Date
}

interface SpinHistory {
  id: string
  user_id: string
  prize_label: string
  points_won: number
  created_at: string
}

const SpinWinPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [spinsRemaining, setSpinsRemaining] = useState(3)
  const [lastSpinTime, setLastSpinTime] = useState<Date | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null)
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([])
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const [showTutorial, setShowTutorial] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showParticles, setShowParticles] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const wheelRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Prize configuration with weighted probabilities
  const prizes: Prize[] = [
    { id: '1', label: '10 Points', points: 10, color: 'from-blue-400 to-blue-600', probability: 30, icon: '💎' },
    { id: '2', label: '25 Points', points: 25, color: 'from-green-400 to-green-600', probability: 25, icon: '🎯' },
    { id: '3', label: '50 Points', points: 50, color: 'from-purple-400 to-purple-600', probability: 20, icon: '🎪' },
    { id: '4', label: '5 Points', points: 5, color: 'from-gray-400 to-gray-600', probability: 15, icon: '🎲' },
    { id: '5', label: '100 Points', points: 100, color: 'from-yellow-400 to-yellow-600', probability: 7, icon: '🏆' },
    { id: '6', label: '200 Points', points: 200, color: 'from-red-400 to-red-600', probability: 2.5, icon: '👑' },
    { id: '7', label: '500 Points', points: 500, color: 'from-pink-400 to-pink-600', probability: 0.4, icon: '💰' },
    { id: '8', label: '1000 Points', points: 1000, color: 'from-orange-400 to-orange-600', probability: 0.1, icon: '🌟' }
  ]

  const segmentAngle = 360 / prizes.length

  useEffect(() => {
    checkDailySpins()
    fetchSpinHistory()
    fetchRecentWinners()
    
    // Check if user is new and show tutorial
    const hasSeenTutorial = localStorage.getItem('spinWinTutorialSeen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [user])

  const checkDailySpins = () => {
    if (!user) return
    
    const today = new Date().toDateString()
    const lastSpin = localStorage.getItem(`lastSpin_${user.id}`)
    const spinsUsed = parseInt(localStorage.getItem(`spinsUsed_${user.id}_${today}`) || '0')
    
    if (lastSpin && new Date(lastSpin).toDateString() === today) {
      setSpinsRemaining(Math.max(0, 3 - spinsUsed))
      setLastSpinTime(new Date(lastSpin))
    } else {
      setSpinsRemaining(3)
      setLastSpinTime(null)
    }
  }

  const fetchSpinHistory = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('spin_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSpinHistory(data || [])
    } catch (error) {
      console.warn('Failed to fetch spin history:', error)
    }
  }

  const fetchRecentWinners = async () => {
    if (!isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('spin_history')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .gte('points_won', 100)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentWinners(data || [])
    } catch (error) {
      console.warn('Failed to fetch recent winners:', error)
    }
  }

  const selectPrize = (): Prize => {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const prize of prizes) {
      cumulative += prize.probability
      if (random <= cumulative) {
        return prize
      }
    }
    
    return prizes[0] // Fallback
  }

  const playSound = (type: 'spin' | 'win' | 'bigWin') => {
    if (!soundEnabled) return
    
    // In a real implementation, you would load actual sound files
    // For now, we'll use the Web Audio API to create simple tones
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    switch (type) {
      case 'spin':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.5)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.5)
        break
      case 'win':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.3)
        break
      case 'bigWin':
        // Play a more elaborate sound for big wins
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const osc = audioContext.createOscillator()
            const gain = audioContext.createGain()
            osc.connect(gain)
            gain.connect(audioContext.destination)
            osc.frequency.setValueAtTime(523 + i * 100, audioContext.currentTime)
            gain.gain.setValueAtTime(0.1, audioContext.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
            osc.start()
            osc.stop(audioContext.currentTime + 0.2)
          }, i * 100)
        }
        break
    }
  }

  const handleSpin = async () => {
    if (spinsRemaining <= 0 || isSpinning || !user) {
      toast.error('No spins remaining today!')
      return
    }

    setIsSpinning(true)
    setLoading(true)
    
    try {
      const selectedPrize = selectPrize()
      const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id)
      
      // Calculate rotation to land on the selected prize
      const targetAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2)
      const spins = 5 + Math.random() * 3 // 5-8 full rotations
      const finalRotation = rotation + (spins * 360) + (360 - targetAngle)
      
      playSound('spin')
      setRotation(finalRotation)
      
      // Wait for spin animation to complete
      setTimeout(async () => {
        try {
          // Award points and save to database
          if (isSupabaseConfigured) {
            const { error: transactionError } = await supabase
              .from('transactions')
              .insert({
                user_id: user.id,
                type: 'earn',
                points: selectedPrize.points,
                description: `Spin & Win: ${selectedPrize.label}`,
                task_type: 'spin_win'
              })

            if (transactionError) throw transactionError

            // Save spin history
            const { error: historyError } = await supabase
              .from('spin_history')
              .insert({
                user_id: user.id,
                prize_label: selectedPrize.label,
                points_won: selectedPrize.points
              })

            if (historyError) throw historyError

            // Update user profile points
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                points: (userProfile?.points || 0) + selectedPrize.points,
                total_earned: (userProfile?.total_earned || 0) + selectedPrize.points
              })
              .eq('id', user.id)

            if (profileError) throw profileError
          }

          // Update local state
          const today = new Date().toDateString()
          const spinsUsed = parseInt(localStorage.getItem(`spinsUsed_${user.id}_${today}`) || '0') + 1
          localStorage.setItem(`spinsUsed_${user.id}_${today}`, spinsUsed.toString())
          localStorage.setItem(`lastSpin_${user.id}`, new Date().toISOString())
          
          setSpinsRemaining(prev => prev - 1)
          setLastSpinTime(new Date())
          setCurrentResult({ prize: selectedPrize, timestamp: new Date() })
          setShowResult(true)
          
          // Play win sound and show particles
          if (selectedPrize.points >= 100) {
            playSound('bigWin')
            setShowParticles(true)
            setTimeout(() => setShowParticles(false), 3000)
          } else {
            playSound('win')
          }
          
          // Refresh profile and history
          await refreshProfile()
          await fetchSpinHistory()
          await fetchRecentWinners()
          
          toast.success(`🎉 You won ${selectedPrize.points} points!`)
        } catch (error) {
          console.error('Error processing spin result:', error)
          toast.error('Failed to process spin result. Please try again.')
        } finally {
          setIsSpinning(false)
          setLoading(false)
        }
      }, 4000) // 4 second spin duration
    } catch (error) {
      console.error('Error during spin:', error)
      setIsSpinning(false)
      setLoading(false)
      toast.error('Spin failed. Please try again.')
    }
  }

  const shareWin = (result: SpinResult) => {
    if (navigator.share) {
      navigator.share({
        title: 'Premium Access Zone - Spin & Win!',
        text: `I just won ${result.prize.points} points on Spin & Win! 🎉`,
        url: window.location.origin
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `I just won ${result.prize.points} points on Premium Access Zone Spin & Win! 🎉 ${window.location.origin}`
      )
      toast.success('Win shared to clipboard!')
    }
  }

  const getTimeUntilReset = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
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
            Spin & Win
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Spin the wheel daily for a chance to win amazing prizes!
        </p>
        
        {/* Spins Remaining */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">
                {spinsRemaining} spins remaining
              </span>
            </div>
            {spinsRemaining === 0 && (
              <p className="text-gray-400 text-sm mt-1">
                Resets in {getTimeUntilReset()}
              </p>
            )}
          </div>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-white" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          <button
            onClick={() => setShowTutorial(true)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            <Info className="h-5 w-5 text-white" />
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Spin Wheel */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            {/* Wheel Container */}
            <div className="relative w-full max-w-lg mx-auto aspect-square">
              {/* Particles */}
              <AnimatePresence>
                {showParticles && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          opacity: 1, 
                          scale: 0,
                          x: '50%',
                          y: '50%'
                        }}
                        animate={{ 
                          opacity: 0, 
                          scale: 1,
                          x: `${50 + (Math.random() - 0.5) * 200}%`,
                          y: `${50 + (Math.random() - 0.5) * 200}%`
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, delay: i * 0.1 }}
                        className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                className="relative w-full h-full rounded-full shadow-2xl overflow-hidden"
                style={{
                  background: 'conic-gradient(from 0deg, #1e40af, #7c3aed, #dc2626, #059669, #d97706, #0891b2, #be185d, #4338ca)',
                }}
                animate={{ rotate: rotation }}
                transition={{
                  duration: isSpinning ? 4 : 0,
                  ease: isSpinning ? [0.23, 1, 0.32, 1] : 'linear'
                }}
              >
                {/* Prize Segments */}
                {prizes.map((prize, index) => {
                  const angle = index * segmentAngle
                  const nextAngle = (index + 1) * segmentAngle
                  
                  return (
                    <div
                      key={prize.id}
                      className="absolute inset-0"
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 45 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 45 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 45 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                      }}
                    >
                      <div className={`w-full h-full bg-gradient-to-br ${prize.color} flex items-center justify-center`}>
                        <div 
                          className="text-center text-white font-bold transform"
                          style={{
                            transform: `rotate(${angle + segmentAngle / 2}deg) translateY(-35%)`
                          }}
                        >
                          <div className="text-2xl mb-1">{prize.icon}</div>
                          <div className="text-xs">{prize.label}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Center Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
              </motion.div>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white shadow-lg" />
              </div>
            </div>

            {/* Spin Button */}
            <div className="text-center mt-8">
              <motion.button
                onClick={handleSpin}
                disabled={spinsRemaining <= 0 || isSpinning || loading}
                whileHover={{ scale: spinsRemaining > 0 && !isSpinning ? 1.05 : 1 }}
                whileTap={{ scale: spinsRemaining > 0 && !isSpinning ? 0.95 : 1 }}
                className={`px-12 py-4 rounded-full font-bold text-xl shadow-2xl transition-all duration-300 ${
                  spinsRemaining > 0 && !isSpinning && !loading
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-yellow-500/25'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    Processing...
                  </div>
                ) : isSpinning ? (
                  <div className="flex items-center gap-2">
                    <Play className="h-6 w-6 animate-spin" />
                    Spinning...
                  </div>
                ) : spinsRemaining > 0 ? (
                  <div className="flex items-center gap-2">
                    <Play className="h-6 w-6" />
                    SPIN NOW!
                  </div>
                ) : (
                  'No Spins Left'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prize Odds */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Prize Odds
            </h3>
            <div className="space-y-3">
              {prizes.map((prize) => (
                <div key={prize.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{prize.icon}</span>
                    <span className="text-white text-sm">{prize.label}</span>
                  </div>
                  <span className="text-gray-300 text-sm">{prize.probability}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Winners */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Recent Big Winners
            </h3>
            <div className="space-y-3">
              {recentWinners.length > 0 ? (
                recentWinners.map((winner, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">
                        {winner.profiles?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(winner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-yellow-400 font-bold">
                      {winner.points_won} pts
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recent big winners yet</p>
              )}
            </div>
          </motion.div>

          {/* Spin History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              Your History
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {spinHistory.length > 0 ? (
                spinHistory.map((spin) => (
                  <div key={spin.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{spin.prize_label}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(spin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-green-400 font-bold">
                      +{spin.points_won}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No spins yet today</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && currentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 border border-yellow-400/30 text-center max-w-md w-full"
            >
              <div className="text-6xl mb-4">{currentResult.prize.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Congratulations!
              </h2>
              <p className="text-xl text-yellow-400 mb-4">
                You won {currentResult.prize.points} points!
              </p>
              <p className="text-gray-300 mb-6">
                {currentResult.prize.label}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => shareWin(currentResult)}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={() => setShowResult(false)}
                  className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-lg w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="h-6 w-6 text-blue-400" />
                How to Play Spin & Win
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <p>You get 3 free spins every day</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <p>Click "SPIN NOW!" to spin the wheel</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <p>Win points based on where the wheel stops</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <p>Points are automatically added to your account</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
                  <p>Spins reset daily at midnight</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-400/20 rounded-xl border border-yellow-400/30">
                <p className="text-yellow-300 text-sm font-medium">
                  💡 Tip: Higher point prizes have lower odds, but the excitement is worth it!
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowTutorial(false)
                  localStorage.setItem('spinWinTutorialSeen', 'true')
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SpinWinPage