'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Receipt, Download, ExternalLink, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
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
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    Paid
                </span>
            );
        }
        if (status === 'open') {
            return (
                <span className="badge" style={{ background: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    Pending
                </span>
            );
        }
        if (status === 'uncollectible' || status === 'void') {
            return (
                <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            {invoices.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Receipt size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Payment History</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        You haven&apos;t made any payments yet.
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Date</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Description</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Amount</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                                            {formatDate(invoice.created)}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <CreditCard size={16} color="var(--color-gold)" />
                                                <span>{invoice.description}</span>
                                            </div>
                                            {invoice.number && (
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                                                    Invoice #{invoice.number}
                                                </p>
                                            )}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: '600' }}>
                                            {formatAmount(invoice.amount, invoice.currency)}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            {getStatusBadge(invoice.status || '', invoice.paid)}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                                {invoice.hosted_invoice_url && (
                                                    <a
                                                        href={invoice.hosted_invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-ghost btn-sm"
                                                        title="View invoice"
                                                    >
                                                        <ExternalLink size={14} />
                                                        View
                                                    </a>
                                                )}
                                                {invoice.invoice_pdf && (
                                                    <a
                                                        href={invoice.invoice_pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-ghost btn-sm"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={14} />
                                                        PDF
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary Card */}
            {invoices.length > 0 && (
                <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <FileText size={24} color="var(--color-gold)" />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '500', margin: 0 }}>Total Payments</p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                {invoices.filter(i => i.paid).length} successful payment{invoices.filter(i => i.paid).length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-gold)', margin: 0 }}>
                                £{invoices.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                            </p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Total paid</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
