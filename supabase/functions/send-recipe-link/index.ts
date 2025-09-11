import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Send recipe link function called');
    
    const { recipeUrl } = await req.json();
    
    if (!recipeUrl) {
      console.error('No recipe URL provided');
      return new Response(
        JSON.stringify({ error: 'Recipe URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Sending recipe URL to n8n webhook:', recipeUrl);

    // Send POST request to n8n webhook
    const webhookUrl = 'https://aziwaniiii.app.n8n.cloud/webhook-test/0cef5769-875c-4abd-933f-0d2d984bc3d6';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipeUrl }),
    });

    if (!response.ok) {
      console.error('N8N webhook request failed:', response.status, response.statusText);
      throw new Error(`Webhook request failed with status: ${response.status}`);
    }

    console.log('Successfully sent recipe URL to n8n webhook');

    return new Response(
      JSON.stringify({ success: true, message: 'Recipe link sent successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-recipe-link function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send recipe link', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});