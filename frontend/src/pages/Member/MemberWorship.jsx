import React, { useState, useEffect, useRef } from 'react';
import worshipService from '../../api/worshipService';
import { 
    Calendar, Music, Book, Heart, Users, Speaker, 
    Mic, ChevronDown, MessageSquare, 
    PlayCircle, BookOpen, Layers, Search, 
    Facebook, Youtube, ArrowLeft, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const styles = `
  .gradient-banner {
    background: linear-gradient(135deg, #FF9D6C 0%, #BB6BD9 50%, #4F46E5 100%);
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
`;

export default function MemberWorship() {
    const [services, setServices] = useState([]);
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [activeServiceDetails, setActiveServiceDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('programme'); 
    const [expandedBlocks, setExpandedBlocks] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isSemaineDropdownOpen, setIsSemaineDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
        } catch (error) {
            toast.error('Erreur de chargement des détails');
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = (blockId) => {
        setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
    };

    const getBlockIcon = (type) => {
        const types = {
            'welcome': <Users size={18} />,
            'song': <Music size={18} />,
            'prayer': <Heart size={18} />,
            'reading': <BookOpen size={18} />,
            'announcement': <Speaker size={18} />,
            'sermon': <Mic size={18} />
        };
        return types[type] || <Heart size={18} />;
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

    const filteredPastServices = services.filter(s => s.id !== activeServiceId && 
        (s.theme.toLowerCase().includes(searchTerm.toLowerCase()) || formatDateShort(s.date).includes(searchTerm))
    );

    return (
        <div className="w-full px-4 sm:px-10 lg:px-16 pt-2 pb-10 space-y-4 animate-in fade-in duration-700">
            {/* ── HEADER AREA ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 -mt-2">
                <div className="flex items-center gap-3">
                    <div className="text-[#1e1b4b] dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-lg transition-colors">
                        <ArrowLeft size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] dark:text-white tracking-tight">Culte</h1>
                </div>
                <p className="text-[13px] sm:text-[14px] font-bold text-slate-400 ml-10 italic -mt-1">Les programme spirituel & messages ici</p>
            </div>

            {/* ── CURRENT WORSHIP ─────────────────────────────────────── */}
            {activeServiceDetails ? (
                <div className="space-y-6">
                    {/* Title & Dropdown (Always on the same line) */}
                    <div className="flex flex-row items-center justify-between gap-2 px-1">
                        <h2 className="text-[13px] sm:text-[19px] font-black text-[#1e1b4b] dark:text-white leading-tight min-w-0 flex-1 truncate">
                            {formatDateFull(activeServiceDetails.date)}
                        </h2>
                        
                        <div className="relative shrink-0" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsSemaineDropdownOpen(!isSemaineDropdownOpen)}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-[#1e1b4b] dark:hover:text-white transition-colors"
                            >
                                <span className="text-[11px] sm:text-[14px] font-black tracking-tight whitespace-nowrap">| Cette semaine</span>
                                {isSemaineDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {isSemaineDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] overflow-hidden dropdown-animate">
                                    <div className="p-1 sm:p-2 space-y-1">
                                        {currentWeekServices.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => loadServiceDetails(s.id)}
                                                className={`w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-[12px] sm:text-[13px] font-bold transition-all ${s.id === activeServiceId ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                            >
                                                {formatDateFull(s.date)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FEATURED BANNER CARD */}
                    <div className="gradient-banner rounded-[1.5rem] sm:rounded-[3rem] p-8 sm:p-14 lg:p-16 text-white shadow-2xl relative overflow-hidden group min-h-[350px] sm:min-h-[420px] flex flex-col justify-center">
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight max-w-4xl drop-shadow-xl">
                                    {toSentenceCase(`Theme : ${activeServiceDetails.theme}`)}
                                </h3>
                                
                                <div className="space-y-2">
                                    <p className="text-lg sm:text-2xl font-bold opacity-90 tracking-tight">
                                        {toSentenceCase(new Date(activeServiceDetails.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}
                                    </p>
                                    <p className="text-2xl sm:text-4xl font-black tracking-tighter">
                                        {activeServiceDetails.time || '8:00 AM - 10:00 PM'}
                                    </p>
                                    <p className="text-sm sm:text-lg opacity-85 leading-relaxed font-medium max-w-2xl italic">
                                        Rejoiner nous pour adorer le seigneur ensemble.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-8 border-t border-white/20 mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <Music size={22} />
                                    </div>
                                    <span className="text-sm sm:text-lg font-bold tracking-tight">Lieu du culte</span>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-8">
                                    <a href="#" className="flex items-center gap-2 hover:scale-110 transition-transform bg-white/10 px-4 py-2 rounded-full">
                                        <Facebook size={22} className="fill-white" />
                                        <span className="hidden sm:inline font-bold text-sm">Facebook</span>
                                    </a>
                                    <a href="#" className="flex items-center gap-2 hover:scale-110 transition-transform bg-white/10 px-4 py-2 rounded-full">
                                        <Youtube size={22} className="fill-white" />
                                        <span className="hidden sm:inline font-bold text-sm">Youtube</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TABS ───────────────────────────────────────────────── */}
                    <div className="border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-8 sm:gap-14 overflow-x-auto no-scrollbar py-2">
                            {[
                                { id: 'programme', label: 'Programme' },
                                { id: 'message', label: 'Message' },
                                { id: 'comments', label: 'Message & comments' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-[14px] sm:text-[15px] font-black transition-all whitespace-nowrap pb-3 relative ${activeTab === tab.id ? 'text-[#1e1b4b] dark:text-white' : 'text-slate-300 hover:text-slate-400'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1e1b4b] dark:bg-white rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── SEARCH ─────────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="relative w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input 
                                type="text" 
                                placeholder="Chercher"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-14 pr-6 text-[14px] font-bold text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                        </div>
                        <span className="text-[12px] font-bold text-slate-400 whitespace-nowrap px-4 border-l border-slate-200 dark:border-slate-700 hidden sm:block tracking-wide">Chercher par date</span>
                    </div>

                    {/* ── CONTENT AREA ───────────────────────────────────────── */}
                    <div className="py-4 min-h-[400px]">
                        {activeTab === 'programme' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {activeServiceDetails.blocks?.sort((a,b)=>a.orderIndex - b.orderIndex).map((block, index) => (
                                    <div key={block.id} 
                                        onClick={() => (block.metadata?.songLyrics || block.metadata?.passageText) && toggleBlock(block.id)}
                                        className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${expandedBlocks[block.id] ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-indigo-100'}`}
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${expandedBlocks[block.id] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                                                {getBlockIcon(block.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 dark:text-white text-[15px] leading-tight">
                                                    {toSentenceCase(block.label)}
                                                </h4>
                                                {block.type === 'song' && block.metadata?.songTitle && <p className="text-indigo-500 font-bold text-xs mt-1">{toSentenceCase(block.metadata.songTitle)}</p>}
                                            </div>
                                        </div>
                                        {expandedBlocks[block.id] && (
                                            <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-2">
                                                <div className="text-[14px] italic text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                                    {block.type === 'song' ? block.metadata?.songLyrics : block.metadata?.passageText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'message' ? (
                            <div className="max-w-5xl mx-auto py-4 bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-700">
                                {activeServiceDetails.message ? (
                                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: activeServiceDetails.message.content }} />
                                ) : (
                                    <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
                                        <Book size={48} />
                                        <p className="font-black tracking-widest text-sm">Le résumé du message n'est pas encore disponible</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 text-center py-20">
                                    <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                                    <h4 className="font-black text-slate-400 tracking-[0.1em] text-sm">Espace discussion à venir</h4>
                                    <p className="text-slate-300 italic mt-2">Partagez vos réflexions sur le message de ce culte bientôt.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── PAST SERVICES ───────────────────────────────────────── */}
                    <div className="space-y-6 pb-20">
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                            <h3 className="text-lg sm:text-xl font-black text-[#1e1b4b] dark:text-white tracking-tight">Archives des cultes</h3>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPastServices.length > 0 ? filteredPastServices.map(s => (
                                <div key={s.id} 
                                    onClick={() => loadServiceDetails(s.id)}
                                    className="flex items-center justify-between p-5 sm:p-7 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-50 dark:border-slate-700 hover:border-indigo-200 hover:shadow-xl transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                                            <Calendar size={18} />
                                        </div>
                                        <span className="text-[14px] sm:text-[16px] font-black text-slate-700 dark:text-slate-100 group-hover:text-indigo-600 transition-colors tracking-tight">{toSentenceCase(s.theme)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[13px] sm:text-[15px] font-bold text-slate-400">{formatDateShort(s.date)}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-300 py-10 italic col-span-2">Aucun culte passé disponible.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
