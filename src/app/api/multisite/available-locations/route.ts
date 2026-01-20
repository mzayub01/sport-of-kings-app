import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface MultisiteTier {
    id: string;
    location_id: string;
    name: string;
    description: string | null;
    price: number;
    age_min: number | null;
    age_max: number | null;
    stripe_price_id: string | null;
}

interface AvailableLocation {
    id: string;
    name: string;
    city: string;
    max_capacity: number;
    current_members: number;
    hasCapacity: boolean;
    spotsRemaining: number;
    tiers: MultisiteTier[];
}

function getAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
        // Get user profile to determine age
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('date_of_birth, is_child')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const memberAge = getAge(profile.date_of_birth);

        // Get current active memberships for this user with location names
        const { data: currentMemberships, error: membershipError } = await supabase
            .from('memberships')
            .select('id, location_id, status, location:locations(id, name)')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (membershipError) {
            return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
        }

        const currentLocationIds = (currentMemberships || []).map(m => m.location_id);
        const currentSiteCount = currentLocationIds.length;
        const currentSites = (currentMemberships || []).map(m => ({
            id: m.location_id,
            name: (m.location as { id: string; name: string } | null)?.name || 'Unknown',
        }));

        // Get available locations (multisite enabled, not already a member)
        const { data: locations, error: locationsError } = await supabase
            .from('locations')
            .select('id, name, city, max_capacity, current_members')
            .eq('is_active', true)
            .eq('allow_multisite', true);

        if (locationsError) {
            return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
        }

        // Filter out locations user is already a member of
        const availableLocationIds = (locations || [])
            .filter(loc => !currentLocationIds.includes(loc.id))
            .map(loc => loc.id);

        if (availableLocationIds.length === 0) {
            return NextResponse.json({
                availableLocations: [],
                currentSiteCount,
                memberAge,
                canAddMore: currentSiteCount < 3,
            });
        }

        // Fetch multisite tiers for available locations
        const { data: multisiteTiers, error: tiersError } = await supabase
            .from('membership_types')
            .select('id, location_id, name, description, price, age_min, age_max, stripe_price_id')
            .eq('is_multisite', true)
            .eq('is_active', true)
            .in('location_id', availableLocationIds);

        if (tiersError) {
            return NextResponse.json({ error: 'Failed to fetch multisite tiers' }, { status: 500 });
        }

        // Build available locations with their applicable tiers
        const availableLocations: AvailableLocation[] = (locations || [])
            .filter(loc => !currentLocationIds.includes(loc.id))
            .map(loc => {
                // Filter tiers by age eligibility
                const applicableTiers = (multisiteTiers || []).filter(tier => {
                    if (tier.location_id !== loc.id) return false;
                    const minAge = tier.age_min ?? 0;
                    const maxAge = tier.age_max ?? 999;
                    return memberAge >= minAge && memberAge <= maxAge;
                });

                return {
                    id: loc.id,
                    name: loc.name,
                    city: loc.city,
                    max_capacity: loc.max_capacity,
                    current_members: loc.current_members,
                    hasCapacity: loc.current_members < loc.max_capacity,
                    spotsRemaining: loc.max_capacity - loc.current_members,
                    tiers: applicableTiers,
                };
            })
            // Only include locations that have at least one applicable tier
            .filter(loc => loc.tiers.length > 0);

        return NextResponse.json({
            availableLocations,
            currentSiteCount,
            currentSites,
            memberAge,
            canAddMore: currentSiteCount < 3,
        });
    } catch (error) {
        console.error('Error in multisite available-locations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
