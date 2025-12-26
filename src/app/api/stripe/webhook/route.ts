import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json({ received: true });
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json({ received: true });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const { userId, locationId, membershipTypeId } = session.metadata || {};

        if (userId && locationId) {
            const supabase = await createClient();

            // Check if membership already exists
            const { data: existingMembership } = await supabase
                .from('memberships')
                .select('id')
                .eq('user_id', userId)
                .eq('location_id', locationId)
                .single();

            if (existingMembership) {
                // Update existing membership to active
                await supabase
                    .from('memberships')
                    .update({
                        status: 'active',
                        stripe_subscription_id: session.subscription as string,
                        start_date: new Date().toISOString().split('T')[0],
                    })
                    .eq('id', existingMembership.id);
            } else {
                // Create new membership as active
                await supabase
                    .from('memberships')
                    .insert({
                        user_id: userId,
                        location_id: locationId,
                        membership_type_id: membershipTypeId || null,
                        status: 'active',
                        stripe_subscription_id: session.subscription as string,
                        start_date: new Date().toISOString().split('T')[0],
                    });
            }

            // Update user's stripe_customer_id in profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: session.customer as string })
                .eq('user_id', userId);
        }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;

        const supabase = await createClient();

        // Mark membership as cancelled
        await supabase
            .from('memberships')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', subscription.id);
    }

    return NextResponse.json({ received: true });
}
