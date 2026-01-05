import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import {
    renderMembershipActivatedEmail,
    renderEventConfirmationEmail,
    renderPaymentFailedEmail,
    renderWelcomeEmail,
} from '@/lib/email-templates';
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

            // Send event confirmation email
            try {
                const { data: eventData } = await supabase
                    .from('events')
                    .select('title, event_date, location, price')
                    .eq('id', eventId)
                    .single();

                if (eventData && userEmail) {
                    const eventDate = new Date(eventData.event_date);
                    const html = renderEventConfirmationEmail({
                        firstName: userName?.split(' ')[0] || 'Guest',
                        eventTitle: eventData.title,
                        eventDate: eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                        eventTime: eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        eventLocation: eventData.location || 'TBC',
                        amountPaid: eventData.price ? `£${eventData.price}` : 'Free',
                    });

                    await sendEmail({
                        to: userEmail,
                        subject: `Booking Confirmed: ${eventData.title}`,
                        html,
                    });
                    console.log('Event confirmation email sent to:', userEmail);
                }
            } catch (emailErr) {
                console.error('Failed to send event confirmation email:', emailErr);
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

                // Send membership activation email
                try {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('first_name, email')
                        .eq('user_id', userId)
                        .single();

                    const { data: locationData } = await supabase
                        .from('locations')
                        .select('name')
                        .eq('id', locationId)
                        .single();

                    const { data: membershipTypeData } = await supabase
                        .from('membership_types')
                        .select('name, price')
                        .eq('id', membershipTypeId)
                        .single();

                    if (profileData?.email) {
                        const html = renderMembershipActivatedEmail({
                            firstName: profileData.first_name || 'Member',
                            locationName: locationData?.name || 'Sport of Kings',
                            membershipType: membershipTypeData?.name || 'Membership',
                            price: membershipTypeData?.price ? `£${membershipTypeData.price}/month` : 'N/A',
                            startDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                        });

                        await sendEmail({
                            to: profileData.email,
                            subject: 'Your Sport of Kings Membership is Now Active!',
                            html,
                        });
                        console.log('Membership activation email sent to:', profileData.email);
                    }
                } catch (emailErr) {
                    console.error('Failed to send membership activation email:', emailErr);
                }
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

            // Send payment failed notification email
            if (customerEmail) {
                try {
                    // Get membership details
                    const { data: membershipData } = await supabase
                        .from('memberships')
                        .select('membership_type:membership_types(name), profiles(first_name)')
                        .eq('stripe_subscription_id', String(subscriptionId))
                        .single();

                    const membershipTypeName = (membershipData?.membership_type as { name: string } | null)?.name || 'Membership';
                    const firstName = (membershipData?.profiles as { first_name: string } | null)?.first_name || 'Member';

                    const html = renderPaymentFailedEmail({
                        firstName,
                        membershipType: membershipTypeName,
                        amountDue: `£${((invoice.amount_due || 0) / 100).toFixed(2)}`,
                        attemptCount,
                        nextAttemptDate: invoice.next_payment_attempt
                            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                            : undefined,
                    });

                    await sendEmail({
                        to: customerEmail,
                        subject: `Action Required: Payment Failed for Your Membership`,
                        html,
                    });
                    console.log('Payment failed email sent to:', customerEmail);
                } catch (emailErr) {
                    console.error('Failed to send payment failed email:', emailErr);
                }
            }
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
