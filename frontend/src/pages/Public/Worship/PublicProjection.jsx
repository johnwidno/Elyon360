import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import worshipService from '../../../api/worshipService';
import { Layers, Maximize, Minus, Plus, ArrowLeft, Presentation } from 'lucide-react';

const PublicProjection = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [focusedContent, setFocusedContent] = useState(null);
    const [globalZoom, setGlobalZoom] = useState(1);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await worshipService.getPublicServiceById(id);
                setService(response.data);
                setBlocks(response.data.blocks || []);
            } catch (error) {
                console.error("Error fetching public projection:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    const toRoman = (num) => {
        const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
        let roman = '';
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0B1120] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Chargement de la projection...</p>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="fixed inset-0 bg-[#0B1120] flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-red-500">PROGRAMME INTROUVABLE</h1>
                    <p className="text-gray-400">Le lien est peut-être expiré ou incorrect.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-white p-4 sm:p-10 font-serif">
            <style>{`
                .pptx-slide-render {
                    container-type: inline-size;
                    line-height: 1.1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                    overflow: hidden !important;
                    user-select: none;
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    background: linear-gradient(135deg, #111C44 0%, #050A1A 100%);
                    color: white;
                    padding: 5% !important;
                    border-radius: 2rem;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
                    border: 1px solid rgba(212,175,55,0.2);
                    width: 100%;
                    aspect-ratio: 16/9;
                    position: relative;
                }
                .pptx-slide-render h2 {
                    font-size: 8cqw !important;
                    margin-bottom: 0.3em !important;
                    text-align: center !important;
                    color: #D4AF37 !important;
                    font-weight: 900 !important;
                    text-transform: uppercase;
                }
                .pptx-slide-render p, .pptx-slide-render li {
                    font-size: 4.5cqw !important;
                    line-height: 1.4 !important;
                    color: #cbd5e1 !important;
                }
                .pptx-slide-render ul {
                    width: 100% !important;
                    padding-left: 2em !important;
                }
                .slide-footer {
                    position: absolute; bottom: 20px; left: 40px; right: 40px; 
                    display: flex; justify-content: space-between; align-items: center; 
                    opacity: 0.3; font-size: 10px; font-weight: 800; letter-spacing: 2px;
                }
                .resizer-handle { display: none !important; }
            `}</style>

            {/* Public Header */}
            <div className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-10">
                <div className="text-center md:text-left space-y-2">
                    <p className="text-[#D4AF37] text-xs font-black uppercase tracking-[0.4em] opacity-70">Programme Public de Diffusion</p>
                    <h1 className="text-4xl sm:text-6xl font-black">{service.theme || "Culte Spécial"}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 text-sm font-bold uppercase tracking-widest">
                        <span>{new Date(service.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{service.time}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#D4AF37]/30">
                            <Presentation size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Statut</p>
                            <p className="text-sm font-black text-emerald-400">Diffusion Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Program Blocks */}
            <div className="max-w-6xl mx-auto space-y-20 pb-40">
                {blocks.sort((a, b) => a.orderIndex - b.orderIndex).map((block, i) => (
                    <div key={block.id} className="group relative">
                        {/* Block Index Label */}
                        <div className="absolute left-1/2 -top-12 -translate-x-1/2 text-white/5 text-7xl sm:text-[12rem] font-black select-none pointer-events-none uppercase tracking-tighter">
                            {toRoman(i + 1)}
                        </div>



                        <div className="space-y-8 relative">
                            <div className="flex items-center justify-center gap-6">
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
                                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-[0.3em] text-[#D4AF37] text-center">{block.label}</h2>
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
                            </div>


                            {/* Block Content Rendering */}
                            <div className="pl-0 sm:pl-10">
                                {block.type === 'sermon' && block.metadata && (
                                    <div
                                        className="prose prose-invert max-w-none cursor-pointer text-center py-10"
                                        onClick={() => setFocusedContent({ type: 'sermon', title: block.label, content: block.metadata.content || block.metadata.sermonHtml, isHtml: true })}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: block.metadata.content || block.metadata.sermonHtml }} />
                                    </div>
                                )}


                                {block.type === 'song' && (
                                    <div
                                        className="py-12 sm:py-24 hover:bg-white/5 transition-all cursor-pointer group/card w-full text-center"
                                        onClick={() => setFocusedContent({ type: 'song', title: block.metadata?.title || block.label, subtitle: block.metadata?.responsable, content: block.metadata?.lyrics, isHtml: false })}
                                    >
                                        <h3 className="text-4xl sm:text-7xl font-black italic text-blue-400 mb-8 drop-shadow-2xl">« {block.metadata?.title} »</h3>
                                        <p className="text-xl sm:text-4xl text-gray-100 leading-relaxed max-w-5xl mx-auto whitespace-pre-wrap">{block.metadata?.lyrics}</p>
                                    </div>
                                )}




                                {block.type === 'image' && block.metadata?.imageUrl && (
                                    <div
                                        className="relative group/img cursor-zoom-in"
                                        onClick={() => setFocusedContent({ type: 'image', title: block.label, subtitle: block.metadata.imageCaption, content: block.metadata.imageUrl, isHtml: false })}
                                    >
                                        <img src={block.metadata.imageUrl} className="w-full max-h-[600px] object-contain rounded-[2rem] shadow-2xl border border-white/5" alt={block.label} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                                            <Maximize size={48} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Focused Content Modal */}
            {focusedContent && (
                <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center p-4 sm:p-10 lg:p-20 overflow-y-auto noscrollbar">
                    <button onClick={() => setFocusedContent(null)} className="fixed top-4 left-4 sm:top-6 sm:left-6 text-white bg-white/10 p-3 sm:p-4 rounded-full hover:bg-white/20 transition-all z-[1100]">
                        <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
                    </button>


                    <div className="max-w-6xl w-full mx-auto space-y-6 sm:space-y-10 mt-12 sm:mt-0">
                        <div className="text-center space-y-3 sm:space-y-4">
                            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black text-[#D4AF37] uppercase px-4">{focusedContent.title}</h2>
                            {focusedContent.subtitle && <p className="text-lg sm:text-2xl text-gray-400 italic">Par {focusedContent.subtitle}</p>}
                            <div className="w-16 sm:w-32 h-0.5 sm:h-1 bg-[#D4AF37] mx-auto opacity-50"></div>
                        </div>


                        {focusedContent.isHtml ? (
                            <div className="prose prose-invert max-w-none pb-40" dangerouslySetInnerHTML={{ __html: focusedContent.content }} />
                        ) : (
                            <div className="text-center text-3xl sm:text-5xl leading-tight whitespace-pre-wrap text-emerald-50 pb-40">
                                {focusedContent.content}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProjection;
