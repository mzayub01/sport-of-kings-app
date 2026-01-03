'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Eye, EyeOff, User, Mail, Phone, MapPin, Calendar,
    AlertCircle, Shield, Heart, ChevronRight, ChevronLeft,
    Check, Users, CreditCard, Camera, Loader2, Search
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
    settings: { allow_waitlist?: boolean } | null;
}

interface MembershipType {
    id: string;
    name: string;
    price: number;
    description: string | null;
}

interface CapacityConfig {
    location_id: string;
    membership_type_id: string;
    capacity: number | null;
    current_count?: number;
}

interface FormData {
    // Membership Type
    membershipType: 'adult' | 'child';
    gender: 'male' | 'female' | '';

    // Personal Info
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    dateOfBirth: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;

    // Emergency Contact
    emergencyName: string;
    emergencyPhone: string;

    // Medical
    medicalInfo: string;

    // Child Registration (when membershipType is 'child')
    isChild: boolean;
    parentFirstName: string;
    parentLastName: string;
    parentEmail: string;
    parentPhone: string;
    parentAddress: string;
    parentCity: string;
    parentPostcode: string;
    childAddressDifferent: boolean;

    // Agreements
    bestPracticeAccepted: boolean;
    waiverAccepted: boolean;

    // Membership Selection
    selectedMembershipTypeId: string;

    // Belt Rank (optional - for existing practitioners)
    beltRank: string;
    stripes: number;
}

