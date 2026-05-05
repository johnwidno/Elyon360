import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Edit3, MapPin, Globe, Camera, X, Plus, 
  Trash2, Mail, Phone, CheckCircle2, Send, Search, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const LOCATION_DATA = {
  "Haiti": {
    "Ouest": ["Port-au-Prince", "Delmas", "Pétion-Ville", "Carrefour", "Tabarre"],
    "Nord": ["Cap-Haïtien", "Limonade", "Plaine-du-Nord"],
    "Artibonite": ["Gonaïves", "Saint-Marc", "Verrettes"]
  },
  "USA": {
    "Florida": ["Miami", "Orlando", "Tampa"],
    "New York": ["NYC", "Buffalo", "Rochester"]
  }
};

const Profile_PWA = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnProfile = !id || id === user.id.toString();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('tous');
  const [posts, setPosts] = useState([]);

  // Edit states
  const [formData, setFormData] = useState({});
  const [spouseSearch, setSpouseSearch] = useState('');
  const [spouseResults, setSpouseResults] = useState([]);
  
  // Post states
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [isPosting, setIsPosting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchPosts = async (targetId) => {
    if (!targetId) return;
    try {
      const response = await api.get(`/community-posts/user/${targetId}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const targetId = id || user.id;
      const endpoint = isOwnProfile ? '/members/profile' : `/members/public-profile/${targetId}`;
      const response = await api.get(endpoint);
      const data = response.data;
      
      if (typeof data.education === 'string') {
        try {
          data.education = JSON.parse(data.education);
        } catch (e) {
          data.education = [];
        }
      }
      
      setProfile(data);
      setFormData(data);
      fetchPosts(data.id);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'education') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'photoFile') {
          submitData.append('photo', formData[key]);
        } else if (key === 'coverFile') {
          submitData.append('coverPic', formData[key]);
        } else if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      await api.put('/members/profile', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profil mis à jour');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleSavePost = async () => {
    try {
      setIsPosting(true);
      if (editingPost) {
        await api.put(`/community-posts/${editingPost.id}`, { content: newPostContent, type: postType });
        toast.success('Publication modifiée');
      } else {
        await api.post('/community-posts', { content: newPostContent, type: postType });
        toast.success('Publication partagée');
      }
      setNewPostContent('');
      setShowCreatePost(false);
      setEditingPost(null);
      fetchPosts(profile.id);
    } catch (error) {
      toast.error('Erreur lors du partage');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Supprimer cette publication ?')) return;
    try {
      await api.delete(`/community-posts/${postId}`);
      toast.success('Supprimé');
      fetchPosts(profile.id);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setPostType(post.type || 'general');
    setShowCreatePost(true);
  };

  const searchSpouse = async (val) => {
    setSpouseSearch(val);
    if (val.length < 2) return setSpouseResults([]);
    try {
      const res = await api.get(`/members/global-search?q=${val}`);
      setSpouseResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addEducation = () => {
    const edu = formData.education || [];
    setFormData({ ...formData, education: [...edu, { institution: '', domain: '', specialty: '', startDate: '', endDate: '' }] });
  };

  const removeEducation = (idx) => {
    const edu = [...formData.education];
    edu.splice(idx, 1);
    setFormData({ ...formData, education: edu });
  };

  const updateEducation = (idx, field, val) => {
    const edu = [...formData.education];
    edu[idx][field] = val;
    setFormData({ ...formData, education: edu });
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'tous') return true;
    if (activeTab === 'publications') return post.type === 'general';
    if (activeTab === 'temoignages') return post.type === 'temoignage';
    return true;
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safe Portal Component to prevent crashes if target is missing
  const SafePortal = ({ children, targetId }) => {
    const [targetElement, setTargetElement] = useState(null);

    useEffect(() => {
      const el = document.getElementById(targetId);
      if (el) {
        setTargetElement(el);
      } else {
        const timer = setTimeout(() => {
          setTargetElement(document.getElementById(targetId));
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [targetId]);

    if (!targetElement) return null;
    return createPortal(children, targetElement);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20 w-full">
      {/* ── Cover Photo (Banner) ── */}
      <div className="h-32 md:h-48 lg:h-[220px] bg-[#9fb8bb] dark:bg-slate-900 relative overflow-hidden transition-all duration-500 w-full">
        {profile?.coverPic ? (
          <img src={getImageUrl(profile.coverPic)} alt="Cover" className="w-full h-full object-cover" />
        ) : null}
        
        {!isOwnProfile && (
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-2.5 bg-black/10 backdrop-blur-md text-white rounded-2xl hover:bg-black/20 transition-all border border-white/10"
          >
            <Search size={20} />
          </button>
        )}
      </div>

      {/* ── Main Layout ── */}
      <div className="max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-0">
          
          {/* ── Left Sidebar: Profile Identity ── */}
          <div className="px-4 md:px-6 lg:px-12 relative">
            <div className="flex flex-col relative z-20">
              {/* Photo */}
              <div className="relative -mt-16 md:-mt-20 lg:-mt-28 mb-4 lg:mb-6 inline-block w-fit">
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-[220px] lg:h-[220px] rounded-full border-[6px] lg:border-[8px] border-white dark:border-slate-950 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
                  {profile?.photo ? (
                    <img src={getImageUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-black text-slate-200 dark:text-slate-700">
                      {profile?.firstName?.[0]}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-4 right-4 lg:bottom-8 lg:right-6 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border-[3px] border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                  >
                    <Edit3 size={20} strokeWidth={2.5} className="text-[#111827] dark:text-white" />
                  </button>
                )}
              </div>

              {/* Identity */}
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-2xl md:text-3xl lg:text-[2.2rem] font-black text-[#111827] dark:text-white leading-tight tracking-tight">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-sm lg:text-[15px] font-medium italic text-[#4b5563] dark:text-slate-400 leading-relaxed max-w-sm">
                  {profile?.bio || "Description du membre, theologie, et bishop, enseignant"}
                </p>
                <div className="space-y-1 lg:space-y-2 pt-1 lg:pt-2">
                  <p className="text-sm lg:text-base font-bold text-[#6b7280] dark:text-slate-400">
                    {profile?.city || profile?.department || profile?.country 
                      ? [profile?.city, profile?.department, profile?.country].filter(Boolean).join(', ')
                      : "Ville, Pays"}
                  </p>
                  <p className="text-base lg:text-[17px] font-black text-[#111827] dark:text-white">
                    {profile?.church?.name ? toSentenceCase(profile.church.name) : "Eglise de Dieu de la prophétie"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Content Area ── */}
          <div className="px-4 md:px-6 lg:pr-12 lg:pl-0 pt-8 lg:pt-0 relative">
            
            {/* Tabs Container */}
            <div className="bg-white dark:bg-slate-950 rounded-t-3xl lg:rounded-t-[2rem] lg:-mt-[76px] relative z-20 pt-2 lg:pt-4 px-2 lg:px-8">
              <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto noscrollbar pb-3 lg:pb-6">
                {[
                  { id: 'tous', label: 'Toutes les publications' },
                  { id: 'publications', label: 'News' },
                  { id: 'temoignages', label: 'Témoignages' },
                  { id: 'infos', label: 'Informations détaillées' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 lg:px-8 lg:py-3.5 rounded-full text-sm lg:text-[15px] font-black transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] shadow-xl shadow-slate-900/20'
                        : 'text-[#9ca3af] hover:text-[#475569] dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thick Slate Bar */}
            <div className="w-full h-[22px] bg-[#838996] dark:bg-slate-800 relative z-10 -mt-4 lg:-mt-6 hidden lg:block rounded-r-xl"></div>

            {/* Content Switcher */}
            <div className="pt-8 lg:pt-14">
              {activeTab === 'infos' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.2em] mb-8">Coordonnées</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-sm">
                          <Mail size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">{profile?.email || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shadow-sm">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Téléphone</p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">{profile?.phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                  {isOwnProfile && (
                    <div className="flex justify-end -mb-2 lg:-mb-4 relative z-10">
                      <button 
                        onClick={() => setShowCreatePost(true)}
                        className="w-14 h-14 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-full flex items-center justify-center transition-all shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  )}

                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <div key={post.id} className="bg-slate-50/50 dark:bg-slate-900 rounded-3xl lg:rounded-[2.5rem] p-5 lg:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 lg:space-y-6 group transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              {profile?.photo && <img src={getImageUrl(profile.photo)} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{profile?.firstName}</h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => handleEditPost(post)} className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm"><Edit3 size={16} /></button>
                              <button onClick={() => handleDeletePost(post.id)} className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                        <p className="text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{post.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-[#f8fafc] dark:bg-slate-800 flex items-center justify-center">
                        <Globe size={48} strokeWidth={1.5} className="text-[#e2e8f0] dark:text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-[#94a3b8] dark:text-slate-400 tracking-tight">Aucun contenu trouvé</p>
                        <p className="text-[14px] font-medium text-[#cbd5e1] dark:text-slate-500">Exprimez-vous en partageant votre premier post !</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Action Buttons ── */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50 md:hidden">
        {!isOwnProfile && (
          <button
            onClick={() => navigate(`/member/chat?userId=${profile?.id}`)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <Send size={24} className="ml-1" />
          </button>
        )}
        <button
          onClick={() => { setEditingPost(null); setNewPostContent(''); setShowCreatePost(true); }}
          className="w-14 h-14 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* ── Modals (Editing, Posting etc.) ── */}
      {/* ... similar AnimatePresence logic for isEditing and showCreatePost ... */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-app-title font-black text-slate-900 dark:text-white">Edition du profil</h1>
                <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="space-y-2">
                  <p className="text-app-micro font-black text-slate-900 dark:text-white uppercase tracking-widest ml-1">Biographie</p>
                  <textarea rows={4} value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none outline-none" placeholder="Bio..." />
                </div>
                <div className="flex justify-center">
                  <button type="submit" className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/30">
                    <CheckCircle2 size={28} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreatePost && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreatePost(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} className="relative w-full h-full md:h-auto md:max-w-2xl bg-white dark:bg-slate-900 md:rounded-[2.5rem] shadow-2xl flex flex-col p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">{editingPost ? 'Modifier' : 'Partager'}</h2>
                <button onClick={handleSavePost} className="px-6 py-2 bg-slate-950 text-white rounded-full text-xs font-black uppercase" disabled={isPosting || !newPostContent.trim()}>
                  {isPosting ? '...' : 'Publier'}
                </button>
              </div>
              <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full h-48 bg-transparent border-none text-xl font-medium outline-none resize-none text-slate-700 dark:text-slate-200" placeholder="Que voulez-vous partager ?" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile_PWA;
