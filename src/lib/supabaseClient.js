import { createClient } from '@supabase/supabase-js'

// Vite exposes only VITE_-prefixed vars to the browser. Both values are
// publishable (safe for frontend use); row access is enforced by RLS.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
export const isSupabaseConfigured = Boolean(url && anonKey)
