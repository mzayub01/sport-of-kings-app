import type { Metadata } from 'next';

// Private hotel portal: never indexed, and the access token in the URL is
// never sent as a Referer when a document is opened.
export const metadata: Metadata = {
    title: 'Guest passports | Sport of Kings',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

export default function RetreatHotelLayout({ children }: { children: React.ReactNode }) {
    return children;
}
