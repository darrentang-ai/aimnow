import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// The anon key is meant to be public — it identifies the project, it does not
// grant access. Row-level security in supabase/schema.sql is what protects the
// data, so never rely on hiding this key.
export const isConfigured = Boolean(url && anonKey)

// Reports rather than throws: the marketing site must still build and render
// on a checkout that has no .env yet.
export const supabase = isConfigured ? createClient(url, anonKey) : null
