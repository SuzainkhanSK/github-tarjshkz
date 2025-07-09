import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: any
  loading: boolean
  signUp: (email: string, password: string, phone?: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  checkAndAwardSignupBonus: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Set maximum loading time to prevent stuck loading states
    const maxLoadingTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000) // Reduced back to 3 seconds for fast loading

    // Get initial session with fast timeout
    const getInitialSession = async () => {
      try {
        // If Supabase is not configured, skip auth entirely
        if (!isSupabaseConfigured) {
          if (mounted) {
            setSession(null)
            setUser(null)
            setUserProfile(null)
            setLoading(false)
          }
          return
        }

        // Fast timeout for initial session check - 5 seconds max
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )

        const result = await Promise.race([sessionPromise, timeoutPromise])
        
        if (!mounted) return
        
        const { data: { session }, error } = result as any

        if (error) {
          console.warn('Session error (non-critical):', error)
          setSession(null)
          setUser(null)
          setUserProfile(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch profile with fast timeout - don't block UI
          fetchUserProfile(session.user.id, true).catch(() => {
            // Silently handle profile fetch errors
            console.warn('Profile fetch failed, using default profile')
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.warn('Session initialization failed (non-critical):', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes - but don't let them block the UI
    let subscription: any = null
    
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return

            console.log('Auth state changed:', event)
            
            setSession(session)
            setUser(session?.user ?? null)
            
            if (session?.user) {
              // Don't await profile fetch to avoid blocking
              fetchUserProfile(session.user.id, false).catch(() => {
                console.warn('Profile fetch failed during auth change')
              })
              
              // Check for signup bonus asynchronously
              if (session.user.email_confirmed_at && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                checkAndAwardSignupBonus().catch(() => {
                  console.warn('Signup bonus check failed')
                })
              }
            } else {
              setUserProfile(null)
            }
            
            setLoading(false)
          }
        )
        subscription = data.subscription
      } catch (error) {
        console.warn('Auth state listener setup failed:', error)
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      clearTimeout(maxLoadingTimer)
      subscription?.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, isInitialLoad = false) => {
    try {
      if (!isSupabaseConfigured) {
        const defaultProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || 'User',
          points: 0,
          total_earned: 0
        }
        setUserProfile(defaultProfile)
        if (isInitialLoad) setLoading(false)
        return
      }

      // Fast timeout for profile fetch - 3 seconds max
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile timeout')), 3000)
      )

      const result = await Promise.race([profilePromise, timeoutPromise])
      const { data, error } = result as any

      if (error) {
        console.warn('Profile fetch error (using default):', error)
        const defaultProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || 'User',
          points: 0,
          total_earned: 0
        }
        setUserProfile(defaultProfile)
        if (isInitialLoad) setLoading(false)
        return
      }

      // If no profile found, create one in background
      if (data === null) {
        console.log('No profile found, creating one in background...')
        
        // Set default profile immediately
        const defaultProfile = {
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || 'User',
          points: 0,
          total_earned: 0
        }
        setUserProfile(defaultProfile)
        if (isInitialLoad) setLoading(false)
        
        // Try to create profile in background
        createProfileInBackground(userId).catch(() => {
          console.warn('Background profile creation failed')
        })
        return
      }

      setUserProfile(data)
      if (isInitialLoad) setLoading(false)
    } catch (error) {
      console.warn('Profile fetch failed (using default):', error)
      const defaultProfile = {
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || 'User',
        points: 0,
        total_earned: 0
      }
      setUserProfile(defaultProfile)
      if (isInitialLoad) setLoading(false)
    }
  }

  const createProfileInBackground = async (userId: string) => {
    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || null,
          phone: user?.user_metadata?.phone || null,
          points: 0,
          total_earned: 0
        })
        .select()
        .single()

      if (!insertError && newProfile) {
        setUserProfile(newProfile)
        // Award signup bonus after profile creation
        setTimeout(() => checkAndAwardSignupBonus().catch(() => {}), 1000)
      }
    } catch (error) {
      console.warn('Background profile creation failed:', error)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id, false).catch(() => {
        console.warn('Profile refresh failed')
      })
    }
  }

  const checkAndAwardSignupBonus = async () => {
    if (!user?.id || !isSupabaseConfigured) return

    try {
      console.log('Checking signup bonus for user:', user.id)
      
      // Fast check with timeout
      const bonusPromise = supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_type', 'signup')
        .limit(1)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Bonus check timeout')), 3000)
      )

      const result = await Promise.race([bonusPromise, timeoutPromise])
      const { data: existingBonus, error: bonusCheckError } = result as any

      if (bonusCheckError) {
        console.warn('Bonus check failed:', bonusCheckError)
        return
      }

      if (existingBonus && existingBonus.length > 0) {
        console.log('User already has signup bonus')
        return
      }

      console.log('Awarding signup bonus...')
      
      // Award bonus with timeout
      const awardPromise = supabase.rpc('award_missing_signup_bonus', {
        user_id_param: user.id
      })

      const awardTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Award timeout')), 5000)
      )

      const awardResult = await Promise.race([awardPromise, awardTimeoutPromise])
      const { data, error } = awardResult as any

      if (error) {
        console.warn('Signup bonus award failed:', error)
        return
      }

      if (data === true) {
        console.log('Signup bonus awarded successfully!')
        await fetchUserProfile(user.id)
        toast.success('🎉 Welcome bonus of 100 points added to your account!')
      }
    } catch (error) {
      console.warn('Signup bonus check failed (non-critical):', error)
    }
  }

  const signUp = async (email: string, password: string, phone?: string, fullName?: string) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      })

      if (error) throw error

      if (data.user) {
        toast.success('Account created! Please check your email inbox (including spam folder) for a confirmation link and click it to activate your account.')
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Set session duration based on rememberMe flag
          // 1 hour if not remembered, 30 days if remembered
          expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60
        }
      })

      if (error) throw error
      
      if (data.user) {
        toast.success('Signed in successfully!')
        // Check for signup bonus after successful sign in
        setTimeout(() => {
          checkAndAwardSignupBonus().catch(() => {})
        }, 1000)
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately
      setSession(null)
      setUser(null)
      setUserProfile(null)
      
      toast.success('Signed out successfully!')
    } catch (error: any) {
      // Even if signOut fails, clear local state
      setSession(null)
      setUser(null)
      setUserProfile(null)
      toast.error(error.message)
      throw error
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('No user logged in')
      if (!isSupabaseConfigured) throw new Error('Database not configured')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      await fetchUserProfile(user.id)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      toast.success('Password reset instructions sent to your email')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast.error(error.message || 'Failed to send password reset email')
      throw error
    }
  }

  const resendConfirmation = async (email: string) => {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Database not configured. Please connect to Supabase first.')
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) throw error
      toast.success('Confirmation email sent! Please check your inbox and spam folder.')
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resendConfirmation,
    resetPassword,
    checkAndAwardSignupBonus,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}