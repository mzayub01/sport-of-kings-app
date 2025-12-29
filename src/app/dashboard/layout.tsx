import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import BottomNav from '@/components/dashboard/BottomNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role, profile_image_url')
        .eq('user_id', user.id)
        .single();

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Member';
    const profileImageUrl = profile?.profile_image_url || undefined;

    return (
        <div className="dashboard-layout">
            <DashboardSidebar role="member" userName={userName} profileImageUrl={profileImageUrl} />
            <main className="dashboard-main">
                {children}
            </main>
            <BottomNav role="member" />
        </div>
    );
}

