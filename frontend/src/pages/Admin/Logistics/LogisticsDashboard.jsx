import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAuth } from '../../../auth/AuthProvider';
import { useLanguage } from '../../../context/LanguageContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import api from '../../../api/axios';

export default function LogisticsDashboard() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await api.get('/logistics/dashboard/stats');
            setStats(res.data.overview);
        } catch (error) {
            console.error("Erreur stats logistique:", error);
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

    const {
        totalBuildings, totalRooms, roomsAvailable, roomsInMaintenance,
        todaysReservations, weeklyReservations, activeReservations,
        totalResources, equipmentAvailable, equipmentRepair, equipmentBroken,
        maintenanceRequests, spaceDistribution, reservationHistory, alerts
    } = stats || {};

    // Mock data if backend returns empty arrays for visualization purposes
    const pieData = spaceDistribution?.length > 0 ? spaceDistribution : [
        { name: 'Principal', value: 4 },
        { name: 'Annexe', value: 3 },
        { name: 'Jeunesse', value: 2 }
    ];

    const areaData = reservationHistory?.length > 0 ? reservationHistory : [
        { month: 'Jan', bookings: 12 },
        { month: 'Feb', bookings: 19 },
        { month: 'Mar', bookings: 15 },
        { month: 'Apr', bookings: 25 },
        { month: 'May', bookings: 32 },
        { month: 'Jun', bookings: 28 },
    ];

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('logistics', 'Logistique')} <span className="text-indigo-600 dark:text-indigo-400">{t('overview', 'Vue d\'ensemble')}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {t('logistics_welcome_desc', 'Gérez vos espaces, ressources et réservations en un coup d\'œil.')}
                    </p>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10 animate-fade-in-up delay-100">
                <KPICard title={t('total_rooms', 'Salles Totales')} value={totalRooms} icon="office-building" color="indigo" />
                <KPICard title={t('available_rooms', 'Disponibles')} value={roomsAvailable} icon="check-circle" color="emerald" />
                <KPICard title={t('active_now', 'Activités (Live)')} value={activeReservations} icon="clock" color="violet" />
                <KPICard title={t('week_bookings', 'Cette Semaine')} value={weeklyReservations} icon="calendar" color="blue" />
                <KPICard title={t('equipment_ok', 'Matériels Disp.')} value={equipmentAvailable} icon="cube" color="amber" />
                <KPICard title={t('maintenance', 'Maintenance')} value={maintenanceRequests} icon="tool" color="rose" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
                {/* Main Stats Area */}
                <div className="xl:col-span-2 space-y-8 animate-fade-in-up delay-200">

                    {/* Reservation History Chart */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">{t('reservation_history', 'Historique des Réservations')}</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={areaData}>
                                    <defs>
                                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="bookings" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorBookings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {alerts && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Conflicts Alert */}
                            <AlertCard
                                title="Conflits de Réservation"
                                count={alerts.conflicts}
                                type="critical"
                                desc="Réservations qui se chevauchent."
                            />
                            {/* Capacity Alert */}
                            <AlertCard
                                title="Surcharge de Capacité"
                                count={alerts.capacityOverflow}
                                type="warning"
                                desc="Participants > Capacité de la salle."
                            />
                            {/* No Responsible Alert */}
                            <AlertCard
                                title="Sans Responsable"
                                count={alerts.noResponsible}
                                type="warning"
                                desc="Activités sans organisateur assigné."
                            />
                            {/* Blocking Maintenance */}
                            <AlertCard
                                title="Maintenance Bloquante"
                                count={alerts.maintenanceBlocking}
                                type="critical"
                                desc="Activités prévues dans des salles en maintenance."
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8 animate-fade-in-up delay-300">
                    {/* Space Distribution Pie */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">{t('space_usage', 'Répartition des Espaces')}</h3>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">{totalRooms}</span>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('rooms')}</span>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Equipment Status Status */}
                    <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">{t('equipment_status', 'État du Matériel')}</h3>

                        <div className="space-y-4">
                            <ProgressBar label="Bon État" value={equipmentAvailable} total={totalResources} color="bg-emerald-500" />
                            <ProgressBar label="À Réparer" value={equipmentRepair} total={totalResources} color="bg-amber-500" />
                            <ProgressBar label="Hors Service" value={equipmentBroken} total={totalResources} color="bg-rose-500" />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Components
function KPICard({ title, value, icon, color }) {
    const icons = {
        'office-building': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
        'check-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
        'clock': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        'calendar': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        'cube': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        'tool': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    };

    const bgColors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${bgColors[color]}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icons[icon]}
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {value ?? 0}
            </div>
        </div>
    );
}

function AlertCard({ title, count, type, desc }) {
    if (count === 0) return (
        <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 opacity-60">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <h4 className="font-bold text-gray-500">{title}</h4>
            </div>
            <p className="text-xs text-gray-400">Aucune alerte détectée.</p>
        </div>
    );

    const isCritical = type === 'critical';
    const bgClass = isCritical ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20';
    const textClass = isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';

    return (
        <div className={`p-6 rounded-3xl border ${bgClass} relative overflow-hidden group hover:shadow-md transition-all`}>
            {isCritical && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-[3rem] -mr-4 -mt-4 animate-pulse"></div>}

            <div className="flex justify-between items-start mb-2 relative z-10">
                <h4 className={`font-bold ${textClass} flex items-center gap-2`}>
                    {isCritical ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {title}
                </h4>
                <span className={`text-2xl font-black ${textClass}`}>{count}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium relative z-10">{desc}</p>
        </div>
    );
}

function ProgressBar({ label, value, total, color }) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{value} ({percentage}%)</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
