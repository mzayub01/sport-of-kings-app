import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    // Return a specific JSON response when Stripe is not configured
    if (!isStripeConfigured()) {
        console.log('Event checkout: Stripe not configured');
        return NextResponse.json(
            { error: 'Stripe is not configured', url: null },
            { status: 200 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
        console.log('Event checkout: Stripe client not available');
        return NextResponse.json(
            { error: 'Stripe client not available', url: null },
            { status: 200 }
        );
    }

    try {
        const body = await request.json();
        const {
            eventId,
            eventTitle,
            price, // in pence
            userEmail,
            userName,
            userPhone,
            userId, // optional, only for logged-in users
        } = body;

        console.log('Event checkout: Creating session for event', eventId, 'price', price);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Create or get Stripe customer
        let customer;
        try {
            const existingCustomers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                console.log('Event checkout: Found existing customer:', customer.id);
            } else {
                customer = await stripe.customers.create({
                    email: userEmail,
                    name: userName,
                    phone: userPhone,
                    metadata: {
                        userId: userId || 'guest',
                    },
                });
                console.log('Event checkout: Created new customer:', customer.id);
            }
        } catch (customerError) {
            console.error('Event checkout: Error creating customer:', customerError);
            throw customerError;
        }

        // Create Checkout Session for one-time payment
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment', // One-time payment, not subscription
            payment_method_types: ['card'],
            customer: customer.id,
            allow_promotion_codes: true,
            metadata: {
                type: 'event',
                eventId,
                userId: userId || 'guest',
                userName,
                userEmail,
                userPhone,
            },
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        unit_amount: price, // Already in pence
                        product_data: {
                            name: eventTitle,
                            description: 'Event Registration',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/events?payment=success&event=${eventId}`,
            cancel_url: `${baseUrl}/events?payment=cancelled`,
        };

        console.log('Event checkout: Creating session with params:', JSON.stringify(sessionParams, null, 2));

        const session = await stripe.checkout.sessions.create(sessionParams);
        console.log('Event checkout: Session created:', session.id);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Event checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
