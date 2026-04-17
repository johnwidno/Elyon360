import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Search as SearchIcon, ChevronLeft, ChevronRight, ChevronUp, Layers, 
    PenTool, Clock, Monitor, Maximize, Play, Pause, Image as ImageIcon, 
    ZoomIn, ZoomOut, Video, Music, Book, Heart, Speaker, Mic, LayoutTemplate, 
    Users, Speaker as SpeakerIcon, BookOpen, Share2, Layers as LayersIcon,
    ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import worshipService from '../../../api/worshipService';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';

// --- Helpers Ported Literally from WorshipBuilder ---

const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl.replace('/api', '')}${url}`;
};

const toRoman = (num) => {
    const map = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let result = '';
    for (const key in map) {
        while (num >= map[key]) {
            result += key;
            num -= map[key];
        }
    }
    return result;
};

const parseSermonToSlides = (html) => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const slides = [];
    let id = 0;

    const processNode = (node) => {
        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();

        if (tag === 'img') {
            slides.push({ id: id++, type: 'image', src: node.getAttribute('src'), alt: node.getAttribute('alt') || '' });
            return;
        }

        if (tag === 'ul') {
            node.querySelectorAll('li').forEach(li => {
                const t = li.textContent.trim();
                if (!t && li.querySelector('img')) {
                    const img = li.querySelector('img');
                    slides.push({ id: id++, type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' });
                } else if (t) {
                    slides.push({ id: id++, type: 'bullet', text: t, html: li.innerHTML });
                }
            });
            return;
        }
        if (tag === 'ol') {
            node.querySelectorAll('li').forEach((li, i) => {
                const t = li.textContent.trim();
                if (t) slides.push({ id: id++, type: 'numbered', text: t, number: i + 1, html: li.innerHTML });
            });
            return;
        }

        if (['h1', 'h2', 'h3', 'h4', 'blockquote', 'p'].includes(tag)) {
            const text = node.textContent.trim();
            const html = node.innerHTML;
            if (text) {
                if (tag === 'h1') slides.push({ id: id++, type: 'h1', text, html });
                else if (tag === 'h2') slides.push({ id: id++, type: 'h2', text, html });
                else if (tag === 'h3' || tag === 'h4') slides.push({ id: id++, type: 'h3', text, html });
                else if (tag === 'blockquote') slides.push({ id: id++, type: 'blockquote', text, html });
                else if (tag === 'p') slides.push({ id: id++, type: 'paragraph', text, html });
            }
            node.querySelectorAll('img').forEach(img => {
                slides.push({ id: id++, type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' });
            });
            return;
        }

        node.childNodes.forEach(processNode);
    };

    doc.body.childNodes.forEach(processNode);
    return slides;
};

const parseVersesToSlides = (text) => {
    if (!text) return [];
    return text.split('\n').filter(l => l.trim()).map((t, i) => ({ id: i, text: t.trim() }));
};

const parseLyricsToSlides = (lyrics) => {
    if (!lyrics) return [];
    return lyrics.split(/\n\n+/).filter(s => s.trim()).map((s, i) => ({ id: i, text: s.trim() }));
};

const PublicProjection = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [service, setService] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [churchData, setChurchData] = useState(null);

    // --- STATES SYNCHRONIZED FROM WORSHIPBUILDER ---
    const [currentSlideIndex, setCurrentSlideIndex] = useState(-1);
    const [focusedContent, setFocusedContent] = useState(null);
    const [projectionBackground, setProjectionBackground] = useState({ id: 'mountain', label: 'Sommet', type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' });
    const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.85);
    const [showBgSelector, setShowBgSelector] = useState(false);
    const [showClock, setShowClock] = useState(true);
    const [clockScale, setClockScale] = useState(1);
    const [projectionTextColor, setProjectionTextColor] = useState('#FFFFFF');
    const [showTextColorSelector, setShowTextColorSelector] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [autoPlaySpeed, setAutoPlaySpeed] = useState(5000);
    const [isBlackout, setIsBlackout] = useState(false);
    const [globalZoom, setGlobalZoom] = useState(1);
    const [contentZoom, setContentZoom] = useState(1);
    const [zoomedElementId, setZoomedElementId] = useState(null);
    const [sermonSlideIndex, setSermonSlideIndex] = useState(-1);
    const [mediaSlideIndex, setMediaSlideIndex] = useState(0);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [showTransitionDropdown, setShowTransitionDropdown] = useState(false);
    const [activeTransitionType, setActiveTransitionType] = useState('fade');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [blockLayouts, setBlockLayouts] = useState({});
    const [localBackgrounds, setLocalBackgrounds] = useState([]);

    const toolbarTimerRef = useRef(null);
    const autoPlayRef = useRef(null);

    const textColorPresets = ['#FFFFFF', '#000000', '#D4AF37', '#34D399', '#3B82F6', '#EF4444', '#A855F7', '#FFD700', '#F97316'];
    const bgTemplates = [
        { id: 'none', label: 'Noir', type: 'color', css: '#000000' },
        { id: 'midnight', label: 'Minuit', type: 'color', css: 'linear-gradient(135deg, #0B0B15 0%, #1A1A2E 100%)' },
        { id: 'celestial', label: 'Céleste', type: 'image', value: 'https://images.unsplash.com/photo-1506318137071-a8e063b4fe09?q=80&w=2070&auto=format&fit=crop' },
        { id: 'nature', label: 'Forêt', type: 'image', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' },
        { id: 'ocean', label: 'Océan', type: 'image', value: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4?q=80&w=2000&auto=format&fit=crop' },
        { id: 'mountain', label: 'Sommet', type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' },
    ];

    // --- AUTO-HIDE TOOLBAR LOGIC ---
    useEffect(() => {
        const resetTimer = () => {
            setIsToolbarVisible(true);
            if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
            toolbarTimerRef.current = setTimeout(() => {
                if (!showBgSelector && !showTransitionDropdown && !showTextColorSelector) {
                    setIsToolbarVisible(false);
                }
            }, 3000);
        };
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        resetTimer();
        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
        };
    }, [showBgSelector, showTransitionDropdown, showTextColorSelector]);

    // --- AUTOPLAY TIMER LOGIC PORTED FROM BUILDER ---
    useEffect(() => {
        if (isAutoPlaying) {
            autoPlayRef.current = setInterval(() => {
                setCurrentSlideIndex(prev => (prev + 1) % blocks.length);
            }, autoPlaySpeed);
        } else {
            clearInterval(autoPlayRef.current);
        }
        return () => clearInterval(autoPlayRef.current);
    }, [isAutoPlaying, blocks.length, autoPlaySpeed]);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [serviceRes, churchRes] = await Promise.all([
                    worshipService.getPublicServiceById(id),
                    api.get('/churches/settings').catch(() => ({ data: {} }))
                ]);
                setService(serviceRes.data);
                setBlocks((serviceRes.data.blocks || []).sort((a, b) => a.orderIndex - b.orderIndex));
                if (churchRes.data?.church) {
                    setChurchData(churchRes.data.church);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching public projection:", error);
                setLoading(false);
            }
        };
        fetchData();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [id]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') setCurrentSlideIndex(prev => Math.min(prev + 1, blocks.length - 1));
            if (e.key === 'ArrowLeft') setCurrentSlideIndex(prev => Math.max(prev - 1, -1));
            if (e.key === 'Escape') { setFocusedContent(null); setZoomedElementId(null); }
            if (e.key === 'b' || e.key === 'B') setIsBlackout(prev => !prev);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [blocks.length, focusedContent]);

    const handleUpdateLayout = (blockId, layout) => {
        setBlockLayouts(prev => ({ ...prev, [blockId]: { ...(prev[blockId] || {}), ...layout } }));
    };

    const sortedBlocks = useMemo(() => {
        return [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
    }, [blocks]);

    const transitionVariants = {
        fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
        slide: { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: '-100%', opacity: 0 }, transition: { type: 'spring', damping: 25, stiffness: 120 } },
        zoom: { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
        none: { initial: {}, animate: {}, exit: {} }
    };

    const currentVariant = transitionVariants[activeTransitionType] || transitionVariants.fade;

    // --- DERIVED SHARED METADATA ---
    const currentActiveBlock = sortedBlocks[currentSlideIndex];
    const currentResponsable = useMemo(() => {
        const b = focusedContent || currentActiveBlock;
        if (!b) return null;
        
        // Priority 1: Direct responsable in block metadata
        if (b.metadata?.responsable) return b.metadata.responsable;

        // Priority 2: Extract from specific metadata structures
        const passages = b.metadata?.passages;
        if (passages && passages.length > 0 && passages[0].responsable) return passages[0].responsable;

        const songs = b.metadata?.songs;
        if (songs && songs.length > 0) {
            const songResp = songs.find(s => s.responsable)?.responsable;
            if (songResp) return songResp;
        }

        const contents = b.metadata?.contents;
        if (contents && contents.length > 0) {
            const contentResp = contents.find(c => c.responsable)?.responsable;
            if (contentResp) return contentResp;
        }

        return null;
    }, [focusedContent, currentActiveBlock]);

    if (loading) return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
        </div>
    );

    // --- RENDER HELPERS ---
    const renderSermonSlide = (slide, isZoomed) => {
        if (!slide) return null;
        const baseText = slide.text;
        if (slide.type === 'image') return <img src={getMediaUrl(slide.src)} className={`max-h-[80vh] object-contain rounded-3xl shadow-2xl transition-all duration-500 ${isZoomed ? 'scale-110' : 'scale-90'}`} />;
        
        const styles = {
            h1: { fontSize: isZoomed ? 'clamp(4rem, 15vw, 10rem)' : 'clamp(2.5rem, 10vw, 8rem)', color: projectionTextColor },
            h2: { fontSize: isZoomed ? 'clamp(3.5rem, 12vw, 8rem)' : 'clamp(2.2rem, 8vw, 6rem)', color: projectionTextColor },
            h3: { fontSize: isZoomed ? 'clamp(3rem, 10vw, 7rem)' : 'clamp(1.8rem, 6vw, 5rem)', color: projectionTextColor },
            p: { fontSize: (isZoomed ? 'clamp(2rem, 8vw, 6rem)' : 'clamp(1.2rem, 4.5vw, 4rem)'), color: projectionTextColor },
            bullet: { fontSize: (isZoomed ? 'clamp(2rem, 8vw, 6rem)' : 'clamp(1.2rem, 4.5vw, 4rem)'), color: projectionTextColor }
        };

        if (slide.type === 'h1') return <h1 className="font-black drop-shadow-2xl uppercase tracking-tighter leading-none text-center w-full px-4" style={styles.h1} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />;
        if (slide.type === 'h2') return <h2 className="font-black drop-shadow-2xl tracking-tight leading-tight text-center w-full px-4" style={styles.h2} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />;
        if (slide.type === 'h3') return <h3 className="font-bold tracking-wide italic text-center w-full px-4" style={styles.h3} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />;
        if (slide.type === 'bullet') return (
            <div className="flex items-start gap-4 sm:gap-10 text-left w-full px-8">
                <div className={`rounded-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)] mt-4 flex-shrink-0 ${isZoomed ? 'w-8 h-8' : 'w-5 h-5'}`} />
                <p className="font-medium leading-relaxed" style={styles.p} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
            </div>
        );
        return <p className="font-medium leading-relaxed w-full px-4 text-center" style={styles.p} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />;
    };

    const renderResponsableHeader = (resp) => {
        if (!resp) return null;
        return (
            <div className="flex items-center justify-center gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700 w-full">
                <div className="h-px w-12 sm:w-24 bg-[#D4AF37]/30 flex-shrink-0" />
                <p className="font-black uppercase tracking-[0.4em] whitespace-nowrap text-center drop-shadow-lg" style={{ fontSize: 'clamp(1.2rem, 4.5vw, 3.2rem)', color: '#D4AF37' }}>{resp}</p>
                <div className="h-px w-12 sm:w-24 bg-[#D4AF37]/30 flex-shrink-0" />
            </div>
        );
    };

    return (
        <div 
            id="cinematic-projection-engine"
            className={`fixed inset-0 z-[5000] flex flex-col font-serif select-none noscrollbar bg-black transition-opacity duration-1000 ${isBlackout ? 'opacity-0' : 'opacity-100'}`}
            onClick={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                setShowBgSelector(false);
                setShowTransitionDropdown(false);
                setShowTextColorSelector(false);
            }}
        >
            {/* 1. Real-time Clock */}
            {showClock && (
                <Rnd
                    size={{ width: 'auto', height: 'auto' }}
                    position={blockLayouts['clock']?.position || { x: 48, y: 32 }}
                    onDragStop={(e, d) => handleUpdateLayout('clock', { position: { x: d.x, y: d.y } })}
                    className="z-[6000] opacity-50 hover:opacity-100 transition-opacity cursor-move group/clock"
                >
                    <div className="flex flex-row items-center gap-3" onPointerDown={(e) => e.stopPropagation()}>
                        <button onClick={(e) => { e.stopPropagation(); setClockScale(p => Math.max(0.5, p - 0.2)); }} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/40 flex items-center justify-center text-white text-base font-black opacity-0 group-hover/clock:opacity-100 transition-all flex-shrink-0">−</button>
                        <span className="font-black text-white tracking-widest leading-none font-sans whitespace-nowrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]" style={{ fontSize: `clamp(0.8rem, 6vw, ${Math.round(2 * clockScale)}rem)`, color: projectionTextColor }}>
                            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setClockScale(p => Math.min(6, p + 0.2)); }} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/40 flex items-center justify-center text-white text-base font-black opacity-0 group-hover/clock:opacity-100 transition-all flex-shrink-0">+</button>
                    </div>
                </Rnd>
            )}

            {/* 2. Background Layer */}
            <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{
                    ...(projectionBackground.type === 'image' 
                        ? { backgroundImage: `url("${projectionBackground.value}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: isBlackout ? '#000' : (projectionBackground.css || '#000') }
                    ),
                    opacity: isBlackout ? 0 : 1
                }}
            />
            <div className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300" style={{ opacity: isBlackout ? 1 : (1 - bgOverlayOpacity) }} />

            {/* 3. Main Content Layer — 3-Tier Centered Architecture */}
            <div className="relative h-full w-full flex flex-col items-center justify-between" style={{ transform: `scale(${globalZoom})`, transformOrigin: 'center center' }}>
                <AnimatePresence mode="wait">
                    {focusedContent ? (
                        <motion.div key="focus-mode" className="w-full h-full flex flex-col bg-transparent z-[8000] overflow-hidden" onDoubleClick={() => setFocusedContent(null)}>
                            {/* Focus Header (Compact) */}
                            <div className="w-full pt-2 sm:pt-4 pb-2 flex flex-col items-center flex-shrink-0 border-b border-white/5 bg-[#0B1120]/95 backdrop-blur-3xl relative z-50 shadow-2xl">
                                <div className="font-black text-lg sm:text-2xl tracking-[0.4em] uppercase text-center flex flex-col items-center gap-1" style={{ color: projectionTextColor }}>
                                    <span className="opacity-40 text-[10px] sm:text-xs tracking-[0.8em]" style={{ color: projectionTextColor }}>{toRoman(blocks.indexOf(focusedContent) + 1)}</span>
                                    {t(focusedContent.label, focusedContent.label)}
                                    {currentResponsable && <span className="text-[12px] sm:text-sm text-[#D4AF37] font-bold opacity-90 mt-1 tracking-[0.2em]">{currentResponsable}</span>}
                                </div>
                                <div className="w-12 sm:w-24 h-0.5 sm:h-1 bg-[#D4AF37] mt-2 rounded-full opacity-60" />
                                <button onClick={(e) => { e.stopPropagation(); setFocusedContent(null); setZoomedElementId(null); }} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                            </div>

                            {/* Focus Middle (Centered Content) */}
                            <div className="flex-1 w-full flex items-center justify-center px-6 sm:px-12 pt-6 sm:pt-12 overflow-y-auto noscrollbar" onWheel={(e) => { if(Math.abs(e.deltaY) > 80) e.deltaY > 0 ? setMediaSlideIndex(p => p + 1) : setMediaSlideIndex(p => Math.max(0, p - 1)) }}>
                                <AnimatePresence mode="wait">
                                    {(() => {
                                        // UNIVERSAL FOCUS LOGIC: Calculate slides for ANY block type
                                        let allSlides = [];
                                        if (focusedContent.type === 'reading') {
                                            allSlides = (focusedContent.metadata?.passages || []).flatMap(p => parseVersesToSlides(p.text).map(v => ({...v, type: 'verse', reference: p.reference})));
                                        } else if (focusedContent.type === 'song') {
                                            allSlides = (focusedContent.metadata?.songs || []).flatMap((s, sIdx) => parseLyricsToSlides(s.lyrics).map(l => ({...l, type: 'lyric', songTitle: s.title, songIndex: sIdx})));
                                        } else if (focusedContent.type === 'sermon') {
                                            allSlides = parseSermonToSlides(service?.sermon?.content);
                                        } else if (focusedContent.metadata?.contents && focusedContent.metadata.contents.length > 0) {
                                            allSlides = focusedContent.metadata.contents.map(c => ({...c, type: c.type || 'text'}));
                                        } else if (focusedContent.type === 'image' || focusedContent.type === 'video') {
                                            allSlides = [{ type: focusedContent.type, url: focusedContent.metadata?.url }];
                                        } else {
                                            // Fallback: Label itself as a slide
                                            allSlides = [{ type: 'text', content: focusedContent.label }];
                                        }

                                        // Constrain index
                                        const safeIndex = Math.min(mediaSlideIndex, allSlides.length - 1);
                                        const slide = allSlides[safeIndex];
                                        const nextSlide = allSlides[safeIndex + 1];
                                        const prevSlide = allSlides[safeIndex - 1];

                                        const nextLabel = focusedContent.type === 'song' ? (nextSlide?.songIndex !== slide?.songIndex ? `Suivant : ${nextSlide?.songTitle}` : 'Couplet Suivant') : (nextSlide ? 'Suivant' : 'Fin');
                                        const prevLabel = focusedContent.type === 'song' ? (prevSlide?.songIndex !== slide?.songIndex ? `Précédent : ${prevSlide?.songTitle}` : 'Couplet Précédent') : (prevSlide ? 'Précédent' : 'Début');

                                        return (
                                            <>
                                                <motion.div 
                                                    key={`${focusedContent.id}-${safeIndex}`} 
                                                    initial={{ opacity: 0, scale: 0.95 }} 
                                                    animate={{ opacity: 1, scale: contentZoom }} 
                                                    exit={{ opacity: 0, scale: 1.05 }} 
                                                    className="w-full flex items-center justify-center p-4 sm:p-8"
                                                >
                                                    {/* Render based on slide type */}
                                                    {(!slide || slide.type === 'text' || slide.type === 'paragraph' || slide.type === 'verse' || slide.type === 'lyric') && (
                                                        <div className="text-center w-full max-w-6xl">
                                                            <p className="text-gray-100 font-medium leading-[1.5] whitespace-pre-wrap" style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(1.2rem, 5vw, 6.5rem)', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
                                                                {slide?.text || slide?.content || slide?.title || ''}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {(slide?.type === 'image' || slide?.type === 'video') && (
                                                        <div className="relative">
                                                            {slide.type === 'image' ? (
                                                                <img src={getMediaUrl(slide.url || slide.src)} className="max-h-[80vh] object-contain rounded-[2.5rem] shadow-4xl" />
                                                            ) : (
                                                                <video src={getMediaUrl(slide.url || slide.src)} muted autoPlay loop className="max-h-[80vh] object-contain rounded-[2.5rem] shadow-4xl" />
                                                            )}
                                                        </div>
                                                    )}

                                                    {(slide?.type === 'h1' || slide?.type === 'h2' || slide?.type === 'h3' || slide?.type === 'bullet') && renderSermonSlide(slide, true)}
                                                </motion.div>

                                                {/* Focus Footer (Taskbar) */}
                                                <div className="fixed bottom-0 left-0 right-0 h-[6vh] min-h-[50px] w-full bg-black/95 backdrop-blur-xl border-t border-white/5 z-50 flex items-center justify-between px-4 sm:px-8">
                                                    <button onClick={(e) => { e.stopPropagation(); setMediaSlideIndex(p => Math.max(0, p - 1)); }} className={`text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest flex items-center gap-2 sm:gap-3 transition-all ${safeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}><ChevronLeft size={18} /> <span className="hidden sm:inline">{prevLabel}</span></button>
                                                    
                                                    <div className="flex items-center gap-4 sm:gap-8 overflow-hidden px-2">
                                                        {currentResponsable && (
                                                            <div className="hidden sm:flex items-center gap-3 px-4 sm:px-6 border-r border-white/10 shrink-0">
                                                                <Users size={14} className="text-[#D4AF37]" />
                                                                <span className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">{currentResponsable}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-3 sm:px-5 py-2 rounded-full border border-white/10">
                                                            <button onClick={(e) => { e.stopPropagation(); setContentZoom(p => Math.max(0.2, p - 0.1)); }} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-white/10 hover:bg-white/30 rounded-full text-white font-bold transition-all text-sm">-</button>
                                                            <SearchIcon size={12} className="text-white/30" />
                                                            <button onClick={(e) => { e.stopPropagation(); setContentZoom(p => Math.min(4, p + 0.1)); }} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-white/10 hover:bg-white/30 rounded-full text-white font-bold transition-all text-sm">+</button>
                                                        </div>

                                                        <div className="text-lg sm:text-2xl font-black tabular-nums tracking-widest" style={{ color: projectionTextColor, opacity: 0.6 }}>
                                                            {safeIndex + 1} <span className="text-sm opacity-50 px-1">/</span> {allSlides.length}
                                                        </div>
                                                    </div>

                                                    <button onClick={(e) => { e.stopPropagation(); setMediaSlideIndex(p => Math.min(allSlides.length - 1, p + 1)); }} className={`text-[#D4AF37] hover:text-[#D4AF37]/80 uppercase font-black text-[10px] tracking-widest flex items-center gap-2 sm:gap-3 transition-all ${safeIndex === allSlides.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}><span className="hidden sm:inline">{nextLabel}</span> <ChevronRight size={18} /></button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ) : currentSlideIndex === -1 ? (
                        <motion.div key="intro-view" {...currentVariant} className="w-full h-full flex flex-col items-center justify-center text-center space-y-8 sm:space-y-12 px-6">
                            {churchData?.logoUrl && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }} 
                                    className="w-24 h-24 sm:w-56 sm:h-56 mb-4 sm:mb-8 rounded-full border-4 border-white/5 p-4 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl flex items-center justify-center overflow-hidden"
                                >
                                    <img 
                                        src={getMediaUrl(churchData.logoUrl)} 
                                        className="w-full h-full object-contain" 
                                        alt="Logo Église" 
                                    />
                                </motion.div>
                            )}
                            <h1 className="font-black uppercase tracking-tighter drop-shadow-[0_20px_80px_rgba(0,0,0,0.9)] leading-none" style={{ fontSize: 'clamp(1.5rem, 6vw, 7rem)', color: projectionTextColor }}>{service?.theme || t('worship_program', 'Programme du Culte')}</h1>
                            <div className="w-24 sm:w-64 h-1.5 sm:h-2 bg-[#D4AF37] rounded-full shadow-[0_0_60px_rgba(212,175,55,0.8)]" />
                            <p className="font-bold uppercase tracking-[0.4em] opacity-60" style={{ fontSize: 'clamp(0.8rem, 2vw, 2rem)', color: projectionTextColor }}>{service?.date && new Date(service.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </motion.div>
                    ) : (
                        <motion.div key={`slide-${currentSlideIndex}`} {...currentVariant} className="w-full h-full flex flex-col justify-between overflow-hidden">
                            {/* Slide Header — PORTED FROM BUILDER */}
                            <div className="w-full pt-6 sm:pt-12 pb-4 sm:pb-6 flex flex-col items-center flex-shrink-0 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-md">
                                <div className="font-black text-lg sm:text-3xl tracking-[0.4em] uppercase text-center flex flex-col items-center gap-1 sm:gap-2" style={{ color: projectionTextColor }}>
                                    <span className="opacity-40 text-[10px] sm:text-sm tracking-[0.8em]" style={{ color: projectionTextColor }}>{toRoman(currentSlideIndex + 1)}</span>
                                    <span className="px-4">{t(currentActiveBlock?.label, currentActiveBlock?.label)}</span>
                                    {currentResponsable && <span className="text-[10px] sm:text-xs text-[#D4AF37] opacity-80 mt-1 tracking-widest whitespace-nowrap px-4 truncate max-w-xs">{currentResponsable}</span>}
                                </div>
                                <div className="w-12 sm:w-24 h-0.5 sm:h-1 bg-[#D4AF37] mt-3 sm:mt-4 rounded-full opacity-60" />
                            </div>

                            {/* Slide Middle (Centered Content) — Universal Click Focus */}
                            <div className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-12 text-center overflow-y-auto noscrollbar" onClick={(e) => { e.stopPropagation(); setFocusedContent(sortedBlocks[currentSlideIndex]); setMediaSlideIndex(0); setSermonSlideIndex(-1); }}>
                                {(() => {
                                    const block = sortedBlocks[currentSlideIndex];
                                    if (!block) return null;
                                    return (
                                        <div className="w-full flex flex-col items-center gap-4 sm:gap-10 cursor-pointer hover:scale-[1.01] transition-all">
                                            
                                            {/* CENTRALIZED RESPONSABLE HEADER */}
                                            {renderResponsableHeader(currentResponsable)}

                                            {/* --- SYNCED CONTENT ENGINE --- */}
                                            
                                            {/* 1. BIBLE: Ref */}
                                            {block.type === 'reading' && (block.metadata?.passages || []).map((pass, pi) => (
                                                <div key={`bible-${pi}`} className="text-center space-y-4 sm:space-y-10 animate-in fade-in duration-700 w-full px-4">
                                                    <h3 className="font-black drop-shadow-[0_10px_60px_rgba(52,211,153,0.35)] tracking-tighter" style={{ fontSize: 'clamp(2rem, 10vw, 9rem)', color: projectionTextColor }}>{pass.reference}</h3>
                                                    <p className="uppercase tracking-[0.3em] sm:tracking-[0.5em] font-bold opacity-15" style={{ fontSize: 'clamp(0.4rem, 1vw, 0.75rem)', color: projectionTextColor }}>Toucher pour lire le texte</p>
                                                </div>
                                            ))}

                                            {/* 2. SONGS: List (Structure-first rendering) */}
                                            {block.metadata?.songs && block.metadata.songs.length > 0 && (
                                                <div className="w-full space-y-0 animate-in fade-in duration-700 max-h-[50vh] sm:max-h-[58vh] overflow-y-auto noscrollbar px-4">
                                                    {block.metadata.songs.map((song, si) => (
                                                        <div key={`song-${si}`}>
                                                            <div className="py-4 sm:py-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all text-center">
                                                                <p className="font-bold drop-shadow-xl" style={{ fontSize: 'clamp(0.9rem, 3vw, 2.8rem)', letterSpacing: '0.02em', color: projectionTextColor }}>
                                                                    {[song.number, song.collection, song.title].filter(Boolean).join(' · ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 3. ANNOUNCEMENTS / OFFERING: Multi-content List */}
                                            {(block.type === 'announcement' || block.type === 'offering' || block.metadata?.contents) && block.metadata?.contents && block.metadata.contents.length > 0 && (
                                                <div className="w-full space-y-0 animate-in fade-in duration-700 max-h-[55vh] sm:max-h-[65vh] overflow-y-auto noscrollbar px-4">
                                                    {block.metadata.contents.map((item, ai) => (
                                                        <div key={`ann-${ai}`}>
                                                            <div className="py-4 sm:py-6 border-b border-white/5 last:border-0 text-center flex flex-col items-center gap-2 sm:gap-3">
                                                                <p className="font-bold drop-shadow-xl" style={{ fontSize: 'clamp(0.9rem, 3vw, 2.8rem)', letterSpacing: '0.02em', color: projectionTextColor }}>{item.content || item.title}</p>
                                                                {item.description && <p className="italic opacity-70" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.8rem)', color: projectionTextColor }}>{item.description}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 4. GENERAL CONTENT (Image, Video, Text, Prayer, etc.) */}
                                            {block.type !== 'announcement' && block.type !== 'offering' && block.type !== 'song' && block.type !== 'reading' && block.type !== 'sermon' && (
                                                <div className="w-full flex flex-col items-center px-4">
                                                    {(block.metadata?.contents || []).map((item, ci) => (
                                                        <div key={`gen-${ci}`} className="w-full flex flex-col items-center gap-4 sm:gap-6 mt-4 first:mt-0 animate-in zoom-in duration-1000">
                                                            {((item.type === 'image' || item.type === 'video') && item.url) ? (
                                                                <div className="relative">
                                                                    {item.type === 'image' ? (
                                                                        <img src={getMediaUrl(item.url)} className="max-h-[50vh] sm:max-h-[60vh] object-contain rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]" />
                                                                    ) : (
                                                                        <video src={getMediaUrl(item.url)} muted autoPlay loop className="max-h-[50vh] sm:max-h-[60vh] object-contain rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]" />
                                                                    )}
                                                                </div>
                                                            ) : (item.content || item.title) && (
                                                                <div className="space-y-2 sm:space-y-4 text-center">
                                                                    <p className="font-black leading-tight" style={{ fontSize: 'clamp(1.25rem, 6vw, 7.5rem)', color: projectionTextColor }}>{item.content || item.title}</p>
                                                                    {item.description && <p className="font-medium italic opacity-75" style={{ fontSize: 'clamp(0.9rem, 2vw, 2.5rem)', color: projectionTextColor }}>{item.description}</p>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* 5. STANDALONE MEDIA FALLBACK */}
                                            {(block.type === 'image' || block.type === 'video') && block.metadata?.url && (
                                                <div className="w-full flex flex-col items-center mt-2 sm:mt-4 animate-in zoom-in duration-1000 px-4">
                                                    {block.type === 'image' ? (
                                                        <img src={getMediaUrl(block.metadata.url)} className="max-h-[50vh] sm:max-h-[60vh] object-contain rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]" />
                                                    ) : (
                                                        <video src={block.metadata.url.startsWith('blob') ? block.metadata.url : getMediaUrl(block.metadata.url)} muted autoPlay loop className="max-h-[50vh] sm:max-h-[60vh] object-contain rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]" />
                                                    )}
                                                </div>
                                            )}

                                            {/* 6. SERMON (Message) Overview */}
                                            {block.type === 'sermon' && (
                                                <div className="space-y-6 sm:space-y-12 animate-in slide-in-from-bottom duration-1000 text-center w-full px-4">
                                                    <h3 className="font-black uppercase tracking-tighter" style={{ fontSize: 'clamp(1.5rem, 8vw, 9rem)', color: projectionTextColor }}>Message de la parole</h3>
                                                    <div className="w-16 sm:w-48 h-1 sm:h-2 bg-[#D4AF37] mx-auto rounded-full opacity-40 shadow-[0_0_30px_rgba(212,175,55,0.5)]" />
                                                    {service?.sermon?.title && (
                                                        <p className="font-bold italic" style={{ fontSize: 'clamp(1.1rem, 3vw, 3.5rem)', color: projectionTextColor }}>{service.sermon.title}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Slide Footer (Branding Layer) */}
                            <div className="h-[8vh] sm:h-[15vh] w-full" />
                            <div className="fixed bottom-0 left-0 right-0 h-[4vh] min-h-[40px] w-full bg-black/95 border-t border-white/5 flex items-center justify-between px-6 sm:px-8 z-50">
                                <span className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] sm:tracking-[0.6em] truncate pr-4">ELYON 360</span>
                                {currentResponsable && (
                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                        <div className="h-3 w-px bg-white/10" />
                                        <span className="text-[8px] sm:text-[10px] font-black text-[#D4AF37] uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">{currentResponsable}</span>
                                    </div>
                                )}
                                <span className="text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.4em] sm:tracking-[0.6em] text-right truncate pl-4">PROJECTION ENGINE</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. PORTED PROFESSIONAL TOOLBAR — Adjusted for ALL devices including Mobile */}
            {!focusedContent && (
                <div className={`fixed bottom-4 sm:bottom-6 inset-x-0 z-[9000] flex flex-col items-center gap-4 sm:gap-6 pointer-events-none transition-all duration-700 mx-2 sm:mx-0 ${isToolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                    <AnimatePresence>
                        {showBgSelector && (
                            <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="pointer-events-auto absolute bottom-full mb-4 sm:mb-6 right-0 sm:right-12 bg-black/90 backdrop-blur-3xl p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 w-[240px] sm:w-[280px] shadow-4xl max-h-[60vh] sm:max-h-[70vh] overflow-y-auto noscrollbar">
                                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="flex items-center justify-between bg-white/5 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/10">
                                        <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase mr-2 truncate">Opacité</span>
                                        <input type="range" min="0" max="0.95" step="0.05" value={bgOverlayOpacity} onChange={e => setBgOverlayOpacity(parseFloat(e.target.value))} className="w-full h-1.5 accent-[#D4AF37]" />
                                    </div>
                                    <div className="px-1">
                                        <input type="file" accept="image/*" id="local-bg-upload" className="hidden" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const objectUrl = URL.createObjectURL(file);
                                                const newBg = { id: 'local_' + Date.now(), label: 'Tél. ' + (localBackgrounds.length + 1), type: 'image', value: objectUrl };
                                                setLocalBackgrounds(prev => [newBg, ...prev]);
                                                setProjectionBackground(newBg);
                                                toast.success("Image importée");
                                            }
                                        }} />
                                        <label htmlFor="local-bg-upload" className="w-full flex items-center justify-center gap-2 py-2 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl cursor-pointer transition-colors">
                                            <ImageIcon size={12} className="text-[#D4AF37]" />
                                            <span className="text-[8px] sm:text-[9px] text-gray-300 font-bold uppercase tracking-widest">Image locale</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 px-1 pb-4">
                                    {[...localBackgrounds, ...bgTemplates].map(bg => (
                                        <button key={bg.id} onClick={(e) => { e.stopPropagation(); setProjectionBackground(bg); setShowBgSelector(false); }} className={`group relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 ${projectionBackground.id === bg.id ? 'border-[#D4AF37] scale-105 z-10 shadow-2xl' : 'border-white/10 hover:border-white/30'}`}>
                                            {bg.type === 'image' ? <img src={bg.value} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: bg.css }} />}
                                            <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[7px] sm:text-[8px] font-black text-white uppercase text-center truncate">{bg.label}</p>
                                            </div>
                                            {projectionBackground.id === bg.id && <div className="absolute top-1 right-1 w-3 h-3 sm:w-4 sm:h-4 bg-[#D4AF37] rounded-full flex items-center justify-center text-[7px] sm:text-[8px] text-black font-black">✓</div>}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {showTransitionDropdown && (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="pointer-events-auto absolute bottom-full mb-3 sm:mb-4 left-0 sm:left-auto bg-zinc-900 border border-white/10 p-2 rounded-xl sm:rounded-2xl shadow-2xl min-w-[130px] sm:min-w-[150px] z-[8000]">
                                {[
                                    { id: 'fade', icon: <Layers size={14} />, label: 'Fondu' },
                                    { id: 'slide', icon: <ChevronRight size={14} />, label: 'Glisser' },
                                    { id: 'zoom', icon: <Maximize size={14} />, label: 'Zoom' },
                                    { id: 'none', icon: <X size={14} />, label: 'Aucun' }
                                ].map(t => (
                                    <button key={t.id} onClick={() => { setActiveTransitionType(t.id); setShowTransitionDropdown(false); }} className={`w-full flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold transition-all ${activeTransitionType === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                        <span className="flex items-center gap-2 sm:gap-3 shrink-0">{t.icon} <span className="truncate">{t.label}</span></span>
                                        {activeTransitionType === t.id && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full shrink-0 ml-2" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                        {showTextColorSelector && (
                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="pointer-events-auto absolute bottom-full mb-3 sm:mb-4 left-0 sm:left-6 bg-zinc-900 border border-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-2xl min-w-[150px] sm:min-w-[180px] z-[8000]">
                                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                    {textColorPresets.map(color => (
                                        <button key={color} onClick={() => { setProjectionTextColor(color); setShowTextColorSelector(false); }} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/20 transition-transform hover:scale-125 ${projectionTextColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : ''}`} style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pointer-events-auto flex flex-nowrap items-center gap-1 p-1.5 sm:p-2 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-full shadow-4xl overflow-x-auto noscrollbar max-w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 px-2 sm:px-3 border-r border-white/10 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setShowTransitionDropdown(!showTransitionDropdown); }} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[9px] sm:text-[10px] font-black uppercase text-white transition-all border border-white/5">
                                <Layers size={14} className="text-blue-400 shrink-0" />
                                <span className="max-w-[40px] truncate">{activeTransitionType}</span>
                                <ChevronUp size={10} className={`ml-1 shrink-0 transition-transform ${showTransitionDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowTextColorSelector(!showTextColorSelector); }} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[9px] sm:text-[10px] font-black uppercase text-white transition-all border border-white/5">
                                <PenTool size={14} className="shrink-0" style={{ color: projectionTextColor }} />
                                <span className="hidden sm:inline">Texte</span>
                                <ChevronUp size={10} className={`ml-1 shrink-0 transition-transform ${showTextColorSelector ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 border-r border-white/10 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(prev => Math.max(prev - 1, -1)); }} className="p-1.5 sm:p-2.5 bg-white/5 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                            <div className="flex flex-col items-center min-w-[2.5rem] sm:min-w-[3rem]">
                                <span className="text-[#D4AF37] font-black text-lg sm:text-xl leading-none">{currentSlideIndex === -1 ? '00' : (currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[7px] sm:text-[8px] text-zinc-500 font-black uppercase mt-0.5 tracking-widest hidden sm:inline text-center leading-none">Séquence</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(prev => Math.min(prev + 1, blocks.length - 1)); }} className="p-1.5 sm:p-2.5 bg-[#D4AF37] hover:bg-[#B8962E] rounded-lg sm:rounded-xl text-white shadow-lg transition-all"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-3 border-r border-white/10 px-3 sm:px-6 text-white shrink-0 min-w-0">
                            <button onClick={() => setGlobalZoom(prev => Math.max(0.2, prev - 0.1))} className="p-1 sm:p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all shrink-0"><ZoomOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                            <span className="text-[10px] sm:text-[12px] font-black tabular-nums min-w-[25px] sm:min-w-[35px] text-center">{Math.round(globalZoom * 100)}%</span>
                            <button onClick={() => setGlobalZoom(prev => Math.min(4, prev + 0.1))} className="p-1 sm:p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all shrink-0"><ZoomIn className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 border-r border-white/10 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); }} className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isAutoPlaying ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                                {isAutoPlaying ? <Pause className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Play className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowClock(!showClock); }} className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${showClock ? 'bg-[#D4AF37] text-white' : 'bg-white/5 text-gray-400'}`}><Clock className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setShowBgSelector(!showBgSelector); }} className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${showBgSelector ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}><ImageIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setIsBlackout(!isBlackout); }} className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isBlackout ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}><Monitor className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                        </div>

                        <div className="px-2 sm:px-4 shrink-0">
                            <button onClick={() => { if(window.confirm('Quitter la projection ?')) navigate(-1); }} className="p-2.5 sm:p-3 bg-red-500/80 hover:bg-red-500 rounded-lg sm:rounded-xl text-white shadow-xl transition-all"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .noscrollbar::-webkit-scrollbar { display: none; }
                .noscrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap');
                .font-serif { font-family: 'Playfair Display', serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
                /* Custom range styling */
                input[type=range] { -webkit-appearance: none; background: transparent; }
                input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: #D4AF37; margin-top: -4px; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default PublicProjection;
