'use client';

import { useState, useEffect } from 'react';
import { Award, Users, MapPin, Search, Loader2, ChevronRight, Star, Calendar } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import BJJBelt from '@/components/BJJBelt';
import GradingModal from '@/components/grading/GradingModal';

interface ClassOption {
    id: string;
    name: string;
    location_id: string;
    location_name: string;
}

interface MemberForGrading {
    user_id: string;
    first_name: string;
    last_name: string;
    belt_rank: string;
    stripes: number;
    is_child: boolean;
    is_kids_program: boolean;
    last_promotion_date?: string;
}

interface Location {
    id: string;
    name: string;
}

const ADULT_BELTS = ['white', 'blue', 'purple', 'brown', 'black'];
const KIDS_BELTS = ['white', 'grey', 'grey-white', 'yellow', 'yellow-white', 'orange', 'orange-white', 'green', 'green-white'];

export default function ProfessorGradingPage() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [members, setMembers] = useState<MemberForGrading[]>([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [gradingMember, setGradingMember] = useState<MemberForGrading | null>(null);
    const [showGradingModal, setShowGradingModal] = useState(false);

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchAccessibleClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchMembersForClass();
        } else {
            setMembers([]);
        }
    }, [selectedClass]);

    const fetchAccessibleClasses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get professor's role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            let classesData;

            if (profile?.role === 'admin') {
                // Admins can access all classes
                const { data } = await supabase
                    .from('classes')
                    .select('id, name, location_id, location:locations(id, name)')
                    .eq('is_active', true)
                    .order('name');
                classesData = data;
            } else {
                // Professors can only access assigned classes
                const { data: accessData } = await supabase
                    .from('professor_class_access')
                    .select('class_id, class:classes(id, name, location_id, location:locations(id, name))')
                    .eq('professor_user_id', user.id);

                classesData = accessData?.map(a => a.class).filter(Boolean);
            }

            if (classesData) {
                const formattedClasses: ClassOption[] = classesData.map((c: {
                    id: string;
                    name: string;
                    location_id: string;
                    location: { id: string; name: string } | null
                }) => ({
                    id: c.id,
                    name: c.name,
                    location_id: c.location_id,
                    location_name: c.location?.name || '',
                }));

                setClasses(formattedClasses);

                // Extract unique locations
                const uniqueLocations = new Map<string, Location>();
                formattedClasses.forEach(c => {
                    if (c.location_id && c.location_name) {
                        uniqueLocations.set(c.location_id, { id: c.location_id, name: c.location_name });
                    }
                });
                setLocations(Array.from(uniqueLocations.values()));
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembersForClass = async () => {
        setMembersLoading(true);
        try {
            const classInfo = classes.find(c => c.id === selectedClass);
            if (!classInfo) return;

            // Get the class's membership_type_id
            const { data: classData } = await supabase
                .from('classes')
                .select('membership_type_id')
                .eq('id', selectedClass)
                .single();

            // Build memberships query - filter by location AND membership type
            let query = supabase
                .from('memberships')
                .select('user_id, membership_type_id, profile:profiles(user_id, first_name, last_name, belt_rank, stripes, is_child, is_kids_program)')
                .eq('location_id', classInfo.location_id)
                .eq('status', 'active');

            // Only show members with the matching membership type for this class
            if (classData?.membership_type_id) {
                query = query.eq('membership_type_id', classData.membership_type_id);
            }

            const { data: memberships, error: membershipsError } = await query;

            console.log('Memberships query result:', {
                memberships,
                membershipsError,
                location_id: classInfo.location_id,
                membership_type_id: classData?.membership_type_id
            });

            if (memberships && memberships.length > 0) {
                // Get last promotion dates for these members
                const userIds = memberships.map(m => m.user_id);
                const { data: promotions } = await supabase
                    .from('promotions')
                    .select('user_id, promotion_date')
                    .in('user_id', userIds)
                    .order('promotion_date', { ascending: false });

                // Create map of user_id to last promotion date
                const lastPromotionMap = new Map<string, string>();
                promotions?.forEach(p => {
                    if (!lastPromotionMap.has(p.user_id)) {
                        lastPromotionMap.set(p.user_id, p.promotion_date);
                    }
                });

                const formattedMembers: MemberForGrading[] = memberships
                    .filter((m: { profile: unknown }) => m.profile)
                    .map((m: {
                        user_id: string;
                        profile: {
                            user_id: string;
                            first_name: string;
                            last_name: string;
                            belt_rank: string;
                            stripes: number;
                            is_child: boolean;
                            is_kids_program: boolean;
                        }
                    }) => ({
                        user_id: m.profile.user_id,
                        first_name: m.profile.first_name,
                        last_name: m.profile.last_name,
                        belt_rank: m.profile.belt_rank || 'white',
                        stripes: m.profile.stripes || 0,
                        is_child: m.profile.is_child,
                        is_kids_program: m.profile.is_kids_program || false,
                        last_promotion_date: lastPromotionMap.get(m.profile.user_id),
                    }))
                    .sort((a: MemberForGrading, b: MemberForGrading) =>
                        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
                    );

                setMembers(formattedMembers);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleGradeClick = (member: MemberForGrading) => {
        setGradingMember(member);
        setShowGradingModal(true);
    };

    const handleGradingComplete = () => {
        setShowGradingModal(false);
        setGradingMember(null);
        fetchMembersForClass(); // Refresh the list
    };

    const filteredClasses = selectedLocation
        ? classes.filter(c => c.location_id === selectedLocation)
        : classes;

    const filteredMembers = searchQuery
        ? members.filter(m =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : members;

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
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
                <h1 className="dashboard-title">Grading Dashboard</h1>
                <p className="dashboard-subtitle">Promote members to new belt ranks</p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        {/* Location Filter */}
                        <div className="form-group">
                            <label className="form-label">
                                <MapPin size={14} style={{ marginRight: '4px' }} />
                                Location
                            </label>
                            <select
                                value={selectedLocation}
                                onChange={(e) => {
                                    setSelectedLocation(e.target.value);
                                    setSelectedClass('');
                                }}
                                className="form-select"
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Class Filter */}
                        <div className="form-group">
                            <label className="form-label">
                                <Award size={14} style={{ marginRight: '4px' }} />
                                Class
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Select a class</option>
                                {filteredClasses.map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.location_name && `(${cls.location_name})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="form-group">
                            <label className="form-label">
                                <Search size={14} style={{ marginRight: '4px' }} />
                                Search
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search members..."
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            {!selectedClass ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <Award size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-4)' }} />
                    <h3>Select a Class</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Choose a location and class to view members for grading
                    </p>
                </div>
            ) : membersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                    <Loader2 size={32} className="spinner" />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <Users size={48} color="var(--text-tertiary)" style={{ marginBottom: 'var(--space-4)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery ? 'No members match your search' : 'No members enrolled in this class'}
                    </p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Users size={20} />
                            Members ({filteredMembers.length})
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {filteredMembers.map((member) => (
                            <div
                                key={member.user_id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 'var(--space-4)',
                                    borderBottom: '1px solid var(--border-light)',
                                    gap: 'var(--space-4)',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* Member Info */}
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                        {member.first_name} {member.last_name}
                                        {member.is_child && (
                                            <span className="badge badge-gold" style={{ marginLeft: 'var(--space-2)', fontSize: '10px' }}>
                                                {member.is_kids_program ? 'Kids Program' : 'Child'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                        <Calendar size={12} />
                                        Last graded: {formatDate(member.last_promotion_date)}
                                    </div>
                                </div>

                                {/* Current Belt */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <BJJBelt
                                        belt={member.belt_rank as 'white' | 'blue' | 'purple' | 'brown' | 'black'}
                                        stripes={member.stripes}
                                        size="sm"
                                    />
                                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                        <div style={{ textTransform: 'capitalize', fontWeight: '500', fontSize: 'var(--text-sm)' }}>
                                            {member.belt_rank}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                            {member.stripes} stripe{member.stripes !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Grade Button */}
                                <button
                                    onClick={() => handleGradeClick(member)}
                                    className="btn btn-primary btn-sm"
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                                >
                                    <Star size={16} />
                                    Grade
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {showGradingModal && gradingMember && (
                <GradingModal
                    member={gradingMember}
                    classId={selectedClass}
                    onClose={() => {
                        setShowGradingModal(false);
                        setGradingMember(null);
                    }}
                    onSuccess={handleGradingComplete}
                />
            )}
        </div>
    );
}
