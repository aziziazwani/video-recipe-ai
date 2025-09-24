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

    console.log('Processing recipe URL:', recipeUrl);

    // Enhanced payload structure for n8n workflow
    const payload = {
      recipeUrl: recipeUrl,
      videoUrl: recipeUrl, // Alternative field name for n8n
      url: recipeUrl, // Another alternative
      timestamp: new Date().toISOString(),
      action: 'fetch_specific_recipe'
    };

    console.log('Sending payload to n8n webhook:', JSON.stringify(payload, null, 2));

    // Send POST request to n8n webhook
    const webhookUrl = 'https://roxann-microelectrophoretic-cira.ngrok-free.dev/webhook-test/0cef5769-875c-4abd-933f-0d2d984bc3d6';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('N8N response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N webhook request failed:', response.status, response.statusText, errorText);
      throw new Error(`Webhook request failed with status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.text();
    console.log('N8N webhook response data:', responseData);

    // Try to parse the response as JSON to provide better structure
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
      console.log('Parsed N8N response:', parsedResponse);
    } catch (parseError) {
      console.log('Response is not JSON, treating as text');
      parsedResponse = responseData;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Recipe link sent successfully', 
        response: parsedResponse,
        originalUrl: recipeUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-recipe-link function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send recipe link', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});