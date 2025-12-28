import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import BottomNav from '@/components/dashboard/BottomNav';

export default async function ProfessorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile and verify professor role
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    // Only professors and admins can access professor pages
    if (profile?.role !== 'professor' && profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Professor';

    return (
        <div className="dashboard-layout">
            <DashboardSidebar role="professor" userName={userName} />
            <main className="dashboard-main">
                {children}
            </main>
            <BottomNav role="professor" />
        </div>
    );
}
