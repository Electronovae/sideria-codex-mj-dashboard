import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

// null si non configuré : l'appli reste 100% fonctionnelle en local.
export const supabase = url && cle ? createClient(url, cle) : null
