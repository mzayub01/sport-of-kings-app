'use client';

import { useState } from 'react';
import { X, Star, Award, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import BJJBelt from '@/components/BJJBelt';

interface MemberForGrading {
    user_id: string;
    first_name: string;
    last_name: string;
    belt_rank: string;
    stripes: number;
    is_child: boolean;
    is_kids_program: boolean;
}

interface GradingModalProps {
    member: MemberForGrading;
    classId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ADULT_BELTS = [
    { value: 'white', label: 'White' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'brown', label: 'Brown' },
    { value: 'black', label: 'Black' },
];

const KIDS_BELTS = [
    { value: 'white', label: 'White' },
    { value: 'grey-white', label: 'Grey/White' },
    { value: 'grey', label: 'Grey' },
    { value: 'grey-black', label: 'Grey/Black' },
    { value: 'yellow-white', label: 'Yellow/White' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'yellow-black', label: 'Yellow/Black' },
    { value: 'orange-white', label: 'Orange/White' },
    { value: 'orange', label: 'Orange' },
    { value: 'orange-black', label: 'Orange/Black' },
    { value: 'green-white', label: 'Green/White' },
    { value: 'green', label: 'Green' },
    { value: 'green-black', label: 'Green/Black' },
];

export default function GradingModal({ member, classId, onClose, onSuccess }: GradingModalProps) {
    const [newBelt, setNewBelt] = useState(member.belt_rank);
    const [newStripes, setNewStripes] = useState(member.stripes);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const belts = member.is_kids_program ? KIDS_BELTS : ADULT_BELTS;

    const handleSubmit = async () => {
        // Validate that something changed
        if (newBelt === member.belt_rank && newStripes === member.stripes) {
            setError('Please select a new belt or stripe count');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/grading/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: member.user_id,
                    classId,
                    previousBelt: member.belt_rank,
                    previousStripes: member.stripes,
                    newBelt,
                    newStripes,
                    comments: comments.trim() || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setError(data.error || 'Failed to save promotion');
            }
        } catch {
            setError('Failed to save promotion');
        } finally {
            setLoading(false);
        }
    };

    const isPromotion = () => {
        const currentBeltIndex = belts.findIndex(b => b.value === member.belt_rank);
        const newBeltIndex = belts.findIndex(b => b.value === newBelt);

        if (newBeltIndex > currentBeltIndex) return true;
        if (newBeltIndex === currentBeltIndex && newStripes > member.stripes) return true;
        return false;
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
                        <Award size={24} color="var(--color-gold)" />
                        Grade Member
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                            <CheckCircle size={64} color="var(--color-green)" style={{ marginBottom: 'var(--space-4)' }} />
                            <h3>Promotion Saved!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {member.first_name} has been promoted to {newBelt} belt with {newStripes} stripe{newStripes !== 1 ? 's' : ''}
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
                                            {member.is_kids_program ? 'Kids Program' : 'Adult Program'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Belt */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">Current Rank</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <BJJBelt
                                        belt={member.belt_rank as 'white' | 'blue' | 'purple' | 'brown' | 'black'}
                                        stripes={member.stripes}
                                        size="md"
                                    />
                                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                                        {member.belt_rank} Belt • {member.stripes} stripe{member.stripes !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* New Belt Selection */}
                            <div className="form-group">
                                <label className="form-label">
                                    <Star size={14} style={{ marginRight: '4px' }} />
                                    New Belt
                                </label>
                                <select
                                    value={newBelt}
                                    onChange={(e) => setNewBelt(e.target.value)}
                                    className="form-select"
                                >
                                    {belts.map(belt => (
                                        <option key={belt.value} value={belt.value}>
                                            {belt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Stripes Selection */}
                            <div className="form-group">
                                <label className="form-label">
                                    Stripes {member.is_kids_program && <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: 'var(--text-xs)' }}>(White 1-4, Red 5-8, Grey 9-12)</span>}
                                </label>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    {(member.is_kids_program
                                        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                        : [0, 1, 2, 3, 4]
                                    ).map(num => {
                                        // Color code for kids: 1-4 white, 5-8 red, 9-12 grey
                                        let stripeColor = 'inherit';
                                        if (member.is_kids_program && num > 0) {
                                            if (num <= 4) stripeColor = 'var(--text-primary)';
                                            else if (num <= 8) stripeColor = '#DC2626';
                                            else stripeColor = '#6B7280';
                                        }
                                        return (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setNewStripes(num)}
                                                className={`btn ${newStripes === num ? 'btn-primary' : 'btn-ghost'}`}
                                                style={{
                                                    flex: member.is_kids_program ? 'none' : 1,
                                                    width: member.is_kids_program ? '36px' : 'auto',
                                                    padding: 'var(--space-2)',
                                                    minWidth: 'auto',
                                                    color: newStripes !== num ? stripeColor : undefined,
                                                }}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">New Rank Preview</label>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3)',
                                    background: isPromotion() ? 'rgba(45, 125, 70, 0.1)' : 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: isPromotion() ? '2px solid var(--color-green)' : 'none',
                                }}>
                                    <BJJBelt
                                        belt={newBelt as 'white' | 'blue' | 'purple' | 'brown' | 'black'}
                                        stripes={newStripes}
                                        size="md"
                                    />
                                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                                        {newBelt} Belt • {newStripes} stripe{newStripes !== 1 ? 's' : ''}
                                    </span>
                                    {isPromotion() && (
                                        <span className="badge badge-green">Promotion!</span>
                                    )}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="form-group">
                                <label className="form-label">
                                    <MessageSquare size={14} style={{ marginRight: '4px' }} />
                                    Comments (Optional)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Add notes about this promotion..."
                                    className="form-input"
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
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
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    Confirm Grade
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
