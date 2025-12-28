'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Calendar, Clock, MapPin } from 'lucide-react';

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
    const [loading, setLoading] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [message, setMessage] = useState('');

    const handleCheckIn = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId: nextClass.id }),
            });

            const data = await response.json();

            if (data.success) {
                setCheckedIn(true);
                setMessage(data.alreadyCheckedIn ? 'Already checked in!' : 'Checked in! ✓');
            } else {
                setMessage(data.error || 'Failed to check in');
            }
        } catch {
            setMessage('Error checking in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card" style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-5)',
            borderLeft: '4px solid var(--color-gold)',
        }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
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
                {message && (
                    <p style={{
                        marginTop: 'var(--space-2)',
                        fontSize: 'var(--text-sm)',
                        color: checkedIn ? 'var(--color-green)' : 'var(--color-red)',
                    }}>
                        {message}
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <button
                    onClick={handleCheckIn}
                    disabled={loading || checkedIn}
                    className="btn btn-primary btn-sm"
                    style={{ opacity: checkedIn ? 0.7 : 1, flex: '1 1 auto', minWidth: '120px' }}
                >
                    {loading ? (
                        <Loader2 size={16} className="spinner" />
                    ) : checkedIn ? (
                        <>
                            <CheckCircle size={16} />
                            Done
                        </>
                    ) : (
                        <>
                            <CheckCircle size={16} />
                            Check In
                        </>
                    )}
                </button>
                <Link href="/dashboard/classes" className="btn btn-ghost btn-sm" style={{ flex: '1 1 auto', minWidth: '100px', textAlign: 'center' }}>
                    View All
                </Link>
            </div>
        </div>
    );
}
