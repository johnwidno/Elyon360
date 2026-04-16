import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    Activity, 
    Grid, 
    Heart, 
    MessageSquare,
    Share2,
    MoreHorizontal,
    Camera,
    UserPlus
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const PublicMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const [memberRes, postsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/members/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${process.env.REACT_APP_API_URL}/community-posts?authorId=${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setMember(memberRes.data);
                setPosts(postsRes.data || []);
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
        return `${process.env.REACT_APP_API_URL}/uploads/${path}`;
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Membre introuvable</h2>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-bold">
                    <ArrowLeft size={20} /> Retour
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Header / Cover */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 to-black/60 z-10" />
                <img 
                    src={member.coverImage ? getImageUrl(member.coverImage) : "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=2070"} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                />
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all">
                        <Share2 size={18} />
                    </button>
                    <button className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20 pb-20">
                {/* Profile Info Card */}
                <div className={`rounded-3xl shadow-2xl overflow-hidden border transition-all ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="p-6 sm:p-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-40 h-40 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-200">
                                    {member.photo ? (
                                        <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-4xl font-black">
                                            {member.firstName?.[0]}{member.lastName?.[1]}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" />
                            </div>

                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{member.firstName} {member.lastName}</h1>
                                        <p className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-xs mt-1">Membre de la Communauté</p>
                                    </div>
                                    <div className="flex items-center justify-center sm:justify-end gap-2">
                                        <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2">
                                            <UserPlus size={18} /> {t('follow', 'Suivre')}
                                        </button>
                                        <button className={`px-6 py-2.5 rounded-2xl border font-black transition-all active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                            {t('message', 'Message')}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black">{posts.length}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('publications', 'Posts')}</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black">1.2k</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('followers', 'Abonnés')}</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black">450</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('following', 'Abonnements')}</p>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-2xl font-black">28</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('events', 'Événements')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bio / About */}
                        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-indigo-500" /> {t('about', 'À propos')}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {member.bio || "Fidèle membre engagé dans la vie de l'église et passionné par le service communautaire. Toujours prêt à aider et à partager la parole."}
                            </p>
                            
                            <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold">
                                {member.location && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <MapPin size={14} className="text-slate-400" /> {member.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <Calendar size={14} className="text-slate-400" /> {t('joined', 'Membre depuis')} {new Date(member.createdAt).getFullYear()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="mt-10">
                    <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-8">
                        <button 
                            onClick={() => setActiveTab('posts')}
                            className={`pb-4 text-sm font-black tracking-widest uppercase transition-all relative ${activeTab === 'posts' ? 'text-indigo-600' : 'text-slate-400'}`}
                        >
                            {t('publications', 'Publications')}
                            {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('media')}
                            className={`pb-4 text-sm font-black tracking-widest uppercase transition-all relative ${activeTab === 'media' ? 'text-indigo-600' : 'text-slate-400'}`}
                        >
                            {t('media', 'Médias')}
                            {activeTab === 'media' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
                        </button>
                    </div>

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {posts.length > 0 ? posts.map(post => (
                                <div key={post.id} className={`p-6 rounded-3xl border transition-all hover:shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <p className="text-slate-600 dark:text-slate-300 mb-4 font-medium leading-relaxed">{post.content}</p>
                                    {post.image && (
                                        <div className="rounded-2xl overflow-hidden mb-4 aspect-video">
                                            <img src={getImageUrl(post.image)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                                                <Heart size={18} /> {post.likesCount || 0}
                                            </button>
                                            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                                                <MessageSquare size={18} /> {post.commentsCount || 0}
                                            </button>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 text-center">
                                    <Grid size={48} className="mx-auto mb-4 text-slate-200" />
                                    <p className="text-slate-500 font-bold italic">Aucune publication pour le moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicMemberProfile;
