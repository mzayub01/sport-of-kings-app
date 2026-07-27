'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    TrendingDown,
    TrendingUp,
    Minus,
    Download,
    Mail,
    Phone,
    AlertCircle,
    CheckCircle,
    Loader2,
    UserX,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/dates';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HISTORY_WEEKS = 8; // sparkline + trend window
// "Regular" = attended ≥ REGULAR_MIN_SESSIONS in the 6 weeks before the last
// fortnight; "drifted" = nothing in the last DRIFT_DAYS days
const REGULAR_MIN_SESSIONS = 4;
const DRIFT_DAYS = 14;
const ATTENTION_THRESHOLD = 0.8; // flag classes below 80% of their 4-week average

interface LocationRow {
    id: string;
    name: string;
}

interface ClassRow {
    id: string;
    name: string;
    day_of_week: number; // 0 = Sunday
    start_time: string;
    location_id: string;
}

interface AttendanceRow {
    class_id: string;
    class_date: string;
    user_id: string;
}

interface DriftedMember {
    userId: string;
    name: string;
    isChild: boolean;
    locationName: string;
    usualDays: string;
    lastSeen: string;
    sessionsInWindow: number;
    contactName: string | null; // parent name when the member is a child
    email: string | null;
    phone: string | null;
}

/** Monday of the week containing `date` (local time). */
function mondayOf(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

export default function AttendanceOverviewPage() {
    const supabase = getSupabaseClient();

    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [classes, setClasses] = useState<ClassRow[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
    const [drifted, setDrifted] = useState<DriftedMember[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exportFrom, setExportFrom] = useState(() =>
        toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [exportTo, setExportTo] = useState(() => toLocalDateString(new Date()));
    const [exporting, setExporting] = useState(false);

    const todayStr = toLocalDateString(new Date());
    const weekDates = useMemo(
        () => Array.from({ length: 7 }, (_, i) => toLocalDateString(addDays(weekStart, i))),
        [weekStart]
    );

    // ---------- data loading ----------

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [{ data: locs }, { data: cls }] = await Promise.all([
                    supabase.from('locations').select('id, name').eq('is_active', true).order('name'),
                    supabase.from('classes')
                        .select('id, name, day_of_week, start_time, location_id')
                        .eq('is_active', true)
                        .order('day_of_week')
                        .order('start_time'),
                ]);
                setLocations(locs || []);
                setClasses(cls || []);

                // One attendance fetch covers the grid, trends, sparkline history
                // and the drifted-regulars window
                const from = toLocalDateString(addDays(weekStart, -7 * HISTORY_WEEKS));
                const to = toLocalDateString(
                    addDays(weekStart, 6) > new Date() ? addDays(weekStart, 6) : new Date()
                );
                const { data: att, error: attError } = await supabase
                    .from('attendance')
                    .select('class_id, class_date, user_id')
                    .gte('class_date', from)
                    .lte('class_date', to)
                    .limit(20000);

                if (attError) throw attError;
                setAttendance((att || []).map((a: AttendanceRow) => ({
                    ...a,
                    class_date: a.class_date.split('T')[0],
                })));
            } catch (err) {
                console.error('Error loading attendance overview:', err);
                setError('Failed to load attendance data. Please try refreshing.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [weekStart, supabase]);

    // ---------- derived data ----------

    const visibleClasses = useMemo(
        () => classes.filter(c => selectedLocation === 'all' || c.location_id === selectedLocation),
        [classes, selectedLocation]
    );

    const locationName = useCallback(
        (id: string) => locations.find(l => l.id === id)?.name || 'Unknown',
        [locations]
    );

    // count per class per date
    const countByClassDate = useMemo(() => {
        const map = new Map<string, number>();
        attendance.forEach(a => {
            const key = `${a.class_id}|${a.class_date}`;
            map.set(key, (map.get(key) || 0) + 1);
        });
        return map;
    }, [attendance]);

    interface ClassWeekStats {
        cls: ClassRow;
        cells: { date: string; count: number | null; isPast: boolean; runs: boolean }[];
        weekTotal: number;
        avg4: number | null;       // average of the prior 4 completed sessions
        trendPct: number | null;   // this week's completed sessions vs avg4
        spark: number[];           // weekly counts, oldest → newest
    }

    const grid: ClassWeekStats[] = useMemo(() => {
        return visibleClasses.map(cls => {
            const sessionCol = (cls.day_of_week + 6) % 7; // Mon-first column index

            const cells = weekDates.map((date, col) => {
                const runs = col === sessionCol;
                const isPast = date <= todayStr;
                const count = runs && isPast ? (countByClassDate.get(`${cls.id}|${date}`) || 0) : null;
                return { date, count, isPast, runs };
            });

            const completedThisWeek = cells.filter(c => c.runs && c.isPast && c.count !== null);
            const weekTotal = completedThisWeek.reduce((s, c) => s + (c.count || 0), 0);

            // prior 4 sessions of this class (same weekday, previous weeks)
            const priorCounts: number[] = [];
            for (let w = 1; w <= 4; w++) {
                const date = toLocalDateString(addDays(weekStart, sessionCol - 7 * w));
                if (date <= todayStr) {
                    priorCounts.push(countByClassDate.get(`${cls.id}|${date}`) || 0);
                }
            }
            const avg4 = priorCounts.length > 0
                ? priorCounts.reduce((a, b) => a + b, 0) / priorCounts.length
                : null;

            const trendPct = avg4 !== null && avg4 > 0 && completedThisWeek.length > 0
                ? Math.round(((weekTotal - avg4) / avg4) * 100)
                : null;

            const spark: number[] = [];
            for (let w = HISTORY_WEEKS - 1; w >= 0; w--) {
                const date = toLocalDateString(addDays(weekStart, sessionCol - 7 * w));
                spark.push(date <= todayStr ? (countByClassDate.get(`${cls.id}|${date}`) || 0) : 0);
            }

            return { cls, cells, weekTotal, avg4, trendPct, spark };
        });
    }, [visibleClasses, weekDates, weekStart, todayStr, countByClassDate]);

    const needsAttention = useMemo(
        () => grid.filter(g =>
            g.avg4 !== null && g.avg4 >= 3 && g.trendPct !== null &&
            g.weekTotal < g.avg4 * ATTENTION_THRESHOLD
        ),
        [grid]
    );

    // ---------- absent regulars (relative to today, not the viewed week) ----------

    useEffect(() => {
        const computeDrifted = async () => {
            if (attendance.length === 0 || classes.length === 0) {
                setDrifted([]);
                return;
            }
            try {
                const today = new Date();
                const driftCutoff = toLocalDateString(addDays(today, -DRIFT_DAYS));
                const windowStart = toLocalDateString(addDays(today, -(DRIFT_DAYS + 42))); // 6 weeks before the fortnight

                const classById = new Map(classes.map(c => [c.id, c]));
                const byUser = new Map<string, AttendanceRow[]>();
                attendance.forEach(a => {
                    if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
                    byUser.get(a.user_id)!.push(a);
                });

                const driftedIds: string[] = [];
                const statsByUser = new Map<string, { lastSeen: string; sessionsInWindow: number; usualDays: string; locationId: string }>();

                byUser.forEach((rows, userId) => {
                    const inWindow = rows.filter(r => r.class_date >= windowStart && r.class_date < driftCutoff);
                    const recent = rows.filter(r => r.class_date >= driftCutoff);
                    if (inWindow.length >= REGULAR_MIN_SESSIONS && recent.length === 0) {
                        const lastSeen = rows.reduce((m, r) => r.class_date > m ? r.class_date : m, '');
                        const dayCounts = new Map<number, number>();
                        const locCounts = new Map<string, number>();
                        inWindow.forEach(r => {
                            const cls = classById.get(r.class_id);
                            if (cls) {
                                dayCounts.set(cls.day_of_week, (dayCounts.get(cls.day_of_week) || 0) + 1);
                                locCounts.set(cls.location_id, (locCounts.get(cls.location_id) || 0) + 1);
                            }
                        });
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const usualDays = [...dayCounts.entries()]
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 2)
                            .map(([d]) => dayNames[d])
                            .join(' & ');
                        const locationId = [...locCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
                        driftedIds.push(userId);
                        statsByUser.set(userId, { lastSeen, sessionsInWindow: inWindow.length, usualDays, locationId });
                    }
                });

                if (driftedIds.length === 0) {
                    setDrifted([]);
                    return;
                }

                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, user_id, first_name, last_name, email, phone, is_child, parent_guardian_id')
                    .in('user_id', driftedIds);

                const parentIds = (profiles || [])
                    .filter((p: any) => p.is_child && p.parent_guardian_id)
                    .map((p: any) => p.parent_guardian_id);

                const { data: parents } = parentIds.length > 0
                    ? await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, email, phone')
                        .in('id', parentIds)
                    : { data: [] };

                interface ParentContact { id: string; first_name: string; last_name: string; email: string | null; phone: string | null }
                const parentById = new Map<string, ParentContact>(
                    ((parents || []) as ParentContact[]).map(p => [p.id, p])
                );

                const result: DriftedMember[] = (profiles || []).map((p: any) => {
                    const stats = statsByUser.get(p.user_id)!;
                    const parent = p.is_child ? parentById.get(p.parent_guardian_id) : null;
                    return {
                        userId: p.user_id,
                        name: `${p.first_name} ${p.last_name}`,
                        isChild: !!p.is_child,
                        locationName: locationName(stats.locationId),
                        usualDays: stats.usualDays,
                        lastSeen: stats.lastSeen,
                        sessionsInWindow: stats.sessionsInWindow,
                        contactName: parent ? `${parent.first_name} ${parent.last_name}` : null,
                        email: (parent ? parent.email : p.email) || null,
                        phone: (parent ? parent.phone : p.phone) || null,
                    };
                }).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

                setDrifted(result);
            } catch (err) {
                console.error('Error computing absent regulars:', err);
            }
        };
        computeDrifted();
    }, [attendance, classes, supabase, locationName]);

    const visibleDrifted = useMemo(
        () => drifted.filter(d => selectedLocation === 'all' || d.locationName === locationName(selectedLocation)),
        [drifted, selectedLocation, locationName]
    );

    // ---------- CSV export ----------

    const handleExport = async () => {
        setExporting(true);
        setError('');
        try {
            const { data, error: expError } = await supabase
                .from('attendance')
                .select('class_date, check_in_time, class:classes(name, location:locations(name)), profile:profiles(first_name, last_name)')
                .gte('class_date', exportFrom)
                .lte('class_date', exportTo)
                .order('class_date')
                .limit(20000);

            if (expError) throw expError;

            const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
            const rows = (data || []).map((r: any) => [
                r.class_date.split('T')[0],
                esc(r.class?.name || ''),
                esc(r.class?.location?.name || ''),
                esc(r.profile ? `${r.profile.first_name} ${r.profile.last_name}` : ''),
                r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
            ].join(','));

            const csv = ['Date,Class,Location,Member,Check-in Time', ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `attendance_${exportFrom}_to_${exportTo}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export attendance. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // ---------- render helpers ----------

    const formatWeekLabel = () => {
        const end = addDays(weekStart, 6);
        const sameMonth = weekStart.getMonth() === end.getMonth();
        const startLabel = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: sameMonth ? undefined : 'short' });
        const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${startLabel} – ${endLabel}`;
    };

    const isCurrentWeek = toLocalDateString(mondayOf(new Date())) === toLocalDateString(weekStart);

    const Sparkline = ({ values }: { values: number[] }) => {
        const w = 96, h = 28, pad = 3;
        const max = Math.max(...values, 1);
        const pts = values.map((v, i) => ({
            x: pad + (i * (w - pad * 2)) / (values.length - 1),
            y: h - pad - (v / max) * (h - pad * 2),
        }));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const last = pts[pts.length - 1];
        return (
            <svg width={w} height={h} role="img" aria-label={`Last ${values.length} weeks: ${values.join(', ')}`}>
                <path d={d} fill="none" stroke="var(--color-gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last.x} cy={last.y} r="3" fill="var(--color-gold-dark)" />
            </svg>
        );
    };

    const Trend = ({ pct }: { pct: number | null }) => {
        if (pct === null) {
            return <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}><Minus size={14} style={{ verticalAlign: '-2px' }} /> n/a</span>;
        }
        const declining = pct <= -20;
        const growing = pct >= 5;
        const color = declining ? 'var(--color-red)' : growing ? 'var(--color-green)' : 'var(--text-secondary)';
        const Icon = pct < 0 ? TrendingDown : TrendingUp;
        return (
            <span style={{ color, fontWeight: 600, fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon size={14} />
                {pct > 0 ? '+' : ''}{pct}%
            </span>
        );
    };

    // ---------- page ----------

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Attendance Overview</h1>
                <p className="dashboard-subtitle">Attendance by location and class, week by week</p>
            </div>

            {error && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Filters: location chips + week stepper */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
            }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button
                        className={`btn btn-sm ${selectedLocation === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setSelectedLocation('all')}
                    >
                        All locations
                    </button>
                    {locations.map(loc => (
                        <button
                            key={loc.id}
                            className={`btn btn-sm ${selectedLocation === loc.id ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setSelectedLocation(loc.id)}
                        >
                            <MapPin size={14} />
                            {loc.name}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontWeight: 600, minWidth: '170px', textAlign: 'center' }}>
                        {isCurrentWeek ? 'This week' : formatWeekLabel()}
                    </span>
                    <button className="btn btn-ghost btn-icon" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
                        <ChevronRight size={18} />
                    </button>
                    {!isCurrentWeek && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(mondayOf(new Date()))}>
                            Today
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="skeleton" style={{ height: '48px' }} />
                    <div className="skeleton" style={{ height: '280px' }} />
                    <div className="skeleton" style={{ height: '140px' }} />
                </div>
            ) : (
                <>
                    {/* Needs attention callout */}
                    {needsAttention.length > 0 && (
                        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)', alignItems: 'flex-start' }}>
                            <TrendingDown size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <strong>Needs attention:</strong>{' '}
                                {needsAttention.map((g, i) => (
                                    <span key={g.cls.id}>
                                        {i > 0 && ', '}
                                        {g.cls.name} ({locationName(g.cls.location_id)}) — {g.weekTotal} vs usual ~{Math.round(g.avg4!)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Week grid */}
                    {grid.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-10)', marginBottom: 'var(--space-8)' }}>
                            <CheckCircle size={40} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-3)' }} />
                            <h3 style={{ marginBottom: 'var(--space-2)' }}>No classes at this location</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                Attendance appears here as members scan in at classes.
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                            <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Class</th>
                                            {DAY_LABELS.map((d, i) => (
                                                <th key={d} style={{
                                                    padding: 'var(--space-3) var(--space-2)',
                                                    fontSize: 'var(--text-sm)',
                                                    color: weekDates[i] === todayStr ? 'var(--color-gold-dark)' : 'var(--text-secondary)',
                                                    fontWeight: weekDates[i] === todayStr ? 700 : 500,
                                                    textAlign: 'center',
                                                    minWidth: '52px',
                                                }}>
                                                    {d}
                                                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>
                                                        {new Date(weekDates[i] + 'T12:00:00').getDate()}
                                                    </div>
                                                </th>
                                            ))}
                                            <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Week</th>
                                            <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>vs 4-wk avg</th>
                                            <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{HISTORY_WEEKS} weeks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grid.map(({ cls, cells, weekTotal, trendPct, spark }, rowIdx) => (
                                            <tr key={cls.id} style={{ borderBottom: rowIdx < grid.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                                                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                                    <p style={{ fontWeight: 600, margin: 0, fontSize: 'var(--text-sm)' }}>{cls.name}</p>
                                                    {selectedLocation === 'all' && (
                                                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                                            {locationName(cls.location_id)} · {cls.start_time.slice(0, 5)}
                                                        </p>
                                                    )}
                                                </td>
                                                {cells.map((cell, i) => (
                                                    <td key={i} style={{ textAlign: 'center', padding: 'var(--space-2)' }}>
                                                        {!cell.runs ? (
                                                            <span style={{ color: 'var(--border-medium)' }}>·</span>
                                                        ) : !cell.isPast ? (
                                                            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>–</span>
                                                        ) : (
                                                            <Link
                                                                href={`/admin/class-roster?classId=${cls.id}&date=${cell.date}`}
                                                                title={`Open roster for ${cls.name} on ${cell.date}`}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minWidth: '36px',
                                                                    height: '32px',
                                                                    padding: '0 var(--space-2)',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    fontWeight: 700,
                                                                    fontSize: 'var(--text-sm)',
                                                                    color: cell.count === 0 ? 'var(--color-gold-dark)' : 'var(--text-primary)',
                                                                    background: cell.count === 0 ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-secondary)',
                                                                    textDecoration: 'none',
                                                                }}
                                                            >
                                                                {cell.count}
                                                            </Link>
                                                        )}
                                                    </td>
                                                ))}
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{weekTotal}</td>
                                                <td style={{ textAlign: 'center' }}><Trend pct={trendPct} /></td>
                                                <td style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-4)' }}>
                                                    <Sparkline values={spark} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Absent regulars */}
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Absent Regulars</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                        Members who attended regularly but haven&apos;t been seen in the last {DRIFT_DAYS} days.
                        Recently launched QR check-in means early data may under-detect — this sharpens over the next few weeks.
                    </p>
                    {visibleDrifted.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
                            <CheckCircle size={36} color="var(--color-green)" style={{ margin: '0 auto var(--space-3)' }} />
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                Nobody has drifted — great retention! 🎉
                            </p>
                        </div>
                    ) : (
                        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                            <div className="card-body" style={{ padding: 0 }}>
                                {visibleDrifted.map((m, i) => (
                                    <div
                                        key={m.userId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-3)',
                                            padding: 'var(--space-4)',
                                            borderBottom: i < visibleDrifted.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: '220px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: 'var(--radius-full)',
                                                background: 'var(--bg-tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <UserX size={18} color="var(--text-secondary)" />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, margin: 0 }}>
                                                    {m.name}
                                                    {m.isChild && <span className="badge badge-gray" style={{ marginLeft: 'var(--space-2)' }}>Child</span>}
                                                </p>
                                                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                    {m.locationName} · usually {m.usualDays || '—'} · last seen{' '}
                                                    {new Date(m.lastSeen + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                            {m.contactName && (
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                                    Contact {m.contactName}:
                                                </span>
                                            )}
                                            {m.email && (
                                                <a href={`mailto:${m.email}`} className="btn btn-ghost btn-sm" aria-label={`Email ${m.contactName || m.name}`}>
                                                    <Mail size={16} />
                                                    Email
                                                </a>
                                            )}
                                            {m.phone && (
                                                <a href={`tel:${m.phone}`} className="btn btn-ghost btn-sm" aria-label={`Call ${m.contactName || m.name}`}>
                                                    <Phone size={16} />
                                                    Call
                                                </a>
                                            )}
                                            {!m.email && !m.phone && (
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No contact details</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Export */}
                    <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Export</h2>
                    <div className="glass-card" style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 'var(--space-4)',
                        flexWrap: 'wrap',
                        padding: 'var(--space-5)',
                    }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" htmlFor="export-from">From</label>
                            <input
                                id="export-from"
                                type="date"
                                className="form-input"
                                value={exportFrom}
                                onChange={e => setExportFrom(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" htmlFor="export-to">To</label>
                            <input
                                id="export-to"
                                type="date"
                                className="form-input"
                                value={exportTo}
                                onChange={e => setExportTo(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
                            {exporting ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                            Export CSV
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
