import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    // Return a specific JSON response when Stripe is not configured
    if (!isStripeConfigured()) {
        return NextResponse.json(
            { error: 'Stripe is not configured', url: null },
            { status: 200 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
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

        // Get Stripe price ID from membership type or create a checkout with price_data
        const supabase = await createClient();
        const { data: membershipType } = await supabase
            .from('membership_types')
            .select('stripe_price_id')
            .eq('id', membershipTypeId)
            .single();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create Checkout Session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: userEmail,
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
            sessionParams.line_items = [{
                price: membershipType.stripe_price_id,
                quantity: 1,
            }];
        } else {
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

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session', url: null },
            { status: 500 }
        );
    }
}
