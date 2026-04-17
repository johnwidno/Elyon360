import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import worshipService from '../../api/worshipService';
import api from '../../api/axios';
import { 
    Calendar, Music, Book, Heart, Users, Speaker, 
    Mic, ChevronDown, MessageSquare, 
    PlayCircle, BookOpen, Layers, Search, 
    Facebook, Youtube, ArrowLeft, ChevronUp, ExternalLink, Globe, Projector, MapPin, ChevronRight, ChevronLeft as ChevronLeftIcon, Share2, 
    X, Send, MessageCircle, Quote, Maximize2, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

const styles = `
  .bg-banner-overlay {
    background-image: linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url("/uploads/church_service.png");
    background-size: cover;
    background-position: center;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .dropdown-animate {
    animation: slideDown 0.2s ease-out;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .selection-popover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background-color: #1e1b4b;
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    z-index: 1000;
  }
  .sermon-content mark {
    background-color: rgba(99, 102, 241, 0.2);
    border-bottom: 2px solid #6366f1;
    color: inherit;
    cursor: help;
  }
  .focused-reader {
    position: fixed;
    inset: 0;
    background: white;
    z-index: 9999;
    overflow-y: auto;
    animation: slideInUp 0.3s ease-out;
  }
  @keyframes slideInUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .dark .focused-reader {
    background: #0f172a;
  }
`;

export default function MemberWorship() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [activeServiceDetails, setActiveServiceDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('programme'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [isSemaineDropdownOpen, setIsSemaineDropdownOpen] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Comments & Message Focus
    const [isMessageFocused, setIsMessageFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState(null);
    const [popoverPos, setPopoverPos] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [isCommentingSelection, setIsCommentingSelection] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    const dropdownRef = useRef(null);
    const sermonRef = useRef(null);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const baseUrl = api.defaults.baseURL.replace('/api', '');
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const bannerImage = getImageUrl('/uploads/church_service.png');

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        fetchServices();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsSemaineDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            if (document.head.contains(styleSheet)) {
                document.head.removeChild(styleSheet);
            }
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchServices = async () => {
        try {
            const res = await worshipService.getServices();
            const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            setServices(sorted);
            if (sorted.length > 0) {
                loadServiceDetails(sorted[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast.error('Erreur de chargement des cultes');
            setLoading(false);
        }
    };

    const loadServiceDetails = async (id) => {
        setLoading(true);
        try {
            const res = await worshipService.getServiceById(id);
            setActiveServiceDetails(res.data);
            setActiveServiceId(id);
            setIsSemaineDropdownOpen(false);
            if (res.data.sermon?.id) {
                fetchComments(res.data.sermon.id);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            toast.error('Erreur de chargement des détails');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (messageId) => {
        try {
            const res = await worshipService.getComments(messageId);
            setComments(res.data || []);
        } catch (error) {
            console.error("Error fetching comments", error);
        }
    };

    const handleAddComment = async (parentId = null) => {
        if (!newComment.trim()) return;
        if (!activeServiceDetails?.sermon?.id) {
            toast.error("Impossible d'ajouter un commentaire : ID du message manquant.");
            return;
        }

        setIsSubmitting(true);
        try {
            const commentData = {
                sermonMessageId: parseInt(activeServiceDetails.sermon.id),
                content: newComment,
                parentId: parentId,
                highlightRange: isCommentingSelection && selectedText ? { text: selectedText, ...selectionRange } : null
            };
            
            console.log("Submitting comment:", commentData);
            const res = await worshipService.addComment(commentData);
            
            if (res.status === 201 || res.status === 200) {
                setNewComment('');
                setIsCommentingSelection(false);
                setPopoverPos(null);
                await fetchComments(activeServiceDetails.sermon.id);
                toast.success('Commentaire ajouté !');
            }
        } catch (error) {
            console.error("Add Comment Error Details:", error.response?.data || error.message);
            const errMsg = error.response?.data?.message || 'Erreur lors de l\'ajout du commentaire';
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && text.length > 3 && sermonRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setSelectedText(text);
            setSelectionRange({
                startOffset: range.startOffset,
                endOffset: range.endOffset
            });
            setPopoverPos({
                top: rect.top + window.scrollY - 40,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        } else {
            setPopoverPos(null);
        }
    };

    const formatDateFull = (dateStr) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        const dayNum = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'long' });
        const year = date.getFullYear();
        const res = `Culte du ${dayName} ${dayNum} ${month} ${year}`;
        return res.charAt(0).toUpperCase() + res.slice(1);
    };

    const formatDateShort = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const toSentenceCase = (str) => {
        if (!str) return '';
        const lower = str.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    };

    if (loading && !activeServiceDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Chargement du culte…</p>
            </div>
        );
    }

    const currentWeekServices = services.slice(0, 5);
    const filteredPastServices = services.filter(s => {
        if (s.id === activeServiceId) return false;
        const matchesTerm = s.theme.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          formatDateShort(s.date).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = searchDate ? s.date.startsWith(searchDate) : true;
        return matchesTerm && matchesDate;
    });

    const totalPages = Math.ceil(filteredPastServices.length / itemsPerPage);
    const paginatedServices = filteredPastServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const publicLink = activeServiceId ? `${window.location.origin}/public/worship/${activeServiceId}` : '';

    return (
        <div className="w-full px-0 sm:px-10 lg:px-16 -mt-2 sm:mt-0 pb-10 space-y-2 sm:space-y-6 animate-in fade-in duration-700">
            {/* ── SELECTION POPOVER ────────────────────────── */}
            {popoverPos && (
                <div 
                    className="selection-popover fixed -translate-x-1/2"
                    style={{ top: popoverPos.top, left: popoverPos.left }}
                    onClick={() => {
                        setIsCommentingSelection(true);
                        setIsMessageFocused(true); // Auto-focus if commenting
                    }}
                >
                    <MessageCircle size={14} />
                    <span>Commenter la sélection</span>
                </div>
            )}

            {/* ── SEARCH AREA ────────────────────────── */}
            <div className="flex flex-row items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 p-1.5 sm:p-4 rounded-none sm:rounded-3xl border-b sm:border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-1.5 sm:py-2 pl-10 pr-4 sm:pl-14 sm:pr-6 text-[12px] sm:text-[14px] font-bold text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                </div>
                <div className="relative w-auto shrink-0 flex items-center">
                    <input 
                        type="date" 
                        value={searchDate}
                        onChange={(e) => { setSearchDate(e.target.value); setCurrentPage(1); }}
                        className="w-[42px] sm:w-auto bg-white dark:bg-slate-800 border-none rounded-xl py-1.5 sm:py-2 px-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="hidden sm:inline text-[12px] font-bold text-slate-400 whitespace-nowrap px-4 border-l border-slate-200 dark:border-slate-700 uppercase tracking-widest pl-2">Date</span>
                </div>
            </div>

            <div className="px-4 sm:px-0 space-y-3 sm:space-y-6">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <div className="text-[#1e1b4b] dark:text-white cursor-pointer p-0.5 rounded-lg transition-colors">
                            <ArrowLeft size={18} strokeWidth={3} />
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black text-[#1e1b4b] dark:text-white tracking-tight leading-none">Culte</h1>
                    </div>
                    <p className="text-[11px] sm:text-[14px] font-bold text-slate-400 ml-7 italic leading-none">Les programme spirituel & messages ici</p>
                </div>

                {activeServiceDetails ? (
                    <div className="space-y-3 sm:space-y-6">
                        <div className="flex flex-row items-center justify-between gap-2 px-1">
                            <h2 className="text-[12px] sm:text-[19px] font-black text-[#1e1b4b] dark:text-white leading-tight min-w-0 flex-1 truncate">
                                {formatDateFull(activeServiceDetails.date)}
                            </h2>
                            <div className="relative shrink-0" ref={dropdownRef}>
                                <button onClick={() => setIsSemaineDropdownOpen(!isSemaineDropdownOpen)} className="flex items-center gap-1 text-slate-400 hover:text-[#1e1b4b] dark:hover:text-white transition-colors">
                                    <span className="text-[10px] sm:text-[14px] font-black tracking-tight whitespace-nowrap">| Cette semaine</span>
                                    {isSemaineDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                                {isSemaineDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-60 sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden dropdown-animate">
                                        <div className="p-1 space-y-0.5">
                                            {currentWeekServices.map(s => (
                                                <button key={s.id} onClick={() => loadServiceDetails(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] sm:text-[13px] font-bold transition-all ${s.id === activeServiceId ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{formatDateFull(s.date)}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FEATURED BANNER CARD */}
                        <div className="-mx-4 sm:mx-0 rounded-none sm:rounded-[3rem] py-6 sm:py-14 lg:py-16 px-5 sm:px-14 lg:px-16 shadow-2xl relative overflow-hidden flex flex-col justify-center text-white min-h-[220px] sm:min-h-[420px]" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(0, 0, 0, 0.85)), url("${bannerImage || 'https://images.unsplash.com/photo-1438032005730-c77930810965?auto=format&fit=crop&q=80&w=2670'}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className="relative z-10 space-y-3 sm:space-y-8">
                                <div className="space-y-1.5 sm:space-y-4">
                                    <h3 className="text-sm sm:text-3xl font-black leading-tight max-w-4xl drop-shadow-2xl">{toSentenceCase(`Theme : ${activeServiceDetails.theme}`)}</h3>
                                    <div className="space-y-1 sm:space-y-2">
                                        <p className="text-[11px] sm:text-2xl font-bold opacity-90 tracking-tight">{toSentenceCase(new Date(activeServiceDetails.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
                                        <p className="text-[14px] sm:text-4xl font-black tracking-tighter">{activeServiceDetails.time || '8:00 AM - 10:00 PM'}</p>
                                        <p className="text-[8px] sm:text-[14px] opacity-85 leading-normal font-medium italic mt-1 max-w-full">Rejoignez-nous pour célébrer le Seigneur ensemble.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 sm:pt-6 border-t border-white/20 mt-3 sm:mt-6">
                                    <div className="flex items-center gap-1.5 opacity-90 group cursor-help">
                                        <MapPin size={12} className="text-[#D4AF37] sm:w-4 sm:h-4" />
                                        <span className="text-[9px] sm:text-[13px] font-bold tracking-tight">{toSentenceCase(activeServiceDetails.location || activeServiceDetails.church?.name || 'Lieu du culte')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-8">
                                        <a href="#" className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"><Facebook size={12} className="fill-white" /><span className="font-bold text-[8px] sm:text-xs uppercase">FB</span></a>
                                        <a href="#" className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"><Youtube size={12} className="fill-white" /><span className="font-bold text-[8px] sm:text-xs uppercase">YT</span></a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TABS ───────────────────────────────────────────────── */}
                        <div className="border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-6 sm:gap-14 overflow-x-auto no-scrollbar pt-1 pb-2">
                                {[
                                    { id: 'programme', label: 'Programme' },
                                    { id: 'message', label: 'Message' },
                                    { id: 'comments', label: 'Message & comments' }
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-[12px] sm:text-[15px] font-black transition-all whitespace-nowrap pb-2 relative ${activeTab === tab.id ? 'text-[#1e1b4b] dark:text-white' : 'text-slate-500 hover:text-slate-600'}`}>{tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e1b4b] dark:bg-white rounded-full" />}</button>
                                ))}
                            </div>
                        </div>

                        {/* ── CONTENT AREA ───────────────────────────────────────── */}
                        <div className="pt-2 pb-4 min-h-[200px]">
                            {activeTab === 'programme' ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-16 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl sm:rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-indigo-600 text-white rounded-xl sm:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-3 sm:mb-6">
                                        <Projector size={20} className="sm:hidden" /><Projector size={32} className="hidden sm:block" />
                                    </div>
                                    <h3 className="text-[16px] sm:text-xl font-black text-slate-800 dark:text-white mb-1">Voir le programme</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4 text-[12px] sm:text-[14px] font-medium leading-tight">Accédez au programme complet ici.</p>
                                    <button onClick={() => navigate(`/public/worship/${activeServiceId}`)} className="flex items-center gap-2 px-8 py-3 bg-[#1e1b4b] hover:bg-[#2e2b6b] text-white rounded-lg font-black text-[12px] sm:text-[14px] transition-all transform hover:scale-105 active:scale-95 shadow-md group">Ouvrir le programme<ExternalLink size={14} className="sm:hidden" /><ExternalLink size={18} className="hidden sm:block" /></button>
                                    <div className="mt-4 flex flex-col items-center gap-1">
                                        <button onClick={() => { navigator.clipboard.writeText(publicLink); toast.success('Lien copié !'); }} className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded-lg text-[10px] font-bold text-indigo-500 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-all"><span className="max-w-[180px] truncate">{publicLink}</span><Share2 size={12} className="opacity-40" /></button>
                                    </div>
                                </div>
                            ) : activeTab === 'message' ? (
                                <div className="max-w-5xl mx-auto py-2 relative">
                                    {activeServiceDetails.sermon ? (
                                        <div 
                                            className="bg-white dark:bg-slate-800 p-6 sm:p-12 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700 group cursor-pointer relative"
                                            onClick={() => setIsMessageFocused(true)}
                                        >
                                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                                <Maximize2 size={20} />
                                            </div>
                                            <div 
                                                ref={sermonRef}
                                                className="prose prose-sm sm:prose-lg prose-slate dark:prose-invert max-w-none sermon-content"
                                                onMouseUp={handleTextSelection}
                                                dangerouslySetInnerHTML={{ __html: activeServiceDetails.sermon.content }} 
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2"><Book size={32} /><p className="font-black tracking-widest text-[10px] uppercase">Aucun résumé disponible</p></div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {/* General Comment Input */}
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                                        <h4 className="text-[12px] font-black uppercase tracking-widest text-[#1e1b4b] dark:text-white">Partagez vos pensées</h4>
                                        <div className="flex gap-2">
                                            <textarea 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Laissez un commentaire ou posez une question..."
                                                className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-[13px] font-medium min-h-[80px] focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                            <button 
                                                onClick={() => handleAddComment()}
                                                className="self-end p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Comments List */}
                                    <div className="space-y-3">
                                        {comments.length > 0 ? comments.map(comment => (
                                            <div key={comment.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-50 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs">
                                                            {comment.author?.firstName?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-black text-slate-800 dark:text-white leading-none">{comment.author?.firstName} {comment.author?.lastName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {comment.highlightRange && (
                                                    <div className="mb-2 pl-3 border-l-4 border-indigo-500/30 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-r-lg">
                                                        <Quote size={12} className="text-indigo-400 mb-1" />
                                                        <p className="text-[11px] italic text-slate-500 dark:text-slate-400 font-medium line-clamp-2">"{comment.highlightRange.text}"</p>
                                                    </div>
                                                )}

                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{comment.content}</p>
                                                
                                                {/* Reply logic (Preacher/Admin) can be added here */}
                                            </div>
                                        )) : (
                                            <p className="text-center py-10 text-slate-400 text-[12px] italic">Aucun commentaire pour le moment.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── ARCHIVES (Past Services) ────────────────────────── */}
                        <div className="space-y-4 pb-20">
                            <div className="flex items-center gap-3 px-2 sm:px-0"><div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" /><h3 className="text-[11px] sm:text-xl font-black text-[#1e1b4b] dark:text-white tracking-tight uppercase">Archives</h3><div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" /></div>
                            <div className="hidden sm:block overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="border-b border-slate-100 dark:border-slate-800"><th className="py-4 px-4 text-[13px] font-black text-slate-400 uppercase tracking-widest">Thème du culte</th><th className="py-4 px-4 text-[13px] font-black text-slate-400 uppercase tracking-widest">Date</th><th className="py-4 px-4 text-[13px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {paginatedServices.map(s => (
                                            <tr key={s.id} onClick={() => loadServiceDetails(s.id)} className="group cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"><td className="py-5 px-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"><Calendar size={16} /></div><span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">{toSentenceCase(s.theme)}</span></div></td><td className="py-5 px-4 text-[14px] font-medium text-slate-500 dark:text-slate-400">{formatDateShort(s.date)}</td><td className="py-5 px-4 text-right"><button className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"><ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600" /></button></td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="sm:hidden grid grid-cols-1 gap-2">
                                {paginatedServices.map(s => (
                                    <div key={s.id} onClick={() => loadServiceDetails(s.id)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-50 dark:border-slate-700 hover:border-indigo-200 active:scale-[0.98] transition-all group"><div className="flex items-center gap-3"><Calendar size={14} className="text-slate-300" /><span className="text-[12px] font-black text-slate-700 dark:text-slate-100 tracking-tight line-clamp-1">{toSentenceCase(s.theme)}</span></div><span className="text-[11px] font-bold text-slate-400 shrink-0">{formatDateShort(s.date)}</span></div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} sur {totalPages}</p>
                                    <div className="flex items-center gap-1"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeftIcon size={18} /></button><div className="flex items-center gap-1 mx-2">{Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-[13px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{pageNum}</button>))}</div><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRight size={18} /></button></div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ── FOCUSED MESSAGE READER OVERLAY ────────────────────────── */}
            {isMessageFocused && (
                <div className="focused-reader flex flex-col sm:flex-row">
                    {/* Reader Column */}
                    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
                        {/* Control Bar */}
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsMessageFocused(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24} /></button>
                                <h3 className="font-black text-lg sm:text-2xl text-[#1e1b4b] dark:text-white">{activeServiceDetails.sermon?.title || 'Résumé du message'}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full hidden sm:block"><Minimize2 size={20} /></button>
                            </div>
                        </div>
                        
                        {/* Scroll Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-20 noscrollbar pb-40">
                            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-8 sm:p-16 rounded-[2.5rem] shadow-2xl border border-slate-50 dark:border-slate-700 relative">
                                <div 
                                    ref={sermonRef}
                                    className="prose prose-sm sm:prose-lg lg:prose-xl dark:prose-invert max-w-none sermon-content selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-200"
                                    onMouseUp={handleTextSelection}
                                    dangerouslySetInnerHTML={{ __html: activeServiceDetails.sermon.content }} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comments Sidebar (Always visible in focus mode) */}
                    <div className="w-full sm:w-[400px] h-full sm:h-screen bg-white dark:bg-slate-800 border-l border-slate-100 dark:border-slate-700 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-black uppercase tracking-[0.2em] text-[12px] text-slate-400">Interactions & Commentaires</h3>
                            {isCommentingSelection && <button onClick={() => setIsCommentingSelection(false)} className="text-red-500 p-1"><X size={16} /></button>}
                        </div>

                        {/* Selection Context Header */}
                        {isCommentingSelection && (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40 animate-in slide-in-from-top-4 duration-300">
                                <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Sur la sélection :</p>
                                <p className="text-[12px] italic text-slate-600 dark:text-slate-300 font-medium line-clamp-3">"{selectedText}"</p>
                            </div>
                        )}

                        {/* Interaction List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 noscrollbar pb-32">
                            {comments.map(comment => (
                                <div key={comment.id} className={`p-4 rounded-xl border ${comment.isResolved ? 'bg-slate-50 opacity-60' : 'bg-white dark:bg-slate-900'} border-slate-100 dark:border-slate-700 shadow-sm transition-all`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">{comment.author?.firstName?.charAt(0)}</div>
                                        <div>
                                            <p className="text-[11px] font-black leading-none">{comment.author?.firstName}</p>
                                            <p className="text-[9px] text-slate-400 font-bold">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    {comment.highlightRange && (
                                        <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-[10px] italic border-l-2 border-indigo-500/50">"{comment.highlightRange.text}"</div>
                                    )}
                                    <p className="text-[12px] font-medium leading-relaxed">{comment.content}</p>
                                </div>
                            ))}
                        </div>

                        {/* Sticky Input */}
                        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <textarea 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={isSubmitting}
                                    placeholder={isCommentingSelection ? "Répondez à ce passage..." : "Une question sur le message ?"}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-5 pr-14 text-[14px] font-medium focus:ring-2 focus:ring-indigo-500/20 min-h-[120px] resize-none shadow-inner disabled:opacity-50"
                                />
                                <button 
                                    onClick={() => handleAddComment()}
                                    disabled={isSubmitting || !newComment.trim()}
                                    className={`absolute right-3.5 bottom-3.5 p-3.5 rounded-2xl shadow-xl transform active:scale-90 transition-all ${isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'}`}
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
