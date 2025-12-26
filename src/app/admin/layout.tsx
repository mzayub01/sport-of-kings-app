import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardSidebar from '@/components/dashboard/Sidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile and verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Admin';

    return (
        <div className="dashboard-layout">
            <DashboardSidebar role="admin" userName={userName} />
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
