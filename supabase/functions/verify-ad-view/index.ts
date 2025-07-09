// This function has been deprecated as the Watch Ads functionality has been removed
// Keeping the file as a placeholder to avoid deployment issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({ 
      error: "This functionality has been deprecated",
      success: false 
    }),
    {
      status: 410, // Gone
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});