import { createAdminClient } from '@/lib/supabase/server';
import {
    PoundSterling,
    Users,
    MapPin,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Building,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

export const metadata = {
    title: 'Financial MI | Sport of Kings Admin',
    description: 'Financial Management Information dashboard',
};

interface RevenueByLocation {
    location_id: string;
    location_name: string;
    member_count: number;
    total_revenue: number;
}

interface RevenueByType {
    type_id: string;
    type_name: string;
    price: number;
    member_count: number;
    total_revenue: number;
}

export default async function AdminFinancePage() {
    const supabase = await createAdminClient();

    // Fetch all active memberships with their types and locations
    const { data: memberships } = await supabase
        .from('memberships')
        .select(`
            id,
            user_id,
            location_id,
            membership_type_id,
            start_date,
            created_at,
            location:locations(id, name),
            membership_type:membership_types(id, name, price)
        `)
        .eq('status', 'active');

    // Calculate revenue by location and type
    const revenueByLocation: Record<string, RevenueByLocation> = {};
    const revenueByType: Record<string, RevenueByType> = {};
    let totalMonthlyRevenue = 0;
    let totalMembers = 0;

    // Get current month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let newMembersThisMonth = 0;
    let newMembersLastMonth = 0;

    // Monthly member count tracking (last 6 months) - cumulative active members
    const monthlyData: { month: string; revenue: number; members: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyData.push({
            month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            revenue: 0,
            members: 0,
        });
    }

    memberships?.forEach((m) => {
        const locationData = m.location as { id: string; name: string } | null;
        const typeData = m.membership_type as { id: string; name: string; price: number } | null;
        const price = typeData?.price || 0;
        const startDate = m.start_date ? new Date(m.start_date) : new Date(m.created_at);

        // Simple calculation: price × 1 member = monthly revenue for this member
        totalMonthlyRevenue += price;
        totalMembers += 1;

        // Location breakdown
        if (locationData) {
            if (!revenueByLocation[locationData.id]) {
                revenueByLocation[locationData.id] = {
                    location_id: locationData.id,
                    location_name: locationData.name,
                    member_count: 0,
                    total_revenue: 0,
                };
            }
            revenueByLocation[locationData.id].member_count += 1;
            revenueByLocation[locationData.id].total_revenue += price;
        }

        // Type breakdown
        if (typeData) {
            if (!revenueByType[typeData.id]) {
                revenueByType[typeData.id] = {
                    type_id: typeData.id,
                    type_name: typeData.name,
                    price: typeData.price,
                    member_count: 0,
                    total_revenue: 0,
                };
            }
            revenueByType[typeData.id].member_count += 1;
            revenueByType[typeData.id].total_revenue += price;
        }

        // Track new signups this month vs last month
        if (startDate >= currentMonthStart) {
            newMembersThisMonth += 1;
        } else if (startDate >= lastMonthStart && startDate <= lastMonthEnd) {
            newMembersLastMonth += 1;
        }

        // Calculate cumulative member count for each month in the chart
        // A member contributes to all months from their start date onwards
        monthlyData.forEach((monthItem, index) => {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
            // If member started before or during this month, they contribute
            if (startDate <= new Date(now.getFullYear(), now.getMonth() - (4 - index), 0)) {
                monthItem.members += 1;
                monthItem.revenue += price;
            }
        });
    });

    const locationArray = Object.values(revenueByLocation).sort((a, b) => b.total_revenue - a.total_revenue);
    const typeArray = Object.values(revenueByType).sort((a, b) => b.total_revenue - a.total_revenue);

    const avgRevenuePerMember = totalMembers > 0 ? totalMonthlyRevenue / totalMembers : 0;
    const memberGrowth = newMembersLastMonth > 0
        ? ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100
        : newMembersThisMonth > 0 ? 100 : 0;

    const formatCurrency = (pence: number) => {
        return `£${(pence / 100).toFixed(2)}`;
    };

    const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

    return (
        <div>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Financial MI</h1>
                <p className="dashboard-subtitle">
                    Revenue analysis and financial insights
                </p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Monthly Revenue</p>
                            <p className="stat-value">{formatCurrency(totalMonthlyRevenue)}</p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <PoundSterling size={24} color="var(--color-black)" />
                        </div>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, marginTop: 'var(--space-2)' }}>
                        From {totalMembers} active member{totalMembers !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">New Signups This Month</p>
                            <p className="stat-value">{newMembersThisMonth}</p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: memberGrowth >= 0 ? 'var(--color-green)' : 'var(--color-red)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {memberGrowth >= 0 ? (
                                <TrendingUp size={24} color="white" />
                            ) : (
                                <TrendingDown size={24} color="white" />
                            )}
                        </div>
                    </div>
                    <div className={`stat-change ${memberGrowth >= 0 ? 'positive' : 'negative'}`}>
                        {memberGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{memberGrowth >= 0 ? '+' : ''}{memberGrowth.toFixed(0)}% vs last month ({newMembersLastMonth})</span>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Avg Revenue/Member</p>
                            <p className="stat-value">{formatCurrency(avgRevenuePerMember)}</p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-green)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Users size={24} color="white" />
                        </div>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p className="stat-label">Active Locations</p>
                            <p className="stat-value">{locationArray.length}</p>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <MapPin size={24} color="var(--color-black)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <TrendingUp size={20} color="var(--color-gold)" />
                        Revenue Trend (Last 6 Months)
                    </h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: '200px', padding: 'var(--space-4) 0' }}>
                        {monthlyData.map((month, index) => (
                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <div style={{
                                    height: `${(month.revenue / maxMonthlyRevenue) * 150}px`,
                                    minHeight: '4px',
                                    width: '100%',
                                    maxWidth: '60px',
                                    background: index === monthlyData.length - 1 ? 'var(--color-gold-gradient)' : 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                    transition: 'height 0.3s ease',
                                }} />
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                    {month.month}
                                </span>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600' }}>
                                    {formatCurrency(month.revenue)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
                {/* Revenue by Location */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Building size={20} color="var(--color-gold)" />
                            Revenue by Location
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {locationArray.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No revenue data available
                            </div>
                        ) : (
                            locationArray.map((loc, index) => (
                                <div
                                    key={loc.location_id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-4)',
                                        borderBottom: index < locationArray.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <MapPin size={20} color="var(--color-gold)" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', margin: 0 }}>{loc.location_name}</p>
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                {loc.member_count} member{loc.member_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '700', color: 'var(--color-gold)', margin: 0 }}>
                                            {formatCurrency(loc.total_revenue)}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                            {((loc.total_revenue / totalMonthlyRevenue) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Revenue by Membership Type */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <CreditCard size={20} color="var(--color-gold)" />
                            Revenue by Membership Type
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {typeArray.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No revenue data available
                            </div>
                        ) : (
                            typeArray.map((type, index) => (
                                <div
                                    key={type.type_id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-4)',
                                        borderBottom: index < typeArray.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-lg)',
                                            background: 'var(--bg-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <CreditCard size={20} color="var(--color-green)" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', margin: 0 }}>{type.type_name}</p>
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                                                {formatCurrency(type.price)}/member × {type.member_count} = {formatCurrency(type.total_revenue)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '700', color: 'var(--color-gold)', margin: 0 }}>
                                            {formatCurrency(type.total_revenue)}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                                            {((type.total_revenue / totalMonthlyRevenue) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
