import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Settings, Edit3, MapPin, Grid, MessageSquare, 
  Heart, Share2, LogOut, Camera, Globe, Send,
  Plus, Search, Bell, Mail, MoreVertical, X,
  CheckCircle2, Trash2, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const HAITI_DEPARTMENTS = {
  "Artibonite": ["Gonaïves", "Saint-Marc", "Dessalines", "Ennery"],
  "Centre": ["Hinche", "Mirebalais", "Lascahobas"],
  "Grand'Anse": ["Jérémie", "Anse-d'Hainault"],
  "Nippes": ["Miragoâne", "Anse-à-Veau"],
  "Nord": ["Cap-Haïtien", "Limonade", "Milot"],
  "Nord-Est": ["Fort-Liberté", "Ouanaminthe"],
  "Nord-Ouest": ["Port-de-Paix", "Saint-Louis-du-Nord"],
  "Ouest": ["Port-au-Prince", "Delmas", "Pétion-Ville", "Carrefour", "Léogâne"],
  "Sud": ["Les Cayes", "Aquin", "Port-Salut"],
  "Sud-Est": ["Jacmel", "Bainet"]
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Profile_PWA = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tous');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  
  // Search state for spouse
  const [spouseSearch, setSpouseSearch] = useState('');
  const [spouseResults, setSpouseResults] = useState([]);
  const [isSearchingSpouse, setIsSearchingSpouse] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/members/profile');
      const data = response.data;
      // Parse education if it's a string
      if (typeof data.education === 'string') {
        try {
          data.education = JSON.parse(data.education);
        } catch (e) {
          data.education = [];
        }
      }
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get('/community-posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const searchSpouse = async (val) => {
    setSpouseSearch(val);
    if (val.length < 2) return setSpouseResults([]);
    setIsSearchingSpouse(true);
    try {
      const res = await api.get(`/members/search?q=${val}`);
      setSpouseResults(res.data.filter(m => m.id !== user.id));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingSpouse(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      submitData.education = JSON.stringify(formData.education || []);
      await api.put('/members/profile', submitData);
      toast.success('Profil mis à jour');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return toast.error('Le contenu est vide');
    setIsPosting(true);
    try {
      const data = new FormData();
      data.append('content', newPostContent);
      data.append('type', postType);
      if (postImage) {
        data.append('image', postImage);
      }

      await api.post('/community-posts', data);
      toast.success(postType === 'temoignage' ? 'Témoignage publié !' : 'Publication partagée !');
      setNewPostContent('');
      setPostImage(null);
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    } finally {
      setIsPosting(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
  };

  const addEducation = () => {
    const newEdu = { institution: '', domain: '', startDate: '', endDate: '', specialty: '', description: '' };
    setFormData({ ...formData, education: [...(formData.education || []), newEdu] });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...(formData.education || [])];
    updated[index][field] = value;
    setFormData({ ...formData, education: updated });
  };

  const removeEducation = (index) => {
    const updated = (formData.education || []).filter((_, i) => i !== index);
    setFormData({ ...formData, education: updated });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'tous') return true;
    if (activeTab === 'publications') return post.type === 'general';
    if (activeTab === 'temoignages') return post.type === 'temoignage';
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 transition-colors duration-300">
      
      {/* ── Cover Image Section (Simplified) ── */}
      <div className="relative h-24 md:h-32 w-full group overflow-hidden">
        {profile?.coverPic ? (
          <img src={getImageUrl(profile.coverPic)} className="w-full h-full object-cover" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* ── Profile Header ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 -mt-10 md:-mt-12 relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8">
          
          {/* Photo Section */}
          <div className="relative">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-[4px] md:border-[6px] border-white dark:border-slate-950 shadow-xl overflow-hidden bg-white">
              {profile?.photo ? (
                <img src={getImageUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-black text-slate-200">
                  {profile?.firstName?.[0]}
                </div>
              )}
            </div>
            {/* Edit Button on Circumference */}
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white dark:border-slate-950 shadow-lg active:scale-90 transition-all hover:bg-blue-700"
            >
              <Edit3 size={14} />
            </button>
          </div>

          {/* User Basic Info */}
          <div className="flex-1 space-y-2 pt-1 md:pt-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-app-micro font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 size={10} />
                Membre : Actif
              </span>
            </div>
            <h1 className="text-app-title font-black text-slate-900 dark:text-white leading-none">
              {profile?.firstName} {profile?.lastName}
            </h1>
            <p className="text-app-meta font-medium text-slate-400">
              @{profile?.nickname || profile?.firstName?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs Section (Don removed from Mobile) ── */}
      <div className="mt-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center gap-6">
          {[
            { id: 'tous', label: 'Tous' },
            { id: 'publications', label: 'Publication' },
            { id: 'temoignages', label: 'Temoignage' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-app-meta font-black tracking-widest border-b-2 transition-all ${
                activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="ml-auto flex items-center gap-3">
             {/* Smaller Plus Button on Desktop */}
             <button 
                onClick={() => setShowCreatePost(true)} 
                className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-app-micro font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
             >
                <Plus size={14} />
                Publier
             </button>
          </div>
        </div>
      </div>

      {/* ── Feed Section ── */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-12 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => (
                <div key={post.id} className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] p-5 space-y-4 border border-transparent">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shadow-sm">
                            {profile?.photo && <img src={getImageUrl(profile.photo)} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <div>
                            <h4 className="text-app-title font-black text-slate-900 dark:text-white leading-none">{profile?.firstName}</h4>
                            <span className="text-app-micro font-bold text-slate-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                  </div>
                  <p className="text-app-body font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{post.content}</p>
                </div>
            ))}
        </div>
      </div>

      {/* ── Small Floating Plus Button ── */}
      <button 
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl z-50 active:scale-90 transition-all md:hidden"
      >
        <Plus size={20} />
      </button>

      {/* ── Edit Profile Overhaul Modal ── */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-app-title font-black text-slate-900 dark:text-white">Edition du profil</h1>
                <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-12">
                
                {/* 1. Infos personnelles */}
                <div className="space-y-6">
                  <h3 className="text-app-title font-black text-blue-600 border-b border-slate-50 pb-2">Infos personnelles</h3>
                  
                  {/* Read only info with labels for clarity */}
                  <div className="space-y-4 opacity-60">
                    <input readOnly value={formData.firstName} className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Prénom" />
                    <input readOnly value={formData.lastName} className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Nom" />
                  </div>

                  <input value={formData.nickname || ''} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none outline-none focus:ring-2 ring-blue-500/20" placeholder="Surnom" />

                  <select value={formData.maritalStatus || ''} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none outline-none appearance-none">
                    <option value="">État civil...</option>
                    <option value="Célibataire">Célibataire</option>
                    <option value="Marié">Marié(e)</option>
                    <option value="Veuf">Veuf(ve)</option>
                    <option value="Divorcé">Divorcé(e)</option>
                  </select>

                  {formData.maritalStatus === 'Marié' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input value={spouseSearch} onChange={e => searchSpouse(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 pl-12 text-sm font-bold border-none" placeholder="Rechercher le conjoint..." />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      </div>
                      <div className="space-y-2">
                        {spouseResults.map(m => (
                          <button key={m.id} type="button" onClick={() => { setFormData({...formData, spouseId: m.id, spouseName: `${m.firstName} ${m.lastName}`}); setSpouseResults([]); setSpouseSearch(`${m.firstName} ${m.lastName}`); }} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all">
                            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                               {m.photo ? <img src={getImageUrl(m.photo)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{m.firstName[0]}</div>}
                            </div>
                            <span className="text-xs font-black">{m.firstName} {m.lastName}</span>
                            <UserPlus size={14} className="ml-auto text-blue-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea rows={4} value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none resize-none" placeholder="Parlez-nous de vous (Bio)..." />

                  <div className="space-y-3">
                    <h4 className="text-app-micro font-black text-slate-400 uppercase tracking-widest ml-1">Groupe sanguin</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map(bg => (
                        <button key={bg} type="button" onClick={() => setFormData({...formData, bloodGroup: bg})} className={`py-3 rounded-xl text-app-meta font-black transition-all ${formData.bloodGroup === bg ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Contact et coordonnées */}
                <div className="space-y-6">
                  <h3 className="text-app-title font-black text-blue-600 border-b border-slate-50 pb-2">Contact et coordonnées</h3>
                  
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Email" />
                  <input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Téléphone principal *" />
                  <input value={formData.secondaryPhone || ''} onChange={e => setFormData({...formData, secondaryPhone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Téléphone secondaire" />

                  <div className="space-y-4 pt-4">
                    <select value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value, department: '', city: ''})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none appearance-none">
                      <option value="">Pays...</option>
                      <option value="Haiti">Haïti</option>
                      <option value="USA">USA</option>
                      <option value="Canada">Canada</option>
                      <option value="France">France</option>
                    </select>

                    {formData.country === 'Haiti' ? (
                      <select value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value, city: ''})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none appearance-none">
                        <option value="">Département...</option>
                        {Object.keys(HAITI_DEPARTMENTS).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <input value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="State / Province" />
                    )}

                    {(formData.country === 'Haiti' && formData.department) ? (
                      <select value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none appearance-none">
                        <option value="">Ville...</option>
                        {HAITI_DEPARTMENTS[formData.department].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Ville" />
                    )}

                    <input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Ligne d'adresse (Ex: #2, rue Lamarre)" />
                  </div>
                </div>

                {/* 3. Coordonnées professionnelles */}
                <div className="space-y-6">
                  <h3 className="text-app-title font-black text-blue-600 border-b border-slate-50 pb-2">Coordonnées professionnelles</h3>
                  <div className="space-y-4">
                    <input value={formData.workAddress || ''} onChange={e => setFormData({...formData, workAddress: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Lieu de travail" />
                    <input value={formData.workPhone || ''} onChange={e => setFormData({...formData, workPhone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Téléphone bureau" />
                    <input value={formData.workEmail || ''} onChange={e => setFormData({...formData, workEmail: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Email professionnel" />
                  </div>
                </div>

                {/* 4. Coordonnées d'urgence */}
                <div className="space-y-6">
                  <h3 className="text-app-title font-black text-rose-600 border-b border-slate-50 pb-2">Coordonnées d'urgence</h3>
                  <div className="space-y-4">
                    <input value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Nom du contact d'urgence" />
                    <input value={formData.emergencyPhone || ''} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 text-app-meta font-bold border-none" placeholder="Téléphone d'urgence" />
                  </div>
                </div>

                {/* 5. Education */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <h3 className="text-app-title font-black text-blue-600">Education</h3>
                    <button type="button" onClick={addEducation} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {(formData.education || []).map((edu, idx) => (
                      <div key={idx} className="space-y-4 p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl relative">
                        <button type="button" onClick={() => removeEducation(idx)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        
                        <input value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 text-app-meta font-bold border-none shadow-sm" placeholder="Institution" />
                        <input value={edu.domain} onChange={e => updateEducation(idx, 'domain', e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 text-app-meta font-bold border-none shadow-sm" placeholder="Domaine" />
                        <input value={edu.specialty} onChange={e => updateEducation(idx, 'specialty', e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 text-app-meta font-bold border-none shadow-sm" placeholder="Spécialité" />
                        <input type="date" value={edu.startDate} onChange={e => updateEducation(idx, 'startDate', e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 text-app-meta font-bold border-none shadow-sm" />
                        <input type="date" value={edu.endDate} onChange={e => updateEducation(idx, 'endDate', e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 text-app-meta font-bold border-none shadow-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <button type="submit" className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
                    <CheckCircle2 size={28} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Post Modal ── */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[250] bg-white dark:bg-slate-900 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setShowCreatePost(false)} className="text-slate-400 font-bold text-app-meta uppercase">Annuler</button>
              <h2 className="text-app-meta font-black uppercase text-slate-900 dark:text-white tracking-widest">Partager</h2>
              <button onClick={handleCreatePost} className="px-6 py-2 bg-blue-600 text-white rounded-full text-app-micro font-black uppercase disabled:opacity-50" disabled={isPosting || !newPostContent.trim()}>
                {isPosting ? '...' : 'Publier'}
              </button>
            </div>
            <textarea autoFocus value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Exprimez-vous..." className="flex-1 w-full bg-transparent border-none text-xl font-medium outline-none resize-none" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile_PWA;
