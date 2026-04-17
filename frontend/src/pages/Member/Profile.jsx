import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Menu, 
    Bell, 
    Search, 
    ArrowLeft, 
    Send, 
    MapPin, 
    Home as HomeIcon, 
    Activity, 
    FileText, 
    Megaphone, 
    Heart, 
    Moon,
    Sun,
    X,
    Building2,
    CheckCircle,
    UserCircle,
    ChevronRight,
    LogOut,
    Settings,
    BookOpen,
    Users,
    ChevronDown,
    Clock,
    LayoutDashboard,
    Calendar,
    MessageSquare,
    Music,
    Droplets,
    CreditCard
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';

// ─── STYLES FROM HOME.JSX ───────────────────────────────────────────────────
const FONT = "'Plus Jakarta Sans', sans-serif";
const SIDEBAR_BG = '#080c14';
const SIDEBAR_BORDER = '#151b28';
const BLUE_CLR = '#4318FF';

const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout, user: authUser } = useAuth();
    const { t, lang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const locale = lang === 'FR' ? 'fr-FR' : 'en-US';

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/members/public-profile/${id}`);
                setMember(res.data.member);
                setPosts(res.data.posts || []);
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

    const navItems = [
        { id: 'dashboard', label: t('overview', "Vue d'ensemble"), icon: <LayoutDashboard size={18} />, path: '/member' },
        { id: 'profile', label: t('my_profile', 'Mon profil'), icon: <UserCircle size={18} />, path: '/member' },
        { id: 'events', label: t('upcoming_events', 'Événements à venir'), icon: <Calendar size={18} />, path: '/member' },
        { id: 'activity', label: t('recent_activity', 'Activité récente'), icon: <Activity size={18} />, path: '/member' },
        { id: 'requests', label: t('my_requests', 'Mes demandes'), icon: <FileText size={18} />, path: '/member' },
        { id: 'donations', label: t('donation_history', 'Historique des dons'), icon: <Heart size={18} />, path: '/member' },
        { id: 'communion', label: t('holy_communion', 'Sainte Cène'), icon: <Droplets size={18} />, path: '/member' },
        { id: 'sunday_school', label: t('sunday_school', 'École du dimanche'), icon: <BookOpen size={18} />, path: '/member' },
        { id: 'worship', label: t('worship', 'Cultes & Événements'), icon: <Music size={18} />, path: '/member' },
        { id: 'groups', label: t('groups', 'Groupes'), icon: <Users size={18} />, path: '/member' },
        { id: 'ministries', label: t('ministries', 'Ministères'), icon: <Building2 size={18} />, path: '/member' },
        { id: 'my_card', label: t('my_member_card', 'Ma carte membre'), icon: <CreditCard size={18} />, path: '/member' }
    ];

    const handleNavClick = (item) => {
        setSidebarOpen(false);
        navigate(item.path, { state: { activeTab: item.id } });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f172a]">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#0f172a]">
                <h2 className="text-xl font-bold mb-4">Membre introuvable</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-[#4318FF] text-white rounded-xl font-bold">Retour</button>
            </div>
        );
    }

    const memberInitials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
    const userInitials = authUser ? `${authUser.firstName?.[0] || ''}${authUser.lastName?.[0] || ''}`.toUpperCase() : '??';

    return (
        <div 
            className={`min-h-screen pb-32 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-slate-900'}`}
            style={{ fontFamily: FONT }}
        >
            {/* ── SIDEBAR DRAWER ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}>
                    <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#080c14] text-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-[#151b28]" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-10 border-b border-[#151b28]">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col leading-tight">
                                    <div className="flex items-center gap-1.5 font-black text-xl">
                                        <span>Elyon Syst</span>
                                        <span className="text-[#F97316]">360</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 tracking-[0.2em] mt-0.5">EDP • 2024</span>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-500"><X size={24} /></button>
                            </div>
                        </div>
                        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-[14px] transition-all ${item.id === 'dashboard' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className={`p-1.5 rounded-lg ${item.id === 'dashboard' ? 'bg-[#6366f1] text-white shadow-lg' : 'bg-slate-800/50'}`}>
                                        {React.cloneElement(item.icon, { size: 16 })}
                                    </div>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-6 border-t border-[#151b28]">
                            <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-4 text-rose-400 font-bold hover:bg-rose-500/10 rounded-xl transition-all">
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
            <header className="sticky top-0 z-[1000] flex items-center justify-between px-5 h-16 bg-white/95 dark:bg-black/95 border-b border-slate-50 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-1">
                        <Menu size={28} className="text-[#1B2559] dark:text-white" />
                    </button>
                    <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-1 font-black text-[18px]">
                            <span className="text-[#1B2559] dark:text-white">Elyon Syst</span>
                            <span className="text-[#F97316]">360</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#1B2559]/60 dark:text-slate-500 tracking-[0.1em] -mt-0.5">EDP</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-[12px] font-black tracking-widest text-[#4318FF] dark:text-indigo-400 uppercase hidden sm:block">FR/EN</button>
                    <button onClick={toggleTheme} className="p-2 bg-[#F4F7FE] dark:bg-slate-900 rounded-full text-[#4318FF] dark:text-indigo-400 transition-all hover:scale-105">
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <div className="relative">
                        <div className="w-9 h-9 bg-[#F4F7FE] dark:bg-slate-900 rounded-full flex items-center justify-center text-[#4318FF]">
                           <Bell size={20} />
                        </div>
                        <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-[8px] font-black text-white">0</span>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-100">
                         {authUser?.photo ? <img src={getImageUrl(authUser.photo)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-[12px] font-black">{userInitials}</div>}
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <main className="px-5 mt-4 max-w-3xl mx-auto">
                {/* Search Bar */}
                <div className="flex items-center bg-[#F4F7FE] dark:bg-slate-900/40 h-11 px-4 rounded-xl border border-transparent focus-within:border-[#4318FF] shadow-sm">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={18} className="text-slate-500" />
                    </button>
                    <Search size={18} className="text-slate-400 mx-3" />
                    <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-[14px] font-medium flex-1 text-slate-900 dark:text-white" />
                </div>

                {/* Profile Section - LEFT ALIGNED AS PER SCREENSHOT */}
                <section className="mt-8 flex flex-col items-start">
                    <div className="w-[124px] h-[124px] rounded-full overflow-hidden mb-6 shadow-xl border-4 border-white dark:border-slate-900 bg-slate-100">
                         {member.photo ? (
                             <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4318FF] to-[#6366f1] text-white text-5xl font-black">{memberInitials}</div>
                         )}
                    </div>

                    <h2 className="text-[24px] font-bold text-[#1B2559] dark:text-white leading-tight tracking-tight">
                        {member.firstName} {member.lastName}
                    </h2>

                    <p className="mt-2 text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-[320px]">
                        {member.notes || "Description du mem,bre, theologie, et bishop , ensignant"}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-[13px]">
                        <span>Ville, Pays</span>
                    </div>

                    <p className="mt-2 text-[16px] font-bold text-[#1B2559] dark:text-white">
                        {member.church?.name ? toSentenceCase(member.church.name) : "Nom de l'eglise associer"}
                    </p>

                    {/* Action Link Left Aligned */}
                    <div className="mt-8 flex items-center gap-4 text-[#4318FF]">
                        <Send size={24} className="rotate-45" />
                        <button onClick={() => window.location.href = `mailto:${member.email}`} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#4318FF] transition-colors">
                            envoyer un message a {member.firstName}
                        </button>
                    </div>
                </section>

                {/* Publications Header Left Aligned */}
                <div className="mt-12 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white shadow-lg">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-[20px] font-bold text-[#4B39EF] dark:text-indigo-400">
                        publications
                    </h3>
                </div>

                {/* Feed List Left Aligned */}
                <div className="space-y-8 pb-32">
                    {posts.length > 0 ? posts.map((post, idx) => (
                        <div key={post.id || idx} className="flex flex-col">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100">
                                        {member.photo ? <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-[10px] font-black">{memberInitials}</div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[16px] text-[#1B2559] dark:text-white">{member.firstName} {member.lastName}</span>
                                        <span className="text-[13px] font-bold text-[#4B39EF] -mt-1">{post.type || 'Concert'}</span>
                                        <span className="text-[12px] font-medium text-slate-400 italic">june 27th</span>
                                    </div>
                                </div>
                                <span className="text-slate-400 font-bold text-[12px]">3:30pm</span>
                            </div>
                            <p className="mt-3 text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                {post.content}
                            </p>
                            <button className="self-end mt-2 font-black text-slate-900 dark:text-white text-[12px]">Voir plus</button>
                        </div>
                    )) : (
                        <div className="flex flex-col gap-8">
                            {/* Static content from screenshot if no data */}
                            <div className="flex flex-col">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200">
                                            {member.photo && <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-[16px] text-[#1B2559] dark:text-white">John Widno</span>
                                            <span className="text-[13px] font-bold text-[#4B39EF] -mt-1">Concert</span>
                                            <span className="text-[12px] font-medium text-slate-400 italic">june 27th</span>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 font-bold text-[12px]">3:30pm</span>
                                </div>
                                <p className="mt-3 text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-left">
                                    Hello mes amis Nouveau concert pour les jeunes de la toute la communaué invite a prendre part
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-[110px] h-[110px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                     <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=300&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col text-left py-1">
                                    <div className="flex justify-between items-start">
                                         <span className="font-bold text-[16px] text-[#1B2559] dark:text-white">john Widno</span>
                                         <span className="text-slate-400 font-bold text-[12px]">3:30pm</span>
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-500">Evet location</span>
                                    <span className="text-[13px] font-medium text-slate-400 italic">june 27th</span>
                                    <p className="text-[13px] font-medium text-slate-500 line-clamp-2 mt-1">start the Descriptin of the event</p>
                                    <button className="self-end mt-1 font-black text-slate-900 dark:text-white text-[12px]">Voir plus</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ── BOTTOM NAV ── */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-[#080c14] border-t border-slate-100 dark:border-white/5 rounded-t-[2rem] shadow-lg flex items-center justify-around px-5 z-[50]">
                <button onClick={() => navigate('/member')} className="text-[#4318FF]"><HomeIcon size={26} /></button>
                <button className="text-[#A3AED0]"><Activity size={26} /></button>
                <button className="text-[#A3AED0]"><FileText size={26} /></button>
                <button className="text-[#A3AED0]"><Megaphone size={26} /></button>
                <button className="text-[#A3AED0]"><Heart size={26} /></button>
                <button onClick={toggleTheme} className="text-[#A3AED0]"><Moon size={26} /></button>
            </nav>
        </div>
    );
};

export default PublicMemberProfile;
