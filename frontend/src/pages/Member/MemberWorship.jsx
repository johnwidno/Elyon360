import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import worshipService from '../../api/worshipService';
import { 
  Music, Calendar, MapPin, ChevronRight, PlayCircle, 
  BookOpen, MessageCircle, Info, ArrowLeft, Send, Quote,
  Printer, X, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const MemberWorship = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('programme'); 
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await worshipService.getServices();
      setServices(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceDetails = async (id) => {
    setLoading(true);
    try {
      const res = await worshipService.getServiceById(id);
      setSelectedService(res.data);
      if (res.data.sermon?.id) {
        fetchComments(res.data.sermon.id);
      }
    } catch (err) {
      toast.error('Erreur de détails');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (messageId) => {
    try {
      const res = await worshipService.getComments(messageId);
      setComments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedService?.sermon?.id) return;
    setSubmitting(true);
    try {
      await worshipService.addComment({
        sermonMessageId: selectedService.sermon.id,
        content: newComment
      });
      setNewComment('');
      fetchComments(selectedService.sermon.id);
      toast.success('Commentaire ajouté');
    } catch (err) {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = () => {
    if (!selectedService) return;
    
    const doc = jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text("PROGRAMME DU CULTE", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(selectedService.theme || "Culte Régulier", pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(selectedService.date).toLocaleDateString()}`, 20, 45);
    doc.text(`Heure: ${selectedService.time || '08:00'}`, 20, 50);
    doc.text(`Lieu: ${selectedService.location || 'Eglise Centrale'}`, 20, 55);

    // Program Steps
    if (selectedService.blocks && selectedService.blocks.length > 0) {
      const body = selectedService.blocks.map((b, i) => [
        i + 1,
        b.label || b.type.toUpperCase(),
        b.metadata?.verses || b.metadata?.songTitle || '-'
      ]);

      autoTable(doc, {
        startY: 65,
        head: [['#', 'Séquence', 'Détails']],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [30, 27, 75] }
      });
    }

    doc.save(`Programme_Culte_${selectedService.id}.pdf`);
    toast.success('PDF généré !');
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=1200';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  if (loading && !selectedService) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <AnimatePresence mode="wait">
        {!selectedService ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="col-span-full flex flex-col gap-1 mb-4">
              <h2 className="text-app-title font-black text-slate-900 tracking-tight">Cultes & Événements</h2>
              <p className="text-slate-500 font-medium text-app-meta">Vivez les moments forts de l'église en direct ou en replay</p>
            </div>

            {services.map((s) => (
              <motion.div 
                key={s.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadServiceDetails(s.id)}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm flex items-center gap-6 group cursor-pointer hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex flex-col items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <span className="text-app-micro font-black">
                    {new Date(s.date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className="text-xl font-black leading-none">
                    {new Date(s.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <h4 className="font-black text-slate-900 text-app-title leading-tight line-clamp-1">{s.theme}</h4>
                  <div className="flex items-center gap-2 text-slate-400 text-app-micro font-bold tracking-wider">
                    <Music size={14} />
                    <span>Culte régulier</span>
                    <span className="opacity-30">•</span>
                    <span>{s.time || '08:00'}</span>
                  </div>
                </div>
                <ChevronRight size={24} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-col"
          >
            {/* Detail Banner - Adjusted for Full Screen Feel */}
            <div className="relative h-52 md:h-80 overflow-hidden">
              <img 
                src={getImageUrl(selectedService.imageUrl)} 
                alt={selectedService.theme} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                <div className="bg-blue-600 self-start px-3 py-1 rounded-full text-white text-app-micro font-black tracking-widest">
                  Culte en direct
                </div>
                <h3 className="text-app-title font-black text-white leading-tight">{selectedService.theme}</h3>
                 <div className="flex items-center gap-3 text-white/70 text-app-meta font-bold">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(selectedService.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{selectedService.location || 'Eglise centrale'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs - Compact */}
            <div className="flex border-b border-slate-100 bg-white sticky top-16 z-20">
              {['Programme', 'Message', 'Commentaires'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex-1 py-3 text-[12px] font-black tracking-widest transition-all relative ${activeTab === tab.toLowerCase() ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {tab}
                  {activeTab === tab.toLowerCase() && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content - Reduced padding */}
            <div className="p-4 pb-24">
              {activeTab === 'programme' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h5 className="font-black text-slate-900 text-app-micro tracking-tight uppercase">Programme & Projection</h5>
                    <div className="h-1 w-8 bg-blue-600 rounded-full" />
                  </div>

                  <div className="bg-slate-50 rounded-[1.5rem] p-5 text-center flex flex-col items-center gap-4 border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                      <PlayCircle size={28} />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-slate-900 font-black text-sm leading-tight">
                        Expérience Interactive
                      </p>
                      <p className="text-slate-500 font-medium text-[11px] leading-snug px-2">
                        Suivez le culte en temps réel sur votre écran.
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                      <button 
                        onClick={() => setShowIframe(true)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                      >
                         <PlayCircle size={16} />
                         Lancer la projection
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            const url = `${window.location.origin}/public/worship/${selectedService.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Lien copié !');
                          }}
                          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all hover:bg-slate-50"
                        >
                          <Send size={14} />
                          Partager
                        </button>

                        <button 
                          onClick={generatePDF}
                          className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all border border-blue-100"
                        >
                          <Printer size={14} />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3">
                     <Info className="text-blue-600 shrink-0" size={16} />
                     <p className="text-[10px] font-medium text-blue-800 leading-tight">
                        Lien de partage accessible à tous, sans compte requis.
                     </p>
                  </div>
                </div>
              )}

              {activeTab === 'message' && (
                <div className="flex flex-col gap-6">
                  {selectedService.sermon ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <h5 className="font-black text-slate-900 text-app-micro tracking-tight">Résumé du message</h5>
                        <h6 className="font-bold text-blue-600 text-app-title leading-tight">{selectedService.sermon.title}</h6>
                      </div>
                      <div 
                        className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{ __html: selectedService.sermon.content }}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30 text-center gap-2">
                      <BookOpen size={48} />
                      <p className="font-black text-app-micro">Aucun résumé disponible</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'commentaires' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    {comments.map((c) => (
                      <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-app-micro font-black text-slate-600">
                            {c.author?.firstName?.[0] || 'U'}
                          </div>
                          <span className="font-black text-app-meta text-slate-900">{c.author?.firstName} {c.author?.lastName}</span>
                          <span className="text-app-micro text-slate-400 font-bold ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-app-meta text-slate-600 font-medium">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="fixed bottom-24 left-4 right-4 bg-white shadow-2xl border border-slate-100 rounded-2xl p-2 flex items-center gap-2 z-30">
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Laissez un message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium px-2"
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={submitting}
                      className="bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Iframe Overlay */}
      <AnimatePresence>
        {showIframe && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mode Projection</span>
                  <h4 className="text-app-meta font-black text-slate-900">{selectedService?.theme}</h4>
               </div>
               <button 
                onClick={() => setShowIframe(false)}
                className="w-10 h-10 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all"
               >
                 <X size={20} />
               </button>
            </div>
            <div className="flex-1 overflow-hidden">
               <iframe 
                src={`${window.location.origin}/public/worship/${selectedService?.id}`} 
                className="w-full h-full border-none"
                title="Worship Projection"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberWorship;
