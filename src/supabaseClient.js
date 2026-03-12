import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvgfvvsfegqhkhgvqrpi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z2Z2dnNmZWdxaGtoZ3ZxcnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDQyNDUsImV4cCI6MjA4ODg4MDI0NX0.TZMfTHZVjz-Syep86WGngL8Mjoglx61418osOnIY81Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)