'use client';

import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock client for when Supabase is not configured
const mockClient = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({
            data: { user: null, session: null },
            error: { message: 'Supabase not configured', status: 500 }
        }),
        signUp: async () => ({
            data: { user: null, session: null },
            error: { message: 'Supabase not configured', status: 500 }
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => { } } },
            error: null
        }),
    },
    from: () => ({
        select: () => ({
            eq: () => ({
                single: async () => ({ data: null, error: null }),
                order: () => ({ data: [], error: null }),
            }),
            order: () => ({ data: [], error: null }),
            single: async () => ({ data: null, error: null }),
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }),
};

type BrowserClient = ReturnType<typeof createBrowserClient>;

export function createClient(): BrowserClient | typeof mockClient {
    if (!supabaseUrl || !supabaseKey) {
        if (typeof window !== 'undefined') {
            console.warn('Supabase credentials not configured. Using mock client.');
        }
        return mockClient;
    }
    return createBrowserClient(supabaseUrl, supabaseKey);
}

// Singleton client for client components
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
