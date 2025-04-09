import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to');

    if (!token || type !== 'signup') {
      throw new Error('Invalid confirmation link');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the email confirmation token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup',
    });

    if (error) throw error;

    // Redirect to the app with a success message
    const appUrl = new URL(redirectTo || Deno.env.get('APP_URL') || 'http://localhost:5173');
    appUrl.searchParams.set('confirmation', 'success');

    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Location': appUrl.toString(),
      },
      status: 302,
    });
  } catch (error) {
    // Redirect to the app with an error message
    const appUrl = new URL(Deno.env.get('APP_URL') || 'http://localhost:5173');
    appUrl.searchParams.set('confirmation', 'error');
    appUrl.searchParams.set('error', error.message);

    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Location': appUrl.toString(),
      },
      status: 302,
    });
  }
});