import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Retreat passports | Sport of Kings',
    description: 'Upload passport copies for the Suhba Retreat 2026.',
    robots: { index: false, follow: false },
};

export default function RetreatPassportsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
