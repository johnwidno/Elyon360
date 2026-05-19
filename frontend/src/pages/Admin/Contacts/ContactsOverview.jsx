import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';
import { UserPlus, Search, Users, UserMinus, UserCheck, Building2, LayoutGrid, Wallet, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import AdminLayout from '../../../layouts/AdminLayout';

const ContactsOverview = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const darkMode = theme === 'dark';
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, visitorsRes, orgRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/visitors'),
                    api.get('/organizations')
                ]);
                setMembers(membersRes.data || []);
                setVisitors(visitorsRes.data || []);
                setOrganizations(orgRes.data || []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        fetchData();
    }, []);

    // Statistics Calculation
    const stats = useMemo(() => {
        const total = members.length;
        const active = members.filter(m => m.status === 'Actif' || m.status === 'active').length;
        const inactive = members.filter(m => m.status === 'Inactif' || m.status === 'inactive').length;
        const maleCount = members.filter(m => m.gender === 'Male' || m.gender === 'M' || m.gender === 'Masculin').length;
        const femaleCount = members.filter(m => m.gender === 'Female' || m.gender === 'F' || m.gender === 'Féminin').length;

        // Categorical Stats (Real Data from database categories, subtypes and status)
        const baptized = members.filter(m => m.category?.name === 'Baptisé' || m.contactSubtype?.name === 'Baptisé').length;
        const candidates = members.filter(m => m.category?.name === 'Candidat au baptême' || m.contactSubtype?.name === 'Candidat au baptême').length;
        const adherents = members.filter(m => m.category?.name === 'Adhérent' || m.contactSubtype?.name === 'Adhérent').length;
        const transferred = members.filter(m => m.category?.name === 'Transféré' || m.contactSubtype?.name === 'Transféré' || m.status === 'Transféré').length;
        const away = members.filter(m => m.status === 'En déplacement').length;
        const deceased = members.filter(m => m.status === 'Décédé').length;
        const affiliated = members.filter(m => m.category?.name === 'Affilié' || m.contactSubtype?.name === 'Affilié').length;
        const other = members.filter(m => m.category?.name === 'Autre' || m.contactSubtype?.name === 'Autre').length;

        // Age Groups (0-3, 4-12, 13-17, 18-25, 26-35, 36-50, 51-64, 65+)
        const calculateAge = (birthDate) => {
            if (!birthDate) return null;
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
            return age;
        };

        const ages = members.map(m => calculateAge(m.birthDate)).filter(a => a !== null);

        const ageRanges = [
            { name: '0 - 3', min: 0, max: 3 },
            { name: '4 - 12', min: 4, max: 12 },
            { name: '13 - 17', min: 13, max: 17 },
            { name: '18 - 25', min: 18, max: 25 },
            { name: '26 - 35', min: 26, max: 35 },
            { name: '36 - 50', min: 36, max: 50 },
            { name: '51 - 64', min: 51, max: 64 },
            { name: '65 +', min: 65, max: 150 },
        ];

        const ageGroups = ageRanges.map(range => {
            const count = ages.filter(a => a >= range.min && a <= range.max).length;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return { name: range.name, percentage };
        }).reverse();

        return {
            total,
            active,
            inactive,
            maleCount,
            femaleCount,
            malePercent: total > 0 ? Math.round((maleCount / total) * 100) : 0,
            femalePercent: total > 0 ? Math.round((femaleCount / total) * 100) : 0,
            baptized,
            candidates,
            adherents,
            transferred,
            away,
            deceased,
            affiliated,
            other,
            ageGroups,
            recent: [...members].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        };
    }, [members]);

    // Growth Data calculation
    const growthData = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('fr-FR', { month: 'short' });
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const count = members.filter(m => new Date(m.createdAt) < nextMonth).length;
            months.push({ name: monthLabel, membres: count });
        }
        return months;
    }, [members]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            navigate(`/admin/members?search=${searchQuery}`);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 border border-gray-200 dark:border-white/10 rounded-[3px]">
                            <UserPlus className="w-8 h-8 text-[#1a1a1a] dark:text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight dark:text-white">Gestion des Contacts / Vue d'ensemble</h1>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400">Analysez et gérez vos membres, visiteurs et organisations partenaires.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Recherche"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className="pl-10 pr-4 py-2.5 bg-[#f5f5f5] dark:bg-white/5 border-none rounded-full text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={() => navigate('/admin/members/new')}
                            className="bg-[#1a1f4d] text-white px-6 py-2.5 rounded-[3px] text-[13px] font-bold hover:bg-[#2a2f5d] transition-all"
                        >
                            Nouveau Membre
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard title="Total membres" value={stats.total} subValue={`${stats.active} active`} icon={<Users className="w-4 h-4" />} />
                    <StatCard title="Membres inactifs" value={stats.inactive} subValue="Décédé / transféré" icon={<UserMinus className="w-4 h-4" />} />
                    <StatCard title="Total visiteurs" value={visitors.length} subValue="0 nouveaux" icon={<UserCheck className="w-4 h-4" />} />
                    <StatCard title="Groupes & ministères" value={members.length} subValue={`${stats.active} active`} icon={<LayoutGrid className="w-4 h-4" />} />
                    <StatCard title="Organisations" value={organizations.length} subValue={`${organizations.length} active`} icon={<Building2 className="w-4 h-4" />} />
                </div>

                {/* Sub-stats Line */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] py-2 dark:text-white">
                    <div>Baptisé : <span>{stats.baptized}</span></div>
                    <div>Candidat au baptême : <span>{stats.candidates}</span></div>
                    <div>Adhérent : <span>{stats.adherents}</span></div>
                    <div>Transféré : <span>{stats.transferred}</span></div>
                    <div>En déplacement : <span>{stats.away}</span></div>
                    <div>Décédé : <span>{stats.deceased}</span></div>
                    <div>Affilié : <span>{stats.affiliated}</span></div>
                    <div>Autre : <span>{stats.other}</span></div>
                </div>

                {/* Middle Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Age Groups Bar Chart - LEFT (50%) */}
                    <div className="lg:col-span-6 border border-gray-100 dark:border-white/10 rounded-[3px] p-6 bg-white dark:bg-[#111111] shadow-sm transition-colors">
                        <h3 className="text-sm font-bold mb-6 dark:text-white">Par groupes d'âges</h3>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={stats.ageGroups}
                                    margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: darkMode ? '#9ca3af' : '#1a1a1a', fontSize: 13, fontWeight: 'bold' }} 
                                        width={60}
                                    />
                                    <Bar 
                                        dataKey="percentage" 
                                        fill="#1a1f4d" 
                                        radius={[0, 3, 3, 0]} 
                                        barSize={14} 
                                        background={{ fill: darkMode ? '#1f2937' : '#f3f4f6', radius: 3 }}
                                        label={{ position: 'right', formatter: (v) => `${v}%`, fill: darkMode ? '#fff' : '#1a1a1a', fontSize: 13, fontWeight: 'bold' }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Gender Donuts - RIGHT (50%) */}
                    <div className="lg:col-span-6 border border-gray-100 dark:border-white/10 rounded-[3px] p-6 bg-white dark:bg-[#111111] shadow-sm transition-colors">
                        <h3 className="text-sm font-bold mb-6 dark:text-white">Répartition par sexe</h3>
                        <div className="flex flex-col items-center gap-6">
                            {/* Donuts Row - Spaced */}
                            <div className="flex flex-wrap justify-center gap-16 relative w-full py-2">
                                {/* Female Donut */}
                                <div className="relative w-36 h-36">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[{ value: stats.femalePercent }, { value: 100 - stats.femalePercent }]}
                                                innerRadius={50}
                                                outerRadius={70}
                                                startAngle={90}
                                                endAngle={450}
                                                dataKey="value"
                                            >
                                                <Cell fill="#1a1f4d" className="dark:fill-blue-500" />
                                                <Cell fill="#f3f4f6" className="dark:fill-white/5" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black dark:text-white">{stats.femalePercent}%</span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Femmes</span>
                                    </div>
                                </div>

                                {/* Male Donut */}
                                <div className="relative w-36 h-36">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[{ value: stats.malePercent }, { value: 100 - stats.malePercent }]}
                                                innerRadius={50}
                                                outerRadius={70}
                                                startAngle={90}
                                                endAngle={450}
                                                dataKey="value"
                                            >
                                                <Cell fill="#1a1f4d" className="dark:fill-blue-400" />
                                                <Cell fill="#f3f4f6" className="dark:fill-white/5" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black dark:text-white">{stats.malePercent}%</span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Hommes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Counts Row - Bottom Centered */}
                            <div className="flex items-center gap-10 text-[13px] font-bold dark:text-white pt-4 border-t border-gray-50 dark:border-white/5 w-full justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a1f4d] dark:bg-blue-400"></div>
                                    <span>M : {stats.maleCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a1f4d] dark:bg-blue-500"></div>
                                    <span>F : {stats.femaleCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Community Growth */}
                    <div className="lg:col-span-8 border border-gray-100 dark:border-white/10 rounded-[3px] p-6 bg-white dark:bg-[#111111] shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold dark:text-white">Croissance de la Communauté</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">ÉVOLUTION SUR LES 30 DERNIERS JOURS</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">LIVE</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorMembres" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1a1f4d" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#1a1f4d" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#f1f1f1'} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="membres" 
                                        stroke={darkMode ? '#3b82f6' : '#1a1f4d'} 
                                        strokeWidth={2} 
                                        fillOpacity={1} 
                                        fill="url(#colorMembres)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Joiners */}
                    <div className="lg:col-span-4 border border-gray-100 dark:border-white/10 rounded-[3px] p-6 bg-white dark:bg-[#111111] shadow-sm flex flex-col transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold dark:text-white">Derniers inscrits</h3>
                            <button onClick={() => navigate('/admin/members')} className="text-[11px] font-bold text-gray-400 hover:text-[#1a1f4d] dark:hover:text-white transition-colors">Voir Tous</button>
                        </div>
                        <div className="space-y-4 flex-1">
                            {stats.recent.map((m, i) => (
                                <div key={m.id} className={`flex items-center justify-between py-3 px-4 rounded-[3px] ${i === 0 ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-transparent'}`}>
                                    <span className="text-[14px] font-medium text-[#1a1a1a] dark:text-white">{m.firstName} {m.lastName}</span>
                                    <span className="text-[13px] text-gray-500 dark:text-gray-400">{new Date(m.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Financial Activity Bar */}
                <div className="flex items-center justify-between p-6 border border-gray-100 dark:border-white/10 rounded-[3px] bg-white dark:bg-[#111111] shadow-sm mt-6 transition-colors">
                    <div className="flex items-center gap-4">
                        <Wallet className="w-5 h-5 text-gray-400" />
                        <span className="text-[14px] font-bold dark:text-white">Activité Financière</span>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/finances')}
                        className="text-[13px] font-bold text-gray-400 hover:text-[#1a1f4d] dark:hover:text-white transition-colors flex items-center gap-2"
                    >
                        Voir historique <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};

const StatCard = ({ title, value, subValue, icon }) => (
    <div className="border border-gray-100 dark:border-white/10 rounded-[3px] p-5 bg-white dark:bg-[#111111] shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#1a1a1a] dark:text-gray-300">{title}</span>
            <div className="text-gray-400">{icon}</div>
        </div>
        <div className="space-y-1">
            <h4 className="text-xl font-black leading-none dark:text-white">{value}</h4>
            <p className="text-[12px] text-gray-400 font-medium">{subValue}</p>
        </div>
    </div>
);

export default ContactsOverview;
