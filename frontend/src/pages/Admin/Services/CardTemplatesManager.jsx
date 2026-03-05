import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../auth/AuthProvider';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import MemberCardGeneratorModal from '../../../components/Admin/Members/MemberCardGeneratorModal';
import SearchableSelect from '../../../components/SearchableSelect';
import { QRCodeCanvas } from 'qrcode.react';

const MEMBER_PHOTO_SAMPLE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
const CHURCH_LOGO_SAMPLE = "https://img.freepik.com/vecteurs-premium/concept-logo-eglise-chretienne-symbole-croix_605910-149.jpg";

const SYSTEM_FONTS = [
    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
].sort();

const GOOGLE_FONTS_LIST = [
    'Alex Brush', 'Allura', 'Arizonia', 'Bilbo Swash Caps', 'Calligraffitti', 'Caveat', 'Clicker Script',
    'Cookie', 'Courgette', 'Dancing Script', 'Great Vibes', 'Homemade Apple', 'Italianno', 'Jim Nightshade',
    'Kaushan Script', 'Kristi', 'La Belle Aurore', 'Marck Script', 'Meie Script', 'Merienda', 'Montez',
    'Mrs Saint Delafield', 'Nanum Pen Script', 'Niconne', 'Nothing You Could Do', 'Pacifico', 'Parisienne',
    'Patrick Hand', 'Pinyon Script', 'Playball', 'Princess Sofia', 'Qwigley', 'Reenie Beanie', 'Rochester',
    'Rouge Script', 'Sacramento', 'Satisfy', 'Shadows Into Light', 'Stalemate', 'Sue Ellen Francisco',
    'Sunshiney', 'Tangerine', 'Vibur', 'Waiting for the Sunrise', 'Yellowtail', 'Zeyada',
    'Abril Fatface', 'Alfa Slab One', 'Amatic SC', 'Anton', 'Architects Daughter', 'Bangers', 'Bebas Neue',
    'Black Ops One', 'Bungee', 'Chewy', 'Cinzel', 'Comfortaa', 'Creepster', 'Diplomata SC', 'Faster One',
    'FrederickatheGreat', 'Fredoka One', 'Fugaz One', 'Gloria Hallelujah', 'Kelly Slab', 'Lobster',
    'Lobster Two', 'Luckiest Guy', 'Metal Mania', 'Monoton', 'Mystery Quest', 'Nosifer', 'Orbitron',
    'Passero One', 'Passion One', 'Patua One', 'Permanent Marker', 'Press Start 2P', 'Righteous',
    'Russo One', 'Sigmar One', 'Special Elite', 'Spicy Rice', 'UnifrakturMaguntia', 'Vampiro One',
    'VT323', 'Yeseva One',
    'Inter', 'Montserrat', 'Roboto', 'Poppins', 'Oswald', 'Playfair Display', 'Syne', 'Outfit', 'Sora',
    'Arvo', 'Bitter', 'Cardo', 'Domine', 'EB Garamond', 'Lora', 'Merriweather', 'PT Serif', 'Quattrocento',
    'Rokkitt', 'Vollkorn', 'Archivo', 'Barlow', 'Cabin', 'Dosis', 'Heebo', 'Josefin Sans', 'Kanit',
    'Lexend', 'Manrope', 'Nunito', 'Quicksand', 'Rubik', 'Work Sans'
].sort();

const AVAILABLE_FONTS = [
    ...SYSTEM_FONTS.map(f => ({ id: f, name: `${f} (Système)`, category: 'System' })),
    ...GOOGLE_FONTS_LIST.map(f => ({ id: f, name: `${f} (Google)`, category: 'Google' }))
];

/**
 * Robust gradient parser to handle commas within rgba() functions.
 */
const splitGradientParts = (str) => {
    if (!str) return [];
    const parts = [];
    let current = '';
    let depth = 0;
    for (let char of str) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        if (char === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current.trim());
    return parts.filter(p => p.length > 0);
};

