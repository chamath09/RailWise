import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iofgodvgosyouqgnpyex.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZmdvZHZnb3N5b3VxZ25weWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQ2NjYsImV4cCI6MjA4ODA0MDY2Nn0.L9NAxBuf9XpJnaufft7WPZ3ZNA-B2fx-MzFVpVyVLKY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
