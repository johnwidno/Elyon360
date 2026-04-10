import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLanguage } from '../../../context/LanguageContext';
import AdminLayout from '../../../layouts/AdminLayout';
import worshipService from '../../../api/worshipService';
import SermonEditor from './SermonEditor';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GripVertical, Plus, Minus, Music, Book, BookOpen, Heart, Users, Speaker, Save, Mic, Trash2, X, Search as SearchIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers, PenTool, LayoutTemplate, PlusCircle, Type, UserCheck, Users as UsersIcon, MessageSquare, Send, Clock, MapPin, Monitor, Maximize, Play, Pause, Image as ImageIcon, ZoomIn, ZoomOut, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../api/axios';

const blockTypes = [
    { id: 'welcome', icon: <Users size={16} />, label: 'Accueil' },
    { id: 'song', icon: <Music size={16} />, label: 'Chants' },
    { id: 'prayer', icon: <Heart size={16} />, label: 'Prière' },
    { id: 'reading', icon: <Book size={16} />, label: 'Lecture' },
    { id: 'announcement', icon: <Speaker size={16} />, label: 'Annonces' },
    { id: 'sermon', icon: <Mic size={16} />, label: 'Prédication' },
    { id: 'other', icon: <LayoutTemplate size={16} />, label: 'Autre' },
    { id: 'image', icon: <ImageIcon size={16} />, label: 'Image' },
    { id: 'video', icon: <Video size={16} />, label: 'Vidéo' }
];

