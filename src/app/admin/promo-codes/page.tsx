'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Percent, PoundSterling, CheckCircle, AlertCircle, Calendar, RefreshCw } from 'lucide-react';

interface Coupon {
    id: string;
    name: string;
    percent_off: number | null;
    amount_off: number | null;
    currency: string | null;
    duration: string;
    duration_in_months: number | null;
    max_redemptions: number | null;
    times_redeemed: number;
    valid: boolean;
    created: number;
}

export default function AdminPromoCodesPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        discount_type: 'percent', // 'percent' or 'amount'
        percent_off: '',
        amount_off: '',
        duration: 'once',
        duration_in_months: '',
        max_redemptions: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stripe/coupons');
            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setCoupons(data.coupons || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/stripe/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formData.id,
                    name: formData.name || formData.id,
                    percent_off: formData.discount_type === 'percent' ? formData.percent_off : undefined,
                    amount_off: formData.discount_type === 'amount' ? formData.amount_off : undefined,
                    duration: formData.duration,
                    duration_in_months: formData.duration === 'repeating' ? formData.duration_in_months : undefined,
                    max_redemptions: formData.max_redemptions || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Promo code "${data.coupon.id}" created successfully!`);
                setShowModal(false);
                setFormData({
                    id: '',
                    name: '',
                    discount_type: 'percent',
                    percent_off: '',
                    amount_off: '',
                    duration: 'once',
                    duration_in_months: '',
                    max_redemptions: '',
                });
                fetchCoupons();
            } else {
                setError(data.error || 'Failed to create promo code');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteCoupon = async (couponId: string) => {
        if (!confirm(`Are you sure you want to delete promo code "${couponId}"?`)) return;

        try {
            const response = await fetch('/api/stripe/coupons', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ couponId }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Promo code deleted successfully');
                fetchCoupons();
            } else {
                setError(data.error || 'Failed to delete promo code');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDiscountDisplay = (coupon: Coupon) => {
        if (coupon.percent_off) {
            return `${coupon.percent_off}% off`;
        }
        if (coupon.amount_off) {
            return `£${coupon.amount_off} off`;
        }
        return 'Unknown';
    };

    const getDurationDisplay = (coupon: Coupon) => {
        if (coupon.duration === 'once') return 'One time';
        if (coupon.duration === 'forever') return 'Forever';
        if (coupon.duration === 'repeating') return `${coupon.duration_in_months} months`;
        return coupon.duration;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                    <h1 className="dashboard-title">Promo Codes</h1>
                    <p className="dashboard-subtitle">Create and manage discount codes</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    Create Promo Code
                </button>
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

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="stat-card glass-card">
                    <p className="stat-label">Total Promo Codes</p>
                    <p className="stat-value">{coupons.length}</p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Active</p>
                    <p className="stat-value" style={{ color: 'var(--color-green)' }}>
                        {coupons.filter(c => c.valid).length}
                    </p>
                </div>
                <div className="stat-card glass-card">
                    <p className="stat-label">Total Redemptions</p>
                    <p className="stat-value" style={{ color: 'var(--color-gold)' }}>
                        {coupons.reduce((sum, c) => sum + c.times_redeemed, 0)}
                    </p>
                </div>
            </div>

            {/* Coupons Table */}
            {coupons.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Tag size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Promo Codes</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Create your first promo code to offer discounts to members.
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={18} />
                        Create Promo Code
                    </button>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Code</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Discount</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Duration</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Redemptions</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <Tag size={16} color="var(--color-gold)" />
                                                <div>
                                                    <code style={{ fontWeight: '600', fontSize: 'var(--text-base)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                                                        {coupon.id}
                                                    </code>
                                                    {coupon.name && coupon.name !== coupon.id && (
                                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                                            {coupon.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            <span className="badge badge-gold">
                                                {coupon.percent_off ? <Percent size={12} /> : <PoundSterling size={12} />}
                                                {getDiscountDisplay(coupon)}
                                            </span>
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                            {getDurationDisplay(coupon)}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            <span style={{ fontWeight: '600' }}>{coupon.times_redeemed}</span>
                                            {coupon.max_redemptions && (
                                                <span style={{ color: 'var(--text-tertiary)' }}> / {coupon.max_redemptions}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            {coupon.valid ? (
                                                <span className="badge badge-green">Active</span>
                                            ) : (
                                                <span className="badge badge-gray">Expired</span>
                                            )}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                                            <button
                                                onClick={() => deleteCoupon(coupon.id)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--color-red)' }}
                                                title="Delete promo code"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Promo Code</h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Promo Code*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                        placeholder="e.g., WINTER25"
                                        required
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        This is the code members will enter at checkout
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Display Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Winter 2024 Discount"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Discount Type*</label>
                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="discount_type"
                                                checked={formData.discount_type === 'percent'}
                                                onChange={() => setFormData({ ...formData, discount_type: 'percent', amount_off: '' })}
                                            />
                                            <Percent size={16} />
                                            Percentage
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="discount_type"
                                                checked={formData.discount_type === 'amount'}
                                                onChange={() => setFormData({ ...formData, discount_type: 'amount', percent_off: '' })}
                                            />
                                            <PoundSterling size={16} />
                                            Fixed Amount
                                        </label>
                                    </div>
                                </div>

                                {formData.discount_type === 'percent' ? (
                                    <div className="form-group">
                                        <label className="form-label">Percentage Off*</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.percent_off}
                                                onChange={(e) => setFormData({ ...formData, percent_off: e.target.value })}
                                                placeholder="25"
                                                min="1"
                                                max="100"
                                                required
                                            />
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Amount Off*</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>£</span>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.amount_off}
                                                onChange={(e) => setFormData({ ...formData, amount_off: e.target.value })}
                                                placeholder="5.00"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                style={{ paddingLeft: '28px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Duration</label>
                                    <select
                                        className="form-input"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    >
                                        <option value="once">One time (first payment only)</option>
                                        <option value="repeating">Multiple months</option>
                                        <option value="forever">Forever (all payments)</option>
                                    </select>
                                </div>

                                {formData.duration === 'repeating' && (
                                    <div className="form-group">
                                        <label className="form-label">Number of Months*</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.duration_in_months}
                                            onChange={(e) => setFormData({ ...formData, duration_in_months: e.target.value })}
                                            placeholder="3"
                                            min="1"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Maximum Redemptions (optional)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.max_redemptions}
                                        onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                                        placeholder="Leave empty for unlimited"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Promo Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
