'use client';

import { useState, useEffect } from 'react';
import { Mail, Edit, Eye, Save, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface EmailTemplate {
    id: string;
    template_key: string;
    name: string;
    description: string | null;
    subject: string;
    greeting: string;
    body_intro: string;
    body_details: string | null;
    body_action: string | null;
    body_closing: string;
    signature: string;
    button_text: string | null;
    button_url: string | null;
    is_active: boolean;
    updated_at: string;
}

const TEMPLATE_ICONS: Record<string, string> = {
    welcome: '👋',
    event_confirmation: '🎫',
    membership_activated: '✅',
    payment_failed: '⚠️',
    announcement_notification: '📢',
};

export default function AdminEmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching templates:', error);
            setError('Failed to load email templates');
        } else {
            setTemplates(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

        setSaving(true);
        setError('');

        const { error } = await supabase
            .from('email_templates')
            .update({
                subject: editingTemplate.subject,
                greeting: editingTemplate.greeting,
                body_intro: editingTemplate.body_intro,
                body_details: editingTemplate.body_details,
                body_action: editingTemplate.body_action,
                body_closing: editingTemplate.body_closing,
                signature: editingTemplate.signature,
                button_text: editingTemplate.button_text,
                button_url: editingTemplate.button_url,
                is_active: editingTemplate.is_active,
            })
            .eq('id', editingTemplate.id);

        if (error) {
            console.error('Error saving template:', error);
            setError('Failed to save template');
        } else {
            setSuccess('Template saved successfully');
            setEditingTemplate(null);
            fetchTemplates();
            setTimeout(() => setSuccess(''), 3000);
        }

        setSaving(false);
    };

    const updateField = (field: keyof EmailTemplate, value: string | boolean) => {
        if (!editingTemplate) return;
        setEditingTemplate({ ...editingTemplate, [field]: value });
    };

    const renderPreview = (template: EmailTemplate) => {
        // Replace placeholders with sample data for preview
        const sampleData: Record<string, string> = {
            '{{firstName}}': 'Ahmed',
            '{{locationName}}': 'Fats Gym',
            '{{membershipType}}': 'Adult Membership',
            '{{eventTitle}}': 'BJJ Competition 2026',
            '{{eventDate}}': 'Saturday, 15th February 2026',
            '{{eventTime}}': '10:00 AM',
            '{{eventLocation}}': 'Fats Gym, Manchester',
            '{{ticketType}}': 'General Admission',
            '{{amountPaid}}': '£25.00',
            '{{price}}': '£30/month',
            '{{startDate}}': '5th January 2026',
            '{{amountDue}}': '£30.00',
            '{{attemptCount}}': '1',
            '{{nextAttemptDate}}': '12th January 2026',
            // Announcement template placeholders
            '{{announcementTitle}}': 'Important Class Update',
            '{{announcementMessage}}': 'This is a sample announcement message that will be sent to members.',
        };

        const replacePlaceholders = (text: string) => {
            let result = text;
            Object.entries(sampleData).forEach(([key, value]) => {
                result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
            });
            // Convert markdown-style bold to HTML
            result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return result;
        };

        return (
            <div style={{
                background: '#f8f9fa',
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-lg)',
                maxHeight: '70vh',
                overflow: 'auto',
            }}>
                <div style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                        <img
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            style={{ height: '60px', width: 'auto' }}
                        />
                    </div>

                    {/* Subject */}
                    <h2 style={{
                        fontSize: 'var(--text-xl)',
                        textAlign: 'center',
                        marginBottom: 'var(--space-4)',
                        color: '#1a1a1a',
                    }}>
                        {replacePlaceholders(template.subject)}
                    </h2>

                    {/* Greeting */}
                    <p style={{ marginBottom: 'var(--space-4)', color: '#4a4a4a' }}>
                        {replacePlaceholders(template.greeting)}
                    </p>

                    {/* Body Intro */}
                    <p style={{ marginBottom: 'var(--space-4)', color: '#4a4a4a' }}
                        dangerouslySetInnerHTML={{ __html: replacePlaceholders(template.body_intro) }}
                    />

                    {/* Body Details */}
                    {template.body_details && (
                        <div style={{
                            background: '#f8f9fa',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-4)',
                            whiteSpace: 'pre-line',
                        }}
                            dangerouslySetInnerHTML={{ __html: replacePlaceholders(template.body_details) }}
                        />
                    )}

                    {/* Body Action */}
                    {template.body_action && (
                        <p style={{ marginBottom: 'var(--space-4)', color: '#4a4a4a', whiteSpace: 'pre-line' }}
                            dangerouslySetInnerHTML={{ __html: replacePlaceholders(template.body_action) }}
                        />
                    )}

                    {/* Button */}
                    {template.button_text && (
                        <div style={{ textAlign: 'center', margin: 'var(--space-6) 0' }}>
                            <span style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #c5a456, #a68935)',
                                color: '#000',
                                padding: 'var(--space-3) var(--space-6)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                            }}>
                                {template.button_text}
                            </span>
                        </div>
                    )}

                    {/* Body Closing */}
                    <p style={{ marginBottom: 'var(--space-4)', color: '#4a4a4a' }}
                        dangerouslySetInnerHTML={{ __html: replacePlaceholders(template.body_closing) }}
                    />

                    {/* Signature */}
                    <p style={{ color: '#4a4a4a' }}>
                        JazakAllahu Khayran,<br />
                        <strong>{template.signature}</strong>
                    </p>

                    {/* Footer */}
                    <div style={{
                        borderTop: '1px solid #e5e5e5',
                        marginTop: 'var(--space-6)',
                        paddingTop: 'var(--space-4)',
                        textAlign: 'center',
                        color: '#888',
                        fontSize: 'var(--text-sm)',
                    }}>
                        <p style={{ margin: '0 0 4px' }}>Sport of Kings - Seerat Un Nabi</p>
                        <p style={{ margin: 0 }}>Brazilian Jiu-Jitsu Classes in Manchester</p>
                    </div>
                </div>
            </div>
        );
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
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard-title">Email Templates</h1>
                    <p className="dashboard-subtitle">Customize the content of automated emails</p>
                </div>
                <button className="btn btn-ghost" onClick={fetchTemplates}>
                    <RefreshCw size={18} />
                    Refresh
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

            {templates.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Mail size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Email Templates</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Run the database migration to create default templates.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 'var(--space-4)',
                }}>
                    {templates.map((template) => (
                        <div key={template.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--text-2xl)' }}>
                                            {TEMPLATE_ICONS[template.template_key] || '📧'}
                                        </span>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{template.name}</h3>
                                            <span className={`badge ${template.is_active ? 'badge-green' : 'badge-gray'}`}>
                                                {template.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {template.description && (
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                                        {template.description}
                                    </p>
                                )}

                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--space-3)',
                                    marginBottom: 'var(--space-4)',
                                }}>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Subject</p>
                                    <p style={{ fontSize: 'var(--text-sm)', margin: 0, fontWeight: '500' }}>{template.subject}</p>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => setPreviewTemplate(template)}
                                    >
                                        <Eye size={16} />
                                        Preview
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => setEditingTemplate(template)}
                                    >
                                        <Edit size={16} />
                                        Edit
                                    </button>
                                </div>

                                <p style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-tertiary)',
                                    marginTop: 'var(--space-3)',
                                    textAlign: 'center',
                                }}>
                                    Last updated: {new Date(template.updated_at).toLocaleDateString('en-GB')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {TEMPLATE_ICONS[previewTemplate.template_key]} {previewTemplate.name} Preview
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setPreviewTemplate(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            {renderPreview(previewTemplate)}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setPreviewTemplate(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => {
                                setEditingTemplate(previewTemplate);
                                setPreviewTemplate(null);
                            }}>
                                <Edit size={16} />
                                Edit Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingTemplate && (
                <div className="modal-overlay" onClick={() => setEditingTemplate(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {TEMPLATE_ICONS[editingTemplate.template_key]} Edit {editingTemplate.name}
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setEditingTemplate(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                            <div style={{
                                background: 'rgba(197, 164, 86, 0.1)',
                                border: '1px solid var(--color-gold)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                marginBottom: 'var(--space-4)',
                                fontSize: 'var(--text-sm)',
                            }}>
                                <strong>💡 Tip:</strong> Use placeholders like <code>{`{{firstName}}`}</code>, <code>{`{{locationName}}`}</code>, <code>{`{{membershipType}}`}</code> for dynamic content. Use <code>**text**</code> for bold.
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subject Line</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingTemplate.subject}
                                    onChange={(e) => updateField('subject', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Greeting</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingTemplate.greeting}
                                    onChange={(e) => updateField('greeting', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Introduction</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={editingTemplate.body_intro}
                                    onChange={(e) => updateField('body_intro', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Details (appears in highlighted box)</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    value={editingTemplate.body_details || ''}
                                    onChange={(e) => updateField('body_details', e.target.value)}
                                    placeholder="Use emoji + **Label:** Value format"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Action/Instructions</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={editingTemplate.body_action || ''}
                                    onChange={(e) => updateField('body_action', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Closing Message</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={editingTemplate.body_closing}
                                    onChange={(e) => updateField('body_closing', e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Button Text</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editingTemplate.button_text || ''}
                                        onChange={(e) => updateField('button_text', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Button URL</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editingTemplate.button_url || ''}
                                        onChange={(e) => updateField('button_url', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Signature</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingTemplate.signature}
                                    onChange={(e) => updateField('signature', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editingTemplate.is_active}
                                        onChange={(e) => updateField('is_active', e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Template is active (emails will be sent)
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setPreviewTemplate(editingTemplate)}>
                                <Eye size={16} />
                                Preview
                            </button>
                            <button className="btn btn-ghost" onClick={() => setEditingTemplate(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
