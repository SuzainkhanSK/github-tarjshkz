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
        return await handleListSubscriptions(supabaseAdmin)
      case 'toggle':
        return await handleToggleSubscription(supabaseAdmin, req)
      case 'add':
        return await handleAddSubscription(supabaseAdmin, req)
      case 'delete':
        return await handleDeleteSubscription(supabaseAdmin, req)
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
    console.error('Admin subscriptions function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleListSubscriptions(supabaseAdmin: any) {
  try {
    // Fetch all subscription availability records
    const { data, error } = await supabaseAdmin
      .from('subscription_availability')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error listing subscriptions:', error)
    return new Response(
      JSON.stringify({ error: `Failed to fetch subscriptions: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleToggleSubscription(supabaseAdmin: any, req: Request) {
  try {
    const { id, currentStatus } = await req.json()

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update subscription availability
    const { data, error } = await supabaseAdmin
      .from('subscription_availability')
      .update({ in_stock: !currentStatus })
      .eq('id', id)
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
    console.error('Error toggling subscription:', error)
    return new Response(
      JSON.stringify({ error: `Failed to update subscription: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleAddSubscription(supabaseAdmin: any, req: Request) {
  try {
    const { subscription_id, duration } = await req.json()

    if (!subscription_id || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subscription_id, duration' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Add new subscription availability
    const { data, error } = await supabaseAdmin
      .from('subscription_availability')
      .insert({
        subscription_id,
        duration,
        in_stock: true
      })
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error adding subscription:', error)
    return new Response(
      JSON.stringify({ error: `Failed to add subscription: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDeleteSubscription(supabaseAdmin: any, req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete subscription availability
    const { error } = await supabaseAdmin
      .from('subscription_availability')
      .delete()
      .eq('id', id)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('Error deleting subscription:', error)
    return new Response(
      JSON.stringify({ error: `Failed to delete subscription: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}