'use client';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseKey) && !supabaseUrl?.includes('example');

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseKey!)
  : null;
