import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Suhba Retreat 2026 — Marrakech | Sport of Kings',
    description:
        'BJJ, archery, swimming, excursions, zikr and suhba in the Atlas Mountains. 8–11 October 2026. Private resort, all meals and activities included. Spaces strictly limited.',
    openGraph: {
        title: 'Suhba Retreat 2026 — Atlas Mountains, Marrakech',
        description:
            'Strengthen the body and nourish the soul. BJJ, archery, excursions and spiritual companionship in Morocco — 8–11 October 2026. Register now, spaces strictly limited.',
        type: 'website',
        locale: 'en_GB',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1200&q=80',
                width: 1200,
                height: 800,
                alt: 'The Koutoubia minaret in Marrakech with the snow-capped Atlas Mountains behind',
            },
        ],
    },
};

export default function RetreatLayout({ children }: { children: React.ReactNode }) {
    return children;
}
