import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Search, 
    Bell,
    Send, 
    MoreHorizontal,
    LayoutDashboard,
    UserCircle,
    Calendar,
    Activity,
    FileText,
    Music,
    Users,
    Building2,
    LogOut,
    Droplets,
    BookOpen,
    Moon,
    Sun
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';

const FONT = "'Plus Jakarta Sans', sans-serif";

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout, user: authUser } = useAuth();
    const { lang, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [communityMembers, setCommunityMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/members/public-profile/${id}`);
                setMember(res.data.member);
                setPosts(res.data.posts || [
                    { id: 1, content: "Hello mes amis Nouveau concert pour les jeunes de la toute la communaué invite a prendre part", type: "Concert", createdAt: "2024-06-27T15:30:00Z" },
                    { id: 2, content: "Hello mes amis Nouveau concert pour les jeunes de la toute la communaué invite a prendre part", type: "Concert", createdAt: "2024-06-27T15:30:00Z" }
                ]);
                setCommunityMembers([
                    { id: 101, firstName: "John", lastName: "Widno", church: "Eglise de Dieu de Port-au-Prince" },
                    { id: 102, firstName: "Loomie", lastName: "Domingue", church: "Eglise de Dieu de Port-au-Prince" }
                ]);
            } catch (error) {
                console.error("Error fetching member profile:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMemberData();
    }, [id]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const baseUrl = api.defaults.baseURL.replace('/api', '');
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-[#4318FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!member) return <div className="p-20 text-center font-bold">Membre introuvable</div>;

    const navItems = [
        { id: 'dashboard', label: "Vue d'ensemble", icon: <LayoutDashboard size={20} /> },
        { id: 'profile', label: 'Mon profil', icon: <UserCircle size={20} /> },
        { id: 'events', label: 'Événements à venir', icon: <Calendar size={20} /> },
        { id: 'activity', label: 'Activité récente', icon: <Activity size={20} /> },
        { id: 'requests', label: 'Mes demandes', icon: <FileText size={20} /> },
        { id: 'donations', label: 'Historique des dons', icon: <Users size={20} /> },
        { id: 'communion', label: 'Sainte Cène', icon: <Droplets size={20} /> },
        { id: 'sunday_class', label: 'Classes dominicales', icon: <BookOpen size={20} /> },
        { id: 'worship', label: 'Cultes & Événements', icon: <Music size={20} />, active: true },
        { id: 'groups', label: 'Groupes', icon: <Users size={20} /> },
        { id: 'ministries', label: 'Ministères', icon: <Building2 size={20} /> },
    ];

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#0b1437]" style={{ fontFamily: FONT }}>
            
            {/* ── SIDEBAR (As seen in screenshot) ── */}
            <aside className="hidden lg:flex flex-col w-[290px] bg-[#0B1437] text-white shrink-0">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                             <img src="https://cdn-icons-png.flaticon.com/512/3669/3669973.png" alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="flex flex-col select-none leading-none">
                            <div className="flex items-center gap-1 font-black text-[10px] text-white/40 uppercase tracking-tighter">
                                <span>Elyon Syst</span>
                                <span className="text-orange-500">360</span>
                            </div>
                            <span className="text-[18px] font-black tracking-tight mt-1">EDDPFRN</span>
                            <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase tracking-tight">Eglise de dieu de port au prince</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => (
                        <div key={item.id} className="relative">
                            <button 
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all duration-300 font-bold text-[14px] ${item.active ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span className={`${item.active ? 'text-indigo-500' : 'text-slate-500'}`}>{item.icon}</span>
                                {item.label}
                            </button>
                            {item.active && (
                                <div className="absolute inset-y-1 left-2 right-4 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-xl pointer-events-none border-l-4 border-indigo-500"></div>
                            )}
                            {item.active && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-l-full shadow-[0_0_15px_rgba(79,70,229,0.8)]"></div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5">
                    <button onClick={logout} className="flex items-center gap-4 text-orange-500 font-black text-[14px] uppercase tracking-wider">
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* ── HEADER (As seen in screenshot) ── */}
                <header className="h-20 flex items-center justify-between px-10 bg-white dark:bg-[#0b1437]">
                    <div className="flex items-end gap-2.5">
                        <div className="flex flex-col">
                            <span className="text-[#4318FF] font-black text-[24px] leading-tight tracking-tight">profiles</span>
                            <span className="text-slate-300 font-bold text-[15px] uppercase tracking-widest leading-none">ESPACE MEMBRE</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center flex-1 max-w-lg mx-12">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search" 
                                className="w-full bg-[#F4F7FE] dark:bg-white/5 border-none rounded-lg py-3 pl-12 pr-6 text-[14px] font-bold text-slate-700 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button onClick={toggleTheme} className="w-10 h-10 bg-[#E9EDF7] dark:bg-white/5 rounded-full flex items-center justify-center text-slate-600 shadow-inner">
                            {isDark ? <Sun size={20} /> : <div className="w-6 h-6 bg-slate-200 rounded-full border-4 border-slate-300 shadow-inner" />}
                        </button>
                        <span className="text-[14px] font-black text-slate-400 dark:text-white cursor-pointer hover:text-[#4318FF] transition-colors">FR/EN</span>
                        <Bell size={22} className="text-[#4318FF]" />
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl cursor-pointer">
                            {getImageUrl(authUser?.photo) ? (
                                <img src={getImageUrl(authUser.photo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-[12px] font-black uppercase">
                                    {authUser?.firstName?.[0]}{authUser?.lastName?.[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── SCREEN CONTENT ── */}
                <main className="flex-1 overflow-y-auto p-12 bg-white noscrollbar">
                    <div className="max-w-[1300px] mx-auto space-y-12">
                        
                        {/* ── PROFILE CARD ── */}
                        <div className="relative group">
                            {/* Grey Banner Area */}
                            <div className="h-[240px] w-full bg-[#F4F7FE] rounded-none"></div>
                            
                            <div className="px-16 -mt-24 pb-4">
                                <div className="flex items-end justify-between">
                                    <div className="w-48 h-48 rounded-full overflow-hidden border-[8px] border-white shadow-2xl bg-white">
                                        {member.photo ? (
                                            <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#F4F7FE] text-slate-300">
                                                <UserCircle size={100} strokeWidth={1} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pb-12 mr-4">
                                        <span className="text-slate-400 font-bold text-[16px]">Active</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div className="space-y-2">
                                        <h2 className="text-[38px] font-black text-[#1B2559] tracking-tight">{member.firstName} {member.lastName}</h2>
                                        <p className="text-slate-500 font-bold text-[17px] leading-tight max-w-3xl">
                                            {member.notes || "Description du mem,bre, theologie, et bishop , enseignant"}
                                        </p>
                                        <p className="text-slate-400 font-bold text-[14px]">{member.city || 'Ville'}, {member.country || 'Pays'}</p>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                        <h4 className="text-[20px] font-black text-[#1B2559]">{member.church?.name || "Nom de L'eglise associer"}</h4>
                                    </div>

                                    {/* Quick Actions Links */}
                                    <div className="flex items-center gap-24 pt-4">
                                        <button className="flex items-center gap-6 group">
                                            <div className="p-3.5 bg-sky-100 rounded-xl text-sky-50 group-hover:scale-110 transition-transform">
                                                <Send size={24} className="-rotate-12" />
                                            </div>
                                            <span className="text-slate-600 font-bold text-[17px]">Envoyer un message a {member.firstName}</span>
                                        </button>
                                        <button className="flex items-center gap-6 group">
                                            <div className="p-3.5 bg-sky-100 rounded-xl text-sky-50 group-hover:scale-110 transition-transform">
                                                <Send size={24} className="-rotate-12" />
                                            </div>
                                            <span className="text-slate-600 font-bold text-[17px]">Faire une publication</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── LOWER CONTENT SECTIONS ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-10">
                            
                            {/* PUBLICATIONS COLUMN */}
                            <div className="lg:col-span-8">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                                    <h3 className="text-[#4318FF] font-black text-[26px] tracking-tight">publications</h3>
                                </div>

                                <div className="space-y-12">
                                    {posts.map((post, idx) => (
                                        <div key={post.id || idx} className="bg-white rounded-none space-y-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shadow-sm border border-slate-50">
                                                        {member.photo ? <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-black">{member.firstName[0]}</div>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-[20px] text-[#1B2559] tracking-tight leading-none">{member.firstName} {member.lastName}</span>
                                                        <span className="text-slate-500 font-bold text-[14px] mt-1.5">{post.type || 'Annonce'}</span>
                                                        <span className="text-slate-400 font-bold text-[13px] uppercase mt-0.5">{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}{new Date(post.createdAt || Date.now()).getDate() === 27 ? 'th' : ''}</span>
                                                    </div>
                                                </div>
                                                <span className="text-slate-500 font-bold text-[16px]">{new Date(post.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
                                            </div>
                                            <div className="pl-1 flex flex-col pt-2">
                                                <p className="text-[18px] font-medium text-slate-700 leading-relaxed">
                                                    {post.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* OTHERS COLUMN */}
                            <div className="lg:col-span-4">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                                    <h3 className="text-[#4318FF] font-black text-[26px] tracking-tight leading-tight">Autres Membres de la comunauté</h3>
                                </div>

                                <div className="bg-[#FFFFFF] rounded-[2.5rem] p-4 lg:p-0 space-y-10">
                                    {communityMembers.map(m => (
                                        <div key={m.id} className="flex items-center gap-5 group cursor-pointer hover:translate-x-1 transition-transform">
                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 text-white flex items-center justify-center text-sm font-black shadow-lg">
                                                {m.firstName[0]}{m.lastName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[18px] text-[#1B2559] group-hover:text-[#4318FF] transition-colors">{m.firstName} {m.lastName}</span>
                                                <span className="text-slate-400 font-bold text-[13px] leading-tight mt-1">{m.church}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PublicMemberProfile;
