import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessRequestBody {
  requestId: string;
  prodUrl: string;
  prepUrl: string;
}

/**
 * Deep comparison of two objects
 */
function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Make HTTP request to an API endpoint
 */
async function makeRequest(url: string, method: string, headers: Record<string, string>, body: any): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: data,
  };
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

    const { requestId, prodUrl, prepUrl }: ProcessRequestBody = await req.json();
    console.log(`Processing comparison for request: ${requestId}`);

    if (!requestId || !prodUrl || !prepUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, prodUrl, prepUrl' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the request from database
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      console.error('Request not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update status to processing
    await supabase
      .from('requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    const startTime = Date.now();

    try {
      // Build full URLs
      const fullProdUrl = `${prodUrl}${request.endpoint}`;
      const fullPrepUrl = `${prepUrl}${request.endpoint}`;

      console.log(`Making requests to:\n  Prod: ${fullProdUrl}\n  Prep: ${fullPrepUrl}`);

      // Make requests to both environments in parallel
      const [prodResponse, prepResponse] = await Promise.all([
        makeRequest(fullProdUrl, request.method, request.headers || {}, request.body),
        makeRequest(fullPrepUrl, request.method, request.headers || {}, request.body),
      ]);

      // Compare responses
      const areIdentical = deepEqual(prodResponse.body, prepResponse.body);
      const processingDuration = Date.now() - startTime;

      // Update the request with results
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          prod_response: prodResponse,
          prep_response: prepResponse,
          status: 'completed',
          diff_status: areIdentical ? 'identical' : 'different',
          processed_at: new Date().toISOString(),
          processing_duration_ms: processingDuration,
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        throw updateError;
      }

      console.log(`Comparison completed in ${processingDuration}ms. Result: ${areIdentical ? 'identical' : 'different'}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          result: areIdentical ? 'identical' : 'different',
          processingDuration,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (comparisonError) {
      console.error('Error during comparison:', comparisonError);
      const errorMessage = comparisonError instanceof Error ? comparisonError.message : 'Unknown comparison error';
      
      // Update request with error status
      await supabase
        .from('requests')
        .update({
          status: 'error',
          diff_status: 'error',
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
          processing_duration_ms: Date.now() - startTime,
        })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({ error: 'Comparison failed', details: errorMessage }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in process-comparison:', error);
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
