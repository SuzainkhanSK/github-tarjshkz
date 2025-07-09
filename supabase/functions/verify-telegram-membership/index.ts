const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TelegramResponse {
  ok: boolean;
  result?: {
    status: string;
    user: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
  };
  error_code?: number;
  description?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Telegram Bot API configuration
    const BOT_TOKEN = "7835887829:AAE5f2DlITueV4bPxUw0GfDlY9MBx8LFKrQ";
    const CHAT_ID = "@SKModTechOfficial";

    // Call Telegram Bot API to check membership
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=${userId}`;
    
    const response = await fetch(telegramUrl);
    const data: TelegramResponse = await response.json();

    let isMember = false;

    if (data.ok && data.result) {
      // Check if user is a member (member, administrator, or creator)
      const validStatuses = ['member', 'administrator', 'creator'];
      isMember = validStatuses.includes(data.result.status);
    }

    return new Response(
      JSON.stringify({ 
        isMember,
        status: data.result?.status || 'unknown',
        telegramResponse: data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Telegram verification error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to verify membership",
        isMember: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});