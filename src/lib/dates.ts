// Date helpers for class/attendance dates.
//
// Attendance is keyed by a YYYY-MM-DD `class_date` string. Never derive that
// string via toISOString() — it converts to UTC first, which shifts the date
// back a day during British Summer Time (a local-midnight Date in July is
// 23:00 UTC the previous day).

/** Format a Date as YYYY-MM-DD using its LOCAL date components. */
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Today's date (YYYY-MM-DD) in the club's timezone (Europe/London).
 * Use this in API routes / server components — Vercel servers run in UTC,
 * so local-date formatting there would be wrong during BST.
 */
export function ukDateString(date: Date = new Date()): string {
    // en-CA locale formats as YYYY-MM-DD
    return date.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}

/** Day of week (0 = Sunday .. 6 = Saturday) in the club's timezone. */
export function ukDayOfWeek(date: Date = new Date()): number {
    const day = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'short',
    }).format(date);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
}

/** Minutes since midnight in the club's timezone. */
export function ukMinutesOfDay(date: Date = new Date()): number {
    const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date);
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/** Parse a Postgres time string ("18:30:00") into minutes since midnight. */
export function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
