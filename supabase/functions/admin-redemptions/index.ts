import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Admin email list - Updated with your email
const ADMIN_EMAILS = [
  'suzainkhan8360@gmail.com',  // Your admin email (lowercase)
  'Suzainkhan8360@gmail.com',  // Your admin email (original case)
  'admin@premiumaccesszone.com',
  'support@premiumaccesszone.com',
  'moderator@premiumaccesszone.com'
]

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
        return await handleListRedemptions(supabaseAdmin)
      case 'update':
        return await handleUpdateRedemption(supabaseAdmin, req)
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
    console.error('Admin redemptions function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleListRedemptions(supabaseAdmin: any) {
  try {
    // Fetch all redemption requests with user profiles
    const { data, error } = await supabaseAdmin
      .from('redemption_requests')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error listing redemption requests:', error)
    return new Response(
      JSON.stringify({ error: `Failed to fetch redemption requests: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUpdateRedemption(supabaseAdmin: any, req: Request) {
  try {
    const { requestId, newStatus, activationCode, instructions } = await req.json()

    if (!requestId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, newStatus' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      completed_at: ['completed', 'failed', 'cancelled'].includes(newStatus) ? new Date().toISOString() : null
    }

    if (activationCode) updateData.activation_code = activationCode
    if (instructions) updateData.instructions = instructions
    if (newStatus === 'completed' && activationCode) {
      updateData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    // Update redemption request
    const { data, error } = await supabaseAdmin
      .from('redemption_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error updating redemption request:', error)
    return new Response(
      JSON.stringify({ error: `Failed to update redemption request: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}