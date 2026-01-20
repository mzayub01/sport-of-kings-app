import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 200 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe client not available' }, { status: 200 });
    }

    try {
        const body = await request.json();
        const { userId, locationId, tierId, userEmail } = body;

        if (!userId || !locationId || !tierId) {
            return NextResponse.json({ error: 'userId, locationId, and tierId are required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('date_of_birth, first_name, last_name, stripe_customer_id')
            .eq('user_id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get the selected multisite tier
        const { data: tier, error: tierError } = await supabase
            .from('membership_types')
            .select('id, name, description, price, stripe_price_id, location_id, is_multisite')
            .eq('id', tierId)
            .eq('location_id', locationId)
            .eq('is_multisite', true)
            .eq('is_active', true)
            .single();

        if (tierError || !tier) {
            return NextResponse.json({ error: 'Invalid or inactive multisite tier' }, { status: 400 });
        }

        if (!tier.stripe_price_id) {
            return NextResponse.json({
                error: 'This tier is not configured for payment. Please contact an administrator.'
            }, { status: 400 });
        }

        // Get location name for metadata
        const { data: location } = await supabase
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();

        // Get current active memberships
        const { data: currentMemberships } = await supabase
            .from('memberships')
            .select('id, location_id')
            .eq('user_id', userId)
            .eq('status', 'active');

        const currentSiteCount = (currentMemberships || []).length;

        // Check if already at max sites
        if (currentSiteCount >= 3) {
            return NextResponse.json({ error: 'Maximum 3 sites allowed' }, { status: 400 });
        }

        // Check if already a member at this location
        if (currentMemberships?.some(m => m.location_id === locationId)) {
            return NextResponse.json({ error: 'Already a member at this location' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Get or create Stripe customer
        let customerId = profile.stripe_customer_id;
        if (!customerId) {
            const existingCustomers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                customerId = existingCustomers.data[0].id;
            } else {
                const customer = await stripe.customers.create({
                    email: userEmail,
                    name: `${profile.first_name} ${profile.last_name}`,
                    metadata: { userId },
                });
                customerId = customer.id;
            }

            // Update profile with customer ID
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('user_id', userId);
        }

        // Create checkout session using the tier's Stripe price ID
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            allow_promotion_codes: true,
            metadata: {
                userId,
                locationId,
                tierId,
                tierName: tier.name,
                isMultisite: 'true',
                siteNumber: (currentSiteCount + 1).toString(),
            },
            line_items: [{
                price: tier.stripe_price_id,
                quantity: 1,
            }],
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&multisite=true`,
            cancel_url: `${baseUrl}/dashboard/membership`,
            subscription_data: {
                metadata: {
                    userId,
                    locationId,
                    tierId,
                    tierName: tier.name,
                    locationName: location?.name || 'Unknown',
                    isMultisite: 'true',
                },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Multisite checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
