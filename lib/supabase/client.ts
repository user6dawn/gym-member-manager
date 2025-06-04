import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

// For client components
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// For server actions (admin access)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createSupabaseAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
