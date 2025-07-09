import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Star,
  Hand,
  Zap,
  Award
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

interface ScratchResult {
  prize: Prize
  timestamp: Date
}

interface ScratchHistory {
  id: string
  user_id: string
  prize_label: string
  points_won: number
  created_at: string
}

const ScratchEarnPage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth()
  const [isScratching, setIsScratching] = useState(false)
  const [scratchesRemaining, setScratchesRemaining] = useState(3)
  const [lastScratchTime, setLastScratchTime] = useState<Date | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] = useState<ScratchResult | null>(null)
  const [scratchHistory, setScratchHistory] = useState<ScratchHistory[]>([])
  const [recentWinners, setRecentWinners] = useState<any[]>([])
  const [showTutorial, setShowTutorial] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showParticles, setShowParticles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scratchCardRef = useRef<HTMLDivElement>(null)
  const isMouseDown = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  // Prize configuration with weighted probabilities (same as Spin & Win)
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

  useEffect(() => {
    checkDailyScratches()
    fetchScratchHistory()
    fetchRecentWinners()
    
    // Check if user is new and show tutorial
    const hasSeenTutorial = localStorage.getItem('scratchEarnTutorialSeen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [user])

  useEffect(() => {
    if (canvasRef.current) {
      initializeScratchCard()
    }
  }, [])

  const checkDailyScratches = () => {
    if (!user) return
    
    const today = new Date().toDateString()
    const lastScratch = localStorage.getItem(`lastScratch_${user.id}`)
    const scratchesUsed = parseInt(localStorage.getItem(`scratchesUsed_${user.id}_${today}`) || '0')
    
    if (lastScratch && new Date(lastScratch).toDateString() === today) {
      setScratchesRemaining(Math.max(0, 3 - scratchesUsed))
      setLastScratchTime(new Date(lastScratch))
    } else {
      setScratchesRemaining(3)
      setLastScratchTime(null)
    }
  }

  const fetchScratchHistory = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('scratch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setScratchHistory(data || [])
    } catch (error) {
      console.warn('Failed to fetch scratch history:', error)
    }
  }

  const fetchRecentWinners = async () => {
    if (!isSupabaseConfigured) return

    try {
      const { data, error } = await supabase
        .from('scratch_history')
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

  const initializeScratchCard = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size - Much bigger now
    canvas.width = 600
    canvas.height = 400

    // Create metallic scratch surface with enhanced gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#E8E8E8')
    gradient.addColorStop(0.2, '#F5F5F5')
    gradient.addColorStop(0.4, '#C0C0C0')
    gradient.addColorStop(0.6, '#D3D3D3')
    gradient.addColorStop(0.8, '#A8A8A8')
    gradient.addColorStop(1, '#B8B8B8')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add metallic texture pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    for (let i = 0; i < canvas.width; i += 4) {
      ctx.fillRect(i, 0, 2, canvas.height)
    }

    // Add diagonal shine effect
    const shineGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
    shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)')
    shineGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)')
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)')
    
    ctx.fillStyle = shineGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add main scratch text with better styling
    ctx.fillStyle = '#888888'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2
    ctx.strokeText('SCRATCH TO WIN!', canvas.width / 2, canvas.height / 2 - 40)
    ctx.fillText('SCRATCH TO WIN!', canvas.width / 2, canvas.height / 2 - 40)
    
    // Add instruction text
    ctx.font = 'bold 20px Arial'
    ctx.fillStyle = '#999999'
    ctx.strokeStyle = '#777777'
    ctx.lineWidth = 1
    ctx.strokeText('Use your finger or mouse', canvas.width / 2, canvas.height / 2 + 10)
    ctx.fillText('Use your finger or mouse', canvas.width / 2, canvas.height / 2 + 10)
    
    ctx.strokeText('to reveal your prize!', canvas.width / 2, canvas.height / 2 + 40)
    ctx.fillText('to reveal your prize!', canvas.width / 2, canvas.height / 2 + 40)

    // Add decorative sparkle elements
    ctx.fillStyle = '#CCCCCC'
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const size = Math.random() * 3 + 1
      
      // Create star shape
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.random() * Math.PI * 2)
      ctx.beginPath()
      for (let j = 0; j < 5; j++) {
        ctx.lineTo(Math.cos(j * Math.PI * 2 / 5) * size, Math.sin(j * Math.PI * 2 / 5) * size)
        ctx.lineTo(Math.cos((j + 0.5) * Math.PI * 2 / 5) * size * 0.5, Math.sin((j + 0.5) * Math.PI * 2 / 5) * size * 0.5)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // Add border decoration
    ctx.strokeStyle = '#AAAAAA'
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    
    ctx.strokeStyle = '#DDDDDD'
    ctx.lineWidth = 2
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30)

    // Set composite operation for scratching
    ctx.globalCompositeOperation = 'destination-out'
  }

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      }
    }
  }

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    // Larger scratch radius for better experience
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height)
    const pixels = imageData.data
    let transparentPixels = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++
    }

    const progress = (transparentPixels / (pixels.length / 4)) * 100
    setScratchProgress(progress)

    if (progress > 25 && !isRevealed) {
      setIsRevealed(true)
      playScratchSound('reveal')
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scratchesRemaining <= 0 || isScratching) return
    
    isMouseDown.current = true
    const pos = getEventPos(e)
    lastPoint.current = pos
    scratch(pos.x, pos.y)
    playScratchSound('scratch')
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || scratchesRemaining <= 0) return
    
    const pos = getEventPos(e)
    if (lastPoint.current) {
      // Draw line between last point and current point for smooth scratching
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.lineWidth = 60 // Increased line width for better scratching
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
    }
    lastPoint.current = pos
    scratch(pos.x, pos.y)
  }

  const handleMouseUp = () => {
    isMouseDown.current = false
    lastPoint.current = null
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseDown(e as any)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseMove(e as any)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  const playScratchSound = (type: 'scratch' | 'reveal' | 'win') => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      switch (type) {
        case 'scratch':
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.1)
          break
        case 'reveal':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.2)
          break
        case 'win':
          // Play celebration sound
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
    } catch (error) {
      console.warn('Failed to play scratch sound:', error)
    }
  }

  const handleNewScratchCard = async () => {
    if (scratchesRemaining <= 0 || isScratching || !user) {
      toast.error('No scratches remaining today!')
      return
    }

    setIsScratching(true)
    setLoading(true)
    setScratchProgress(0)
    setIsRevealed(false)
    
    try {
      // Select prize
      const prize = selectPrize()
      setSelectedPrize(prize)
      
      // Reset scratch card
      initializeScratchCard()
      
      setIsScratching(false)
      setLoading(false)
    } catch (error) {
      console.error('Error creating new scratch card:', error)
      setIsScratching(false)
      setLoading(false)
      toast.error('Failed to create scratch card. Please try again.')
    }
  }

  const handleClaimPrize = async () => {
    if (!selectedPrize || !user) return

    setLoading(true)
    
    try {
      // Award points and save to database
      if (isSupabaseConfigured) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'earn',
            points: selectedPrize.points,
            description: `Scratch & Earn: ${selectedPrize.label}`,
            task_type: 'scratch_earn'
          })

        if (transactionError) throw transactionError

        // Save scratch history
        const { error: historyError } = await supabase
          .from('scratch_history')
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
      const scratchesUsed = parseInt(localStorage.getItem(`scratchesUsed_${user.id}_${today}`) || '0') + 1
      localStorage.setItem(`scratchesUsed_${user.id}_${today}`, scratchesUsed.toString())
      localStorage.setItem(`lastScratch_${user.id}`, new Date().toISOString())
      
      setScratchesRemaining(prev => prev - 1)
      setLastScratchTime(new Date())
      setCurrentResult({ prize: selectedPrize, timestamp: new Date() })
      setShowResult(true)
      
      // Play win sound and show particles
      if (selectedPrize.points >= 100) {
        playScratchSound('win')
        setShowParticles(true)
        setTimeout(() => setShowParticles(false), 3000)
      } else {
        playScratchSound('win')
      }
      
      // Refresh profile and history
      await refreshProfile()
      await fetchScratchHistory()
      await fetchRecentWinners()
      
      toast.success(`🎉 You won ${selectedPrize.points} points!`)
      
      // Reset for next scratch
      setSelectedPrize(null)
      setScratchProgress(0)
      setIsRevealed(false)
      
    } catch (error) {
      console.error('Error processing scratch result:', error)
      toast.error('Failed to process scratch result. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const shareWin = (result: ScratchResult) => {
    if (navigator.share) {
      navigator.share({
        title: 'Premium Access Zone - Scratch & Earn!',
        text: `I just won ${result.prize.points} points on Scratch & Earn! 🎉`,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(
        `I just won ${result.prize.points} points on Premium Access Zone Scratch & Earn! 🎉 ${window.location.origin}`
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Scratch & Earn
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Scratch the card to reveal your prize and earn points!
        </p>
        
        {/* Scratches Remaining */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-purple-400" />
              <span className="text-white font-medium">
                {scratchesRemaining} scratches remaining
              </span>
            </div>
            {scratchesRemaining === 0 && (
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
        {/* Scratch Card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            {/* Particles */}
            <AnimatePresence>
              {showParticles && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {[...Array(30)].map((_, i) => (
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
                        x: `${50 + (Math.random() - 0.5) * 300}%`,
                        y: `${50 + (Math.random() - 0.5) * 300}%`
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, delay: i * 0.05 }}
                      className="absolute w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Scratch Card Container - Much Bigger */}
            <div className="relative max-w-4xl mx-auto">
              <div 
                ref={scratchCardRef}
                className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl p-12 shadow-2xl border-8 border-yellow-400"
                style={{ minHeight: '500px' }}
              >
                {/* Prize Display (behind scratch surface) */}
                {selectedPrize && (
                  <div className="absolute inset-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-4 border-yellow-300">
                    <div className="text-8xl mb-6">{selectedPrize.icon}</div>
                    <h3 className="text-5xl font-bold text-gray-800 mb-4">
                      {selectedPrize.label}
                    </h3>
                    <p className="text-purple-600 text-3xl font-bold mb-4">
                      Congratulations!
                    </p>
                    <div className="flex items-center gap-3 text-gray-700 text-xl">
                      <Coins className="h-8 w-8 text-yellow-500" />
                      <span className="font-bold text-2xl">{selectedPrize.points} Points</span>
                    </div>
                    <div className="mt-6 text-gray-600 text-lg">
                      🎉 You're a winner! 🎉
                    </div>
                  </div>
                )}

                {/* Scratch Surface - Much Bigger */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-12 rounded-2xl cursor-pointer shadow-inner"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ 
                    width: 'calc(100% - 96px)', 
                    height: 'calc(100% - 96px)',
                    touchAction: 'none'
                  }}
                />

                {/* Progress Indicator */}
                {selectedPrize && scratchProgress > 0 && (
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-black/70 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-white text-lg mb-2">
                        <Zap className="h-6 w-6 text-yellow-400" />
                        <span className="font-semibold">Scratched: {Math.round(scratchProgress)}%</span>
                        {scratchProgress >= 25 && (
                          <span className="text-green-400 font-bold">✓ Prize Revealed!</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-3 rounded-full transition-all duration-300 shadow-lg"
                          style={{ width: `${scratchProgress}%` }}
                        />
                      </div>
                      {scratchProgress < 25 && (
                        <p className="text-gray-300 text-sm mt-2">
                          Scratch at least 25% to reveal your prize
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="text-center mt-8 space-y-4">
                {!selectedPrize ? (
                  <motion.button
                    onClick={handleNewScratchCard}
                    disabled={scratchesRemaining <= 0 || loading}
                    whileHover={{ scale: scratchesRemaining > 0 && !loading ? 1.05 : 1 }}
                    whileTap={{ scale: scratchesRemaining > 0 && !loading ? 0.95 : 1 }}
                    className={`px-16 py-6 rounded-full font-bold text-2xl shadow-2xl transition-all duration-300 ${
                      scratchesRemaining > 0 && !loading
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-purple-500/25'
                        : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        Creating Card...
                      </div>
                    ) : scratchesRemaining > 0 ? (
                      <div className="flex items-center gap-3">
                        <Hand className="h-8 w-8" />
                        NEW SCRATCH CARD
                      </div>
                    ) : (
                      'No Scratches Left'
                    )}
                  </motion.button>
                ) : isRevealed ? (
                  <motion.button
                    onClick={handleClaimPrize}
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-16 py-6 rounded-full font-bold text-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        Claiming...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Award className="h-8 w-8" />
                        CLAIM PRIZE
                      </div>
                    )}
                  </motion.button>
                ) : (
                  <div className="text-center">
                    <p className="text-white text-xl mb-3">Keep scratching to reveal your prize!</p>
                    <p className="text-gray-300 text-lg">Scratch at least 25% to claim your reward</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-purple-400">
                      <Hand className="h-6 w-6 animate-pulse" />
                      <span className="text-lg font-semibold">Use your finger or mouse to scratch</span>
                    </div>
                  </div>
                )}
              </div>
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
              <Trophy className="h-5 w-5 text-purple-400" />
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
                    <div className="text-purple-400 font-bold">
                      {winner.points_won} pts
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recent big winners yet</p>
              )}
            </div>
          </motion.div>

          {/* Scratch History */}
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
              {scratchHistory.length > 0 ? (
                scratchHistory.map((scratch) => (
                  <div key={scratch.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{scratch.prize_label}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(scratch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-green-400 font-bold">
                      +{scratch.points_won}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No scratches yet today</p>
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
              className="relative bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-400/30 text-center max-w-md w-full"
            >
              <div className="text-6xl mb-4">{currentResult.prize.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Congratulations!
              </h2>
              <p className="text-xl text-purple-400 mb-4">
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
                <Info className="h-6 w-6 text-purple-400" />
                How to Play Scratch & Earn
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <p>You get 3 free scratch cards every day</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <p>Click "NEW SCRATCH CARD" to get a fresh card</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <p>Use your mouse or finger to scratch the silver surface</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <p>Scratch at least 25% to reveal your prize</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
                  <p>Click "CLAIM PRIZE" to add points to your account</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">6</div>
                  <p>Cards reset daily at midnight</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-purple-400/20 rounded-xl border border-purple-400/30">
                <p className="text-purple-300 text-sm font-medium">
                  💡 Tip: The bigger scratch area makes it easier to reveal your prize!
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowTutorial(false)
                  localStorage.setItem('scratchEarnTutorialSeen', 'true')
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-colors"
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

export default ScratchEarnPage