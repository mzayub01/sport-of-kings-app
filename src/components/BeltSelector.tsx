'use client';

import { useState } from 'react';
import BJJBelt from './BJJBelt';

type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

interface BeltSelectorProps {
    currentBelt: BeltRank;
    currentStripes: number;
    onSave: (belt: BeltRank, stripes: number) => Promise<void>;
    disabled?: boolean;
}

const BELTS: BeltRank[] = ['white', 'blue', 'purple', 'brown', 'black'];

export default function BeltSelector({ currentBelt, currentStripes, onSave, disabled }: BeltSelectorProps) {
    const [belt, setBelt] = useState<BeltRank>(currentBelt);
    const [stripes, setStripes] = useState(currentStripes);
    const [saving, setSaving] = useState(false);
    const [showEditor, setShowEditor] = useState(false);

    const hasChanges = belt !== currentBelt || stripes !== currentStripes;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(belt, stripes);
            setShowEditor(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setBelt(currentBelt);
        setStripes(currentStripes);
        setShowEditor(false);
    };

    if (!showEditor) {
        return (
            <div
                onClick={() => !disabled && setShowEditor(true)}
                style={{
                    cursor: disabled ? 'default' : 'pointer',
                    display: 'inline-block',
                }}
                title={disabled ? undefined : 'Click to change belt'}
            >
                <BJJBelt belt={currentBelt} stripes={currentStripes} size="md" showLabel />
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: 'var(--space-4)' }}>
            <h4 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)' }}>Update Belt Rank</h4>

            {/* Belt Preview */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <BJJBelt belt={belt} stripes={stripes} size="lg" showLabel />
            </div>

            {/* Belt Selection */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Belt Color</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
                <label className="form-label">Stripes (0-4)</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={handleCancel} disabled={saving}>
                    Cancel
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
