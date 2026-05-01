import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, Clock, ArrowLeft, Share2, 
  Info, Bell, Map as MapIcon
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const EventDetails_PWA = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: event?.title,
      text: event?.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Lien copié dans le presse-papier');
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-950">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Événement non trouvé</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-bold">Retourner</button>
      </div>
    );
  }

  const eventDate = new Date(event.startDate || event.date);
  const isPast = eventDate < new Date();
  const needsRegistration = !!event.registrationToken || event.type === 'Formation' || event.type === 'Retraite';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 transition-colors duration-500">
      
      {/* Hero Image Section */}
      <div className="relative h-[32vh] w-full">
        <img 
          src={getImageUrl(event.imageUrl)} 
          className="w-full h-full object-cover" 
          alt={event.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-black/10" />
        
        {/* Navigation Overlays */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-7 pt-8 space-y-10 max-w-screen-xl mx-auto">
        
        {/* Header Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`h-1.5 w-1.5 rounded-full ${isPast ? 'bg-slate-300' : 'bg-blue-600'}`} />
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
              {event.type || 'Communication'}
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {event.title}
          </h1>
        </div>

        {/* Info Grid - Desktop one-line layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 md:bg-slate-50/50 md:dark:bg-slate-900/50 md:p-8 md:rounded-[2rem]">
          
          <div className="flex items-start gap-5 group">
            <div className="mt-1 w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 md:bg-white md:dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
              <Calendar size={20} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Heure</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-xs font-medium text-slate-500">À {event.time || '08:00 AM'}</span>
            </div>
          </div>

          <div className="flex items-start gap-5 group">
            <div className="mt-1 w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 md:bg-white md:dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
              <MapPin size={20} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localisation</span>
              <span className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {event.location || 'Temple Principal'}
              </span>
              {event.room && (
                <span className="text-xs font-medium text-slate-500">{event.room.building?.name} - {event.room.name}</span>
              )}
            </div>
          </div>

        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <div className="w-8 h-1 bg-blue-600 rounded-full mb-4" />
          <p className="text-[15px] md:text-[17px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
            {event.description || "Aucune description détaillée disponible pour cet événement."}
          </p>
        </div>

        {/* Organizer Section */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black border border-white/10">
                {event.church?.name?.[0] || 'E'}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Publié par</span>
                <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">{event.church?.name || 'ElyonSys Community'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-slate-950 via-white/80 dark:via-slate-950/80 to-transparent backdrop-blur-sm z-50">
        <div className="flex gap-3 max-w-screen-md mx-auto">
          {needsRegistration && !isPast && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="flex-[2] bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Bell size={18} />
              S'inscrire
            </motion.button>
          )}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className={`flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 ${!needsRegistration ? 'w-full' : ''}`}
          >
            <MapIcon size={18} />
            {!needsRegistration ? 'Voir sur la carte' : ''}
          </motion.button>
        </div>
      </div>

    </div>
  );
};

export default EventDetails_PWA;
