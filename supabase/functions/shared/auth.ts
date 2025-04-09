import { createClient } from '@supabase/supabase-js';

export async function verifyAuth(req: Request): Promise<{ user: any; error: any }> {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: { message: 'No authorization header' } };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  return { user, error };
} 