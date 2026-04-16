import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Share2, MoreVertical, Send, 
    ImageIcon, MessageSquare, Heart, MapPin, 
    Clock, Building2, UserCircle2, ExternalLink
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { isDark } = useTheme();
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0F172A]' : 'bg-slate-50'}`}>
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
                <h2 className="text-2xl font-bold mb-4">Membre introuvable</h2>
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Retour</button>
            </div>
        );
    }

    const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

    return (
        <div 
            className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-slate-900'}`}
            style={{ fontFamily: FONT_FAMILY }}
        >
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-5 h-[70px] bg-white dark:bg-black border-b border-slate-100 dark:border-white/10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-700 dark:text-slate-300">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <div className="flex-1 px-4 truncate">
                    <h1 className="text-[17px] font-black tracking-tight truncate text-center">
                        {member.firstName} {member.lastName}
                    </h1>
                </div>
                <div className="flex gap-1">
                    <button className="p-2 text-slate-700 dark:text-slate-300">
                        <Share2 size={24} />
                    </button>
                </div>
            </div>

            {/* ── PROFILE INFO CONTAINER ── */}
            <div className="px-5 pt-8 flex flex-col items-center">
                
                {/* ── AVATAR ── */}
                <div className="w-[124px] h-[124px] rounded-full overflow-hidden mb-6 shadow-2xl bg-slate-200">
                    {member.photo ? (
                        <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-4xl font-black">
                            {initials}
                        </div>
                    )}
                </div>

                {/* ── NAME & DESCRIPTION ── */}
                <h2 className="text-[28px] font-black leading-tight text-center px-4">
                    {member.firstName} {member.lastName}
                </h2>
                
                {member.notes && (
                    <p className="mt-3 text-[#64748B] dark:text-slate-400 text-[15px] font-medium leading-relaxed text-center max-w-[320px]">
                        {member.notes}
                    </p>
                )}

                {/* ── LOCATION ── */}
                {(member.city || member.country) && (
                    <div className="mt-4 flex items-center gap-2 text-[#475569] dark:text-slate-500 text-[14px] font-bold">
                        <MapPin size={18} className="text-rose-500" />
                        {[member.city, member.country].filter(Boolean).join(', ')}
                    </div>
                )}

                {/* ── ACTIONS BAR ── */}
                <div className="w-full max-w-[400px] mt-10 space-y-4">
                    {/* Primary Button */}
                    <button 
                        onClick={() => window.location.href = `mailto:${member.email}`}
                        className="w-full h-[64px] bg-[#4318FF] hover:bg-[#320ED9] active:scale-[0.98] text-white rounded-[24px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <Send size={22} strokeWidth={2.5} />
                        <span className="text-[17px] font-black">Envoyer un message a {member.firstName}</span>
                    </button>

                    {/* Secondary Button */}
                    <button 
                        onClick={() => document.getElementById('publications-section').scrollIntoView({ behavior: 'smooth' })}
                        className="w-full h-[64px] bg-[#F4F7FE] dark:bg-slate-900 hover:bg-[#E8EDFB] dark:hover:bg-slate-800 active:scale-[0.98] text-[#1B2559] dark:text-slate-200 rounded-[24px] flex items-center justify-center gap-3 transition-all"
                    >
                        <ImageIcon size={22} className="text-[#4318FF]" />
                        <span className="text-[17px] font-black">Voir tous ces publications</span>
                    </button>
                </div>

                {/* ── STATS ROW ── */}
                <div className="w-full max-w-[400px] mt-10 flex items-center justify-between px-6">
                    <div className="flex flex-col items-center">
                        <span className="text-[22px] font-black text-[#1B2559] dark:text-white">{posts.length}</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#A3AED0]">Publications</span>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-100 dark:bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[22px] font-black text-[#1B2559] dark:text-white">1.2k</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#A3AED0]">Abonnés</span>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-100 dark:bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[22px] font-black text-[#1B2559] dark:text-white">450</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#A3AED0]">Abonnements</span>
                    </div>
                </div>

                {/* ── SOCIALS ── */}
                <div className="flex items-center justify-center gap-4 mt-10">
                    {[
                        { url: member.facebookUrl, color: 'bg-[#E7EDFF] text-[#4318FF]', icon: 'f' },
                        { url: member.instagramUrl, color: 'bg-[#FFEDED] text-[#F33535]', icon: 'i' },
                        { url: member.linkedinUrl, color: 'bg-[#E7F7FF] text-[#007AB5]', icon: 'l' }
                    ].filter(s => s.url).map((s, idx) => (
                        <a key={idx} href={s.url} target="_blank" rel="noreferrer" className={`w-[48px] h-[48px] rounded-[16px] flex items-center justify-center font-black text-xl hover:scale-110 transition-transform ${s.color}`}>
                            {s.icon === 'f' && 'f'}
                            {s.icon === 'i' && 'i'}
                            {s.icon === 'l' && 'in'}
                        </a>
                    ))}
                </div>
            </div>

            {/* ── PUBLICATIONS LIST ── */}
            <div id="publications-section" className="mt-16 px-5 pb-24 max-w-[600px] mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-[#4318FF] rounded-full" />
                    <h3 className="text-[20px] font-black text-[#1B2559] dark:text-white">Dernières publications</h3>
                </div>

                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-[#A3AED0]">
                            <ImageIcon size={48} strokeWidth={1} />
                            <p className="mt-4 font-bold">Aucune publication à afficher</p>
                        </div>
                    ) : posts.map((post) => (
                        <div key={post.id} className="group p-5 bg-white dark:bg-slate-900/50 rounded-[32px] border border-slate-50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="flex gap-4">
                                {/* Post Image (if exists) */}
                                {post.imageUrl && (
                                    <div className="w-[100px] h-[100px] rounded-[24px] overflow-hidden shrink-0 shadow-lg">
                                        <img src={getImageUrl(post.imageUrl)} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[12px] font-bold text-[#A3AED0] uppercase tracking-wider">
                                            {new Date(post.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                                        </span>
                                        <ExternalLink size={14} className="text-slate-300" />
                                    </div>
                                    <h4 className="text-[16px] font-black text-[#1B2559] dark:text-white leading-tight mb-2 line-clamp-2">
                                        {post.content}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-auto">
                                        <button className="flex items-center gap-1.5 text-[12px] font-black text-rose-500 transition-transform active:scale-90">
                                            <Heart size={16} fill="currentColor" /> {post.likesCount || 0}
                                        </button>
                                        <button className="flex items-center gap-1.5 text-[12px] font-black text-[#4318FF]">
                                            <MessageSquare size={16} fill="currentColor" className="opacity-20" /> {post.commentsCount || 0}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MOBILE NAV OVERLAY (Decoration to match Figma) ── */}
            <div className={`fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/10 z-[60] flex items-center justify-around px-2 sm:hidden`}>
                <div className="w-12 h-12 flex items-center justify-center text-[#A3AED0]"><UserCircle2 size={24} /></div>
                <div className="w-12 h-12 flex items-center justify-center text-[#A3AED0]"><Building2 size={24} /></div>
                <div className="w-14 h-14 bg-[#4318FF] rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 -mt-6 border-[6px] border-white dark:border-black"><ExternalLink size={24} /></div>
                <div className="w-12 h-12 flex items-center justify-center text-[#A3AED0]"><MessageSquare size={24} /></div>
                <div className="w-12 h-12 flex items-center justify-center text-[#A3AED0]"><Send size={24} /></div>
            </div>
        </div>
    );
};

export default PublicMemberProfile;
