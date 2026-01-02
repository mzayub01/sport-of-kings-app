import { NextRequest, NextResponse } from 'next/server';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json(
            { error: 'Stripe is not configured', invoices: [] },
            { status: 400 }
        );
    }

    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json(
            { error: 'Stripe client not available', invoices: [] },
            { status: 400 }
        );
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated', invoices: [] },
                { status: 401 }
            );
        }

        // Get customer ID from URL params or find by user
        const { searchParams } = new URL(request.url);
        let customerId = searchParams.get('customerId');

        // If no customerId provided, look up from profile
        if (!customerId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('stripe_customer_id')
                .eq('user_id', user.id)
                .single();

            customerId = profile?.stripe_customer_id;
        }

        if (!customerId) {
            return NextResponse.json({ invoices: [], message: 'No payment history found' });
        }

        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list({
            customer: customerId,
            limit: 50,
        });

        // Transform to simpler format
        const formattedInvoices = invoices.data.map((invoice) => ({
            id: invoice.id,
            number: invoice.number,
            amount: invoice.amount_paid / 100, // Convert from cents to pounds
            currency: invoice.currency,
            status: invoice.status,
            created: invoice.created,
            paid: invoice.status === 'paid',
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            description: invoice.lines.data[0]?.description || 'Membership',
        }));

        return NextResponse.json({ invoices: formattedInvoices });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch invoices', invoices: [] },
            { status: 500 }
        );
    }
}
