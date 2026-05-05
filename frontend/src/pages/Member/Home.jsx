import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar, BookOpen, Globe, Clock,
  MapPin, X, ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Send, Quote, MessageSquare, Info,
  Share2, Edit3, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMember } from '../../context/MemberContext';

const Home = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeSegment } = useMember();
  const [events, setEvents] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Status form state
  const [statusForm, setStatusForm] = useState({
    id: null,
    type: 'verset',
    content: '',
    imageUrl: '',
    styleConfig: {
      bgColor: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
      textColor: '#ffffff',
      fontFamily: 'font-sans'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customization presets
  const colorPresets = [
    'linear-gradient(to bottom right, #4f46e5, #7c3aed)', // Indigo/Purple
    'linear-gradient(to bottom right, #10b981, #059669)', // Emerald
    'linear-gradient(to bottom right, #f59e0b, #d97706)', // Amber
    'linear-gradient(to bottom right, #ef4444, #dc2626)', // Red
    'linear-gradient(to bottom right, #0ea5e9, #2563eb)', // Blue
    'linear-gradient(to bottom right, #ec4899, #db2777)', // Pink
    '#000000', // Black
    '#1e293b'  // Slate
  ];

  const fontPresets = [
    { label: 'Standard', value: 'font-sans' },
    { label: 'Élégant', value: 'font-serif' },
    { label: 'Code', value: 'font-mono' },
    { label: 'Épais', value: 'font-black' }
  ];

  // ... (presets above)

  // Check if user is admin
  const isAdmin = (() => {
    if (!user?.role) return false;
    let roles = [];
    try {
      if (Array.isArray(user.role)) roles = user.role;
      else {
        roles = JSON.parse(user.role);
        if (!Array.isArray(roles)) roles = [roles];
      }
    } catch (e) {
      roles = typeof user.role === 'string' ? user.role.split(',').map(r => r.trim()) : [user.role];
    }
    return roles.some(r => r.toLowerCase().includes('admin'));
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, statusRes] = await Promise.all([
          api.get('events'),
          api.get('statuses')
        ]);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        setStatuses(Array.isArray(statusRes.data) ? statusRes.data : []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusDefaultImage = (type) => {
    switch (type) {
      case 'verset': return 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800'; // Bible/Light
      case 'temoignage': return 'https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?q=80&w=800'; // Path/Success
      case 'reflexion': return 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?q=80&w=800'; // Meditation/Calm
      case 'news': return 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800'; // News/People
      default: return 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800';
    }
  };

  const getImageUrl = (path, type = null) => {
    if (!path) {
      if (type) return getStatusDefaultImage(type);
      return null;
    }
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleCreateStatus = async (e) => {
    if (e) e.preventDefault();
    if (!statusForm.content) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...statusForm,
        content: toSentenceCase(statusForm.content)
      };

      if (statusForm.id) {
        const res = await api.put(`statuses/${statusForm.id}`, payload);
        setStatuses(statuses.map(s => s.id === statusForm.id ? res.data : s));
      } else {
        const res = await api.post('statuses', payload);
        setStatuses([res.data, ...statuses]);
      }
      setShowAddStatus(false);
      setStatusForm({
        id: null, type: 'verset', content: '', imageUrl: '',
        styleConfig: { bgColor: colorPresets[0], textColor: '#ffffff', fontFamily: 'font-sans' }
      });
    } catch (err) {
      console.error('Failed to save status:', err);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const handleDeleteStatus = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce statut ?')) return;
    try {
      await api.delete(`statuses/${id}`);
      setStatuses(statuses.filter(s => s.id !== id));
      setSelectedStory(null);
    } catch (err) {
      console.error('Failed to delete status:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEditStatus = (status) => {
    setStatusForm({
      id: status.id,
      type: status.type,
      content: status.content,
      imageUrl: status.imageUrl || '',
      styleConfig: status.styleConfig || {
        bgColor: colorPresets[0],
        textColor: '#ffffff',
        fontFamily: 'font-sans'
      }
    });
    setShowAddStatus(true);
    setSelectedStory(null);
  };

  const handleShareStatus = async (status) => {
    const shareText = `"${status.content}"\n\nPartagé via l'application ElyonSys 360`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Statut ElyonSys 360',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed or cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Contenu copié dans le presse-papier !');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsSubmitting(true);
      const res = await api.post('statuses/upload_test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusForm({ ...statusForm, imageUrl: res.data.imageUrl });
    } catch (err) {
      console.error('Upload failed details:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message;
      alert(`Erreur lors de l'upload: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'verset': return <Quote size={20} />;
      case 'temoignage': return <MessageSquare size={20} />;
      case 'reflexion': return <BookOpen size={20} />;
      case 'news': return <Info size={20} />;
      default: return <BookOpen size={20} />;
    }
  };

  const getStatusLabel = (type) => {
    switch (type) {
      case 'verset': return toSentenceCase('Verset du jour');
      case 'temoignage': return toSentenceCase('Témoignage');
      case 'reflexion': return toSentenceCase('Réflexion');
      case 'news': return toSentenceCase('News');
      default: return toSentenceCase('Statut');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400 animate-pulse">Chargement de votre espace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 md:gap-8 min-h-screen transition-colors w-full relative">
      <div className="lg:hidden h-2"></div>
      <AnimatePresence mode="wait">
        {activeSegment === 'membre' ? (
          <motion.div
            key="membre"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-2 md:gap-8 bg-transparent md:bg-white md:dark:bg-slate-900/80 p-0 md:p-4 lg:p-6 md:rounded-3xl md:border md:border-slate-100 md:dark:border-slate-800 md:shadow-sm"
          >
            {/* Vie de Foi Section - WHATSAPP STYLE STORIES */}
            <section className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-5 h-5 bg-slate-900 dark:bg-blue-600 rounded flex items-center justify-center text-white lg:hidden">
                    <BookOpen size={12} />
                  </div>
                  <span className="text-2xl hidden lg:block">✨</span>
                  <h5 className="text-xl md:text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Vie de Foi & Communauté</h5>
                </div>
              </div>

              <div className="relative group/scroll">
                <button
                  onClick={() => scroll('left')}
                  className="hidden lg:flex absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl border border-slate-100 rounded-full items-center justify-center z-10 hover:bg-slate-50 transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ChevronLeft size={20} className="text-slate-600" />
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 md:gap-6 overflow-x-auto lg:overflow-x-hidden noscrollbar -mx-2 px-2 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 pb-4 scroll-smooth"
                >
                  {/* 1. Admin Add Status Card (Like "My Status" in WhatsApp) */}
                  {isAdmin && (
                    <motion.button
                      key="add-status-card"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setShowAddStatus(true)}
                      className="flex-shrink-0 flex flex-col items-center justify-center w-[110px] h-[165px] md:w-[180px] md:h-[260px] lg:w-[200px] lg:h-[300px] rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 transition-all gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-[10px] font-black tracking-tighter text-slate-400 text-center px-2">Mon statut</span>
                    </motion.button>
                  )}

                  {/* 2. Most Recent Statuses */}
                  {statuses.map((status) => (
                    <motion.div
                      key={status.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedStory(status)}
                      className="flex-shrink-0 w-[110px] h-[165px] md:w-[180px] md:h-[260px] lg:w-[200px] lg:h-[300px] rounded-2xl md:rounded-3xl relative overflow-hidden shadow-md md:shadow-xl cursor-pointer group border border-slate-100 dark:border-slate-800"
                    >
                      <img
                        src={getImageUrl(status.imageUrl, status.type)}
                        alt={status.type}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                      <div className="absolute bottom-10 left-3 right-3 md:bottom-14 md:left-5 md:right-5">
                        <span className="text-white font-black text-[10px] md:text-[14px] leading-tight line-clamp-3 shadow-sm tracking-tight">
                          {toSentenceCase(status.content)}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 flex items-center gap-2">
                        <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                          {React.cloneElement(getStatusIcon(status.type), { size: 10 })}
                        </div>
                        <span className="text-white text-[9px] md:text-[11px] font-black tracking-widest drop-shadow-md">
                          {toSentenceCase(status.admin?.firstName || 'Admin')}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* 3. Default Central Verse Status */}
                  <motion.div
                    key="default-verse"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedStory({
                      id: 'default-v',
                      type: 'verset',
                      content: toSentenceCase("Heureux l'homme qui trouve son plaisir dans la parole de Dieu et qui la médite jour & nuit ! Psaumes 1:2"),
                      admin: { firstName: 'Eglise', lastName: 'Centrale', photo: null }
                    })}
                    className="flex-shrink-0 w-[110px] h-[165px] md:w-[180px] md:h-[260px] lg:w-[200px] lg:h-[300px] rounded-2xl md:rounded-3xl relative overflow-hidden shadow-md md:shadow-xl cursor-pointer group border-2 border-blue-600/30 dark:border-blue-500/30"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=400"
                      alt="Central"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-transparent to-transparent" />

                    <div className="absolute bottom-10 left-3 right-3 md:bottom-14 md:left-5 md:right-5">
                      <span className="text-white font-black text-[10px] md:text-[14px] leading-tight line-clamp-3 shadow-sm tracking-tight italic">
                        {toSentenceCase("Heureux l'homme qui trouve son plaisir dans la parole de Dieu...")}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 flex items-center gap-2">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white border border-white/20 shadow-lg">
                        <Quote size={14} />
                      </div>
                      <span className="text-white text-[9px] md:text-[11px] font-black tracking-widest drop-shadow-md">Verset central</span>
                    </div>
                  </motion.div>

                  {/* 4. Default Credo Status */}
                  <motion.div
                    key="default-credo"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedStory({
                      id: 'default-c',
                      type: 'reflexion',
                      content: toSentenceCase("Nous croyons en un seul Dieu, le Père tout-puissant, créateur du ciel et de la terre, de toutes les choses visibles et invisibles..."),
                      admin: { firstName: 'Eglise', lastName: 'Credo', photo: null }
                    })}
                    className="flex-shrink-0 w-[110px] h-[165px] md:w-[180px] md:h-[260px] lg:w-[200px] lg:h-[300px] rounded-2xl md:rounded-3xl relative overflow-hidden shadow-md md:shadow-xl cursor-pointer group border-2 border-emerald-600/30 dark:border-emerald-500/30"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=400"
                      alt="Credo"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent" />

                    <div className="absolute bottom-10 left-3 right-3 md:bottom-14 md:left-5 md:right-5">
                      <span className="text-white font-black text-[10px] md:text-[14px] leading-tight line-clamp-3 shadow-sm tracking-tight">
                        {toSentenceCase("Nous croyons en un seul Dieu, le Père tout-puissant...")}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 flex items-center gap-2">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white border border-white/20 shadow-lg">
                        <BookOpen size={14} />
                      </div>
                      <span className="text-white text-[9px] md:text-[11px] font-black tracking-widest drop-shadow-md">Credo</span>
                    </div>
                  </motion.div>

                  {statuses.length === 0 && !isAdmin && (
                    <div className="flex-shrink-0 flex items-center px-4">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest whitespace-nowrap">Aucun statut n'a été publié</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => scroll('right')}
                  className="hidden lg:flex absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl border border-slate-100 rounded-full items-center justify-center z-10 hover:bg-slate-50 transition-all opacity-0 group-hover/scroll:opacity-100"
                >
                  <ChevronRight size={20} className="text-slate-600" />
                </button>
              </div>
            </section>

            {/* Communications Section */}
            <section className="flex flex-col gap-4 md:gap-6 pt-0 md:pt-4 md:border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 lg:hidden">
                  <Globe size={12} />
                </div>
                <span className="text-2xl hidden lg:block">🌐</span>
                <h5 className="text-xl md:text-2xl lg:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">Communications / Evenements</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/member/events/${event.id}`)}
                    className="flex flex-col gap-4 bg-white dark:bg-slate-800/80 p-0 md:p-3 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="relative h-56 md:h-56 rounded-t-2xl md:rounded-[1.5rem] overflow-hidden shadow-sm">
                      <img
                        src={getImageUrl(event.imageUrl) || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col gap-2 px-3 pb-3">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-1 tracking-tight group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h4>

                      {event.description && (
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-app-meta">
                          <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                          <span className="truncate">{event.location || 'Temple Principal'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-app-meta">
                          <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                          <span>
                            {event.date && !isNaN(new Date(event.date))
                              ? new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                              : 'À venir'}, 8:00 AM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="communaute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 items-center justify-center py-20 grayscale opacity-20"
          >
            <Globe size={40} />
            <p className="font-bold text-app-micro">Espace communauté bientôt disponible</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Status Modal - IMMERSIVE WHATSAPP FLOW */}
      <AnimatePresence>
        {showAddStatus && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[400] bg-slate-950 flex flex-col overflow-hidden"
          >
            {/* Header Controls */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-[410] px-2">
              <button
                onClick={() => setShowAddStatus(false)}
                className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-2">
                {/* Type Selector (T icon like WhatsApp) */}
                <button
                  onClick={() => {
                    const types = ['verset', 'temoignage', 'reflexion', 'news'];
                    const currentIndex = types.indexOf(statusForm.type);
                    const nextIndex = (currentIndex + 1) % types.length;
                    setStatusForm({ ...statusForm, type: types[nextIndex] });
                  }}
                  className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all flex flex-col items-center"
                >
                  <span className="text-xl font-serif leading-none">T</span>
                  <span className="text-[6px] font-black uppercase mt-0.5">{statusForm.type[0]}</span>
                </button>

                {/* Font Selector Cycle */}
                <button
                  onClick={() => {
                    const currentIdx = fontPresets.findIndex(f => f.value === statusForm.styleConfig.fontFamily);
                    const nextIdx = (currentIdx + 1) % fontPresets.length;
                    setStatusForm({ ...statusForm, styleConfig: { ...statusForm.styleConfig, fontFamily: fontPresets[nextIdx].value } });
                  }}
                  className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all"
                >
                  <Edit3 size={20} />
                </button>

                {/* Color Cycle Button (Palette) */}
                <button
                  onClick={() => {
                    const currentIdx = colorPresets.indexOf(statusForm.styleConfig.bgColor);
                    const nextIdx = (currentIdx + 1) % colorPresets.length;
                    setStatusForm({ ...statusForm, imageUrl: '', styleConfig: { ...statusForm.styleConfig, bgColor: colorPresets[nextIdx] } });
                  }}
                  className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all"
                >
                  <div className="w-5 h-5 rounded-full border border-white/50" style={{ background: statusForm.styleConfig.bgColor }} />
                </button>

                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
            </div>

            {/* Immersive Editor View */}
            <div
              className={`flex-1 relative flex flex-col items-center justify-center p-8 transition-all duration-500 ${statusForm.styleConfig.fontFamily}`}
              style={{ background: statusForm.imageUrl ? 'black' : statusForm.styleConfig.bgColor }}
            >
              <img
                src={getImageUrl(statusForm.imageUrl, statusForm.type)}
                alt="preview"
                className={`absolute inset-0 w-full h-full object-cover ${statusForm.imageUrl ? 'opacity-70' : 'opacity-40'}`}
              />
              <div className="absolute inset-0 bg-black/20" />

              <div className="relative z-10 w-full max-w-sm text-center flex flex-col items-center justify-center min-h-[40vh]">
                <textarea
                  autoFocus
                  value={statusForm.content}
                  onChange={(e) => setStatusForm({ ...statusForm, content: e.target.value })}
                  placeholder={
                    statusForm.type === 'verset' ? "Taper un verset..." :
                      statusForm.type === 'temoignage' ? "Partager un témoignage..." :
                        statusForm.type === 'reflexion' ? "Partager une réflexion..." :
                          "Taper une nouvelle..."
                  }
                  style={{ color: statusForm.styleConfig.textColor }}
                  className={`w-full bg-transparent border-none text-center text-2xl md:text-5xl font-black placeholder:text-white/30 focus:ring-0 outline-none resize-none drop-shadow-2xl leading-tight transition-all duration-300`}
                  rows={6}
                />

                {/* Clear Image Action Button */}
                <div className="mt-4">
                  {statusForm.imageUrl ? (
                    <button
                      onClick={() => setStatusForm({ ...statusForm, imageUrl: '' })}
                      className="px-6 py-2 bg-rose-500/20 backdrop-blur-xl border border-rose-500/30 rounded-full text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                    >
                      Supprimer la photo
                    </button>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <ImageIcon size={14} />
                      Ajouter une photo
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Label for Type */}
              <div className="absolute bottom-32 left-0 right-0 flex justify-center">
                <span className="px-4 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                  {getStatusLabel(statusForm.type)}
                </span>
              </div>

              {/* Floating Send Button (WhatsApp Style) */}
              <div className="absolute bottom-8 right-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCreateStatus}
                  disabled={isSubmitting || !statusForm.content}
                  className="w-16 h-16 bg-blue-600 disabled:bg-slate-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={28} />
                  )}
                </motion.button>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Overlay Modal (WhatsApp Style Viewer) */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center p-0"
          >
            <div className="relative w-full h-full max-w-[500px] bg-slate-900 flex flex-col">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 10 }}
                    onAnimationComplete={() => setSelectedStory(null)}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 overflow-hidden">
                    {selectedStory.admin?.photo ? (
                      <img src={getImageUrl(selectedStory.admin.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black bg-blue-600">
                        {selectedStory.admin?.firstName?.[0] || 'A'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">
                      {selectedStory.admin?.firstName} {selectedStory.admin?.lastName}
                    </span>
                    <span className="text-white/50 text-app-micro font-black tracking-widest">
                      {getStatusLabel(selectedStory.type)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShareStatus(selectedStory); }}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                  >
                    <Share2 size={20} />
                  </button>

                  {isAdmin && typeof selectedStory.id === 'number' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditStatus(selectedStory); }}
                        className="p-3 bg-blue-500/20 backdrop-blur-md rounded-full text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteStatus(selectedStory.id); }}
                        className="p-3 bg-rose-500/20 backdrop-blur-md rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className={`flex-1 relative flex items-center justify-center p-8 transition-all duration-500 ${selectedStory.styleConfig?.fontFamily || 'font-sans'}`}
                style={{ background: selectedStory.imageUrl ? 'black' : (selectedStory.styleConfig?.bgColor || 'linear-gradient(to bottom right, #4f46e5, #7c3aed)') }}
              >
                {selectedStory.imageUrl && (
                  <img
                    src={getImageUrl(selectedStory.imageUrl)}
                    alt="bg"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                <div className="relative z-10 text-center flex flex-col gap-6 max-w-sm">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl">
                    {getStatusIcon(selectedStory.type)}
                  </div>
                  <p
                    className="text-xl md:text-3xl font-black leading-tight tracking-tight px-4 drop-shadow-2xl"
                    style={{ color: selectedStory.styleConfig?.textColor || '#ffffff' }}
                  >
                    {selectedStory.type === 'verset' ? `"${toSentenceCase(selectedStory.content)}"` : toSentenceCase(selectedStory.content)}
                  </p>
                  {selectedStory.type === 'verset' && (
                    <div className="w-12 h-1 bg-white/30 mx-auto rounded-full" />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 pb-12 flex flex-col items-center gap-4">
                <button
                  onClick={() => setShowDetail(true)}
                  className="bg-white text-slate-900 px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform flex items-center gap-2"
                >
                  En savoir plus
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal (En savoir plus) */}
      <AnimatePresence>
        {showDetail && selectedStory && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[500] bg-white dark:bg-slate-950 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto p-8 pt-20">
              <button
                onClick={() => setShowDetail(false)}
                className="fixed top-8 right-8 p-3 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-600 dark:text-slate-400"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white">
                    {getStatusIcon(selectedStory.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {getStatusLabel(selectedStory.type)}
                    </h2>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      Publié par {selectedStory.admin?.firstName} {selectedStory.admin?.lastName}
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {selectedStory.content}
                  </p>
                </div>

                {selectedStory.imageUrl && (
                  <img
                    src={getImageUrl(selectedStory.imageUrl)}
                    alt="Illustration"
                    className="w-full rounded-3xl shadow-2xl"
                  />
                )}

                <div className="mt-12 flex flex-col gap-4">
                  <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest">
                    Partagez ce message d'édification
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleShareStatus(selectedStory)}
                      className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      <Share2 size={18} />
                      Partager maintenant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
