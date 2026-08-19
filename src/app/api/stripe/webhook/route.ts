import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import {
    renderMembershipActivatedEmail,
    renderEventConfirmationEmail,
    renderRetreatConfirmationEmail,
    renderPaymentFailedEmail,
    renderWelcomeEmail,
} from '@/lib/email-templates';
import { RETREAT } from '@/lib/retreat';
import { renderEmailFromDatabase } from '@/lib/email-templates-db';
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

        // Retreat registration payment
        if (metadata.type === 'retreat') {
            const registrationId = metadata.registrationId;
            console.log('Processing retreat payment for registration:', registrationId);

            const supabase = await createAdminClient();

            const { data: registration, error: regError } = await supabase
                .from('retreat_registrations')
                .update({
                    status: 'paid',
                    stripe_payment_intent_id: session.payment_intent as string,
                })
                .eq('id', registrationId)
                .select('lead_name, lead_email, adults, children_10_15, children_under_10, total_amount')
                .single();

            if (regError || !registration) {
                console.error('Error marking retreat registration paid:', regError);
            } else {
                // Send confirmation email to the lead booker
                try {
                    const parts: string[] = [];
                    if (registration.adults > 0) parts.push(`${registration.adults} adult${registration.adults > 1 ? 's' : ''}`);
                    if (registration.children_10_15 > 0) parts.push(`${registration.children_10_15} child${registration.children_10_15 > 1 ? 'ren' : ''} (10–15)`);
                    if (registration.children_under_10 > 0) parts.push(`${registration.children_under_10} child${registration.children_under_10 > 1 ? 'ren' : ''} (under 10)`);

                    const html = renderRetreatConfirmationEmail({
                        firstName: registration.lead_name?.split(' ')[0] || 'Brother',
                        partySummary: parts.join(', '),
                        amountPaid: `£${(registration.total_amount / 100).toLocaleString('en-GB')}`,
                        dates: RETREAT.dates,
                        location: RETREAT.location,
                    });

                    await sendEmail({
                        to: registration.lead_email,
                        subject: 'Confirmed: Your place on the Suhba Retreat 2026 🏔️',
                        html,
                    });
                    console.log('Retreat confirmation email sent to:', registration.lead_email);
                } catch (emailErr) {
                    console.error('Failed to send retreat confirmation email:', emailErr);
                }
            }
        }
        // Check if this is an event payment
        else if (metadata.type === 'event') {
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
                    .select('title, start_date, start_time, price, location:locations(name)')
                    .eq('id', eventId)
                    .single();

                if (eventData && userEmail) {
                    const eventDate = new Date(eventData.start_date);
                    const html = renderEventConfirmationEmail({
                        firstName: userName?.split(' ')[0] || 'Guest',
                        eventTitle: eventData.title,
                        eventDate: eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                        eventTime: eventData.start_time ? eventData.start_time.slice(0, 5) : 'TBC',
                        eventLocation: (eventData.location as { name: string } | null)?.name || 'TBC',
                        amountPaid: eventData.price ? `£${(eventData.price / 100).toFixed(2)}` : 'Free',
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

    // Handle subscription status changes (dunning and recovery)
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
        } else if (subscription.status === 'active') {
            // Payment recovered (or resumed) - reinstate the membership so it
            // doesn't stay stuck in pending/payment_failed after dunning succeeds
            const supabase = await createAdminClient();

            await supabase
                .from('memberships')
                .update({ status: 'active' })
                .eq('stripe_subscription_id', subscription.id)
                .in('status', ['pending', 'payment_failed']);
        }
    }

    return NextResponse.json({ received: true });
}
