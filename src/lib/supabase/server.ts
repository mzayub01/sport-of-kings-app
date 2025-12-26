import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock client for when Supabase is not configured
const createMockClient = () => ({
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
    },
    from: () => ({
        select: () => ({
            eq: () => ({
                eq: () => ({
                    order: () => ({
                        limit: async () => ({ data: [], error: null }),
                    }),
                    single: async () => ({ data: null, error: null }),
                }),
                order: () => ({
                    order: () => ({ data: [], error: null }),
                }),
                single: async () => ({ data: null, error: null }),
                in: () => ({
                    order: async () => ({ data: [], error: null }),
                }),
            }),
            order: () => ({
                order: () => ({ data: [], error: null }),
            }),
            single: async () => ({ data: null, error: null }),
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }),
});

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Return mock client if not configured
    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not configured. Using mock client.');
        return createMockClient() as ReturnType<typeof createServerClient>;
    }

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle cookies in read-only context
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Handle cookies in read-only context
                    }
                },
            },
        }
    );
}

// Admin client with service role (server-side only)
export async function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.warn('Supabase admin credentials not configured. Using mock client.');
        return createMockClient() as ReturnType<typeof createServerClient>;
    }

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        serviceKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle cookies in read-only context
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch {
                        // Handle cookies in read-only context
                    }
                },
            },
        }
    );
}
