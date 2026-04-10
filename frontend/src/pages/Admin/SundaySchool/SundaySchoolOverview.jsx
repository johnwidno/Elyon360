import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, BarChart, Bar
} from 'recharts';
import {
    Users, Layout, BookOpen, CheckCircle, AlertTriangle, TrendingUp,
    ArrowUpRight, ArrowDownRight, Calendar, UserPlus, GraduationCap,
    Layers, Activity, Heart, Bookmark, Award, FileText
} from 'lucide-react';

export default function SundaySchoolOverview() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState('attendance'); // 'attendance' | 'offering'

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

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
            </div>
        </AdminLayout>
    );

    const { kpis, weeklyTrend, classStats, transitionsDue, alerts, recentActivity } = stats || {};

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <AdminLayout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                <GraduationCap size={22} />
                            </div>
                            <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{t('sunday_school_module', 'Module École Dominicale')}</h4>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                            {t('dashboard_overview', 'Tableau de Bord')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg">
                            {isMonitor ? t('monitor_dashboard_desc', 'Gérez vos classes et suivez la présence de vos élèves.') : t('superintendent_dashboard_desc', 'Vue d\'ensemble de la santé et de la croissance du programme.')}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center gap-4">
                        <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                                <Activity size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{t('program_health', 'Santé du Programme')}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-gray-900 dark:text-white">{(kpis?.attendanceRate >= 85 ? 'Excellente' : kpis?.attendanceRate > 60 ? 'Bonne' : 'À suivre')}</span>
                                    <div className={`w-2 h-2 rounded-full ${kpis?.attendanceRate >= 85 ? 'bg-emerald-500' : kpis?.attendanceRate > 60 ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
                    <EnhancedKPICard
                        title={t('total_members', 'Élèves')}
                        value={kpis?.totalMembers}
                        icon={<Users size={20} />}
                        color="indigo"
                        trend={kpis?.newMembersThisMonth > 0 ? `+${kpis.newMembersThisMonth}` : null}
                        trendLabel={t('this_month', 'Ce mois')}
                    />
                    <EnhancedKPICard
                        title={t('active_classes', 'Classes')}
                        value={kpis?.activeClasses}
                        icon={<Layers size={20} />}
                        color="emerald"
                    />
                    <EnhancedKPICard
                        title={t('attendance_rate', 'Assiduité')}
                        value={kpis?.attendanceRate !== undefined ? `${kpis.attendanceRate}%` : '0%'}
                        icon={<CheckCircle size={20} />}
                        color="blue"
                        trend={kpis?.attendanceRate >= 85 ? "Optimal" : "Target 85%"}
                    />
                    <EnhancedKPICard
                        title={t('offering', 'Offrandes')}
                        value={`${kpis?.totalOfferingThisMonth || 0} HTG`}
                        icon={<Heart size={20} />}
                        color="rose"
                        trend={t('this_month')}
                    />
                    <EnhancedKPICard
                        title={t('monitors', 'Moniteurs')}
                        value={kpis?.totalMonitors}
                        icon={<Layout size={20} />}
                        color="amber"
                    />
                    <EnhancedKPICard
                        title={t('transitions', 'Transitions')}
                        value={kpis?.transitionsDueCount}
                        icon={<ArrowUpRight size={20} />}
                        color="violet"
                        alert={kpis?.transitionsDueCount > 5}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Main Content Area (8 Columns) */}
                    <div className="xl:col-span-8 space-y-10">
                        {/* Primary Charts Card */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1A1A1A] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{t('growth_and_attendance', 'Croissance & Assiduité')}</h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('last_8_weeks_stats', 'Statistiques sur les 8 dernières semaines')}</p>
                                </div>
                                <div className="flex bg-gray-50 dark:bg-black/40 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <button
                                        onClick={() => setActiveChart('attendance')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChart === 'attendance' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xl shadow-indigo-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
                                    >
                                        {t('attendance', 'Présence')}
                                    </button>
                                    <button
                                        onClick={() => setActiveChart('offering')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChart === 'offering' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xl shadow-indigo-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
                                    >
                                        {t('offerings', 'Offrandes')}
                                    </button>
                                </div>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AnimatePresence mode="wait">
                                        {activeChart === 'attendance' ? (
                                            <motion.div
                                                key="attendance"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="w-full h-full"
                                            >
                                                <AreaChart data={weeklyTrend}>
                                                    <defs>
                                                        <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8B5CF611" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={15} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                                                    <Tooltip
                                                        content={<CustomTooltip />}
                                                        cursor={{ stroke: '#6366F1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="present"
                                                        stroke="#6366F1"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#primaryGrad)"
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="offering"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="w-full h-full"
                                            >
                                                <BarChart data={weeklyTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB11" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={15} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                                                    <Tooltip content={<CustomTooltip currency="HTG" />} />
                                                    <Bar dataKey="offering" fill="#EC4899" radius={[8, 8, 0, 0]} animationDuration={1500} />
                                                </BarChart>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Transitions Section */}
                        {!isMonitor && (
                            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                                <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('pending_transitions', 'Transitions en Attente')}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t('members_eligible_promotion', 'Membres éligibles à un changement de classe')}</p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                        {transitionsDue?.length || 0} Critical
                                    </div>
                                </div>
                                <div className="p-2 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-black/20">
                                                <th className="px-8 py-5 rounded-l-2xl">{t('student', 'Élève')}</th>
                                                <th className="px-8 py-5">{t('current_class', 'Classe Actuelle')}</th>
                                                <th className="px-8 py-5">{t('age', 'Âge')}</th>
                                                <th className="px-8 py-5 rounded-r-2xl">{t('action_required', 'Action Requise')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {transitionsDue?.length > 0 ? transitionsDue.map((member, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-sm font-bold text-gray-400">{member.name[0]}</div>
                                                            <span className="font-bold text-gray-900 dark:text-white">{member.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-gray-500">{member.currentClass}</td>
                                                    <td className="px-8 py-6"><span className="px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400">{member.age} ans</span></td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-rose-500">
                                                            <AlertTriangle size={14} />
                                                            <span className="text-[11px] font-black uppercase tracking-widest">{member.reason}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="py-20 text-center">
                                                        <Bookmark size={40} className="mx-auto text-gray-100 mb-4 opacity-50" />
                                                        <p className="text-gray-400 font-bold tracking-widest text-[11px] uppercase">{t('no_transitions_needed', 'Aucune transition à prévoir pour le moment')}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar Area (4 Columns) */}
                    <div className="xl:col-span-4 space-y-10">
                        {/* Class Distribution Pie */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1A1A1A] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">{t('class_distribution', 'Répartition par Classe')}</h3>
                            <div className="h-64 relative mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={classStats || []}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="memberCount"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {classStats?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{kpis?.totalMembers}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('total', 'Total')}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {classStats?.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between text-[11px] font-bold">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span>{entry.name}</span>
                                        </div>
                                        <span className="text-gray-900 dark:text-white">{entry.memberCount} ({Math.round(entry.memberCount / kpis?.totalMembers * 100)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Critical Alerts Panel */}
                        {!isMonitor && (
                            <motion.div variants={itemVariants} className="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl shadow-indigo-600/20 text-white relative overflow-hidden">
                                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full translate-x-1/2 translate-y-1/2"></div>
                                <h3 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
                                    <AlertTriangle size={22} className="text-white/80" />
                                    {t('critical_alerts', 'Alertes Critiques')}
                                </h3>
                                <div className="space-y-4">
                                    <AlertRow icon={<Users size={16} />} title={t('monitors_alert', 'Moniteurs manquants')} value={alerts?.missingMonitorsCount} />
                                    <AlertRow icon={<FileText size={16} />} title={t('reports_alert', 'Rapports en attente')} value={alerts?.missingReportsCount} />
                                    <AlertRow icon={<TrendingUp size={16} />} title={t('low_attendance', 'Assiduité faible')} value={kpis?.attendanceRate < 70 ? `${kpis.attendanceRate}%` : null} />
                                </div>
                                <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/20">
                                    {t('resolve_alerts', 'Résoudre les alertes')}
                                </button>
                            </motion.div>
                        )}

                        {/* Activity Log */}
                        <motion.div variants={itemVariants} className="bg-white dark:bg-[#1A1A1A] p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('recent_flow', 'Flux récent')}</h3>
                                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-400">
                                    <Activity size={16} />
                                </div>
                            </div>
                            <div className="space-y-8 relative">
                                <div className="absolute left-[13px] top-2 bottom-6 w-px bg-gray-100 dark:bg-white/5"></div>
                                {recentActivity?.length > 0 ? recentActivity.map((act, i) => (
                                    <div key={i} className="flex gap-6 relative z-10">
                                        <div className="w-7 h-7 bg-white dark:bg-[#1A1A1A] border-2 border-indigo-100 dark:border-indigo-900/50 rounded-full flex items-center justify-center text-[10px] shrink-0 shadow-sm">
                                            {act.icon}
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">{act.text}</p>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatRelativeTime(act.time, t)}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-4 text-gray-400 italic text-sm">{t('no_activity', 'Pas d\'activité')}</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </AdminLayout>
    );
}

function EnhancedKPICard({ title, value, icon, color, trend, trendLabel, alert }) {
    const colorStyles = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    };

    return (
        <motion.div
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
            className={`bg-white dark:bg-[#1A1A1A] p-7 rounded-[2.5rem] border ${alert ? 'border-rose-200 dark:border-rose-900/30' : 'border-gray-100 dark:border-white/5'} shadow-sm relative overflow-hidden group`}
        >
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 ${colorStyles[color]}`}>
                        {icon}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</span>
                </div>
                <div className="flex items-end justify-between">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{value || 0}</h2>
                    {trend && (
                        <div className="text-right">
                            <p className="text-[13px] font-black text-emerald-500 leading-none mb-1">{trend}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{trendLabel}</p>
                        </div>
                    )}
                </div>
            </div>
            {alert && <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>}
        </motion.div>
    );
}

function AlertRow({ icon, title, value }) {
    if (value === null || value === undefined || (typeof value === 'number' && value === 0)) return null;
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-3">
                <span className="p-1.5 bg-white/10 rounded-lg">{icon}</span>
                <span className="text-xs font-bold text-white/90">{title}</span>
            </div>
            <span className="text-xs font-black text-white">{value}</span>
        </div>
    );
}

function CustomTooltip({ active, payload, label, currency = '' }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-black/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-5 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{label}</p>
                {payload.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-[15px] font-black text-gray-900 dark:text-white">
                            {entry.value.toLocaleString()} {currency}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.name}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function CustomPieTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-black/80 backdrop-blur-xl border border-gray-100 dark:border-white/10 p-4 rounded-xl shadow-2xl">
                <p className="text-xs font-black text-gray-900 dark:text-white mb-1">{data.name}</p>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-indigo-500">{data.memberCount} éléves</span>
                </div>
            </div>
        );
    }
    return null;
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
    if (diffInHours < 24) return `${t('today', 'Aujourd\'hui')} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (diffInDays === 1) return t('yesterday', 'Hier');
    return date.toLocaleDateString();
}
