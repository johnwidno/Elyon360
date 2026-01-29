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
        <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-2xl border border-gray-100 dark:border-white/5 whitespace-nowrap tracking-tight transition-colors">
            {date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })} - {date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
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
                        const typeName = subtypes.find(s => s.id === m.subtypeId)?.name || 'Autre';
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

                // Recent Members (Last 4)
                const sortedMembers = [...members].sort((a, b) => b.id - a.id); // Assuming ID determines recency or use createdAt if available and parsed
                // Better to sort by createdAt if available strings, but ID is safe for DB autoincrement
                setRecentMembers(sortedMembers.slice(0, 4));

                // Growth Data (Last 6 Months)
                const last6Months = [];
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    last6Months.push(d);
                }

                const chartData = last6Months.map(monthDate => {
                    const monthKey = monthDate.toLocaleString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' });
                    // Count members created BEFORE the end of this month
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
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            navigate(`/admin/members?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const cards = [
        {
            title: t('total_members', 'Total Membres'),
            value: stats.totalMembers,
            change: "+2.14%",
            trend: "up",
            icon: (
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            bg: "bg-blue-50 dark:bg-blue-900/10",
            text: "text-blue-600 dark:text-blue-400",
            onClick: () => navigate('/admin/members')
        },
        {
            title: t('active_members', 'Membres Actifs'),
            value: stats.activeMembers,
            change: "+3.78%",
            trend: "up",
            icon: (
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            bg: "bg-green-50 dark:bg-green-900/10",
            text: "text-green-600 dark:text-green-400",
            onClick: () => navigate('/admin/members?status=Actif')
        },
        {
            title: t('total_visitors', 'Total Visiteurs'),
            value: stats.totalVisitors,
            change: "-1.56%",
            trend: "down",
            icon: (
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            ),
            bg: "bg-purple-50 dark:bg-purple-900/10",
            text: "text-purple-600 dark:text-purple-400",
            onClick: () => navigate('/admin/visitors')
        },
        {
            title: t('organizations', 'Organisations'),
            value: stats.totalOrganizations,
            change: "+1.64%",
            trend: "up",
            icon: (
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            bg: "bg-orange-50 dark:bg-orange-900/10",
            text: "text-orange-600 dark:text-orange-400",
            onClick: () => navigate('/admin/organizations')
        }
    ];

    return (
        <AdminLayout>
            <div className="p-8 transition-colors">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3 gap-10 transition-colors">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{t('contacts_dashboard')}</h1>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('overview_stats')}</p>
                    </div>

                    {/* Right Container: Time & Toolbar */}
                    <div className="flex flex-col items-end gap-2 w-full lg:w-auto transition-colors">
                        <CurrentTime />

                        <div className="flex items-center gap-3 bg-white dark:bg-[#1A1A1A] p-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm w-full sm:w-auto transition-all">
                            <div className="relative group flex-grow sm:flex-grow-0 transition-colors">
                                <input
                                    type="text"
                                    placeholder={`${t('search_member')}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                    className="pl-12 pr-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[13px] font-medium w-full sm:w-52 focus:w-72 transition-all dark:text-white placeholder-gray-400 dark:placeholder-gray-700 outline-none"
                                />
                                <svg
                                    onClick={(e) => handleSearch({ ...e, type: 'click' })}
                                    className="w-4 h-4 text-gray-400 absolute left-4.5 top-4.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    style={{ left: '1.1rem', top: '1.1rem' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="px-6 py-4 bg-indigo-50 dark:bg-black text-indigo-700 dark:text-indigo-400 font-semibold text-[13px] rounded-xl border border-indigo-100 dark:border-white/5 transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                <span className="hidden sm:inline">{t('dashboard')}</span>
                            </button>

                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-4 bg-indigo-600 text-white font-semibold text-[13px] rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden sm:inline">{t('new_member')}</span>
                                <span className="sm:hidden">{t('add', 'Ajouter')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 transition-colors">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            onClick={card.onClick}
                            className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:border-indigo-500/10 dark:hover:border-indigo-500/10 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-start mb-8 relative z-10 transition-colors">
                                <div className={`p-5 rounded-2xl ${card.bg} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                    {card.icon}
                                </div>
                                <span className={`text-[10px] font-bold px-4 py-1.5 rounded-xl ${card.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                                    {card.change}
                                </span>
                            </div>
                            <h3 className="text-gray-400 dark:text-gray-500 text-[12px] font-semibold mb-2 relative z-10 transition-colors">{card.title}</h3>
                            <div className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight relative z-10 transition-colors">
                                {loading ? '...' : card.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area - Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 transition-colors">

                    {/* Left Column: Stats & Charts */}
                    <div className="lg:col-span-2 space-y-12 transition-colors">
                        {/* Church Growth Chart (Reduced Height) */}
                        <div className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                            <div className="flex justify-between items-center mb-10 transition-colors">
                                <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight transition-colors">{t('church_growth')}</h3>
                                <select className="text-[11px] font-semibold border border-transparent focus:border-indigo-500/20 rounded-2xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black px-6 py-3 transition-all outline-none cursor-pointer">
                                    <option>{t('last_6_months')}</option>
                                </select>
                            </div>
                            <div className="h-60 transition-colors">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', borderRadius: '1.2rem', border: '1px solid #ffffff10', boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.4)', padding: '1.2rem' }}
                                            itemStyle={{ color: '#818cf8', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '6 6' }}
                                        />
                                        <Area type="monotone" dataKey="membres" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMembres)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribution Charts Row - 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 transition-colors">
                            {/* Gender Distribution */}
                            <div className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight mb-10 transition-colors">{t('by_gender')}</h3>
                                <div className="space-y-8">
                                    {/* Male */}
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold mb-3 transition-colors">
                                            <span className="text-gray-500 dark:text-gray-400">{t('men')}</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{stats.gender.male}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 dark:bg-black rounded-full h-3 overflow-hidden shadow-inner transition-colors">
                                            <div
                                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                                style={{ width: `${(stats.gender.male / (stats.totalMembers || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    {/* Female */}
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold mb-3 transition-colors">
                                            <span className="text-gray-500 dark:text-gray-400">{t('women')}</span>
                                            <span className="text-pink-500 dark:text-pink-400">{stats.gender.female}</span>
                                        </div>
                                        <div className="w-full bg-gray-50 dark:bg-black rounded-full h-3 overflow-hidden shadow-inner transition-colors">
                                            <div
                                                className="bg-pink-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.4)]"
                                                style={{ width: `${(stats.gender.female / (stats.totalMembers || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Reduced Pie Chart Place for space in 3-col */}
                                <div className="mt-12 flex justify-center transition-colors">
                                    <div className="w-32 h-32 rounded-full border-4 border-gray-50 dark:border-black flex items-center justify-center relative transition-all group-hover:scale-105">
                                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 opacity-20 animate-pulse"></div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.totalMembers}</div>
                                            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">{t('members')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Category (Subtype) */}
                            <div className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight mb-10 transition-colors">{t('by_category')}</h3>
                                <div className="space-y-8">
                                    {Object.entries(stats.types).map(([type, count]) => (
                                        <div key={type} className="group/item">
                                            <div className="flex justify-between text-[11px] font-semibold mb-3 transition-colors">
                                                <span className="text-gray-500 dark:text-gray-400 truncate mr-2 group-hover/item:text-indigo-400">{type === 'Non classifié' ? t('unclassified') : type}</span>
                                                <span className="text-gray-900 dark:text-white">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-50 dark:bg-black rounded-full h-2.5 shadow-inner transition-all overflow-hidden">
                                                <div
                                                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-1000 group-hover/item:bg-indigo-500"
                                                    style={{ width: `${(count / (stats.totalMembers || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(stats.types).length === 0 && (
                                        <div className="text-center text-gray-300 dark:text-gray-700 text-[10px] font-black uppercase tracking-widest italic py-8 transition-colors">{t('no_data')}</div>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight mb-10 transition-colors">{t('by_status')}</h3>
                                <div className="space-y-8">
                                    {Object.entries(stats.status).map(([status, count]) => {
                                        if (count === 0) return null;
                                        let color = 'bg-gray-400 dark:bg-gray-600';
                                        if (status === 'active') color = 'bg-green-500';
                                        if (status === 'inactive') color = 'bg-gray-400 dark:bg-gray-700';
                                        if (status === 'traveling') color = 'bg-amber-500';
                                        if (status === 'deceased') color = 'bg-gray-800 dark:bg-gray-300';
                                        if (status === 'transferred') color = 'bg-indigo-500';
                                        if (status === 'abandoned') color = 'bg-red-500';

                                        const label = status === 'active' ? t('active') :
                                            status === 'inactive' ? t('inactive') :
                                                status === 'traveling' ? t('traveling') :
                                                    status === 'deceased' ? t('deceased') :
                                                        status === 'transferred' ? t('transferred') : t('abandoned');

                                        return (
                                            <div key={status} className="group/item">
                                                <div className="flex justify-between text-[11px] font-semibold mb-3 transition-colors">
                                                    <span className="text-gray-500 dark:text-gray-400 truncate mr-2 group-hover/item:text-indigo-400" title={label}>{label}</span>
                                                    <span className="text-gray-900 dark:text-white">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-50 dark:bg-black rounded-full h-2.5 shadow-inner transition-colors overflow-hidden">
                                                    <div
                                                        className={`${color} h-full rounded-full transition-all duration-1000 shadow-sm`}
                                                        style={{ width: `${(count / (stats.totalMembers || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.values(stats.status).every(v => v === 0) && (
                                        <div className="text-center text-gray-300 dark:text-gray-700 text-[10px] font-black uppercase tracking-widest italic py-8 transition-colors">{t('no_data')}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Members */}
                    <div className="bg-white dark:bg-[#151515] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 h-fit transition-colors">
                        <div className="flex justify-between items-center mb-10 transition-colors">
                            <h3 className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight transition-colors">{t('recent_additions')}</h3>
                            <button className="text-indigo-600 dark:text-indigo-400 text-[12px] font-semibold hover:underline transition-colors" onClick={() => navigate('/admin/members')}>{t('view_all')}</button>
                        </div>
                        <div className="space-y-1 transition-colors">
                            {loading ? (
                                <div className="text-center py-5 text-gray-300 dark:text-gray-700 font-black uppercase tracking-widest text-[10px] transition-colors">{t('loading')}</div>
                            ) : recentMembers.length === 0 ? (
                                <div className="text-center py-5 text-gray-300 dark:text-gray-700 italic font-black uppercase tracking-widest text-[10px] transition-colors">{t('no_recent_members')}</div>
                            ) : (
                                recentMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => navigate(`/admin/members/${member.id}`)}
                                        className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[1.5rem] border-2 border-transparent hover:border-gray-50 dark:hover:border-white/5 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                                    >
                                        <div className="flex items-center gap-5 transition-colors">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-black flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-white/5 overflow-hidden group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                {member.photo ? (
                                                    <img src={member.photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    member.firstName?.[0]
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-500 dark:text-white text-[14px] group-hover:text-indigo-600 transition-colors tracking-tight">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-500 font-medium mt-1">
                                                    {new Date(member.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 transition-colors">
                                            <div className={`w-3 h-3 rounded-full shadow-lg ${member.status === 'Actif' ? 'bg-green-50 shadow-green-500/20' : 'bg-amber-50 shadow-amber-500/20'}`}></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {!loading && recentMembers.length > 0 && (
                            <button
                                onClick={() => navigate('/admin/members')}
                                className="w-full mt-10 py-5 bg-gray-50 dark:bg-black text-gray-500 dark:text-gray-400 font-semibold text-[13px] rounded-[1.5rem] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm active:scale-95 border border-transparent dark:border-white/5"
                            >
                                {t('view_all_members')}
                            </button>
                        )}
                    </div>

                </div>
            </div >
            <MemberForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => window.location.reload()} // Reload to refresh stats
                subtypes={subtypes}
            />
        </AdminLayout >
    );
};

export default ContactsOverview;
