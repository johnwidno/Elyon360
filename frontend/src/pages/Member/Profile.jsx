import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mail, MapPin, Calendar, Heart,
    MessageSquare, Share2, Building2, User, Send,
    Facebook, Linkedin, Instagram, Clock,
    Image as ImageIcon, FileText, CheckCircle,
    MoreVertical, ChevronDown
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const FONT = "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif";

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const { isDark } = useTheme();
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [expandedPosts, setExpandedPosts] = useState({});
    const [messageSent, setMessageSent] = useState(false);
    const postsRef = useRef(null);

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

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const togglePost = (postId) => {
        setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const scrollToPosts = () => {
        setActiveTab('posts');
        setTimeout(() => {
            postsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${isDark ? 'bg-black' : 'bg-white'}`} style={{ fontFamily: FONT }}>
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen p-8 text-center ${isDark ? 'bg-black text-white' : 'bg-white text-slate-900'}`} style={{ fontFamily: FONT }}>
                <h2 className="text-3xl font-black mb-4">Membre introuvable</h2>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-black">
                    <ArrowLeft size={20} /> Retour
                </button>
            </div>
        );
    }

    const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
    const hasSocials = member.facebookUrl || member.linkedinUrl || member.instagramUrl || member.tiktokUrl;

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-[#FDFDFD] text-slate-900'}`}
            style={{ fontFamily: FONT }}
        >
            {/* ── TOP NAVIGATION ── */}
            <div className="fixed top-0 left-0 right-0 z-[60] px-4 h-16 flex items-center justify-between backdrop-blur-xl bg-opacity-80 border-b border-transparent">
                <button onClick={() => navigate(-1)} className={`w-10 h-10 flex items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <ArrowLeft size={20} />
                </button>
                <button className={`w-10 h-10 flex items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* ── COVER HEADER ── */}
            <div className="relative h-48 sm:h-64 bg-indigo-600">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED]" />
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            {/* ── PROFILE MAIN INFO ── */}
            <div className="px-5 -mt-16 relative z-10">
                <div className="flex flex-col items-center">
                    {/* AVATAR */}
                    <div className="relative">
                        <div className={`w-36 h-36 rounded-full border-[6px] shadow-2xl overflow-hidden ${isDark ? 'border-black' : 'border-white'} bg-slate-200`}>
                            {member.photo ? (
                                <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-5xl font-black">{initials}</div>
                            )}
                        </div>
                        <div className="absolute bottom-3 right-3 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-black" />
                    </div>

                    {/* NAME & TAG */}
                    <h1 className="text-3xl font-black tracking-tight mt-5">{member.firstName} {member.lastName}</h1>
                    {member.nickname && (
                        <p className="text-indigo-600 font-bold text-sm mt-1 underline">@{member.nickname}</p>
                    )}

                    {/* CHURCH & TYPE */}
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                           <Building2 size={14} /> {member.church?.name ? toSentenceCase(member.church.name) : 'ElyonSys Platform'}
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {member.contactSubtype?.name || 'Membre Officiel'}
                        </p>
                    </div>

                    {/* LOCATION & JOINED */}
                    <div className="flex items-center gap-4 mt-4 text-slate-500 text-sm font-semibold">
                        {(member.city || member.country) && (
                            <span className="flex items-center gap-1.5">
                                <MapPin size={16} className="text-rose-500" />
                                {[member.city, member.country].filter(Boolean).join(', ')}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            {new Date(member.createdAt).getFullYear()}
                        </span>
                    </div>

                    {/* ACTIONS BUTTONS (MATCHING FIGMA) */}
                    <div className="w-full max-w-sm mt-8 flex flex-col gap-3">
                        <a
                            href={`mailto:${member.email}`}
                            className="w-full flex items-center justify-center gap-3 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 transition-all"
                        >
                            <Send size={20} />
                            Envoyer un message
                        </a>
                        <button
                            onClick={scrollToPosts}
                            className={`w-full flex items-center justify-center gap-3 h-14 border-2 rounded-2xl font-black text-lg transition-all active:scale-95 ${isDark ? 'border-indigo-500 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <ImageIcon size={20} />
                            Voir tous ces publications
                        </button>
                    </div>

                    {/* BIO SECTION */}
                    {member.notes && (
                        <div className="w-full max-w-md mt-10 text-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 divider-text">À propos</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed font-medium italic">
                                "{member.notes}"
                            </p>
                        </div>
                    )}

                    {/* SOCIALS */}
                    {hasSocials && (
                        <div className="flex items-center justify-center gap-5 mt-8">
                            {member.facebookUrl && <a href={member.facebookUrl} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full"><Facebook size={20} /></a>}
                            {member.instagramUrl && <a href={member.instagramUrl} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 text-white rounded-full"><Instagram size={20} /></a>}
                            {member.linkedinUrl && <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-[#0077b5] text-white rounded-full"><Linkedin size={20} /></a>}
                        </div>
                    )}

                    {/* STATS DIVIDER */}
                    <div className={`w-full grid grid-cols-3 gap-1 mt-12 mb-6 border-y ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="py-6 flex flex-col items-center">
                            <span className="text-2xl font-black">{posts.length}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Posts</span>
                        </div>
                        <div className="py-6 flex flex-col items-center border-x border-slate-100 dark:border-white/5">
                            <span className="text-2xl font-black">1.4k</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Abonnés</span>
                        </div>
                        <div className="py-6 flex flex-col items-center">
                            <span className="text-2xl font-black">280</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Abonnements</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PUBLICATIONS SECTION ── */}
            <div ref={postsRef} className="px-5 pb-20 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6 sticky top-16 bg-inherit py-4 z-40 border-b border-transparent">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Publications
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('posts')} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === 'posts' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                            <ImageIcon size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 font-bold">Aucune publication.</div>
                    ) : posts.map((post) => (
                        <div key={post.id} className={`rounded-3xl p-5 border ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                           <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                                        {member.photo && <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">{member.firstName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{formatDate(post.createdAt)}</p>
                                    </div>
                                </div>
                           </div>
                           <p className={`text-[15px] leading-relaxed font-medium mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'} ${!expandedPosts[post.id] ? 'line-clamp-3' : ''}`}>
                                {post.content}
                           </p>
                           {post.content && post.content.length > 150 && (
                               <button onClick={() => togglePost(post.id)} className="text-indigo-600 text-xs font-black mb-4">
                                   {expandedPosts[post.id] ? 'VOIR MOINS' : 'VOIR PLUS'}
                               </button>
                           )}
                           {post.imageUrl && (
                               <div className="rounded-2xl overflow-hidden aspect-square sm:aspect-video mb-4">
                                   <img src={getImageUrl(post.imageUrl)} alt="" className="w-full h-full object-cover" />
                               </div>
                           )}
                           <div className="flex items-center gap-6 pt-4 border-t border-slate-50 dark:border-white/5">
                                <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-rose-500"><Heart size={18}/> {post.likesCount || 0}</button>
                                <button className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-600"><MessageSquare size={18}/> {post.commentsCount || 0}</button>
                           </div>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .divider-text {
                    display: flex;
                    align-items: center;
                }
                .divider-text::before, .divider-text::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: ${isDark ? '#FFFFFF10' : '#00000008'};
                }
                .divider-text::before { margin-right: 1.5rem; }
                .divider-text::after { margin-left: 1.5rem; }
            `}} />
        </div>
    );
};

export default PublicMemberProfile;
