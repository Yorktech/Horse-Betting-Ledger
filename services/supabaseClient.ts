import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Safely access process.env to prevent crashes in environments where it's not defined.
const supabaseUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : undefined;
const supabaseAnonKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : undefined;

// DEBUG: Log the environment variables being used
console.log('🔍 Supabase Configuration Debug:');
console.log('  URL:', supabaseUrl);
console.log('  Anon Key (first 20 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'undefined');
console.log('  URL length:', supabaseUrl?.length);
console.log('  Key length:', supabaseAnonKey?.length);
console.log('  Is Configured:', !!(supabaseUrl && supabaseAnonKey));

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase credentials are not provided. The application will run in a local, non-persistent mode. Please set SUPABASE_URL and SUPABASE_ANON_KEY secrets to enable data persistence.');
} else {
    console.log('✅ Supabase client initialized successfully');
}
