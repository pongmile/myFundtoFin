import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate Supabase configuration
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseUrl.startsWith('http')) {
  console.warn('⚠️ Supabase URL is not configured properly in .env.local');
  console.warn('Please update NEXT_PUBLIC_SUPABASE_URL with your Supabase project URL');
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.warn('⚠️ Supabase Anon Key is not configured properly in .env.local');
  console.warn('Please update NEXT_PUBLIC_SUPABASE_ANON_KEY with your Supabase anon key');
}

// Create client with fallback URL to prevent crashes
const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
export const supabase = createClient(validUrl, supabaseAnonKey || 'placeholder-key');
