'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Calendar, Phone, MapPin, Heart, AlertCircle,
    ChevronLeft, Check, Loader2, Camera, Shield
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

// Best Practice and Etiquette text
const BEST_PRACTICE_TEXT = `Best Practice and Etiquette

In attending Brazilian Jiu Jitsu classes, we aim to uphold the sunnah of our beloved Prophet Muhammad ﷺ and build a strong bond of brotherhood/sisterhood amongst us. We believe in the importance of intention and self-reflection (muhasaba), striving to be competitive but respectful to our opponents. To ensure a harmonious environment, we must adhere to the following etiquette:

Respect for the Professor and Coaches: Islam teaches us to respect our instructors, as they guide us in our practice. Listen attentively to their guidance and follow their instructions diligently.

Wearing a Gi: During the class, it is important to wear a gi (uniform) as this is a gi session. This shows respect for the tradition and uniformity among participants.

No Eating or Drinking on the Mats: To maintain cleanliness and hygiene, refrain from eating or drinking on the mats. This helps us to avoid any contamination or distractions during training.

No Shoes on Mats: Shoes are not allowed on the mats to keep them clean and safe for everyone. Remember to remove your shoes before stepping onto the training area.

Personal Hygiene: Being in close contact with others during training requires proper personal hygiene. Ensure that there are no unpleasant odors on your clothes or body to maintain a comfortable environment for everyone.

Clipped Finger and Toe Nails: For the safety of yourself and others, trim your finger and toe nails regularly to prevent accidental scratching or injury.

No Eye Gouging, Punching, or Kicking: We have a strict policy against any form of violence or aggressive behavior during training. Engaging in eye gouging, punching, or kicking is not tolerated. If an accident happens, quickly apologize and rectify the situation.

Parental Involvement and Side Coaching: Parents are kindly requested to refrain from entering the mats during kids' classes. Avoid giving instructions or coaching from the sidelines to maintain a focused learning environment.

Displaying Good Adab: Adab (good manners) is a fundamental aspect of our practice. Always exhibit respect, humility, and kindness towards fellow participants on and off the mats. Show appreciation and congratulate your training partners for their efforts.

By following these guidelines, we can create a respectful and inclusive atmosphere that aligns with the teachings of Islam and promotes the revival of our beloved Prophet Muhammad's Sunnah. May Allah bless our training and strengthen our bonds of brotherhood/sisterhood.`;

// Waiver text
const WAIVER_TEXT = `Disclaimer and Waiver of Liability for Brazilian Jiu-Jitsu Classes by Sport of Kings Seerat Un Nabi

As the participant or legal guardian of the participant(s), I hereby acknowledge and agree to the following terms and conditions for participation in the Brazilian Jiu-Jitsu (BJJ) classes:

Risk Acknowledgement: I understand that Brazilian Jiu-Jitsu is a contact sport that involves physical exertion and carries an inherent risk of injury. I acknowledge these risks, which may include, but are not limited to, bruises, strains, sprains, fractures, concussions, and other physical or mental harm.

Fitness and Health: I confirm that the participant(s) is/are physically fit, in good health, and do not have any condition or ailment that could be adversely affected by participation in these classes.

Rules and Supervision: I agree that the participant(s) will adhere to all class rules and instructions provided by instructors and staff members of Sport of Kings Seerat Un Nabi. I understand that supervision and guidance will be provided during all class sessions.

Waiver of Liability: I hereby release, waive, discharge, and covenant not to sue Sport of Kings Seerat Un Nabi, their officers, agents, employees, coaches, volunteers, or other representatives for any injury, loss, or damage to the participant(s) or my/our property arising out of or in connection with participation in these classes, whether caused by negligence or otherwise.

Medical Attention: In the event of an injury, I authorise the class staff to secure emergency medical care for the participant(s). I agree to be responsible for any medical or other charges in connection with the participant's participation in these classes.

Photography/Video Consent: I consent to the use of photographs and videos taken during the classes for promotional, educational, or training purposes by Sport of Kings Seerat Un Nabi.

Compliance with Policies: I agree to comply with all the policies, procedures, and regulations set by Sport of Kings Seerat Un Nabi during the classes.

Understanding of Terms: I have read this waiver and release of liability and fully understand its terms. I understand that I/we have given up substantial rights by agreeing to it and do so freely and voluntarily without any inducement.`;

