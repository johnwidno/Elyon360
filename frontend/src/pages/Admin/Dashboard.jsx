import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import AdminLayout from '../../layouts/AdminLayout';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        members: 0,
        organizations: 0,
        finances: 0,
        visitors: 0
    });
    const [recentMembers, setRecentMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [membersRes, orgsRes, financesRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/organizations'),
                    api.get('/donations/stats')
                ]);

                // Calculate total balance across all currencies (simplified for dashboard)
                const totalFinances = Object.values(financesRes.data || {}).reduce((acc, curr) => acc + (curr.balance || 0), 0);
                const avgGrowth = Object.values(financesRes.data || {}).reduce((acc, curr) => acc + (curr.growth || 0), 0) / (Object.keys(financesRes.data || {}).length || 1);

                setStats({
                    members: membersRes.data?.length || 0,
                    organizations: orgsRes.data?.length || 0,
                    finances: totalFinances,
                    financesTrend: avgGrowth.toFixed(1) + '%'
                });
                setRecentMembers(Array.isArray(membersRes.data) ? membersRes.data.slice(0, 5) : []);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('good_morning', 'Bonjour');
        if (hour < 18) return t('good_afternoon', 'Bon après-midi');
        return t('good_evening', 'Bonsoir');
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 space-y-10 animate-fade-in">
                {/* Upper Section: Greeting & Quick Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {greeting()}, <span className="text-blue-600">Admin</span>
                        </h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2">
                            {t('dashboard_welcome_desc', 'Voici un aperçu de l\'activité de votre communauté aujourd\'hui.')}
                        </p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label={t('members', 'Membres')}
                        value={stats.members}
                        trend="+12%"
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        color="text-blue-600"
                        bg="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <StatCard
                        label={t('organizations', 'Églises')}
                        value={stats.organizations}
                        trend="+2"
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        color="text-purple-600"
                        bg="bg-purple-50 dark:bg-purple-900/20"
                    />
                    <StatCard
                        label={t('finances', 'Finances')}
                        value={`${stats.finances.toLocaleString()} HTG`}
                        trend={stats.financesTrend ? (parseFloat(stats.financesTrend) >= 0 ? '+' : '') + stats.financesTrend : '0%'}
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        color="text-green-600"
                        bg="bg-green-50 dark:bg-green-900/20"
                    />
                    <StatCard
                        label={t('events', 'Événements')}
                        value="8"
                        trend="En cours"
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        color="text-amber-600"
                        bg="bg-amber-50 dark:bg-amber-900/20"
                    />
                </div>

                {/* Main Content Area: Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Recent Members */}
                    <div className="lg:col-span-2 card p-0 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{t('recent_members', 'Membres Récents')}</h3>
                            <button onClick={() => navigate('/admin/members')} className="text-blue-600 text-[12px] font-semibold hover:underline">
                                {t('view_all', 'Voir tout')}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[11px] font-semibold text-gray-500 tracking-wider shadow-sm">{t('member', 'Membre')}</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-semibold text-gray-500 tracking-wider shadow-sm">{t('category', 'Catégorie')}</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-semibold text-gray-500 tracking-wider shadow-sm">{t('status', 'Statut')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {recentMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-[12px]">
                                                        {member.firstName?.[0]}{member.lastName?.[0]}
                                                    </div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-[13px]">{member.firstName} {member.lastName}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-[12px] font-medium text-gray-500">{member.subtype?.name || '-'}</td>
                                            <td className="px-8 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${member.status === 'Actif' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                                                    {member.status || 'Actif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Quick Insights */}
                    <div className="space-y-8">
                        <div className="card p-8 bg-blue-600 text-white border-none shadow-blue-100 dark:shadow-none">
                            <h3 className="text-lg font-bold">{t('quick_insight')}</h3>
                            <p className="text-blue-100 text-[13px] mt-2 leading-relaxed">
                                {t('insight_desc')}
                            </p>
                            <button className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-semibold text-[13px] transition-all">
                                {t('take_action')}
                            </button>
                        </div>

                        <div className="card p-8">
                            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{t('system_health')}</h3>
                            <div className="mt-6 space-y-6">
                                <HealthItem label={t('users_online')} value="24" color="bg-green-500" />
                                <HealthItem label={t('server_load')} value="12%" color="bg-blue-500" />
                                <HealthItem label={t('last_backup')} value={t('2h_ago')} color="bg-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

const StatCard = ({ label, value, trend, icon, color, bg }) => (
    <div className="card p-6 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-500 truncate">{label}</p>
            <div className="flex items-center gap-2 mt-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{value}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {trend}
                </span>
            </div>
        </div>
    </div>
);

const HealthItem = ({ label, value, color }) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <span className="text-[13px] font-medium text-gray-600 dark:text-gray-400">{label}</span>
        </div>
        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
);

export default AdminDashboard;
