'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Receipt, Download, ExternalLink, CheckCircle, AlertCircle, Clock, FileText, Calendar } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Invoice {
    id: string;
    number: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    paid: boolean;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    description: string;
}

export default function PaymentHistoryPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/stripe/invoices');
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setInvoices(data.invoices || []);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number, currency: string) => {
        const symbol = currency === 'gbp' ? '£' : currency === 'usd' ? '$' : '€';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const getStatusBadge = (status: string, paid: boolean) => {
        if (paid) {
            return (
                <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    Paid
                </span>
            );
        }
        if (status === 'open') {
            return (
                <span className="badge" style={{ background: '#F59E0B', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    Pending
                </span>
            );
        }
        if (status === 'uncollectible' || status === 'void') {
            return (
                <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    Failed
                </span>
            );
        }
        return <span className="badge badge-gray">{status}</span>;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    const totalPaid = invoices.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
    const paidCount = invoices.filter(i => i.paid).length;

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Payment History</h1>
                <p className="dashboard-subtitle">View your past payments and download receipts</p>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Summary Card - Always visible at top */}
            {invoices.length > 0 && (
                <div className="glass-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--color-gold-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FileText size={24} color="var(--color-black)" />
                            </div>
                            <div>
                                <p style={{ fontWeight: '700', fontSize: 'var(--text-2xl)', margin: 0, color: 'var(--color-gold)' }}>
                                    £{totalPaid.toFixed(2)}
                                </p>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                    {paidCount} payment{paidCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {invoices.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Receipt size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Payment History</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        You haven&apos;t made any payments yet.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="card"
                            style={{
                                borderLeft: `4px solid ${invoice.paid ? 'var(--color-green)' : invoice.status === 'open' ? '#F59E0B' : 'var(--border-default)'}`,
                            }}
                        >
                            <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                                {/* Top row: Description and Amount */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                                            <CreditCard size={16} color="var(--color-gold)" />
                                            <span style={{ fontWeight: '600' }}>{invoice.description}</span>
                                        </div>
                                        {invoice.number && (
                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                                Invoice #{invoice.number}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '700', fontSize: 'var(--text-lg)', margin: 0 }}>
                                            {formatAmount(invoice.amount, invoice.currency)}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom row: Date, Status, and Actions */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 'var(--space-2)',
                                    paddingTop: 'var(--space-3)',
                                    borderTop: '1px solid var(--border-light)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            <Calendar size={14} />
                                            {formatDate(invoice.created)}
                                        </div>
                                        {getStatusBadge(invoice.status || '', invoice.paid)}
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        {invoice.hosted_invoice_url && (
                                            <a
                                                href={invoice.hosted_invoice_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost btn-sm"
                                                style={{ padding: 'var(--space-2)' }}
                                                title="View invoice"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        {invoice.invoice_pdf && (
                                            <a
                                                href={invoice.invoice_pdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-ghost btn-sm"
                                                style={{ padding: 'var(--space-2)' }}
                                                title="Download PDF"
                                            >
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
