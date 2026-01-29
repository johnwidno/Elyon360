import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/useAuth';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export default function SundaySchoolOverview() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const roles = Array.isArray(user?.role) ? user.role : [user?.role];
    const isMonitor = roles.includes('monitor') && !roles.includes('admin') && !roles.includes('super_admin');

    const fetchStats = async () => {
        try {
            const res = await api.get('/sunday-school/stats');
            setStats(res.data);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </AdminLayout>
    );

    const { kpis, weeklyTrend, classStats, transitionsDue, alerts, recentActivity } = stats || {};

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('sunday_school')} <span className="text-indigo-600 dark:text-indigo-400">{t('overview')}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {isMonitor ? t('monitor_dashboard_desc', 'Gérez vos classes et suivez la présence.') : t('dashboard_welcome_desc')}
                    </p>
                </div>
                {!isMonitor && (
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                            {t('superintendent_view', 'Vue Surintendant')}
                        </div>
                    </div>
                )}
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
                <KPICard
                    title={t('total_members')}
                    value={kpis?.totalMembers}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="indigo"
                />
                <KPICard
                    title={t('total_active_classes')}
                    value={kpis?.activeClasses}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="emerald"
                />
                <KPICard
                    title={t('monitors')}
                    value={kpis?.totalMonitors}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="amber"
                />
                <KPICard
                    title={t('attendance_rate')}
                    value={`${kpis?.attendanceRate}%`}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="blue"
                />
                <KPICard
                    title={t('new_members')}
                    value={kpis?.newMembersThisMonth}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="rose"
                />
                <KPICard
                    title={t('transitions_due')}
                    value={kpis?.transitionsDueCount}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                    color="violet"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Column 1 & 2: Charts & Transitions */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Attendance Chart */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('attendance_trend')}</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('last_8_weeks')}</span>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyTrend}>
                                    <defs>
                                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB33" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="present" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transition Monitor */}
                    {!isMonitor && (
                        <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('near_transition')}</h3>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    {transitionsDue?.length || 0} {t('members_flagged', 'Membres')}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-white/5">
                                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('name')}</th>
                                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('current_class')}</th>
                                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('age')}</th>
                                            <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('transition_reason')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {transitionsDue?.length > 0 ? transitionsDue.map((member, i) => (
                                            <tr key={i} className="group">
                                                <td className="py-4 font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{member.name}</td>
                                                <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{member.currentClass}</td>
                                                <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">{member.age} ans</td>
                                                <td className="py-4">
                                                    <span className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                                                        {member.reason}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="py-10 text-center text-gray-400 italic text-sm">
                                                    {t('no_transitions_due', 'Aucune transition nécessaire pour le moment.')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 3: Stats & Alerts */}
                <div className="space-y-8">
                    {/* Distribution Pie */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">{t('class_distribution')}</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={classStats || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        dataKey="memberCount"
                                        nameKey="name"
                                        stroke="none"
                                    >
                                        {classStats?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Alerts Panel */}
                    {!isMonitor && (
                        <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">{t('alerts_notifications')}</h3>
                            <div className="space-y-4">
                                {alerts?.missingMonitorsCount > 0 && (
                                    <AlertItem
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                                        label={t('missing_monitors')}
                                        value={alerts.missingMonitorsCount}
                                        color="amber"
                                    />
                                )}
                                {alerts?.missingReportsCount > 0 && (
                                    <AlertItem
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                                        label={t('pending_reports', 'Rapports en attente')}
                                        value={alerts.missingReportsCount}
                                        color="indigo"
                                    />
                                )}
                                {kpis?.attendanceRate < 70 && (
                                    <AlertItem
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                                        label={t('low_attendance_alert', 'Baisse de fréquentation')}
                                        value={`${kpis?.attendanceRate}%`}
                                        color="rose"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">{t('recent_activity')}</h3>
                        <div className="space-y-6">
                            {recentActivity?.length > 0 ? recentActivity.map((act, i) => (
                                <ActivityItem
                                    key={i}
                                    icon={act.icon}
                                    text={act.text}
                                    time={formatRelativeTime(act.time, t)}
                                />
                            )) : (
                                <div className="text-center py-6 text-gray-400 italic text-sm">
                                    {t('no_recent_activity', 'Aucune activité récente.')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function KPICard({ title, value, icon, color }) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${colors[color]}`}>
                    {icon}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {value ?? 0}
            </div>
        </div>
    );
}

function AlertItem({ icon, label, value, color }) {
    const colors = {
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
        rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    {icon}
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <span className={`text-sm font-black ${colors[color]} px-2 py-0.5 rounded-lg`}>{value}</span>
        </div>
    );
}

function ActivityItem({ icon, text, time }) {
    return (
        <div className="flex gap-4">
            <div className="text-lg">{icon}</div>
            <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{text}</p>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">{time}</span>
            </div>
        </div>
    );
}

function formatRelativeTime(dateString, t) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return t('just_now', 'À l\'instant');
    if (diffInMinutes < 60) return `${t('ago', 'Il y a')} ${diffInMinutes}m`;
    if (diffInHours < 24) return `${t('ago', 'Il y a')} ${diffInHours}h`;
    if (diffInDays === 1) return t('yesterday', 'Hier');
    return date.toLocaleDateString();
}
