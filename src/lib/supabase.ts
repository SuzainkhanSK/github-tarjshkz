import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are available and valid
const hasSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('supabase.co')

if (!hasSupabaseConfig) {
  console.warn('Supabase environment variables not found or invalid. Some features will be limited.')
}

// Create client with proper error handling and configuration
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: hasSupabaseConfig,
      autoRefreshToken: hasSupabaseConfig,
      detectSessionInUrl: hasSupabaseConfig
    },
    global: {
      fetch: (url, options = {}) => {
        // Don't make requests if Supabase isn't properly configured
        if (!hasSupabaseConfig) {
          return Promise.reject(new Error('Supabase not configured'))
        }

        // Add timeout and better error handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        return fetch(url, {
          ...options,
          signal: controller.signal
        }).then(response => {
          clearTimeout(timeoutId)
          return response
        }).catch(error => {
          clearTimeout(timeoutId)
          
          // Handle different types of errors more gracefully
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your internet connection')
          }
          
          if (!navigator.onLine) {
            throw new Error('No internet connection')
          }
          
          console.error('Supabase fetch error:', error)
          throw new Error(`Connection failed: ${error.message}`)
        })
      }
    }
  }
)

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasSupabaseConfig

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          phone?: string
          full_name?: string
          points: number
          total_earned: number
          profile_image?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone?: string
          full_name?: string
          points?: number
          total_earned?: number
          profile_image?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          full_name?: string
          points?: number
          total_earned?: number
          profile_image?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'earn' | 'redeem'
          points: number
          description: string
          task_type?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'earn' | 'redeem'
          points: number
          description: string
          task_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'earn' | 'redeem'
          points?: number
          description?: string
          task_type?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          task_type: string
          task_id: string
          completed: boolean
          points_earned: number
          completed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_type: string
          task_id: string
          completed?: boolean
          points_earned: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          completed?: boolean
          completed_at?: string
        }
      }
      scratch_history: {
        Row: {
          id: string
          user_id: string
          prize_label: string
          points_won: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prize_label: string
          points_won: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prize_label?: string
          points_won?: number
        }
      }
      spin_history: {
        Row: {
          id: string
          user_id: string
          prize_label: string
          points_won: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prize_label: string
          points_won: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prize_label?: string
          points_won?: number
        }
      }
      redemption_requests: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          subscription_name: string
          duration: string
          points_cost: number
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          user_email: string
          user_country: string
          user_notes?: string
          activation_code?: string
          instructions?: string
          expires_at?: string
          created_at?: string
          completed_at?: string
        }
        Update: {
          id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          user_email?: string
          user_country?: string
          user_notes?: string
          activation_code?: string
          instructions?: string
          expires_at?: string
          completed_at?: string
        }
      }
      gift_subscriptions: {
        Row: {
          id: string
          sender_id: string
          recipient_email: string
          subscription_id: string
          subscription_name: string
          duration: string
          points_cost: number
          message?: string
          status: 'pending' | 'sent' | 'claimed' | 'expired'
          claimed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_email: string
          subscription_id: string
          subscription_name: string
          duration: string
          points_cost: number
          message?: string
          status?: 'pending' | 'sent' | 'claimed' | 'expired'
          claimed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          status?: 'pending' | 'sent' | 'claimed' | 'expired'
          claimed_at?: string
        }
      }
      earning_task_completions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          provider: string
          status: 'pending' | 'completed' | 'failed' | 'reviewing'
          coins_earned: number
          started_at: string
          completed_at?: string
          verification_data?: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          provider: string
          status: 'pending' | 'completed' | 'failed' | 'reviewing'
          coins_earned?: number
          started_at?: string
          completed_at?: string
          verification_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          status?: 'pending' | 'completed' | 'failed' | 'reviewing'
          coins_earned?: number
          completed_at?: string
          verification_data?: any
        }
      }
    }
    Views: {
      user_stats_summary: {
        Row: {
          user_id: string
          email: string
          full_name?: string
          points: number
          total_earned: number
          total_transactions: number
          earn_transactions: number
          redeem_transactions: number
          total_tasks: number
          completed_tasks: number
          last_transaction_date?: string
          user_created_at: string
        }
      }
    }
  }
}

// Helper function to test Supabase connection
export const testSupabaseConnection = async () => {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase configuration is missing or invalid')
  }
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    throw error
  }
}