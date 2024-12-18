import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://scyfqdxodauvjnkwjrzy.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeWZxZHhvZGF1dmpua3dqcnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNjI1MjUsImV4cCI6MjA0OTgzODUyNX0.HmrlYwcN1WyeURsyAuYCJ_DOaMbS18ZzN_XJSf_KE8Y"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);