const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${url}`;
};

// Parse TipTap HTML sermon content into navigable slides
const parseSermonToSlides = (html) => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const slides = [];
    let id = 0;

    const processNode = (node) => {
        if (node.nodeType !== 1) return; // Must be ELEMENT_NODE
        const tag = node.tagName.toLowerCase();

        // 1. Direct Image
        if (tag === 'img') {
            slides.push({ id: id++, type: 'image', src: node.getAttribute('src'), alt: node.getAttribute('alt') || '' });
            return; // End leaf
        }

        // 2. Lists
        if (tag === 'ul') {
            node.querySelectorAll('li').forEach(li => {
                const t = li.textContent.trim();
                // Also check if list item contains ONLY an image to gracefully handle it
                if (!t && li.querySelector('img')) {
                    const img = li.querySelector('img');
                    slides.push({ id: id++, type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' });
                } else if (t) {
                    slides.push({ id: id++, type: 'bullet', text: t, html: li.innerHTML });
                }
            });
            return; // End leaf
        }
        if (tag === 'ol') {
            node.querySelectorAll('li').forEach((li, i) => {
                const t = li.textContent.trim();
                if (t) slides.push({ id: id++, type: 'numbered', text: t, number: i + 1, html: li.innerHTML });
            });
            return; // End leaf
        }

        // 3. Text Blocks
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
            // Capture any images explicitly placed inside this paragraph or heading
            node.querySelectorAll('img').forEach(img => {
                slides.push({ id: id++, type: 'image', src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' });
            });
            return; // End leaf to avoid duplicated text from nested tags
        }

        // 4. Dive into containers (div, span, article, section, etc.)
        node.childNodes.forEach(processNode);
    };

    doc.body.childNodes.forEach(processNode);
    return slides;
};

const WorshipBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [service, setService] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Phase 4 States
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [expandedBlockId, setExpandedBlockId] = useState(null);
    const [showSongModal, setShowSongModal] = useState(false);
    const [showBibleModal, setShowBibleModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);
    const [projectionMode, setProjectionMode] = useState(false);
    const [focusedContent, setFocusedContent] = useState(null);
    const [globalZoom, setGlobalZoom] = useState(1);
    const [sectionZooms, setSectionZooms] = useState({});
    const [isBlackout, setIsBlackout] = useState(false);
    const [activeSpotlight, setActiveSpotlight] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(-1);
    const [lineSpotlight, setLineSpotlight] = useState(null);
    const [activeTransitionType, setActiveTransitionType] = useState('fade');
    const [currentActiveTransition, setCurrentActiveTransition] = useState('fade');
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [autoPlaySpeed, setAutoPlaySpeed] = useState(5000); // Default 5s
    const [projectionBackground, setProjectionBackground] = useState({ id: 'none', type: 'color', value: 'bg-black' });
    const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.6);
    const [showBgSelector, setShowBgSelector] = useState(false);
    const [showClock, setShowClock] = useState(true);
    const [clockScale, setClockScale] = useState(1);
    const [zoomedElementId, setZoomedElementId] = useState(null);
    const [sermonSlideIndex, setSermonSlideIndex] = useState(0);
    const [localBackgrounds, setLocalBackgrounds] = useState([]);
    const [projectionIndex, setProjectionIndex] = useState(0);
    const [isFetchingBible, setIsFetchingBible] = useState(false);
    const [bibleSearchQuery, setBibleSearchQuery] = useState('');
    const [biblePreview, setBiblePreview] = useState(null);
    const [bibleVersion, setBibleVersion] = useState('ls1910'); // 'ls1910' (FR), 'hcv' (Creole), 'kjv' (EN)
    const [bibleSelectMode, setBibleSelectMode] = useState('smart'); // 'smart' or 'visual'
    const [selectedVisual, setSelectedVisual] = useState({ book: null, chapter: null, verses: [], maxVerses: 0 });

    const BIBLE_VERSIONS = [
        { id: 'ls1910', label: 'Français (LSG)' },
        { id: 'hcv', label: 'Kreyòl Ayisyen' },
        { id: 'kjv', label: 'English (KJV)' }
    ];

    const getBibleBooks = () => {
        const books = {
            ls1910: [
                { id: '1', fr: 'Genèse', chapters: 50 }, { id: '2', fr: 'Exode', chapters: 40 }, { id: '3', fr: 'Lévitique', chapters: 27 }, { id: '4', fr: 'Nombres', chapters: 36 }, { id: '5', fr: 'Deutéronome', chapters: 34 },
                { id: '6', fr: 'Josué', chapters: 24 }, { id: '7', fr: 'Juges', chapters: 21 }, { id: '8', fr: 'Ruth', chapters: 4 }, { id: '9', fr: '1 Samuel', chapters: 31 }, { id: '10', fr: '2 Samuel', chapters: 24 },
                { id: '11', fr: '1 Rois', chapters: 22 }, { id: '12', fr: '2 Rois', chapters: 25 }, { id: '13', fr: '1 Chroniques', chapters: 29 }, { id: '14', fr: '2 Chroniques', chapters: 36 }, { id: '15', fr: 'Esdras', chapters: 10 },
                { id: '16', fr: 'Néhémie', chapters: 13 }, { id: '17', fr: 'Esther', chapters: 10 }, { id: '18', fr: 'Job', chapters: 42 }, { id: '19', fr: 'Psaumes', chapters: 150 }, { id: '20', fr: 'Proverbes', chapters: 31 },
                { id: '21', fr: 'Ecclésiaste', chapters: 12 }, { id: '22', fr: 'Cantique', chapters: 8 }, { id: '23', fr: 'Ésaïe', chapters: 66 }, { id: '24', fr: 'Jérémie', chapters: 52 }, { id: '25', fr: 'Lamentations', chapters: 5 },
                { id: '26', fr: 'Ézéchiel', chapters: 48 }, { id: '27', fr: 'Daniel', chapters: 12 }, { id: '28', fr: 'Osée', chapters: 14 }, { id: '29', fr: 'Joël', chapters: 3 }, { id: '30', fr: 'Amos', chapters: 9 },
                { id: '31', fr: 'Abdias', chapters: 1 }, { id: '32', fr: 'Jonas', chapters: 4 }, { id: '33', fr: 'Michée', chapters: 7 }, { id: '34', fr: 'Nahum', chapters: 3 }, { id: '35', fr: 'Habacuc', chapters: 3 },
                { id: '36', fr: 'Sophonie', chapters: 3 }, { id: '37', fr: 'Aggée', chapters: 2 }, { id: '38', fr: 'Zacharie', chapters: 14 }, { id: '39', fr: 'Malachie', chapters: 4 },
                { id: '40', fr: 'Matthieu', chapters: 28 }, { id: '41', fr: 'Marc', chapters: 16 }, { id: '42', fr: 'Luc', chapters: 24 }, { id: '43', fr: 'Jean', chapters: 21 }, { id: '44', fr: 'Actes', chapters: 28 },
                { id: '45', fr: 'Romains', chapters: 16 }, { id: '46', fr: '1 Corinthiens', chapters: 16 }, { id: '47', fr: '2 Corinthiens', chapters: 13 }, { id: '48', fr: 'Galates', chapters: 6 }, { id: '49', fr: 'Éphésiens', chapters: 6 },
                { id: '50', fr: 'Philippiens', chapters: 4 }, { id: '51', fr: 'Colossiens', chapters: 4 }, { id: '52', fr: '1 Thessaloniciens', chapters: 5 }, { id: '53', fr: '2 Thessaloniciens', chapters: 3 }, { id: '54', fr: '1 Timothée', chapters: 6 },
                { id: '55', fr: '2 Timothée', chapters: 4 }, { id: '56', fr: 'Tite', chapters: 3 }, { id: '57', fr: 'Philémon', chapters: 1 }, { id: '58', fr: 'Hébreux', chapters: 13 }, { id: '59', fr: 'Jacques', chapters: 5 },
                { id: '60', fr: '1 Pierre', chapters: 5 }, { id: '61', fr: '2 Pierre', chapters: 3 }, { id: '62', fr: '1 Jean', chapters: 5 }, { id: '63', fr: '2 Jean', chapters: 1 }, { id: '64', fr: '3 Jean', chapters: 1 },
                { id: '65', fr: 'Jude', chapters: 1 }, { id: '66', fr: 'Apocalypse', chapters: 22 }
            ],
            hcv: [
                { id: '1', fr: 'Jeneze', chapters: 50 }, { id: '2', fr: 'Egzòd', chapters: 40 }, { id: '3', fr: 'Levitik', chapters: 27 }, { id: '4', fr: 'Nonb', chapters: 36 }, { id: '5', fr: 'Deteronòm', chapters: 34 },
                { id: '6', fr: 'Jozye', chapters: 24 }, { id: '7', fr: 'Jij', chapters: 21 }, { id: '8', fr: 'Rit', chapters: 4 }, { id: '9', fr: '1 Samyèl', chapters: 31 }, { id: '10', fr: '2 Samyèl', chapters: 24 },
                { id: '11', fr: '1 Wa', chapters: 22 }, { id: '12', fr: '2 Wa', chapters: 25 }, { id: '13', fr: '1 Kwonik', chapters: 29 }, { id: '14', fr: '2 Kwonik', chapters: 36 }, { id: '15', fr: 'Esdras', chapters: 10 },
                { id: '16', fr: 'Neyemi', chapters: 13 }, { id: '17', fr: 'Estè', chapters: 10 }, { id: '18', fr: 'Jòb', chapters: 42 }, { id: '19', fr: 'Sòm', chapters: 150 }, { id: '20', fr: 'Pwovèb', chapters: 31 },
                { id: '21', fr: 'Eklezyas', chapters: 12 }, { id: '22', fr: 'Chant', chapters: 8 }, { id: '23', fr: 'Ezayi', chapters: 66 }, { id: '24', fr: 'Jeremi', chapters: 52 }, { id: '25', fr: 'Lamantasyon', chapters: 5 },
                { id: '26', fr: 'Ezekyèl', chapters: 48 }, { id: '27', fr: 'Danyèl', chapters: 12 }, { id: '28', fr: 'Oze', chapters: 14 }, { id: '29', fr: 'Joèl', chapters: 3 }, { id: '30', fr: 'Amòs', chapters: 9 },
                { id: '31', fr: 'Abdias', chapters: 1 }, { id: '32', fr: 'Jonas', chapters: 4 }, { id: '33', fr: 'Miche', chapters: 7 }, { id: '34', fr: 'Nawoum', chapters: 3 }, { id: '35', fr: 'Abakou', chapters: 3 },
                { id: '36', fr: 'Sofoni', chapters: 3 }, { id: '37', fr: 'Aje', chapters: 2 }, { id: '38', fr: 'Zakari', chapters: 14 }, { id: '39', fr: 'Malachi', chapters: 4 },
                { id: '40', fr: 'Matye', chapters: 28 }, { id: '41', fr: 'Mak', chapters: 16 }, { id: '42', fr: 'Lik', chapters: 24 }, { id: '43', fr: 'Jan', chapters: 21 }, { id: '44', fr: 'Travay', chapters: 28 },
                { id: '45', fr: 'Women', chapters: 16 }, { id: '46', fr: '1 Korent', chapters: 16 }, { id: '47', fr: '2 Korent', chapters: 13 }, { id: '48', fr: 'Galat', chapters: 6 }, { id: '49', fr: 'Efez', chapters: 6 },
                { id: '50', fr: 'Filipyen', chapters: 4 }, { id: '51', fr: 'Kolosyen', chapters: 4 }, { id: '52', fr: '1 Tesalonik', chapters: 5 }, { id: '53', fr: '2 Tesalonik', chapters: 3 }, { id: '54', fr: '1 Timote', chapters: 6 },
                { id: '55', fr: '2 Timote', chapters: 4 }, { id: '56', fr: 'Tit', chapters: 3 }, { id: '57', fr: 'Filemon', chapters: 1 }, { id: '58', fr: 'Ebre', chapters: 13 }, { id: '59', fr: 'Jak', chapters: 5 },
                { id: '60', fr: '1 Pyè', chapters: 5 }, { id: '61', fr: '2 Pyè', chapters: 3 }, { id: '62', fr: '1 Jan', chapters: 5 }, { id: '63', fr: '2 Jan', chapters: 1 }, { id: '64', fr: '3 Jan', chapters: 1 },
                { id: '65', fr: 'Jid', chapters: 1 }, { id: '66', fr: 'Revelasyon', chapters: 22 }
            ],
            kjv: [
                { id: '1', fr: 'Genesis', chapters: 50 }, { id: '2', fr: 'Exodus', chapters: 40 }, { id: '3', fr: 'Leviticus', chapters: 27 }, { id: '4', fr: 'Numbers', chapters: 36 }, { id: '5', fr: 'Deuteronomy', chapters: 34 },
                { id: '6', fr: 'Joshua', chapters: 24 }, { id: '7', fr: 'Judges', chapters: 21 }, { id: '8', fr: 'Ruth', chapters: 4 }, { id: '9', fr: '1 Samuel', chapters: 31 }, { id: '10', fr: '2 Samuel', chapters: 24 },
                { id: '11', fr: '1 Kings', chapters: 22 }, { id: '12', fr: '2 Kings', chapters: 25 }, { id: '13', fr: '1 Chronicles', chapters: 29 }, { id: '14', fr: '2 Chronicles', chapters: 36 }, { id: '15', fr: 'Ezra', chapters: 10 },
                { id: '16', fr: 'Nehemiah', chapters: 13 }, { id: '17', fr: 'Esther', chapters: 10 }, { id: '18', fr: 'Job', chapters: 42 }, { id: '19', fr: 'Psalms', chapters: 150 }, { id: '20', fr: 'Proverbs', chapters: 31 },
                { id: '21', fr: 'Ecclesiastes', chapters: 12 }, { id: '22', fr: 'Song of Solomon', chapters: 8 }, { id: '23', fr: 'Isaiah', chapters: 66 }, { id: '24', fr: 'Jeremiah', chapters: 52 }, { id: '25', fr: 'Lamentations', chapters: 5 },
                { id: '26', fr: 'Ezekiel', chapters: 48 }, { id: '27', fr: 'Daniel', chapters: 12 }, { id: '28', fr: 'Hosea', chapters: 14 }, { id: '29', fr: 'Joel', chapters: 3 }, { id: '30', fr: 'Amos', chapters: 9 },
                { id: '31', fr: 'Obadiah', chapters: 1 }, { id: '32', fr: 'Jonah', chapters: 4 }, { id: '33', fr: 'Micah', chapters: 7 }, { id: '34', fr: 'Nahum', chapters: 3 }, { id: '35', fr: 'Habakkuk', chapters: 3 },
                { id: '36', fr: 'Zephaniah', chapters: 3 }, { id: '37', fr: 'Haggai', chapters: 2 }, { id: '38', fr: 'Zechariah', chapters: 14 }, { id: '39', fr: 'Malachi', chapters: 4 },
                { id: '40', fr: 'Matthew', chapters: 28 }, { id: '41', fr: 'Mark', chapters: 16 }, { id: '42', fr: 'Luke', chapters: 24 }, { id: '43', fr: 'John', chapters: 21 }, { id: '44', fr: 'Acts', chapters: 28 },
                { id: '45', fr: 'Romans', chapters: 16 }, { id: '46', fr: '1 Corinthians', chapters: 16 }, { id: '47', fr: '2 Corinthians', chapters: 13 }, { id: '48', fr: 'Galatians', chapters: 6 }, { id: '49', fr: 'Ephesians', chapters: 6 },
                { id: '50', fr: 'Philippians', chapters: 4 }, { id: '51', fr: 'Colossians', chapters: 4 }, { id: '52', fr: '1 Thessalonians', chapters: 5 }, { id: '53', fr: '2 Thessalonians', chapters: 3 }, { id: '54', fr: '1 Timothy', chapters: 6 },
                { id: '55', fr: '2 Timothy', chapters: 4 }, { id: '56', fr: 'Titus', chapters: 3 }, { id: '57', fr: 'Philemon', chapters: 1 }, { id: '58', fr: 'Hebrews', chapters: 13 }, { id: '59', fr: 'James', chapters: 5 },
                { id: '60', fr: '1 Peter', chapters: 5 }, { id: '61', fr: '2 Peter', chapters: 3 }, { id: '62', fr: '1 John', chapters: 5 }, { id: '63', fr: '2 John', chapters: 1 }, { id: '64', fr: '3 John', chapters: 1 },
                { id: '65', fr: 'Jude', chapters: 1 }, { id: '66', fr: 'Revelation', chapters: 22 }
            ]
        };
        const list = books[bibleVersion] || books['ls1910'];
        // Ensure it's at least 66 items by falling back to lsg for missing ones in Creole/English
        if (list.length < 66 && bibleVersion !== 'ls1910') {
             return books['ls1910'].map(b => {
                 const localized = list.find(l => l.id === b.id);
                 return localized || b;
             });
        }
        return list;
    };

    const BIBLE_BOOKS = getBibleBooks();


    // Mock catalog for Chants d'Espérance (can be moved to backend/db later)
    const CHE_CATALOG = [
        { id: 'che-1', number: 1, collection: 'Fr CHE', title: 'Grand Dieu, nous te bénissons', lyrics: 'Grand Dieu, nous te bénissons,\nNous célébrons tes louanges,\nÉternel, nous t’exaltons,\nComme le font tous les anges.', category: 'Louange' },
        { id: 'che-2', number: 123, collection: 'Fr CHE', title: 'Je louerai l’Éternel', lyrics: 'Je louerai l’Éternel de tout mon cœur,\nJe raconterai toutes tes merveilles,\nJe ferai de toi le sujet de ma joie,\nAlléluia !', category: 'Louange' },
        { id: 'che-3', number: 56, collection: 'Fr CHE', title: 'À toi la gloire', lyrics: 'À toi la gloire,\nO Ressuscité !\nÀ toi la victoire\nPour l’éternité !', category: 'Adoration' }
    ];

    const [songSource, setSongSource] = useState('library'); // 'library' or 'che'
    const [songSearchTerm, setSongSearchTerm] = useState('');
    const [expandedLyrics, setExpandedLyrics] = useState(null); // tracking expanded lyrics in building mode
    const [songs, setSongs] = useState([]);
    const [members, setMembers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [churchData, setChurchData] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(null); // {blockId, itemId}
    const [songSearch, setSongSearch] = useState({}); // { [blockId]: searchString }

    // Bible Selector temporary state
    const [bibleRef, setBibleRef] = useState({ book: 'Jean', chapter: '3', verses: '16' });

    // Block Layouts (for Manual Resizing & Positioning)
    const [blockLayouts, setBlockLayouts] = useState({});

    // Ref for AutoPlay timer
    const autoPlayRef = useRef(null);

    useEffect(() => {
        if (isAutoPlaying && projectionMode) {
            autoPlayRef.current = setInterval(() => {
                setCurrentSlideIndex(prev => {
                    const next = prev + 1;
                    if (next >= blocks.length) {
                        setIsAutoPlaying(false);
                        return prev;
                    }
                    return next;
                });
            }, autoPlaySpeed);
        } else {
            clearInterval(autoPlayRef.current);
        }
        return () => clearInterval(autoPlayRef.current);
    }, [isAutoPlaying, projectionMode, blocks.length, autoPlaySpeed]);

    const handleUpdateLayout = (blockId, layout) => {
        setBlockLayouts(prev => ({
            ...prev,
            [blockId]: { ...(prev[blockId] || {}), ...layout }
        }));
    };

    // French to English mapping for bible-api.com
    const bookMap = {
        'Genèse': 'Genesis', 'Exode': 'Exodus', 'Psaumes': 'Psalms', 'Proverbes': 'Proverbs',
        'Esaïe': 'Isaiah', 'Matthieu': 'Matthew', 'Marc': 'Mark', 'Luc': 'Luke', 'Jean': 'John',
        'Actes': 'Acts', 'Romains': 'Romans', 'Apocalypse': 'Revelation'
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

    // Tabs state
    const [activeTab, setActiveTab] = useState('blocks');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to get CSS gradient/color string for inline styles
    const getBgStyle = (bg) => {
        if (!bg) return { background: '#000000' };
        if (bg.type === 'image') {
            return {
                backgroundImage: `url("${bg.value}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            };
        }
        // All color templates use inline CSS — Tailwind dynamic classes don't work at runtime
        return { background: bg.css || '#000000' };
    };

    const bgTemplates = [
        { id: 'none',          label: 'Noir',              type: 'color', css: '#000000' },
        { id: 'midnight',      label: 'Minuit',            type: 'color', css: 'linear-gradient(135deg, #0B0B15 0%, #1A1A2E 100%)' },
        { id: 'celestial',     label: 'Céleste',           type: 'image', value: 'https://images.unsplash.com/photo-1506318137071-a8e063b4fe09?q=80&w=2070&auto=format&fit=crop' },
        { id: 'nature',        label: 'Forêt',             type: 'image', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' },
        { id: 'ocean',         label: 'Océan',             type: 'image', value: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4?q=80&w=2000&auto=format&fit=crop' },
        { id: 'mountain',      label: 'Sommet',            type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' },
        { id: 'sunset',        label: 'Crépuscule',        type: 'image', value: 'https://images.unsplash.com/photo-1472120482482-d4387395463a?q=80&w=2070&auto=format&fit=crop' },
        { id: 'stars',         label: 'Étoiles',           type: 'image', value: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=2670&auto=format&fit=crop' },
        { id: 'gold',          label: 'Or Royal',          type: 'color', css: 'linear-gradient(135deg, #1A1A1A 0%, #3D2B1F 100%)' },
        { id: 'emerald',       label: 'Émeraude',          type: 'color', css: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
        { id: 'silk',          label: 'Soie Rouge',        type: 'color', css: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)' },
        { id: 'lavender',      label: 'Lavande',           type: 'color', css: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)' },
        { id: 'marble',        label: 'Marbre',            type: 'image', value: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=2072&auto=format&fit=crop' },
        { id: 'abstract_blue', label: 'Bleu Abstrait',     type: 'image', value: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' },
        { id: 'spiritual_light',label: 'Lumière',          type: 'image', value: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=2670&auto=format&fit=crop' },
        { id: 'worship_crowd', label: 'Louange',           type: 'image', value: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2670&auto=format&fit=crop' },
        { id: 'geometric',     label: 'Géométrique',       type: 'color', css: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
        { id: 'desert',        label: 'Désert',            type: 'image', value: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop' },
        { id: 'cloudy',        label: 'Nuages',            type: 'image', value: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1974&auto=format&fit=crop' },
        { id: 'dark_metal',    label: 'Acier',             type: 'color', css: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' },
        { id: 'aurora',        label: 'Aurore',            type: 'image', value: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=2000&auto=format&fit=crop' },
        { id: 'nebula',        label: 'Nébuleuse',         type: 'image', value: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop' },
        { id: 'peace',         label: 'Paix',              type: 'image', value: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2038&auto=format&fit=crop' },
        { id: 'temple',        label: 'Temple',            type: 'image', value: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2070&auto=format&fit=crop' },
        { id: 'vintage',       label: 'Ancien',            type: 'image', value: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2080&auto=format&fit=crop' },
        { id: 'morning_grace', label: 'Grâce Matinale',   type: 'image', value: 'https://images.unsplash.com/photo-1470252649358-96bfe2c24409?q=80&w=2070&auto=format&fit=crop' },
        { id: 'infinite',      label: 'Infini',            type: 'color', css: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
        { id: 'obsidian',      label: 'Obsidienne',        type: 'color', css: 'linear-gradient(135deg, #090909 0%, #1a1a1a 100%)' },
        { id: 'crimson',       label: 'Pourpre',           type: 'color', css: 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)' },
        { id: 'river',         label: 'Fleuve',            type: 'image', value: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop' },
        { id: 'sacred_light',  label: 'Lumière Sacrée',   type: 'image', value: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=2000&auto=format&fit=crop' },
        { id: 'zen_garden',    label: 'Jardin Zen',        type: 'image', value: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop' },
        { id: 'space_dust',    label: 'Poussière',         type: 'image', value: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop' },
        { id: 'holy_fire',     label: 'Feu Sacré',         type: 'color', css: 'linear-gradient(135deg, #431407 0%, #7c2d12 100%)' },
        { id: 'deep_purple',   label: 'Royal Pourpre',     type: 'color', css: 'linear-gradient(135deg, #2e1065 0%, #581c87 100%)' },
        { id: 'ocean_breeze',  label: 'Brise Océan',       type: 'color', css: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)' },
        { id: 'earth',         label: 'Terre',             type: 'color', css: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)' },
        { id: 'morning_sky',   label: 'Aube',              type: 'color', css: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)' },
        { id: 'spirit_wind',   label: "Vent de l'Esprit",  type: 'image', value: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2038&auto=format&fit=crop' },
        { id: 'revelation',    label: 'Révélation',        type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' },
        { id: 'eternal',       label: 'Éternel',           type: 'color', css: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' },
        { id: 'rose_gold',     label: 'Rose Gold',         type: 'color', css: 'linear-gradient(135deg, #4c0519 0%, #881337 100%)' },
        { id: 'majesty',       label: 'Majesté',           type: 'color', css: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #292524 100%)' },
        { id: 'sanctuary',     label: 'Sanctuaire',        type: 'image', value: 'https://images.unsplash.com/photo-1548625361-58a7b537b8f?q=80&w=2070&auto=format&fit=crop' },
        { id: 'hymn',          label: 'Cantique',          type: 'image', value: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=2070&auto=format&fit=crop' }
    ];

    useEffect(() => {
        fetchServiceData();
        fetchAuxData();
    }, [id]);

    const fetchAuxData = async () => {
        try {
            const [memRes, groupRes, churchRes] = await Promise.all([
                api.get('/members'),
                api.get('/groups'),
                api.get('/churches/settings').catch(() => ({ data: {} }))
            ]);
            setMembers(memRes.data);
            setGroups(groupRes.data);
            if (churchRes.data?.church) {
                setChurchData(churchRes.data.church);
            }
        } catch (error) {
            console.error("Error fetching auxiliary data:", error);
        }
    };
    const fetchServiceData = async () => {
        try {
            const res = await worshipService.getServiceById(id);
            setService(res.data);
            // Sort blocks by orderIndex
            const sortedBlocks = res.data.blocks?.sort((a, b) => a.orderIndex - b.orderIndex) || [];
            setBlocks(sortedBlocks);
        } catch (error) {
            toast.error(t('error_fetch_service', 'Erreur lors du chargement du culte'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlock = async (typeId, label) => {
        try {
            const newBlockData = {
                type: typeId,
                label: label,
                orderIndex: blocks.length,
                metadata: {} // Default empty metadata for specifics later
            };
            const res = await worshipService.addBlock(id, newBlockData);
            setBlocks([...blocks, res.data.block]);
            toast.success('Bloc ajouté');
        } catch (error) {
            toast.error('Erreur lors de l\'ajout du bloc');
        }
    };

    const handleUpdateBlockMetadata = async (blockId, metadataUpdate) => {
        try {
            const blockToUpdate = blocks.find(b => b.id === blockId);
            const newMetadata = { ...blockToUpdate.metadata, ...metadataUpdate };

            await worshipService.updateBlock(blockId, { metadata: newMetadata });

            setBlocks(blocks.map(b => b.id === blockId ? { ...b, metadata: newMetadata } : b));
            toast.success('Détails du bloc mis à jour');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du bloc');
        }
    };

    const handleUpdateBlockLabel = async (blockId, newLabel) => {
        try {
            await worshipService.updateBlock(blockId, { label: newLabel });
            toast.success('Titre du bloc mis à jour', { id: `label-${blockId}` });
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du titre');
        }
    };

    const handleLocalSubItemChange = (blockId, itemId, field, value) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b;
            const currentContents = b.metadata?.contents || (
                (b.metadata?.content || b.metadata?.responsable)
                    ? [{ id: 'legacy', type: 'full', responsable: b.metadata.responsable || '', content: b.metadata.content || '' }]
                    : []
            );
            return {
                ...b,
                metadata: {
                    ...b.metadata,
                    contents: currentContents.map(item => item.id === itemId ? { ...item, [field]: value } : item)
                }
            };
        }));
    };

    const handleAddSubItem = async (blockId, type = 'full') => {
        const block = blocks.find(b => b.id === blockId);
        const currentContents = block.metadata?.contents || (
            (block.metadata?.content || block.metadata?.responsable)
                ? [{ id: 'legacy', type: 'full', responsable: block.metadata.responsable || '', content: block.metadata.content || '' }]
                : []
        );
        const newContents = [...currentContents, { id: Date.now().toString(), type, responsable: '', content: '' }];
        await handleUpdateBlockMetadata(blockId, { contents: newContents });
    };

    const handleDeleteSubItem = async (blockId, itemId) => {
        const block = blocks.find(b => b.id === blockId);
        const currentContents = block.metadata?.contents || [];
        const newContents = currentContents.filter(item => item.id !== itemId);
        await handleUpdateBlockMetadata(blockId, { contents: newContents });
    };

    const handleSaveSubItemsDebounced = (blockId) => {
        const block = blocks.find(b => b.id === blockId);
        handleUpdateBlockMetadata(blockId, { contents: block.metadata?.contents });
    };

    const handleAddSongToBlock = (blockId, song) => {
        const block = blocks.find(b => b.id === blockId);
        const currentSongs = block.metadata?.songs || (
            block.metadata?.songId ? [{ id: block.metadata.songId.toString(), songId: block.metadata.songId, title: block.metadata.songTitle || '', lyrics: block.metadata.songLyrics || '' }] : []
        );
        if (currentSongs.find(s => s.songId === song.id)) {
            toast('Ce chant est déjà dans le bloc', { icon: '⚠️' });
            return;
        }
        const newSongs = [...currentSongs, { id: Date.now().toString(), songId: song.id, title: song.title, lyrics: song.lyrics || '', author: song.author || '', responsable: '', notes: '' }];
        handleUpdateBlockMetadata(blockId, { songs: newSongs });
    };

    const handleRemoveSongFromBlock = (blockId, songItemId) => {
        const block = blocks.find(b => b.id === blockId);
        const currentSongs = block.metadata?.songs || [];
        const newSongs = currentSongs.filter(s => s.id !== songItemId);
        handleUpdateBlockMetadata(blockId, { songs: newSongs });
    };

    const handleLocalSongItemChange = (blockId, songItemId, field, value) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const newSongs = (b.metadata?.songs || []).map(s =>
                s.id === songItemId ? { ...s, [field]: value } : s
            );
            return { ...b, metadata: { ...b.metadata, songs: newSongs } };
        }));
    };

    const handleSaveSongsDebounced = (blockId) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) handleUpdateBlockMetadata(blockId, { songs: block.metadata?.songs });
    };

    const openSongModal = async (blockId) => {
        setActiveBlockId(blockId);
        setShowSongModal(true);
        if (songs.length === 0) {
            try {
                const res = await worshipService.getSongs();
                setSongs(res.data);
            } catch (err) {
                toast.error('Erreur de chargement des chants');
            }
        }
    };

    const openBibleModal = (blockId) => {
        setActiveBlockId(blockId);
        setShowBibleModal(true);
    };

    const handleRemovePassage = (blockId, passageId) => {
        const block = blocks.find(b => b.id === blockId);
        const currentPassages = block.metadata?.passages || [];
        const newPassages = currentPassages.filter(p => p.id !== passageId);
        handleUpdateBlockMetadata(blockId, { passages: newPassages });
    };

    const handleLocalPassageChange = (blockId, passageId, field, value) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            const newPassages = (b.metadata?.passages || []).map(p =>
                p.id === passageId ? { ...p, [field]: value } : p
            );
            return { ...b, metadata: { ...b.metadata, passages: newPassages } };
        }));
    };

    const handleSavePassagesDebounced = (blockId) => {
        const block = blocks.find(b => b.id === blockId);
        if (block) handleUpdateBlockMetadata(blockId, { passages: block.metadata?.passages });
    };

    const handleBibleSmartSearch = async (manualRef) => {
        const queryText = manualRef || bibleSearchQuery;
        if (!queryText.trim()) return;
        setIsFetchingBible(true);
        try {
            let query = queryText.trim();
            // Map French names to English (helper map)
            Object.keys(bookMap).forEach(frBook => {
                if (query.toLowerCase().startsWith(frBook.toLowerCase())) {
                    query = query.toLowerCase().replace(frBook.toLowerCase(), bookMap[frBook]);
                }
            });

            const response = await api.get(`/worship/bible/proxy`, {
                params: { passage: query, version: bibleVersion }
            });
            const data = response.data;

            if (data.verses && data.verses.length > 0) {
                setBiblePreview({
                    reference: data.reference,
                    text: data.verses.map(v => `${v.verse}. ${v.text}`).join('\n')
                });
                
                // If in visual mode and chapter selected, update maxVerses if needed
                if (bibleSelectMode === 'visual' && !queryText.includes(':')) {
                    setSelectedVisual(prev => ({ ...prev, maxVerses: data.verses.length }));
                }
            } else {
                toast.error('Passage non trouvé.');
                setBiblePreview(null);
            }
        } catch (error) {
            console.error("Bible Proxy Error:", error);
            toast.error('Erreur lors de la récupération du passage.');
        } finally {
            setIsFetchingBible(false);
        }
    };

    const handleVisualSelect = (type, val) => {
        if (type === 'book') {
            setSelectedVisual({ book: val, chapter: null, verses: [], maxVerses: 0 });
        } else if (type === 'chapter') {
            setSelectedVisual(prev => ({ ...prev, chapter: val, verses: [], maxVerses: 0 }));
            // Preview the whole chapter immediately
            handleBibleSmartSearch(`${selectedVisual.book.fr} ${val}`);
        } else if (type === 'verse') {
            let newVerses = [...selectedVisual.verses];
            if (newVerses.includes(val)) {
                newVerses = newVerses.filter(v => v !== val);
            } else {
                newVerses.push(val);
                newVerses.sort((a,b) => a - b);
            }
            setSelectedVisual(prev => ({ ...prev, verses: newVerses }));
            
            // Preview selected verses
            if (newVerses.length > 0) {
                const ref = `${selectedVisual.book.fr} ${selectedVisual.chapter}:${newVerses.join(',')}`;
                handleBibleSmartSearch(ref);
            }
        }
    };

    const validateBiblePassage = () => {
        if (!biblePreview) return;
        
        const block = blocks.find(b => b.id === activeBlockId);
        const currentPassages = block.metadata?.passages || [];

        const newPassage = {
            id: Date.now().toString(),
            reference: biblePreview.reference,
            text: biblePreview.text,
            responsable: '',
            notes: ''
        };

        handleUpdateBlockMetadata(activeBlockId, {
            passages: [...currentPassages, newPassage],
            passage: biblePreview.reference,
            passageText: biblePreview.text
        });

        setShowBibleModal(false);
        setBiblePreview(null);
        setBibleSearchQuery('');
        setExpandedBlockId(activeBlockId);
    };

    const toggleExpand = async (id) => {
        setExpandedBlockId(prev => prev === id ? null : id);
        // Auto-load songs when opening a song block
        const block = blocks.find(b => b.id === id);
        if (block?.type === 'song' && songs.length === 0) {
            try {
                const res = await worshipService.getSongs();
                setSongs(res.data);
            } catch (err) {
                toast.error('Erreur de chargement des chants');
            }
        }
    };

    const handleDeleteBlock = async (blockId) => {
        try {
            await worshipService.deleteBlock(blockId);
            setBlocks(blocks.filter(b => b.id !== blockId));
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index && source.droppableId === destination.droppableId) return;

        // case 1: Reordering top-level blocks
        if (source.droppableId === 'worship-blocks') {
            const items = Array.from(blocks);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            // Update local state for instant UI feedback
            const updatedItems = items.map((item, index) => ({ ...item, orderIndex: index }));
            setBlocks(updatedItems);

            // Save order to backend
            try {
                setIsSaving(true);
                const reorderPayload = updatedItems.map(item => ({ id: item.id, orderIndex: item.orderIndex }));
                await worshipService.reorderBlocks(reorderPayload);
                toast.success('Ordre sauvegardé', { id: 'reorder-toast', duration: 1000 });
            } catch (error) {
                toast.error('Erreur lors de la sauvegarde de l\'ordre');
                fetchServiceData(); // Revert on failure
            } finally {
                setIsSaving(false);
            }
        }

        // case 2: Reordering sub-items within a block
        else if (source.droppableId.startsWith('subitems-')) {
            const blockIdStr = source.droppableId.replace('subitems-', '');
            const blockId = isNaN(Number(blockIdStr)) ? blockIdStr : Number(blockIdStr);

            let newContentsForSave = [];
            const updatedBlocks = blocks.map(b => {
                if (b.id === blockId) {
                    const localContents = Array.from(b.metadata?.contents || []);
                    const [removed] = localContents.splice(source.index, 1);
                    localContents.splice(destination.index, 0, removed);
                    newContentsForSave = localContents;
                    return {
                        ...b,
                        metadata: { ...b.metadata, contents: localContents }
                    };
                }
                return b;
            });

            setBlocks(updatedBlocks);
            // Save immediately with the new contents (avoid stale state read)
            handleUpdateBlockMetadata(blockId, { contents: newContentsForSave });
            toast.success('Ordre mis à jour', { id: 'subitem-reorder', duration: 1000 });
        }

        // case 3: Reordering songs within a song block
        else if (source.droppableId.startsWith('songs-')) {
            const blockIdStr = source.droppableId.replace('songs-', '');
            const blockId = isNaN(Number(blockIdStr)) ? blockIdStr : Number(blockIdStr);
            let newSongsForSave = [];
            const updatedBlocks = blocks.map(b => {
                if (b.id === blockId) {
                    const localSongs = Array.from(b.metadata?.songs || []);
                    const [removed] = localSongs.splice(source.index, 1);
                    localSongs.splice(destination.index, 0, removed);
                    newSongsForSave = localSongs;
                    return { ...b, metadata: { ...b.metadata, songs: localSongs } };
                }
                return b;
            });
            setBlocks(updatedBlocks);
            handleUpdateBlockMetadata(blockId, { songs: newSongsForSave });
            toast.success('Ordre mis à jour', { id: 'song-reorder', duration: 1000 });
        }

        // case 4: Reordering passages within a reading block
        else if (source.droppableId.startsWith('passages-')) {
            const blockIdStr = source.droppableId.replace('passages-', '');
            const blockId = isNaN(Number(blockIdStr)) ? blockIdStr : Number(blockIdStr);
            let newPassagesForSave = [];
            const updatedBlocks = blocks.map(b => {
                if (b.id === blockId) {
                    const localPassages = Array.from(b.metadata?.passages || []);
                    const [removed] = localPassages.splice(source.index, 1);
                    localPassages.splice(destination.index, 0, removed);
                    newPassagesForSave = localPassages;
                    return { ...b, metadata: { ...b.metadata, passages: localPassages } };
                }
                return b;
            });
            setBlocks(updatedBlocks);
            handleUpdateBlockMetadata(blockId, { passages: newPassagesForSave });
            toast.success('Ordre mis à jour', { id: 'passage-reorder', duration: 1000 });
        }
    };

    const exportToPDF = () => {
        // Utilizing native vector print capabilities for perfect A4 multipage support
        window.print();
    };

    useEffect(() => {
        if (!projectionMode) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setProjectionMode(false);
                if (document.fullscreenElement) document.exitFullscreen();
            }
            if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                setCurrentSlideIndex(prev => Math.min(prev + 1, blocks.length - 1));
            }
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                setCurrentSlideIndex(prev => Math.max(prev - 1, -1));
            }
            if (e.key === '+' || e.key === '=') {
                setGlobalZoom(prev => Math.min(prev + 0.1, 2.5));
            }
            if (e.key === '-' || e.key === '_') {
                setGlobalZoom(prev => Math.max(prev - 0.1, 0.5));
            }
            if (e.key === '0') {
                setGlobalZoom(1);
            }
            if (e.key?.toLowerCase() === 'b' || e.key?.toLowerCase() === 'm') {
                setIsBlackout(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [projectionMode, blocks.length]);


    // Cinematic Engine is now single-slide-at-a-time, so we don't need scrollIntoView.

    // --- CINEMATIC PROJECTION ENGINE ---
    if (projectionMode) {
        const sortedBlocks = Array.from(blocks).sort((a, b) => a.orderIndex - b.orderIndex);
        
        const transitionVariants = {
            fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
            slide: { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: '-100%', opacity: 0 } },
            zoom: { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
            none: { initial: {}, animate: {}, exit: {} }
        };

        const currentVariant = transitionVariants[activeTransitionType] || transitionVariants.fade;

        return (
            <div 
                id="cinematic-projection-engine"
                className={`fixed inset-0 z-[5000] flex flex-col font-serif select-none overflow-y-auto bg-black transition-opacity duration-1000 ${isBlackout ? 'opacity-0' : 'opacity-100'}`}
                onClick={() => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(e => console.log(e));
                    }
                    setShowBgSelector(false);
                    if (focusedContent) {
                        setFocusedContent(null);
                        setZoomedElementId(null);
                        setLineSpotlight(null);
                    }
                }}
            >
                {/* Real-time Clock */}
                {showClock && (
                    <Rnd
                        size={{ width: 'auto', height: 'auto' }}
                        position={blockLayouts['clock']?.position || { x: 48, y: 32 }}
                        onDragStop={(e, d) => handleUpdateLayout('clock', { position: { x: d.x, y: d.y } })}
                        disableDragging={!projectionMode}
                        enableResizing={false}
                        className="z-[6000] opacity-40 hover:opacity-100 transition-opacity flex flex-col items-start cursor-move"
                        style={{ transform: `scale(${clockScale})`, transformOrigin: 'top left' }}
                        onWheel={(e) => {
                            e.stopPropagation();
                            if (e.deltaY < 0) setClockScale(p => Math.min(4, p + 0.1));
                            else setClockScale(p => Math.max(0.3, p - 0.1));
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setClockScale(p => p >= 3 ? 1 : p + 0.5);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setClockScale(p => Math.max(0.5, p - 0.5));
                        }}
                    >
                        <span className="text-4xl font-black text-white tracking-widest leading-none font-sans whitespace-nowrap">
                            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mt-1 whitespace-nowrap">Direct Live</span>
                    </Rnd>
                )}
                {/* Background Layer */}
                <div 
                    className="absolute inset-0 transition-all duration-1000"
                    style={{
                        ...(projectionBackground.type === 'image'
                            ? {
                                backgroundImage: `url("${projectionBackground.value}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }
                            : { background: isBlackout ? '#000' : (projectionBackground.css || '#000') }
                        ),
                        opacity: isBlackout ? 0 : 1
                    }}
                />
                {/* Opacity Overlay */}
                <div className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300" style={{ opacity: isBlackout ? 1 : bgOverlayOpacity }} />

                {/* Content Layer with Frame Motion & Rnd */}
                <div className="relative min-h-[100vh] flex flex-col items-center justify-start p-6 sm:p-20 pt-32 pb-48" style={{ transform: `scale(${globalZoom})`, transformOrigin: 'top center' }}>
                    <AnimatePresence mode="wait">
                        {focusedContent ? (
                            <motion.div
                                key="focused-content"
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, y: -30 }}
                                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                className="w-full max-w-7xl mx-auto flex flex-col items-center justify-start mt-12 space-y-12"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFocusedContent(null); setZoomedElementId(null); setLineSpotlight(null); }}
                                    className="fixed top-8 left-8 flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-xl font-black z-[100] backdrop-blur-3xl border border-white/10 text-white shadow-2xl"
                                >
                                    <ArrowLeft size={28} /> {t('back', 'Retour')}
                                </button>

                                <div className="text-center w-full max-w-7xl pt-6 pb-16">
                                    {focusedContent.type !== 'sermon' && (
                                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-xl">
                                            <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                                            <span className="text-sm font-bold text-white/70 uppercase tracking-[0.25em]">
                                                {t(focusedContent.label, focusedContent.label)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="w-full flex-1 flex flex-col items-center justify-start space-y-20 py-4 px-6">
                                        {focusedContent.type !== 'sermon' && (
                                            <>
                                                {(focusedContent.metadata?.songs || []).map((song, si) => {
                                                    const id = `song-${si}`;
                                                    const isZoomed = zoomedElementId === id;
                                                    return (
                                                        <div key={id} onClick={(e) => { e.stopPropagation(); setZoomedElementId(isZoomed ? null : id); }} className={`cursor-zoom-in w-full text-center space-y-10 transition-all duration-700 ${isZoomed ? 'scale-[1.1] sm:scale-[1.3] z-50 origin-top' : 'scale-100 z-10 opacity-60 hover:opacity-100'}`}>
                                                            <h3 className="text-7xl sm:text-[8rem] font-black text-blue-400 drop-shadow-[0_20px_80px_rgba(0,0,0,0.8)] italic tracking-tight">« {song.title} »</h3>
                                                            {song.lyrics && (
                                                                <div className="bg-black/60 p-16 sm:p-24 rounded-[4rem] border border-white/10 shadow-4xl backdrop-blur-3xl">
                                                                    <p className="text-5xl sm:text-[6.5rem] font-black text-white leading-tight whitespace-pre-wrap tracking-tight drop-shadow-lg">{song.lyrics}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {(focusedContent.metadata?.contents || []).map((item, ci) => {
                                                    const id = `content-${ci}`;
                                                    const isZoomed = zoomedElementId === id;
                                                    return (
                                                        <div key={id} onClick={(e) => { e.stopPropagation(); setZoomedElementId(isZoomed ? null : id); }} className={`cursor-zoom-in w-full text-center bg-black/60 p-16 sm:p-24 rounded-[5rem] border border-white/5 shadow-3xl backdrop-blur-xl transition-all duration-700 ${isZoomed ? 'scale-[1.1] sm:scale-[1.3] z-50 origin-top' : 'scale-100 z-10 opacity-60 hover:opacity-100'}`}>
                                                            {(item.type === 'image' || item.type === 'video') && item.url ? (
                                                                item.type === 'image' ? (
                                                                    <img src={getMediaUrl(item.url)} alt="" className="w-full h-auto max-h-[60vh] object-contain rounded-3xl mx-auto" />
                                                                ) : (
                                                                    <video src={getMediaUrl(item.url)} controls autoPlay className="w-full h-auto max-h-[60vh] object-contain rounded-3xl mx-auto" />
                                                                )
                                                            ) : item.content ? (
                                                                <p className="text-6xl sm:text-[7.5rem] font-black text-gray-50 leading-tight drop-shadow-xl">{item.content}</p>
                                                            ) : null}
                                                            {item.responsable && (
                                                                <div className="mt-16 flex items-center justify-center gap-6">
                                                                    <div className="h-0.5 w-16 bg-[#D4AF37]/40" />
                                                                    <p className="text-3xl sm:text-4xl text-[#D4AF37] font-black uppercase tracking-[0.3em]">{item.responsable}</p>
                                                                    <div className="h-0.5 w-16 bg-[#D4AF37]/40" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {(focusedContent.metadata?.passages || []).map((pass, pi) => {
                                                    const id = `bible-${pi}`;
                                                    const isZoomed = zoomedElementId === id;
                                                    return (
                                                        <div key={id} onClick={(e) => { e.stopPropagation(); setZoomedElementId(isZoomed ? null : id); }} className={`cursor-zoom-in w-full space-y-12 transition-all duration-700 ${isZoomed ? 'scale-[1.1] sm:scale-[1.3] z-50 origin-top' : 'scale-100 z-10 opacity-60 hover:opacity-100'}`}>
                                                            <h3 className="text-7xl sm:text-9xl font-black text-emerald-400 text-center drop-shadow-2xl">{pass.reference}</h3>
                                                            {pass.text && (
                                                                <div className="bg-black/80 p-16 sm:p-24 rounded-[5rem] border-l-[24px] border-emerald-500 shadow-4xl backdrop-blur-2xl">
                                                                    <p className="text-5xl sm:text-7xl font-serif italic text-gray-100 leading-relaxed text-justify drop-shadow-lg font-medium">{pass.text}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {focusedContent.type === 'sermon' && (() => {
                                            const sermonSlides = parseSermonToSlides(service?.sermon?.content);
                                            // Insert title slide at position -1 logic: sermonSlideIndex -1 = title card
                                            const totalContentSlides = sermonSlides.length;
                                            const isOnTitleSlide = sermonSlideIndex === -1;
                                            const currentSlide = !isOnTitleSlide ? (sermonSlides[sermonSlideIndex] || null) : null;
                                            const isZoomed = !!zoomedElementId;

                                            const renderSlideContent = (slide) => {
                                                const baseText = slide.text;
                                                if (slide.type === 'image') return (
                                                    <img src={slide.src} alt={slide.alt} className={`rounded-[3rem] shadow-2xl transition-all duration-500 max-h-[80vh] object-contain ${isZoomed ? 'scale-110' : 'scale-90'}`} />
                                                );
                                                if (slide.type === 'h1') return (
                                                    <h1 className={`font-black text-[#D4AF37] drop-shadow-[0_20px_80px_rgba(212,175,55,0.5)] uppercase tracking-tighter leading-none text-center transition-all duration-500 ${isZoomed ? 'text-[9rem]' : 'text-7xl sm:text-8xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                );
                                                if (slide.type === 'h2') return (
                                                    <h2 className={`font-black text-white drop-shadow-2xl tracking-tight leading-tight text-center transition-all duration-500 ${isZoomed ? 'text-[8rem]' : 'text-6xl sm:text-7xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                );
                                                if (slide.type === 'h3') return (
                                                    <div className="flex flex-col items-center gap-6">
                                                        <div className="w-24 h-1 rounded-full bg-[#D4AF37]/50" />
                                                        <h3 className={`font-bold text-[#D4AF37]/90 tracking-wide italic text-center transition-all duration-500 ${isZoomed ? 'text-[7rem]' : 'text-5xl sm:text-6xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                        <div className="w-24 h-1 rounded-full bg-[#D4AF37]/50" />
                                                    </div>
                                                );
                                                if (slide.type === 'paragraph') return (
                                                    <p className={`text-gray-100 font-medium leading-relaxed max-w-[85vw] text-center transition-all duration-500 ${isZoomed ? 'text-7xl sm:text-8xl' : 'text-4xl sm:text-5xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                );
                                                if (slide.type === 'bullet') return (
                                                    <div className="flex items-start gap-10 text-left max-w-[85vw]">
                                                        <div className={`rounded-full bg-[#D4AF37] flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-500 ${isZoomed ? 'w-8 h-8 mt-6' : 'w-5 h-5 mt-4'}`} />
                                                        <p className={`text-gray-100 font-medium leading-relaxed transition-all duration-500 ${isZoomed ? 'text-7xl sm:text-8xl' : 'text-4xl sm:text-5xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                    </div>
                                                );
                                                if (slide.type === 'numbered') return (
                                                    <div className="flex items-start gap-10 text-left max-w-[85vw]">
                                                        <span className={`font-black text-[#D4AF37] flex-shrink-0 leading-tight transition-all duration-500 ${isZoomed ? 'text-8xl w-32' : 'text-5xl sm:text-6xl w-24'}`}>{slide.number}.</span>
                                                        <p className={`text-gray-100 font-medium leading-relaxed transition-all duration-500 ${isZoomed ? 'text-7xl sm:text-8xl' : 'text-4xl sm:text-5xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                    </div>
                                                );
                                                if (slide.type === 'blockquote') return (
                                                    <div className={`border-l-8 border-emerald-500/50 pl-16 text-left max-w-[85vw] py-10 pr-10 transition-all duration-500`}>
                                                        <p className={`font-serif italic text-white leading-relaxed transition-all duration-500 ${isZoomed ? 'text-7xl sm:text-8xl' : 'text-4xl sm:text-5xl'}`} dangerouslySetInnerHTML={{ __html: slide.html || baseText }} />
                                                        <div className="mt-8 w-32 h-1 bg-emerald-500/30 rounded-full" />
                                                    </div>
                                                );
                                                return null;
                                            };

                                            // Render as FULL SCREEN ABSOLUTE OVERLAY
                                            return (
                                                <div
                                                    className="absolute inset-0 z-[7000] flex flex-col overflow-hidden"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {totalContentSlides > 0 ? (
                                                        <>
                                                            {/* Bottom progress dots */}
                                                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                                                                {/* Title slide dot */}
                                                                <div
                                                                    onClick={() => { setSermonSlideIndex(-1); setZoomedElementId(null); }}
                                                                    className={`cursor-pointer rounded-full transition-all duration-300 ${isOnTitleSlide ? 'w-8 h-3 bg-[#D4AF37]' : 'w-3 h-3 bg-white/30 hover:bg-white/60'}`}
                                                                />
                                                                {sermonSlides.map((s, i) => (
                                                                    <div
                                                                        key={s.id}
                                                                        onClick={() => { setSermonSlideIndex(i); }}
                                                                        className={`cursor-pointer rounded-full transition-all duration-300 ${i === sermonSlideIndex ? 'w-8 h-3 bg-[#D4AF37]' : 'w-3 h-3 bg-white/30 hover:bg-white/60'}`}
                                                                    />
                                                                ))}
                                                            </div>

                                                            {/* Slide counter top-right */}
                                                            <div className="absolute top-8 right-8 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-xl px-5 py-2 rounded-full">
                                                                <span className="text-sm font-black text-[#D4AF37]">
                                                                    {isOnTitleSlide ? 'INTRO' : `${sermonSlideIndex + 1} / ${totalContentSlides}`}
                                                                </span>
                                                            </div>

                                                            {/* Back button top-left */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFocusedContent(null); setZoomedElementId(null); setLineSpotlight(null); }}
                                                                className="absolute top-8 left-8 z-10 flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-base font-black backdrop-blur-xl border border-white/10 text-white shadow-2xl"
                                                            >
                                                                <ArrowLeft size={20} /> {t('back', 'Retour')}
                                                            </button>

                                                            {/* ===== TITLE SLIDE (index -1) ===== */}
                                                            <AnimatePresence mode="wait">
                                                                {isOnTitleSlide ? (
                                                                    <motion.div
                                                                        key="sermon-title-slide"
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 1.05 }}
                                                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                                                        className="flex-1 w-full overflow-y-auto noscrollbar flex flex-col items-center justify-center text-center px-16 py-24 gap-10"
                                                                        onClick={() => { setZoomedElementId(isZoomed ? null : 'intro-slide'); }}
                                                                        style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                                                                    >
                                                                        {/* Decorative line */}
                                                                        <div className="w-40 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full mb-6 shrink-0" />

                                                                        {/* Main Title (H1) - White gradient & distinct font */}
                                                                        <h1 className={`font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-500 uppercase tracking-tight leading-tight drop-shadow-2xl transition-all duration-500 ${isZoomed ? 'text-[9rem]' : 'text-7xl sm:text-[7rem]'}`}>
                                                                            Message de la parole de Dieu
                                                                        </h1>

                                                                        {/* Simple Text (H5) - Bible reference points & actual title if exists */}
                                                                        {service?.sermon?.title && (
                                                                            <h5 className={`text-gray-200 font-bold tracking-wide mt-10 drop-shadow-md transition-all duration-500 ${isZoomed ? 'text-7xl' : 'text-5xl'}`}>
                                                                                {service.sermon.title}
                                                                            </h5>
                                                                        )}
                                                                        
                                                                        {service?.sermon?.points && service.sermon.points.length > 0 && (
                                                                            <div className="flex flex-col items-center gap-6 mt-6">
                                                                                {(Array.isArray(service.sermon.points) ? service.sermon.points : [service.sermon.points]).map((pt, pi) => (
                                                                                    <h5 key={pi} className={`text-gray-400 font-serif italic font-light tracking-wide transition-all duration-500 ${isZoomed ? 'text-5xl' : 'text-3xl'}`}>{pt}</h5>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Preacher (H3) & Metadata (H4) */}
                                                                        <div className="flex flex-col items-center gap-12 mt-16">
                                                                            {/* Nom du responsable (H3) */}
                                                                            {service?.sermon?.preacher && (
                                                                                <div className="flex items-center gap-10 bg-white/5 py-6 px-12 rounded-full border border-white/10 shadow-2xl backdrop-blur-md">
                                                                                    {service.sermon.preacher.photo && (
                                                                                        <img src={service.sermon.preacher.photo} alt="" className={`rounded-full border-2 border-white/20 object-cover shadow-inner transition-all duration-500 ${isZoomed ? 'w-32 h-32' : 'w-24 h-24'}`} />
                                                                                    )}
                                                                                    <h3 className={`text-white font-bold uppercase tracking-[0.2em] opacity-95 transition-all duration-500 ${isZoomed ? 'text-6xl' : 'text-4xl'}`}>
                                                                                        {service.sermon.preacher.firstName} {service.sermon.preacher.lastName}
                                                                                    </h3>
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {/* Contenu / Notes (H4) */}
                                                                            <div className="flex items-center gap-6 mt-2 opacity-70">
                                                                                <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-white/50" />
                                                                                <h4 className={`text-white font-semibold uppercase tracking-[0.3em] transition-all duration-500 ${isZoomed ? 'text-[20px]' : 'text-[14px]'}`}>
                                                                                    Contenu / Notes
                                                                                </h4>
                                                                                <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-white/50" />
                                                                            </div>
                                                                        </div>

                                                                        <div className="w-40 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full mt-10 shrink-0" />

                                                                        {/* "Tap to start" hint */}
                                                                        <p className="text-lg text-white/30 font-bold uppercase tracking-widest mt-8 animate-pulse shrink-0">
                                                                            {isZoomed ? 'Cliquez pour dézoomer' : 'Cliquez pour zoomer'}
                                                                        </p>
                                                                    </motion.div>
                                                                ) : (
                                                                    /* ===== CONTENT SLIDE ===== */
                                                                    <motion.div
                                                                        key={`sermon-slide-${sermonSlideIndex}`}
                                                                        initial={{ opacity: 0, x: 60 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        exit={{ opacity: 0, x: -60 }}
                                                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                                                        className="flex-1 w-full overflow-y-auto noscrollbar flex flex-col px-16 sm:px-32"
                                                                        onClick={() => setZoomedElementId(isZoomed ? null : `s-${currentSlide?.id}`)}
                                                                        style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
                                                                    >
                                                                        {currentSlide && (
                                                                            <>
                                                                                <div className="flex-grow shrink-0" />
                                                                                <div className={`w-full py-24 flex justify-center shrink-0 transition-all duration-500`}>
                                                                                    {renderSlideContent(currentSlide)}
                                                                                </div>
                                                                                <div className="flex-grow shrink-0" />
                                                                            </>
                                                                        )}

                                                                        {/* Type badge bottom center */}
                                                                        {currentSlide && !isZoomed && (
                                                                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
                                                                                <span className={`text-xs font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border ${
                                                                                    currentSlide.type === 'h1' ? 'border-[#D4AF37]/30 text-[#D4AF37]/60'
                                                                                    : currentSlide.type === 'blockquote' ? 'border-emerald-400/30 text-emerald-400/60'
                                                                                    : 'border-white/10 text-white/30'
                                                                                }`}>
                                                                                    {currentSlide.type === 'h1' ? 'Titre Principal'
                                                                                    : currentSlide.type === 'h2' ? 'Sous-Titre'
                                                                                    : currentSlide.type === 'h3' ? 'Section'
                                                                                    : currentSlide.type === 'bullet' ? '● Point'
                                                                                    : currentSlide.type === 'numbered' ? `${currentSlide.number}. Point`
                                                                                    : currentSlide.type === 'blockquote' ? '« Texte Biblique »'
                                                                                    : 'Paragraphe'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>

                                                            {/* Left/Right nav arrows */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); if (sermonSlideIndex === 0) { setSermonSlideIndex(-1); setZoomedElementId(null); } else setSermonSlideIndex(p => Math.max(-1, p - 1)); }}
                                                                disabled={isOnTitleSlide}
                                                                className="absolute left-6 top-1/2 -translate-y-1/2 p-5 bg-black/30 hover:bg-black/60 disabled:opacity-0 rounded-full text-white/60 hover:text-white transition-all backdrop-blur-xl"
                                                            >
                                                                <ChevronLeft size={40} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSermonSlideIndex(p => Math.min(totalContentSlides - 1, p + 1)); }}
                                                                disabled={sermonSlideIndex === totalContentSlides - 1}
                                                                className="absolute right-6 top-1/2 -translate-y-1/2 p-5 bg-[#D4AF37]/80 hover:bg-[#D4AF37] disabled:opacity-20 rounded-full text-white transition-all shadow-[0_10px_40px_rgba(212,175,55,0.3)]"
                                                            >
                                                                <ChevronRight size={40} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setFocusedContent(null); setZoomedElementId(null); setLineSpotlight(null); }}
                                                                className="absolute top-8 left-8 z-10 flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-base font-black backdrop-blur-xl border border-white/10 text-white shadow-2xl"
                                                            >
                                                                <ArrowLeft size={20} /> {t('back', 'Retour')}
                                                            </button>
                                                            <p className="text-2xl text-gray-500 font-bold tracking-widest uppercase">Aucun contenu de message</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {focusedContent.type === 'image' && (() => {
                                            const mediaUrl = getMediaUrl(focusedContent.metadata?.url || (focusedContent.metadata?.contents?.[0]?.url));
                                            return mediaUrl ? (
                                                <div className="w-full flex items-center justify-center">
                                                    <img
                                                        src={mediaUrl}
                                                        alt={focusedContent.label}
                                                        className="w-full h-auto max-h-[80vh] object-contain rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-96 flex items-center justify-center rounded-[4rem] border-2 border-dashed border-white/20">
                                                    <p className="text-4xl text-gray-500 font-black uppercase tracking-widest">Aucune image</p>
                                                </div>
                                            );
                                        })()}

                                        {focusedContent.type === 'video' && (() => {
                                            const mediaUrl = getMediaUrl(focusedContent.metadata?.url || (focusedContent.metadata?.contents?.[0]?.url));
                                            return mediaUrl ? (
                                                <div className="w-full flex items-center justify-center">
                                                    <video
                                                        src={mediaUrl}
                                                        controls
                                                        autoPlay
                                                        className="w-full h-auto max-h-[80vh] rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-96 flex items-center justify-center rounded-[4rem] border-2 border-dashed border-white/20">
                                                    <p className="text-4xl text-gray-500 font-black uppercase tracking-widest">Aucune vidéo</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        ) : currentSlideIndex === -1 ? (
                            <motion.div
                                key="intro-slide"
                                {...currentVariant}
                                transition={{ duration: 0.8, ease: "circOut" }}
                                className="w-full h-full flex flex-col items-center justify-center text-center space-y-12"
                            >
                                <Rnd
                                    size={blockLayouts['intro']?.size || { width: '100%', height: 'auto' }}
                                    position={blockLayouts['intro']?.position || { x: 0, y: 0 }}
                                    onDragStop={(e, d) => handleUpdateLayout('intro', { position: { x: d.x, y: d.y } })}
                                    onResizeStop={(e, dir, ref, delta, pos) => handleUpdateLayout('intro', { size: { width: ref.style.width, height: ref.style.height }, position: pos })}
                                    disableDragging={!projectionMode}
                                    enableResizing={projectionMode}
                                    className="flex flex-col items-center justify-center"
                                >
                                    {churchData?.logoUrl && (
                                        <motion.img 
                                            initial={{ scale: 0.8, opacity: 0 }} 
                                            animate={{ scale: 1, opacity: 1 }}
                                            src={churchData.logoUrl} 
                                            className="w-56 h-56 mb-12 rounded-full border-8 border-white/5 p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-xl" 
                                        />
                                    )}
                                    <h1 className="text-7xl sm:text-[10rem] font-black text-[#D4AF37] uppercase tracking-tighter drop-shadow-[0_20px_80px_rgba(0,0,0,0.9)] leading-none">
                                        {service?.theme || t('worship_program', 'Programme du Culte')}
                                    </h1>
                                    <div className="w-64 h-3 bg-[#D4AF37] mt-12 rounded-full shadow-[0_0_60px_rgba(212,175,55,0.8)]" />
                                    <p className="mt-12 text-3xl font-bold text-gray-300 uppercase tracking-[0.4em] opacity-60">
                                        {new Date(service?.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </Rnd>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`slide-${currentSlideIndex}`}
                                {...currentVariant}
                                transition={{ duration: 0.8, ease: "circOut" }}
                                className="w-full h-full flex flex-col items-center justify-center"
                            >
                                {(() => {
                                    const block = sortedBlocks[currentSlideIndex];
                                    if (!block) return null;
                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                                            <div className="absolute top-0 opacity-20 text-white font-black text-xl tracking-[0.8em] uppercase">
                                                {toRoman(currentSlideIndex + 1)}. {t(block.label, block.label)}
                                            </div>

                                            <Rnd
                                                size={blockLayouts[block.id]?.size || { width: '100%', height: 'auto' }}
                                                position={blockLayouts[block.id]?.position || { x: 0, y: 0 }}
                                                onDragStop={(e, d) => handleUpdateLayout(block.id, { position: { x: d.x, y: d.y } })}
                                                onResizeStop={(e, dir, ref, delta, pos) => handleUpdateLayout(block.id, { size: { width: ref.style.width, height: ref.style.height }, position: pos })}
                                                className="flex flex-col items-center justify-center w-full"
                                                bounds="parent"
                                                disableDragging={!projectionMode}
                                                enableResizing={projectionMode}
                                            >
                                                <div className="w-full flex-1 flex flex-col items-center justify-center space-y-16 py-20 px-12 group cursor-zoom-in hover:bg-white/5 transition-colors rounded-[4rem]" onClick={(e) => { e.stopPropagation(); setFocusedContent(block); setSermonSlideIndex(-1); setZoomedElementId(null); }}>
                                                    {(block.metadata?.songs || []).map((song, si) => (
                                                        <div key={`song-${si}`} className="w-full text-center space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
                                                            <h3 className="text-7xl sm:text-[8rem] font-black text-blue-400 drop-shadow-[0_20px_80px_rgba(0,0,0,0.8)] italic tracking-tight group-hover:scale-105 transition-transform">« {song.title} »</h3>
                                                            {song.lyrics && (
                                                                <div className="bg-black/40 p-16 sm:p-24 rounded-[4rem] border border-white/10 shadow-4xl backdrop-blur-3xl transform group-hover:scale-[1.02] transition-transform">
                                                                    <p className="text-5xl sm:text-[6.5rem] font-black text-white leading-tight whitespace-pre-wrap tracking-tight drop-shadow-lg">{song.lyrics.length > 80 ? song.lyrics.substring(0, 80) + '...' : song.lyrics}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {(block.metadata?.contents || []).map((item, ci) => (
                                                        <div key={`content-${ci}`} className="w-full text-center bg-black/50 p-16 sm:p-24 rounded-[5rem] border border-white/5 shadow-3xl backdrop-blur-xl animate-in fade-in zoom-in duration-700">
                                                            {(item.type === 'image' || item.type === 'video') && item.url ? (
                                                                item.type === 'image' ? (
                                                                    <img src={getMediaUrl(item.url)} alt="" className="w-full h-auto max-h-[40vh] object-contain rounded-3xl mx-auto" />
                                                                ) : (
                                                                    <video src={getMediaUrl(item.url)} muted autoPlay loop className="w-full h-auto max-h-[40vh] object-contain rounded-3xl mx-auto" />
                                                                )
                                                            ) : item.content ? (
                                                                <p className="text-6xl sm:text-[7.5rem] font-black text-gray-50 leading-tight drop-shadow-xl">{item.content.length > 60 ? item.content.substring(0, 60) + '...' : item.content}</p>
                                                            ) : null}
                                                            {item.responsable && (
                                                                <div className="mt-16 flex items-center justify-center gap-6">
                                                                    <div className="h-0.5 w-16 bg-[#D4AF37]/40" />
                                                                    <p className="text-3xl sm:text-4xl text-[#D4AF37] font-black uppercase tracking-[0.3em]">{item.responsable}</p>
                                                                    <div className="h-0.5 w-16 bg-[#D4AF37]/40" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {(block.metadata?.passages || []).map((pass, pi) => (
                                                        <div key={`bible-${pi}`} className="w-full space-y-12 animate-in slide-in-from-right-12 duration-1000">
                                                            <h3 className="text-7xl sm:text-9xl font-black text-emerald-400 text-center drop-shadow-2xl group-hover:scale-105 transition-transform">{pass.reference}</h3>
                                                            {pass.text && (
                                                                <div className="bg-black/60 p-16 sm:p-24 rounded-[5rem] border-l-[24px] border-emerald-500 shadow-4xl backdrop-blur-2xl group-hover:bg-black/80 transition-colors">
                                                                    <p className="text-5xl sm:text-7xl font-serif italic text-gray-100 leading-relaxed text-justify drop-shadow-lg font-medium">{pass.text.length > 120 ? pass.text.substring(0, 120) + '...' : pass.text}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {block.type === 'sermon' && (
                                                        <div className="w-full text-center space-y-12">
                                                            <h3 className="text-7xl sm:text-9xl font-black text-[#D4AF37] group-hover:scale-110 transition-transform duration-700 uppercase tracking-tighter drop-shadow-3xl">
                                                                Message de la parole de Dieu
                                                            </h3>
                                                            <div className="w-48 h-2 bg-[#D4AF37] mx-auto rounded-full opacity-40" />
                                                        </div>
                                                    )}

                                                    {(block.type === 'image') && (() => {
                                                        const mediaUrl = getMediaUrl(block.metadata?.url || block.metadata?.contents?.[0]?.url);
                                                        return mediaUrl ? (
                                                            <div className="w-full flex items-center justify-center">
                                                                <img
                                                                    src={mediaUrl}
                                                                    alt={block.label}
                                                                    className="w-full h-auto max-h-[55vh] object-contain rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-64 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/20 gap-6">
                                                                <ImageIcon size={64} className="text-white/20" />
                                                                <p className="text-3xl text-gray-500 font-black uppercase tracking-widest">Aucune image</p>
                                                            </div>
                                                        );
                                                    })()}

                                                    {(block.type === 'video') && (() => {
                                                        const mediaUrl = getMediaUrl(block.metadata?.url || block.metadata?.contents?.[0]?.url);
                                                        return mediaUrl ? (
                                                            <div className="w-full flex items-center justify-center">
                                                                <video
                                                                    src={mediaUrl}
                                                                    muted
                                                                    autoPlay
                                                                    loop
                                                                    className="w-full h-auto max-h-[55vh] rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-64 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/20 gap-6">
                                                                <Video size={64} className="text-white/20" />
                                                                <p className="text-3xl text-gray-500 font-black uppercase tracking-widest">Aucune vidéo</p>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </Rnd>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- NAVIGATION & TOOLS (Floating UI) --- */}
                <div className="fixed bottom-12 inset-x-0 z-[6000] flex flex-col items-center gap-6 pointer-events-none group">
                    <AnimatePresence>
                        {showBgSelector && (
                            <motion.div
                                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-full mb-8 right-12 pointer-events-auto bg-black/90 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/10 w-[280px] shadow-4xl max-h-[70vh] overflow-y-auto noscrollbar"
                            >
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase mr-3">Opacité</span>
                                        <input type="range" min="0" max="0.95" step="0.05" value={bgOverlayOpacity} onChange={e => setBgOverlayOpacity(parseFloat(e.target.value))} className="w-full accent-[#D4AF37]" />
                                    </div>
                                </div>

                                {/* Custom background / Upload input */}
                                <div className="px-2 mb-6">
                                    <div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            id="local-bg-upload" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const objectUrl = URL.createObjectURL(file);
                                                    const newBg = { id: 'local_' + Date.now(), label: 'Tél. ' + (localBackgrounds.length + 1), type: 'image', value: objectUrl };
                                                    setLocalBackgrounds(prev => [newBg, ...prev]);
                                                    setProjectionBackground(newBg);
                                                    toast.success("Image importée (temporaire)");
                                                }
                                            }} 
                                        />
                                        <label 
                                            htmlFor="local-bg-upload" 
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl cursor-pointer transition-colors"
                                        >
                                            <Play size={14} className="text-[#D4AF37] rotate-90" />
                                            <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Image locale</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 px-2 pb-6">
                                    {[...localBackgrounds, ...bgTemplates].map(bg => (
                                        <button 
                                            key={bg.id} 
                                            onClick={(e) => { e.stopPropagation(); setProjectionBackground(bg); setShowBgSelector(false); }} 
                                            className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-300 ${projectionBackground.id === bg.id ? 'border-[#D4AF37] scale-110 z-10 shadow-2xl shadow-[#D4AF37]/30' : 'border-white/10 hover:border-white/30 hover:scale-105'}`}
                                            title={bg.label}
                                        >
                                            {bg.type === 'image' ? (
                                                <img src={bg.value} alt={bg.label} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full" style={{ background: bg.css || '#000' }} />
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[8px] font-black text-white uppercase text-center truncate">{bg.label}</p>
                                            </div>
                                            {projectionBackground.id === bg.id && (
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
                                                    <span className="text-[8px] text-black font-black">✓</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-auto relative flex items-center gap-6 p-4 bg-black/70 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl transition-all duration-500 opacity-0 hover:opacity-100 translate-y-8 hover:translate-y-0"
                    >
                        {/* Invisible padding to catch hover before hitting the toolbar */ }
                        <div className="absolute -inset-x-12 -inset-y-12 bg-transparent -z-10" />
                        
                        <div className="flex items-center gap-2 px-6 border-r border-white/10">
                            {['fade', 'slide', 'zoom', 'none'].map(t => (
                                <button key={t} onClick={() => setActiveTransitionType(t)} className={`px-6 py-3 rounded-full text-xs font-black uppercase transition-all ${activeTransitionType === t ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-4 border-r border-white/10 px-6">
                            <button onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, -1))} className="p-4 bg-white/5 hover:bg-white/20 rounded-2xl text-white"><ChevronLeft size={28}/></button>
                            <div className="flex flex-col items-center min-w-[4rem]">
                                <span className="text-[#D4AF37] font-black text-2xl leading-none">{currentSlideIndex === -1 ? '00' : (currentSlideIndex + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[9px] text-gray-500 font-black uppercase mt-1">Séquence</span>
                            </div>
                            <button onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, blocks.length - 1))} className="p-4 bg-[#D4AF37] hover:bg-[#B8962E] rounded-2xl text-white shadow-[0_10px_30px_rgba(212,175,55,0.3)]"><ChevronRight size={28}/></button>
                        </div>
                        
                        <div className="flex items-center gap-4 border-r border-white/10 px-6 text-white min-w-[150px] justify-center">
                            <button onClick={() => setGlobalZoom(prev => Math.max(0.2, prev - 0.1))} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><ZoomOut size={20}/></button>
                            <span className="text-xs font-black font-sans">{Math.round(globalZoom * 100)}%</span>
                            <button onClick={() => setGlobalZoom(prev => Math.min(4, prev + 0.1))} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><ZoomIn size={20}/></button>
                        </div>

                        <div className="flex items-center gap-4 px-6 border-r border-white/10">
                            <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className={`p-4 rounded-xl transition-all ${isAutoPlaying ? 'bg-emerald-500 shadow-lg text-white' : 'bg-white/5 text-gray-400'}`}>
                                {isAutoPlaying ? <Pause size={24}/> : <Play size={24}/>}
                            </button>
                            <button onClick={() => setShowClock(!showClock)} className={`p-4 rounded-xl transition-all ${showClock ? 'bg-[#D4AF37] text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white'}`} title="Heure"><Clock size={24}/></button>
                            <button onClick={() => setShowBgSelector(!showBgSelector)} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Arrière-plans"><ImageIcon size={24}/></button>
                            <button onClick={() => setIsBlackout(!isBlackout)} className={`p-4 rounded-xl transition-all ${isBlackout ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400'}`} title="Blackout (B)"><Monitor size={24}/></button>
                        </div>

                        <div className="px-6">
                            <button onClick={() => { setProjectionMode(false); setLocalBackgrounds([]); if (document.fullscreenElement) document.exitFullscreen(); }} className="p-4 bg-red-500/80 hover:bg-red-500 rounded-2xl text-white shadow-xl transition-all"><X size={28}/></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    if (presentationMode) {
        return (
            <div className="fixed inset-0 z-[500] bg-[#FAFAF5] overflow-y-auto animate-in fade-in duration-500 print:bg-white pb-20 font-serif">
                {/* Modern Fixed Header (Admin Only) */}
                <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between print:hidden shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#3E322B] rounded-xl flex items-center justify-center text-white">
                            <Layers size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider text-serif">Aperçu du Programme</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={exportToPDF} className="flex items-center gap-2 px-5 py-2.5 bg-[#3E322B] text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all">
                            <Save size={16} /> Imprimer / PDF
                        </button>
                        <button onClick={() => setPresentationMode(false)} className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div id="programme-export-zone" className="max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none print:w-full print:max-w-none">
                    <style>{`
                        @page { size: letter; margin: 15mm; }
                        body { background: white !important; }
                    `}</style>
                    {/* Header: Deep Coffee Background */}
                    <div className="bg-[#3E322B] text-center py-6 px-6 space-y-2 relative">
                        {churchData?.logoUrl && (
                            <img src={churchData.logoUrl.startsWith('http') ? churchData.logoUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${churchData.logoUrl}`} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain rounded-full bg-white/10" />
                        )}
                        <p className="text-[#D4AF37] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">{churchData?.name || 'ÉGLISE ADVENTISTE DU 7ÈME JOUR'}</p>
                        <h1 className="text-3xl sm:text-5xl text-white font-bold leading-tight">
                            Programme du Culte
                        </h1>
                        <p className="text-[#D4AF37] text-lg sm:text-xl italic">
                            {service?.theme ? `Thème Spécial : ${service.theme}` : 'Le Déroulement du Culte'}
                        </p>
                        <div className="text-[#D4AF37] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest pt-2 flex flex-wrap justify-center gap-2 sm:gap-4">
                            <span>{new Date(service?.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
                            <span className="opacity-50 inline">•</span>
                            <span>{service?.time?.replace(':', 'H') || '08H00'}</span>
                        </div>
                    </div>

                    {/* Body: Classic Document Flow */}
                    <div className="px-10 py-4 sm:px-16 space-y-3 bg-[#FAFAF5]">
                        <div className="space-y-3">
                            {blocks.sort((a, b) => a.orderIndex - b.orderIndex).map((block, i) => (
                                <div key={block.id} className="space-y-2">
                                    <h3 className="text-[12px] sm:text-[14px] text-[#3E322B] font-bold border-b border-[#3E322B]/10 pb-0.5 uppercase">
                                        {toRoman(i + 1)}. {t(block.label, block.label)}
                                    </h3>

                                    <div className="grid grid-cols-1 gap-1">
                                        {/* Contents (Responsabilités) */}
                                        {(block.metadata?.contents || []).map((item) => (
                                            <div key={item.id} className="flex justify-between items-baseline gap-4 text-[11px]">
                                                <span className="text-[#3E322B] font-medium leading-tight">{item.content}</span>
                                                {item.responsable && <span className="text-[#3E322B]/60 italic font-medium whitespace-nowrap">{item.responsable}</span>}
                                            </div>
                                        ))}

                                        {/* Songs */}
                                        {(block.metadata?.songs || []).map((song) => (
                                            <div key={song.id} className="space-y-0.5 border-l border-[#D4AF37]/30 pl-3">
                                                <div className="flex justify-between items-baseline gap-4 text-[11px]">
                                                    <span className="text-[#3E322B] font-bold italic">« {song.title} »</span>
                                                    {song.responsable && <span className="text-[#3E322B]/60 italic font-medium whitespace-nowrap">Dirigé par {song.responsable}</span>}
                                                </div>
                                                {song.lyrics && <p className="text-[10px] text-gray-500 italic leading-tight">{song.lyrics.split('\n').join(' / ')}</p>}
                                            </div>
                                        ))}

                                        {/* Bible Readings */}
                                        {(block.metadata?.passages || []).map((pass) => (
                                            <div key={pass.id} className="space-y-0.5 border-l border-[#3E322B]/10 pl-3">
                                                <div className="flex justify-between items-baseline gap-4 text-[11px]">
                                                    <span className="text-[#3E322B] font-bold">Lecture : {pass.reference}</span>
                                                    {pass.responsable && <span className="text-[#3E322B]/60 italic font-medium whitespace-nowrap">{pass.responsable}</span>}
                                                </div>
                                                {pass.text && <p className="text-[10px] text-gray-500 italic leading-tight text-justify line-clamp-2">"{pass.text}"</p>}
                                            </div>
                                        ))}

                                        {/* Legacy fallback */}
                                        {(!block.metadata?.contents && !block.metadata?.songs && !block.metadata?.passages && (block.metadata?.responsable || block.metadata?.content)) && (
                                            <div key="legacy" className="flex justify-between items-baseline gap-4 text-[11px]">
                                                <span className="text-[#3E322B] font-medium leading-tight">{block.metadata.content}</span>
                                                {block.metadata.responsable && <span className="text-[#3E322B]/60 italic font-medium whitespace-nowrap">{block.metadata.responsable}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer: Matching Header Style */}
                    <div className="bg-[#3E322B] py-6 px-6 text-center space-y-4">
                        <p className="text-[#D4AF37] text-xl italic font-serif">« Que Dieu vous bénisse »</p>
                        <div className="space-y-1.5 flex flex-col items-center">
                            <p className="text-[#D4AF37]/70 text-[9px] font-bold uppercase tracking-widest">
                                {churchData?.name || 'Église Adventiste du 7ème Jour'}
                                {churchData?.address && ` — ${churchData.address}`}
                            </p>
                            {(churchData?.contactPhone || churchData?.churchEmail || churchData?.contactEmail) && (
                                <p className="text-[#D4AF37]/50 text-[8px] uppercase tracking-widest">
                                    {churchData.contactPhone && `${churchData.contactPhone}`}
                                    {churchData.contactPhone && (churchData.churchEmail || churchData.contactEmail) && ' | '}
                                    {(churchData.churchEmail || churchData.contactEmail) && `${churchData.churchEmail || churchData.contactEmail}`}
                                </p>
                            )}
                            <p className="text-[#D4AF37]/40 text-[8px] uppercase tracking-tighter pt-2 border-t border-[#D4AF37]/10 w-fit">
                                Un programme propulsé par <span className="font-bold text-[#D4AF37]/60">Elyon360</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="p-4 lg:p-8 animate-in fade-in duration-500 h-full flex flex-col">
                {/* Header Subnav */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/worship')}
                            className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-primary transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                {service?.theme || t('worship_schedule', 'Déroulement du culte')}
                            </h1>
                            <p className="text-sm text-gray-500 font-medium flex gap-2">
                                <span>{new Date(service?.date).toLocaleDateString()}</span> • <span>{service?.time}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPresentationMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111C44] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold hover:border-brand-primary transition-all"
                        >
                            <Book size={16} /> {t('presentation_mode', 'Mode Présentation')}
                        </button>
                        <button
                            onClick={() => { setProjectionMode(true); setCurrentSlideIndex(0); setIsAutoPlaying(false); }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
                        >
                            <Monitor size={16} /> {t('projection_mode', 'Projection')}
                        </button>
                        <button
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-primary/30 disabled:opacity-50"
                        >
                            <Save size={16} /> {isExporting ? t('exporting', 'Export...') : t('convert_to_pdf', 'Convertir en PDF')}
                        </button>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#111C44] p-1 rounded-2xl w-max mb-6">
                    <button
                        onClick={() => setActiveTab('blocks')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'blocks' ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Layers size={18} /> {t('schedule_tab', 'Déroulement')}
                    </button>
                    <button
                        onClick={() => setActiveTab('sermon')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'sermon' ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <PenTool size={18} /> {t('sermon_tab', 'Message & Prédication')}
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-white/10 text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <MessageSquare size={18} /> {t('notes_tab', 'Notes & Commentaires')}
                    </button>
                </div>

                {activeTab === 'blocks' ? (
                    <div className="flex flex-1 gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Left Panel: Available Blocks Toolkit */}
                        <div className="w-56 shrink-0 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-250px)] noscrollbar pr-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{t('add_block', 'Ajouter un bloc')}</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {blockTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleAddBlock(type.id, t(type.id, type.label))}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-[#111C44] border border-gray-100 dark:border-white/5 rounded-xl hover:border-brand-primary hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            {type.icon}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-primary">{t(type.id, type.label)}</span>
                                        <Plus size={14} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Service Canvas (Drag & Drop) */}
                        <div id="programme-export-zone" className="flex-1 bg-gray-50/50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 p-6 overflow-y-auto noscrollbar">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">{t('block_list_title', 'Déroulement')} ({blocks.length} {t('steps', 'étapes')})</h3>

                            {blocks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 bg-white dark:bg-[#111C44] rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/5 mb-4">
                                        <ArrowLeft size={24} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">{t('click_left_to_build', 'Cliquez sur un bloc à gauche pour construire votre culte.')}</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="worship-blocks">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                {blocks.map((block, index) => {
                                                    const typeInfo = blockTypes.find(t => t.id === block.type) || blockTypes[0];

                                                    return (
                                                        <Draggable key={block.id.toString()} draggableId={block.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`relative transition-all ${snapshot.isDragging ? 'z-50' : ''}`}
                                                                >
                                                                    <div
                                                                        className={`
                                                                        bg-white dark:bg-[#111C44] border rounded-2xl p-4 flex items-center gap-4 group transition-all
                                                                        ${snapshot.isDragging ? 'shadow-xl border-brand-primary rotate-1' : 'border-gray-200 dark:border-white/10 shadow-sm hover:border-brand-primary/50'}
                                                                    `}
                                                                    >
                                                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-brand-primary">
                                                                            <GripVertical size={20} />
                                                                        </div>

                                                                        <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-brand-primary">
                                                                            {typeInfo.icon}
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <input
                                                                                type="text"
                                                                                value={block.label}
                                                                                onChange={(e) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, label: e.target.value } : b))}
                                                                                onBlur={(e) => handleUpdateBlockLabel(block.id, e.target.value)}
                                                                                className="font-bold text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/50 rounded px-1 -ml-1 w-full truncate"
                                                                            />
                                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 px-1 flex items-center gap-2">
                                                                                {t('block', 'Bloc')} {index + 1}
                                                                                {block.type === 'song' && block.metadata?.songTitle && <span className="opacity-70 truncate">- {block.metadata.songTitle}</span>}
                                                                                {block.type === 'reading' && block.metadata?.passage && <span className="opacity-70 truncate">- {block.metadata.passage}</span>}
                                                                            </p>
                                                                        </div>

                                                                        {/* Specific block action buttons */}
                                                                        {block.type === 'reading' && (
                                                                            <button
                                                                                onClick={() => openBibleModal(block.id)}
                                                                                className="px-3 py-1.5 text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-lg transition-colors"
                                                                            >
                                                                                {block.metadata?.passage ? t('modify_passage', 'Modifier le passage') : t('bible_selector', 'Sélecteur Biblique')}
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            onClick={() => toggleExpand(block.id)}
                                                                            className="p-1 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors mr-2"
                                                                        >
                                                                            {expandedBlockId === block.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeleteBlock(block.id)}
                                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Accordion Content Form */}
                                                                    {expandedBlockId === block.id && (
                                                                        <div className="mt-2 ml-12 mr-12 p-5 bg-gray-50 dark:bg-white/5 rounded-xl text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 space-y-6 shadow-inner">

                                                                            {/* Song management: list + library picker for any block that has songs or is a song block */}
                                                                            {(block.type === 'song' || (block.metadata?.songs && block.metadata.songs.length > 0)) && (() => {
                                                                                const blockSongs = block.metadata?.songs || (
                                                                                    block.metadata?.songId
                                                                                        ? [{ id: block.metadata.songId.toString(), songId: block.metadata.songId, title: block.metadata.songTitle || '', lyrics: block.metadata.songLyrics || '' }]
                                                                                        : []
                                                                                );
                                                                                return (
                                                                                    <div className="space-y-3">
                                                                                        {/* Selected songs (draggable) */}
                                                                                        {blockSongs.length > 0 && (
                                                                                            <div className="space-y-1.5">
                                                                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                                                                    <Music size={10} /> {t('selected_songs', 'Chants sélectionnés')} ({blockSongs.length})
                                                                                                </label>
                                                                                                <Droppable droppableId={`songs-${block.id}`} type="SONG">
                                                                                                    {(songProvided) => (
                                                                                                        <div {...songProvided.droppableProps} ref={songProvided.innerRef} className="space-y-1.5">
                                                                                                            {blockSongs.map((songItem, sIdx) => (
                                                                                                                <Draggable key={songItem.id} draggableId={`song-item-${block.id}-${songItem.id}`} index={sIdx}>
                                                                                                                    {(sDrag, sSnap) => (
                                                                                                                        <div
                                                                                                                            ref={sDrag.innerRef}
                                                                                                                            {...sDrag.draggableProps}
                                                                                                                            className={`bg-white dark:bg-[#111C44] border rounded-2xl overflow-hidden transition-all ${sSnap.isDragging ? 'border-brand-primary shadow-2xl scale-[1.01] rotate-1' : 'border-gray-100 dark:border-white/5 shadow-sm'}`}
                                                                                                                        >
                                                                                                                            {/* Header: drag + icon + title + remove */}
                                                                                                                            <div className={`flex items-center gap-2 px-3 py-2 border-b ${sSnap.isDragging ? 'border-brand-primary/20 bg-brand-primary/5' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5'}`}>
                                                                                                                                <div {...sDrag.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-brand-primary transition-colors p-1">
                                                                                                                                    <GripVertical size={14} />
                                                                                                                                </div>
                                                                                                                                <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
                                                                                                                                    <Music size={11} />
                                                                                                                                </div>
                                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                                    <p className="text-xs font-black text-gray-800 dark:text-white truncate">{sIdx + 1}. {songItem.title}</p>
                                                                                                                                    {songItem.author && <p className="text-[10px] text-gray-400 truncate">{songItem.author}</p>}
                                                                                                                                </div>
                                                                                                                                <button onClick={() => handleRemoveSongFromBlock(block.id, songItem.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all shrink-0" title="Retirer ce chant">
                                                                                                                                    <X size={12} />
                                                                                                                                </button>
                                                                                                                            </div>

                                                                                                                            {/* Body: properties */}
                                                                                                                            <div className="p-3 space-y-2.5">
                                                                                                                                {/* Responsable */}
                                                                                                                                <div className="relative">
                                                                                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block flex items-center gap-1">
                                                                                                                                        <UserCheck size={9} /> Responsable
                                                                                                                                    </label>
                                                                                                                                    <input
                                                                                                                                        type="text"
                                                                                                                                        placeholder="Qui chante ce chant?"
                                                                                                                                        value={songItem.responsable || ''}
                                                                                                                                        onChange={e => handleLocalSongItemChange(block.id, songItem.id, 'responsable', e.target.value)}
                                                                                                                                        onBlur={() => handleSaveSongsDebounced(block.id)}
                                                                                                                                        onFocus={() => setShowSuggestions({ blockId: `song-${block.id}`, itemId: songItem.id })}
                                                                                                                                        className="w-full bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-transparent focus:border-brand-primary outline-none text-xs transition-all"
                                                                                                                                    />
                                                                                                                                    {showSuggestions?.blockId === `song-${block.id}` && showSuggestions?.itemId === songItem.id && (songItem.responsable || '').length >= 1 && (
                                                                                                                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a2855] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-36 overflow-y-auto noscrollbar">
                                                                                                                                            {[...members, ...groups]
                                                                                                                                                .filter(m => `${m.firstName || m.name || ''} ${m.lastName || ''}`.toLowerCase().includes((songItem.responsable || '').toLowerCase()))
                                                                                                                                                .slice(0, 6)
                                                                                                                                                .map(m => (
                                                                                                                                                    <button key={m.id} onMouseDown={() => {
                                                                                                                                                        handleLocalSongItemChange(block.id, songItem.id, 'responsable', m.firstName ? `${m.firstName} ${m.lastName}` : m.name);
                                                                                                                                                        setShowSuggestions(null);
                                                                                                                                                        setTimeout(() => handleSaveSongsDebounced(block.id), 100);
                                                                                                                                                    }} className="w-full text-left px-3 py-2 hover:bg-brand-primary/5 flex items-center gap-2 text-xs transition-colors">
                                                                                                                                                        {m.firstName ? <Users size={10} className="text-brand-primary" /> : <UsersIcon size={10} className="text-purple-500" />}
                                                                                                                                                        <span className="font-semibold">{m.firstName ? `${m.firstName} ${m.lastName}` : m.name}</span>
                                                                                                                                                    </button>
                                                                                                                                                ))
                                                                                                                                            }
                                                                                                                                        </div>
                                                                                                                                    )}
                                                                                                                                </div>

                                                                                                                                {/* Notes */}
                                                                                                                                <div>
                                                                                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block flex items-center gap-1">
                                                                                                                                        <MessageSquare size={9} /> Notes
                                                                                                                                    </label>
                                                                                                                                    <textarea
                                                                                                                                        placeholder="Notes, instructions, transitions..."
                                                                                                                                        rows={2}
                                                                                                                                        value={songItem.notes || ''}
                                                                                                                                        onChange={e => handleLocalSongItemChange(block.id, songItem.id, 'notes', e.target.value)}
                                                                                                                                        onBlur={() => handleSaveSongsDebounced(block.id)}
                                                                                                                                        className="w-full bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-transparent focus:border-brand-primary outline-none text-xs resize-none transition-all"
                                                                                                                                    />
                                                                                                                                </div>

                                                                                                                                {/* Lyrics & Chords Accordion */}
                                                                                                                                {(songItem.lyrics || songItem.chords) && (
                                                                                                                                    <div className="rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden bg-gray-50/50 dark:bg-white/2">
                                                                                                                                        <button 
                                                                                                                                            onClick={() => setExpandedLyrics(prev => prev === `${block.id}-${songItem.id}` ? null : `${block.id}-${songItem.id}`)}
                                                                                                                                            className="w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-all flex items-center justify-between group"
                                                                                                                                        >
                                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                                <Music size={11} className="group-hover:scale-110 transition-transform" /> 
                                                                                                                                                Paroles & Accords
                                                                                                                                            </div>
                                                                                                                                            <ChevronDown size={14} className={`transition-transform duration-300 ${expandedLyrics === `${block.id}-${songItem.id}` ? 'rotate-180' : ''}`} />
                                                                                                                                        </button>
                                                                                                                                        
                                                                                                                                        <div className={`transition-all duration-300 overflow-hidden ${expandedLyrics === `${block.id}-${songItem.id}` ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                                                                                            <div className="p-4 pt-0 space-y-4">
                                                                                                                                                {songItem.lyrics && (
                                                                                                                                                    <div className="space-y-1.5">
                                                                                                                                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Paroles</span>
                                                                                                                                                        <div className="text-[11px] italic text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto noscrollbar bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                                                                                                                                            {songItem.lyrics}
                                                                                                                                                        </div>
                                                                                                                                                    </div>
                                                                                                                                                )}
                                                                                                                                                {songItem.chords && (
                                                                                                                                                    <div className="space-y-1.5">
                                                                                                                                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Accords (Chords)</span>
                                                                                                                                                        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                                                                                                                                            {songItem.chords}
                                                                                                                                                        </div>
                                                                                                                                                    </div>
                                                                                                                                                )}
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    </div>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </Draggable>
                                                                                                            ))}
                                                                                                            {songProvided.placeholder}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </Droppable>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            {/* Draggable Sub-items */}
                                                                            {(() => {
                                                                                const contents = block.metadata?.contents || (
                                                                                    (block.metadata?.content || block.metadata?.responsable)
                                                                                        ? [{ id: 'legacy', type: 'full', responsable: block.metadata.responsable || '', content: block.metadata.content || '' }]
                                                                                        : []
                                                                                );
                                                                                return (
                                                                                    <Droppable droppableId={`subitems-${block.id}`} type="SUBITEM">
                                                                                        {(subProvided) => (
                                                                                            <div {...subProvided.droppableProps} ref={subProvided.innerRef} className="space-y-3">
                                                                                                {contents.map((item, idx) => (
                                                                                                    <Draggable key={item.id} draggableId={`subitem-${block.id}-${item.id}`} index={idx}>
                                                                                                        {(subDrag, subSnap) => (
                                                                                                            <div
                                                                                                                ref={subDrag.innerRef}
                                                                                                                {...subDrag.draggableProps}
                                                                                                                className={`relative p-3 bg-white dark:bg-[#111C44] rounded-xl border space-y-3 group/item transition-all ${subSnap.isDragging ? 'border-brand-primary shadow-xl rotate-1' : 'border-gray-100 dark:border-white/5'}`}
                                                                                                            >
                                                                                                                {/* Drag handle + delete */}
                                                                                                                <div className="flex items-center justify-between mb-1">
                                                                                                                    <div {...subDrag.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-brand-primary transition-colors">
                                                                                                                        <GripVertical size={16} />
                                                                                                                    </div>
                                                                                                                    <button
                                                                                                                        onClick={() => handleDeleteSubItem(block.id, item.id)}
                                                                                                                        className="w-7 h-7 bg-red-50 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                                                                                    >
                                                                                                                        <X size={12} />
                                                                                                                    </button>
                                                                                                                </div>

                                                                                                                {item.type === 'full' && (
                                                                                                                    <div className="space-y-3">
                                                                                                                        <div className="space-y-1">
                                                                                                                            <div className="flex items-center gap-2">
                                                                                                                                <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                                                                                                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('responsable', 'Responsable')}</label>
                                                                                                                            </div>
                                                                                                                            <div className="relative">
                                                                                                                                <input
                                                                                                                                    type="text"
                                                                                                                                    placeholder={t('responsable_placeholder', 'Ex: Pasteur Jean / Chorale...')}
                                                                                                                                    value={item.responsable || ''}
                                                                                                                                    onChange={e => { handleLocalSubItemChange(block.id, item.id, 'responsable', e.target.value); setShowSuggestions({ blockId: block.id, itemId: item.id }); }}
                                                                                                                                    onFocus={() => setShowSuggestions({ blockId: block.id, itemId: item.id })}
                                                                                                                                    onBlur={() => { handleSaveSubItemsDebounced(block.id); setTimeout(() => setShowSuggestions(null), 200); }}
                                                                                                                                    className="w-full bg-gray-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-transparent focus:border-brand-primary outline-none font-semibold text-sm pr-8"
                                                                                                                                />
                                                                                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size={12} /></div>
                                                                                                                                {showSuggestions?.blockId === block.id && showSuggestions?.itemId === item.id && (
                                                                                                                                    <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-[#1A1F37] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-2">
                                                                                                                                        {(() => {
                                                                                                                                            const q = (item.responsable || '').toLowerCase();
                                                                                                                                            const fm = members.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)).slice(0, 5);
                                                                                                                                            const fg = groups.filter(g => g.name.toLowerCase().includes(q)).slice(0, 5);
                                                                                                                                            if (!fm.length && !fg.length) return <div className="p-3 text-[10px] text-gray-400 text-center font-bold uppercase">{t('no_suggestions', 'Aucune suggestion')}</div>;
                                                                                                                                            return (
                                                                                                                                                <div className="space-y-1">
                                                                                                                                                    {fg.length > 0 && <><div className="px-2 py-1 text-[9px] font-black text-brand-primary/60 uppercase flex items-center gap-1"><UsersIcon size={9} />{t('groups', 'Groupes')}</div>{fg.map(g => <button key={`g-${g.id}`} className="w-full text-left px-3 py-2 hover:bg-brand-primary/10 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200" onMouseDown={() => { handleLocalSubItemChange(block.id, item.id, 'responsable', g.name); handleSaveSubItemsDebounced(block.id); }}>{g.name}</button>)}</>}
                                                                                                                                                    {fm.length > 0 && <><div className="px-2 py-1 text-[9px] font-black text-brand-primary/60 uppercase flex items-center gap-1 border-t border-gray-100 dark:border-white/5 pt-1 mt-1"><UserCheck size={9} />{t('members', 'Membres')}</div>{fm.map(m => <button key={`m-${m.id}`} className="w-full text-left px-3 py-2 hover:bg-brand-primary/10 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200" onMouseDown={() => { handleLocalSubItemChange(block.id, item.id, 'responsable', `${m.firstName} ${m.lastName}`); handleSaveSubItemsDebounced(block.id); }}>{m.firstName} {m.lastName}</button>)}</>}
                                                                                                                                                </div>
                                                                                                                                            );
                                                                                                                                        })()}
                                                                                                                                    </div>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                        <div className="space-y-1">
                                                                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('content_notes', 'Contenu / Notes')}</label>
                                                                                                                            <textarea
                                                                                                                                placeholder={t('content_placeholder', 'Ajoutez les détails ici...')}
                                                                                                                                rows={2}
                                                                                                                                value={item.content || ''}
                                                                                                                                onChange={e => handleLocalSubItemChange(block.id, item.id, 'content', e.target.value)}
                                                                                                                                onBlur={() => handleSaveSubItemsDebounced(block.id)}
                                                                                                                                className="w-full bg-gray-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-transparent focus:border-brand-primary outline-none resize-none text-sm"
                                                                                                                            />
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                )}

                                                                                                                {item.type === 'text_only' && (
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                                                                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Texte Simple</label>
                                                                                                                        </div>
                                                                                                                        <textarea
                                                                                                                            placeholder={t('content_placeholder', 'Ajoutez votre texte ici...')}
                                                                                                                            rows={2}
                                                                                                                            value={item.content || ''}
                                                                                                                            onChange={e => handleLocalSubItemChange(block.id, item.id, 'content', e.target.value)}
                                                                                                                            onBlur={() => handleSaveSubItemsDebounced(block.id)}
                                                                                                                            className="w-full bg-gray-50 dark:bg-white/5 px-4 py-2.5 rounded-xl border border-transparent focus:border-brand-primary outline-none resize-none text-sm italic"
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                )}

                                                                                                                {item.type === 'image' && (
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-500 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                                                                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-pink-500">{t('image', 'Image')}</label>
                                                                                                                        </div>
                                                                                                                        <input
                                                                                                                            type="file"
                                                                                                                            accept="image/*"
                                                                                                                            onChange={async (e) => {
                                                                                                                                const file = e.target.files[0];
                                                                                                                                if (file) {
                                                                                                                                    const tId = toast.loading('Téléchargement de l\'image...');
                                                                                                                                    try {
                                                                                                                                        const formData = new FormData();
                                                                                                                                        formData.append('media', file);
                                                                                                                                        const res = await worshipService.uploadMedia(formData);
                                                                                                                                        const uploadedUrl = res.data.url;
                                                                                                                                        // Build updated contents directly and persist immediately
                                                                                                                                        const currentBlock = blocks.find(b => b.id === block.id);
                                                                                                                                        const updatedContents = (currentBlock.metadata?.contents || []).map(c =>
                                                                                                                                            c.id === item.id ? { ...c, url: uploadedUrl } : c
                                                                                                                                        );
                                                                                                                                        await handleUpdateBlockMetadata(block.id, { contents: updatedContents });
                                                                                                                                        toast.success('Image sauvegardée ✅', { id: tId });
                                                                                                                                    } catch (error) {
                                                                                                                                        toast.error('Erreur de téléchargement', { id: tId });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }}
                                                                                                                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 dark:file:bg-pink-500/10 dark:file:text-pink-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent focus:border-brand-primary outline-none"
                                                                                                                        />
                                                                                                                        {item.url && (
                                                                                                                            <div className="mt-2 text-center text-[10px] text-green-500 font-bold">✅ Fichier chargé sur le serveur</div>
                                                                                                                        )}
                                                                                                                        {item.url && (
                                                                                                                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 relative group/img">
                                                                                                                                <img src={getMediaUrl(item.url)} alt="Aperçu" className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                                                                                                <button 
                                                                                                                                    onClick={async () => {
                                                                                                                                        const currentBlock = blocks.find(b => b.id === block.id);
                                                                                                                                        const updatedContents = (currentBlock.metadata?.contents || []).map(c =>
                                                                                                                                            c.id === item.id ? { ...c, url: '' } : c
                                                                                                                                        );
                                                                                                                                        await handleUpdateBlockMetadata(block.id, { contents: updatedContents });
                                                                                                                                    }}
                                                                                                                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-all"
                                                                                                                                >
                                                                                                                                    <X size={12} />
                                                                                                                                </button>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}

                                                                                                                {item.type === 'video' && (
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                                                                                                                            <label className="text-[10px] font-black uppercase tracking-widest text-red-500">{t('video', 'Vidéo')}</label>
                                                                                                                        </div>
                                                                                                                        <input
                                                                                                                            type="file"
                                                                                                                            accept="video/*"
                                                                                                                            onChange={async (e) => {
                                                                                                                                const file = e.target.files[0];
                                                                                                                                if (file) {
                                                                                                                                    const tId = toast.loading('Téléchargement de la vidéo...');
                                                                                                                                    try {
                                                                                                                                        const formData = new FormData();
                                                                                                                                        formData.append('media', file);
                                                                                                                                        const res = await worshipService.uploadMedia(formData);
                                                                                                                                        const uploadedUrl = res.data.url;
                                                                                                                                        // Build updated contents directly and persist immediately
                                                                                                                                        const currentBlock = blocks.find(b => b.id === block.id);
                                                                                                                                        const updatedContents = (currentBlock.metadata?.contents || []).map(c =>
                                                                                                                                            c.id === item.id ? { ...c, url: uploadedUrl } : c
                                                                                                                                        );
                                                                                                                                        await handleUpdateBlockMetadata(block.id, { contents: updatedContents });
                                                                                                                                        toast.success('Vidéo sauvegardée ✅', { id: tId });
                                                                                                                                    } catch (error) {
                                                                                                                                        toast.error('Erreur de téléchargement', { id: tId });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }}
                                                                                                                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-500/10 dark:file:text-red-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent focus:border-brand-primary outline-none"
                                                                                                                        />
                                                                                                                        {item.url && (
                                                                                                                            <div className="mt-2 text-center text-[10px] text-green-500 font-bold">✅ Fichier chargé sur le serveur</div>
                                                                                                                        )}
                                                                                                                        {item.url && (
                                                                                                                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 dark:border-white/5 relative group/vid bg-black">
                                                                                                                                <video src={getMediaUrl(item.url)} className="w-full h-32 object-cover" controls preload="metadata" />
                                                                                                                                <button 
                                                                                                                                    onClick={async () => {
                                                                                                                                        const currentBlock = blocks.find(b => b.id === block.id);
                                                                                                                                        const updatedContents = (currentBlock.metadata?.contents || []).map(c =>
                                                                                                                                            c.id === item.id ? { ...c, url: '' } : c
                                                                                                                                        );
                                                                                                                                        await handleUpdateBlockMetadata(block.id, { contents: updatedContents });
                                                                                                                                    }}
                                                                                                                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/vid:opacity-100 transition-all z-10"
                                                                                                                                >
                                                                                                                                    <X size={12} />
                                                                                                                                </button>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </Draggable>
                                                                                                ))}
                                                                                                {subProvided.placeholder}
                                                                                            </div>
                                                                                        )}
                                                                                    </Droppable>
                                                                                );
                                                                            })()}

                                                                            {/* Add Buttons — icon only with tooltip */}
                                                                            <div className="flex items-center gap-2 pt-2">
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => handleAddSubItem(block.id, 'full')} className="w-8 h-8 flex items-center justify-center bg-brand-primary text-white rounded-lg hover:-translate-y-0.5 transition-all shadow-sm">
                                                                                        <UserCheck size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        {t('add_sub_responsibility', 'Ajouter Responsable / Contenu')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => handleAddSubItem(block.id, 'text_only')} className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-lg hover:-translate-y-0.5 transition-all">
                                                                                        <Type size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        {t('add_text_only', 'Ajouter Texte Simple')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => openSongModal(block.id)} className="w-8 h-8 flex items-center justify-center bg-purple-500 text-white rounded-lg hover:-translate-y-0.5 transition-all shadow-sm">
                                                                                        <Music size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        {t('add_song', 'Ajouter un Chant')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => openBibleModal(block.id)} className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:-translate-y-0.5 transition-all shadow-sm">
                                                                                        <Book size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        {t('add_bible_passage', 'Ajouter un Passage Biblique')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => handleAddSubItem(block.id, 'image')} className="w-8 h-8 flex items-center justify-center bg-pink-500 text-white rounded-lg hover:-translate-y-0.5 transition-all shadow-sm">
                                                                                        <ImageIcon size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        Ajouter une Image
                                                                                    </span>
                                                                                </div>
                                                                                <div className="relative group/tooltip">
                                                                                    <button onClick={() => handleAddSubItem(block.id, 'video')} className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:-translate-y-0.5 transition-all shadow-sm">
                                                                                        <Video size={14} />
                                                                                    </button>
                                                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                                                                        Ajouter une Vidéo
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Bible passages: draggable list for any block with passages */}
                                                                            {(block.type === 'reading' || (block.metadata?.passages && block.metadata.passages.length > 0)) && (() => {
                                                                                const blockPassages = block.metadata?.passages || (
                                                                                    block.metadata?.passage ? [{ id: 'legacy', reference: block.metadata.passage, text: block.metadata.passageText || '', responsable: '', notes: '' }] : []
                                                                                );
                                                                                return (
                                                                                    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/5">
                                                                                        {blockPassages.length > 0 && (
                                                                                            <div className="space-y-1.5">
                                                                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                                                                                    <Book size={10} /> {t('selected_passages', 'Passages sélectionnés')} ({blockPassages.length})
                                                                                                </label>
                                                                                                <Droppable droppableId={`passages-${block.id}`} type="PASSAGE">
                                                                                                    {(passProvided) => (
                                                                                                        <div {...passProvided.droppableProps} ref={passProvided.innerRef} className="space-y-2">
                                                                                                            {blockPassages.map((passItem, pIdx) => (
                                                                                                                <Draggable key={passItem.id} draggableId={`passage-item-${block.id}-${passItem.id}`} index={pIdx}>
                                                                                                                    {(pDrag, pSnap) => (
                                                                                                                        <div
                                                                                                                            ref={pDrag.innerRef}
                                                                                                                            {...pDrag.draggableProps}
                                                                                                                            className={`bg-white dark:bg-[#111C44] border rounded-2xl overflow-hidden transition-all ${pSnap.isDragging ? 'border-brand-primary shadow-2xl scale-[1.01] rotate-1' : 'border-gray-100 dark:border-white/5 shadow-sm'}`}
                                                                                                                        >
                                                                                                                            {/* Header: drag + reference + remove */}
                                                                                                                            <div className={`flex items-center gap-2 px-3 py-2 border-b ${pSnap.isDragging ? 'border-blue-500/20 bg-blue-500/5' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5'}`}>
                                                                                                                                <div {...pDrag.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-blue-500 transition-colors p-1">
                                                                                                                                    <GripVertical size={14} />
                                                                                                                                </div>
                                                                                                                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                                                                                                                    <Book size={11} />
                                                                                                                                </div>
                                                                                                                                <div className="flex-1 min-w-0">
                                                                                                                                    <p className="text-xs font-black text-gray-800 dark:text-white truncate">{pIdx + 1}. {passItem.reference}</p>
                                                                                                                                </div>
                                                                                                                                <button onClick={() => handleRemovePassage(block.id, passItem.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all shrink-0" title="Retirer ce passage">
                                                                                                                                    <X size={12} />
                                                                                                                                </button>
                                                                                                                            </div>

                                                                                                                            {/* Body: properties */}
                                                                                                                            <div className="p-3 space-y-2.5">
                                                                                                                                <div className="relative">
                                                                                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block flex items-center gap-1">
                                                                                                                                        <UserCheck size={9} /> Lecteur / Responsable
                                                                                                                                    </label>
                                                                                                                                    <input
                                                                                                                                        type="text"
                                                                                                                                        placeholder="Qui fera la lecture?"
                                                                                                                                        value={passItem.responsable || ''}
                                                                                                                                        onChange={e => handleLocalPassageChange(block.id, passItem.id, 'responsable', e.target.value)}
                                                                                                                                        onBlur={() => handleSavePassagesDebounced(block.id)}
                                                                                                                                        onFocus={() => setShowSuggestions({ blockId: `passage-${block.id}`, itemId: passItem.id })}
                                                                                                                                        className="w-full bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-transparent focus:border-brand-primary outline-none text-xs transition-all"
                                                                                                                                    />
                                                                                                                                </div>

                                                                                                                                <div>
                                                                                                                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block flex items-center gap-1">
                                                                                                                                        <MessageSquare size={9} /> Notes de lecture
                                                                                                                                    </label>
                                                                                                                                    <textarea
                                                                                                                                        placeholder="Instructions, introduction au passage..."
                                                                                                                                        rows={2}
                                                                                                                                        value={passItem.notes || ''}
                                                                                                                                        onChange={e => handleLocalPassageChange(block.id, passItem.id, 'notes', e.target.value)}
                                                                                                                                        onBlur={() => handleSavePassagesDebounced(block.id)}
                                                                                                                                        className="w-full bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-transparent focus:border-brand-primary outline-none text-xs resize-none transition-all"
                                                                                                                                    />
                                                                                                                                </div>

                                                                                                                                {passItem.text && (
                                                                                                                                    <details className="rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                                                                                                                                        <summary className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-brand-primary hover:bg-brand-primary/5 select-none flex items-center gap-1.5 transition-colors">
                                                                                                                                            <Book size={9} /> Texte Biblique
                                                                                                                                        </summary>
                                                                                                                                        <div className="px-3 pb-3 pt-1 text-[11px] italic text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto noscrollbar bg-gray-50 dark:bg-white/3">
                                                                                                                                            {passItem.text}
                                                                                                                                        </div>
                                                                                                                                    </details>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </Draggable>
                                                                                                            ))}
                                                                                                            {passProvided.placeholder}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </Droppable>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'sermon' ? (
                    <SermonEditor serviceId={id} initialData={service?.sermon} />
                ) : (
                    /* Notes & Comments Tab */
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto noscrollbar flex-1">
                        {/* Service notes */}
                        <div className="bg-white dark:bg-[#111C44] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-brand-primary" />
                                {t('service_notes', 'Notes du culte')}
                            </h3>
                            <textarea
                                placeholder={t('service_notes_placeholder', 'Ajoutez vos notes générales, rappels, et informations importantes pour ce culte...')}
                                rows={5}
                                value={service?.notes || ''}
                                onChange={e => setService(prev => ({ ...prev, notes: e.target.value }))}
                                onBlur={async (e) => {
                                    try {
                                        await worshipService.updateService(id, { notes: e.target.value });
                                        toast.success(t('notes_saved', 'Notes sauvegardées'), { id: 'notes-save', duration: 1500 });
                                    } catch { toast.error('Erreur lors de la sauvegarde'); }
                                }}
                                className="w-full bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-2xl border border-transparent focus:border-brand-primary outline-none resize-none transition-all text-sm leading-relaxed font-medium"
                            />
                        </div>

                        {/* Block-level comments */}
                        <div className="bg-white dark:bg-[#111C44] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-brand-primary" />
                                {t('block_comments', 'Commentaires par bloc')}
                            </h3>
                            <div className="space-y-4">
                                {blocks.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic text-center py-6">{t('no_blocks_yet', 'Aucun bloc. Ajoutez des blocs depuis le déroulement.')}</p>
                                ) : blocks.map(block => {
                                    const typeInfo = blockTypes.find(t => t.id === block.type) || blockTypes[0];
                                    return (
                                        <div key={block.id} className="rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5">
                                                <div className="text-brand-primary">{typeInfo.icon}</div>
                                                <span className="font-bold text-sm text-gray-800 dark:text-white">{block.label}</span>
                                                {block.metadata?.songTitle && <span className="text-xs text-gray-400">— {block.metadata.songTitle}</span>}
                                            </div>
                                            <div className="p-3">
                                                <textarea
                                                    placeholder={t('block_comment_placeholder', 'Ajouter un commentaire pour ce bloc...')}
                                                    rows={2}
                                                    value={block.metadata?.comment || ''}
                                                    onChange={e => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, metadata: { ...b.metadata, comment: e.target.value } } : b))}
                                                    onBlur={e => handleUpdateBlockMetadata(block.id, { comment: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-transparent focus:border-brand-primary outline-none resize-none transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Song Selection Modal */}
            {showSongModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#111C44] w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">
                        <button onClick={() => setShowSongModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">{t('song_library', 'Bibliothèque de Chants')}</h2>
                            
                            {/* Source Toggle */}
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl mb-6">
                                <button 
                                    onClick={() => setSongSource('library')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${songSource === 'library' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    Bibliothèque Interne
                                </button>
                                <button 
                                    onClick={() => setSongSource('che')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${songSource === 'che' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >
                                    Chants d'Espérance
                                </button>
                            </div>

                            <div className="relative mb-6">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text" 
                                    placeholder={songSource === 'che' ? "N° ou Titre (ex: 123)..." : t('search_song', "Rechercher un chant...")}
                                    value={songSearchTerm}
                                    onChange={(e) => setSongSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 pl-10 pr-4 py-3 rounded-xl text-sm border-transparent focus:border-brand-primary outline-none transition-all dark:text-white"
                                />
                            </div>
                            
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto noscrollbar pr-1">
                                {(() => {
                                    const filtered = (songSource === 'che' ? CHE_CATALOG : songs).filter(s => 
                                        s.title.toLowerCase().includes(songSearchTerm.toLowerCase()) || 
                                        (s.number && s.number.toString() === songSearchTerm)
                                    );

                                    if (filtered.length === 0) return <p className="text-center text-gray-500 text-sm py-8">Aucun résultat trouvé.</p>;

                                    return filtered.map(song => (
                                        <div
                                            key={song.id}
                                            onClick={() => {
                                                const displayTitle = song.number ? `${song.number} ${song.collection}, ${song.title}` : song.title;
                                                const currentMetadata = blocks.find(b => b.id === activeBlockId)?.metadata || {};
                                                const currentSongs = currentMetadata.songs || [];
                                                
                                                const newSongItem = {
                                                    id: Date.now().toString(),
                                                    songId: song.id,
                                                    title: displayTitle,
                                                    lyrics: song.lyrics || 'Paroles non disponibles',
                                                    responsable: '',
                                                    notes: ''
                                                };

                                                handleUpdateBlockMetadata(activeBlockId, { 
                                                    songs: [...currentSongs, newSongItem],
                                                    songTitle: displayTitle // Legacy
                                                });
                                                setShowSongModal(false);
                                                setSongSearchTerm('');
                                                setExpandedBlockId(activeBlockId);
                                            }}
                                            className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all group flex items-center justify-between"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {song.number && <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-lg">{song.number} {song.collection}</span>}
                                                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-primary truncate">{song.title}</h4>
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate">{song.lyrics?.substring(0, 60)}...</p>
                                            </div>
                                            <Plus size={16} className="text-gray-300 group-hover:text-brand-primary ml-4" />
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bible Passage Modal */}
            {showBibleModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#111C44] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">
                        <button onClick={() => setShowBibleModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                        <div className="p-8">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Lecteur de Passage</h2>
                            <div className="space-y-6">
                                {/* Mode & Version Selectors */}
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
                                        <button onClick={() => setBibleSelectMode('smart')} className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bibleSelectMode === 'smart' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500'}`}>Recherche Libre</button>
                                        <button onClick={() => setBibleSelectMode('visual')} className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bibleSelectMode === 'visual' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500'}`}>Sélecteur Guidé</button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
                                        {BIBLE_VERSIONS.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setBibleVersion(v.id)}
                                                className={`py-2 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${bibleVersion === v.id ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500'}`}
                                            >
                                                {v.label.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {bibleSelectMode === 'smart' ? (
                                    <div className="relative">
                                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Jean 3:16, Psaume 23:1-5, Luc 15..."
                                            value={bibleSearchQuery}
                                            onChange={(e) => setBibleSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleBibleSmartSearch()}
                                            className="w-full bg-gray-50 dark:bg-white/5 pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent focus:border-brand-primary outline-none text-sm transition-all shadow-inner"
                                        />
                                        <button 
                                            onClick={() => handleBibleSmartSearch()}
                                            disabled={isFetchingBible || !bibleSearchQuery}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all disabled:opacity-50"
                                        >
                                            {isFetchingBible ? '...' : 'Chercher'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Stepper Book -> Chapter -> Verse */}
                                        <div className="flex gap-2 text-[10px] font-black uppercase overflow-x-auto noscrollbar pb-2">
                                            <button onClick={() => setSelectedVisual({book:null, chapter:null, verses:[]})} className={`px-4 py-2 rounded-xl shrink-0 transition-all ${!selectedVisual.book ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>1. Livre</button>
                                            <button disabled={!selectedVisual.book} onClick={() => setSelectedVisual(prev => ({...prev, chapter:null, verses:[]}))} className={`px-4 py-2 rounded-xl shrink-0 transition-all ${selectedVisual.book && !selectedVisual.chapter ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary disabled:opacity-40'}`}>2. Chapitre</button>
                                            <button disabled={!selectedVisual.chapter} className={`px-4 py-2 rounded-xl shrink-0 transition-all ${selectedVisual.chapter ? 'bg-brand-primary text-white' : 'bg-brand-primary/10 text-brand-primary disabled:opacity-40'}`}>3. Versets</button>
                                        </div>

                                        <div className="max-h-[30vh] overflow-y-auto noscrollbar grid grid-cols-3 gap-2">
                                            {!selectedVisual.book ? (
                                                BIBLE_BOOKS.map(b => (
                                                    <button key={b.id} onClick={() => handleVisualSelect('book', b)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-[11px] font-bold hover:bg-brand-primary/10 hover:text-brand-primary transition-all">{b.fr}</button>
                                                ))
                                            ) : !selectedVisual.chapter ? (
                                                Array.from({ length: selectedVisual.book.chapters }).map((_, i) => (
                                                    <button key={i} onClick={() => handleVisualSelect('chapter', i+1)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-[11px] font-bold hover:bg-brand-primary/10 hover:text-brand-primary transition-all">Chapitre {i+1}</button>
                                                ))
                                            ) : (
                                                <div className="col-span-3 grid grid-cols-6 gap-2">
                                                    {isFetchingBible && selectedVisual.maxVerses === 0 ? (
                                                        <p className="col-span-6 py-8 text-center text-xs animate-pulse">Chargement des versets...</p>
                                                    ) : (
                                                        Array.from({ length: selectedVisual.maxVerses || 50 }).map((_, i) => (
                                                            <button 
                                                                key={i} 
                                                                onClick={() => handleVisualSelect('verse', i+1)} 
                                                                className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${selectedVisual.verses.includes(i+1) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-white/2 border-gray-100 dark:border-white/5 text-gray-400'}`}
                                                            >
                                                                {i+1}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {biblePreview && (
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-brand-primary/20 animate-in fade-in zoom-in-95 mt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-brand-primary uppercase tracking-widest text-xs truncate max-w-[60%]">{biblePreview.reference}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] rounded-lg font-bold">{bibleVersion.toUpperCase()}</span>
                                                <div className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] rounded-lg font-bold">Aperçu</div>
                                            </div>
                                        </div>
                                        <p className="text-sm italic leading-relaxed text-gray-600 dark:text-gray-300 max-h-40 overflow-y-auto noscrollbar">
                                            {biblePreview.text}
                                        </p>
                                        <button
                                            onClick={validateBiblePassage}
                                            className="w-full mt-6 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            <Plus size={18} /> Ajouter ce passage
                                        </button>
                                    </div>
                                )}

                                {!biblePreview && !isFetchingBible && (
                                    <div className="py-10 text-center space-y-3 opacity-40">
                                        <BookOpen className="mx-auto" size={32} />
                                        <p className="text-xs font-medium italic">Saisissez une référence ou utilisez le sélecteur guidé</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default WorshipBuilder;
