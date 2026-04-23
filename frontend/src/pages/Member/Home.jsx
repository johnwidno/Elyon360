import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';
import {
  Calendar, BookOpen, Globe, Search, Clock,
  MapPin, Star, Bookmark, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const { user } = useAuth();
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
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 min-h-screen transition-colors">
      {/* Tabs - SMALLER FONT */}
      <div className="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveSegment('membre')}
          className={`text-[11px] font-bold transition-all ${activeSegment === 'membre' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
        >
          Membre
        </button>
        <span className="text-slate-200 dark:text-slate-800 text-sm font-light">|</span>
        <button
          onClick={() => setActiveSegment('communaute')}
          className={`text-[11px] font-bold transition-all ${activeSegment === 'communaute' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
        >
          Communauté
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
        <input
          type="text"
          placeholder="Recherche"
          className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-lg py-2 pl-10 pr-4 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-100 dark:focus:ring-slate-800"
        />
      </div>

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
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Vie de foi et communauté</h3>
              </div>

              <div className="flex gap-3 overflow-x-auto noscrollbar -mx-5 px-5 pb-1 scroll-smooth">
                {featureCards.map((card) => (
                  <motion.div
                    key={card.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedStory(card)}
                    className="flex-shrink-0 w-[75px] h-[110px] rounded-xl relative overflow-hidden shadow-md cursor-pointer group border border-slate-100 dark:border-slate-800"
                  >
                    <img src={card.bg} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-1.5 right-1.5">
                      <span className="text-white font-bold text-[8px] leading-tight line-clamp-2">{card.title}</span>
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
                <h3 className="text-xs font-black text-slate-900 dark:text-white">Communications / Evenements</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2">
                    <div className="relative h-40 rounded-2xl overflow-hidden shadow-sm group">
                      <img
                        src={getImageUrl(event.imageUrl) || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800'}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 px-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight line-clamp-1">
                        {event.title}
                      </h4>
                      <div className="flex flex-col gap-0">
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px]">
                          <MapPin size={9} />
                          <span>{event.location || 'Temple principale'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px]">
                          <Clock size={9} />
                          <span>
                            {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, 8:00 AM
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[9px] font-medium line-clamp-2 leading-tight mt-0.5">
                        {event.description || "Description courte de l'événement."}
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
            <p className="font-bold text-[10px]">Espace communauté bientôt disponible</p>
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
                    <span className="text-white/50 text-[10px]">Il y a 2h</span>
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
                  <p className="text-white text-xl font-medium leading-relaxed italic px-4">
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
