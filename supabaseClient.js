import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ylckzqklowysmnsumvxx.supabase.co'
let supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2t6cWtsb3d5c21uc3Vtdnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTU2ODQsImV4cCI6MjA5MzUzMTY4NH0.Q0n2BzAffPYMPw5r6k_57o5lUvGoTLPKlxVWp0g-v7k'

// Trava de segurança: Se a chave cadastrada na Vercel for a chave secreta (mestra), 
// o sistema força o uso da chave pública (anon) automaticamente para o navegador não bloquear.
if (supabaseKey && supabaseKey.startsWith('sb_secret_')) {
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2t6cWtsb3d5c21uc3Vtdnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTU2ODQsImV4cCI6MjA5MzUzMTY4NH0.Q0n2BzAffPYMPw5r6k_57o5lUvGoTLPKlxVWp0g-v7k'
}

export const supabase = createClient(supabaseUrl, supabaseKey)
