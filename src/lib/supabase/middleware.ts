import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Skip Supabase initialization if credentials are not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not configured. Skipping auth middleware.');
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtected =
        path.startsWith('/dashboard') ||
        path.startsWith('/admin') ||
        path.startsWith('/instructor') ||
        path.startsWith('/professor') ||
        path.startsWith('/checkin');

    if (!isProtected) {
        return response;
    }

    // Preserve any refreshed auth cookies when redirecting
    const redirectTo = (pathname: string, search: string = '') => {
        const url = request.nextUrl.clone();
        url.pathname = pathname;
        url.search = search;
        const redirect = NextResponse.redirect(url);
        response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
        return redirect;
    };

    // All protected areas require a signed-in user; send them back to where
    // they were headed after login (e.g. a QR-scanned /checkin link)
    if (!user) {
        return redirectTo('/login', `?redirect=${encodeURIComponent(path)}`);
    }

    // Role-gated areas: check the user's role (layouts also verify, this is defence-in-depth)
    if (path.startsWith('/admin') || path.startsWith('/instructor') || path.startsWith('/professor')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        const role = profile?.role;
        const allowed =
            role === 'admin' ||
            (path.startsWith('/instructor') && role === 'instructor') ||
            (path.startsWith('/professor') && role === 'professor');

        if (!allowed) {
            return redirectTo('/dashboard');
        }
    }

    return response;
}
