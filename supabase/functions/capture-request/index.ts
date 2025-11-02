import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestPayload {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: RequestPayload = await req.json();
    console.log('Received request to capture:', payload);

    // Validate payload
    if (!payload.endpoint || !payload.method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: endpoint, method' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Insert the request into the database
    const { data, error } = await supabase
      .from('requests')
      .insert({
        endpoint: payload.endpoint,
        method: payload.method,
        headers: payload.headers || {},
        body: payload.body || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store request' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Request captured successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId: data.id,
        message: 'Request captured and queued for processing'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('Error in capture-request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
