import React, { useState, useEffect } from 'react';
import worshipService from '../../api/worshipService';
import { 
    Calendar, Clock, Music, Book, Heart, Users, Speaker, 
    Mic, ChevronDown, ChevronUp, MessageSquare, Quote, 
    PlayCircle, BookOpen, Layers, Info, Filter, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MemberWorship() {
    const [services, setServices] = useState([]);
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [activeServiceDetails, setActiveServiceDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('programme'); // 'programme' or 'message'
    const [expandedBlocks, setExpandedBlocks] = useState({});

    useEffect(() => {
        fetchServices();
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

    if (loading && !activeServiceDetails) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Chargement du culte…</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
            {/* ── HEADER / SELECTOR ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <PlayCircle size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cultes & Événements</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[14px] font-bold text-slate-400">Programme spirituel & messages</p>
                        </div>
                    </div>
                </div>
                
                <div className="relative w-full md:w-auto min-w-[300px]">
                    <select 
                        value={activeServiceId || ''}
                        onChange={(e) => loadServiceDetails(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none outline-none rounded-2xl px-6 py-4 font-black text-[13px] text-slate-700 dark:text-slate-300 shadow-inner appearance-none pr-12 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {services.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.theme} — {new Date(s.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={20} />
                </div>
            </div>

            {activeServiceDetails ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                    {/* ── MAIN CONTENT AREA (lg:col-span-8) ───────────────────────── */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Tab Switcher */}
                        <div className="flex p-2 bg-white dark:bg-slate-800 rounded-[2rem] w-max shadow-sm border border-slate-100 dark:border-slate-700">
                            {[
                                { id: 'programme', label: 'Programme', icon: <Layers size={14} /> },
                                { id: 'message', label: 'Résumé du Message', icon: <BookOpen size={14} /> }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[13px] font-black tracking-tight transition-all uppercase ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Layout Content */}
                        <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-8 sm:p-10 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[600px] animate-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'programme' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Déroulement du service</h2>
                                    </div>

                                    {activeServiceDetails.blocks?.sort((a,b)=>a.orderIndex - b.orderIndex).map((block, index) => (
                                        <div key={block.id} className={`group border rounded-[2rem] transition-all duration-300 ${expandedBlocks[block.id] ? 'bg-slate-50 dark:bg-slate-900 shadow-inner border-indigo-100 dark:border-indigo-900/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md'}`}>
                                            <div className="p-6 flex items-center gap-5 cursor-pointer" onClick={() => (block.metadata?.songLyrics || block.metadata?.passageText) && toggleBlock(block.id)}>
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${expandedBlocks[block.id] ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 group-hover:scale-110'}`}>
                                                    {getBlockIcon(block.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{block.type}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[11px] font-bold text-slate-400">Étape {index + 1}</span>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 dark:text-white text-[16px] leading-tight">
                                                        {block.label}
                                                        {block.type === 'song' && block.metadata?.songTitle && <span className="text-indigo-500 dark:text-indigo-400 ml-2"> — {block.metadata.songTitle}</span>}
                                                        {block.type === 'reading' && block.metadata?.passage && <span className="text-emerald-500 dark:text-emerald-400 ml-2"> — {block.metadata.passage}</span>}
                                                    </h4>
                                                </div>
                                                {((block.type === 'song' && block.metadata?.songLyrics) || (block.type === 'reading' && block.metadata?.passageText)) && (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${expandedBlocks[block.id] ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
                                                        <ChevronDown size={22} className={`transition-transform duration-500 ${expandedBlocks[block.id] ? 'rotate-180' : ''}`} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Expandable details */}
                                            {expandedBlocks[block.id] && (
                                                <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                                                    <div className="bg-white dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group/text">
                                                        <Quote size={40} className="absolute -right-2 -top-2 text-slate-50 dark:text-slate-900/40 rotate-12 transition-transform group-hover/text:rotate-0" />
                                                        <div className="relative z-10 text-[15px] italic leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium">
                                                            {block.type === 'song' ? block.metadata?.songLyrics : block.metadata?.passageText}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {(!activeServiceDetails.blocks || activeServiceDetails.blocks.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-32 text-center">
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                                <Layers size={40} />
                                            </div>
                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Programme non disponible</h4>
                                            <p className="text-slate-400 mt-2 text-sm italic">Revenez plus tard pour le détail complet.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Résumé spirituel</h2>
                                    </div>
                                    
                                    {activeServiceDetails.message ? (
                                        <div className="prose pro-lg dark:prose-invert max-w-none prose-headings:font-black prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: activeServiceDetails.message.content }} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 text-center">
                                            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-500/10">
                                                <Mic size={40} />
                                            </div>
                                            <h4 className="font-black text-slate-900 dark:text-white text-xl mb-2">Message en cours de rédaction</h4>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm italic leading-relaxed">Le résumé du message inspiré de ce culte n'a pas encore été publié. Nous vous invitons à consulter nos archives en attendant.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── SIDEBAR OVERVIEW (lg:col-span-4) ───────────────────────── */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Theme Header Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative group">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-4 block">Thème Principal</span>
                                <h3 className="text-2xl font-black mb-10 leading-tight italic">"{activeServiceDetails.theme}"</h3>
                                
                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Calendar size={20} className="text-indigo-100" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-indigo-200 leading-none mb-1">Date</p>
                                            <p className="font-bold text-[14px]">{new Date(activeServiceDetails.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Clock size={20} className="text-indigo-100" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-indigo-200 leading-none mb-1">Heure</p>
                                            <p className="font-bold text-[14px]">{activeServiceDetails.time}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Widget */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[3rem] p-10 shadow-sm text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-lg shadow-amber-500/50" />
                            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:rotate-6 shadow-inner">
                                <MessageSquare size={32} />
                            </div>
                            <h4 className="font-black text-slate-900 dark:text-white text-xl mb-4 tracking-tight">Une question ?</h4>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">Un point du message vous a interpellé ? Laissez vos remarques ou questions pour nos études bibliques.</p>
                            <button className="w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.1em] text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-600 hover:text-white transition-all shadow-xl shadow-amber-500/5 flex items-center justify-center gap-2 group/btn">
                                Poser une question
                                <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-20">
                                <Info size={120} />
                             </div>
                             <div className="relative z-10">
                                <h4 className="font-black text-xl mb-4 italic">Participation</h4>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">Vous souhaitez participer au service ou proposer un témoignage ? Contactez votre responsable de ministère.</p>
                                <div className="flex items-center gap-2 text-indigo-400 text-[12px] font-black uppercase tracking-widest cursor-pointer hover:text-indigo-300 transition-colors">
                                    Voir les ministères <ArrowRight size={12} />
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-32 text-center border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                        <Calendar size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em]">Aucun culte planifié</h3>
                    <p className="text-slate-400 mt-4 italic">Nous reviendrons vers vous dès que le prochain culte sera programmé.</p>
                </div>
            )}
        </div>
    );
}
