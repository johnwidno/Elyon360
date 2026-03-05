import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MemberForm from '../../../components/Admin/MemberForm';
import { useLanguage } from '../../../context/LanguageContext';

const CurrentTime = () => {
    const { language } = useLanguage();
    const [date, setDate] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5 whitespace-nowrap tracking-wider transition-all">
            {date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })} • {date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
        </span>
    );
};

const ContactsOverview = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeMembers: 0,
        totalVisitors: 0,
        totalOrganizations: 0,
        gender: { male: 0, female: 0 },
        status: { active: 0, inactive: 0, traveling: 0, deceased: 0, transferred: 0, abandoned: 0 },
        types: {}
    });
    const [recentMembers, setRecentMembers] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subtypes, setSubtypes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, visitorsRes, orgsRes, subtypesRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/visitors'),
                    api.get('/organizations'),
                    api.get('/contacts/classification/subtypes')
                ]);

                const members = membersRes.data;
                const fetchedSubtypes = subtypesRes.data;
                setSubtypes(fetchedSubtypes);

                // Gender Stats
                const male = members.filter(m => m.gender === 'M' || m.gender === 'Masculin').length;
                const female = members.filter(m => m.gender === 'F' || m.gender === 'Féminin').length;

                // Status Stats
                const statusCounts = {
                    active: members.filter(m => m.status === 'Actif').length,
                    inactive: members.filter(m => m.status === 'Inactif').length,
                    traveling: members.filter(m => m.status === 'En déplacement').length,
                    deceased: members.filter(m => m.status === 'Décédé').length,
                    transferred: members.filter(m => m.status === 'Transféré').length,
                    abandoned: members.filter(m => m.status === 'Abandonné').length,
                };

                // Type Stats (Categories)
                const typeCounts = {};
                members.forEach(m => {
                    if (m.subtypeId) {
                        const typeName = fetchedSubtypes.find(s => s.id === m.subtypeId)?.name || 'Autre';
                        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
                    } else {
                        typeCounts['Non classifié'] = (typeCounts['Non classifié'] || 0) + 1;
                    }
                });

                setStats({
                    totalMembers: members.length,
                    activeMembers: members.filter(m => m.status === 'Actif').length,
                    totalVisitors: visitorsRes.data.length,
                    totalOrganizations: orgsRes.data.length,
                    gender: { male, female },
                    status: statusCounts,
                    types: typeCounts
                });

                // Recent Members (Last 5)
                const sortedMembers = [...members].sort((a, b) => b.id - a.id);
                setRecentMembers(sortedMembers.slice(0, 5));

                // Growth Data (Last 6 Months)
                const last6Months = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    last6Months.push(d);
                }

                const chartData = last6Months.map(monthDate => {
                    const monthKey = monthDate.toLocaleString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' });
                    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
                    const count = members.filter(m => new Date(m.createdAt) < nextMonth).length;
                    return { name: monthKey, membres: count };
                });
                setGrowthData(chartData);

            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [language]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            navigate(`/admin/members?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl transition-all border border-indigo-100/50 dark:border-white/5 group-hover:scale-105 shadow-stripe">
                            <svg className="h-8 w-8 text-stripe-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-[10px] font-black text-stripe-blue tracking-[0.1em]">
                                <span className="w-8 h-[2px] bg-stripe-blue"></span>
                                <span>{t('contacts_dashboard', 'Contacts')}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                {t('contacts_overview', 'Gestion des Contacts')}
                            </h1>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">
                                {t('overview_stats_desc', 'Analysez et gérez vos membres, visiteurs et organisations partenaires.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                        <CurrentTime />
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative group flex-1 sm:flex-none">
                                <svg className="w-4 h-4 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-stripe-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={`${t('search_member')}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                    className="pl-12 pr-6 py-3.5 bg-white dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue w-full sm:w-64 transition-all dark:text-white placeholder-gray-400/60 shadow-stripe outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-stripe-blue text-white px-8 py-3.5 rounded-2xl font-black text-[11px] tracking-widest shadow-premium hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('new_member', 'Nouveau')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title={t('total_members', 'Membres')}
                        value={stats.totalMembers}
                        trend="+2.1%"
                        trendUp={true}
                        subtitle={t('all_time_members', 'Base totale')}
                        icon="👥"
                        color="indigo"
                        onClick={() => navigate('/admin/members')}
                    />
                    <StatCard
                        title={t('active_members', 'Actifs')}
                        value={stats.activeMembers}
                        trend="+3.8%"
                        trendUp={true}
                        subtitle={t('currently_active', 'Membres engagés')}
                        icon="✅"
                        color="emerald"
                        onClick={() => navigate('/admin/members?status=Actif')}
                    />
                    <StatCard
                        title={t('total_visitors', 'Visiteurs')}
                        value={stats.totalVisitors}
                        trend="-1.5%"
                        trendUp={false}
                        subtitle={t('total_visitors_desc', 'Flux de visiteurs')}
                        icon="👋"
                        color="purple"
                        onClick={() => navigate('/admin/visitors')}
                    />
                    <StatCard
                        title={t('organizations', 'Partenaires')}
                        value={stats.totalOrganizations}
                        trend="+1.6%"
                        trendUp={true}
                        subtitle={t('org_total_count', 'Organisations liées')}
                        icon="🏢"
                        color="orange"
                        onClick={() => navigate('/admin/organizations')}
                    />
                </div>

                {/* Charts & Table Row */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left: Growth Chart & Distributions */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Growth Chart */}
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/5 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                        {t('church_growth', 'Croissance de la Communauté')}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">Évolution des membres sur 6 mois</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-black text-gray-500 tracking-widest leading-none">Live</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#635bff" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a2540', borderRadius: '16px', border: 'none', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)' }}
                                            itemStyle={{ color: '#00d4ff', fontWeight: '900', fontSize: '10px' }}
                                        />
                                        <Area type="monotone" dataKey="membres" name={t('members', 'Membres')} stroke="#635bff" strokeWidth={3} fillOpacity={1} fill="url(#colorMembres)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribution Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Gender Distribution */}
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/5 transition-all">
                                <h3 className="text-md font-black text-gray-900 dark:text-white tracking-tight mb-8">
                                    {t('by_gender', 'Répartition par Sexe')}
                                </h3>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black tracking-widest">
                                            <span className="text-gray-400">{t('men', 'Hommes')}</span>
                                            <span className="text-indigo-600">{stats.gender.male}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                                style={{ width: `${(stats.gender.male / (stats.totalMembers || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black tracking-widest">
                                            <span className="text-gray-400">{t('women', 'Femmes')}</span>
                                            <span className="text-pink-500">{stats.gender.female}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                                                style={{ width: `${(stats.gender.female / (stats.totalMembers || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-center">
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                                        <span className="text-lg font-black dark:text-white leading-none">{stats.totalMembers}</span>
                                        <span className="text-[8px] text-gray-400 font-bold tracking-widest mt-1">Total</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Distribution */}
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/5 transition-all">
                                <h3 className="text-md font-black text-gray-900 dark:text-white tracking-tight mb-8">
                                    {t('by_status', 'Statuts des Membres')}
                                </h3>
                                <div className="space-y-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.entries(stats.status).map(([status, count]) => {
                                        if (count === 0 && status !== 'active') return null;
                                        const color = {
                                            active: 'bg-emerald-500',
                                            inactive: 'bg-gray-400',
                                            traveling: 'bg-amber-500',
                                            deceased: 'bg-indigo-900',
                                            transferred: 'bg-blue-400',
                                            abandoned: 'bg-red-400'
                                        }[status] || 'bg-gray-200';

                                        const label = t(status) || status.charAt(0).toUpperCase() + status.slice(1);

                                        return (
                                            <div key={status} className="group">
                                                <div className="flex justify-between text-[10px] font-black tracking-widest mb-2 transition-colors group-hover:text-indigo-500">
                                                    <span className="text-gray-400 group-hover:text-indigo-500">{label}</span>
                                                    <span className="text-gray-900 dark:text-white">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`${color} h-full rounded-full transition-all duration-1000`}
                                                        style={{ width: `${(count / (stats.totalMembers || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recent Members Feed */}
                    <div className="xl:col-span-4 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-premium border border-gray-100 dark:border-white/5 h-fit transition-all">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-md font-black text-gray-900 dark:text-white tracking-tight">
                                {t('recent_additions', 'Derniers Inscrits')}
                            </h3>
                            <button onClick={() => navigate('/admin/members')} className="text-[10px] font-black text-stripe-blue tracking-widest underline underline-offset-4">
                                {t('view_all', 'Tout voir')}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-4">
                                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black tracking-widest">{t('loading')}</p>
                                </div>
                            ) : recentMembers.length === 0 ? (
                                <div className="py-20 text-center text-gray-300 opacity-50 font-black tracking-widest text-[10px]">
                                    {t('no_recent_members', 'Aucun membre récent')}
                                </div>
                            ) : (
                                recentMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => navigate(`/admin/members/${member.id}`)}
                                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-100 dark:border-indigo-800/20 overflow-hidden group-hover:scale-110 transition-transform">
                                                {member.photo ? (
                                                    <img src={member.photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[13px]">{member.firstName?.[0]}{member.lastName?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[14px] font-black text-gray-900 dark:text-white truncate tracking-tight">
                                                    {member.firstName} {member.lastName}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest mt-0.5">
                                                    {new Date(member.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${member.status === 'Actif' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`}></div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/admin/members')}
                            className="w-full mt-8 py-4 bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:text-indigo-500 font-black text-[10px] rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/20 transition-all tracking-[0.2em] shadow-sm"
                        >
                            {t('view_all_members', 'Liste Complète')} →
                        </button>
                    </div>
                </div>
            </div>

            <MemberForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => window.location.reload()}
                subtypes={subtypes}
            />
        </AdminLayout>
    );
};

// Unified StatCard for consistency
const StatCard = ({ title, value, trend, trendUp, subtitle, icon, color, onClick }) => {
    const colorVariants = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/10 text-stripe-blue border-indigo-100/50',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100/50',
        purple: 'bg-purple-50 dark:bg-purple-900/10 text-stripe-purple border-purple-100/50',
        orange: 'bg-orange-50 dark:bg-orange-900/10 text-orange-600 border-orange-100/50',
        blue: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 border-blue-100/50'
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 shadow-premium border border-gray-100 dark:border-white/5 transition-all hover:shadow-premium-hover hover:-translate-y-1 duration-300 group cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest">{title}</p>
                        <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{value}</h4>
                    </div>
                    {trend && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </span>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-2xl ${colorVariants[color] || colorVariants.indigo} border flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest leading-none">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

export default ContactsOverview;
