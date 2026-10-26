import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = supabaseConfigured
  ? createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/** Demo mode is available when Supabase is not configured, or explicitly allowed. */
export const demoAllowed = !supabaseConfigured || import.meta.env.VITE_ALLOW_DEMO === 'true';