interface Location {
    id: string;
    name: string;
}

interface MembershipType {
    id: string;
    name: string;
    price: number;
    location_id: string;
}

export default function AddChildPage() {
    const router = useRouter();
    const supabase = getSupabaseClient();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [parentMembership, setParentMembership] = useState<{ location_id: string } | null>(null);

    // Photo upload state
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Waiver acceptance state
    const [bestPracticeAccepted, setBestPracticeAccepted] = useState(false);
    const [waiverAccepted, setWaiverAccepted] = useState(false);
    const [showBestPractice, setShowBestPractice] = useState(false);
    const [showWaiver, setShowWaiver] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        address: '',
        city: '',
        postcode: '',
        emergencyName: '',
        emergencyPhone: '',
        medicalInfo: '',
        locationId: '',
        membershipTypeId: '',
        beltRank: 'white',
        stripes: 0,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get parent's membership to find their location
            const { data: membership } = await supabase
                .from('memberships')
                .select('location_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            setParentMembership(membership);

            // Get locations
            const { data: locs } = await supabase
                .from('locations')
                .select('id, name')
                .eq('is_active', true);
            setLocations(locs || []);

            // Get membership types for kids
            const { data: types } = await supabase
                .from('membership_types')
                .select('id, name, price, location_id')
                .eq('is_active', true);
            setMembershipTypes(types || []);

            // Pre-select parent's location if they have one
            if (membership?.location_id) {
                setFormData(prev => ({ ...prev, locationId: membership.location_id }));
            }

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setPageLoading(false);
        }
    };

    const updateField = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate basic fields
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (!formData.locationId || !formData.membershipTypeId) {
            setError('Please select a location and membership type');
            setLoading(false);
            return;
        }

        // Validate profile picture
        if (!profileImageFile) {
            setError('Please upload a profile picture for your child');
            setLoading(false);
            return;
        }

        // Validate waiver acceptance
        if (!bestPracticeAccepted || !waiverAccepted) {
            setError('Please accept both the Best Practice guidelines and the Liability Waiver');
            setLoading(false);
            return;
        }

        try {
            // Upload profile image first
            setUploadingImage(true);
            const fileExt = profileImageFile.name.split('.').pop();
            const fileName = `child_${Date.now()}.${fileExt}`;
            const filePath = `profile-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, profileImageFile);

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                throw new Error('Failed to upload profile picture. Please try again.');
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const profileImageUrl = urlData.publicUrl;
            setUploadingImage(false);

            const response = await fetch('/api/parent/add-child', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    profileImageUrl,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Show detailed error if available
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                throw new Error(errorMsg || 'Failed to add child');
            }

            // Check if payment is required
            if (data.requiresPayment) {
                // Redirect to Stripe checkout for paid memberships
                const stripeResponse = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        membershipTypeId: data.membershipType.id,
                        membershipTypeName: data.membershipType.name,
                        price: data.membershipType.price,
                        userId: data.child.user_id,
                        locationId: data.location.id,
                        locationName: data.location.name,
                        userEmail: '', // Will be handled by Stripe
                    }),
                });

                const stripeData = await stripeResponse.json();

                if (stripeData.url) {
                    // Redirect to Stripe Checkout
                    window.location.href = stripeData.url;
                    return;
                } else {
                    // Stripe not configured - show pending notice
                    setSuccess(true);
                    setTimeout(() => {
                        router.push('/dashboard?registered=true&pending=true');
                        router.refresh();
                    }, 2000);
                    return;
                }
            }

            // Free membership or Cheadle Masjid - show success
            setSuccess(true);
            setTimeout(() => {
                if (data.isCheadleMasjid) {
                    router.push('/dashboard?cheadle=true');
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            }, 2000);

        } catch (err) {
            console.error('Error adding child:', err);
            setError(err instanceof Error ? err.message : 'Failed to add child');
            setUploadingImage(false);
        } finally {
            setLoading(false);
        }
    };

    // Filter membership types for selected location
    const filteredMembershipTypes = membershipTypes.filter(
        mt => mt.location_id === formData.locationId
    );

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (success) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-12)',
                textAlign: 'center',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                }}>
                    <Check size={40} color="white" />
                </div>
                <h2 style={{ marginBottom: 'var(--space-2)' }}>Child Added Successfully!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Redirecting to dashboard...
                </p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '120px' }}>
            <div className="dashboard-header">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    <ChevronLeft size={18} />
                    Back
                </button>
                <h1 className="dashboard-title">Add a Child</h1>
                <p className="dashboard-subtitle">
                    Register your child for classes at Sport of Kings
                </p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="card-body">
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Child's Details */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <Heart size={20} color="var(--color-gold)" />
                            Child&apos;s Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">First Name*</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={(e) => updateField('firstName', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name*</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={(e) => updateField('lastName', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Date of Birth*</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.dateOfBirth}
                                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Gender*</label>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-3)',
                                    background: formData.gender === 'male' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                    border: formData.gender === 'male' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    flex: 1,
                                }}>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={(e) => updateField('gender', e.target.value)}
                                    />
                                    Male
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-3)',
                                    background: formData.gender === 'female' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                    border: formData.gender === 'female' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    flex: 1,
                                }}>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={(e) => updateField('gender', e.target.value)}
                                    />
                                    Female
                                </label>
                            </div>
                        </div>

                        {/* Belt Selection (Optional - for existing practitioners) */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-4)',
                        }}>
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <label className="form-label" style={{ marginBottom: 'var(--space-1)' }}>
                                    Current Belt Rank <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Optional)</span>
                                </label>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    margin: 0,
                                }}>
                                    Already training in BJJ? Select their current belt. New to BJJ? Leave as White Belt.
                                </p>
                            </div>

                            {/* Belt Color Selection - Kids Belt Scheme */}
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                                {['white', 'grey-white', 'grey', 'grey-black', 'yellow-white', 'yellow', 'yellow-black', 'orange-white', 'orange', 'orange-black', 'green-white', 'green', 'green-black'].map((belt) => (
                                    <button
                                        key={belt}
                                        type="button"
                                        onClick={() => updateField('beltRank', belt)}
                                        style={{
                                            padding: 'var(--space-2) var(--space-3)',
                                            borderRadius: 'var(--radius-md)',
                                            border: formData.beltRank === belt ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                            background: formData.beltRank === belt ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize',
                                            fontWeight: formData.beltRank === belt ? '600' : '400',
                                            fontSize: 'var(--text-sm)',
                                        }}
                                    >
                                        {belt.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Stripes Selection */}
                            {formData.beltRank !== 'white' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Stripes (White 1-4, Red 5-8, Grey 9-12)
                                    </label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => {
                                            // Color code for kids: 1-4 white, 5-8 red, 9-12 grey
                                            let stripeColor = 'inherit';
                                            if (s > 0) {
                                                if (s <= 4) stripeColor = 'var(--text-primary)';
                                                else if (s <= 8) stripeColor = '#DC2626';
                                                else stripeColor = '#6B7280';
                                            }
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => updateField('stripes', s)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: formData.stripes === s ? '2px solid var(--color-gold)' : '1px solid var(--border-light)',
                                                        background: formData.stripes === s ? 'rgba(197, 164, 86, 0.15)' : 'var(--bg-primary)',
                                                        cursor: 'pointer',
                                                        fontWeight: formData.stripes === s ? '600' : '400',
                                                        color: formData.stripes !== s ? stripeColor : undefined,
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location & Membership */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginTop: 'var(--space-6)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <MapPin size={20} color="var(--color-gold)" />
                            Location & Membership
                        </h3>

                        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label">Location*</label>
                            <select
                                className="form-input"
                                value={formData.locationId}
                                onChange={(e) => {
                                    updateField('locationId', e.target.value);
                                    updateField('membershipTypeId', ''); // Reset membership type
                                }}
                                required
                            >
                                <option value="">Select a location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.locationId && (
                            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">Membership Type*</label>
                                <select
                                    className="form-input"
                                    value={formData.membershipTypeId}
                                    onChange={(e) => updateField('membershipTypeId', e.target.value)}
                                    required
                                >
                                    <option value="">Select membership type</option>
                                    {filteredMembershipTypes.map(mt => (
                                        <option key={mt.id} value={mt.id}>
                                            {mt.name} {mt.price > 0 ? `- £${mt.price}` : '(Free)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Emergency Contact */}
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginTop: 'var(--space-6)',
                            marginBottom: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}>
                            <AlertCircle size={20} color="var(--color-red)" />
                            Emergency Contact
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Contact Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.emergencyName}
                                    onChange={(e) => updateField('emergencyName', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Phone</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.emergencyPhone}
                                    onChange={(e) => updateField('emergencyPhone', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Profile Picture Upload */}
                        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                            <label className="form-label">Profile Picture*</label>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                                Upload a clear photo of the child for identification
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-6)',
                                    border: profileImagePreview ? '2px solid var(--color-gold)' : '2px dashed var(--border-light)',
                                    borderRadius: 'var(--radius-lg)',
                                    background: profileImagePreview ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={() => document.getElementById('child-profile-image-input')?.click()}
                            >
                                {profileImagePreview ? (
                                    <>
                                        <div style={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            border: '3px solid var(--color-gold)',
                                        }}>
                                            <img
                                                src={profileImagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                            Click to change photo
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            background: 'var(--bg-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '2px solid var(--border-light)',
                                        }}>
                                            <Camera size={32} color="var(--text-tertiary)" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>Upload Profile Picture</span>
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                                            Click to select an image (max 5MB)
                                        </span>
                                    </>
                                )}
                            </div>
                            <input
                                id="child-profile-image-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (!file.type.startsWith('image/')) {
                                        setError('Please select an image file');
                                        return;
                                    }
                                    if (file.size > 5 * 1024 * 1024) {
                                        setError('Image must be less than 5MB');
                                        return;
                                    }
                                    setProfileImageFile(file);
                                    setProfileImagePreview(URL.createObjectURL(file));
                                    setError('');
                                }}
                            />
                        </div>

                        {/* Medical Info */}
                        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                            <label className="form-label">Medical Information (optional)</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Any allergies, conditions, or medical information..."
                                value={formData.medicalInfo}
                                onChange={(e) => updateField('medicalInfo', e.target.value)}
                            />
                        </div>

                        {/* Best Practice Acceptance */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-4)',
                            border: bestPracticeAccepted ? '2px solid var(--color-green)' : '2px solid var(--border-light)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <Heart size={18} color="var(--color-gold)" />
                                    Best Practice & Etiquette
                                </h4>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowBestPractice(!showBestPractice)}
                                >
                                    {showBestPractice ? 'Hide' : 'Read'}
                                </button>
                            </div>

                            {showBestPractice && (
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: 'var(--bg-primary)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-3)',
                                    fontSize: 'var(--text-sm)',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {BEST_PRACTICE_TEXT}
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={bestPracticeAccepted}
                                    onChange={(e) => setBestPracticeAccepted(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>I have read and agree to follow the Best Practice guidelines</span>
                            </label>
                        </div>

                        {/* Waiver Acceptance */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-6)',
                            border: waiverAccepted ? '2px solid var(--color-green)' : '2px solid var(--border-light)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <Shield size={18} color="var(--color-red)" />
                                    Disclaimer & Liability Waiver
                                </h4>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setShowWaiver(!showWaiver)}
                                >
                                    {showWaiver ? 'Hide' : 'Read'}
                                </button>
                            </div>

                            {showWaiver && (
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: 'var(--bg-primary)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-3)',
                                    fontSize: 'var(--text-sm)',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {WAIVER_TEXT}
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={waiverAccepted}
                                    onChange={(e) => setWaiverAccepted(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>I accept the Disclaimer and Waiver of Liability</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading || uploadingImage}
                        >
                            {loading || uploadingImage ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    {uploadingImage ? 'Uploading Photo...' : 'Adding Child...'}
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Add Child
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
