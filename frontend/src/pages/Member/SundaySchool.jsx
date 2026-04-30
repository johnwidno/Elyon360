import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, Users, GraduationCap, Calendar, 
  ChevronRight, Award, Clock, MapPin,
  Plus, Book, Search, ChevronDown, 
  ChevronUp, UserCheck, Shield, Filter,
  MessageCircle, Send
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../auth/AuthProvider';
import toast from 'react-hot-toast';
import SundaySchoolReportForm from '../Admin/SundaySchool/SundaySchoolReportForm';

const SundaySchool = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [myClasses, setMyClasses] = useState({ current: [], past: [], monitor: [] });
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, reports, members
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(null); // reportId

  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  const isGlobalMonitor = roles.includes('monitor');
  const isStaff = isAdmin || isGlobalMonitor;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, myClassesRes, allClassesRes] = await Promise.all([
        api.get('/sunday-school/stats').catch(() => ({ data: null })),
        api.get('/sunday-school/my-classes').catch(() => ({ data: { current: [], past: [], monitor: [] } })),
        api.get('/sunday-school/classes').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setMyClasses(myClassesRes.data);
      setAllClasses(allClassesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassReports = async (classId) => {
    try {
      setLoadingReports(true);
      const res = await api.get(`/sunday-school/reports?classId=${classId}`);
      setReports(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };
  
  const handleAddComment = async (reportId) => {
    if (!commentText.trim()) return;
    try {
      setSubmittingComment(reportId);
      const res = await api.post(`/sunday-school/reports/${reportId}/comments`, { content: commentText });
      
      // Update reports local state
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, comments: [...(r.comments || []), res.data] } : r
      ));
      setCommentText('');
      toast.success('Commentaire ajouté');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setActiveTab('overview');
    setMemberSearchTerm('');
    fetchClassReports(cls.id);
  };

  const toggleAccordion = (id) => {
    setExpandedClassId(expandedClassId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-slate-950">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredAllClasses = allClasses.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = selectedClass?.classMembers?.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.memberCode?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 pb-24 font-sans selection:bg-indigo-100 transition-colors duration-300">
      {/* 1. Header / Breadcrumb */}
      <div className="px-6 py-4 flex items-center gap-3">
        <LayoutGrid size={20} className="text-gray-900 dark:text-white" />
        <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Ecole dominicale</h1>
      </div>

      <div className="px-6 flex flex-col gap-8">
        
        {/* 2. Espace de Direction (Staff Only) */}
        {isStaff && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Book size={20} className="text-gray-900 dark:text-white" />
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight italic">Espace de Direction</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Nombre de classe', value: stats?.kpis?.totalClasses || 0 },
                { label: 'paricipant', value: stats?.kpis?.totalMembers || 0 },
                { label: 'Moniteur', value: stats?.kpis?.totalMonitors || 0 },
                { label: 'Moniteur', value: stats?.kpis?.totalMonitors || 0 }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-transparent dark:border-white/5">
                  <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-tight mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Recherche une classe" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-full py-4 pl-12 pr-6 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-white/10 transition-all"
          />
        </div>

        {/* 4. Ma Classe Active (REORDERED - Now before Voir toutes) */}
        {myClasses.current?.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <UserCheck size={20} className="text-gray-900 dark:text-white" />
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight italic">Ma classe active</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {myClasses.current.map((cls) => (
                <div 
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 blur-2xl rounded-full" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Session en cours</span>
                      <h4 className="text-xl font-black tracking-tight leading-none">{cls.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-indigo-100 font-bold text-xs opacity-80">
                        <MapPin size={12} />
                        <span>{cls.room?.name || 'Local principal'}</span>
                        <span className="opacity-40">•</span>
                        <Users size={12} />
                        <span>{cls.classMembers?.length || 0} membres</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                      <ChevronRight size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Voir toutes classe Section */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center gap-3">
            <LayoutGrid size={20} className="text-gray-900 dark:text-white" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight italic">Voire toutes classe</h2>
          </div>

          {/* Empty State Message */}
          {myClasses.current?.length === 0 && (
            <div className="bg-gray-50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-900 dark:text-white font-bold text-center leading-relaxed">
                Vous n'avez aucune classe inscrite. <br />
                <span className="text-gray-400 text-xs font-medium">Parcourez la liste ci-dessous pour trouver votre groupe.</span>
              </p>
            </div>
          )}

          {/* Classes Accordion */}
          <div className="flex flex-col gap-2">
            {filteredAllClasses.length > 0 ? (
              filteredAllClasses.map((cls) => (
                <div key={cls.id} className="border-b border-gray-100 dark:border-white/5 last:border-none">
                  <button 
                    onClick={() => toggleAccordion(cls.id)}
                    className="w-full py-5 flex items-center justify-between text-left group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                        <GraduationCap size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 dark:text-white text-sm tracking-tight leading-tight">{cls.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                          {cls.isDynamic ? 'Affectation Dynamique' : 'Affectation Manuelle'}
                        </span>
                      </div>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedClassId === cls.id ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} className="text-gray-400" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedClassId === cls.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 pt-2 flex flex-col gap-5 px-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed italic">
                            {cls.description || "Aucune description disponible pour cette classe."}
                          </p>
                          <button 
                            onClick={() => handleSelectClass(cls)}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-black/10"
                          >
                            Détails & Rapports
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 font-bold text-sm">Aucune classe trouvée</p>
            )}
          </div>
        </div>
      </div>

      {/* Class Detail Modal */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 overflow-y-auto noscrollbar"
          >
            <div className="p-6 flex flex-col gap-8 pb-32">
              <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 pt-2 pb-4 z-10">
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white shadow-sm"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-full">
                  {[
                    { id: 'overview', icon: <Book size={14} /> },
                    { id: 'reports', icon: <Calendar size={14} /> },
                    { id: 'members', icon: <Users size={14} /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                      {tab.icon}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
                  <div className="flex flex-col gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-[11px] uppercase tracking-[0.4em]">Ecole Dominicale</span>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">{selectedClass.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Membres', value: `${selectedClass.classMembers?.length || 0} participants`, icon: <Users size={20} /> },
                      { label: 'Salle', value: selectedClass.room?.name || 'Local', icon: <MapPin size={20} /> },
                      { label: 'Horaire', value: '09:00 - 10:30', icon: <Clock size={20} /> },
                      { label: 'Critères', value: selectedClass.isDynamic ? 'Automatique' : 'Manuel', icon: <Shield size={20} /> }
                    ].map((item, i) => (
                      <div key={i} className="p-5 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex flex-col gap-4">
                        <div className="text-indigo-600 dark:text-indigo-400">{item.icon}</div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white leading-tight truncate">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">Description du cours</h3>
                    <p className="text-base font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                      {selectedClass.description || "Cette classe est dédiée à l'apprentissage biblique approfondi et à la croissance spirituelle communautaire."}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Journal de Classe</h3>
                  {loadingReports ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                  ) : reports.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {reports.map((report, i) => (
                        <div key={i} className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                              {new Date(report.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                            </span>
                            <div className="flex items-center gap-2 text-gray-400">
                               <Users size={12} />
                               <span className="text-[10px] font-bold">{report.presentCount || 0}</span>
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-2">{report.lessonTitle || "Leçon du jour"}</h4>
                          {report.goldenText && (
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 italic bg-white dark:bg-black/20 p-3 rounded-xl border-l-2 border-indigo-500">
                              "{report.goldenText}"
                            </p>
                          )}

                          {/* Comments Section */}
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageCircle size={14} className="text-gray-400" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions & Commentaires</span>
                            </div>

                            {/* Comment List */}
                            <div className="flex flex-col gap-3 mb-4">
                              {report.comments && report.comments.length > 0 ? (
                                report.comments.map((comment, ci) => (
                                  <div key={ci} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                      {comment.author?.firstName?.[0]}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-900 dark:text-white">{comment.author?.firstName} {comment.author?.lastName}</span>
                                        <span className="text-[8px] font-bold text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight bg-white/50 dark:bg-black/10 p-2 rounded-lg">
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] font-bold text-gray-400 italic px-2">Aucune question pour le moment.</p>
                              )}
                            </div>

                            {/* Comment Input */}
                            <div className="flex items-center gap-2 bg-white dark:bg-black/20 rounded-xl p-1 pr-2">
                              <input 
                                type="text"
                                placeholder="Posez une question ou commentez..."
                                value={submittingComment === report.id ? '' : (submittingComment ? '' : (selectedClass?.id ? commentText : ''))} // Simplified logic check
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(report.id);
                                }}
                                className="flex-1 bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 px-3 py-2"
                              />
                              <button 
                                onClick={() => handleAddComment(report.id)}
                                disabled={submittingComment === report.id}
                                className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-50"
                              >
                                {submittingComment === report.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-gray-400 font-bold">Aucun rapport archivé</div>
                  )}
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Membres de la classe</h3>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Rechercher un membre..." 
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">{member.firstName} {member.lastName}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member.memberCode || '---'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-10 text-gray-400 font-bold">Aucun membre trouvé</p>
                    )}
                  </div>
                </motion.div>
              )}

              {isStaff && (
                <div className="fixed bottom-6 left-6 right-6 z-[210]">
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-gray-900 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-black/20 active:scale-95 transition-all"
                  >
                    <Plus size={20} />
                    Soumettre un rapport
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SundaySchoolReportForm 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        classData={selectedClass}
        onReportSubmitted={() => {
          toast.success('Rapport soumis avec succès');
          setShowReportModal(false);
          setSelectedClass(null);
        }}
      />
    </div>
  );
};

export default SundaySchool;
