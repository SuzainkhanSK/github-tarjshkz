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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

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
      console.error('Auth error:', authError)
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
      console.error('Access denied for user:', user.email)
      return new Response(
        JSON.stringify({ error: 'Access denied - admin privileges required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || (req.method === 'GET' ? 'list' : 'update')

    console.log('Processing action:', action, 'Method:', req.method)

    if (req.method === 'GET' && action === 'list') {
      return await handleListRedemptions(supabaseAdmin)
    } else if (req.method === 'POST' && action === 'update') {
      return await handleUpdateRedemption(supabaseAdmin, req)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action or method' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Admin redemptions function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleListRedemptions(supabaseAdmin: any) {
  try {
    console.log('Fetching redemption requests...')
    
    // Fetch all redemption requests with user profiles
    const { data, error } = await supabaseAdmin
      .from('redemption_requests')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log('Successfully fetched', data?.length || 0, 'redemption requests')

    return new Response(
      JSON.stringify(data || []),
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
    const body = await req.json()
    console.log('Update request body:', body)
    
    const { requestId, newStatus, activationCode, instructions } = body

    if (!requestId || !newStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, newStatus' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

   // Log the request data for debugging
   console.log('Processing update request:', {
     requestId,
     newStatus,
     hasActivationCode: !!activationCode,
     hasInstructions: !!instructions
   })

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      completed_at: ['completed', 'failed', 'cancelled'].includes(newStatus) ? new Date().toISOString() : null
    }

   // Only include activation code and instructions if they're provided or if marking as completed
   if (newStatus === 'completed') {
     if (!activationCode) {
       return new Response(
         JSON.stringify({ error: 'Activation code is required for completed status' }),
         { 
           status: 400, 
           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
         }
       )
     }
     updateData.activation_code = activationCode
     updateData.instructions = instructions || null
   }
   
   // Set expiration date for completed requests with activation code
   if (newStatus === 'completed' && activationCode) {
      updateData.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }

    console.log('Updating redemption request:', requestId, 'with data:', updateData)

    // Update redemption request
    const { data, error } = await supabaseAdmin
      .from('redemption_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    console.log('Successfully updated redemption request:', data)

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