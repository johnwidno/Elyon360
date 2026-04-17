import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Search, 
    ArrowLeft, 
    Send, 
    MapPin, 
    FileText, 
    ChevronRight,
    CheckCircle
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
    const { lang } = useLanguage();
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
            {/* ── SHARED SIDEBAR ── */}
            <MemberSidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                onNavClick={handleNavClick} 
                logout={logout} 
            />

            {/* ── SHARED HEADER ── */}
            <MemberHeader 
                onMenuClick={() => setSidebarOpen(true)} 
                getImageUrl={getImageUrl} 
                userInitials={userInitials} 
            />

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

                {/* Profile Section - LEFT ALIGNED */}
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
                        <MapPin size={16} className="text-rose-500" />
                        <span>Ville, Pays</span>
                    </div>

                    <p className="mt-2 text-[16px] font-bold text-[#1B2559] dark:text-white">
                        {member.church?.name ? toSentenceCase(member.church.name) : "Nom de l'eglise associer"}
                    </p>

                    {/* Action Link Link */}
                    <div className="mt-8 flex items-center gap-4 text-[#4318FF]">
                        <Send size={24} className="rotate-45" />
                        <button onClick={() => window.location.href = `mailto:${member.email}`} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#4318FF] transition-colors">
                            envoyer un message a {member.firstName}
                        </button>
                    </div>
                </section>

                {/* Publications Header */}
                <div className="mt-12 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F97316] rounded-full flex items-center justify-center text-white shadow-lg">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-[20px] font-bold text-[#4B39EF] dark:text-indigo-400">
                        publications
                    </h3>
                </div>

                {/* Feed List */}
                <div className="space-y-8 pb-32">
                    {posts.length > 0 ? posts.map((post, idx) => (
                        <div key={post.id || idx} className="flex flex-col">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100">
                                        {member.photo ? <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-[10px] font-black">{memberInitials}</div>}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-[16px] text-[#1B2559] dark:text-white leading-tight">{member.firstName} {member.lastName}</span>
                                        <span className="text-[13px] font-bold text-[#4B39EF] -mt-1">{post.type || 'Concert'}</span>
                                        <span className="text-[12px] font-medium text-slate-400 italic">june 27th</span>
                                    </div>
                                </div>
                                <span className="text-slate-400 font-bold text-[12px]">3:30pm</span>
                            </div>
                            <p className="mt-3 text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-left">
                                {post.content}
                            </p>
                            <button className="self-end mt-2 font-black text-slate-900 dark:text-white text-[12px]">Voir plus</button>
                        </div>
                    )) : (
                        <div className="flex flex-col gap-8">
                            {/* Fallback Static Content matching screenshot */}
                            <div className="flex flex-col">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200">
                                            {member.photo && <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-[16px] text-[#1B2559] dark:text-white leading-tight">John Widno</span>
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
                        </div>
                    )}
                </div>
            </main>

            {/* ── SHARED BOTTOM NAV ── */}
            <MemberBottomNav 
                activeTab="profile" 
                onTabClick={(item) => navigate(item.path, { state: { activeTab: item.id } })} 
                isDark={isDark} 
            />
        </div>
    );
};

export default PublicMemberProfile;
