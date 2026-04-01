import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xeeutvxddepqblnofiza.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZXV0dnhkZGVwcWJsbm9maXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjMzMTksImV4cCI6MjA5MDYzOTMxOX0.8ed-4pmbJzdGrUyHWDLg0BQ79HrKa6yaGzYkAFVTIoU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