function RegisterPageContent() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showBestPractice, setShowBestPractice] = useState(false);
    const [showWaiver, setShowWaiver] = useState(false);
    const [location, setLocation] = useState<Location | null>(null);
    const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
    const [capacityConfigs, setCapacityConfigs] = useState<CapacityConfig[]>([]);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [lookingUpPostcode, setLookingUpPostcode] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();
    const locationId = searchParams.get('location');

    // Fetch location info on mount
    useEffect(() => {
        if (!locationId) {
            // Redirect to join page if no location selected
            router.push('/join');
            return;
        }
        fetchLocationInfo();
    }, [locationId]);

    const fetchLocationInfo = async () => {
        if (!locationId) return;

        try {
            const [locRes, typesRes, configsRes] = await Promise.all([
                supabase.from('locations').select('id, name, settings').eq('id', locationId).single(),
                supabase.from('membership_types').select('*').eq('location_id', locationId).eq('is_active', true),
                supabase.from('location_membership_configs').select('*').eq('location_id', locationId),
            ]);

            if (locRes.error) throw locRes.error;
            setLocation(locRes.data);
            setMembershipTypes(typesRes.data || []);

            // Fetch current member counts for each membership type at this location
            const configs = configsRes.data || [];
            const configsWithCounts = await Promise.all(
                configs.map(async (config) => {
                    const { count } = await supabase
                        .from('memberships')
                        .select('*', { count: 'exact', head: true })
                        .eq('location_id', locationId)
                        .eq('membership_type_id', config.membership_type_id)
                        .in('status', ['active', 'pending']);
                    return { ...config, current_count: count || 0 };
                })
            );
            setCapacityConfigs(configsWithCounts);
        } catch (err) {
            console.error('Error fetching location:', err);
            router.push('/join');
        } finally {
            setPageLoading(false);
        }
    };

    // Check if a membership type has capacity available
    const hasCapacity = (membershipTypeId: string): boolean => {
        const config = capacityConfigs.find(c => c.membership_type_id === membershipTypeId);
        if (!config) return true; // No config = unlimited
        if (config.capacity === null) return true; // null capacity = unlimited
        return (config.current_count || 0) < config.capacity;
    };

    // Get remaining spots for a membership type
    const getRemainingSpots = (membershipTypeId: string): number | null => {
        const config = capacityConfigs.find(c => c.membership_type_id === membershipTypeId);
        if (!config || config.capacity === null) return null; // unlimited
        return Math.max(0, config.capacity - (config.current_count || 0));
    };

    const [formData, setFormData] = useState<FormData>({
        membershipType: 'adult',
        gender: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        phone: '',
        address: '',
        city: '',
        postcode: '',
        emergencyName: '',
        emergencyPhone: '',
        medicalInfo: '',
        isChild: false,
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: '',
        parentAddress: '',
        parentCity: '',
        parentPostcode: '',
        childAddressDifferent: false,
        bestPracticeAccepted: false,
        waiverAccepted: false,
        selectedMembershipTypeId: '',
        beltRank: 'white',
        stripes: 0,
    });

    const updateField = (field: keyof FormData, value: string | boolean | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1: // Membership Type
                if (formData.membershipType === 'child') {
                    if (!formData.parentFirstName || !formData.parentLastName || !formData.parentEmail || !formData.parentPhone) {
                        setError('Please fill in all parent/guardian details');
                        return false;
                    }
                }
                return true;

            case 2: // Personal Info
                if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
                    setError('Please fill in all required fields');
                    return false;
                }
                if (!formData.gender) {
                    setError('Please select your gender');
                    return false;
                }
                if (!profileImageFile) {
                    setError('Please upload a profile picture');
                    return false;
                }
                if (formData.membershipType === 'adult') {
                    if (!formData.email || !formData.password) {
                        setError('Email and password are required');
                        return false;
                    }
                    // Email format validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                        setError('Please enter a valid email address');
                        return false;
                    }
                    if (formData.password.length < 6) {
                        setError('Password must be at least 6 characters');
                        return false;
                    }
                    if (formData.password !== formData.confirmPassword) {
                        setError('Passwords do not match');
                        return false;
                    }
                }
                return true;

            case 3: // Contact & Emergency
                if (!formData.phone || !formData.address || !formData.city || !formData.postcode) {
                    setError('Please fill in all address fields');
                    return false;
                }
                // Phone number validation (digits only, allow spaces and common separators)
                const phoneDigits = formData.phone.replace(/[\s\-\(\)]/g, '');
                if (!/^\d{10,15}$/.test(phoneDigits)) {
                    setError('Please enter a valid phone number (10-15 digits)');
                    return false;
                }
                // UK Postcode validation (basic format)
                const postcodeRegex = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
                if (!postcodeRegex.test(formData.postcode.trim())) {
                    setError('Please enter a valid UK postcode');
                    return false;
                }
                if (!formData.emergencyName || !formData.emergencyPhone) {
                    setError('Emergency contact is required');
                    return false;
                }
                // Emergency phone validation
                const emergencyPhoneDigits = formData.emergencyPhone.replace(/[\s\-\(\)]/g, '');
                if (!/^\d{10,15}$/.test(emergencyPhoneDigits)) {
                    setError('Please enter a valid emergency contact phone number');
                    return false;
                }
                return true;

            case 4: // Agreements
                if (!formData.bestPracticeAccepted || !formData.waiverAccepted) {
                    setError('You must accept both agreements to continue');
                    return false;
                }
                return true;

            case 5: // Membership Selection
                if (!formData.selectedMembershipTypeId) {
                    setError('Please select a membership type');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 5));
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep(5)) return;
        if (!location || !locationId) {
            setError('Location information is missing');
            return;
        }

        setLoading(true);
        setError('');

        const isChildMembership = formData.membershipType === 'child';

        try {
            // Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: isChildMembership ? formData.parentEmail : formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: isChildMembership ? formData.parentFirstName : formData.firstName,
                        last_name: isChildMembership ? formData.parentLastName : formData.lastName,
                        date_of_birth: formData.dateOfBirth,
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // Upload profile image first if provided
                let profileImageUrl = null;
                if (profileImageFile) {
                    try {
                        const fileExt = profileImageFile.name.split('.').pop();
                        const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;

                        const { error: uploadError } = await supabase.storage
                            .from('profile-images')
                            .upload(fileName, profileImageFile, { upsert: true });

                        if (uploadError) {
                            console.error('Profile image upload error:', uploadError);
                        } else {
                            const { data: { publicUrl } } = supabase.storage
                                .from('profile-images')
                                .getPublicUrl(fileName);
                            profileImageUrl = publicUrl;
                        }
                    } catch (imgErr) {
                        console.error('Profile image upload failed:', imgErr);
                    }
                }

                // Update profile with additional details including gender, belt, and profile image
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        date_of_birth: formData.dateOfBirth,
                        gender: formData.gender,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        postcode: formData.postcode,
                        emergency_contact_name: formData.emergencyName,
                        emergency_contact_phone: formData.emergencyPhone,
                        medical_info: formData.medicalInfo || null,
                        is_child: isChildMembership,
                        belt_rank: formData.beltRank,
                        stripes: formData.stripes,
                        best_practice_accepted: true,
                        best_practice_accepted_at: new Date().toISOString(),
                        waiver_accepted: true,
                        waiver_accepted_at: new Date().toISOString(),
                        profile_image_url: profileImageUrl,
                    })
                    .eq('user_id', authData.user.id);

                if (profileError) {
                    console.error('Profile update error:', profileError);
                }

                // Check if the selected membership type has capacity
                const selectedMembershipTypeId = formData.selectedMembershipTypeId;
                const membershipHasCapacity = hasCapacity(selectedMembershipTypeId);

                // Get selected membership type
                const selectedType = membershipTypes.find(mt => mt.id === selectedMembershipTypeId);
                const isFree = selectedType?.price === 0;

                if (membershipHasCapacity) {
                    if (isFree) {
                        // Free membership - create as active immediately
                        const { error: membershipError } = await supabase
                            .from('memberships')
                            .insert({
                                user_id: authData.user.id,
                                location_id: locationId,
                                membership_type_id: formData.selectedMembershipTypeId,
                                status: 'active',
                                start_date: new Date().toISOString().split('T')[0],
                            });

                        if (membershipError) {
                            console.error('Membership creation error:', membershipError);
                        }

                        // Redirect to dashboard for free members
                        router.push('/dashboard?registered=true');
                        router.refresh();
                    } else {
                        // Paid membership - redirect to Stripe checkout
                        console.log('Attempting Stripe checkout for membership type:', formData.selectedMembershipTypeId);

                        const response = await fetch('/api/stripe/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                membershipTypeId: formData.selectedMembershipTypeId,
                                membershipTypeName: selectedType?.name || 'Membership',
                                price: selectedType?.price || 0,
                                userId: authData.user.id,
                                locationId: locationId,
                                locationName: location.name,
                                userEmail: isChildMembership ? formData.parentEmail : formData.email,
                            }),
                        });

                        const data = await response.json();
                        console.log('Stripe checkout response:', data);

                        if (data.url) {
                            // Redirect to Stripe Checkout
                            console.log('Redirecting to Stripe:', data.url);
                            window.location.href = data.url;
                        } else if (data.error) {
                            // Stripe returned an error - show it to user
                            console.error('Stripe checkout error:', data.error);
                            setError(`Payment setup failed: ${data.error}. Please try again or contact support.`);
                            setLoading(false);
                            return;
                        } else {
                            // Stripe not configured - create pending membership
                            console.log('No URL returned, creating pending membership');
                            const { error: membershipError } = await supabase
                                .from('memberships')
                                .insert({
                                    user_id: authData.user.id,
                                    location_id: locationId,
                                    membership_type_id: formData.selectedMembershipTypeId,
                                    status: 'pending',
                                    start_date: new Date().toISOString().split('T')[0],
                                });

                            if (membershipError) {
                                console.error('Membership creation error:', membershipError);
                            }

                            // Redirect to dashboard with pending notice
                            router.push('/dashboard?registered=true&pending=true');
                            router.refresh();
                        }
                    }
                } else {
                    // Add to waitlist with membership_type_id
                    const { data: waitlistPosition } = await supabase
                        .from('waitlist')
                        .select('position')
                        .eq('location_id', locationId)
                        .eq('membership_type_id', selectedMembershipTypeId)
                        .order('position', { ascending: false })
                        .limit(1)
                        .single();

                    const nextPosition = (waitlistPosition?.position || 0) + 1;

                    const { error: waitlistError } = await supabase
                        .from('waitlist')
                        .insert({
                            user_id: authData.user.id,
                            location_id: locationId,
                            membership_type_id: selectedMembershipTypeId,
                            position: nextPosition,
                        });

                    if (waitlistError) {
                        console.error('Waitlist error:', waitlistError);
                    }

                    // Redirect to waitlist confirmation page
                    router.push('/waitlist-confirmation');
                    router.refresh();
                }
            }

        } catch (err: unknown) {
            console.error('Registration error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Membership', icon: Users },
        { number: 2, title: 'Personal', icon: User },
        { number: 3, title: 'Contact', icon: Phone },
        { number: 4, title: 'Agreements', icon: Shield },
        { number: 5, title: 'Plan', icon: CreditCard },
    ];

    // Show loading state while fetching location
    if (pageLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: 'var(--space-6)',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <Link href="/">
                        <Image
                            src="/logo-full.png"
                            alt="Sport of Kings"
                            width={140}
                            height={70}
                            priority
                            style={{ height: '60px', width: 'auto', margin: '0 auto' }}
                        />
                    </Link>
                    <h1 style={{
                        fontSize: 'var(--text-2xl)',
                        marginTop: 'var(--space-4)',
                    }}>
                        Join Sport of Kings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Begin your martial arts journey
                    </p>
                </div>

                {/* Progress Steps */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-8)',
                }}>
                    {steps.map((s, index) => (
                        <div
                            key={s.number}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                            }}
                        >
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: step >= s.number ? 'var(--color-gold-gradient)' : 'var(--bg-tertiary)',
                                color: step >= s.number ? 'var(--color-black)' : 'var(--text-tertiary)',
                                fontWeight: '600',
                                fontSize: 'var(--text-sm)',
                            }}>
                                {step > s.number ? <Check size={18} /> : s.number}
                            </div>
                            {index < steps.length - 1 && (
                                <div style={{
                                    width: '40px',
                                    height: '2px',
                                    background: step > s.number ? 'var(--color-gold)' : 'var(--border-light)',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="glass-card" style={{ padding: 'var(--space-8)' }}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Membership Type */}
                        {step === 1 && (
                            <div className="animate-fade-in">
                                {/* Location Context */}
                                {location && (
                                    <div style={{
                                        background: 'rgba(197, 164, 86, 0.1)',
                                        border: '1px solid var(--color-gold)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--space-4)',
                                        marginBottom: 'var(--space-6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                    }}>
                                        <MapPin size={20} color="var(--color-gold)" />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600' }}>Joining: {location.name}</p>
                                        </div>
                                    </div>
                                )}

                                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>
                                    Membership Type
                                </h2>

                                {/* Adult/Child Radio Buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                                    {/* Adult Option */}
                                    <label style={{
                                        padding: 'var(--space-4)',
                                        background: formData.membershipType === 'adult' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: formData.membershipType === 'adult' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <input
                                            type="radio"
                                            name="membershipType"
                                            checked={formData.membershipType === 'adult'}
                                            onChange={() => {
                                                updateField('membershipType', 'adult');
                                                updateField('isChild', false);
                                            }}
                                            style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)' }}
                                        />
                                        <div>
                                            <strong>Adult Membership</strong>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                                For members 18 years and older
                                            </p>
                                        </div>
                                    </label>

                                    {/* Child Option */}
                                    <label style={{
                                        padding: 'var(--space-4)',
                                        background: formData.membershipType === 'child' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: formData.membershipType === 'child' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <input
                                            type="radio"
                                            name="membershipType"
                                            checked={formData.membershipType === 'child'}
                                            onChange={() => {
                                                updateField('membershipType', 'child');
                                                updateField('isChild', true);
                                            }}
                                            style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)' }}
                                        />
                                        <div>
                                            <strong>Child Membership</strong>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                                                For members under 18 (parent/guardian required)
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {formData.membershipType === 'child' && (
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        padding: 'var(--space-6)',
                                        borderRadius: 'var(--radius-lg)',
                                        marginBottom: 'var(--space-4)',
                                    }}>
                                        <h3 style={{
                                            fontSize: 'var(--text-lg)',
                                            marginBottom: 'var(--space-4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                        }}>
                                            <Heart size={20} color="var(--color-gold)" />
                                            Parent/Guardian Details
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                            <div className="form-group">
                                                <label className="form-label">First Name*</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={formData.parentFirstName}
                                                    onChange={(e) => updateField('parentFirstName', e.target.value)}
                                                    required={formData.membershipType === 'child'}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Last Name*</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={formData.parentLastName}
                                                    onChange={(e) => updateField('parentLastName', e.target.value)}
                                                    required={formData.membershipType === 'child'}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Email*</label>
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={formData.parentEmail}
                                                onChange={(e) => updateField('parentEmail', e.target.value)}
                                                required={formData.membershipType === 'child'}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Phone*</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={formData.parentPhone}
                                                onChange={(e) => updateField('parentPhone', e.target.value)}
                                                required={formData.membershipType === 'child'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Personal Information */}
                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>
                                    {formData.isChild ? "Child's Details" : 'Personal Information'}
                                </h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">First Name*</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                style={{ paddingLeft: '42px' }}
                                                value={formData.firstName}
                                                onChange={(e) => updateField('firstName', e.target.value)}
                                                required
                                            />
                                        </div>
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

                                <div className="form-group">
                                    <label className="form-label">Date of Birth*</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ paddingLeft: '42px' }}
                                            value={formData.dateOfBirth}
                                            onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Gender Field */}
                                <div className="form-group">
                                    <label className="form-label">Gender*</label>
                                    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            background: formData.gender === 'male' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: formData.gender === 'male' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                            cursor: 'pointer',
                                            flex: 1,
                                            justifyContent: 'center',
                                        }}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                checked={formData.gender === 'male'}
                                                onChange={() => updateField('gender', 'male')}
                                                style={{ accentColor: 'var(--color-gold)' }}
                                            />
                                            Male
                                        </label>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            background: formData.gender === 'female' ? 'rgba(197, 164, 86, 0.1)' : 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: formData.gender === 'female' ? '2px solid var(--color-gold)' : '2px solid var(--border-light)',
                                            cursor: 'pointer',
                                            flex: 1,
                                            justifyContent: 'center',
                                        }}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                checked={formData.gender === 'female'}
                                                onChange={() => updateField('gender', 'female')}
                                                style={{ accentColor: 'var(--color-gold)' }}
                                            />
                                            Female
                                        </label>
                                    </div>
                                </div>

                                {/* Profile Picture Upload */}
                                <div className="form-group">
                                    <label className="form-label">Profile Picture*</label>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                                        Upload a clear photo of {formData.membershipType === 'child' ? 'the child' : 'yourself'} for identification
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
                                        onClick={() => document.getElementById('profile-image-input')?.click()}
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
                                        id="profile-image-input"
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
                                            Already training in BJJ? Select your current belt. New to BJJ? Leave as White Belt.
                                        </p>
                                    </div>

                                    {/* Belt Color Selection */}
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                                        {(formData.membershipType === 'adult'
                                            ? ['white', 'blue', 'purple', 'brown', 'black']
                                            : ['white', 'grey-white', 'grey', 'grey-black', 'yellow-white', 'yellow', 'yellow-black', 'orange-white', 'orange', 'orange-black', 'green-white', 'green', 'green-black']
                                        ).map((belt) => (
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
                                                Stripes {formData.membershipType === 'adult' ? '(0-4)' : '(White 1-4, Red 5-8, Grey 9-12)'}
                                            </label>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                                {(formData.membershipType === 'adult'
                                                    ? [0, 1, 2, 3, 4]
                                                    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                                                ).map((s) => {
                                                    // Color code for kids: 1-4 white, 5-8 red, 9-12 grey
                                                    let stripeColor = 'inherit';
                                                    if (formData.membershipType !== 'adult' && s > 0) {
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

                                {formData.membershipType === 'adult' && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Email Address*</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                                <input
                                                    type="email"
                                                    className="form-input"
                                                    style={{ paddingLeft: '42px' }}
                                                    value={formData.email}
                                                    onChange={(e) => updateField('email', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Password*</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Minimum 6 characters"
                                                    value={formData.password}
                                                    onChange={(e) => updateField('password', e.target.value)}
                                                    required
                                                    style={{ paddingRight: '42px' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Confirm Password*</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.isChild && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Create Password* (for parent account)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="form-input"
                                                    placeholder="Minimum 6 characters"
                                                    value={formData.password}
                                                    onChange={(e) => updateField('password', e.target.value)}
                                                    required
                                                    style={{ paddingRight: '42px' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm Password*</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.confirmPassword}
                                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 3: Contact & Emergency */}
                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>
                                    Contact & Emergency Details
                                </h2>

                                <div className="form-group">
                                    <label className="form-label">Phone Number*</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                        <input
                                            type="tel"
                                            className="form-input"
                                            style={{ paddingLeft: '42px' }}
                                            value={formData.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Postcode Lookup - First */}
                                <div className="form-group">
                                    <label className="form-label">Postcode* (Enter and click Lookup to auto-fill city)</label>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. M1 2AB"
                                            value={formData.postcode}
                                            onChange={(e) => updateField('postcode', e.target.value.toUpperCase())}
                                            required
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={lookingUpPostcode || !formData.postcode}
                                            onClick={async () => {
                                                const postcode = formData.postcode.trim().replace(/\s/g, '');
                                                if (!postcode) return;

                                                setLookingUpPostcode(true);
                                                setError('');

                                                try {
                                                    const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
                                                    const data = await response.json();

                                                    if (data.status === 200 && data.result) {
                                                        const result = data.result;
                                                        // Auto-fill city from admin_district
                                                        const city = result.admin_district || result.admin_ward || result.parish || '';
                                                        updateField('city', city);
                                                        // Format postcode properly
                                                        updateField('postcode', result.postcode);
                                                    } else {
                                                        setError('Postcode not found. Please check and try again.');
                                                    }
                                                } catch (err) {
                                                    console.error('Postcode lookup error:', err);
                                                    setError('Could not look up postcode. Please enter address manually.');
                                                } finally {
                                                    setLookingUpPostcode(false);
                                                }
                                            }}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {lookingUpPostcode ? (
                                                <Loader2 size={16} className="spinner" />
                                            ) : (
                                                <>
                                                    <Search size={16} />
                                                    Lookup
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* House Number / Building */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">House No.*</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. 42 or Flat 3"
                                            value={formData.address.split(',')[0]?.trim() || ''}
                                            onChange={(e) => {
                                                const street = formData.address.includes(',')
                                                    ? formData.address.split(',').slice(1).join(',').trim()
                                                    : formData.address;
                                                const newAddress = e.target.value ? `${e.target.value}, ${street}` : street;
                                                updateField('address', newAddress);
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Street Name*</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. High Street"
                                            value={formData.address.includes(',')
                                                ? formData.address.split(',').slice(1).join(',').trim()
                                                : formData.address}
                                            onChange={(e) => {
                                                const houseNo = formData.address.split(',')[0]?.trim() || '';
                                                const newAddress = houseNo ? `${houseNo}, ${e.target.value}` : e.target.value;
                                                updateField('address', newAddress);
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* City/Town */}
                                <div className="form-group">
                                    <label className="form-label">City/Town* (auto-filled from postcode)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        required
                                    />
                                </div>

                                <hr style={{ margin: 'var(--space-6) 0', border: 'none', borderTop: '1px solid var(--border-light)' }} />

                                <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <AlertCircle size={20} color="var(--color-red)" />
                                    Emergency Contact
                                </h3>

                                <div className="form-group">
                                    <label className="form-label">Contact Name*</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.emergencyName}
                                        onChange={(e) => updateField('emergencyName', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Contact Phone*</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.emergencyPhone}
                                        onChange={(e) => updateField('emergencyPhone', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Medical/Allergy Information</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Please list any medical conditions, allergies, or other health information we should be aware of..."
                                        value={formData.medicalInfo}
                                        onChange={(e) => updateField('medicalInfo', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 4: Agreements */}
                        {step === 4 && (
                            <div className="animate-fade-in">
                                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>
                                    Review & Accept
                                </h2>

                                {/* Best Practice */}
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-4)',
                                    marginBottom: 'var(--space-4)',
                                    border: formData.bestPracticeAccepted ? '2px solid var(--color-green)' : '2px solid var(--border-light)',
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

                                    <label className="form-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.bestPracticeAccepted}
                                            onChange={(e) => updateField('bestPracticeAccepted', e.target.checked)}
                                        />
                                        <span style={{ fontSize: 'var(--text-sm)' }}>
                                            I have read and agree to follow the Best Practice & Etiquette guidelines
                                        </span>
                                    </label>
                                </div>

                                {/* Waiver */}
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-4)',
                                    marginBottom: 'var(--space-6)',
                                    border: formData.waiverAccepted ? '2px solid var(--color-green)' : '2px solid var(--border-light)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <Shield size={18} color="var(--color-gold)" />
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

                                    <label className="form-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.waiverAccepted}
                                            onChange={(e) => updateField('waiverAccepted', e.target.checked)}
                                        />
                                        <span style={{ fontSize: 'var(--text-sm)' }}>
                                            I have read and accept the Disclaimer and Waiver of Liability
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Membership Selection */}
                        {step === 5 && (
                            <div className="animate-fade-in">
                                <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>
                                    Choose Your Plan
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                                    Select a membership plan for {location?.name}
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                    {membershipTypes.map((type) => {
                                        const typeHasCapacity = hasCapacity(type.id);
                                        const remainingSpots = getRemainingSpots(type.id);
                                        const isSelected = formData.selectedMembershipTypeId === type.id;

                                        return (
                                            <label
                                                key={type.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 'var(--space-4)',
                                                    padding: 'var(--space-5)',
                                                    background: isSelected
                                                        ? 'rgba(197, 164, 86, 0.15)'
                                                        : !typeHasCapacity
                                                            ? 'rgba(239, 68, 68, 0.05)'
                                                            : 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-lg)',
                                                    border: isSelected
                                                        ? '2px solid var(--color-gold)'
                                                        : !typeHasCapacity
                                                            ? '2px solid var(--color-red)'
                                                            : '2px solid var(--border-light)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    opacity: !typeHasCapacity ? 0.9 : 1,
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="membershipPlan"
                                                    checked={isSelected}
                                                    onChange={() => updateField('selectedMembershipTypeId', type.id)}
                                                    style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        accentColor: 'var(--color-gold)',
                                                        marginTop: '2px',
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: 'var(--space-2)',
                                                    }}>
                                                        <strong style={{ fontSize: 'var(--text-lg)' }}>
                                                            {type.name}
                                                        </strong>
                                                        <span style={{
                                                            background: type.price === 0
                                                                ? 'var(--color-green)'
                                                                : 'var(--color-gold-gradient)',
                                                            color: 'var(--color-black)',
                                                            padding: 'var(--space-1) var(--space-3)',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontWeight: '600',
                                                            fontSize: 'var(--text-sm)',
                                                        }}>
                                                            {type.price === 0 ? 'FREE' : `£${type.price}/month`}
                                                        </span>
                                                    </div>
                                                    {type.description && (
                                                        <p style={{
                                                            color: 'var(--text-secondary)',
                                                            margin: 0,
                                                            fontSize: 'var(--text-sm)',
                                                            marginBottom: 'var(--space-2)',
                                                        }}>
                                                            {type.description}
                                                        </p>
                                                    )}
                                                    {/* Capacity Status */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-2)',
                                                        marginTop: 'var(--space-2)',
                                                    }}>
                                                        {!typeHasCapacity ? (
                                                            <span className="badge badge-red">
                                                                Full - Join Waitlist
                                                            </span>
                                                        ) : remainingSpots !== null ? (
                                                            <span className="badge badge-green">
                                                                {remainingSpots} spot{remainingSpots !== 1 ? 's' : ''} left
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-gray">
                                                                Available
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {membershipTypes.length === 0 && (
                                    <div style={{
                                        padding: 'var(--space-8)',
                                        textAlign: 'center',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        No membership types available for this location.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            marginTop: 'var(--space-6)',
                        }}>
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={prevStep}
                                    style={{ flex: 1 }}
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                            )}

                            {step < 5 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={nextStep}
                                    style={{ flex: 1 }}
                                >
                                    Continue
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ flex: 1 }}
                                    disabled={loading || !formData.selectedMembershipTypeId}
                                >
                                    {loading ? (
                                        <span className="spinner" style={{ width: '20px', height: '20px' }} />
                                    ) : (
                                        <>
                                            Complete Registration
                                            <Check size={18} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Login Link */}
                    <p style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-6)',
                        color: 'var(--text-secondary)',
                    }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: 'var(--color-gold)', fontWeight: '600' }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)'
            }}>
                <div className="loading-spinner" />
            </div>
        }>
            <RegisterPageContent />
        </Suspense>
    );
}
