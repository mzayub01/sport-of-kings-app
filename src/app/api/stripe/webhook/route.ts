import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
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
        const metadata = session.metadata || {};

        // Check if this is an event payment
        if (metadata.type === 'event') {
            const { eventId, userId, userName, userEmail, userPhone } = metadata;

            console.log('Processing event payment for event:', eventId);

            const supabase = await createAdminClient();

            // Check if RSVP already exists (to prevent duplicates)
            const { data: existingRsvp } = await supabase
                .from('event_rsvps')
                .select('id')
                .eq('event_id', eventId)
                .eq('email', userEmail)
                .single();

            if (!existingRsvp) {
                // Create the RSVP as paid and confirmed
                const { error: rsvpError } = await supabase.from('event_rsvps').insert({
                    event_id: eventId,
                    user_id: userId !== 'guest' ? userId : null,
                    full_name: userName,
                    email: userEmail,
                    phone: userPhone || null,
                    status: 'confirmed',
                    payment_status: 'paid',
                    stripe_payment_id: session.payment_intent as string,
                });

                if (rsvpError) {
                    console.error('Error creating event RSVP:', rsvpError);
                } else {
                    console.log('Event RSVP created successfully for:', userEmail);
                }
            } else {
                // Update existing RSVP to paid
                await supabase
                    .from('event_rsvps')
                    .update({
                        status: 'confirmed',
                        payment_status: 'paid',
                        stripe_payment_id: session.payment_intent as string,
                    })
                    .eq('id', existingRsvp.id);
                console.log('Existing RSVP updated to paid for:', userEmail);
            }
        } else {
            // Membership payment (existing logic)
            const { userId, locationId, membershipTypeId } = metadata;

            if (userId && locationId) {
                const supabase = await createAdminClient();

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
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;

        const supabase = await createAdminClient();

        // Mark membership as cancelled
        await supabase
            .from('memberships')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', subscription.id);
    }

    // Handle failed payment
    if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceWithSub = invoice as any; // Cast for subscription access

        console.log('Payment failed for invoice:', invoice.id, 'Customer:', invoice.customer);

        // Get customer email from invoice
        const customerEmail = invoice.customer_email;
        const attemptCount = invoice.attempt_count || 1;
        const subscriptionId = invoiceWithSub.subscription;

        if (subscriptionId) {
            const supabase = await createAdminClient();

            // If this is a recurring payment failure (not first charge), consider updating status
            if (attemptCount >= 3) {
                // After 3 failed attempts, mark as payment_failed
                await supabase
                    .from('memberships')
                    .update({ status: 'payment_failed' })
                    .eq('stripe_subscription_id', String(subscriptionId));

                console.log('Membership marked as payment_failed after', attemptCount, 'attempts');
            } else {
                console.log('Payment attempt', attemptCount, 'failed for subscription:', subscriptionId);
            }

            // TODO: Send email notification to member about failed payment
            // For now, just log it. In production, integrate with email service (Resend, SendGrid, etc.)
            console.log('PAYMENT FAILED NOTIFICATION:', {
                email: customerEmail,
                invoiceId: invoice.id,
                amount: (invoice.amount_due || 0) / 100,
                attemptCount: attemptCount,
                nextAttempt: invoice.next_payment_attempt
                    ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                    : 'Final attempt',
            });
        }
    }

    // Handle subscription past due (entering dunning)
    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;

        if (subscription.status === 'past_due') {
            console.log('Subscription past due:', subscription.id);

            const supabase = await createAdminClient();

            // Mark membership as pending (payment issue)
            await supabase
                .from('memberships')
                .update({ status: 'pending' })
                .eq('stripe_subscription_id', subscription.id);
        }
    }

    return NextResponse.json({ received: true });
}
