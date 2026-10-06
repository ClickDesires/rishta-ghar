import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** False until .env has the project's URL and public (anon / publishable) key. */
export const configured = Boolean(url && key)

export const supabase = createClient(url || 'http://localhost:54321', key || 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const PUBLIC_BUCKET = 'public-photos'
export const PRIVATE_BUCKET = 'private-photos'

export const publicPhotoUrl = (path: string) => supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path).data.publicUrl
