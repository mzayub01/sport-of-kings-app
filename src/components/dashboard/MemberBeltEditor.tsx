'use client';

import { useState } from 'react';
import BJJBelt from '@/components/BJJBelt';
import { ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';

type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

interface MemberBeltEditorProps {
    initialBelt: BeltRank;
    initialStripes: number;
}

const BELTS: BeltRank[] = ['white', 'blue', 'purple', 'brown', 'black'];

export default function MemberBeltEditor({ initialBelt, initialStripes }: MemberBeltEditorProps) {
    const [belt, setBelt] = useState<BeltRank>(initialBelt);
    const [stripes, setStripes] = useState(initialStripes);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const hasChanges = belt !== initialBelt || stripes !== initialStripes;

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/profile/belt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ belt, stripes }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Belt updated successfully!' });
                setIsEditing(false);
                // Update initial values
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to save changes' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-card" style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
            background: 'linear-gradient(135deg, var(--bg-glass) 0%, rgba(197, 164, 86, 0.1) 100%)',
        }}>
            {/* Belt Display */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <BJJBelt belt={belt} stripes={stripes} size="lg" />
            </div>

            <h2 style={{
                marginBottom: 'var(--space-2)',
                textTransform: 'capitalize',
                fontSize: 'var(--text-3xl)',
            }}>
                {belt} Belt
                {stripes > 0 && <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)' }}> • {stripes} stripe{stripes > 1 ? 's' : ''}</span>}
            </h2>

            {message && (
                <div style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-4)',
                    background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
                }}>
                    {message.text}
                </div>
            )}

            {!isEditing ? (
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditing(true)}
                    style={{ marginTop: 'var(--space-2)' }}
                >
                    <ChevronDown size={16} />
                    Update Belt
                </button>
            ) : (
                <div style={{ marginTop: 'var(--space-4)' }}>
                    {/* Belt Selection */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Belt Color
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {BELTS.map((b) => (
                                <button
                                    key={b}
                                    onClick={() => setBelt(b)}
                                    style={{
                                        padding: 'var(--space-2) var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                        border: belt === b ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                        background: belt === b ? 'var(--bg-secondary)' : 'transparent',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        fontWeight: belt === b ? '600' : '400',
                                    }}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stripes Selection */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Stripes (0-4)
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                            {[0, 1, 2, 3, 4].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStripes(s)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-md)',
                                        border: stripes === s ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                        background: stripes === s ? 'var(--bg-secondary)' : 'transparent',
                                        cursor: 'pointer',
                                        fontWeight: stripes === s ? '600' : '400',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setBelt(initialBelt);
                                setStripes(initialStripes);
                                setIsEditing(false);
                            }}
                            disabled={saving}
                        >
                            <ChevronUp size={16} />
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="spinner" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Save Belt
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
