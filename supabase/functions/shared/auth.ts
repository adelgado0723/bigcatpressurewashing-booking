import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  supabase: ReturnType<typeof createClient>;
}

export async function verifyAuth(req: Request): Promise<AuthResponse> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return { user, supabase };
} 