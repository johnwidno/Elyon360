import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Search, 
    ArrowLeft, 
    Send, 
    MapPin, 
    FileText, 
    ChevronRight,
    CheckCircle,
    Mail,
    Phone,
    Calendar,
    Award,
    Hash,
    MoreHorizontal,
    Share2,
    Briefcase,
    Heart,
    Star
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';

// Centralized Layout Components
import MemberHeader from '../../components/Member/MemberHeader';
import MemberSidebar from '../../components/Member/MemberSidebar';
import MemberBottomNav from '../../components/Member/MemberBottomNav';

const FONT = "'Plus Jakarta Sans', sans-serif";

const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout, user: authUser } = useAuth();
    const { lang, t } = useLanguage();
    const { theme } = useTheme();
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

    const handleNavClick = (item) => {
        setSidebarOpen(false);
        navigate(item.path, { state: { activeTab: item.id } });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] dark:bg-[#0b1437]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-indigo-600 font-bold animate-pulse">Chargement du profil...</span>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F4F7FE] dark:bg-[#0b1437]">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6">
                    <Hash size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Membre introuvable</h2>
                <p className="text-slate-500 mb-8 max-w-xs">Ce profil n'existe pas ou a été déplacé.</p>
                <button onClick={() => navigate(-1)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200">Retour</button>
            </div>
        );
    }

    const memberInitials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
    const userInitials = authUser ? `${authUser.firstName?.[0] || ''}${authUser.lastName?.[0] || ''}`.toUpperCase() : '??';

    return (
        <div 
            className={`min-h-screen pb-32 transition-colors duration-300 ${isDark ? 'bg-[#0b1437] text-white' : 'bg-[#F4F7FE] text-slate-900'}`}
            style={{ fontFamily: FONT }}
        >
            {/* ── SIDEBAR & HEADER ── */}
            <MemberSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavClick={handleNavClick} logout={logout} />
            <MemberHeader onMenuClick={() => setSidebarOpen(true)} getImageUrl={getImageUrl} userInitials={userInitials} />

            {/* ── BANNER / COVER ── */}
            <div className="relative h-[200px] lg:h-[300px] w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
                </div>
                <button 
                  onClick={() => navigate(-1)}
                  className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl text-white transition-all z-10"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* ── MAIN CONTENT CONTAINER ── */}
            <main className="max-w-[1400px] mx-auto px-5 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Profile Info Card */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-[#111c44] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[2.5rem] overflow-hidden mb-6 border-8 border-white dark:border-[#111c44] shadow-2xl bg-slate-100">
                                     {member.photo ? (
                                         <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-5xl font-black">{memberInitials}</div>
                                     )}
                                </div>
                                <h2 className="text-[26px] font-black text-[#1B2559] dark:text-white leading-tight">
                                    {member.firstName} {member.lastName}
                                </h2>
                                <p className="text-indigo-600 dark:text-indigo-400 font-black text-[14px] uppercase tracking-widest mt-1">
                                    {member.contactSubtype?.name || member.memberCategory?.name || "Membre de l'église"}
                                </p>

                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <span className="px-4 py-1.5 bg-[#4318FF]/5 dark:bg-indigo-500/10 rounded-full text-[11px] font-black text-[#4318FF] dark:text-indigo-400 uppercase tracking-wider">
                                        ID: {member.memberCode || 'N/A'}
                                    </span>
                                    <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                        Active
                                    </span>
                                </div>

                                <p className="mt-8 text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-600 pl-4 py-2 text-left w-full">
                                    "{member.notes || "Ce membre n'a pas encore ajouté de biographie publique."}"
                                </p>

                                <div className="mt-8 w-full space-y-4 pt-8 border-t border-slate-50 dark:border-white/5">
                                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = `mailto:${member.email}`}>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                            <Mail size={18} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</span>
                                            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{member.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
                                            <MapPin size={18} />
                                        </div>
                                        <div className="flex flex-col text-left text-ellipsis overflow-hidden">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Localisation</span>
                                            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 truncate">{member.city ? `${member.city}, ${member.country || ''}` : 'Ville, Pays'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Anniversaire</span>
                                            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{member.birthDate ? new Date(member.birthDate).toLocaleDateString(locale, { day: 'numeric', month: 'long' }) : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => window.location.href = `mailto:${member.email}`} className="mt-10 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-black text-[14px] uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2">
                                    <Send size={18} className="rotate-45" />
                                    Envoyer un message
                                </button>
                            </div>
                        </div>

                        {/* Extra Section: Social / Stats */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-white/5">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Présence Digitale</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <a href="#" className="flex items-center justify-center h-12 bg-indigo-50/50 dark:bg-white/5 rounded-2xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                                    <span className="text-[14px] font-black">FACEBOOK</span>
                                </a>
                                <a href="#" className="flex items-center justify-center h-12 bg-rose-50/50 dark:bg-white/5 rounded-2xl text-rose-500 dark:text-rose-400 hover:bg-rose-100 transition-colors">
                                    <span className="text-[14px] font-black">INSTAGRAM</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Overview / Feed */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Summary Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-[#111c44] p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <span className="text-[20px] font-black text-slate-800 dark:text-white block">{posts.length}</span>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Publications</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#111c44] p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <span className="text-[20px] font-black text-slate-800 dark:text-white block">12</span>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Événements</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#111c44] p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <span className="text-[20px] font-black text-slate-800 dark:text-white block">4</span>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Distinctions</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Publications Feed */}
                        <div className="bg-white dark:bg-[#111c44] rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-[20px] font-black text-[#1B2559] dark:text-white tracking-tight">Publications récentes</h3>
                                </div>
                                <div className="flex bg-[#F4F7FE] dark:bg-slate-900/50 p-1 rounded-xl">
                                    <button className="px-3 py-1.5 bg-white dark:bg-[#111c44] rounded-lg text-[10px] font-black text-indigo-600 shadow-sm uppercase tracking-widest">Flux</button>
                                    <button className="px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Photos</button>
                                </div>
                            </div>

                            <div className="p-8 space-y-12">
                                {posts.length > 0 ? posts.map((post, idx) => (
                                    <div key={post.id || idx} className="flex flex-col group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-50 dark:border-white/5">
                                                    {member.photo ? <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-xs font-black">{memberInitials}</div>}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black text-[16px] text-[#1B2559] dark:text-white leading-tight">{member.firstName} {member.lastName}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[12px] font-black text-indigo-600 uppercase tracking-widest">{post.type || 'Annonce'}</span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase">{new Date(post.createdAt || Date.now()).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                <MoreHorizontal size={20} />
                                            </button>
                                        </div>
                                        <div className="pl-16 mt-3">
                                            <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                                                {post.content}
                                            </p>
                                            <div className="mt-5 flex items-center gap-6">
                                                <button className="flex items-center gap-2 text-[12px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">
                                                    <Heart size={16} /> Jaime
                                                </button>
                                                <button className="flex items-center gap-2 text-[12px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                                    <Share2 size={16} /> Partager
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col gap-12">
                                        {/* Mock content representing professional feed */}
                                        {[1, 2].map((_, i) => (
                                            <div key={i} className="flex flex-col opacity-60">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-200"></div>
                                                        <div className="flex flex-col text-left animate-pulse">
                                                            <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                                                            <div className="h-3 w-20 bg-slate-100 rounded"></div>
                                                        </div>
                                                    </div>
                                                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse"></div>
                                                </div>
                                                <div className="pl-16 mt-3 space-y-2 animate-pulse">
                                                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                                                    <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-center py-10">
                                            <p className="text-slate-400 font-bold italic">Aucune publication récente à afficher.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connection Card */}
                        <div className="bg-gradient-to-br from-[#4318FF] to-[#6366f1] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            
                            <div className="relative z-10">
                                <h4 className="text-[24px] font-black mb-2">Connectez-vous avec {member.firstName}</h4>
                                <p className="text-white/80 font-medium mb-8 max-w-sm">Rejoignez son réseau pour suivre ses activités et rester en contact avec la communauté.</p>
                                <div className="flex gap-4">
                                    <button className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-[14px] uppercase tracking-widest hover:scale-105 transition-transform">Demander un meeting</button>
                                    <button className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-white transition-colors">
                                        <Share2 size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* ── SHARED BOTTOM NAV (for mobile) ── */}
            <div className="lg:hidden">
              <MemberBottomNav activeTab="profile" onTabClick={(item) => navigate(item.path, { state: { activeTab: item.id } })} isDark={isDark} />
            </div>
        </div>
    );
};

export default PublicMemberProfile;
