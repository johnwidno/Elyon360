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
    Calendar,
    MessageSquare,
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
    Clock
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';

const FONT_FAMILY = "'Plus Jakarta Sans', sans-serif";

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
        if (path.startsWith('http')) return path;
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const base = isLocalhost ? 'http://localhost:5000/api' : 'https://elyonsyst360.onrender.com/api';
        const apiBase = process.env.REACT_APP_API_URL || base;
        return `${apiBase}/uploads/${path}`;
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
                <h2 className="text-2xl font-bold mb-4">Membre introuvable</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-[#4318FF] text-white rounded-xl font-bold">Retour</button>
            </div>
        );
    }

    const memberInitials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
    const userInitials = authUser ? `${authUser.firstName?.[0] || ''}${authUser.lastName?.[0] || ''}`.toUpperCase() : '??';

    return (
        <div 
            className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-slate-900'}`}
            style={{ fontFamily: FONT_FAMILY }}
        >
            {/* ── SIDEBAR DRAWER (REPLICATED FROM HOME.JSX) ── */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm transition-opacity" 
                    onClick={() => setSidebarOpen(false)}
                >
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#080c14] text-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col leading-tight">
                                <div className="flex items-center gap-1 font-black text-xl">
                                    <span>Elyon Syst</span>
                                    <span className="text-[#F97316]">360</span>
                                </div>
                                <span className="text-[12px] font-bold text-gray-400 tracking-[0.1em]">EDP</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon size={20} />, active: true },
                                { id: 'profile', label: 'Profile', icon: <UserCircle size={20} /> },
                                { id: 'church', label: 'Mon Eglise', icon: <Building2 size={20} /> },
                                { id: 'activity', label: 'Activity', icon: <Activity size={20} /> },
                                { id: 'events', label: 'Events', icon: <Calendar size={20} /> },
                                { id: 'bibles', label: 'Bible Guide', icon: <BookOpen size={20} /> },
                                { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-[15px] transition-all ${item.active ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={logout}
                            className="mt-6 flex items-center gap-4 px-4 py-4 text-rose-400 font-bold hover:bg-rose-500/10 rounded-2xl transition-all"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            )}

            {/* ── HEADER (TITLE BAR) ── */}
            <header className="sticky top-0 z-[1000] flex items-center justify-between px-5 h-20 bg-white dark:bg-black border-b border-slate-50 dark:border-white/5 backdrop-blur-md bg-opacity-95">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-1">
                        <Menu size={32} className="text-[#1B2559] dark:text-white" />
                    </button>
                    <div className="flex flex-col leading-tight">
                        <div className="flex items-center gap-1 font-black text-[20px]">
                            <span className="text-[#1B2559] dark:text-white">Elyon Syst</span>
                            <span className="text-[#F97316]">360</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#1B2559] dark:text-slate-400 tracking-[0.1em]">EDP</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden sm:block h-8 w-[1.5px] bg-slate-200 dark:bg-slate-800" />
                    <button className="text-[14px] font-black tracking-tight text-[#4318FF] dark:text-indigo-400 uppercase">FR/EN</button>
                    
                    {/* Dark Mode Toggle in Header */}
                    <button 
                        onClick={toggleTheme}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[#4318FF] dark:text-indigo-400 transition-all active:scale-95"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="relative">
                        <div className="w-10 h-10 bg-[#E9EDF7] dark:bg-slate-800 rounded-full flex items-center justify-center text-[#4318FF]">
                           <Bell size={22} />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-indigo-600 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-[8px] font-black text-white shadow-sm">0</span>
                    </div>
                    
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#E9EDF7] dark:border-slate-800 shadow-sm bg-slate-100">
                         {authUser?.photo ? (
                             <img src={getImageUrl(authUser.photo)} alt="" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-sm font-black">{userInitials}</div>
                         )}
                    </div>
                </div>
            </header>

            {/* ── SEARCH BAR (PILL STYLE) ── */}
            <div className="px-5 mt-4">
                <div className="flex items-center bg-[#F4F7FE] dark:bg-slate-900/50 h-[52px] px-5 rounded-[26px] border border-transparent focus-within:border-[#4318FF] focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-sm">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <Search size={20} className="text-slate-400 mx-3" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="bg-transparent border-none outline-none text-[15px] font-semibold flex-1 placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* ── PROFILE INFO ── */}
            <section className="mt-10 px-7 flex flex-col items-start max-w-2xl mx-auto">
                {/* Avatar Left-Aligned */}
                <div className="w-[140 px] h-[140px] rounded-full overflow-hidden mb-8 shadow-2xl border-4 border-white dark:border-slate-900 bg-slate-100">
                    {member.photo ? (
                        <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover shadow-inner" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4318FF] to-[#6366f1] text-white text-5xl font-extrabold">{memberInitials}</div>
                    )}
                </div>

                {/* Name */}
                <h2 className="text-[32px] font-black text-[#1B2559] dark:text-white leading-[1.1] tracking-tight">
                    {member.firstName} {member.lastName}
                </h2>

                {/* Bio */}
                <p className="mt-4 text-[16px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[400px]">
                    {member.notes || "Description du membre, théologie, et bishop , ensignant"}
                </p>

                {/* Location with Icon */}
                <div className="mt-5 flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                    <MapPin size={18} className="text-rose-500" />
                    {member.city ? `${member.city}, ${member.country || 'Pays'}` : "Ville, Pays"}
                </div>

                {/* Church Name (Sentence Case) */}
                <p className="mt-2 text-[18px] font-black text-[#1B2559] dark:text-white flex items-center gap-2">
                    <Building2 size={18} className="text-[#4318FF]" />
                    {member.church?.name ? toSentenceCase(member.church.name) : "Nom de l'église associée"}
                </p>

                {/* Action Link */}
                <div className="mt-10 flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center text-white bg-[#4318FF] rounded-2xl shadow-lg shadow-[#4318FF]/20 animate-pulse">
                        <Send size={24} className="rotate-45" />
                    </div>
                    <button 
                        onClick={() => window.location.href = `mailto:${member.email}`}
                        className="text-[18px] font-black text-[#1B2559] dark:text-white hover:text-[#4318FF] dark:hover:text-indigo-400 transition-colors"
                    >
                        envoyer un message a {member.firstName}
                    </button>
                </div>
            </section>

            {/* ── PUBLICATIONS HEADER ── */}
            <div className="px-5 mt-16 mb-8 max-w-2xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <FileText size={22} />
                    </div>
                    <h3 className="text-[24px] font-black tracking-tight text-[#4B39EF] dark:text-indigo-400">
                        publications
                    </h3>
                </div>
                <button className="text-[13px] font-black uppercase tracking-widest text-[#4318FF] dark:text-indigo-400">Voir tout</button>
            </div>

            {/* ── FEED LIST ── */}
            <div className="px-5 space-y-10 pb-40 max-w-2xl mx-auto">
                {posts.length > 0 ? posts.map((post, idx) => (
                    <div key={post.id || idx} className="flex flex-col animate-in fade-in duration-500">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-100 dark:border-slate-800">
                                    {member.photo ? (
                                        <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-xs font-black">{memberInitials}</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-[17px] text-[#1B2559] dark:text-white leading-tight">{member.firstName} {member.lastName}</span>
                                    <span className="text-[14px] font-bold text-[#4B39EF] dark:text-[#6366f1]">{post.type || 'Annonce'}</span>
                                    <span className="text-[14px] font-medium text-slate-400 italic mt-0.5">
                                        {new Date(post.createdAt || new Date()).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <span className="text-slate-400 font-bold text-[13px] bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                {new Date(post.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        
                        {post.imageUrl && (
                            <div className="mt-5 w-full h-[240px] rounded-[2rem] overflow-hidden shadow-xl border border-slate-50 dark:border-slate-800">
                                <img src={getImageUrl(post.imageUrl)} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <p className="mt-4 text-[16px] font-medium text-slate-600 dark:text-slate-300 leading-[1.6]">
                            {post.content}
                        </p>
                        
                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl transition-all active:scale-95">
                                    <Heart size={18} /> {post.likesCount || 0}
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 font-bold text-sm px-2">
                                    <MessageSquare size={18} /> {post.commentsCount || 0}
                                </button>
                            </div>
                            <button className="font-black text-[13px] text-[#1B2559] dark:text-white uppercase tracking-widest border-b-2 border-[#4318FF] pb-0.5">
                                Voir plus
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                        <FileText size={60} strokeWidth={1} />
                        <p className="font-bold text-xl">Aucune publication trouvée</p>
                    </div>
                )}
            </div>

            {/* ── BOTTOM TASK BAR (CONSISTENT WITH HOME.JSX) ── */}
            <nav className="fixed bottom-0 left-0 right-0 h-22 bg-white dark:bg-[#080c14] border-t border-slate-100 dark:border-slate-800 rounded-t-[3rem] shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.12)] flex items-center justify-around px-8 z-[1000] pb-2">
                <button onClick={() => navigate('/member')} className="flex flex-col items-center gap-1.5 transition-all text-[#A3AED0] hover:text-[#4318FF]">
                    <HomeIcon size={28} />
                </button>
                <button className="flex flex-col items-center gap-1.5 transition-all text-[#A3AED0] hover:text-[#4318FF]">
                    <Activity size={28} />
                </button>
                <button className="flex flex-col items-center gap-1.5 transition-all text-[#A3AED0] hover:text-[#4318FF]">
                    <FileText size={28} />
                </button>
                <button className="flex flex-col items-center gap-1.5 transition-all text-[#A3AED0] hover:text-[#4318FF]">
                    <Megaphone size={28} />
                </button>
                <button className="flex flex-col items-center gap-1.5 transition-all text-[#A3AED0] hover:text-[#4318FF]">
                    <Heart size={28} />
                </button>
                <button className={`flex flex-col items-center gap-1.5 transition-all ${isDark ? 'text-indigo-400' : 'text-[#4318FF]'}`}>
                    <UserCircle size={28} fill="currentColor" className="opacity-10 absolute scale-125" />
                    <UserCircle size={28} />
                </button>
            </nav>
        </div>
    );
};

export default PublicMemberProfile;
