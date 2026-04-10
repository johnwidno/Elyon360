import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useLanguage } from '../../context/LanguageContext';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4318FF', '#6Ad2FF', '#EFF4FB', '#05CD99', '#FFB547'];

// Helper for adaptive legend text
const renderLegendText = (value, entry) => {
    return <span className="text-[#2B3674] dark:text-white font-medium ml-2">{value}</span>;
};

// Icons using simple emojis or SVGs where possible to avoid external icon deps unless already present
const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const NotificationIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export default function AdminHome() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Mock data initialization (structure matching new backend)
    const [graphData, setGraphData] = useState({
        memberGrowth: [],
        financesTrend: [],
        demographics: [],
        genderDistribution: [],
        availableCurrencies: ['HTG'] // Default
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/churches/dashboard-stats');
                setStats(res.data);

                // Map real data to charts
                const demoOrder = ['Enfants', 'Ados', 'Jeunes', 'Adultes', 'Aînés'];
                const sortedDemographics = Array.isArray(res.data?.demographics)
                    ? res.data.demographics.sort((a, b) => {
                        const nameA = a.name.split(' ')[0]; // Extract "Enfants" from "Enfants (0-8)"
                        const nameB = b.name.split(' ')[0];
                        return demoOrder.indexOf(nameA) - demoOrder.indexOf(nameB);
                    })
                    : [];

                setGraphData({
                    memberGrowth: Array.isArray(res.data?.memberGrowth) ? res.data.memberGrowth : [],
                    financesTrend: Array.isArray(res.data?.financesTrend) ? res.data.financesTrend : [],
                    demographics: sortedDemographics,
                    genderDistribution: Array.isArray(res.data?.genderDistribution) ? res.data.genderDistribution : [],
                    availableCurrencies: Array.isArray(res.data?.availableCurrencies) ? res.data.availableCurrencies : ['HTG']
                });
            } catch (error) {
                console.error("Erreur stats dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Search functionality
    useEffect(() => {
        const searchMembers = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            try {
                const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data);
                setShowSearchResults(true);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]);
            }
        };

        const timeoutId = setTimeout(searchMembers, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSearchResultClick = (memberId) => {
        setSearchQuery('');
        setShowSearchResults(false);
        navigate(`/admin/members/${memberId}`);
    };

    const hasFinances = user?.role === 'admin' || user?.permissions?.includes('view_finances');

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">
                {/* Header & Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-[10px] font-black text-brand-primary tracking-[0.2em]">
                            <span className="w-8 h-[2px] bg-brand-primary"></span>
                            <span>{t('dashboard', 'Tableau de bord')}</span>
                        </div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight leading-none">
                            {t('main_dashboard', 'Vue d\'ensemble')}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium">
                            {t('dashboard_subtitle', 'Gérez les activités, les membres et les finances de votre institution.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_members_placeholder', 'Rechercher un membre...')}
                                className="pl-12 pr-4 py-3 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary w-full md:w-80 transition-all shadow-sm"
                            />
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 max-h-[400px] overflow-y-auto p-2 backdrop-blur-xl">
                                    {searchResults.map((member) => (
                                        <div
                                            key={member.id}
                                            onClick={() => handleSearchResultClick(member.id)}
                                            className="flex items-center gap-3 p-3 hover:bg-brand-primary/5 dark:hover:bg-brand-primary/20 rounded-xl cursor-pointer transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-orange flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">
                                                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium truncate">{member.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="p-3 bg-white dark:bg-[#1e293b] text-gray-400 hover:text-brand-primary rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all relative">
                            <NotificationIcon />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-brand-orange rounded-full border-2 border-white dark:border-[#1e293b]"></span>
                        </button>
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard
                        title={t('total_members', 'Membres')}
                        value={stats?.memberCount || 0}
                        trend="+2.4%"
                        trendUp={true}
                        subtitle={t('since_its_existence', 'Total cumulé')}
                        icon="👥"
                        color="brand"
                    />
                    <StatCard
                        title={t('active', 'Actifs')}
                        value={stats?.memberactifCount || 0}
                        subtitle={t('active_members_total', 'Membres en règle')}
                        icon="✅"
                        color="emerald"
                    />
                    <StatCard
                        title={t('visitors', 'Visiteurs')}
                        value={stats?.visitorCount || 0}
                        subtitle={t('total_registered', 'Nouveaux inscrits')}
                        icon="👋"
                        color="blue"
                    />
                    <StatCard
                        title={t('organizations', 'Groupes & Orgs')}
                        value={(stats?.organizationCount || 0) + (stats?.groupCount || 0)}
                        trend="+1.0%"
                        trendUp={true}
                        subtitle={t('active_partners', 'Structure active')}
                        icon="🏢"
                        color="purple"
                    />
                </div>

                {/* Main Grid: Charts & Feeds */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left Column: Charts */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Member Growth */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black dark:text-white tracking-tight">
                                        {t('member_growth', 'Croissance de la Communauté')}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('last_30_days_growth', 'Évolution sur les 30 derniers jours')}</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Live</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></div>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={graphData.memberGrowth}>
                                        <defs>
                                            <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1a1f4d" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#1a1f4d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: '16px',
                                                border: 'none',
                                                color: '#fff',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="members" name={t('members', 'Membres')} stroke="#1a1f4d" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Financial Overview (Conditionally rendered) */}
                        {hasFinances && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg font-black dark:text-white tracking-tight">
                                            {t('finances_overview', 'Santé Financière')}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('finance_comparison_desc', 'Comparaison des flux par devise')}</p>
                                    </div>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                                        <span className="text-xl">💰</span>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={graphData.financesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                            <Tooltip />
                                            <Legend formatter={renderLegendText} />
                                            {graphData.availableCurrencies.map((currency, index) => (
                                                <Bar
                                                    key={currency}
                                                    dataKey={currency}
                                                    name={currency}
                                                    fill={index % 2 === 0 ? "#ea762a" : "#1a1f4d"}
                                                    radius={[6, 6, 0, 0]}
                                                    barSize={30}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Feeds */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* Upcoming Events */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[480px]">
                            <h3 className="text-md font-black dark:text-white tracking-tight mb-6">
                                {t('upcoming_events', 'Agenda à venir')}
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {stats?.upcomingCeremonies?.length > 0 ? (
                                    stats.upcomingCeremonies.slice(0, 5).map((event, idx) => (
                                        <div key={idx} className="flex items-center p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10 group cursor-pointer" onClick={() => navigate('/admin/ceremonies')}>
                                            <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 dark:bg-brand-primary/20 flex flex-col items-center justify-center text-brand-primary dark:text-brand-orange font-black shadow-sm group-hover:scale-110 transition-transform">
                                                <span className="text-[14px] leading-none">{new Date(event.date).getDate()}</span>
                                                <span className="text-[8px] uppercase tracking-tighter">{new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <h5 className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase tracking-wide">
                                                    {event.type}
                                                </h5>
                                                <p className="text-[10px] text-gray-400 mt-0.5 font-medium flex items-center gap-1">
                                                    <span>🕒</span>
                                                    {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                        <span className="text-3xl mb-2">📅</span>
                                        <p className="text-xs font-bold uppercase tracking-widest">{t('no_upcoming_events', 'Aucun événement')}</p>
                                    </div>
                                )}
                            </div>
                            <Link to="/admin/ceremonies" className="mt-6 text-[10px] font-black text-brand-primary hover:text-brand-deep transition-colors text-center py-3 border-t border-gray-50 dark:border-gray-800 uppercase tracking-[0.2em]">
                                {t('view_more', 'Tout l\'agenda')} →
                            </Link>
                        </div>

                        {/* Birthdays */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[400px]">
                            <h3 className="text-md font-black dark:text-white tracking-tight mb-6">
                                {t('birthdays_this_week', 'Anniversaires')}
                            </h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {stats?.upcomingBirthdays?.length > 0 ? (
                                    stats.upcomingBirthdays.slice(0, 4).map((person, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-transparent hover:border-pink-100 transition-all cursor-pointer" onClick={() => navigate(`/admin/members/${person.id}`)}>
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 text-white flex items-center justify-center font-black text-[10px] shadow-sm shadow-pink-500/20">
                                                {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-[11px] font-black text-gray-900 dark:text-white truncate">
                                                    {person.firstName} {person.lastName}
                                                </h5>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                    🎂 {new Date(person.birthdayThisYear).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                            <div className="px-2 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-500 text-[10px] font-black rounded-lg">
                                                {person.age} ans
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                                        <span className="text-3xl mb-2">🎂</span>
                                        <p className="text-xs font-bold uppercase tracking-widest">{t('no_birthdays_today', 'Aucune fête ici')}</p>
                                    </div>
                                )}
                            </div>
                            <Link to="/admin/members" className="mt-6 text-[10px] font-black text-gray-400 hover:text-brand-primary transition-colors text-center py-3 border-t border-gray-50 dark:border-gray-800 uppercase tracking-[0.2em]">
                                {t('view_more', 'Voir membres')} →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Recent Activity & New Members */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black dark:text-white tracking-tight">
                                {t('recent_financial_activity', 'Activité Financière')}
                            </h3>
                            <Link to="/admin/finances" className="text-[10px] font-black text-brand-primary uppercase tracking-widest underline underline-offset-4">{t('view_history', 'Voir historique')}</Link>
                        </div>
                        <div className="space-y-4">
                            {stats?.recentDonations?.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-black text-sm">
                                            $
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wide">
                                                {t('donation_received', 'Don reçu')}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {item.member ? `${item.member.firstName} ${item.member.lastName}` : t('anonymous', 'Donateur Anonyme')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-emerald-600 tracking-tight">+{item.amount} {item.currency}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Members */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black dark:text-white tracking-tight">
                                {t('recent_members_added', 'Nouveaux Inscrits')}
                            </h3>
                            <Link to="/admin/members" className="text-[10px] font-black text-brand-primary uppercase tracking-widest underline underline-offset-4">{t('more_members', 'Plus de membres')}</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats?.recentMembers?.length > 0 ? (
                                stats.recentMembers.slice(0, 4).map((member, idx) => (
                                    <div key={idx} onClick={() => navigate(`/admin/members/${member.id}`)} className="flex items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10 transition-all cursor-pointer group">
                                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-orange flex items-center justify-center font-black text-[10px] group-hover:scale-110 transition-transform flex-shrink-0">
                                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                        </div>
                                        <div className="ml-3 min-w-0">
                                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                                                {member.firstName} {member.lastName}
                                            </h4>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 flex flex-col items-center justify-center p-10 text-gray-400 opacity-50">
                                    <span className="text-3xl mb-2">👥</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t('no_recent_members_found', 'En attente d\'inscriptions')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Updated StatCard with professional styling
const StatCard = ({ title, value, trend, trendUp, subtitle, icon, color = "indigo" }) => {
    const colorVariants = {
        brand: 'bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-orange',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
    };

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1 duration-300 group">
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
                        <h4 className="text-3xl font-black dark:text-white tracking-tighter leading-none">{value}</h4>
                    </div>
                    {trend && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </span>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-2xl ${colorVariants[color]} flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};


const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('fr-HT', { // Utiliser le format haïtien/français qui sépare par des espaces
        style: 'currency',
        currency: currency,
    }).format(amount);
};