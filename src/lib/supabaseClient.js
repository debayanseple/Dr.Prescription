// Vite exposes only VITE_-prefixed vars to the browser. Both values are
// publishable (safe for frontend use); row access is enforced by RLS.
//
// The Supabase SDK (~120KB) is code-split: it loads on demand via
// getSupabase() instead of blocking first paint on every phone — the offline
// path (the primary use case) never downloads it at all.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
  )
}

let clientPromise = null

// Resolves to the client, or null when history is not configured.
// The promise is cached so concurrent callers share one import + one client.
export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, anonKey),
    )
  }
  return clientPromise
}