const CardTemplatesManager = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [frontBg, setFrontBg] = useState('linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)');
    const [backBg, setBackBg] = useState('linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)');
    const [isVertical, setIsVertical] = useState(false);
    const [fields, setFields] = useState([]);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(null);
    const [showGrid, setShowGrid] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [gridSize, setGridSize] = useState(10);
    const [showPreview, setShowPreview] = useState(false);
    const [clipboard, setClipboard] = useState(null);
    const [notification, setNotification] = useState(null);
    const [activeSide, setActiveSide] = useState('front');
    const [rightTab, setRightTab] = useState('bg');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [presetsToShow, setPresetsToShow] = useState(6);

    const CARD_WIDTH = isVertical ? 204 : 324;
    const CARD_HEIGHT = isVertical ? 324 : 204;

    const BG_PRESETS = [
        { id: 'p1', label: 'Midnight Ocean', front: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', back: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
        { id: 'p2', label: 'Gold Elegance', front: 'linear-gradient(135deg, #422006 0%, #713f12 100%)', back: 'linear-gradient(135deg, #713f12 0%, #422006 100%)' },
        { id: 'p3', label: 'Arctic Blue', front: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', back: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' },
        { id: 'p4', label: 'Sunset Glow', front: 'linear-gradient(45deg, #f97316 0%, #7c3aed 100%)', back: 'linear-gradient(45deg, #7c3aed 0%, #f97316 100%)' },
        { id: 'p5', label: 'Emerald Mint', front: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', back: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)' },
        { id: 'p6', label: 'Rose Velvet', front: 'linear-gradient(135deg, #881337 0%, #be123c 100%)', back: 'linear-gradient(135deg, #be123c 0%, #881337 100%)' },
        { id: 'p7', label: 'Slate Gray', front: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', back: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' },
        { id: 'p8', label: 'Vibrant Teal', front: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)', back: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)' },
        { id: 'p9', label: 'Deep Purple', front: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)', back: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' },
        { id: 'p10', label: 'Sunny Day', front: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)', back: 'linear-gradient(135deg, #fef08a 0%, #fefce8 100%)' },
        { id: 'p11', label: 'Volcanic Ash', front: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)', back: 'linear-gradient(135deg, #44403c 0%, #1c1917 100%)' },
        { id: 'p12', label: 'Spring Leaf', front: 'linear-gradient(135deg, #14532d 0%, #22c55e 100%)', back: 'linear-gradient(135deg, #22c55e 0%, #14532d 100%)' },
        { id: 'p13', label: 'Sky Clear', front: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)', back: 'linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)' },
        { id: 'p14', label: 'Royal Crimson', front: 'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)', back: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)' },
        { id: 'p15', label: 'Lavender Soft', front: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)', back: 'linear-gradient(135deg, #c4b5fd 0%, #ede9fe 100%)' },
        { id: 'p16', label: 'Desert Gold', front: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', back: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' },
        { id: 'p17', label: 'Mist Morning', front: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)', back: 'linear-gradient(135deg, #cbd5e1 0%, #f8fafc 100%)' },
        { id: 'p18', label: 'Coffee Rich', front: 'linear-gradient(135deg, #27272a 0%, #52525b 100%)', back: 'linear-gradient(135deg, #52525b 0%, #27272a 100%)' },
        { id: 'p19', label: 'Forest Deep', front: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', back: 'linear-gradient(135deg, #166534 0%, #14532d 100%)' },
        { id: 'p20', label: 'Ocean Tide', front: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', back: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' },
        { id: 'p21', label: 'Berry Blast', front: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)', back: 'linear-gradient(135deg, #a21caf 0%, #701a75 100%)' },
        { id: 'p22', label: 'Sand Warm', front: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)', back: 'linear-gradient(135deg, #fcd34d 0%, #fef3c7 100%)' },
        { id: 'p23', label: 'Steel Cold', front: 'linear-gradient(135deg, #334155 0%, #64748b 100%)', back: 'linear-gradient(135deg, #64748b 0%, #334155 100%)' },
        { id: 'p24', label: 'Cyber Neon', front: 'linear-gradient(135deg, #000000 0%, #38bdf8 100%)', back: 'linear-gradient(135deg, #38bdf8 0%, #000000 100%)' },
        { id: 'p25', label: 'Galaxy Pink', front: 'linear-gradient(135deg, #312e81 0%, #831843 100%)', back: 'linear-gradient(135deg, #831843 0%, #312e81 100%)' }
    ];

    const MEMBER_VARS = [
        { label: 'Nom Complet', value: '{member.fullName}' },
        { label: 'Prénom', value: '{member.firstName}' },
        { label: 'Nom', value: '{member.lastName}' },
        { label: 'Sexe', value: '{member.gender}' },
        { label: 'Téléphone', value: '{member.phone}' },
        { label: 'Email', value: '{member.email}' },
        { label: 'Groupe Sanguin', value: '{member.bloodGroup}' },
        { label: 'Code Membre', value: '{member.code}' },
        { label: 'NIF/CIN', value: '{member.nif}' },
        { label: 'Adresse', value: '{member.address}' },
        { label: 'Fonction/Type', value: '{member.type}' },
        { label: 'Date Naissance', value: '{member.birthDate}' }
    ];

    const CHURCH_VARS = [
        { label: 'Nom Eglise', value: '{church.name}' },
        { label: 'Adresse Eglise', value: '{church.address}' },
        { label: 'Email Eglise', value: '{church.email}' },
        { label: 'Téléphone Eglise', value: '{church.phone}' },
        { label: 'Nom Pasteur', value: '{church.pastor}' },
        { label: 'Logo Eglise', value: '{church.logo}' }
    ];

    const PREDEFINED_TEXTS = [
        'CARTE DE MEMBRE', 'CARTE D\'IDENTITÉ', 'MEMBRE ACTIF', 'SESSION 2026', 'ADMINISTRATEUR'
    ];

    const SYSTEM_TEMPLATES = [
        { id: 'tpl_1', name: 'Elite Azure', frontBg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', backBg: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)' },
        { id: 'tpl_2', name: 'Royal Crimson', frontBg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', backBg: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)' },
        { id: 'tpl_3', name: 'Slate Minimal', frontBg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', backBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)' }
    ].map(t => ({
        ...t,
        fields: [
            { id: `logo_${t.id}`, type: 'image', label: '{church.logo}', x: 15, y: 15, width: 45, height: 45, side: 'front', borderRadius: 0 },
            { id: `ch_name_${t.id}`, type: 'text', label: '{church.name}', x: 70, y: 15, width: 230, height: 25, color: '#FFFFFF', fontSize: 13, fontFamily: 'Outfit', side: 'front', bold: true },
            { id: `m_photo_${t.id}`, type: 'image', label: '{member.photo}', x: 15, y: 75, width: 75, height: 85, side: 'front', borderRadius: 0 },
            { id: `m_name_${t.id}`, type: 'text', label: '{member.fullName}', x: 105, y: 75, width: 200, height: 25, color: '#FFFFFF', fontSize: 14, fontFamily: 'Outfit', side: 'front', bold: true },
            { id: `m_code_${t.id}`, type: 'text', label: 'ID: {member.code}', x: 105, y: 100, width: 200, height: 18, color: '#FFFFFF', fontSize: 10, fontFamily: 'Outfit', side: 'front' },
            { id: `qr_${t.id}`, type: 'qrcode', label: '{member.id}', x: 125, y: 40, width: 75, height: 75, side: 'back', color: '#000000' }
        ]
    }));

    const showNotice = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/card-templates');
            setTemplates(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching templates", error);
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    // Load Google Font dynamically when needed
    useEffect(() => {
        const fontsToLoad = new Set();
        fields.forEach(f => {
            if (f.type === 'text' && GOOGLE_FONTS_LIST.includes(f.fontFamily)) {
                fontsToLoad.add(f.fontFamily);
            }
        });

        fontsToLoad.forEach(font => {
            const fontId = `font-${font.replace(/\s+/g, '-').toLowerCase()}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}&display=swap`;
                document.head.appendChild(link);
            }
        });
    }, [fields]);

    const saveToHistory = (newFields) => {
        const state = JSON.parse(JSON.stringify(newFields || fields));
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        if (newHistory.length > 30) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setFields(JSON.parse(JSON.stringify(history[historyIndex - 1])));
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setFields(JSON.parse(JSON.stringify(history[historyIndex + 1])));
            setHistoryIndex(historyIndex + 1);
        }
    };

    const addField = (type = 'text', side = 'front', extra = {}) => {
        const base = { id: `field_${Date.now()}`, x: 50, y: 50, side, ...extra };
        let newField = { ...base, type, width: 100, height: 30 };
        if (type === 'text') newField = { ...newField, label: 'Nouveau Texte', color: '#000000', fontSize: 13, fontFamily: 'Inter' };
        if (type === 'shape') newField = { ...newField, shapeType: 'rect', color: '#4F46E5', borderRadius: 0 };
        const updated = [...fields, newField];
        setFields(updated);
        saveToHistory(updated);
        setSelectedFieldIndex(updated.length - 1);
    };

    const updateField = (idx, updates) => {
        const updated = [...fields];
        updated[idx] = { ...updated[idx], ...updates };
        setFields(updated);
        // Save to history on every change for properties too, to allow undoing style changes
        saveToHistory(updated);
    };

    const removeField = (idx) => {
        const updated = fields.filter((_, i) => i !== idx);
        setFields(updated);
        saveToHistory(updated);
    };

    const handleFileUpload = async (e, side) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/churches/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (side === 'front') setFrontBg(res.data.filePath); else setBackBg(res.data.filePath);
            showNotice("Image téléchargée !");
        } catch (e) { showNotice("Erreur téléchargement", "error"); }
    };

    const handleSaveTemplate = async () => {
        if (!name.trim()) return showNotice("Nom requis", "error");
        const payload = {
            name, frontBackgroundUrl: frontBg, backBackgroundUrl: backBg, isActive,
            layoutConfig: { fields, isVertical, backgrounds: { front: frontBg, back: backBg } }
        };
        try {
            // If it's a system template (ID starts with tpl_), we always POST (create) instead of PUT (update)
            const isSystem = selectedTemplate?.id && selectedTemplate.id.toString().startsWith('tpl_');

            if (selectedTemplate?.id && !isSystem) {
                await api.put(`/card-templates/${selectedTemplate.id}`, payload);
            } else {
                await api.post('/card-templates', payload);
            }
            showNotice("Modèle enregistré !");
            fetchTemplates();
        } catch (error) {
            console.error("Save error:", error);
            showNotice("Erreur d'enregistrement", "error");
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("Supprimer ?")) return;
        try {
            await api.delete(`/card-templates/${id}`);
            fetchTemplates();
            showNotice("Supprimé");
        } catch (e) { showNotice("Erreur", "error"); }
    };

    const getBgStyle = (bg) => {
        if (!bg) return { backgroundColor: '#f3f4f6' };
        if (bg.startsWith('__gradient:')) return { backgroundImage: bg.split(':')[1], backgroundSize: 'cover' };
        if (bg.includes('gradient(')) return { backgroundImage: bg, backgroundSize: 'cover' };
        const serverBase = (api.defaults.baseURL || '').replace('/api', '').replace(/\/$/, '');
        const cleanPath = bg.replace(/\\/g, '/').replace(/^\/+/, '');
        return { backgroundImage: `url("${serverBase}/${cleanPath}")`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' };
    };

    const handleSelectTemplate = (tpl) => {
        setSelectedTemplate(tpl);
        setName(tpl.name || '');
        setIsActive(tpl.isActive || false);
        const config = tpl.layoutConfig || {};
        setFields(config.fields || []);
        setIsVertical(config.isVertical || false);
        setFrontBg(config.backgrounds?.front || tpl.frontBackgroundUrl || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)');
        setBackBg(config.backgrounds?.back || tpl.backBackgroundUrl || 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)');
        setRightTab('bg');
        setSelectedFieldIndex(null);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            if (selectedFieldIndex !== null) {
                const step = e.shiftKey ? 10 : 2;
                if (e.key === 'ArrowUp') { e.preventDefault(); updateField(selectedFieldIndex, { y: fields[selectedFieldIndex].y - step }); }
                if (e.key === 'ArrowDown') { e.preventDefault(); updateField(selectedFieldIndex, { y: fields[selectedFieldIndex].y + step }); }
                if (e.key === 'ArrowLeft') { e.preventDefault(); updateField(selectedFieldIndex, { x: fields[selectedFieldIndex].x - step }); }
                if (e.key === 'ArrowRight') { e.preventDefault(); updateField(selectedFieldIndex, { x: fields[selectedFieldIndex].x + step }); }
                if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeField(selectedFieldIndex); }
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c' && selectedFieldIndex !== null) {
                    e.preventDefault();
                    setClipboard({ ...fields[selectedFieldIndex], id: `copy_${Date.now()}` });
                    showNotice("Copié !");
                }
                if (e.key === 'v' && clipboard) {
                    e.preventDefault();
                    const newField = { ...clipboard, id: `field_${Date.now()}`, x: clipboard.x + 20, y: clipboard.y + 20 };
                    const updated = [...fields, newField];
                    setFields(updated);
                    saveToHistory(updated);
                    setSelectedFieldIndex(updated.length - 1);
                    showNotice("Collé !");
                }
                if (e.key === 'z') { e.preventDefault(); undo(); }
                if (e.key === 'y') { e.preventDefault(); redo(); }
                if (e.key === 'b' && selectedFieldIndex !== null && fields[selectedFieldIndex].type === 'text') {
                    e.preventDefault();
                    updateField(selectedFieldIndex, { bold: !fields[selectedFieldIndex].bold });
                }
                if (e.key === 'i' && selectedFieldIndex !== null && fields[selectedFieldIndex].type === 'text') {
                    e.preventDefault();
                    updateField(selectedFieldIndex, { italic: !fields[selectedFieldIndex].italic });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedFieldIndex, fields, clipboard, historyIndex]);

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setName('Nouveau Modèle');
        setIsActive(false);
        setFields([]);
        setIsVertical(false);
        setFrontBg('linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)');
        setBackBg('linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)');
        setSelectedFieldIndex(null);
        setHistory([]);
        setHistoryIndex(-1);
    };


    const getPreviewText = (f) => {
        let t = f.label || '';
        t = t.replace('{member.fullName}', 'JEAN BAPTISTE')
            .replace('{member.firstName}', 'JEAN')
            .replace('{member.lastName}', 'BAPTISTE')
            .replace('{member.code}', 'MD-1029')
            .replace('{church.name}', 'Eglise de Grace')
            .replace('{church.address}', 'Delmas 33, Haiti')
            .replace('{church.phone}', '2222-3333')
            .replace('{church.email}', 'contact@eglise.com')
            .replace('{church.pastor}', 'Pasteur Joseph Jean')
            .replace('{member.phone}', '4848-4848')
            .replace('{member.email}', 'jean@elyon.com')
            .replace('{member.type}', 'Membre Actif')
            .replace('{member.birthDate}', '12/05/1990')
            .replace('{member.gender}', 'Masculin')
            .replace('{member.bloodGroup}', 'O+')
            .replace('{member.nif}', '001-234-567-8')
            .replace('{member.address}', 'Port-au-Prince, Haiti');

        if (f.textCase === 'uppercase') return t.toUpperCase();
        if (f.textCase === 'lowercase') return t.toLowerCase();
        if (f.textCase === 'sentence') return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        return t;
    };

    const updateAllTextColors = (color) => {
        const updated = fields.map(f => f.type === 'text' ? { ...f, color } : f);
        setFields(updated);
        saveToHistory(updated);
        showNotice("Couleur globale appliquée");
    };

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`h-16 flex items-center justify-between px-8 border-b ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100'} z-50`}>
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/services')} className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-stripe-blue hover:text-white transition-all">←</button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            Gestionnaire de Profils
                            <span className="px-2 py-0.5 rounded-full bg-stripe-blue/10 text-stripe-blue text-[8px]">PRO</span>
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Editeur de Templates de Cartes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowPreview(true)} className="px-6 py-2.5 bg-white dark:bg-white/5 text-stripe-blue border border-stripe-blue/20 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-all">Aperçu Réel</button>
                    <button onClick={handleSaveTemplate} className="px-6 py-2.5 bg-stripe-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-all">Enregistrer</button>
                    <button onClick={toggleTheme} className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-lg">{theme === 'dark' ? '☀️' : '🌙'}</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR 1: Template Configuration */}
                <div className={`w-[240px] shrink-0 border-r flex flex-col ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="p-4 border-b dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400">Template</h3>
                        <button onClick={handleNewTemplate} className="w-6 h-6 rounded-lg bg-stripe-blue/10 text-stripe-blue flex items-center justify-center text-xs hover:bg-stripe-blue hover:text-white transition-all" title="Nouveau Modèle">+</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 noscrollbar">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nom Modèle</label>
                            <input value={name} onChange={e => setName(e.target.value)} className={`w-full p-3 rounded-2xl border text-[12px] font-black outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`} />
                        </div>

                        <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between">
                            <div><div className="text-[10px] font-black uppercase text-indigo-900 dark:text-indigo-400">Activer</div><div className="text-[8px] font-bold text-gray-400">Défaut</div></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-stripe-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                        </div>

                        {/* Moved User Templates here */}
                        <div className="space-y-4 pt-6 border-t dark:border-white/5">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Mes Modèles</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {templates.map(tpl => (
                                    <div key={tpl.id} className="relative group">
                                        <button onClick={() => handleSelectTemplate(tpl)} className={`w-full p-2 rounded-xl border transition-all text-left relative ${selectedTemplate?.id === tpl.id ? 'border-stripe-blue bg-stripe-blue/5' : 'border-gray-100 dark:border-white/5'} hover:border-stripe-blue/50`}>
                                            <div className="h-10 rounded-lg mb-1.5 overflow-hidden shadow-inner" style={getBgStyle(tpl.frontBackgroundUrl)}></div>
                                            <div className="text-[8px] font-black truncate uppercase tracking-tighter">{tpl.name}</div>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }} className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 z-10">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEFT SIDEBAR 2: Properties & Background */}
                <div className={`w-[280px] shrink-0 border-r flex flex-col ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="p-4 border-b dark:border-white/5">
                        <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400">Propriétés</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 noscrollbar">
                        <div className="space-y-6">
                            {/* Selected Field Section */}
                            {selectedFieldIndex !== null && fields[selectedFieldIndex] && (
                                <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3 dark:border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stripe-blue">Element</h4>
                                        <button onClick={() => removeField(selectedFieldIndex)} className="text-rose-500 text-[10px] font-black uppercase">Supprimer</button>
                                    </div>
                                    <div className="space-y-4">
                                        {fields[selectedFieldIndex].type === 'text' && (
                                            <>
                                                {/* Text Content */}
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Texte / Variable</label>
                                                    <textarea
                                                        value={fields[selectedFieldIndex].label}
                                                        onChange={e => updateField(selectedFieldIndex, { label: e.target.value })}
                                                        className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 font-black text-[11px] h-16 outline-none resize-none"
                                                        placeholder="Saisissez votre texte ou utilisez une variable..."
                                                    />
                                                </div>

                                                {/* Variable Dropdown */}
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Insérer Variable</label>
                                                    <select
                                                        onChange={e => {
                                                            if (e.target.value) {
                                                                updateField(selectedFieldIndex, { label: (fields[selectedFieldIndex].label || '') + ' ' + e.target.value });
                                                                e.target.value = ""; // Reset
                                                            }
                                                        }}
                                                        className="w-full p-2.5 rounded-xl bg-white text-gray-900 border border-gray-200 text-[11px] font-black outline-none transition-all focus:border-stripe-blue cursor-pointer shadow-sm"
                                                    >
                                                        <option value="">Sélectionner une variable...</option>
                                                        <optgroup label="Église">
                                                            {CHURCH_VARS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                                        </optgroup>
                                                        <optgroup label="Membre">
                                                            {MEMBER_VARS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                                        </optgroup>
                                                    </select>
                                                </div>

                                                {/* Font & Size */}
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Typographie</label>
                                                    <SearchableSelect
                                                        options={AVAILABLE_FONTS}
                                                        value={fields[selectedFieldIndex].fontFamily}
                                                        onChange={v => updateField(selectedFieldIndex, { fontFamily: v })}
                                                        className="search-select-compact"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase">Taille</label>
                                                        <input type="number" value={fields[selectedFieldIndex].fontSize} onChange={e => updateField(selectedFieldIndex, { fontSize: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 font-black text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase">Couleur</label>
                                                        <input type="color" value={fields[selectedFieldIndex].color} onChange={e => updateField(selectedFieldIndex, { color: e.target.value })} className="w-full h-8 rounded-xl cursor-pointer" />
                                                    </div>
                                                </div>

                                                {/* Alignment & Weight */}
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Style & Alignement</label>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateField(selectedFieldIndex, { textAlign: 'left' })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center border transition-all ${fields[selectedFieldIndex].textAlign === 'left' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>≡</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { textAlign: 'center' })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center border transition-all ${fields[selectedFieldIndex].textAlign === 'center' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>≣</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { textAlign: 'right' })} className={`flex-1 h-8 rounded-lg text-xs flex items-center justify-center border transition-all ${fields[selectedFieldIndex].textAlign === 'right' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>≣</button>
                                                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
                                                        <button onClick={() => updateField(selectedFieldIndex, { bold: !fields[selectedFieldIndex].bold })} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${fields[selectedFieldIndex].bold ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>B</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { italic: !fields[selectedFieldIndex].italic })} className={`w-8 h-8 rounded-lg text-xs italic border transition-all ${fields[selectedFieldIndex].italic ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>i</button>
                                                    </div>
                                                </div>

                                                {/* Text Case */}
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Casse</label>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateField(selectedFieldIndex, { textCase: 'uppercase' })} className={`flex-1 h-8 rounded-lg text-[10px] font-black border transition-all ${fields[selectedFieldIndex].textCase === 'uppercase' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>AA</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { textCase: 'lowercase' })} className={`flex-1 h-8 rounded-lg text-[10px] font-black border transition-all ${fields[selectedFieldIndex].textCase === 'lowercase' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>aa</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { textCase: 'sentence' })} className={`flex-1 h-8 rounded-lg text-[10px] font-black border transition-all ${fields[selectedFieldIndex].textCase === 'sentence' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>Aa</button>
                                                        <button onClick={() => updateField(selectedFieldIndex, { textCase: 'none' })} className={`flex-1 h-8 rounded-lg text-[10px] font-black border transition-all ${!fields[selectedFieldIndex].textCase || fields[selectedFieldIndex].textCase === 'none' ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>-</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {fields[selectedFieldIndex].type === 'image' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Ajustement & Opacité</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <select value={fields[selectedFieldIndex].objectFit || 'cover'} onChange={e => updateField(selectedFieldIndex, { objectFit: e.target.value })} className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 text-xs font-black">
                                                            <option value="cover">Remplir (Cover)</option>
                                                            <option value="contain">Contenir (Contain)</option>
                                                            <option value="fill">Étirer (Fill)</option>
                                                        </select>
                                                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border dark:border-white/5 rounded-xl px-2">
                                                            <span className="text-[9px] font-black">👻</span>
                                                            <input type="range" min="0" max="1" step="0.1" value={fields[selectedFieldIndex].opacity ?? 1} onChange={e => updateField(selectedFieldIndex, { opacity: parseFloat(e.target.value) })} className="flex-1 accent-stripe-blue h-1" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase">Coins Arrondis ({fields[selectedFieldIndex].borderRadius || 0}px)</label>
                                                    <div className="flex items-center gap-3">
                                                        <input type="range" min="0" max="100" value={fields[selectedFieldIndex].borderRadius || 0} onChange={e => updateField(selectedFieldIndex, { borderRadius: parseInt(e.target.value) })} className="flex-1 accent-stripe-blue" />
                                                        <button onClick={() => updateField(selectedFieldIndex, { borderRadius: fields[selectedFieldIndex].borderRadius === 100 ? 0 : 100 })} className={`w-12 h-8 rounded-lg text-[9px] font-black border transition-all ${fields[selectedFieldIndex].borderRadius >= 50 ? 'bg-stripe-blue text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 dark:border-white/10'}`}>CERCLE</button>
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between">
                                                    <div className="text-[9px] font-black uppercase text-indigo-900 dark:text-indigo-400">Enlever Fond</div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={fields[selectedFieldIndex].removeBg || false} onChange={e => updateField(selectedFieldIndex, { removeBg: e.target.checked })} className="sr-only peer" />
                                                        <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-stripe-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {fields[selectedFieldIndex].type === 'shape' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase">Type</label>
                                                        <select value={fields[selectedFieldIndex].shapeType} onChange={e => updateField(selectedFieldIndex, { shapeType: e.target.value })} className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 text-xs font-black">
                                                            <option value="rect">Rectangle</option>
                                                            <option value="circle">Cercle</option>
                                                            <option value="line">Ligne</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase">Couleur</label>
                                                        <input type="color" value={fields[selectedFieldIndex].color} onChange={e => updateField(selectedFieldIndex, { color: e.target.value })} className="w-full h-8 rounded-xl cursor-pointer" />
                                                    </div>
                                                </div>

                                                {fields[selectedFieldIndex].shapeType !== 'line' && (
                                                    <div className="space-y-4 border-t dark:border-white/5 pt-3">
                                                        <div className="space-y-2">
                                                            <label className="text-[8px] font-black text-gray-400 uppercase">Bordure (Couleur & Taille)</label>
                                                            <div className="flex items-center gap-2">
                                                                <input type="color" value={fields[selectedFieldIndex].borderColor || '#000000'} onChange={e => updateField(selectedFieldIndex, { borderColor: e.target.value })} className="w-10 h-10 rounded-xl cursor-pointer" title="Couleur Bordure" />
                                                                <input type="number" min="0" max="20" value={fields[selectedFieldIndex].borderWidth || 0} onChange={e => updateField(selectedFieldIndex, { borderWidth: parseInt(e.target.value) })} className="w-full p-2.5 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 text-sm font-black" placeholder="Épaisseur..." />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[8px] font-black text-gray-400 uppercase">Style & Arrondi ({fields[selectedFieldIndex].borderRadius || 0}px)</label>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <select value={fields[selectedFieldIndex].borderStyle || 'solid'} onChange={e => updateField(selectedFieldIndex, { borderStyle: e.target.value })} className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 text-xs font-black">
                                                                    <option value="solid">Plein (Solid)</option>
                                                                    <option value="dashed">Pointillés (Dashed)</option>
                                                                    <option value="dotted">Points (Dotted)</option>
                                                                </select>
                                                                <input type="number" min="0" max="100" value={fields[selectedFieldIndex].borderRadius || 0} onChange={e => updateField(selectedFieldIndex, { borderRadius: parseInt(e.target.value) })} className="w-full p-2 rounded-xl bg-white dark:bg-white/5 border dark:border-white/5 text-xs font-black" placeholder="Arrondi px" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Background Section */}
                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Fond & Couleur</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex justify-between">Recto <input type="file" onChange={e => handleFileUpload(e, 'front')} className="hidden" id="recto-up" /> <span onClick={() => document.getElementById('recto-up').click()} className="text-stripe-blue cursor-pointer">↑</span></label>
                                        <div className="h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm" style={getBgStyle(frontBg)}></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex justify-between">Verso <input type="file" onChange={e => handleFileUpload(e, 'back')} className="hidden" id="verso-up" /> <span onClick={() => document.getElementById('verso-up').click()} className="text-stripe-blue cursor-pointer">↑</span></label>
                                        <div className="h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm" style={getBgStyle(backBg)}></div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-4">
                                    <h5 className="text-[9px] font-black uppercase text-gray-400">Dégradé Manuel</h5>
                                    <div className="space-y-3">
                                        {(() => {
                                            const bg = activeSide === 'front' ? frontBg : backBg;
                                            const typeMatch = bg.match(/(linear|radial|conic)-gradient/);
                                            const gType = typeMatch ? typeMatch[1] : 'linear';
                                            const matches = bg.match(/gradient\((.*)\)/);
                                            if (!matches) return <p className="text-[8px] text-gray-500 text-center py-2">Pas de dégradé actif</p>;
                                            const body = matches[1];
                                            const parts = splitGradientParts(body);
                                            const hasAngle = parts[0].includes('deg') || parts[0].includes('to ');
                                            const header = hasAngle ? parts[0] : '';
                                            const stops = hasAngle ? parts.slice(1) : parts;

                                            return stops.map((stop, idx) => {
                                                const stopMatch = stop.match(/(rgba?\(.*?\)|#[a-fA-F0-9]{3,8})\s+(\d+)%/);
                                                if (!stopMatch) return null;
                                                const stopCol = stopMatch[1];
                                                const stopPos = stopMatch[2];
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                                        <input type="color" value={stopCol.startsWith('#') ? stopCol.slice(0, 7) : '#000000'} onChange={e => {
                                                            const newStops = [...stops];
                                                            newStops[idx] = newStops[idx].replace(/(rgba?\(.*?\)|#[a-fA-F0-9]{3,8})/, e.target.value);
                                                            const newBg = `__gradient:${gType}-gradient(${header ? header + ', ' : ''}${newStops.join(', ')})`;
                                                            if (activeSide === 'front') setFrontBg(newBg); else setBackBg(newBg);
                                                        }} className="w-5 h-5 rounded cursor-pointer border-none p-0" />
                                                        <input type="range" value={stopPos} onChange={e => {
                                                            const newStops = [...stops];
                                                            newStops[idx] = newStops[idx].replace(/\d+%/, `${e.target.value}%`);
                                                            const newBg = `__gradient:${gType}-gradient(${header ? header + ', ' : ''}${newStops.join(', ')})`;
                                                            if (activeSide === 'front') setFrontBg(newBg); else setBackBg(newBg);
                                                        }} className="flex-1 accent-stripe-blue" />
                                                        <span className="text-[8px] font-black w-4">{stopPos}%</span>
                                                        <button onClick={() => {
                                                            const newStops = stops.filter((_, i) => i !== idx);
                                                            const newBg = `__gradient:${gType}-gradient(${header ? header + ', ' : ''}${newStops.join(', ')})`;
                                                            if (activeSide === 'front') setFrontBg(newBg); else setBackBg(newBg);
                                                        }} className="text-rose-500 text-[10px] font-black px-1">×</button>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <button onClick={() => {
                                        const bg = activeSide === 'front' ? frontBg : backBg;
                                        const newBg = bg.replace(/\)$/, ', #000000 100%)');
                                        if (activeSide === 'front') setFrontBg(newBg); else setBackBg(newBg);
                                    }} className="w-full py-2 border border-dashed border-gray-200 dark:border-white/10 text-[8px] font-black uppercase text-gray-400 hover:text-stripe-blue hover:border-stripe-blue transition-all">+ Ajouter Point</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#fdfdfd] dark:bg-[#0d0d0d]">
                    {/* HORIZONTAL TOOLBAR */}
                    <div className={`h-16 flex items-center px-6 gap-6 border-b ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100'} z-40`}>
                        {/* Add Tools */}
                        <div className="flex items-center gap-3 pr-6 border-r dark:border-white/10">
                            {[
                                { icon: 'T', type: 'text', label: 'Texte' },
                                { icon: '📸', type: 'image', label: '{photo}', extra: { label: '{member.photo}' } },
                                { icon: '🏛️', type: 'image', label: '{logo}', extra: { label: '{church.logo}' } },
                                { icon: '📋', type: 'text', label: 'Variables', onClick: () => addField('text', activeSide, { label: '{member.fullName}' }) },
                                { icon: '🔳', type: 'shape', label: 'Forme' },
                                { icon: '🏁', type: 'qrcode', label: 'QR' }
                            ].map(tool => (
                                <button key={tool.label} onClick={tool.onClick || (() => addField(tool.type, activeSide, tool.extra || {}))} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-stripe-blue hover:text-white transition-all shadow-sm group">
                                    <span className="text-sm">{tool.icon}</span>
                                    <span className="text-[9px] font-black uppercase text-gray-500 group-hover:text-white">{tool.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Recto / Verso Selector */}
                        <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl shadow-inner">
                            <button onClick={() => setActiveSide('front')} className={`px-6 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeSide === 'front' ? 'bg-white dark:bg-white/10 shadow shadow-stripe-blue/20 text-stripe-blue' : 'text-gray-400'}`}>Recto</button>
                            <button onClick={() => setActiveSide('back')} className={`px-6 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${activeSide === 'back' ? 'bg-white dark:bg-white/10 shadow shadow-stripe-blue/20 text-stripe-blue' : 'text-gray-400'}`}>Verso</button>
                        </div>

                        {/* View Options */}
                        <div className="flex items-center gap-3 pl-6 border-l dark:border-white/10">
                            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-xs font-black transition-all" title="Zoom Arrière">-</button>
                                <span className="text-[10px] font-black w-12 text-center cursor-pointer" onClick={() => setZoom(1)} title="Réinitialiser Zoom">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(zoom + 0.1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-xs font-black transition-all" title="Zoom Avant">+</button>
                            </div>

                            <button onClick={() => setIsVertical(!isVertical)} className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-[9px] font-black uppercase border dark:border-white/5 hover:border-stripe-blue transition-all" title="Rotation Horizontale/Verticale">{isVertical ? 'Vertical' : 'Horizontal'}</button>
                            <div className="flex gap-1">
                                <button onClick={() => updateAllTextColors('#000000')} className="w-8 h-8 rounded-xl bg-black border border-white/20 shadow-md hover:scale-110 transition-all" title="Appliquer Noir à tous les textes" />
                                <button onClick={() => updateAllTextColors('#FFFFFF')} className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-md hover:scale-110 transition-all" title="Appliquer Blanc à tous les textes" />
                            </div>
                            <button onClick={() => setShowGrid(!showGrid)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs transition-all ${showGrid ? 'bg-stripe-blue text-white shadow-lg shadow-stripe-blue/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`} title="Afficher/Masquer Grille">#</button>
                            <div className="flex items-center gap-1">
                                <button onClick={undo} disabled={historyIndex <= 0} className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs transition-all ${historyIndex > 0 ? 'hover:bg-stripe-blue hover:text-white' : 'opacity-30'}`} title="Annuler (Ctrl+Z)">⤺</button>
                                <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs transition-all ${historyIndex < history.length - 1 ? 'hover:bg-stripe-blue hover:text-white' : 'opacity-30'}`} title="Rétablir (Ctrl+Y)">⤻</button>
                            </div>
                        </div>
                    </div>

                    {/* CANVAS WORKSPACE */}
                    <div className="flex-1 overflow-auto p-12 flex flex-col items-center justify-center noscrollbar relative bg-[#f8f9fa] dark:bg-[#000000]">
                        <div
                            className="relative group transition-transform duration-200"
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <div
                                className={`shadow-2xl overflow-hidden transition-all duration-500 rounded-xl ${theme === 'dark' ? 'ring-1 ring-white/10' : 'ring-1 ring-black/5'}`}
                                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, ...getBgStyle(activeSide === 'front' ? frontBg : backBg) }}
                            >
                                {showGrid && (
                                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)`, backgroundSize: `${gridSize}px ${gridSize}px` }}></div>
                                )}
                                {fields.filter(f => f.side === activeSide).map((f, i) => {
                                    const fieldIdx = fields.indexOf(f);
                                    return (
                                        <Rnd
                                            key={f.id}
                                            size={{ width: f.width, height: f.height }}
                                            position={{ x: f.x, y: f.y }}
                                            onDragStop={(e, d) => updateField(fieldIdx, { x: d.x, y: d.y })}
                                            onResizeStop={(e, dir, ref, delta, pos) => updateField(fieldIdx, { width: ref.offsetWidth, height: ref.offsetHeight, ...pos })}
                                            bounds="parent"
                                            grid={[gridSize, gridSize]}
                                            scale={zoom}
                                            onClick={() => setSelectedFieldIndex(fieldIdx)}
                                            className={`cursor-move flex items-center justify-center border ${selectedFieldIndex === fieldIdx ? 'border-stripe-blue ring-4 ring-stripe-blue/10 bg-stripe-blue/5' : 'border-transparent hover:border-stripe-blue/30'}`}
                                        >
                                            {f.type === 'text' && (
                                                <div style={{ color: f.color, fontSize: f.fontSize, fontFamily: f.fontFamily, textAlign: f.textAlign, fontWeight: f.bold ? 'bold' : 'normal', fontStyle: f.italic ? 'italic' : 'normal', width: '100%', pointerEvents: 'none', lineHeight: '1.2' }}>
                                                    {getPreviewText(f)}
                                                </div>
                                            )}
                                            {f.type === 'image' && (
                                                <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ borderRadius: f.borderRadius, opacity: f.opacity ?? 1, backgroundColor: f.removeBg ? 'transparent' : '#f9fafb', pointerEvents: 'none' }}>
                                                    <img src={f.label === '{church.logo}' ? CHURCH_LOGO_SAMPLE : MEMBER_PHOTO_SAMPLE} alt="" className="w-full h-full" style={{ borderRadius: f.borderRadius, objectFit: f.objectFit || 'cover' }} />
                                                </div>
                                            )}
                                            {f.type === 'qrcode' && <div style={{ pointerEvents: 'none' }}><QRCodeCanvas value="MemberID" size={Math.min(f.width, f.height)} fgColor={f.color || '#000000'} bgColor="transparent" /></div>}
                                            {f.type === 'shape' && (
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: f.shapeType === 'line' ? (f.height || 2) : '100%',
                                                        backgroundColor: f.color,
                                                        borderRadius: f.shapeType === 'circle' ? '100%' : (f.borderRadius || 0),
                                                        border: f.borderWidth ? `${f.borderWidth}px ${f.borderStyle || 'solid'} ${f.borderColor || '#000000'}` : 'none',
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            )}
                                        </Rnd>
                                    );
                                })}
                            </div>

                            {/* Visual Guide Labels */}
                            <div className="absolute -top-8 left-0 text-[10px] font-black uppercase text-gray-400 tracking-widest">{activeSide === 'front' ? 'Face Recto' : 'Face Verso'}</div>
                            <div className="absolute -bottom-8 right-0 text-[10px] font-black uppercase text-stripe-blue tracking-widest">{CARD_WIDTH}x{CARD_HEIGHT}px</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: Presets & Library */}
                <div className={`w-[280px] shrink-0 border-l flex flex-col ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100'}`}>
                    <div className="p-4 border-b dark:border-white/5">
                        <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400">Styles & Bibliothèque</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-8 noscrollbar">
                        {/* Presets Dégradés */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Presets Dégradés</h4>
                                {presetsToShow < BG_PRESETS.length && (
                                    <button onClick={() => setPresetsToShow(BG_PRESETS.length)} className="text-[8px] font-black uppercase text-stripe-blue">Voir Tout</button>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {BG_PRESETS.slice(0, presetsToShow).map(p => (
                                    <button key={p.id} onClick={() => { setFrontBg(`__gradient:${p.front}`); setBackBg(`__gradient:${p.back}`); }} className="h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 hover:border-stripe-blue transition-all shadow-sm" style={getBgStyle(p.front)} title={p.label} />
                                ))}
                            </div>
                        </div>

                        {/* User Templates removed from here */}

                        {/* System Presets */}
                        <div className="space-y-4 pt-6 border-t dark:border-white/5">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Prédéfinis</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {SYSTEM_TEMPLATES.map(tpl => (
                                    <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="p-2.5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-stripe-blue transition-all group hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div className="h-14 rounded-xl mb-2 overflow-hidden opacity-80 group-hover:opacity-100 transition-all shadow-inner" style={getBgStyle(tpl.frontBg)}></div>
                                        <div className="text-[9px] font-black truncate uppercase tracking-tighter">{tpl.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full shadow-2xl z-[100] animate-slide-up ${notification.type === 'error' ? 'bg-rose-500' : 'bg-stripe-blue'} text-white text-[11px] font-black uppercase tracking-widest`}>
                    {notification.message}
                </div>
            )}

            {showPreview && (
                <MemberCardGeneratorModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    template={{ name, frontBackgroundUrl: frontBg, backBackgroundUrl: backBg, layoutConfig: { fields, isVertical } }}
                    member={{ id: 1, firstName: 'Jean', lastName: 'Baptiste', memberCode: 'MD-1029', photo: MEMBER_PHOTO_SAMPLE, phone: '4848-4848', email: 'jean@elyon.com' }}
                    viewOnly={true}
                />
            )}

            <style>{`
                .shadow-premium { box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.4); }
                .noscrollbar::-webkit-scrollbar { display: none; }
                .noscrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default CardTemplatesManager;
