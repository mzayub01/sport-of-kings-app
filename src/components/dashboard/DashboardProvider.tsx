'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface ChildProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
}

interface ParentProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
}

interface DashboardContextType {
    parentProfile: ParentProfile | null;
    children: ChildProfile[];
    selectedProfileId: string;
    setSelectedProfileId: (id: string) => void;
    hasParentMembership: boolean;
    isLoading: boolean;
    refreshChildren: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}

interface DashboardProviderProps {
    children: ReactNode;
    initialParentProfile: ParentProfile;
    initialChildren: ChildProfile[];
    initialHasParentMembership: boolean;
}

export function DashboardProvider({
    children,
    initialParentProfile,
    initialChildren,
    initialHasParentMembership,
}: DashboardProviderProps) {
    const supabase = getSupabaseClient();
    const [parentProfile] = useState(initialParentProfile);
    const [childProfiles, setChildProfiles] = useState<ChildProfile[]>(initialChildren);
    const [hasParentMembership] = useState(initialHasParentMembership);
    const [isLoading, setIsLoading] = useState(false);

    // Default to parent's profile if they have membership, otherwise first child
    const defaultProfileId = initialHasParentMembership
        ? initialParentProfile.user_id
        : (initialChildren[0]?.user_id || initialParentProfile.user_id);

    const [selectedProfileId, setSelectedProfileId] = useState(defaultProfileId);

    // Persist selection to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('selectedProfileId');
        if (saved) {
            // Validate saved ID still exists
            const validIds = [
                parentProfile.user_id,
                ...childProfiles.map(c => c.user_id),
            ];
            if (validIds.includes(saved)) {
                setSelectedProfileId(saved);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedProfileId', selectedProfileId);
    }, [selectedProfileId]);

    const refreshChildren = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name, profile_image_url')
                .eq('parent_guardian_id', parentProfile.user_id);

            setChildProfiles(data || []);
        } catch (err) {
            console.error('Error refreshing children:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardContext.Provider
            value={{
                parentProfile,
                children: childProfiles,
                selectedProfileId,
                setSelectedProfileId,
                hasParentMembership,
                isLoading,
                refreshChildren,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}
