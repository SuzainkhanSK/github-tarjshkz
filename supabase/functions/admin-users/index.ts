import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface UserData {
  id: string
  email: string
  full_name?: string
  phone?: string
  points: number
  total_earned: number
  created_at: string
  updated_at: string
  status: 'active' | 'banned' | 'suspended'
  last_login?: string
  transaction_count?: number
  spin_count?: number
  scratch_count?: number
  task_count?: number
  email_confirmed_at?: string
  has_profile: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    // Check if user email is in admin list (case-insensitive)
    const ADMIN_EMAILS = [
      'suzainkhan8360@gmail.com',  // Your admin email (lowercase)
      'Suzainkhan8360@gmail.com',  // Your admin email (original case)
      'admin@premiumaccesszone.com',
      'support@premiumaccesszone.com',
      'moderator@premiumaccesszone.com'
    ]
    
    const isAdminEmail = ADMIN_EMAILS.some(email => 
      email.toLowerCase() === (user.email || '').toLowerCase()
    )
    
    if (!isAdminEmail) {
      return new Response(
        JSON.stringify({ error: 'Access denied - admin privileges required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list':
        return await handleListUsers(supabaseAdmin)
      case 'recent-activity':
        return await handleRecentActivity(supabaseAdmin)
      case 'update-points':
        return await handleUpdatePoints(supabaseAdmin, req)
      case 'update-status':
        return await handleUpdateStatus(supabaseAdmin, req)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Admin users function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleListUsers(supabaseAdmin: any) {
  try {
    // Fetch all users from profiles table (bypassing RLS with service role)
    // Use a simpler approach that doesn't rely on auth.admin.listUsers
    // Get profiles with transaction counts
    const { data: profilesData, error: profilesError } = await supabaseAdmin.rpc(
      'get_user_profiles_with_stats'
    );
    
    if (profilesError) {
      throw profilesError;
    }
    
    // Process user data with defaults
    const usersWithDefaults: UserData[] = (profilesData || []).map((profile: any) => {
      return {
        ...profile,
        status: 'active', // Default to active since we can't easily check banned status
        has_profile: true,
        transaction_count: profile.transaction_count || 0,
        spin_count: profile.spin_count || 0,
        scratch_count: profile.scratch_count || 0,
        task_count: profile.task_count || 0
      };
    });

    return new Response(
      JSON.stringify({ users: usersWithDefaults }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error listing users:', error)
    return new Response(
      JSON.stringify({ error: `Failed to fetch users: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleRecentActivity(supabaseAdmin: any) {
  try {
    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        user_id,
        type,
        points,
        description,
        task_type,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (transactionsError) throw transactionsError

    // Get recent redemptions
    const { data: redemptions, error: redemptionsError } = await supabaseAdmin
      .from('redemption_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (redemptionsError) throw redemptionsError

    // Format transactions for response
    const formattedTransactions = transactions.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      type: t.type,
      points: t.points,
      description: t.description,
      task_type: t.task_type,
      created_at: t.created_at,
      user_email: t.profiles.email
    }))

    return new Response(
      JSON.stringify({ 
        transactions: formattedTransactions,
        redemptions: redemptions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error fetching recent activity:', error)
    return new Response(
      JSON.stringify({ error: `Failed to fetch recent activity: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdatePoints(supabaseAdmin: any, req: Request) {
  try {
    const { userId, pointsToAdd, description } = await req.json()

    if (!userId || typeof pointsToAdd !== 'number' || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, pointsToAdd, description' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current user points
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('points, total_earned')
      .eq('id', userId)
      .maybeSingle()

    if (userError) throw userError
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const newPoints = user.points + pointsToAdd
    const newTotalEarned = pointsToAdd > 0 ? user.total_earned + pointsToAdd : user.total_earned

    // Update user points
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        points: Math.max(0, newPoints),
        total_earned: newTotalEarned
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Add transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: pointsToAdd > 0 ? 'earn' : 'redeem',
        points: Math.abs(pointsToAdd),
        description: description,
        task_type: 'admin_adjustment'
      })

    if (transactionError) throw transactionError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully ${pointsToAdd > 0 ? 'added' : 'deducted'} ${Math.abs(pointsToAdd)} points` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error updating points:', error)
    return new Response(
      JSON.stringify({ error: `Failed to update points: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdateStatus(supabaseAdmin: any, req: Request) {
  try {
    const { userId, action } = await req.json()

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, action' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user status in auth.users
    let updateData: any = {}
    
    switch (action) {
      case 'ban':
        updateData.ban_duration = 'permanent'
        break
      case 'unban':
        updateData.ban_duration = 'none'
        break
      case 'suspend':
        updateData.ban_duration = '24h'
        break
      case 'activate':
        updateData.ban_duration = 'none'
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
    
    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${action}ned successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error updating user status:', error)
    return new Response(
      JSON.stringify({ error: `Failed to update user status: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}