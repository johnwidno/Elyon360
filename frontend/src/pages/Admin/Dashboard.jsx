import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import AdminLayout from '../../layouts/AdminLayout';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, UserCheck, UserPlus, Clock, Calendar, CheckCircle, ChevronRight,
    DollarSign, Activity, FileText
} from 'lucide-react';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        members: 1248,
        activeMembers: 864,
        organizations: 0,
        finances: 0
    });
    const [recentMembers, setRecentMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [membersRes, orgsRes, financesRes] = await Promise.all([
                    api.get('/members').catch(() => ({ data: [] })),
                    api.get('/organizations').catch(() => ({ data: [] })),
                    api.get('/donations/stats').catch(() => ({ data: {} }))
                ]);

                const memData = Array.isArray(membersRes.data) ? membersRes.data : [];
                const activeMem = memData.filter(m => m.status === 'Actif' || m.status === 'Active').length;
                const totalFinances = Object.values(financesRes.data || {}).reduce((acc, curr) => acc + (curr.balance || 0), 0);

                setStats({
                    members: memData.length > 0 ? memData.length : 1248,
                    activeMembers: activeMem > 0 ? activeMem : 864,
                    organizations: orgsRes.data?.length || 0,
                    finances: totalFinances,
                });
                setRecentMembers(memData.slice(0, 5));
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // ─── DUMMY DATA FOR CHARTS EXACTLY AS PICTURE ──────────────────────────

    const croissanceData = [
        { period: 'Jan', Membres: 1200, Visiteurs: 150 },
        { period: 'Fév', Membres: 1210, Visiteurs: 160 },
        { period: 'Mar', Membres: 1225, Visiteurs: 180 },
        { period: 'Avr', Membres: 1235, Visiteurs: 185 },
        { period: 'Mai', Membres: 1248, Visiteurs: 190 },
        { period: 'Juin', Membres: 1255, Visiteurs: 200 },
        { period: 'Juil', Membres: 1260, Visiteurs: 210 },
        { period: 'Août', Membres: 1275, Visiteurs: 205 },
        { period: 'Sep', Membres: 1280, Visiteurs: 215 },
        { period: 'Oct', Membres: 1290, Visiteurs: 220 },
        { period: 'Nov', Membres: 1300, Visiteurs: 230 },
        { period: 'Déc', Membres: 1315, Visiteurs: 250 },
    ];

    const revenusData = [
        { name: 'Jan', Dîmes: 42000, Offrandes: 12000, Dons: 10000 },
        { name: 'Fév', Dîmes: 40000, Offrandes: 15000, Dons: 8000 },
        { name: 'Mar', Dîmes: 45000, Offrandes: 18000, Dons: 9000 },
        { name: 'Avr', Dîmes: 50000, Offrandes: 15000, Dons: 12000 },
        { name: 'Mai', Dîmes: 48000, Offrandes: 14000, Dons: 11000 },
        { name: 'Juin', Dîmes: 52000, Offrandes: 20000, Dons: 15000 },
        { name: 'Juil', Dîmes: 55000, Offrandes: 22000, Dons: 14000 },
        { name: 'Août', Dîmes: 54000, Offrandes: 21000, Dons: 13000 },
        { name: 'Sep', Dîmes: 58000, Offrandes: 23000, Dons: 16000 },
        { name: 'Oct', Dîmes: 57000, Offrandes: 22000, Dons: 15000 },
        { name: 'Nov', Dîmes: 60000, Offrandes: 25000, Dons: 18000 },
        { name: 'Déc', Dîmes: 62000, Offrandes: 28000, Dons: 20000 },
    ];

    const repartitionData = [
        { name: 'Jeunesse', value: 45, color: '#10B981' }, // emerald
        { name: 'Dames', value: 32, color: '#A855F7' }, // purple
        { name: 'Hommes', value: 24, color: '#3B82F6' }, // blue
        { name: 'Enfants', value: 18, color: '#F59E0B' }, // amber
    ];

    const presencesData = [
        { week: 'Sem 1', Culte: 420, Ecole: 150, Priere: 120 },
        { week: 'Sem 2', Culte: 430, Ecole: 160, Priere: 125 },
        { week: 'Sem 3', Culte: 410, Ecole: 145, Priere: 110 },
        { week: 'Sem 4', Culte: 440, Ecole: 165, Priere: 130 },
        { week: 'Sem 5', Culte: 450, Ecole: 170, Priere: 140 },
        { week: 'Sem 6', Culte: 460, Ecole: 175, Priere: 145 },
        { week: 'Sem 7', Culte: 455, Ecole: 168, Priere: 135 },
        { week: 'Sem 8', Culte: 470, Ecole: 180, Priere: 150 },
    ];

    const eventsData = [
        { title: 'Culte du Dimanche', date: '15 Mar 2026', time: '09:00', loc: 'Sanctuaire Principal' },
        { title: 'Réunion de Prière', date: '17 Mar 2026', time: '18:30', loc: 'Salle Annexe' },
        { title: 'Convention Annuelle', date: '19 Mar 2026', time: '08:00', loc: 'Centre de Conférence' },
        { title: 'Baptême d\'Eau', date: '22 Mar 2026', time: '10:00', loc: 'Sanctuaire Principal' },
    ];

    const activiteData = [
        { icon: <DollarSign size={14} className="text-emerald-500" />, title: 'Don Reçu', desc: 'Anita Stocy | Pénitentiale', amount: '+200.00 HTG', date: '04/03/2026', bg: 'bg-emerald-900/30' },
        { icon: <DollarSign size={14} className="text-emerald-500" />, title: 'Dîme Reçue', desc: 'John Whites | D1A22', amount: '+2,500.00 HTG', date: '02/03/2026', bg: 'bg-emerald-900/30' },
        { icon: <UserPlus size={14} className="text-blue-500" />, title: 'Nouveau Membre', desc: 'Maxise Célestin', amount: '', date: '02/03/2026', bg: 'bg-blue-900/30' },
        { icon: <DollarSign size={14} className="text-emerald-500" />, title: 'Don Reçu', desc: 'Anita Stocy | Pénitentiale', amount: '+3,300.00 HTG', date: '01/03/2026', bg: 'bg-emerald-900/30' },
        { icon: <Calendar size={14} className="text-amber-500" />, title: 'Événement créé', desc: 'Convention annuelle', amount: '', date: '28/02/2026', bg: 'bg-amber-900/30' },
        { icon: <CheckCircle size={14} className="text-purple-500" />, title: 'Baptême', desc: '5 nouveaux baptisés', amount: '', date: '27/02/2026', bg: 'bg-purple-900/30' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-[#1A1E2E] p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 text-xs">
                    <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.name}:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

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
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <AdminLayout>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="p-4 md:p-6 lg:p-10 space-y-8 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0B0F19] min-h-screen"
            >
                {/* 1. KPIs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="TOTAL MEMBRES"
                        value={stats.members.toLocaleString()}
                        trend="+12.5%" trendLabel="Mois en cours"
                        icon={<Users size={18} />}
                        iconColor="text-indigo-400" iconBg="bg-indigo-900/30"
                        trendColor="text-emerald-400"
                        variants={itemVariants}
                    />
                    <KpiCard
                        title="MEMBRES ACTIFS"
                        value={stats.activeMembers.toLocaleString()}
                        trend="+4.2%" trendLabel="Membres en Règle"
                        icon={<UserCheck size={18} />}
                        iconColor="text-emerald-400" iconBg="bg-emerald-900/30"
                        trendColor="text-emerald-400"
                        variants={itemVariants}
                    />
                    <KpiCard
                        title="NOUVEAUX INSCRITS"
                        value="47"
                        trend="+16%" trendLabel="Ce mois"
                        icon={<UserPlus size={18} />}
                        iconColor="text-amber-400" iconBg="bg-amber-900/30"
                        trendColor="text-emerald-400"
                        variants={itemVariants}
                    />
                    <KpiCard
                        title="EN ATTENTE"
                        value="12"
                        trend="-2" trendLabel="Nouveaux arrivés"
                        icon={<Clock size={18} />}
                        iconColor="text-rose-400" iconBg="bg-rose-900/30"
                        trendColor="text-emerald-400"
                        variants={itemVariants}
                    />
                </div>

                {/* 2. Croissance & Events Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('member_growth', 'Croissance Membres')}</h3>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">{t('last_12_months', 'Évolution sur les 12 derniers mois')}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> {t('members')}</span>
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {t('visitors')}</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={croissanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorVisiteurs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Membres" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorMembres)" />
                                    <Area type="monotone" dataKey="Visiteurs" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisiteurs)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Right Events List */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('upcoming_events', 'Événements à Venir')}</h3>
                            <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">{t('view_all', 'Voir Plus')} →</button>
                        </div>
                        <div className="flex-1 space-y-6">
                            {eventsData.map((evt, idx) => (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={idx}
                                    className="flex items-start gap-5 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100/50 dark:border-white/5 transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-sm">
                                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none transition-colors group-hover:text-indigo-100">{evt.date.split(' ')[1]}</span>
                                        <span className="text-[18px] font-black leading-none mt-1 transition-colors">{evt.date.split(' ')[0]}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black text-gray-900 dark:text-gray-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{evt.title}</h4>
                                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-2">
                                            <Clock size={12} className="text-indigo-500/50" /> {evt.time} &nbsp;&bull;&nbsp; {evt.loc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* 3. Revenus & Repartition Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('financial_income', 'Revenus Financiers')}</h3>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">{t('income_desc', 'Dîmes, offrandes et dons par mois')}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> {t('tithes')}</span>
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {t('offerings')}</span>
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {t('donations')}</span>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenusData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `${val / 1000}k`} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                    <Bar dataKey="Dîmes" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={15} />
                                    <Bar dataKey="Offrandes" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={15} />
                                    <Bar dataKey="Dons" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Donut Chart */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('distribution_dept', 'Répartition par Département')}</h3>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">{t('active_members_ministry', 'Membres actifs par ministère')}</p>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center py-4">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={repartitionData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} stroke="none" dataKey="value" paddingAngle={6}>
                                        {repartitionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-6">
                            {repartitionData.map((entry, idx) => (
                                <div key={idx} className="flex justify-between items-center group cursor-default">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: entry.color }}></span>
                                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{entry.name}</span>
                                    </div>
                                    <span className="text-[13px] font-black text-gray-900 dark:text-white">{entry.value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* 4. Presences & Activite Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Line Chart Presences */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('weekly_presence', 'Présences Hebdomadaires')}</h3>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">{t('weekly_desc', 'Culte, école du dimanche et prière')}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> {t('service', 'Culte')}</span>
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {t('school', 'École')}</span>
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {t('prayer', 'Prière')}</span>
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={presencesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="Culte" stroke="#6366F1" strokeWidth={4} dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Line type="monotone" dataKey="Ecole" stroke="#10B981" strokeWidth={4} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Line type="monotone" dataKey="Priere" stroke="#F59E0B" strokeWidth={4} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Activite Recente */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-premium flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('recent_activity', 'Activité Récente')}</h3>
                            <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">{t('view_history', 'Voir Historique')}</button>
                        </div>
                        <div className="flex-1 space-y-5">
                            {activiteData.map((act, idx) => (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={idx}
                                    className="flex items-center justify-between group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl ${act.bg} flex items-center justify-center shrink-0 shadow-sm border border-transparent group-hover:border-white/10 transition-colors`}>
                                            {act.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-gray-900 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">{act.title}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tight">{act.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {act.amount ? (
                                            <div className="text-[12px] font-black text-emerald-500">{act.amount}</div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{act.date}</div>
                                        )}
                                        {act.amount && <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">{act.date}</div>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* 5. Derniers Membres Table */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-premium overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-black/10">
                        <h3 className="text-[16px] font-black text-gray-900 dark:text-white tracking-tight uppercase">{t('last_members_added', 'Derniers Membres Ajoutés')}</h3>
                        <button onClick={() => navigate('/admin/members')} className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">{t('more_members', 'Plus de Membres')} →</button>
                    </div>
                    <div className="overflow-x-auto noscrollbar">
                        <table className="w-full">
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {recentMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-indigo-50/30 dark:hover:bg-white/5 cursor-pointer transition-all group" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-[14px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[14px] shadow-sm group-hover:scale-105 transition-transform">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 dark:text-white text-[14px] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{member.firstName} {member.lastName}</div>
                                                    <div className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-1 tracking-tight">{member.email || member.phone || 'Sans Contact'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden sm:table-cell">
                                            {member.subtype?.name || 'Général'}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${member.status === 'Actif' || member.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                                                {t(member.status?.toLowerCase()) || member.status || 'Actif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-12 text-center text-xs text-gray-400 uppercase font-black tracking-widest opacity-50 italic">Aucun membre récent.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </motion.div>
        </AdminLayout>
    );
};

// Reusable KPI Card adapted precisely to the design
const KpiCard = ({ title, value, trend, trendLabel, icon, iconColor, iconBg, trendColor, variants }) => (
    <motion.div
        variants={variants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-premium relative overflow-hidden flex flex-col justify-between h-[150px] group transition-all"
    >
        <div className="flex justify-between items-start z-10">
            <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase">{title}</h4>
            <div className={`w-10 h-10 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 mt-1`}>
                {icon}
            </div>
        </div>
        <div className="z-10">
            <h2 className="text-[32px] font-black text-gray-900 dark:text-white leading-none mb-3 tracking-tighter">{value}</h2>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trendColor === 'text-emerald-400' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'} uppercase tracking-widest`}>{trend}</span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{trendLabel}</span>
            </div>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
    </motion.div>
);

export default AdminDashboard;

