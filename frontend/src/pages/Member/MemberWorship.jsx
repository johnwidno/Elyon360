import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import worshipService from '../../api/worshipService';
import api from '../../api/axios';
import { 
    Calendar, Music, Book, Heart, Users, Speaker, 
    Mic, ChevronDown, MessageSquare, 
    PlayCircle, BookOpen, Layers, Search, 
    Facebook, Youtube, ArrowLeft, ChevronUp, ExternalLink, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const styles = `
  .bg-banner-overlay {
    background-image: linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.6)), url("/uploads/church_service.png");
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
  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.5);
    width: 20px;
    height: 20px;
  }
  .search-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
`;

export default function MemberWorship() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [activeServiceDetails, setActiveServiceDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('programme'); 
    const [expandedBlocks, setExpandedBlocks] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [isSemaineDropdownOpen, setIsSemaineDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            toast.error('Erreur de chargement des détails');
        } finally {
            setLoading(false);
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
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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

    const publicLink = activeServiceId ? `${window.location.origin}/public/worship/${activeServiceId}` : '';

    const handleLaunchProgramme = () => {
        if (activeServiceId) {
            navigate(`/public/worship/${activeServiceId}`);
        }
    };

    return (
        <div className="w-full px-0 sm:px-10 lg:px-16 pt-0 sm:pt-2 pb-10 space-y-3 sm:space-y-6 animate-in fade-in duration-700">
            {/* ── SEARCH (Always Horizontal) ────────────────────────── */}
            <div className="flex flex-row items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30 p-2 sm:p-4 rounded-none sm:rounded-3xl border-b sm:border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 sm:pl-14 sm:pr-6 text-[13px] sm:text-[14px] font-bold text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                </div>
                <div className="relative w-auto shrink-0 flex items-center">
                    <input 
                        type="date" 
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-[45px] sm:w-auto bg-white dark:bg-slate-800 border-none rounded-xl py-2 px-2 text-[12px] font-bold text-slate-700 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="hidden sm:inline text-[12px] font-bold text-slate-400 whitespace-nowrap px-4 border-l border-slate-200 dark:border-slate-700 uppercase tracking-widest pl-2">Rechercher par date</span>
                </div>
            </div>

            <div className="px-4 sm:px-0 space-y-3 sm:space-y-6">
                {/* ── HEADER AREA (More Compact) ────────────────────────── */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <div className="text-[#1e1b4b] dark:text-white cursor-pointer p-0.5 rounded-lg transition-colors">
                            <ArrowLeft size={18} strokeWidth={3} />
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black text-[#1e1b4b] dark:text-white tracking-tight leading-none">Culte</h1>
                    </div>
                    <p className="text-[11px] sm:text-[14px] font-bold text-slate-400 ml-7 italic leading-none">Les programme spirituel & messages ici</p>
                </div>

                {/* ── CURRENT WORSHIP ─────────────────────────────────────── */}
                {activeServiceDetails ? (
                    <div className="space-y-3 sm:space-y-6">
                        <div className="flex flex-row items-center justify-between gap-2 px-1">
                            <h2 className="text-[12px] sm:text-[19px] font-black text-[#1e1b4b] dark:text-white leading-tight min-w-0 flex-1 truncate">
                                {formatDateFull(activeServiceDetails.date)}
                            </h2>
                            
                            <div className="relative shrink-0" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsSemaineDropdownOpen(!isSemaineDropdownOpen)}
                                    className="flex items-center gap-1 text-slate-400 hover:text-[#1e1b4b] dark:hover:text-white transition-colors"
                                >
                                    <span className="text-[10px] sm:text-[14px] font-black tracking-tight whitespace-nowrap">| Cette semaine</span>
                                    {isSemaineDropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                {isSemaineDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-60 sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden dropdown-animate">
                                        <div className="p-1 space-y-0.5">
                                            {currentWeekServices.map(s => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => loadServiceDetails(s.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] sm:text-[13px] font-bold transition-all ${s.id === activeServiceId ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                                >
                                                    {formatDateFull(s.date)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FEATURED BANNER CARD (Ultra Compact Mobile Height) */}
                        <div 
                            className="-mx-4 sm:mx-0 rounded-none sm:rounded-[3rem] p-6 sm:p-14 lg:p-16 shadow-2xl relative overflow-hidden flex flex-col justify-center text-white min-h-[160px] sm:min-h-[420px]"
                            style={{
                                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.6)), url("${bannerImage || 'https://images.unsplash.com/photo-1438032005730-c77930810965?auto=format&fit=crop&q=80&w=2670'}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="relative z-10 space-y-2 sm:space-y-8">
                                <div className="space-y-1 sm:space-y-4">
                                    <h3 className="text-sm sm:text-3xl font-black leading-tight max-w-4xl drop-shadow-2xl">
                                        {toSentenceCase(`Theme : ${activeServiceDetails.theme}`)}
                                    </h3>
                                    <div className="space-y-0 sm:space-y-2">
                                        <p className="text-[11px] sm:text-2xl font-bold opacity-90 tracking-tight">
                                            {toSentenceCase(new Date(activeServiceDetails.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}
                                        </p>
                                        <p className="text-[14px] sm:text-4xl font-black tracking-tighter">
                                            {activeServiceDetails.time || '8:00 AM - 10:00 PM'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 sm:pt-6 border-t border-white/20 mt-2 sm:mt-6">
                                    <div className="flex items-center gap-2">
                                        <Music size={14} className="sm:hidden" />
                                        <span className="text-[10px] sm:text-lg font-bold tracking-tight">Lieu du culte</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-8">
                                        <a href="#" className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                                            <Facebook size={12} className="fill-white" />
                                            <span className="font-bold text-[8px] sm:text-xs uppercase">FB</span>
                                        </a>
                                        <a href="#" className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                                            <Youtube size={12} className="fill-white" />
                                            <span className="font-bold text-[8px] sm:text-xs uppercase">YT</span>
                                        </a>
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
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`text-[12px] sm:text-[15px] font-black transition-all whitespace-nowrap pb-2 relative ${activeTab === tab.id ? 'text-[#1e1b4b] dark:text-white' : 'text-slate-300 hover:text-slate-400'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e1b4b] dark:bg-white rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── CONTENT AREA (Compact for immediate visibility) ──────── */}
                        <div className="pt-2 pb-4 min-h-[200px]">
                            {activeTab === 'programme' ? (
                                <div className="flex flex-col items-center justify-center py-6 sm:py-16 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl sm:rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 bg-indigo-600 text-white rounded-xl sm:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-3 sm:mb-6">
                                        <Globe size={20} className="sm:hidden" />
                                        <Globe size={32} className="hidden sm:block" />
                                    </div>
                                    <h3 className="text-[16px] sm:text-xl font-black text-slate-800 dark:text-white mb-1">Voir le programme</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4 text-[12px] sm:text-[14px] font-medium leading-tight">
                                        Accédez au programme complet ici.
                                    </p>
                                    
                                    <button 
                                        onClick={handleLaunchProgramme}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1e1b4b] hover:bg-[#2e2b6b] text-white rounded-lg font-black text-[12px] sm:text-[14px] transition-all transform hover:scale-105 active:scale-95 shadow-md group"
                                    >
                                        Ouvrir le programme
                                        <ExternalLink size={14} className="sm:hidden" />
                                        <ExternalLink size={18} className="hidden sm:block" />
                                    </button>
                                    
                                    <div className="mt-4 flex flex-col items-center gap-1">
                                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-indigo-500 dark:text-indigo-400 select-all border border-slate-200 dark:border-slate-700 max-w-[200px] truncate">
                                            {publicLink}
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'message' ? (
                                <div className="max-w-5xl mx-auto py-2 bg-white dark:bg-slate-800 p-4 sm:p-12 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700">
                                    {activeServiceDetails.message ? (
                                        <div className="prose prose-sm sm:prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: activeServiceDetails.message.content }} />
                                    ) : (
                                        <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                                            <Book size={32} />
                                            <p className="font-black tracking-widest text-[10px] uppercase">Aucun résumé disponible</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center py-10">
                                        <MessageSquare size={32} className="mx-auto text-slate-200 mb-2" />
                                        <h4 className="font-black text-slate-400 tracking-[0.1em] text-[10px] uppercase">Discussion à venir</h4>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── PAST SERVICES ───────────────────────────────────────── */}
                        <div className="space-y-4 pb-20">
                            <div className="flex items-center gap-3 px-2 sm:px-0">
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                                <h3 className="text-[12px] sm:text-xl font-black text-[#1e1b4b] dark:text-white tracking-tight uppercase">Archives</h3>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                                {filteredPastServices.length > 0 ? filteredPastServices.map(s => (
                                    <div key={s.id} 
                                        onClick={() => loadServiceDetails(s.id)}
                                        className="flex items-center justify-between p-4 sm:p-7 bg-white dark:bg-slate-800 rounded-xl sm:rounded-[1.5rem] border border-slate-50 dark:border-slate-700 hover:border-indigo-200 hover:shadow-xl transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={14} className="text-slate-300" />
                                            <span className="text-[12px] sm:text-[16px] font-black text-slate-700 dark:text-slate-100 tracking-tight">{toSentenceCase(s.theme)}</span>
                                        </div>
                                        <span className="text-[11px] sm:text-[15px] font-bold text-slate-400">{formatDateShort(s.date)}</span>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-300 py-6 italic text-[11px]">Aucun culte trouvé.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
