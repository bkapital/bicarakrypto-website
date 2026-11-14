import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

export const supabase = createClient(
  CONFIG.portal.supabaseUrl,
  CONFIG.portal.supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);
