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
            <div className="bg-[#F4F7FE] dark:bg-[#0b1437] rounded-[30px] p-6 md:p-8 font-['DM_Sans'] transition-colors duration-300">

                {/* TOP SECTION: Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm font-medium text-[#707EAE] dark:text-gray-400">{t('pages', 'Pages')} / {t('dashboard', 'Tableau de bord')}</p>
                        <h1 className="text-3xl font-bold text-[#2B3674] dark:text-white mt-1">
                            {t('main_dashboard', 'Tableau de bord principal')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-[#111c44] p-2.5 rounded-full shadow-sm">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_members', 'Rechercher un membre...')}
                                className="pl-10 pr-4 py-2 bg-[#F4F7FE] dark:bg-[#0b1437] rounded-full text-sm text-[#2B3674] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4318FF] w-40 md:w-60 transition-all"
                            />
                            <div className="absolute left-3 top-2.5">
                                <SearchIcon />
                            </div>
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111c44] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                                    {searchResults.map((member) => (
                                        <div
                                            key={member.id}
                                            onClick={() => handleSearchResultClick(member.id)}
                                            className="flex items-center gap-3 p-3 hover:bg-[#F4F7FE] dark:hover:bg-[#0b1437] cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#4318FF] text-white flex items-center justify-center font-bold text-sm">
                                                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#2B3674] dark:text-white truncate">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="p-2 text-gray-400 hover:text-[#4318FF] transition-colors relative">
                            <NotificationIcon />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111c44]"></span>
                        </button>
                        <Link to="/admin/settings" className="w-10 h-10 rounded-full bg-[#111c44] text-white flex items-center justify-center font-bold hover:scale-105 transition-transform">
                            {user?.firstName?.charAt(0) || 'A'}
                        </Link>
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-9 space-y-12">

                    {/* ROW 1: STATS CARDS (5 cols) */}
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-2">
                        <StatCard
                            title={t('total_members', 'Total Membres')}
                            value={stats?.memberCount || 0}
                            trend="+2.4%"
                            trendUp={true}
                            subtitle={t('since_its_existence', 'depuis son existence')}
                            icon="👥"
                        />
                        <StatCard
                            title={t('active', 'Actif')}
                            value={stats?.memberactifCount || 0}
                            subtitle={t('active_members_total', 'Total membres actifs')}
                            icon="✅"
                        />

                        <StatCard
                            title={t('visitors', 'Visiteurs')}
                            value={stats?.visitorCount || 0}
                            subtitle={t('total_registered', 'Total inscrits')}
                            icon="👋"
                        />
                        {/* Card 2: Organizations (NEW) */}
                        <StatCard
                            title={t('organizations', 'Organisations')}
                            value={stats?.organizationCount || 0}
                            trend="+1.0%"
                            trendUp={true}
                            subtitle={t('active_partners', 'Partenaires actifs')}
                            icon="🏢"
                        />
                        {/* Card 3: Events/Ceremonies */}
                        <StatCard
                            title={t('upcoming_ceremonies', 'Cérémonies')}
                            value={stats?.ceremonyCount || 0}
                            subtitle={t('upcoming_events_subtitle', 'Événements à venir')}
                            icon="📅"
                        />
                        {/* Card 4: Inventory/Groups */}
                        <StatCard
                            title={t('groups', 'Groupes')}
                            value={stats?.groupCount || 0}
                            subtitle={t('active_groups', 'Groupes actifs')}
                            icon="🏡"
                        />

                        {/* Card 7: Inventory/Groups */}
                        <StatCard
                            title={t('sunday_classes', 'Classes dominicales')}
                            value={stats?.sundayschoolcount || 0}
                            subtitle={t('active_class', 'Classe Active')}
                            icon="📚"
                        />
                        {/* Card 8: Inventory/Groups */}

                        <StatCard
                            title={t('materials', 'Matériels')}
                            value={stats?.inventoryCount || stats?.sundayschoolcount || 0}
                            subtitle={t('set_of_materials', 'Ensemble de Matériels')}
                            icon="🛠️"
                        />
                    </div>





                    {/* ROW 2: GROWTH CHARTS & UPCOMING EVENTS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Member Growth Chart (2/3 width) - Switched to LineChart */}
                        <div className="xl:col-span-2 bg-white dark:bg-[#111c44] rounded-[10px] p-4 shadow-sm transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide">
                                    {t('member_growth', 'Croissance des membres')}
                                </h3>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F4F7FE] dark:bg-[#0b1437]">
                                    <span className="text-sm font-medium text-[#A3AED0]">{t('last_30_days', '30 derniers jours')}</span>
                                    <span className="text-[#2B3674] dark:text-white">📅</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto pb-2 custom-scrollbar">
                                <div className="h-[300px] min-w-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={graphData.memberGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#999ba2ff" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#A3AED0', fontSize: 8 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#A3AED0', fontSize: 8 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    boxShadow: '0px 10px 30px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Legend formatter={renderLegendText} />
                                            <Line type="monotone" dataKey="members" name={t('members', 'Membres')} stroke="#4318FF" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="visitors" name={t('visitors', 'Visiteurs')} stroke="#6AD2FF" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="organizations" name={t('organizations', 'Organisations')} stroke="#FFB547" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Events (1/3 width) */}
                        <div className="xl:col-span-1 bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide">
                                    {t('upcoming_events', 'Événements à venir')}
                                </h3>
                            </div>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {stats?.upcomingCeremonies?.length > 0 ? (
                                    stats.upcomingCeremonies.slice(0, 3).map((event, idx) => (
                                        <div key={idx} className="flex items-center p-3 rounded-xl hover:bg-[#F4F7FE] dark:hover:bg-[#0b1437] transition-colors group cursor-pointer border border-transparent hover:border-[#E0E5F2] dark:hover:border-[#1B254B]">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 font-bold shadow-sm group-hover:scale-105 transition-transform">
                                                {new Date(event.date).getDate()}
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <h5 className="text-sm font-bold text-[#2B3674] dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                    {event.type}
                                                </h5>
                                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                    <span>🕒</span>
                                                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <span className="text-3xl mb-2">📅</span>
                                        <p className="text-sm">{t('no_upcoming_events', 'Aucun événement à venir')}</p>
                                    </div>
                                )}
                            </div>
                            <Link
                                to="/admin/ceremonies"
                                className="mt-4 text-sm font-bold text-[#4318FF] hover:text-[#2B3674] transition-colors text-center py-2 border-t border-gray-100 dark:border-gray-800"
                            >
                                {t('view_more', 'Voir plus')} →
                            </Link>
                        </div>
                    </div>

                    {/* ROW 3: FINANCES (Full Width) - Switched to LineChart */}
                    {
                        hasFinances && (
                            <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide">
                                        {t('finances_overview', 'Aperçu des Finances')}
                                    </h3>
                                    <button className="p-2 rounded-lg bg-[#F4F7FE] dark:bg-[#0b1437] text-gray-400 hover:text-[#2B3674] dark:hover:text-white transition-colors">
                                        <span className="text-xl">📊</span>
                                    </button>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={graphData.financesTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E5F2" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#A3AED0', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#A3AED0', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0px 10px 30px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: "20px" }} formatter={renderLegendText} />
                                            {/* Dynamic Lines for each currency */}
                                            {graphData.availableCurrencies && graphData.availableCurrencies.map((currency, index) => (
                                                <Line
                                                    key={currency}
                                                    type="monotone"
                                                    dataKey={currency}
                                                    name={currency}
                                                    stroke={index % 2 === 0 ? "#05CD99" : "#4318FF"}
                                                    strokeWidth={3}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )
                    }

                    {/* ROW 4: DEMOGRAPHICS & GENDER & BIRTHDAYS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
                        {/* Age Demographics */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors">
                            <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide mb-6">
                                {t('demographics_age', 'Démographie (Âge)')}
                            </h3>
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={graphData.demographics}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={1}
                                            dataKey="value"
                                        >
                                            {graphData.demographics.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" formatter={renderLegendText} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gender Distribution */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors">
                            <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide mb-6">
                                {t('gender_distribution', 'Répartition par Genre')}
                            </h3>
                            <div className="h-[250px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={graphData.genderDistribution || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {graphData.genderDistribution && graphData.genderDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" formatter={renderLegendText} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Upcoming Birthdays (NEW) */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors flex flex-col">
                            <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide mb-6">
                                {t('birthdays_this_week', 'Anniversaires de la semaine')}
                            </h3>
                            <div className="space-y-3 h-[250px] overflow-y-auto custom-scrollbar flex-1">
                                {stats?.upcomingBirthdays?.length > 0 ? (
                                    stats.upcomingBirthdays.map((person, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F4F7FE] dark:hover:bg-[#0b1437] transition-colors cursor-pointer border border-transparent hover:border-[#E0E5F2]" onClick={() => navigate(`/admin/members/${person.id}`)}>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-bold text-[#2B3674] dark:text-white truncate">
                                                    {person.firstName} {person.lastName}
                                                </h5>
                                                <p className="text-xs text-gray-400 truncate">
                                                    🎂 {new Date(person.birthdayThisYear).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </p>
                                            </div>
                                            <div className="text-sm font-bold text-[#4318FF]">
                                                {person.age} {t('years', 'ans')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <span className="text-3xl mb-2">🎂</span>
                                        <p className="text-sm text-center">{t('no_birthdays_this_week', 'Aucun anniversaire cette semaine')}</p>
                                    </div>
                                )}
                            </div>
                            <Link
                                to="/admin/birthdays"
                                className="mt-4 text-sm font-bold text-[#4318FF] hover:text-[#2B3674] transition-colors text-center block py-2 border-t border-gray-100 dark:border-gray-800"
                            >
                                {t('view_more', 'Voir plus')} →
                            </Link>
                        </div>
                    </div>
                    {/* ROW 5: RECENT ACTIVITY & RECENT MEMBERS (2 COLUMNS) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Recent Donations */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide">
                                    {t('recent_activity', 'Activité Récente')}
                                </h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                {stats?.recentDonations?.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#F4F7FE] dark:bg-[#0b1437]/50 border border-transparent hover:border-[#E0E5F2] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-500 font-bold">
                                                $
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#2B3674] dark:text-white">
                                                    {t('donation_received', 'Don reçu')}
                                                </h4>
                                                <p className="text-xs text-gray-400">
                                                    {t('from', 'De')} {item.member ? `${item.member.firstName} ${item.member.lastName}` : t('anonymous', 'Anonyme')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#05CD99]">+{item.amount} {item.currency}</p>
                                            <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                to="/admin/finances"
                                className="mt-4 text-sm font-bold text-[#4318FF] hover:text-[#2B3674] transition-colors text-center block py-2 border-t border-gray-100 dark:border-gray-800"
                            >
                                {t('view_more', 'Voir plus')} →
                            </Link>
                        </div>

                        {/* Recent Members (NEW) */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-6 shadow-sm transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#2B3674] dark:text-white tracking-wide">
                                    {t('recent_members_added', 'Derniers membres ajoutés')}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {stats?.recentMembers?.length > 0 ? (
                                    stats.recentMembers.slice(0, 3).map((member, idx) => (
                                        <div key={idx} onClick={() => navigate(`/admin/members/${member.id}`)} className="flex items-center justify-between p-4 rounded-xl bg-[#F4F7FE] dark:bg-[#0b1437]/50 border border-transparent hover:border-[#E0E5F2] transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#4318FF] text-white flex items-center justify-center font-bold text-sm">
                                                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-[#2B3674] dark:text-white">
                                                        {member.firstName} {member.lastName}
                                                    </h4>
                                                    <p className="text-xs text-gray-400">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">{new Date(member.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <span className="text-3xl mb-2">👥</span>
                                        <p className="text-sm">{t('no_recent_members', 'Aucun membre récent')}</p>
                                    </div>
                                )}
                            </div>
                            <Link
                                to="/admin/members"
                                className="mt-4 text-sm font-bold text-[#4318FF] hover:text-[#2B3674] transition-colors text-center block py-2 border-t border-gray-100 dark:border-gray-800"
                            >
                                {t('view_more', 'Voir plus')} →
                            </Link>
                        </div>
                    </div>

                </div> {/* End col-span-12 */}

            </div> {/* End bg-F4F7FE */}
        </AdminLayout>
    );
}

// Helper Components
const StatCard = ({ title, value, trend, trendUp, subtitle, icon }) => (
    <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-4 shadow-sm transition-colors hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <h4 className="text-2xl font-bold text-[#2B3674] dark:text-white">{value}</h4>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#F4F7FE] dark:bg-[#0b1437] flex items-center justify-center text-xl">
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            {trend && (
                <span className={`text-xs font-bold ${trendUp ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                    {trendUp ? '↑' : '↓'} {trend}
                </span>
            )}
            <span className="text-xs text-gray-400 font-medium">
                {subtitle}
            </span>
        </div>
    </div>
);

const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('fr-HT', { // Utiliser le format haïtien/français qui sépare par des espaces
        style: 'currency',
        currency: currency,
    }).format(amount);
};