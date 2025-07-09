// Database health check and diagnostic utility
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface DatabaseStatus {
  isConfigured: boolean
  isConnected: boolean
  tables: {
    profiles: { exists: boolean; count: number; sample?: any }
    transactions: { exists: boolean; count: number }
    tasks: { exists: boolean; count: number }
    spin_history: { exists: boolean; count: number }
    scratch_history: { exists: boolean; count: number }
    redemption_requests: { exists: boolean; count: number }
    admin_users: { exists: boolean; count: number }
  }
  authUsers: { accessible: boolean; count: number; error?: string }
  errors: string[]
  recommendations: string[]
}

export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    tables: {
      profiles: { exists: false, count: 0 },
      transactions: { exists: false, count: 0 },
      tasks: { exists: false, count: 0 },
      spin_history: { exists: false, count: 0 },
      scratch_history: { exists: false, count: 0 },
      redemption_requests: { exists: false, count: 0 },
      admin_users: { exists: false, count: 0 }
    },
    authUsers: { accessible: false, count: 0 },
    errors: [],
    recommendations: []
  }

  if (!isSupabaseConfigured) {
    status.errors.push('Supabase is not configured')
    status.recommendations.push('Connect to Supabase using the "Connect to Supabase" button')
    return status
  }

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (connectionError) {
      status.errors.push(`Connection failed: ${connectionError.message}`)
      return status
    }

    status.isConnected = true

    // Check each table
    const tables = ['profiles', 'transactions', 'tasks', 'spin_history', 'scratch_history', 'redemption_requests', 'admin_users']
    
    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          status.errors.push(`Table ${tableName}: ${error.message}`)
          status.tables[tableName as keyof typeof status.tables] = { exists: false, count: 0 }
        } else {
          status.tables[tableName as keyof typeof status.tables] = { 
            exists: true, 
            count: count || 0 
          }

          // Get sample data for profiles
          if (tableName === 'profiles' && count && count > 0) {
            const { data: sampleData } = await supabase
              .from('profiles')
              .select('id, email, full_name, points, total_earned, created_at')
              .limit(3)
            
            status.tables.profiles.sample = sampleData
          }
        }
      } catch (error: any) {
        status.errors.push(`Error checking table ${tableName}: ${error.message}`)
        status.tables[tableName as keyof typeof status.tables] = { exists: false, count: 0 }
      }
    }

    // Check auth.users access (this will likely fail with anon key)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        status.authUsers = { 
          accessible: false, 
          count: 0, 
          error: authError.message 
        }
        status.recommendations.push('Auth users table requires service role key (expected limitation)')
      } else {
        status.authUsers = { 
          accessible: true, 
          count: authData.users?.length || 0 
        }
      }
    } catch (error: any) {
      status.authUsers = { 
        accessible: false, 
        count: 0, 
        error: error.message 
      }
    }

    // Generate recommendations
    if (status.tables.profiles.count === 0) {
      status.recommendations.push('No user profiles found - users may need to sign up')
    }

    if (status.tables.admin_users.count === 0) {
      status.recommendations.push('No admin users found - create admin users manually')
    }

    if (status.tables.profiles.count > 0 && status.tables.transactions.count === 0) {
      status.recommendations.push('Users exist but no transactions - check signup bonus system')
    }

    // Check for orphaned data
    if (status.tables.transactions.count > status.tables.profiles.count * 2) {
      status.recommendations.push('High transaction to user ratio - check for data integrity')
    }

  } catch (error: any) {
    status.errors.push(`Database check failed: ${error.message}`)
  }

  return status
}

export async function fixCommonIssues(): Promise<{ fixed: string[]; errors: string[] }> {
  const result = { fixed: [], errors: [] }

  if (!isSupabaseConfigured) {
    result.errors.push('Cannot fix issues - Supabase not configured')
    return result
  }

  try {
    // Check for users without signup bonus
    const { data: usersWithoutBonus, error: bonusCheckError } = await supabase
      .from('profiles')
      .select(`
        id, email, 
        transactions!left(id, task_type)
      `)
      .is('transactions.task_type', null)
      .or('transactions.task_type.neq.signup')

    if (bonusCheckError) {
      result.errors.push(`Error checking signup bonuses: ${bonusCheckError.message}`)
    } else if (usersWithoutBonus && usersWithoutBonus.length > 0) {
      // Try to fix missing signup bonuses
      for (const user of usersWithoutBonus) {
        try {
          const { data, error } = await supabase.rpc('award_missing_signup_bonus', {
            user_id_param: user.id
          })

          if (error) {
            result.errors.push(`Failed to award bonus to ${user.email}: ${error.message}`)
          } else if (data) {
            result.fixed.push(`Awarded signup bonus to ${user.email}`)
          }
        } catch (error: any) {
          result.errors.push(`Error awarding bonus to ${user.email}: ${error.message}`)
        }
      }
    }

    // Refresh materialized view if it exists
    try {
      await supabase.rpc('refresh_user_stats_summary')
      result.fixed.push('Refreshed user statistics summary')
    } catch (error: any) {
      // This is optional, so don't treat as critical error
      console.warn('Could not refresh user stats summary:', error.message)
    }

  } catch (error: any) {
    result.errors.push(`Fix operation failed: ${error.message}`)
  }

  return result
}