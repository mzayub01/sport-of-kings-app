import { NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// Compares live Stripe subscriptions against the memberships table and
// reports any that are still billing while the membership is cancelled,
// inactive, or missing — so admins can mop them up.
export async function GET() {
    if (!isStripeConfigured()) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 400 });
    }
    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe client not available' }, { status: 400 });
    }

    try {
        // Admin only
        const authClient = await createClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: adminProfile } = await authClient
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // All memberships that reference a Stripe subscription
        const admin = await createAdminClient();
        const { data: memberships } = await admin
            .from('memberships')
            .select('id, status, stripe_subscription_id, profile:profiles(first_name, last_name, email), location:locations(name)')
            .not('stripe_subscription_id', 'is', null);

        const membershipBySub = new Map<string, any>();
        (memberships || []).forEach((m: any) => {
            if (m.stripe_subscription_id) membershipBySub.set(m.stripe_subscription_id, m);
        });

        // Every subscription Stripe still considers billable
        const billing: Stripe.Subscription[] = [];
        for (const status of ['active', 'past_due'] as const) {
            for await (const sub of stripe.subscriptions.list({
                status,
                limit: 100,
                expand: ['data.customer'],
            })) {
                billing.push(sub);
            }
        }

        const mismatches = billing
            .map((sub) => {
                const membership = membershipBySub.get(sub.id);
                const dbStatus = membership?.status || null;
                // Fine: active/pending/payment_failed memberships are expected to have live subs
                if (dbStatus && !['cancelled', 'inactive'].includes(dbStatus)) return null;

                const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer | string;
                const customerEmail =
                    typeof customer === 'object' && !('deleted' in customer && customer.deleted)
                        ? (customer as Stripe.Customer).email
                        : null;
                const item = sub.items.data[0];

                return {
                    subscriptionId: sub.id,
                    stripeStatus: sub.status,
                    amount: item?.price?.unit_amount ?? null, // pence per interval
                    interval: item?.price?.recurring?.interval ?? 'month',
                    customerEmail,
                    membershipId: membership?.id ?? null,
                    dbStatus, // 'cancelled' | 'inactive' | null (no matching membership)
                    memberName: membership?.profile
                        ? `${membership.profile.first_name} ${membership.profile.last_name}`
                        : null,
                    locationName: membership?.location?.name ?? null,
                };
            })
            .filter(Boolean);

        return NextResponse.json({
            success: true,
            checked: billing.length,
            mismatches,
        });
    } catch (error) {
        console.error('Stripe reconciliation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Reconciliation failed' },
            { status: 500 }
        );
    }
}
