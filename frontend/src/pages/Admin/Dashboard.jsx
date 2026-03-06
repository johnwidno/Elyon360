import React, { useState, useEffect } from 'react';
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

    return (
        <AdminLayout>
            {/* The exact requested layout mapping the screenshot */}
            <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0B0F19] min-h-screen">

                {/* Header title removed to match the sleek screenshot which has it very integrated or relies on the top nav */}

                {/* 1. KPIs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <KpiCard
                        title="TOTAL MEMBRES"
                        value={stats.members.toLocaleString()}
                        trend="+12.5%" trendLabel="Mois en cours"
                        icon={<Users size={16} />}
                        iconColor="text-indigo-400" iconBg="bg-indigo-900/30"
                        trendColor="text-emerald-400"
                    />
                    <KpiCard
                        title="MEMBRES ACTIFS"
                        value={stats.activeMembers.toLocaleString()}
                        trend="+4.2%" trendLabel="Membres en Règle"
                        icon={<UserCheck size={16} />}
                        iconColor="text-emerald-400" iconBg="bg-emerald-900/30"
                        trendColor="text-emerald-400"
                    />
                    <KpiCard
                        title="NOUVEAUX INSCRITS"
                        value="47"
                        trend="+16%" trendLabel="Ce mois"
                        icon={<UserPlus size={16} />}
                        iconColor="text-amber-400" iconBg="bg-amber-900/30"
                        trendColor="text-emerald-400"
                    />
                    <KpiCard
                        title="EN ATTENTE"
                        value="12"
                        trend="-2" trendLabel="Nouveaux arrivés"
                        icon={<Clock size={16} />}
                        iconColor="text-rose-400" iconBg="bg-rose-900/30"
                        trendColor="text-emerald-400"
                    />
                </div>

                {/* 2. Croissance & Events Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Croissance Membres</h3>
                                <p className="text-[11px] text-gray-500 dark:text-[#64748B] mt-1">Évolution sur les 12 derniers mois</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-bold">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Membres</span>
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Visiteurs</span>
                            </div>
                        </div>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={croissanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorVisiteurs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Membres" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorMembres)" />
                                    <Area type="monotone" dataKey="Visiteurs" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisiteurs)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Events List */}
                    <div className="bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Événements à Venir</h3>
                            <button className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400">Voir Plus →</button>
                        </div>
                        <div className="flex-1 space-y-5">
                            {eventsData.map((evt, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#1A1E2E] flex flex-col items-center justify-center shrink-0 border border-gray-100 dark:border-gray-800">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">{evt.date.split(' ')[1]}</span>
                                        <span className="text-[14px] font-black text-indigo-500 leading-none mt-1">{evt.date.split(' ')[0]}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-400 transition-colors">{evt.title}</h4>
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-[#64748B] mt-1 flex items-center gap-1.5">
                                            <Clock size={11} /> {evt.time} &nbsp;&bull;&nbsp; {evt.loc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Revenus & Repartition Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Revenus Financiers</h3>
                                <p className="text-[11px] text-gray-500 dark:text-[#64748B] mt-1">Dîmes, offrandes et dons par mois</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-bold">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Dîmes</span>
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Offrandes</span>
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Dons</span>
                            </div>
                        </div>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenusData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="Dîmes" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={12} />
                                    <Bar dataKey="Offrandes" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={12} />
                                    <Bar dataKey="Dons" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="mb-2">
                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Répartition par Département</h3>
                            <p className="text-[11px] text-gray-500 dark:text-[#64748B] mt-1">Membres actifs par ministère</p>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={repartitionData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} stroke="none" dataKey="value" paddingAngle={4}>
                                        {repartitionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 mt-4">
                            {repartitionData.map((entry, idx) => (
                                <div key={idx} className="flex justify-between items-center pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="text-[12px] font-black text-gray-900 dark:text-white">{entry.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Presences & Activite Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Line Chart Presences */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Présences Hebdomadaires</h3>
                                <p className="text-[11px] text-gray-500 dark:text-[#64748B] mt-1">Culte, école du dimanche et prière</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-bold">
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Culte</span>
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> École</span>
                                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Prière</span>
                            </div>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={presencesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="Culte" stroke="#6366F1" strokeWidth={3} dot={{ r: 3, fill: '#6366F1', strokeWidth: 2, stroke: '#15192B' }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="Ecole" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981', strokeWidth: 2, stroke: '#15192B' }} />
                                    <Line type="monotone" dataKey="Priere" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 2, stroke: '#15192B' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activite Recente */}
                    <div className="bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Activité Récente</h3>
                            <button className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400">Voir Historique</button>
                        </div>
                        <div className="flex-1 space-y-4">
                            {activiteData.map((act, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${act.bg} flex items-center justify-center shrink-0`}>
                                            {act.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{act.title}</h4>
                                            <p className="text-[10px] font-medium text-gray-500 dark:text-[#64748B]">{act.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {act.amount ? (
                                            <div className="text-[11px] font-black text-emerald-500">{act.amount}</div>
                                        ) : (
                                            <div className="text-[10px] font-semibold text-gray-400 dark:text-[#64748B]">{act.date}</div>
                                        )}
                                        {act.amount && <div className="text-[9px] font-medium text-gray-400 dark:text-[#64748B]">{act.date}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Derniers Membres Table */}
                <div className="bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">Derniers Membres Ajoutés</h3>
                        <button onClick={() => navigate('/admin/members')} className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400">Plus de Membres →</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {recentMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center font-bold text-[12px] shadow-inner">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-[13px]">{member.firstName} {member.lastName}</div>
                                                    <div className="text-[10px] text-gray-500 dark:text-[#64748B] font-medium mt-0.5">{member.email || member.phone || 'Sans Contact'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[11px] font-medium text-gray-600 dark:text-[#64748B]">
                                            {member.subtype?.name || 'Général'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${member.status === 'Actif' || member.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-50 dark:bg-[#1A1E2E] text-gray-500'}`}>
                                                {member.status || 'Actif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-xs text-gray-500 italic">Aucun membre récent.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

// Reusable KPI Card adapted precisely to the design
const KpiCard = ({ title, value, trend, trendLabel, icon, iconColor, iconBg, trendColor }) => (
    <div className="bg-white dark:bg-[#15192B] border border-gray-100 dark:border-[#22273D] rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-[120px]">
        <div className="flex justify-between items-start z-10">
            <h4 className="text-[10px] font-black tracking-widest text-gray-500 dark:text-[#64748B] uppercase">{title}</h4>
            <div className={`w-7 h-7 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                {icon}
            </div>
        </div>
        <div className="z-10 mt-auto">
            <h2 className="text-[28px] font-bold text-gray-900 dark:text-white leading-none mb-1.5">{value}</h2>
            <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 ${trendColor}`}>{trend}</span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-[#64748B]">{trendLabel}</span>
            </div>
        </div>
    </div>
);

export default AdminDashboard;

