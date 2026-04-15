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
        resetTimer();
        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('click', resetTimer);
            if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current);
        };
    }, [showBgSelector, showTransitionDropdown, showTextColorSelector]);

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
            p: { fontSize: isZoomed ? 'clamp(2rem, 8vw, 6rem)' : 'clamp(1.2rem, 4.5vw, 4rem)', color: projectionTextColor },
            bullet: { fontSize: isZoomed ? 'clamp(2rem, 8vw, 6rem)' : 'clamp(1.2rem, 4.5vw, 4rem)', color: projectionTextColor }
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
                        <motion.div key="focus-mode" className="w-full h-full flex flex-col bg-transparent z-[8000] overflow-hidden">
                            {/* Focus Header (4vh) */}
                            <div className="h-[4vh] min-h-[40px] w-full flex items-center justify-center bg-zinc-950/95 border-b border-white/5 z-50 px-6 backdrop-blur-3xl relative flex-shrink-0">
                                <h3 className="text-sm sm:text-base font-bold text-center font-serif italic uppercase truncate max-w-[70%]" style={{ color: projectionTextColor }}>
                                    {focusedContent.type === 'reading' ? (focusedContent.metadata?.passages?.[0]?.reference || 'Lecture') : (focusedContent.type === 'song' ? 'LOUANGE' : (service?.sermon?.title || 'PRÉDICATION'))}
                                </h3>
                                <button onClick={(e) => { e.stopPropagation(); setFocusedContent(null); setZoomedElementId(null); }} className="absolute right-4 p-1 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                            </div>

                            {/* Focus Middle (Centered Content) */}
                            <div className="flex-1 w-full flex items-center justify-center px-12 overflow-y-auto noscrollbar" onWheel={(e) => { if(Math.abs(e.deltaY) > 80) e.deltaY > 0 ? (focusedContent.type === 'sermon' ? setSermonSlideIndex(p => Math.min(parseSermonToSlides(service?.sermon?.content).length - 1, p + 1)) : setMediaSlideIndex(p => p + 1)) : (focusedContent.type === 'sermon' ? setSermonSlideIndex(p => Math.max(-1, p - 1)) : setMediaSlideIndex(p => Math.max(0, p - 1))) }}>
                                <AnimatePresence mode="wait">
                                    {focusedContent.type === 'reading' && (() => {
                                        const slides = (focusedContent.metadata?.passages || []).flatMap(p => parseVersesToSlides(p.text));
                                        const slide = slides[mediaSlideIndex];
                                        return slide && (
                                            <motion.div key={`v-${slide.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1, scale: contentZoom }} exit={{ opacity: 0 }} className="text-center w-full max-w-6xl">
                                                <p className="text-gray-100 font-medium leading-[1.6]" style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(1.5rem, 6vw, 6rem)', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>{slide.text}</p>
                                            </motion.div>
                                        );
                                    })()}
                                    {focusedContent.type === 'song' && (() => {
                                        const slides = (focusedContent.metadata?.songs || []).flatMap(s => parseLyricsToSlides(s.lyrics));
                                        const slide = slides[mediaSlideIndex];
                                        return slide && (
                                            <motion.div key={`s-${slide.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1, scale: contentZoom }} exit={{ opacity: 0 }} className="text-center w-full max-w-6xl">
                                                <p className="text-gray-100 font-medium leading-[1.5] whitespace-pre-wrap" style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(1.5rem, 6vw, 6rem)', textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>{slide.text}</p>
                                            </motion.div>
                                        );
                                    })()}
                                    {focusedContent.type === 'sermon' && (() => {
                                        const sermonSlides = parseSermonToSlides(service?.sermon?.content);
                                        const isOnTitleSlide = sermonSlideIndex === -1;
                                        return (
                                            <motion.div key={isOnTitleSlide ? 'intro' : `slide-${sermonSlideIndex}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0, scale: contentZoom }} exit={{ opacity: 0, x: -50 }} className="w-full flex items-center justify-center">
                                                {isOnTitleSlide ? (
                                                    <div className="text-center space-y-8">
                                                        <h1 className="font-black uppercase tracking-tight leading-tight" style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', color: projectionTextColor }}>Message de la parole de Dieu</h1>
                                                        {service?.sermon?.title && <h2 className="font-bold opacity-80" style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)', color: projectionTextColor }}>{service.sermon.title}</h2>}
                                                    </div>
                                                ) : renderSermonSlide(sermonSlides[sermonSlideIndex], zoomedElementId === 'sermon')}
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>

                            {/* Focus Footer (4vh) */}
                            <div className="h-[4vh] min-h-[40px] w-full bg-black/90 border-t border-white/5 z-50 flex items-center justify-between px-6">
                                <button onClick={() => focusedContent.type === 'sermon' ? setSermonSlideIndex(p => Math.max(-1, p - 1)) : setMediaSlideIndex(p => Math.max(0, p - 1))} className="text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest flex items-center gap-2"><ChevronLeft size={16} /> Précédent</button>
                                <div className="text-xl font-black tabular-nums" style={{ color: projectionTextColor, opacity: 0.6 }}>
                                    {focusedContent.type === 'sermon' ? (sermonSlideIndex === -1 ? 'INTRO' : `${sermonSlideIndex + 1} / ${parseSermonToSlides(service?.sermon?.content).length}`) : `${mediaSlideIndex + 1} / ${(focusedContent.metadata?.passages || focusedContent.metadata?.songs || []).flatMap(p => parseVersesToSlides(p.text || p.lyrics)).length}`}
                                </div>
                                <button onClick={() => focusedContent.type === 'sermon' ? setSermonSlideIndex(p => Math.min(parseSermonToSlides(service?.sermon?.content).length - 1, p + 1)) : setMediaSlideIndex(p => p + 1)} className="text-[#D4AF37] hover:text-[#D4AF37]/80 uppercase font-black text-[10px] tracking-widest flex items-center gap-2">Suivant <ChevronRight size={16} /></button>
                            </div>
                        </motion.div>
                    ) : currentSlideIndex === -1 ? (
                        <motion.div key="intro-view" {...currentVariant} className="w-full h-full flex flex-col items-center justify-center text-center space-y-12">
                            {churchData?.logoUrl && <img src={churchData.logoUrl} className="w-32 h-32 sm:w-56 sm:h-56 mb-8 rounded-full border-4 border-white/5 p-4 shadow-2xl bg-white/5" alt="" />}
                            <h1 className="font-black uppercase tracking-tighter drop-shadow-2xl" style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)', color: projectionTextColor }}>{service?.theme || t('worship_program', 'Programme du Culte')}</h1>
                            <div className="w-32 sm:w-64 h-2 bg-[#D4AF37] rounded-full shadow-[0_0_60px_rgba(212,175,55,0.8)]" />
                            <p className="font-bold uppercase tracking-[0.4em] opacity-60" style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)', color: projectionTextColor }}>{service?.date && new Date(service.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </motion.div>
                    ) : (
                        <motion.div key={`slide-${currentSlideIndex}`} {...currentVariant} className="w-full h-full flex flex-col justify-between">
                            {/* Slide Header (4vh) */}
                            <div className="h-[4vh] min-h-[40px] w-full flex items-center justify-center bg-zinc-950/95 border-b border-white/5 px-6 backdrop-blur-3xl relative">
                                <span className="opacity-40 text-[9px] font-black uppercase tracking-[0.6em] text-white/50">{toRoman(currentSlideIndex + 1)}</span>
                            </div>

                            {/* Slide Middle (Centered Content) */}
                            <div className="flex-1 w-full flex items-center justify-center px-12 text-center" onClick={(e) => { e.stopPropagation(); setFocusedContent(sortedBlocks[currentSlideIndex]); setMediaSlideIndex(0); setSermonSlideIndex(-1); }}>
                                {(() => {
                                    const block = sortedBlocks[currentSlideIndex];
                                    if (!block) return null;
                                    return (
                                        <div className="w-full flex flex-col items-center gap-10 cursor-pointer hover:scale-[1.01] transition-transform">
                                            <h2 className="font-black tracking-[0.3em] uppercase" style={{ fontSize: 'clamp(2rem, 8vw, 7rem)', color: projectionTextColor }}>{t(block.label, block.label)}</h2>
                                            {block.type === 'reading' && (block.metadata?.passages || []).map((pass, pi) => (
                                                <div key={pi} className="text-center space-y-4">
                                                    <h3 className="font-black italic opacity-80" style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)', color: '#D4AF37' }}>{pass.reference}</h3>
                                                    {pass.responsable && <p className="font-bold uppercase tracking-[0.2em] opacity-60 text-white" style={{ fontSize: 'clamp(1rem, 2vw, 1.8rem)' }}>{pass.responsable}</p>}
                                                </div>
                                            ))}
                                            {block.type === 'sermon' && <h3 className="font-black italic text-emerald-400/80" style={{ fontSize: 'clamp(1.5rem, 5vw, 4rem)' }}>Parole de Vie</h3>}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Slide Footer (4vh) */}
                            <div className="h-[4vh] min-h-[40px] w-full bg-black/90 border-t border-white/5 flex items-center justify-center px-6">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">ELYON 360 PROJECTION ENGINE</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. Unified Professional Toolbar */}
            <div className={`fixed bottom-6 inset-x-0 z-[9000] flex flex-col items-center gap-6 pointer-events-none transition-all duration-700 ${isToolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <AnimatePresence>
                    {showBgSelector && (
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="pointer-events-auto bg-black/90 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 w-[320px] shadow-4xl mb-4">
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Transparence</p>
                                <input type="range" min="0" max="1" step="0.01" value={bgOverlayOpacity} onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto noscrollbar pr-1">
                                {bgTemplates.map(bg => (
                                    <button key={bg.id} onClick={(e) => { e.stopPropagation(); setProjectionBackground(bg); setShowBgSelector(false); }} className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${projectionBackground.id === bg.id ? 'border-[#D4AF37] scale-105 shadow-xl' : 'border-white/5 hover:border-white/20'}`}>
                                        {bg.type === 'image' ? <img src={bg.value} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: bg.css }} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {showTransitionDropdown && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pointer-events-auto absolute bottom-28 bg-zinc-900 border border-white/10 p-2 rounded-2xl min-w-[160px] shadow-2xl z-[10001]">
                            {['fade', 'slide', 'zoom', 'none'].map(t => (
                                <button key={t} onClick={(e) => { e.stopPropagation(); setActiveTransitionType(t); setShowTransitionDropdown(false); }} className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTransitionType === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{t}</button>
                            ))}
                        </motion.div>
                    )}
                    {showTextColorSelector && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pointer-events-auto absolute bottom-28 bg-zinc-900 border border-white/10 p-3 rounded-2xl min-w-[180px] shadow-2xl z-[10001]">
                            <div className="grid grid-cols-5 gap-2">
                                {textColorPresets.map(color => (
                                    <button key={color} onClick={(e) => { e.stopPropagation(); setProjectionTextColor(color); setShowTextColorSelector(false); }} className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125 ${projectionTextColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' : ''}`} style={{ backgroundColor: color }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pointer-events-auto flex items-center gap-1 p-2 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-4xl" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); setShowTransitionDropdown(!showTransitionDropdown); }} className={`p-3 rounded-2xl transition-all ${showTransitionDropdown ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}><Layers size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setShowTextColorSelector(!showTextColorSelector); }} className={`p-3 rounded-2xl transition-all ${showTextColorSelector ? 'bg-[#D4AF37] text-white' : 'hover:bg-white/10 text-gray-400'}`}><PenTool size={20} /></button>
                    <div className="flex items-center gap-3 px-6 border-l border-r border-white/10 mx-2">
                        <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(prev => Math.max(prev - 1, -1)); }} className="p-3 bg-white/5 hover:bg-white/20 rounded-2xl transition-all"><ChevronLeft size={24} /></button>
                        <span className="text-[#D4AF37] font-black text-2xl tabular-nums min-w-[3rem] text-center">{currentSlideIndex === -1 ? '00' : (currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(prev => Math.min(prev + 1, blocks.length - 1)); }} className="p-3 bg-[#D4AF37] hover:bg-[#B8962E] rounded-2xl text-white shadow-lg transition-all"><ChevronRight size={24} /></button>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 mx-2">
                        <button onClick={(e) => { e.stopPropagation(); setGlobalZoom(prev => Math.max(0.2, prev - 0.1)); }} className="p-2 text-gray-500 hover:text-white"><ZoomOut size={16} /></button>
                        <span className="text-[10px] font-black min-w-[30px] text-center">{Math.round(globalZoom * 100)}%</span>
                        <button onClick={(e) => { e.stopPropagation(); setGlobalZoom(prev => Math.min(3, prev + 0.1)); }} className="p-2 text-gray-500 hover:text-white"><ZoomIn size={16} /></button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setShowBgSelector(!showBgSelector); }} className={`p-3 rounded-2xl transition-all ${showBgSelector ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-400'}`}><ImageIcon size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setIsBlackout(!isBlackout); }} className={`p-3 rounded-2xl transition-all ${isBlackout ? 'bg-rose-500 text-white shadow-lg' : 'hover:bg-white/10 text-gray-400 focus:bg-rose-500 focus:text-white'}`}><Monitor size={20} /></button>
                </div>
            </div>

            <style>{`
                .noscrollbar::-webkit-scrollbar { display: none; }
                .noscrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap');
                .font-serif { font-family: 'Playfair Display', serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
};

export default PublicProjection;
