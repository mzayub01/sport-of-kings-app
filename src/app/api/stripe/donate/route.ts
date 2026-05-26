import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import Stripe from 'stripe';

const DONATION_LABELS: Record<string, string> = {
    bursary: 'Bursary Fund',
    general: 'General Fund',
    equipment: 'Equipment Fund',
};

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json({ error: 'Stripe is not configured', url: null }, { status: 200 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe client not available', url: null }, { status: 200 });
    }

    try {
        const body = await request.json();
        const { amount, donorName, donorEmail, donationType, message } = body;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Find or create a Stripe customer by email
        const existingCustomers = await stripe.customers.list({
            email: donorEmail,
            limit: 1,
        });

        let customer: Stripe.Customer;
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: donorEmail,
                name: donorName,
            });
        }

        const label = DONATION_LABELS[donationType] || 'General Fund';

        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            mode: 'payment',
            payment_method_types: ['card'],
            submit_type: 'donate',
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        unit_amount: amount,
                        product_data: {
                            name: `Sport of Kings Donation - ${label}`,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                type: 'donation',
                donationType,
                donorName,
                donorEmail,
                message: message || '',
            },
            success_url: `${baseUrl}/donate?payment=success`,
            cancel_url: `${baseUrl}/donate?payment=cancelled`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating donation checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session', url: null },
            { status: 500 }
        );
    }
}
