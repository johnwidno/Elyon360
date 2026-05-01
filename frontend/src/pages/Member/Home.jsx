import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar, BookOpen, Globe, Search, Clock,
  MapPin, Star, Bookmark, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSegment, setActiveSegment] = useState('membre');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const featureCards = [
    {
      id: 'bible',
      title: 'Verset du jour',
      bg: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=400',
      content: '"Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance." - Jérémie 29:11'
    },
    {
      id: 'temoignages',
      title: 'Témoignages',
      bg: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400',
      content: 'Découvrez comment la foi a transformé la vie de nos membres ce mois-ci. Des histoires de guérison et de restauration qui glorifient Dieu.'
    },
    {
      id: 'service',
      title: 'Lien du service',
      bg: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400',
      content: 'Rejoignez-nous en direct pour notre culte d\'adoration. Cliquez sur le bouton ci-dessous pour accéder au stream.'
    },
    {
      id: 'communaute',
      title: 'De la communauté',
      bg: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400',
      content: 'Dernières nouvelles de nos groupes de prière et activités sociales. La vie de l\'église au quotidien.'
    },

    {
      id: 'communaut',
      title: 'De la communauté',
      bg: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=400',
      content: 'Dernières nouvelles de nos groupes de prière et activités sociales. La vie de l\'église au quotidien.'
    },
  ];

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const HeaderContent = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
      {/* Tabs */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => setActiveSegment('membre')}
          className={`text-app-body md:text-lg font-black transition-all relative ${activeSegment === 'membre' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
        >
          Membre
          {activeSegment === 'membre' && <motion.div layoutId="tab-active" className="absolute -bottom-4 md:-bottom-7 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" />}
        </button>
        <button
          onClick={() => setActiveSegment('communaute')}
          className={`text-app-body md:text-lg font-black transition-all relative ${activeSegment === 'communaute' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
        >
          Communauté
          {activeSegment === 'communaute' && <motion.div layoutId="tab-active" className="absolute -bottom-4 md:-bottom-7 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-64 lg:w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
        <input
          type="text"
          placeholder="Recherche"
          className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 md:py-3 pl-11 pr-4 text-app-meta font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-800 shadow-sm"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10 p-5 md:p-12 md:pt-4 bg-white dark:bg-slate-900 min-h-screen transition-colors max-w-screen-2xl mx-auto relative">

      {/* Header Row - Rendered locally on mobile, Portaled on desktop */}
      {!isDesktop ? (
        <div className="flex flex-col gap-6 border-b border-slate-50 dark:border-slate-800 pb-4">
          {HeaderContent}
        </div>
      ) : (
        document.getElementById('topbar-center-target') && createPortal(HeaderContent, document.getElementById('topbar-center-target'))
      )}

      <AnimatePresence mode="wait">
        {activeSegment === 'membre' ? (
          <motion.div
            key="membre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Vie de Foi Section - WHATSAPP STYLE STORIES */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-900 dark:bg-blue-600 rounded flex items-center justify-center text-white">
                  <BookOpen size={12} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('faith_life_community', 'Vie de foi et communauté')}</h3>
              </div>

              <div className="flex gap-3 md:gap-6 overflow-x-auto md:overflow-visible md:flex-wrap noscrollbar -mx-5 px-5 pb-2 scroll-smooth md:mx-0 md:px-0">
                {featureCards.map((card) => (
                  <motion.div
                    key={card.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedStory(card)}
                    className="flex-shrink-0 w-[110px] h-[165px] md:w-[180px] md:h-[260px] rounded-2xl md:rounded-3xl relative overflow-hidden shadow-md md:shadow-xl cursor-pointer group border border-slate-100 dark:border-slate-800"
                  >
                    <img src={card.bg} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-2.5 right-2.5 md:bottom-6 md:left-5 md:right-5">
                      <span className="text-white font-black text-app-meta md:text-xl leading-tight line-clamp-2 shadow-sm">{card.title}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Communications Section */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Globe size={12} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('communications_events', 'Communications / Evenements')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    onClick={() => navigate(`/member/events/${event.id}`)}
                    className="flex flex-col gap-4 bg-white dark:bg-slate-800/50 md:p-3 md:rounded-3xl md:hover:shadow-2xl md:hover:shadow-slate-200/50 dark:md:hover:shadow-none transition-all duration-300 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="relative h-40 md:h-56 rounded-2xl md:rounded-[1.5rem] overflow-hidden shadow-sm group">
                      <img
                        src={getImageUrl(event.imageUrl) || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col gap-1 px-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-1 tracking-tight">
                        {event.title}
                      </h4>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-app-meta">
                          <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                          <span>{event.location || 'Temple Principal'}</span>
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
                      <p className="text-slate-600 dark:text-slate-400 text-app-meta font-medium line-clamp-3 leading-relaxed mt-1">
                        {event.description || "Rejoignez-nous pour cet événement exceptionnel de notre communauté."}
                      </p>
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
            className="flex flex-col gap-4 items-center justify-center py-10 grayscale opacity-20"
          >
            <Globe size={40} />
            <p className="font-bold text-app-micro">Espace communauté bientôt disponible</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Overlay Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-0"
          >
            <div className="relative w-full h-full max-w-[500px] bg-slate-900 flex flex-col">
              {/* Progress Bar Placeholder */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5 }}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white font-black">
                    E
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">{selectedStory.title}</span>
                    <span className="text-white/50 text-app-micro">Il y a 2h</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 relative flex items-center justify-center p-8">
                <img
                  src={selectedStory.bg}
                  alt="bg"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
                />
                <div className="relative z-10 text-center flex flex-col gap-6">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-white">
                    <BookOpen size={40} />
                  </div>
                  <p className="text-white text-app-title font-medium leading-relaxed italic px-4">
                    {selectedStory.content}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 pb-12 flex items-center justify-center">
                <button className="bg-white text-slate-900 px-8 py-3 rounded-full font-black text-sm shadow-xl active:scale-95 transition-transform">
                  En savoir plus
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
