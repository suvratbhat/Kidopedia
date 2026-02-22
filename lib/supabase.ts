import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Add XMLHttpRequest polyfill for Android
if (Platform.OS === 'android' && typeof global.XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = class XMLHttpRequest {
    constructor() {
      return fetch as any;
    }
  } as any;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase Configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyPresent: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length,
  platform: Platform.OS,
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase URL or Anon Key is missing!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('Key:', supabaseAnonKey ? 'Present' : 'MISSING');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'kidopedia-app',
    },
  },
});
