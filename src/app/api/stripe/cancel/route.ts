import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json(
            { error: 'Stripe is not configured' },
            { status: 400 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe client not available' },
            { status: 400 }
        );
    }

    try {
        const { subscriptionId, membershipId } = await request.json();

        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'Subscription ID is required' },
                { status: 400 }
            );
        }

        console.log('Cancelling subscription:', subscriptionId);

        // Cancel the subscription in Stripe
        const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        console.log('Subscription cancelled:', cancelledSubscription.id, cancelledSubscription.status);

        // Update membership status in database
        if (membershipId) {
            const supabase = await createAdminClient();
            await supabase
                .from('memberships')
                .update({ status: 'cancelled' })
                .eq('id', membershipId);
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: {
                id: cancelledSubscription.id,
                status: cancelledSubscription.status,
            },
        });
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel subscription' },
            { status: 500 }
        );
    }
}
