'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, CreditCard, Bell, Mail, Globe, AlertCircle, CheckCircle, Save, Key, Database } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface AppStats {
    totalMembers: number;
    activeMembers: number;
    totalClasses: number;
    totalLocations: number;
    totalVideos: number;
    totalInstructors: number;
}

export default function AdminSettingsPage() {
    const [stats, setStats] = useState<AppStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: totalMembers },
                { count: activeMembers },
                { count: totalClasses },
                { count: totalLocations },
                { count: totalVideos },
                { count: totalInstructors },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('videos').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('instructors').select('*', { count: 'exact', head: true }).eq('is_active', true),
            ]);

            setStats({
                totalMembers: totalMembers || 0,
                activeMembers: activeMembers || 0,
                totalClasses: totalClasses || 0,
                totalLocations: totalLocations || 0,
                totalVideos: totalVideos || 0,
                totalInstructors: totalInstructors || 0,
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className="dashboard-title">Settings</h1>
                <p className="dashboard-subtitle">
                    Application configuration and statistics
                </p>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* System Statistics */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Database size={20} color="var(--color-gold)" />
                        System Statistics
                    </h3>
                </div>
                <div className="card-body">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'var(--space-4)',
                    }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--color-gold)', margin: 0 }}>
                                {stats?.totalMembers || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Total Members</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--color-green)', margin: 0 }}>
                                {stats?.activeMembers || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Active Memberships</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {stats?.totalLocations || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Locations</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {stats?.totalClasses || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Active Classes</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {stats?.totalInstructors || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Instructors</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {stats?.totalVideos || 0}
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Videos</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-6)' }}>
                {/* API Configuration */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Key size={20} color="var(--color-gold)" />
                            API Configuration
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Supabase Project</label>
                            <div style={{
                                padding: 'var(--space-3)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontFamily: 'monospace',
                                fontSize: 'var(--text-sm)',
                                wordBreak: 'break-all',
                            }}>
                                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}
                            </div>
                        </div>

                        <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
                            <Shield size={18} />
                            <div>
                                <strong>Security Notice</strong>
                                <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                                    API keys are stored securely in environment variables and cannot be viewed here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <CreditCard size={20} color="var(--color-gold)" />
                            Payment Settings
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-warning">
                            <AlertCircle size={18} />
                            <div>
                                <strong>Stripe Integration</strong>
                                <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                                    Payment processing via Stripe is not yet configured. Contact your developer to set up payments.
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                When configured, you'll be able to:
                            </p>
                            <ul style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', paddingLeft: 'var(--space-5)' }}>
                                <li>Accept online membership payments</li>
                                <li>Process event registrations</li>
                                <li>Manage recurring subscriptions</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Bell size={20} color="var(--color-gold)" />
                            Notifications
                        </h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" defaultChecked />
                                <span>Email new member registrations</span>
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" defaultChecked />
                                <span>Email attendance milestones</span>
                            </label>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-checkbox">
                                <input type="checkbox" />
                                <span>Weekly summary email</span>
                            </label>
                        </div>

                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)', marginBottom: 0 }}>
                            Note: Email notifications require SMTP configuration.
                        </p>
                    </div>
                </div>

                {/* App Info */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Globe size={20} color="var(--color-gold)" />
                            Application Info
                        </h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>App Name</span>
                                <span style={{ fontWeight: '500' }}>Sport of Kings</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Framework</span>
                                <span style={{ fontWeight: '500' }}>Next.js 14</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Database</span>
                                <span style={{ fontWeight: '500' }}>Supabase (PostgreSQL)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Environment</span>
                                <span className="badge badge-green">Development</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
