// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';
import type { Match } from '@/types/match';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseServer = createClient<{
  public: {
    Tables: {
      matches: {
        Row: Match;
        Insert: Partial<Match>;
        Update: Partial<Match>;
      };
    };
  };
}>(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});
