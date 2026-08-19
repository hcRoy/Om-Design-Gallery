import { createClient } from '@supabase/supabase-js'

// JUDGMENT CALL: this client is created but unused until Phase 2 (Auth).
// Values come from Vite env vars — never hardcode the project URL/anon key
// in source. Add them to a local .env file (see .env.example) once you
// share the project URL and anon key. The anon key is safe to expose in
// client code by design (RLS is what actually protects data), but it
// still shouldn't be committed to source control as a hardcoded literal.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

if (!supabase && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — ' +
      'auth and data features will not work until Phase 2 is wired up.',
  )
}
