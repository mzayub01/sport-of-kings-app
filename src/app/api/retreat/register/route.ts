import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import {
    RETREAT,
    RETREAT_PRICES,
    CATEGORY_LABELS,
    computeRetreatTotal,
    type RetreatAttendee,
} from '@/lib/retreat';
import { getRetreatAvailability } from '@/lib/retreat-server';
import Stripe from 'stripe';

const MAX_PER_CATEGORY = 20;

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json(
            { error: 'Online payment is not available right now. Please contact us to register.' },
            { status: 503 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json(
            { error: 'Online payment is not available right now. Please contact us to register.' },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const {
            leadName,
            leadEmail,
            leadPhone,
            emergencyContactName,
            emergencyContactPhone,
            attendees,
            notes,
        } = body as {
            leadName?: string;
            leadEmail?: string;
            leadPhone?: string;
            emergencyContactName?: string;
            emergencyContactPhone?: string;
            attendees?: RetreatAttendee[];
            notes?: string;
        };

        // ---- validation (never trust the client) ----
        const clean = (v: unknown) => typeof v === 'string' ? v.trim() : '';
        const lead = { name: clean(leadName), email: clean(leadEmail), phone: clean(leadPhone) };
        const emergency = { name: clean(emergencyContactName), phone: clean(emergencyContactPhone) };

        if (!lead.name || !lead.email || !lead.phone) {
            return NextResponse.json({ error: 'Please provide your name, email and phone number.' }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
            return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
        }
        if (!emergency.name || !emergency.phone) {
            return NextResponse.json({ error: 'Please provide an emergency contact.' }, { status: 400 });
        }
        if (!Array.isArray(attendees) || attendees.length === 0) {
            return NextResponse.json({ error: 'Please add at least one attendee.' }, { status: 400 });
        }

        const cleanAttendees: RetreatAttendee[] = [];
        for (const a of attendees) {
            const name = clean(a?.name);
            const category = a?.category;
            if (!name) {
                return NextResponse.json({ error: 'Every attendee needs a name.' }, { status: 400 });
            }
            if (category !== 'adult' && category !== 'child_10_15' && category !== 'child_under_10') {
                return NextResponse.json({ error: 'Invalid attendee category.' }, { status: 400 });
            }
            const age = typeof a.age === 'number' && a.age > 0 && a.age < 100 ? Math.floor(a.age) : undefined;
            if (category !== 'adult' && age === undefined) {
                return NextResponse.json({ error: `Please provide an age for ${name}.` }, { status: 400 });
            }
            if (category === 'child_10_15' && age !== undefined && (age < 10 || age > 15)) {
                return NextResponse.json({ error: `${name} is ${age} — the 10–15 category needs an age between 10 and 15.` }, { status: 400 });
            }
            if (category === 'child_under_10' && age !== undefined && age >= 10) {
                return NextResponse.json({ error: `${name} is ${age} — please use the 10–15 category.` }, { status: 400 });
            }
            cleanAttendees.push({ name, category, age, medical: clean(a.medical) || undefined });
        }

        const counts = {
            adults: cleanAttendees.filter(a => a.category === 'adult').length,
            children_10_15: cleanAttendees.filter(a => a.category === 'child_10_15').length,
            children_under_10: cleanAttendees.filter(a => a.category === 'child_under_10').length,
        };

        if (Object.values(counts).some(c => c > MAX_PER_CATEGORY)) {
            return NextResponse.json({ error: 'For large group bookings please contact us directly.' }, { status: 400 });
        }
        if (counts.adults === 0) {
            return NextResponse.json({ error: 'Every booking needs at least one adult — children must be accompanied.' }, { status: 400 });
        }

        const totalAmount = computeRetreatTotal(counts);
        const partySize = cleanAttendees.length;

        // ---- capacity check (paid attendees + live pending holds) ----
        const supabase = await createAdminClient();
        const availability = await getRetreatAvailability(supabase);
        if (availability.remaining !== null) {
            if (availability.remaining <= 0) {
                return NextResponse.json(
                    { error: 'The retreat is now fully booked. Email sportofkings786@gmail.com to join the waiting list.' },
                    { status: 409 }
                );
            }
            if (partySize > availability.remaining) {
                return NextResponse.json(
                    { error: `Only ${availability.remaining} ${availability.remaining === 1 ? 'place' : 'places'} remain — please reduce your party size or contact us.` },
                    { status: 409 }
                );
            }
        }

        // ---- create the pending registration ----
        const { data: registration, error: insertError } = await supabase
            .from('retreat_registrations')
            .insert({
                retreat_year: RETREAT.year,
                lead_name: lead.name,
                lead_email: lead.email,
                lead_phone: lead.phone,
                emergency_contact_name: emergency.name,
                emergency_contact_phone: emergency.phone,
                adults: counts.adults,
                children_10_15: counts.children_10_15,
                children_under_10: counts.children_under_10,
                attendees: cleanAttendees,
                notes: clean(notes) || null,
                total_amount: totalAmount,
                status: 'pending',
            })
            .select('id')
            .single();

        if (insertError || !registration) {
            console.error('Retreat registration insert error:', insertError);
            return NextResponse.json({ error: 'Could not save your registration. Please try again.' }, { status: 500 });
        }

        // ---- Stripe checkout session with itemised party ----
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = (
            [
                ['adult', counts.adults],
                ['child_10_15', counts.children_10_15],
                ['child_under_10', counts.children_under_10],
            ] as const
        )
            .filter(([, qty]) => qty > 0)
            .map(([category, qty]) => ({
                price_data: {
                    currency: 'gbp',
                    unit_amount: RETREAT_PRICES[category],
                    product_data: {
                        name: `${RETREAT.name} — ${CATEGORY_LABELS[category]}`,
                        description: `${RETREAT.location} · ${RETREAT.dates}`,
                    },
                },
                quantity: qty,
            }));

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: lead.email,
            allow_promotion_codes: true,
            // Abandoned checkouts release their capacity hold after 30 minutes
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            metadata: {
                type: 'retreat',
                registrationId: registration.id,
            },
            line_items: lineItems,
            success_url: `${baseUrl}/retreat-2026/success`,
            cancel_url: `${baseUrl}/retreat-2026?payment=cancelled#register`,
        });

        await supabase
            .from('retreat_registrations')
            .update({ stripe_session_id: session.id })
            .eq('id', registration.id);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Retreat registration error:', error);
        const message = error instanceof Error ? error.message : 'Something went wrong';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
