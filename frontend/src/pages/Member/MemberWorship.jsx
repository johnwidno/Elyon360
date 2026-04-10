import React, { useState, useEffect } from 'react';
import worshipService from '../../api/worshipService';
import { Calendar, Clock, Music, Book, Heart, Users, Speaker, Mic, ChevronDown, ChevronUp, MessageSquare, Quote } from 'lucide-react';
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
            // Show only recent/upcoming
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
            'welcome': <Users size={16} />,
            'song': <Music size={16} />,
            'prayer': <Heart size={16} />,
            'reading': <Book size={16} />,
            'announcement': <Speaker size={16} />,
            'sermon': <Mic size={16} />
        };
        return types[type] || <Heart size={16} />;
    };

    if (loading && !activeServiceDetails) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto p-4 lg:p-8 animate-in fade-in">
            {/* Header / Selector */}
            <div className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Cultes & Événements</h1>
                    <p className="text-sm text-gray-500 mt-1">Consultez le programme et les messages des cultes</p>
                </div>
                <select 
                    value={activeServiceId || ''}
                    onChange={(e) => loadServiceDetails(e.target.value)}
                    className="bg-gray-50 dark:bg-white/5 border-transparent outline-none rounded-xl px-4 py-3 font-bold text-gray-700 dark:text-gray-300 min-w-[200px]"
                >
                    {services.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.theme} • {new Date(s.date).toLocaleDateString()}
                        </option>
                    ))}
                </select>
            </div>

            {activeServiceDetails ? (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-max">
                            <button 
                                onClick={() => setActiveTab('programme')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'programme' ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >Programme du culte</button>
                            <button 
                                onClick={() => setActiveTab('message')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'message' ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >Résumé du Message</button>
                        </div>

                        {/* Content */}
                        <div className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm min-h-[500px]">
                            {activeTab === 'programme' ? (
                                <div className="space-y-4">
                                    {activeServiceDetails.blocks?.sort((a,b)=>a.orderIndex - b.orderIndex).map((block, index) => (
                                        <div key={block.id} className="border border-gray-100 dark:border-white/5 rounded-2xl p-4 bg-gray-50/50 dark:bg-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                                                    {getBlockIcon(block.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                                        {block.label}
                                                        {block.type === 'song' && block.metadata?.songTitle && ` - ${block.metadata.songTitle}`}
                                                        {block.type === 'reading' && block.metadata?.passage && ` - ${block.metadata.passage}`}
                                                    </h4>
                                                </div>
                                                {((block.type === 'song' && block.metadata?.songLyrics) || (block.type === 'reading' && block.metadata?.passageText)) && (
                                                    <button onClick={() => toggleBlock(block.id)} className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg">
                                                        {expandedBlocks[block.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Expandable details */}
                                            {expandedBlocks[block.id] && (
                                                <div className="mt-4 pl-14 pr-4">
                                                    {block.type === 'song' && (
                                                        <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 p-4 rounded-xl text-sm italic whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                                                            {block.metadata?.songLyrics}
                                                        </div>
                                                    )}
                                                    {block.type === 'reading' && (
                                                        <div className="bg-white dark:bg-[#0B0F19] border border-gray-100 dark:border-white/5 p-4 rounded-xl text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                                            {block.metadata?.passageText}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!activeServiceDetails.blocks || activeServiceDetails.blocks.length === 0) && (
                                        <div className="text-center py-20 text-gray-500">Le programme n'a pas encore été structuré.</div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none">
                                    {activeServiceDetails.message ? (
                                        <div dangerouslySetInnerHTML={{ __html: activeServiceDetails.message.content }} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                            <Quote size={40} className="mb-4 text-brand-primary" />
                                            <p className="font-medium text-gray-500">Le résumé du message n'a pas encore été publié pour ce culte.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Overview */}
                    <div className="w-full md:w-80 flex flex-col gap-6">
                        <div className="bg-gradient-to-br from-brand-primary to-indigo-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <h3 className="text-xl font-black mb-4 relative z-10">{activeServiceDetails.theme}</h3>
                            <div className="space-y-3 relative z-10 font-medium">
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-white/70" />
                                    <span>{new Date(activeServiceDetails.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-white/70" />
                                    <span>{activeServiceDetails.time}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Widget */}
                        <div className="bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm text-center">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Des questions sur le message ?</h4>
                            <p className="text-sm text-gray-500 mb-4">Laissez vos remarques ou questions, nous y répondrons lors des études bibliques.</p>
                            <button className="w-full py-3 font-bold text-brand-primary bg-brand-primary/10 rounded-xl hover:bg-brand-primary hover:text-white transition-colors">
                                Poser une question
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">Aucun culte planifié.</div>
            )}
        </div>
    );
}
