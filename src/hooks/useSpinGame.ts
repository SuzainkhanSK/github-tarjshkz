import { useState, useCallback } from 'react'
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

interface UseSpinGameReturn {
  spinsRemaining: number
  isSpinning: boolean
  canSpin: boolean
  spin: (selectedPrize: Prize) => Promise<boolean>
  checkSpinsRemaining: () => Promise<void>
  resetDailySpins: () => void
}

export const useSpinGame = (): UseSpinGameReturn => {
  const { user, refreshProfile } = useAuth()
  const [spinsRemaining, setSpinsRemaining] = useState(3)
  const [isSpinning, setIsSpinning] = useState(false)

  const checkSpinsRemaining = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      const { data, error } = await supabase.rpc('check_daily_spin_limit', {
        user_id_param: user.id
      })

      if (error) throw error
      setSpinsRemaining(data || 0)
    } catch (error) {
      console.warn('Failed to check spin limit:', error)
      // Fallback to localStorage
      const today = new Date().toDateString()
      const spinsUsed = parseInt(localStorage.getItem(`spinsUsed_${user.id}_${today}`) || '0')
      setSpinsRemaining(Math.max(0, 3 - spinsUsed))
    }
  }, [user?.id])

  const spin = useCallback(async (selectedPrize: Prize): Promise<boolean> => {
    if (!user?.id || spinsRemaining <= 0 || isSpinning) {
      return false
    }

    setIsSpinning(true)

    try {
      if (isSupabaseConfigured) {
        // Use database function for secure processing
        const { data, error } = await supabase.rpc('process_spin_win', {
          user_id_param: user.id,
          prize_label_param: selectedPrize.label,
          points_won_param: selectedPrize.points
        })

        if (error) throw error
        
        if (data) {
          await refreshProfile()
          await checkSpinsRemaining()
          return true
        }
      } else {
        // Fallback for when database is not configured
        const today = new Date().toDateString()
        const spinsUsed = parseInt(localStorage.getItem(`spinsUsed_${user.id}_${today}`) || '0') + 1
        localStorage.setItem(`spinsUsed_${user.id}_${today}`, spinsUsed.toString())
        localStorage.setItem(`lastSpin_${user.id}`, new Date().toISOString())
        
        setSpinsRemaining(prev => Math.max(0, prev - 1))
        return true
      }
    } catch (error: any) {
      console.error('Spin processing failed:', error)
      toast.error(error.message || 'Spin failed. Please try again.')
      return false
    } finally {
      setIsSpinning(false)
    }

    return false
  }, [user?.id, spinsRemaining, isSpinning, refreshProfile, checkSpinsRemaining])

  const resetDailySpins = useCallback(() => {
    setSpinsRemaining(3)
    if (user?.id) {
      const today = new Date().toDateString()
      localStorage.removeItem(`spinsUsed_${user.id}_${today}`)
      localStorage.removeItem(`lastSpin_${user.id}`)
    }
  }, [user?.id])

  const canSpin = spinsRemaining > 0 && !isSpinning && !!user

  return {
    spinsRemaining,
    isSpinning,
    canSpin,
    spin,
    checkSpinsRemaining,
    resetDailySpins
  }
}