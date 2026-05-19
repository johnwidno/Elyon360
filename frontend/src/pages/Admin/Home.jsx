
import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useLanguage } from '../../context/LanguageContext';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Users, UserMinus, UserCheck, Calendar, LayoutGrid, FileText, UserPlus, UserRoundCheck, Loader2, ArrowRight } from 'lucide-react';

export default function AdminHome() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/churches/dashboard-stats');
                setStats(res.data);
            } catch (error) {
                console.error("Erreur stats dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-10 h-10 text-gray-300 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-[1600px] mx-auto space-y-8 pb-10 font-['Inter',_sans-serif]">
                {/* Breadcrumbs & Title */}
                <div className="space-y-2">
                    <nav className="text-sm font-bold text-[#1A202C] dark:text-white">
                        Tableau de bord / <span className="text-[#1A202C] dark:text-white/80">Vue d'ensemble</span>
                    </nav>
                    <p className="text-sm text-[#718096] dark:text-gray-400">
                        Gérez les activités, les membres et les finances de votre institution.
                    </p>
                </div>

                {/* KPI Cards Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard 
                        title="Total Membres" 
                        value={stats?.memberCount || 0} 
                        label="Active" 
                        icon={<Users size={16} />} 
                    />
                    <StatCard 
                        title="Membres Inactifs" 
                        value={0} 
                        label="Decede/ transfere" 
                        icon={<UserMinus size={16} />} 
                    />
                    <StatCard 
                        title="Total Visiteurs" 
                        value={stats?.visitorCount || 0} 
                        label="Nouveaux" 
                        icon={<UserCheck size={16} />} 
                    />
                    <StatCard 
                        title="Groupes & Ministere" 
                        value={stats?.groupCount || 0} 
                        label="Active" 
                        icon={<LayoutGrid size={16} />} 
                    />
                    <StatCard 
                        title="Organisation" 
                        value={stats?.organizationCount || 0} 
                        label="Active" 
                        icon={<LayoutGrid size={16} />} 
                    />
                </div>

                {/* Middle Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Community Growth Chart */}
                    <div className="xl:col-span-8 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 p-6 rounded-[3px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-[#1A202C] dark:text-white uppercase tracking-tight">Croissance de la Communauté</h3>
                                <p className="text-[10px] text-[#A0AEC0] dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Membres sur les 30 derniers jours</p>
                            </div>
                            <span className="text-[10px] font-bold text-[#A0AEC0] dark:text-gray-500 uppercase tracking-widest">LIVE</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.memberGrowth || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7" className="dark:stroke-white/5" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#A0AEC0', fontSize: 10 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#A0AEC0', fontSize: 10 }} 
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '3px', border: 'none', backgroundColor: '#1A202C', color: 'white', fontSize: '12px' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="members" 
                                        stroke="#2D3748" 
                                        strokeWidth={2} 
                                        fill="transparent" 
                                        className="dark:stroke-white"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="xl:col-span-4 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 p-6 flex flex-col rounded-[3px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-[#1A202C] dark:text-white">Evenement à Venir</h3>
                            <Link to="/admin/events" className="text-[10px] font-bold text-[#718096] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Voir Tous</Link>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto noscrollbar">
                            {stats?.upcomingCeremonies?.length > 0 ? (
                                stats.upcomingCeremonies.map((event, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-[#FFFFF0] dark:bg-yellow-900/10 rounded-[3px] border border-yellow-100 dark:border-yellow-900/20">
                                        <span className="text-xs font-medium text-[#2D3748] dark:text-white truncate pr-4">{event.type || event.title}</span>
                                        <span className="text-xs text-[#718096] dark:text-gray-400 whitespace-nowrap">{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-10 italic">Aucun événement prévu</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Quick Actions */}
                    <div className="xl:col-span-8">
                        <h3 className="text-sm font-bold text-[#1A202C] dark:text-white mb-6 uppercase tracking-tight">Action Rapide</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <QuickActionButton label="Nouveau membre" icon={<Users size={16} />} onClick={() => navigate('/admin/members/new')} />
                            <QuickActionButton label="Tous les Membres" icon={<UserRoundCheck size={16} />} onClick={() => navigate('/admin/members')} />
                            <QuickActionButton label="Raport Anniversaire" icon={<FileText size={16} />} onClick={() => navigate('/admin/reports/birthdays')} />
                            <QuickActionButton label="Nouveau Groupe" icon={<Users size={16} />} onClick={() => navigate('/admin/groups/new')} />
                            <QuickActionButton label="Ajouter un Event" icon={<Calendar size={16} />} onClick={() => navigate('/admin/events/new')} />
                            <QuickActionButton label="Raport General" icon={<FileText size={16} />} onClick={() => navigate('/admin/reports/general')} />
                        </div>
                    </div>

                    {/* New Members Added */}
                    <div className="xl:col-span-4 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 p-6 flex flex-col rounded-[3px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-[#1A202C] dark:text-white">Nouveaux Membre Ajouté</h3>
                            <Link to="/admin/members" className="text-[10px] font-bold text-[#718096] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Voir Tous</Link>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto noscrollbar">
                            {stats?.recentMembers?.length > 0 ? (
                                stats.recentMembers.map((member, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-[#F0FFF4] dark:bg-green-900/10 rounded-[3px] border border-green-100 dark:border-green-900/20">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0 border border-white/5">
                                                {member.photo && <img src={member.photo} className="w-full h-full rounded-full object-cover" />}
                                            </div>
                                            <span className="text-xs font-medium text-[#2D3748] dark:text-white truncate">{member.firstName} {member.lastName}</span>
                                        </div>
                                        <span className="text-[10px] text-[#718096] dark:text-gray-400 whitespace-nowrap ml-2">{new Date(member.createdAt).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-10 italic">Aucun membre récent</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Activity Section */}
                <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 p-6 rounded-[3px]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <h3 className="text-sm font-bold text-[#1A202C] dark:text-white uppercase tracking-tight">Activité Financière</h3>
                                <p className="text-[10px] text-[#A0AEC0] dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Résumé des revenus récents</p>
                            </div>
                            <div className="h-10 w-px bg-gray-100 dark:bg-white/5 hidden md:block"></div>
                            <div className="flex gap-8">
                                {Object.entries(stats?.donationTotals || {}).map(([curr, amount]) => (
                                    <div key={curr}>
                                        <p className="text-[10px] font-bold text-[#718096] dark:text-gray-400 uppercase">{curr}</p>
                                        <p className="text-lg font-bold text-[#1A202C] dark:text-white">{amount.toLocaleString()} <span className="text-xs text-gray-400 font-medium">{curr}</span></p>
                                    </div>
                                ))}
                                {Object.keys(stats?.donationTotals || {}).length === 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[#718096] dark:text-gray-400 uppercase tracking-widest">DONS</p>
                                        <p className="text-lg font-bold text-[#1A202C] dark:text-white">0.00 <span className="text-xs text-gray-400 font-medium">HTG</span></p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Link 
                            to="/admin/finances" 
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A202C] dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-200 text-white text-xs font-bold rounded-full transition-all group"
                        >
                            Voir historique
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

const StatCard = ({ title, value, label, icon }) => (
    <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 p-4 relative min-h-[100px] flex flex-col justify-between rounded-[3px]">
        <div className="flex justify-between items-start">
            <h4 className="text-[11px] font-bold text-[#4A5568] dark:text-gray-400 uppercase tracking-tight">{title}</h4>
            <div className="text-[#A0AEC0] dark:text-gray-500">{icon}</div>
        </div>
        <div>
            <p className="text-xl font-bold text-[#1A202C] dark:text-white mt-2 leading-none">{value}</p>
            <p className="text-[10px] text-[#718096] dark:text-gray-500 font-medium mt-1 uppercase tracking-tighter">{label}</p>
        </div>
    </div>
);

const QuickActionButton = ({ label, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 px-6 py-3 border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1e293b] hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-[#1A202C] dark:text-white rounded-[3px] shadow-sm"
    >
        <span className="text-[#A0AEC0] dark:text-gray-500">{icon}</span>
        <span className="text-xs font-bold whitespace-nowrap">{label}</span>
    </button>
);