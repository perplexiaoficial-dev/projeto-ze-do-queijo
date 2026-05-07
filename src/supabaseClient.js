import { createClient } from '@supabase/supabase-js'

// No ambiente local, ele pega do arquivo .env ou usa as strings abaixo como fallback
// Na Vercel, ele pegará das configurações que você inserir no painel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ylckzqklowysmnsumvxx.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_secret_n6bejbKbvO8V0qi3l02daQ_rcLIadQ_'

export const supabase = createClient(supabaseUrl, supabaseKey)
