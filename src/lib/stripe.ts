import Stripe from 'stripe';

// Check if Stripe is configured
export const isStripeConfigured = () => {
    return !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Server-side Stripe client - only initialize if configured
let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe | null => {
    if (!isStripeConfigured()) {
        return null;
    }

    if (!stripeClient) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-12-15.clover' as const,
            typescript: true,
        });
    }

    return stripeClient;
};

// Legacy export for compatibility
export const stripe = isStripeConfigured()
    ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' as const })
    : null as unknown as Stripe;
