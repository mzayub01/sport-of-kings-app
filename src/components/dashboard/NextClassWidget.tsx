'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

interface NextClassWidgetProps {
    nextClass: {
        id: string;
        name: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        location: { name: string } | null;
    };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function NextClassWidget({ nextClass }: NextClassWidgetProps) {
    const today = new Date().getDay();
    const isToday = nextClass.day_of_week === today;

    // If today, don't show this widget (TodayClassCard handles it)
    if (isToday) {
        return null;
    }

    return (
        <Link
            href="/dashboard/classes"
            className="glass-card"
            style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-5)',
                borderLeft: '4px solid var(--color-gold)',
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: 'var(--space-1)',
                    }}>
                        📅 Your Next Class
                    </p>
                    <h3 style={{
                        fontSize: 'var(--text-lg)',
                        fontWeight: '600',
                        marginBottom: 'var(--space-2)',
                    }}>
                        {nextClass.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} />
                            {DAYS[nextClass.day_of_week]}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {nextClass.start_time.slice(0, 5)} - {nextClass.end_time.slice(0, 5)}
                        </span>
                        {nextClass.location?.name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} />
                                {nextClass.location.name}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight size={20} color="var(--text-tertiary)" />
            </div>
        </Link>
    );
}
