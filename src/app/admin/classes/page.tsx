'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, MapPin, User, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Class, Location, Instructor } from '@/lib/types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TYPES = [
    { value: 'bjj', label: 'Brazilian Jiu-Jitsu' },
    { value: 'kendo', label: 'Kendo' },
    { value: 'strength', label: 'Strength & Conditioning' },
    { value: 'archery', label: 'Archery' },
    { value: 'other', label: 'Other' },
];

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [membershipTypes, setMembershipTypes] = useState<{ id: string; name: string; location_id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editClass, setEditClass] = useState<Class | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const supabase = getSupabaseClient();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        class_type: 'bjj',
        location_id: '',
        instructor_id: '',
        day_of_week: 0,
        start_time: '10:00',
        end_time: '11:30',
        max_capacity: 30,
        is_recurring: true,
        membership_type_ids: [] as string[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [classesRes, locationsRes, instructorsRes, membershipTypesRes] = await Promise.all([
            supabase.from('classes').select('*, location:locations(*), instructor:instructors(*, profile:profiles(*)), class_membership_types(membership_type_id)').order('day_of_week'),
            supabase.from('locations').select('*').eq('is_active', true),
            supabase.from('instructors').select('*, profile:profiles(*)').eq('is_active', true),
            supabase.from('membership_types').select('id, name, location_id').eq('is_active', true),
        ]);

        setClasses(classesRes.data || []);
        setLocations(locationsRes.data || []);
        setInstructors(instructorsRes.data || []);
        setMembershipTypes(membershipTypesRes.data || []);
        setLoading(false);
    };

    const openModal = (classItem?: Class) => {
        if (classItem) {
            setEditClass(classItem);
            // Extract membership type IDs from junction table data
            const classMembershipTypes = (classItem as any).class_membership_types || [];
            const typeIds = classMembershipTypes.map((cmt: { membership_type_id: string }) => cmt.membership_type_id);

            setFormData({
                name: classItem.name,
                description: classItem.description || '',
                class_type: classItem.class_type,
                location_id: classItem.location_id,
                instructor_id: classItem.instructor_id || '',
                day_of_week: classItem.day_of_week,
                start_time: classItem.start_time,
                end_time: classItem.end_time,
                max_capacity: classItem.max_capacity || 30,
                is_recurring: classItem.is_recurring,
                membership_type_ids: typeIds,
            });
        } else {
            setEditClass(null);
            setFormData({
                name: '',
                description: '',
                class_type: 'bjj',
                location_id: locations[0]?.id || '',
                instructor_id: '',
                day_of_week: 6,
                start_time: '10:00',
                end_time: '11:30',
                max_capacity: 30,
                is_recurring: true,
                membership_type_ids: [],
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.name || !formData.location_id) {
            setError('Please fill in required fields');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description || null,
                class_type: formData.class_type,
                location_id: formData.location_id,
                instructor_id: formData.instructor_id || null,
                day_of_week: formData.day_of_week,
                start_time: formData.start_time,
                end_time: formData.end_time,
                max_capacity: formData.max_capacity,
                is_recurring: formData.is_recurring,
            };

            let classId: string;

            if (editClass) {
                const { error } = await supabase.from('classes').update(payload).eq('id', editClass.id);
                if (error) throw error;
                classId = editClass.id;
                setSuccess('Class updated successfully');
            } else {
                const { data, error } = await supabase.from('classes').insert(payload).select('id').single();
                if (error) throw error;
                classId = data.id;
                setSuccess('Class created successfully');
            }

            // Update membership type associations in junction table
            // First, delete existing associations for this class
            await supabase.from('class_membership_types').delete().eq('class_id', classId);

            // Then, insert new associations
            if (formData.membership_type_ids.length > 0) {
                const associations = formData.membership_type_ids.map(typeId => ({
                    class_id: classId,
                    membership_type_id: typeId,
                }));
                const { error: assocError } = await supabase.from('class_membership_types').insert(associations);
                if (assocError) throw assocError;
            }

            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        }
    };

    const toggleClassStatus = async (classItem: Class) => {
        await supabase.from('classes').update({ is_active: !classItem.is_active }).eq('id', classItem.id);
        fetchData();
    };

    // Group classes by day
    const classesByDay = classes.reduce((acc, cls) => {
        const day = cls.day_of_week;
        if (!acc[day]) acc[day] = [];
        acc[day].push(cls);
        return acc;
    }, {} as Record<number, Class[]>);

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard-title">Classes</h1>
                    <p className="dashboard-subtitle">Manage class schedules and assign instructors</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Class
                </button>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner spinner-lg" />
                </div>
            ) : classes.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Calendar size={48} color="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>No Classes Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Create your first class schedule.
                    </p>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        Add Class
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {DAYS_OF_WEEK.map((day, index) => {
                        const dayClasses = classesByDay[index];
                        if (!dayClasses || dayClasses.length === 0) return null;

                        return (
                            <div key={day}>
                                <h3 style={{
                                    fontSize: 'var(--text-lg)',
                                    color: 'var(--color-gold)',
                                    marginBottom: 'var(--space-4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                }}>
                                    <Calendar size={20} />
                                    {day}
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: 'var(--space-4)',
                                }}>
                                    {dayClasses.map((cls) => (
                                        <div key={cls.id} className="card" style={{ opacity: cls.is_active ? 1 : 0.6 }}>
                                            <div className="card-body">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 var(--space-1)' }}>{cls.name}</h4>
                                                        <span className={`badge badge-${cls.class_type === 'bjj' ? 'gold' : 'gray'}`}>
                                                            {CLASS_TYPES.find(t => t.value === cls.class_type)?.label}
                                                        </span>
                                                        {!cls.is_active && <span className="badge badge-gray" style={{ marginLeft: 'var(--space-2)' }}>Inactive</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(cls)}>
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => toggleClassStatus(cls)}>
                                                            {cls.is_active ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <Clock size={14} />
                                                        {cls.start_time} - {cls.end_time}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                        <MapPin size={14} />
                                                        {(cls.location as Location)?.name || 'No location'}
                                                    </div>
                                                    {cls.instructor && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                            <User size={14} />
                                                            {(cls.instructor as unknown as { profile: { first_name: string; last_name: string } })?.profile?.first_name} {(cls.instructor as unknown as { profile: { first_name: string; last_name: string } })?.profile?.last_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editClass ? 'Edit Class' : 'Add New Class'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}><AlertCircle size={18} />{error}</div>}

                                <div className="form-group">
                                    <label className="form-label">Class Name*</label>
                                    <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Class Type*</label>
                                        <select className="form-input" value={formData.class_type} onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}>
                                            {CLASS_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Day*</label>
                                        <select className="form-input" value={formData.day_of_week} onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}>
                                            {DAYS_OF_WEEK.map((day, i) => <option key={day} value={i}>{day}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location*</label>
                                    <select className="form-input" value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value, membership_type_ids: [] })} required>
                                        <option value="">Select location</option>
                                        {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Membership Tiers (optional)</label>
                                    <div style={{
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-3)',
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                        background: 'var(--bg-primary)',
                                    }}>
                                        {membershipTypes
                                            .filter(mt => mt.location_id === formData.location_id)
                                            .length === 0 ? (
                                            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                                No membership tiers for this location
                                            </p>
                                        ) : (
                                            membershipTypes
                                                .filter(mt => mt.location_id === formData.location_id)
                                                .map((mt) => (
                                                    <label
                                                        key={mt.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--space-2)',
                                                            padding: 'var(--space-2)',
                                                            cursor: 'pointer',
                                                            borderRadius: 'var(--radius-sm)',
                                                        }}
                                                        className="hover-highlight"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.membership_type_ids.includes(mt.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        membership_type_ids: [...formData.membership_type_ids, mt.id]
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        membership_type_ids: formData.membership_type_ids.filter(id => id !== mt.id)
                                                                    });
                                                                }
                                                            }}
                                                            style={{ width: '16px', height: '16px' }}
                                                        />
                                                        <span style={{ fontSize: 'var(--text-sm)' }}>{mt.name}</span>
                                                    </label>
                                                ))
                                        )
                                        }
                                    </div>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                                        Leave all unchecked to make class available to all members at this location
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Instructor</label>
                                    <select className="form-input" value={formData.instructor_id} onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}>
                                        <option value="">Select instructor</option>
                                        {instructors.map((inst) => (
                                            <option key={inst.id} value={inst.id}>
                                                {(inst as unknown as { profile: { first_name: string; last_name: string } })?.profile?.first_name} {(inst as unknown as { profile: { first_name: string; last_name: string } })?.profile?.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Time*</label>
                                        <input type="time" className="form-input" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Time*</label>
                                        <input type="time" className="form-input" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Max Capacity</label>
                                    <input type="number" className="form-input" value={formData.max_capacity} onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })} min="1" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-input" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editClass ? 'Save Changes' : 'Create Class'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
