import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    // Return a specific JSON response when Stripe is not configured
    if (!isStripeConfigured()) {
        console.log('Stripe checkout: Stripe not configured');
        return NextResponse.json(
            { error: 'Stripe is not configured', url: null },
            { status: 200 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
        console.log('Stripe checkout: Stripe client not available');
        return NextResponse.json(
            { error: 'Stripe client not available', url: null },
            { status: 200 }
        );
    }

    try {
        const body = await request.json();
        const {
            membershipTypeId,
            membershipTypeName,
            price,
            userId,
            locationId,
            locationName,
            userEmail,
        } = body;

        console.log('Stripe checkout: Creating session for user', userId, 'membership type', membershipTypeId);

        const supabase = await createAdminClient();

        // Reserve the place BEFORE sending them to Stripe: a pending membership
        // counts towards capacity, and the DB trigger refuses it if the type is
        // full — so two people can no longer both pay for the last spot.
        if (userId && locationId && membershipTypeId) {
            const { data: existing } = await supabase
                .from('memberships')
                .select('id, status')
                .eq('user_id', userId)
                .eq('location_id', locationId)
                .maybeSingle();

            let holdError: { message?: string } | null = null;
            if (!existing) {
                const { error } = await supabase.from('memberships').insert({
                    user_id: userId,
                    location_id: locationId,
                    membership_type_id: membershipTypeId,
                    status: 'pending',
                    start_date: new Date().toISOString().split('T')[0],
                });
                holdError = error;
            } else if (existing.status !== 'active') {
                const { error } = await supabase
                    .from('memberships')
                    .update({ status: 'pending', membership_type_id: membershipTypeId })
                    .eq('id', existing.id);
                holdError = error;
            }

            if (holdError) {
                if (holdError.message?.includes('MEMBERSHIP_TYPE_FULL')) {
                    return NextResponse.json(
                        { error: 'Sorry — this membership type has just reached capacity. You can join the waiting list instead.', full: true, url: null },
                        { status: 409 }
                    );
                }
                console.error('Stripe checkout: could not reserve membership place:', holdError);
                return NextResponse.json({ error: 'Could not reserve your place. Please try again.', url: null }, { status: 500 });
            }
        }

        // Get Stripe price ID from membership type using admin client to bypass RLS
        const { data: membershipType, error: fetchError } = await supabase
            .from('membership_types')
            .select('stripe_price_id')
            .eq('id', membershipTypeId)
            .single();

        if (fetchError) {
            console.error('Stripe checkout: Error fetching membership type:', fetchError);
        }

        console.log('Stripe checkout: Membership type data:', membershipType);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create or get Stripe customer (required for Stripe Accounts V2)
        let customer;
        try {
            // Check if customer already exists
            const existingCustomers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                console.log('Stripe checkout: Found existing customer:', customer.id);
            } else {
                // Create new customer
                customer = await stripe.customers.create({
                    email: userEmail,
                    metadata: {
                        userId,
                        locationId,
                    },
                });
                console.log('Stripe checkout: Created new customer:', customer.id);
            }
        } catch (customerError) {
            console.error('Stripe checkout: Error creating customer:', customerError);
            throw customerError;
        }

        // Create Checkout Session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customer.id,
            allow_promotion_codes: true, // Enable promo code field at checkout
            metadata: {
                userId,
                locationId,
                membershipTypeId,
            },
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout/cancel`,
        };

        // Use existing Stripe Price ID if available, otherwise create price data
        if (membershipType?.stripe_price_id) {
            console.log('Stripe checkout: Using stored price ID:', membershipType.stripe_price_id);
            sessionParams.line_items = [{
                price: membershipType.stripe_price_id,
                quantity: 1,
            }];
        } else {
            console.log('Stripe checkout: Using inline price_data for price:', price);
            // Create inline price (for testing or when no Stripe Price ID is set)
            sessionParams.line_items = [{
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: membershipTypeName,
                        description: `${locationName} - Monthly Membership`,
                    },
                    unit_amount: price * 100, // Convert pounds to pence
                    recurring: {
                        interval: 'month',
                    },
                },
                quantity: 1,
            }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        console.log('Stripe checkout: Session created with URL:', session.url);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        const errorMessage = error?.message || error?.raw?.message || 'Failed to create checkout session';
        return NextResponse.json(
            { error: errorMessage, url: null },
            { status: 500 }
        );
    }
}

