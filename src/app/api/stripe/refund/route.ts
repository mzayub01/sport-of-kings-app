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
        const { paymentIntentId, chargeId, amount, reason } = await request.json();

        if (!paymentIntentId && !chargeId) {
            return NextResponse.json(
                { error: 'Payment intent ID or charge ID is required' },
                { status: 400 }
            );
        }

        console.log('Processing refund:', { paymentIntentId, chargeId, amount, reason });

        // Create refund params
        const refundParams: any = {
            reason: reason || 'requested_by_customer',
        };

        if (paymentIntentId) {
            refundParams.payment_intent = paymentIntentId;
        } else if (chargeId) {
            refundParams.charge = chargeId;
        }

        // If specific amount provided, use it (in pence/cents)
        if (amount && amount > 0) {
            refundParams.amount = Math.round(amount * 100);
        }

        // Create the refund in Stripe
        const refund = await stripe.refunds.create(refundParams);
        console.log('Refund created:', refund.id, refund.status);

        return NextResponse.json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                currency: refund.currency,
            },
        });
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process refund' },
            { status: 500 }
        );
    }
}
