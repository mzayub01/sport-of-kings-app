'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Trash2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface WaitlistEntry {
    id: string;
    user_id: string;
    location_id: string;
    membership_type_id: string | null;
    position: number;
    created_at: string;
    profile?: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    location?: {
        name: string;
    };
    membership_type?: {
        name: string;
    };
}

interface Location {
    id: string;
    name: string;
}

export default function AdminWaitlistPage() {
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all data separately to avoid relationship issues
            const [waitlistRes, locationsRes, membershipTypesRes, profilesRes] = await Promise.all([
                supabase
                    .from('waitlist')
                    .select('*')
                    .order('position'),
                supabase
                    .from('locations')
                    .select('id, name')
                    .eq('is_active', true),
                supabase
                    .from('membership_types')
                    .select('id, name'),
                supabase
                    .from('profiles')
                    .select('user_id, first_name, last_name, email, phone'),
            ]);

            // Create lookup maps
            const locationsMap = new Map(
                (locationsRes.data || []).map(loc => [loc.id, loc])
            );
            const membershipTypesMap = new Map(
                (membershipTypesRes.data || []).map(mt => [mt.id, mt])
            );
            const profilesMap = new Map(
                (profilesRes.data || []).map(p => [p.user_id, p])
            );

            // Manually join all data
            const waitlistWithJoins = (waitlistRes.data || []).map(entry => ({
                ...entry,
                created_at: entry.created_at || new Date().toISOString(),
                profile: profilesMap.get(entry.user_id) || null,
                location: locationsMap.get(entry.location_id) || null,
                membership_type: entry.membership_type_id
                    ? membershipTypesMap.get(entry.membership_type_id)
                    : null
            }));

            setWaitlist(waitlistWithJoins);
            setLocations(locationsRes.data || []);
        } catch (err) {
            console.error('Error fetching waitlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const approveWaitlist = async (entry: WaitlistEntry) => {
        setProcessingId(entry.id);
        setError('');
        setSuccess('');

        try {
            // Create membership for this user
            const { error: membershipError } = await supabase
                .from('memberships')
                .insert({
                    user_id: entry.user_id,
                    location_id: entry.location_id,
                    membership_type_id: entry.membership_type_id,
                    status: 'active',
                    start_date: new Date().toISOString().split('T')[0],
                });

            if (membershipError) throw membershipError;

            // Remove from waitlist
            await supabase
                .from('waitlist')
                .delete()
                .eq('id', entry.id);

            setSuccess(`${entry.profile?.first_name} ${entry.profile?.last_name} has been added as a member!`);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Failed to approve waitlist entry');
        } finally {
            setProcessingId(null);
        }
    };

    const removeFromWaitlist = async (id: string) => {
        if (!confirm('Remove this person from the waitlist?')) return;

        setProcessingId(id);
        try {
            await supabase.from('waitlist').delete().eq('id', id);
            fetchData();
            setSuccess('Removed from waitlist');
        } catch (err) {
            console.error('Error removing:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredWaitlist = selectedLocation === 'all'
        ? waitlist
        : waitlist.filter(w => w.location_id === selectedLocation);

    // Group by location
    const waitlistByLocation: Record<string, WaitlistEntry[]> = {};
    filteredWaitlist.forEach(entry => {
        const locName = entry.location?.name || 'Unknown';
        if (!waitlistByLocation[locName]) {
            waitlistByLocation[locName] = [];
        }
        waitlistByLocation[locName].push(entry);
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Waitlist</h1>
                <p className="dashboard-subtitle">
                    Manage members waiting for spots at full locations ({waitlist.length} total)
                </p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* Location Filter */}
            <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <MapPin size={18} color="var(--text-tertiary)" />
                <select
                    className="form-input"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    style={{ width: 'auto', minWidth: '200px' }}
                >
                    <option value="all">All Locations ({waitlist.length})</option>
                    {locations.map(loc => {
                        const count = waitlist.filter(w => w.location_id === loc.id).length;
                        return (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({count})
                            </option>
                        );
                    })}
                </select>
            </div>

            {filteredWaitlist.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Users size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Waitlist Entries</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                        {selectedLocation === 'all'
                            ? 'All locations have available capacity.'
                            : 'No one is waiting for this location.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {Object.entries(waitlistByLocation).map(([locationName, entries]) => (
                        <div key={locationName}>
                            <h3 style={{
                                fontSize: 'var(--text-lg)',
                                color: 'var(--color-gold)',
                                marginBottom: 'var(--space-4)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                            }}>
                                <MapPin size={20} />
                                {locationName}
                                <span className="badge badge-gray">{entries.length} waiting</span>
                            </h3>

                            <div className="card">
                                <div className="card-body" style={{ padding: 0 }}>
                                    {entries.map((entry, index) => (
                                        <div
                                            key={entry.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--space-4)',
                                                borderBottom: index < entries.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                                {/* Position */}
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'var(--color-gold-gradient)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '700',
                                                    color: 'var(--color-black)',
                                                }}>
                                                    #{entry.position}
                                                </div>

                                                <div>
                                                    <p style={{ fontWeight: '600', margin: 0 }}>
                                                        {entry.profile?.first_name} {entry.profile?.last_name}
                                                    </p>
                                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {entry.profile?.email}
                                                    </p>
                                                    {entry.membership_type && (
                                                        <span className="badge badge-gold" style={{ marginTop: 'var(--space-1)' }}>
                                                            {entry.membership_type.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                                    <Clock size={14} />
                                                    {new Date(entry.created_at).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </span>

                                                <button
                                                    onClick={() => approveWaitlist(entry)}
                                                    disabled={processingId === entry.id}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    <UserPlus size={16} />
                                                    Approve
                                                </button>

                                                <button
                                                    onClick={() => removeFromWaitlist(entry.id)}
                                                    disabled={processingId === entry.id}
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: 'var(--color-red)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
