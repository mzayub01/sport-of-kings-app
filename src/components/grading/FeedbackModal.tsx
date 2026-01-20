'use client';

import { useState } from 'react';
import { X, MessageSquare, Loader2, CheckCircle, Send } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface MemberForFeedback {
    user_id: string;
    first_name: string;
    last_name: string;
}

interface FeedbackModalProps {
    member: MemberForFeedback;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FeedbackModal({ member, onClose, onSuccess }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const supabase = getSupabaseClient();

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            setError('Please enter some feedback');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Not authenticated');
                return;
            }

            const { error: insertError } = await supabase
                .from('professor_feedback')
                .insert({
                    user_id: member.user_id,
                    professor_id: user.id,
                    feedback: feedback.trim(),
                });

            if (insertError) {
                throw insertError;
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            console.error('Error saving feedback:', err);
            setError(err.message || 'Failed to save feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px', width: '100%' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <MessageSquare size={24} color="var(--color-gold)" />
                        Send Feedback
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <CheckCircle size={64} color="var(--color-green)" style={{ marginBottom: 'var(--space-4)' }} />
                            <h3>Feedback Sent!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {member.first_name} will see your feedback in their progress page.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Member Info */}
                            <div className="glass-card" style={{ marginBottom: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: 'var(--color-gold)',
                                        borderRadius: 'var(--radius-full)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: 'var(--text-lg)',
                                    }}>
                                        {member.first_name[0]}{member.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{member.first_name} {member.last_name}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            Send feedback or encouragement
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Input */}
                            <div className="form-group">
                                <label className="form-label">
                                    <MessageSquare size={14} style={{ marginRight: '4px' }} />
                                    Your Feedback
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share feedback, encouragement, or notes for this member..."
                                    className="form-input"
                                    rows={5}
                                    style={{ resize: 'vertical' }}
                                    autoFocus
                                />
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 'var(--space-1) 0 0' }}>
                                    This feedback will be visible to the member in their Belt Progress page.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="modal-footer">
                        <button onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !feedback.trim()}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Send Feedback
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: var(--space-4);
                }
                
                .modal-content {
                    background: var(--bg-primary);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-4) var(--space-5);
                    border-bottom: 1px solid var(--border-light);
                }
                
                .modal-body {
                    padding: var(--space-5);
                }
                
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-3);
                    padding: var(--space-4) var(--space-5);
                    border-top: 1px solid var(--border-light);
                }
            `}</style>
        </div>
    );
}
