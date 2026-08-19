// Suhba Retreat 2026 — shared constants for the public page, checkout API,
// webhook and admin view. Prices are in pence.

export const RETREAT = {
    year: 2026,
    name: 'Suhba Retreat 2026',
    location: 'Atlas Mountains · Marrakech, Morocco',
    dates: 'Thursday 8th – Sunday 11th October 2026',
    shortDates: '8–11 October 2026',
} as const;

// The public page (and API) only reveal the exact places-left count at or
// below this threshold — when there's plenty of room, no numbers are shown
export const LOW_AVAILABILITY_THRESHOLD = 12;

export const RETREAT_PRICES = {
    adult: 45000,          // £450
    child_10_15: 25000,    // £250
    child_under_10: 20000, // £200
} as const;

export type AttendeeCategory = keyof typeof RETREAT_PRICES;

export const CATEGORY_LABELS: Record<AttendeeCategory, string> = {
    adult: 'Adult',
    child_10_15: 'Child (10–15)',
    child_under_10: 'Child (under 10)',
};

export interface RetreatAttendee {
    name: string;
    category: AttendeeCategory;
    age?: number;      // required for children
    medical?: string;  // medical / dietary notes
}

export function computeRetreatTotal(counts: { adults: number; children_10_15: number; children_under_10: number }): number {
    return (
        counts.adults * RETREAT_PRICES.adult +
        counts.children_10_15 * RETREAT_PRICES.child_10_15 +
        counts.children_under_10 * RETREAT_PRICES.child_under_10
    );
}

export function formatPence(pence: number): string {
    return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
