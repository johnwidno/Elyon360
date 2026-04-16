import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import AlertModal from '../../components/ChurchAlertModal';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
    User, Bell, Heart, MessageSquare, LogOut, LayoutDashboard,
    Settings, BookOpen, Users, Building2, Activity,
    Mail, Phone, Edit3, Check, X, Menu, ChevronRight, ChevronLeft,
    MapPin, FileText, Send, Plus, Calendar, Home, Maximize2, CreditCard, Search, Image, RefreshCw, Clock, ChevronDown,
    Moon, Sun, Droplets, History, CloudOff, CheckCircle, Download, Filter, Music, Star,
    Camera, Award, PlusCircle, ShieldAlert, Maximize, AlertCircle, Lock, TrendingUp, Save, MoreHorizontal, Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MemberRequests from './MemberRequests';
import MemberCardGeneratorModal from '../../components/Admin/Members/MemberCardGeneratorModal';
import SundaySchoolReportDetails from '../Admin/SundaySchool/SundaySchoolReportDetails';
import MemberWorship from './MemberWorship';

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const SIDEBAR_BG = '#080c14'; // Deeper navy for premium feel
const SIDEBAR_BORDER = '#151b28';
const ACTIVE_BG = 'rgba(99, 102, 241, 0.1)';
const ACTIVE_CLR = '#6366f1';
const BORDER_CLR = '#f1f5f9';
const BG_CLR = '#f8fafc';
const FONT = "'Plus Jakarta Sans', sans-serif";
const SERIF = "'Plus Jakarta Sans', sans-serif";

const POST_CATEGORIES = [
    { value: 'general', label: '📢 Général', color: 'blue' },
    { value: 'concert', label: '🎵 Concert', color: 'indigo' },
    { value: 'culte', label: '🙏 Culte', color: 'amber' },
    { value: 'visite', label: '🤝 Visite', color: 'green' },
    { value: 'jobs', label: '💼 Job', color: 'teal' },
    { value: 'bourse', label: '🎓 Bourse', color: 'blue' },
    { value: 'event', label: '🗓️ Événement', color: 'rose' },
    { value: 'formation', label: '📚 Formation', color: 'cyan' },
    { value: 'etude', label: '📖 Étude', color: 'sky' },
    { value: 'services', label: '🛠️ Services', color: 'orange' },
    { value: 'deces', label: '🕯️ Décès', color: 'slate' },
    { value: 'mariage', label: '💍 Mariage', color: 'rose' },
    { value: 'bapteme', label: '💧 Baptême', color: 'blue' },
    { value: 'anniversaire', label: '🎂 Anniversaire', color: 'yellow' },
    { value: 'encouragement', label: '✨ Encouragement', color: 'amber' },
    { value: 'priere', label: '🙏 Prière', color: 'indigo' },
    { value: 'chant', label: '🎶 Chant', color: 'violet' },
    { value: 'verset', label: '📜 Verset', color: 'emerald' },
    { value: 'ventes', label: '🏷️ Ventes', color: 'green' },
    { value: 'achat', label: '🛒 Achat', color: 'blue' },
    { value: 'transfert', label: '🔄 Transfert', color: 'slate' },
    { value: 'dons', label: '💝 Dons', color: 'red' },
    { value: 'sos', label: '🆘 SOS', color: 'rose' },
    { value: 'demande', label: '❓ Demande', color: 'orange' },
    { value: 'autre', label: '➕ Autre', color: 'gray' },
];

// ─── IMAGE URL HELPER ───────────────────────────────────────────────────────
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
function Card({ children, className = '', style = {} }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div
            className={`bg-white dark:bg-slate-800 rounded-[2rem] border transition-all duration-300 ${className}`}
            style={{ 
                borderColor: isDark ? '#334155' : '#f1f5f9', 
                boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(99,102,241,0.05)',
                ...style 
            }}
        >
            {children}
        </div>
    );
}


// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function PageTitle({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h1 className="font-bold text-gray-900 dark:text-white dark:text-white" style={{ fontSize: '24px', letterSpacing: '-0.2px' }}>{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1 text-sm">{subtitle}</p>}
        </div>
    );
}

// ─── ICON CIRCLE ──────────────────────────────────────────────────────────────
function IconCircle({ icon, amber = false }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
                background: amber ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#1e293b' : '#eef0f6'),
                color: amber ? (isDark ? '#f59e0b' : '#f59e0b') : (isDark ? '#94a3b8' : '#8a94a6')
            }}
        >
            {icon}
        </div>
    );
}

// ─── ROW CARD ─────────────────────────────────────────────────────────────────
function RowCard({ left, center, right }) {
    return (
        <Card className="flex items-center gap-4 px-4 py-4">
            {left}
            <div className="flex-1 min-w-0">{center}</div>
            <div className="shrink-0">{right}</div>
        </Card>
    );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, color = 'gray' }) {
    const map = {
        amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
        gray: 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-700',
        blue: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
        rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30',
    };
    const classes = map[color] || map.gray;
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border ${classes}`}>
            {label}
        </span>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MemberHome() {
    const navigate = useNavigate();
    const { logout, user: authUser, updateUser } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [donations, setDonations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [events, setEvents] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editing, setEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile drawer
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // Dropdown for profile
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // Dropdown for notifications
    const [isActivityExpanded, setIsActivityExpanded] = useState(false); // Accordion for recent activity
    const searchRef = useRef(null);
    const [isOldNotificationsExpanded, setIsOldNotificationsExpanded] = useState(false);
    const [isSundayHistoryExpanded, setIsSundayHistoryExpanded] = useState(false);
    const [isGroupsHistoryExpanded, setIsGroupsHistoryExpanded] = useState(false);
    const [isMinistriesHistoryExpanded, setIsMinistriesHistoryExpanded] = useState(false);
    const [isSundayAttendanceExpanded, setIsSundayAttendanceExpanded] = useState(false);
    const [isSundayPastAttendanceExpanded, setIsSundayPastAttendanceExpanded] = useState(false);
    const [ssAttendanceFilter, setSsAttendanceFilter] = useState({ startDate: '', endDate: '', month: 'all', year: new Date().getFullYear().toString() });
    const [sundayAttendance, setSundayAttendance] = useState([]);
    const [sundayClassReports, setSundayClassReports] = useState([]);
    const [ssReportModal, setSsReportModal] = useState({ show: false, id: null });
    const [ssReportFilter, setSsReportFilter] = useState({ query: '', startDate: '', endDate: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [ceremonies, setCeremonies] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        email: '',
        phone: '',
        address: ''
    });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });
    const [cardRequestModal, setCardRequestModal] = useState({ show: false, type: '', desc: '', reason: '' });
    const [isZoomed, setIsZoomed] = useState(false);
    const [cardZoomSide, setCardZoomSide] = useState(null); // 'front' or 'back'
    const [activeCard, setActiveCard] = useState(null);
    const [template, setTemplate] = useState(null);
    const [loadingCard, setLoadingCard] = useState(false);
    const fileInputRef = useRef(null);

    // ── Community Posts State ─────────────────────────────────────────────────
    const [communityPosts, setCommunityPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', type: 'general', content: '', imageFile: null, imageUrl: '', targetSubtypeId: '', visibilityScope: 'church' });
    const [subtypes, setSubtypes] = useState([]);
    const [posting, setPosting] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [postFilter, setPostFilter] = useState('all');
    const [postsLimit, setPostsLimit] = useState(window.innerWidth > 640 ? 4 : 5);
    const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
    const [members, setMembers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [eventIndex, setEventIndex] = useState(0);

    // ── fetch ──────────────────────────────────────────────────────────────────
    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.error("Mark as read error:", err);
            }
        }
        goTab('notifications');
        setIsNotificationsOpen(false);
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const res = await api.get(`/members/global-search?q=${val}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchData = async () => {
        try {
            console.log("MemberHome: Fetching data...");
            const [
                profRes, donRes, notifRes, postsRes, subRes, eventsRes, ceremoniesRes,
                ssAttendanceRes, ssReportsRes
            ] = await Promise.all([
                api.get('/members/profile').catch(err => { console.error("Profile fetch error:", err); return { data: null }; }),
                api.get('/donations/my').catch(err => { console.error("Donations fetch error:", err); return { data: [] }; }),
                api.get('/notifications').catch(err => { console.error("Notifications fetch error:", err); return { data: [] }; }),
                api.get('/community-posts').catch(err => { console.error("Posts fetch error:", err); return { data: [] }; }),
                api.get('/contact-subtypes').catch(err => { console.error("Subtypes fetch error:", err); return { data: [] }; }),
                api.get('/events').catch(err => { console.error("Events fetch error:", err); return { data: [] }; }),
                api.get('/ceremonies').catch(err => { console.error("Ceremonies fetch error:", err); return { data: [] }; }),
                api.get('/sunday-school/my-attendance').catch(err => { console.error("SS Attendance fetch error:", err); return { data: [] }; }),
                api.get('/sunday-school/my-class-reports').catch(err => { console.error("SS Reports fetch error:", err); return { data: [] }; })
            ]);

            if (ssAttendanceRes?.data) setSundayAttendance(ssAttendanceRes.data);
            if (ssReportsRes?.data) setSundayClassReports(ssReportsRes.data);

            if (subRes.data) {
                setSubtypes(subRes.data.filter(s => s.type?.name === 'Membre' || s.contactTypeId === 1)); // Adjust filter based on API response
            }

            if (profRes.data) {
                setProfile(profRes.data);
                setFormData({
                    firstName: profRes.data.firstName || '',
                    lastName: profRes.data.lastName || '',
                    nickname: profRes.data.nickname || '',
                    email: profRes.data.email || '',
                    phone: profRes.data.phone || '',
                    address: profRes.data.address || '',
                    gender: profRes.data.gender || '',
                    birthPlace: profRes.data.birthPlace || '',
                    status: profRes.data.status || 'Actif',
                    maritalStatus: profRes.data.maritalStatus || '',
                    spouseName: profRes.data.spouseName || ''
                });
            }

            setDonations(Array.isArray(donRes.data) ? donRes.data : []);
            setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
            setCommunityPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
            setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
            setCeremonies(Array.isArray(ceremoniesRes?.data) ? ceremoniesRes.data : []);

            // Fetch community members for the dashboard
            try {
                const memRes = await api.get('/members?limit=12');
                setMembers(Array.isArray(memRes.data) ? memRes.data : []);
            } catch (memErr) {
                console.error('Members fetch error:', memErr);
            }

            // NEW: Sync authUser with latest roles and church info to ensure switcher works
            if (profRes.data && authUser) {
                const latestRoles = Array.isArray(profRes.data.role) ? profRes.data.role : [profRes.data.role];
                if (JSON.stringify(latestRoles) !== JSON.stringify(authUser.role)) {
                    updateUser({
                        role: latestRoles,
                        churchLogo: profRes.data.church?.logoUrl
                    });
                }
            }

            console.log("MemberHome: Data loaded successfully");

            // Fetch Active Member Card using /me (uses JWT user ID directly)
            try {
                const cardRes = await api.get('/member-cards/me');
                console.log('[DEBUG] Member cards fetched:', cardRes.data);
                const cards = cardRes.data || [];
                const active = cards.find(c => c.status === 'Active' || c.status === 'active');
                console.log('[DEBUG] Active card found:', active);
                if (active) {
                    setActiveCard(active);
                    if (active.templateId) {
                        try {
                            const tplRes = await api.get(`/card-templates/${active.templateId}`);
                            setTemplate(tplRes.data);
                        } catch (tplErr) {
                            console.error('Template fetch error:', tplErr);
                        }
                    }
                }
            } catch (err) {
                console.error("Member Card fetch error:", err);
            }
        } catch (e) {
            console.error("MemberHome Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => { fetchData(); }, []);

    const userRoles = Array.isArray(profile?.role) ? profile.role : [profile?.role].filter(Boolean);
    const isStaff = userRoles.some(r => ['admin', 'super_admin', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r));
    const initials = profile
        ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
        : '—';

    // ── Card Display (inner component) ──────────────────────────────────────────
    const CardDisplay = ({ card, side }) => {
        if (!template) return <div className="w-[324px] h-[204px] bg-gray-50 flex items-center justify-center text-gray-300 animate-pulse rounded-xl">Chargement...</div>;

        const isVertical = template.layoutConfig?.isVertical || false;
        const CARD_WIDTH = isVertical ? 204 : 324;
        const CARD_HEIGHT = isVertical ? 324 : 204;

        const getBgStyle = (bg) => {
            if (!bg) return { backgroundColor: '#ffffff' };
            if (bg.startsWith('__gradient:')) {
                return {
                    backgroundImage: bg.split(':')[1],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'transparent'
                };
            }
            return {
                backgroundImage: `url("${getImageUrl(bg)}")`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#ffffff'
            };
        };

        const renderFieldValue = (field) => {
            if (field.type === 'image') {
                const isLogo = field.label === '{church.logo}' || field.id === 'churchLogo' || field.label?.toLowerCase().includes('logo');
                const isPhoto = field.label === '{member.photo}' || field.id === 'photo' || field.label?.toLowerCase().includes('photo') || field.label?.toLowerCase().includes('portrait');

                const imageStyle = {
                    borderRadius: field.borderRadius ? `${field.borderRadius}px` : '0px',
                    mixBlendMode: field.multiply ? 'multiply' : 'normal',
                    width: '100%',
                    height: '100%',
                    objectFit: isLogo ? 'contain' : 'cover'
                };

                if (isLogo) {
                    const logoUrl = getImageUrl(profile?.church?.logoUrl);
                    return logoUrl ? <img src={logoUrl} alt="logo" style={imageStyle} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-100 text-[8px] flex items-center justify-center">Logo</div>;
                }
                if (isPhoto) {
                    const photoUrl = getImageUrl(profile?.photo);
                    return photoUrl ? <img src={photoUrl} alt="avatar" style={imageStyle} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-100 text-[8px] flex items-center justify-center">Photo</div>;
                }
                if (field.imageUrl) {
                    return <img src={getImageUrl(field.imageUrl)} alt="custom" style={imageStyle} crossOrigin="anonymous" />;
                }
                return null;
            }
            if (field.type === 'shape') {
                return (
                    <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: field.color || '#6366f1',
                        opacity: field.opacity || 1,
                        borderRadius: field.shapeType === 'circle' ? '100%' : field.shapeType === 'rounded' ? `${field.borderRadius || 4}px` : '0',
                        border: field.borderWidth ? `${field.borderWidth}px ${field.borderStyle || 'solid'} ${field.borderColor || field.color}` : 'none',
                        clipPath: field.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                        borderBottom: field.shapeType === 'line' ? `${field.borderWidth || 2}px solid ${field.color}` : 'none',
                        height: field.shapeType === 'line' ? `${field.borderWidth || 2}px` : '100%'
                    }} />
                );
            }
            if (field.type === 'qrcode') {
                let qrValue = field.label || '{member.id}';
                qrValue = qrValue.replace('{member.id}', (card.cardNumber || profile.id).toString());
                return <QRCodeSVG value={qrValue} width="100%" height="100%" fgColor={field.color || '#000000'} />;
            }
            if (field.type === 'text') {
                let val = field.label || '';
                const safeReplace = (str, pattern, replacement) => (str || '').replace(new RegExp(pattern, 'gi'), replacement || '-');

                val = safeReplace(val, '{member.fullName}', `${profile?.firstName || ''} ${profile?.lastName || ''}` || '-');
                val = safeReplace(val, '{member.firstName}', profile?.firstName || '-');
                val = safeReplace(val, '{member.lastName}', profile?.lastName || '-');
                val = safeReplace(val, '{member.id}', card.cardNumber || profile?.id || '-');
                val = safeReplace(val, '{member.code}', profile?.memberCode || profile?.code || '-');
                val = safeReplace(val, '{member.phone}', profile?.phone || '-');
                val = safeReplace(val, '{member.gender}', profile?.gender === 'M' ? 'Masculin' : profile?.gender === 'F' ? 'Féminin' : profile?.gender || '-');
                val = safeReplace(val, '{member.nif}', profile?.nifCin || '-');
                val = safeReplace(val, '{member.bloodGroup}', profile?.bloodGroup || '-');
                val = safeReplace(val, '{member.address}', [profile?.address, profile?.city, profile?.country].filter(Boolean).join(', ') || '-');
                // Extended checks to map church info correctly if it comes from different payload areas
                const churchName = profile?.church?.name || authUser?.church?.name || '-';
                const churchAcronym = profile?.church?.acronym || authUser?.church?.acronym || '-';
                const churchEmail = profile?.church?.email || authUser?.church?.email || '-';
                const churchPhone = profile?.church?.phone || authUser?.church?.phone || '-';
                const churchAddress = profile?.church?.address || authUser?.church?.address || '-';
                const churchPastor = profile?.church?.pastorName || profile?.church?.pastor || authUser?.church?.pastorName || '-';

                val = safeReplace(val, '{church.name}', churchName);
                val = safeReplace(val, '{church.acronym}', churchAcronym);
                val = safeReplace(val, '{church.email}', churchEmail);
                val = safeReplace(val, '{church.phone}', churchPhone);
                val = safeReplace(val, '{church.address}', churchAddress);
                val = safeReplace(val, '{church.pastor}', churchPastor);


                const textStyle = {
                    color: field.color || '#000',
                    fontSize: `${field.fontSize || 10}px`,
                    fontFamily: field.fontFamily || 'Arial',
                    fontWeight: field.bold ? 'bold' : 'normal',
                    fontStyle: field.italic ? 'italic' : 'normal',
                    textTransform: field.textTransform || 'none',
                    textAlign: field.textAlign || 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    width: '100%',
                    height: '100%',
                    lineHeight: '1.1'
                };

                return <div style={textStyle}>{val}</div>;
            }
            return null;
        };

        const bgUrl = side === 'front' ? template.frontBackgroundUrl : template.backBackgroundUrl;

        return (
            <div
                className="relative bg-white overflow-hidden"
                style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
            >
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...getBgStyle(bgUrl) }} />
                {template.layoutConfig?.fields?.filter(f => String(f.side).toLowerCase() === side || (!f.side && side === 'front') || (f.side === 'Verso' && side === 'back')).map(field => (
                    <div key={field.id} style={{
                        position: 'absolute',
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        width: field.width ? `${field.width}px` : 'auto',
                        height: field.height ? `${field.height}px` : 'auto',
                        zIndex: 10,
                        opacity: field.opacity !== undefined ? field.opacity : 1
                    }}>
                        {renderFieldValue(field)}
                    </div>
                ))}
            </div>
        );
    };

    const handleQuickCardRequest = (type, desc) => {
        setCardRequestModal({ show: true, type, desc, reason: '' });
    };

    const handleConfirmCardRequest = async () => {
        if (cardRequestModal.type !== 'member_card_new' && !cardRequestModal.reason.trim()) {
            setAlertMessage({ show: true, title: 'Attention', message: 'Veuillez fournir une explication justifiant votre demande.', type: 'error' });
            return;
        }

        try {
            await api.post('/member-requests', {
                title: cardRequestModal.desc,
                requestType: cardRequestModal.type,
                description: cardRequestModal.reason || `Généré automatiquement depuis l'espace Carte Membre.`
            });
            setCardRequestModal({ show: false, type: '', desc: '', reason: '' });
            setAlertMessage({ show: true, title: 'Demande Envoyée', message: 'Votre demande a été transmise à l\'administration.', type: 'success' });
        } catch (err) {
            setAlertMessage({ show: true, title: 'Erreur', message: 'Impossible d\'envoyer la demande.', type: 'error' });
        }
    };

    const handlePhotoClick = () => {
        setIsZoomed(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setSavingProfile(true);
            const res = await api.post('/churches/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const photoUrl = res.data.filePath;
            await api.put('/members/profile', { photo: photoUrl });
            fetchData();
            setAlertMessage({ show: true, title: 'Succès', message: 'Photo mise à jour', type: 'success' });
        } catch (err) {
            setAlertMessage({ show: true, title: 'Erreur', message: 'Erreur lors du téléchargement', type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.content.trim()) return;
        setPosting(true);
        try {
            let finalImageUrl = newPost.imageUrl;
            if (newPost.imageFile) {
                const fd = new FormData();
                fd.append('image', newPost.imageFile);
                const uploadRes = await api.post('/churches/upload-image', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImageUrl = uploadRes.data.filePath;
            }

            const postData = {
                title: newPost.title,
                type: newPost.type,
                content: newPost.content,
                imageUrl: finalImageUrl,
                targetSubtypeId: newPost.visibilityScope === 'subtype' ? (newPost.targetSubtypeId || null) : null,
                isGlobal: newPost.visibilityScope === 'global'
            };

            let res;
            if (editingPostId) {
                res = await api.put(`/community-posts/${editingPostId}`, postData);
                setCommunityPosts(prev => prev.map(p => p.id === editingPostId ? res.data : p));
                setAlertMessage({ show: true, type: 'success', message: 'Publication mise à jour !', title: 'Succès' });
            } else {
                res = await api.post('/community-posts', postData);
                console.log("[DEBUG] New post res:", res.data);
                setCommunityPosts(prev => [res.data, ...prev]);
                setAlertMessage({ show: true, type: 'success', message: 'Publication ajoutée !', title: 'Succès' });
            }

            setNewPost({ title: '', type: 'general', content: '', imageFile: null, imageUrl: '', targetSubtypeId: '', visibilityScope: 'church' });
            setIsPostModalOpen(false);
            setEditingPostId(null);
        } catch (err) {
            console.error("[ERROR] Post submission failed:", err);
            const serverMsg = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la publication';
            setAlertMessage({ show: true, type: 'error', message: serverMsg, title: 'Erreur' });
        } finally {
            setPosting(false);
        }
    };

    const handleEditPost = (post) => {
        setNewPost({
            title: post.title || '',
            type: post.type || 'general',
            content: post.content || '',
            targetSubtypeId: post.targetSubtypeId || '',
            imageUrl: post.imageUrl || '',
            imageFile: null,
            visibilityScope: post.isGlobal ? 'global' : (post.targetSubtypeId ? 'subtype' : 'church')
        });
        setEditingPostId(post.id);
        setIsPostModalOpen(true);
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) return;
        try {
            await api.delete(`/community-posts/${id}`);
            setCommunityPosts(communityPosts.filter(p => p.id !== id));
            setAlertMessage({ show: true, type: 'success', message: 'Publication supprimée.', title: 'Succès' });
        } catch (err) {
            setAlertMessage({ show: true, type: 'error', message: 'Erreur lors de la suppression.', title: 'Erreur' });
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault(); setSavingProfile(true);
        try { await api.put('/members/profile', formData); setEditing(false); fetchData(); }
        catch { setAlertMessage({ show: true, title: 'Erreur', message: 'Erreur lors de la mise à jour', type: 'error' }); }
        finally { setSavingProfile(false); }
    };

    // ── helpers ────────────────────────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const locale = lang === 'FR' ? 'fr-FR' : 'en-US';

    const totalGivingHTG = donations
        .filter(d => (d.currency || 'HTG') === 'HTG')
        .reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    const totalGivingUSD = donations
        .filter(d => d.currency === 'USD')
        .reduce((s, d) => s + parseFloat(d.amount || 0), 0);

    const displayTotal = totalGivingUSD > 0
        ? `${totalGivingHTG.toLocaleString(locale)} HTG + ${totalGivingUSD.toLocaleString(locale)} USD`
        : `${totalGivingHTG.toLocaleString(locale)} HTG`;



    // Activity feed built from donations + notifications (most recent first)
    const activityItems = [
        ...donations.map(d => ({
            id: `don-${d.id}`,
            timestamp: new Date(d.date).getTime(),
            icon: <Heart size={16} />, amber: true,
            text: `${t('donation_of', 'Don de')} ${parseFloat(d.amount).toLocaleString()} ${d.currency || 'HTG'} ${t('recorded', 'enregistré')}`,
            date: d.date ? new Date(d.date).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            badge: t('donation', 'Don'), badgeColor: 'rose'
        })),
        ...notifications.map(n => ({
            id: `notif-${n.id}`,
            timestamp: new Date(n.createdAt).getTime(),
            icon: <Bell size={16} />, amber: false,
            text: n.title,
            date: n.createdAt ? new Date(n.createdAt).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            badge: t('notification', 'Notification'), badgeColor: 'blue'
        }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);

    // Sunday School Helpers
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentMonthAttendance = sundayAttendance.filter(a => {
        const d = new Date(a.date);
        return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    });

    const processedAttendance = sundayAttendance.filter(a => {
        const d = new Date(a.date);
        const dateStr = d.toISOString().split('T')[0];

        // Range match
        const startMatch = !ssAttendanceFilter.startDate || dateStr >= ssAttendanceFilter.startDate;
        const endMatch = !ssAttendanceFilter.endDate || dateStr <= ssAttendanceFilter.endDate;

        // Month/Year match
        const monthMatch = ssAttendanceFilter.month === 'all' || (d.getMonth() + 1).toString() === ssAttendanceFilter.month;
        const yearMatch = !ssAttendanceFilter.year || d.getFullYear().toString() === ssAttendanceFilter.year;

        return startMatch && endMatch && monthMatch && yearMatch;
    });

    const processedReports = sundayClassReports.filter(r => {
        const q = ssReportFilter.query.toLowerCase();
        const titleMatch = !q ||
            (r.lessonTitle?.toLowerCase().includes(q)) ||
            (r.title?.toLowerCase().includes(q)) ||
            (r.class?.name?.toLowerCase().includes(q));

        const d = new Date(r.date).toISOString().split('T')[0];
        const startMatch = !ssReportFilter.startDate || d >= ssReportFilter.startDate;
        const endMatch = !ssReportFilter.endDate || d <= ssReportFilter.endDate;

        return titleMatch && startMatch && endMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // ── nav items ──────────────────────────────────────────────────────────────
    const navItems = [
        { id: 'dashboard', label: t('overview', "Vue d'ensemble"), icon: <LayoutDashboard size={15} /> },
        { id: 'profile', label: t('my_profile', 'Mon profil'), icon: <User size={15} /> },
        { id: 'events', label: t('upcoming_events', 'Événements à venir'), icon: <Calendar size={15} /> },
        { id: 'activity', label: t('recent_activity', 'Activité récente'), icon: <Activity size={15} /> },
        { id: 'requests', label: t('my_requests', 'Mes demandes'), icon: <FileText size={15} /> },
        { id: 'donations', label: t('donation_history', 'Historique des dons'), icon: <Heart size={15} /> },
        { id: 'communion', label: t('holy_communion', 'Sainte Cène'), icon: <Droplets size={15} /> },
        { id: 'sunday_school', label: t('sunday_school', 'École du dimanche'), icon: <BookOpen size={15} /> },
        { id: 'worship', label: t('worship', 'Cultes & Événements'), icon: <Music size={15} /> },
        { id: 'groups', label: t('groups', 'Groupes'), icon: <Users size={15} /> },
        { id: 'ministries', label: t('ministries', 'Ministères'), icon: <Building2 size={15} /> },
        { id: 'my_card', label: t('my_member_card', 'Ma carte membre'), icon: <CreditCard size={15} /> }
    ];

    // ── nav click (close sidebar on mobile) ────────────────────────────────────
    const goTab = (id) => { setActiveTab(id); setSidebarOpen(false); };

    // ── loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: BG_CLR, fontFamily: FONT }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">{t('loading')}…</p>
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // SIDEBAR (shared between desktop + mobile drawer)
    // ═══════════════════════════════════════════════════════════════════════════
    const SidebarContent = () => (
        <div className="flex flex-col h-full border-r relative overflow-hidden" style={{ background: SIDEBAR_BG, borderColor: SIDEBAR_BORDER }}>
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-indigo-500/5 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            {/* Logo & Church Info (Refined as requested) */}
            <div className="px-6 py-10 border-b relative z-10" style={{ borderColor: SIDEBAR_BORDER }}>
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black overflow-hidden bg-white shadow-lg relative group transition-transform hover:scale-105 active:scale-95">
                        {profile?.church?.logoUrl ? (
                            <img src={getImageUrl(profile.church.logoUrl)} alt="Logo" className="w-full h-full object-contain p-1 transition-transform group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                                <span className="font-black text-white text-sm">{(profile?.church?.acronym || profile?.church?.name || '✝')[0].toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center gap-0.5">
                        <h1 className="text-[11px] font-bold leading-none tracking-tight text-white whitespace-nowrap opacity-50">
                            Elyon Syst <span className="text-orange-500">360</span>
                        </h1>
                        <h2 className="text-white font-black text-[14px] leading-tight tracking-tight truncate">
                            {profile?.church?.acronym || 'Sigle'}
                        </h2>
                        <p className="text-slate-500 text-[9px] font-medium tracking-tight leading-tight truncate max-w-[140px]" title={profile?.church?.name}>
                            {profile?.church?.name || 'Église de Dieu'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-8 overflow-y-auto noscrollbar relative z-10">
                <div className="space-y-1.5">
                    {navItems.map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => goTab(item.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group relative overflow-hidden`}
                                style={{
                                    background: active ? ACTIVE_BG : 'transparent',
                                }}>
                                {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />}
                                <span className={`transition-all duration-300 ${active ? 'text-indigo-500 scale-110' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'}`}>
                                    {React.cloneElement(item.icon, { size: 18, strokeWidth: active ? 2.5 : 2 })}
                                </span>
                                <span className={`text-[13px] tracking-tight transition-colors ${active ? 'font-black text-white' : 'font-bold text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                                {item.badge && (
                                    <span className="ml-auto px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Logout at bottom */}
            <div className="p-4 mt-auto border-t relative z-10" style={{ borderColor: SIDEBAR_BORDER }}>
                <button onClick={logout}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-red-400/80 hover:text-red-400 hover:bg-red-500/10 group">
                    <LogOut size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-[13px] font-black tracking-tight">{t('logout', 'Déconnexion')}</span>
                </button>
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className={`flex h-screen overflow-hidden transition-colors group/main ${isDark ? 'bg-slate-950' : ''}`} style={{ fontFamily: FONT, background: isDark ? '#020617' : BG_CLR }}>

            {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
            <div className="hidden lg:flex flex-col shrink-0 h-full overflow-hidden" style={{ width: '260px' }}>
                <SidebarContent />
            </div>

            {/* ── MOBILE DRAWER OVERLAY ────────────────────────────────────── */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-[120] flex">
                    <div className="flex flex-col shrink-0 h-full animate-in slide-in-from-left duration-300" style={{ width: '260px' }}>
                        <SidebarContent />
                    </div>
                    <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                </div>
            )}

            {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── TOP HEADER BAR ──────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 shrink-0 relative transition-all duration-300"
                    style={{ 
                        height: '74px', 
                        background: isDark ? 'rgba(8, 12, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(16px)',
                        borderBottom: `1px solid ${isDark ? '#151b28' : '#f1f5f9'}`, 
                        zIndex: 90 
                    }}>
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-1 text-slate-800 dark:text-slate-200 transition-all active:scale-95"
                            onClick={() => setSidebarOpen(true)}>
                            <Menu size={26} />
                        </button>
                        <div className="flex flex-col justify-center">
                            {/* Desktop Header Content (Tab Title) */}
                            <div className="hidden lg:block">
                                <h1 className="text-[16px] font-black leading-none tracking-tight text-slate-900 dark:text-white uppercase italic">
                                    {navItems.find(n => n.id === activeTab)?.label || 'Tableau de bord'}
                                </h1>
                                <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-widest opacity-60">
                                    Espace Membre
                                </p>
                            </div>

                            {/* Mobile Header Content (Church Branding) */}
                            <div className="lg:hidden">
                                <h1 className="text-[14px] font-black leading-none tracking-tight flex items-center gap-1.5 whitespace-nowrap" style={{ color: isDark ? '#f8fafc' : '#111827' }}>
                                    Elyon Syst <span className="text-orange-500">360</span>
                                </h1>
                                <div className="group relative">
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-tight cursor-help" title={profile?.church?.name}>
                                        {profile?.church?.acronym || 'SIGLE'}
                                    </p>
                                    {/* Tooltip for touch/mobile could be title attribute or a simple overlay */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl hidden md:block group relative">
                    <div className={`relative flex items-center h-11 px-4 rounded-xl border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-transparent focus-within:bg-white focus-within:border-indigo-500'}`}>
                        <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={t('search_placeholder', 'Rechercher des membres (LinkedIn style)...')} 
                            className="bg-transparent border-none outline-none font-medium ml-3 w-full text-sm placeholder:text-slate-400" 
                        />
                        {isSearching && <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent mr-2"></div>}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="max-h-[400px] overflow-y-auto">
                                {searchResults.map(m => (
                                    <button 
                                        key={m.id} 
                                        onClick={() => {
                                            navigate(`/member/profile/${m.id}`);
                                            setSearchResults([]);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 text-left transition-colors border-b last:border-b-0 ${isDark ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0">
                                            {m.photo ? (
                                                <img src={getImageUrl(m.photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-black text-sm">
                                                    {m.firstName?.[0]}{m.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{m.firstName} {m.lastName}</p>
                                            <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5 uppercase tracking-widest">
                                                <MapPin size={10} /> {m.church?.name || 'ElyonSys Platform'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 transition-all hover:scale-110 active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700">
                             {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>

                        <button onClick={toggleLang} className="text-[13px] font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors px-2 py-1">
                            {lang === 'FR' ? 'FR/EN' : 'EN/FR'}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-800'}`}
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                <Bell size={24} className="text-[#6366f1]" strokeWidth={2.5} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-indigo-600 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-[101] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                        <div className="p-6 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm italic uppercase tracking-widest">{t('notifications', 'Notifications')}</h4>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto noscrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-400 italic">Aucune notification</div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n.id} className={`p-4 border-b border-gray-50 dark:border-slate-700 flex gap-3 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors cursor-pointer ${!n.isRead ? 'bg-amber-50/20 dark:bg-amber-900/10' : ''}`}
                                                        onClick={() => handleNotificationClick(n)}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
                                                            <Bell size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-bold text-gray-900 dark:text-white tracking-tight leading-snug">{n.title}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 border-white shadow-sm transition-all active:scale-95 bg-slate-100"
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                                {profile?.photo ? (
                                    <img src={getImageUrl(profile.photo)} alt="P" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-500">
                                        {initials}
                                    </div>
                                )}
                            </div>

                            {isProfileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsProfileDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-[101] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                        <div className="px-6 py-6 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                                            <p className="font-black text-gray-900 dark:text-white text-[15px] italic line-clamp-1">
                                                {profile?.firstName} {profile?.lastName}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium truncate mt-1 italic">
                                                {profile?.email}
                                            </p>
                                        </div>
                                        <div className="p-3 space-y-1">
                                            <button onClick={() => { goTab('profile'); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all">
                                                <User size={16} /> {t('my_profile', 'Mon Profil')}
                                            </button>
                                            {isStaff && (
                                                <button onClick={() => navigate('/admin')}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                    <LayoutDashboard size={16} /> {t('admin_space', 'Espace administrateur')}
                                                </button>
                                            )}
                                            <button onClick={() => { goTab('settings'); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all">
                                                <Settings size={16} /> {t('settings', 'Paramètres')}
                                            </button>
                                            <div className="h-px bg-gray-100/50 my-1 mx-4" />
                                            <button onClick={logout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <LogOut size={16} /> {t('logout', 'Déconnexion')}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── MOBILE BOTTOM NAV TRIGGER & BAR ──────────────────────────── */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] group/nav-container pointer-events-none">
                    {/* Visual hint indicator */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-400/20 rounded-full group-hover/nav-container:opacity-0 transition-opacity" />
                    
                    {/* The actual trigger zone (Invisible but interactive) */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-auto" />

                    {/* The Navigation Bar */}
                    <div className="relative mx-auto mb-4 flex items-center justify-around px-2 py-1 transition-all duration-700 rounded-[2rem] border border-white/10 dark:border-slate-800/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto translate-y-32 opacity-0 group-hover/nav-container:translate-y-0 group-hover/nav-container:opacity-100"
                        style={{ 
                            background: isDark ? 'rgba(8, 12, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
                            height: '48px',
                            width: '80%',
                            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                        {[
                            { id: 'dashboard', icon: <Home size={17} /> },
                            { id: 'activity', icon: <Activity size={17} /> },
                            { id: 'requests', icon: <FileText size={17} /> },
                            { id: 'donations', icon: <Heart size={17} /> },
                            { id: 'profile', icon: <User size={17} /> },
                        ].map(item => (
                            <button key={item.id} onClick={() => goTab(item.id)}
                                className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-slate-500 hover:text-indigo-400'}`}>
                                {React.cloneElement(item.icon, { strokeWidth: 2.5 })}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info text when hidden - optional, but helps user know it's there */}
                <div className="sm:hidden fixed bottom-1 left-0 right-0 flex justify-center pointer-events-none opacity-20">
                    <div className="w-10 h-1 bg-slate-400 rounded-full" />
                </div>

                {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
                <div className={`flex-1 overflow-y-auto pb-20 sm:pb-6 ${activeTab === 'dashboard' ? '' : 'px-4 sm:px-6 lg:px-8 py-6'}`}>

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Vue d'ensemble                                        */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'dashboard' && (
                        <div className="animate-in fade-in duration-500 h-full flex flex-col pt-0 max-w-[1600px] mx-auto">
                            <div className="px-5 sm:px-8 py-6 flex flex-col gap-10">
                                
                                {/* ── SEARCH & SEND BAR (From Figma) ── */}
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 group transition-all duration-300">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder={t('search', 'Search')}
                                            className="w-full pl-11 pr-4 py-2.5 bg-[#f0f0f0] dark:bg-slate-900 border-none rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:ring-0 transition-all text-[14px] outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setIsPostModalOpen(true)}
                                        className="text-blue-500 hover:scale-110 active:scale-95 transition-all outline-none"
                                    >
                                        <Send size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* ── QUICK ACTION GRID (2x3) ── */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'profile', label: t('bible_guide', 'Bible Guide'), icon: <BookOpen size={18} />, color: '#4318FF' },
                                        { id: 'worship', label: t('worship', 'Culte'), icon: <Music size={18} />, color: '#ea762a' },
                                        { id: 'communion', label: t('holy_communion', 'Sainte Scene'), icon: <Droplets size={18} />, color: '#05CD99' },
                                        { id: 'profile', label: t('my_church', 'Mon Eglise'), icon: <Building2 size={18} />, color: '#FFB547' },
                                        { id: 'donations', label: t('donations', 'Don'), icon: <Heart size={18} />, color: '#f06292' },
                                        { id: 'dashboard', label: 'Elyon Sys', icon: <LayoutDashboard size={18} />, color: '#6366f1' },
                                    ].map((item, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => goTab(item.id)}
                                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-95 group"
                                        >
                                            <div className="text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-2 relative group-events">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-brand-orange rounded-full" />
                                            <h3 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t('upcoming_events_title', 'Événements à venir')}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Desktop Nav */}
                                            <div className="hidden md:flex items-center gap-2 mr-2">
                                                <button 
                                                    onClick={() => setEventIndex(prev => Math.max(0, prev - 1))}
                                                    disabled={eventIndex === 0}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:shadow-md transition-all"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setEventIndex(prev => events.length > (prev + 1) * 3 ? prev + 1 : prev)}
                                                    disabled={events.length <= (eventIndex + 1) * 3}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-30 hover:shadow-md transition-all"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                            <button onClick={() => goTab('events')} className="text-[12px] font-bold text-slate-800 dark:text-slate-400">{t('view_all', 'voir tout')}</button>
                                        </div>
                                    </div>

                                    {/* Events Grid/Horizontal Scroll */}
                                    <div className="relative overflow-hidden">
                                        <div 
                                            className="flex gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 noscrollbar snap-x snap-mandatory transition-transform duration-500 ease-in-out md:flex-row"
                                            style={{ transform: window.innerWidth > 768 ? `translateX(-${eventIndex * 100}%)` : 'none' }}
                                        >
                                            {events.length > 0 ? (
                                                events.map((event, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="min-w-[85%] sm:min-w-[calc(33.333%-1rem)] snap-center group/ev relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 h-40 sm:h-48"
                                                    >
                                                        {event.imageUrl ? (
                                                            <img src={getImageUrl(event.imageUrl)} alt={event.title} className="w-full h-full object-cover transition-transform group-hover/ev:scale-110 duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center p-4 text-white text-center">
                                                                <Calendar size={28} className="opacity-20 mb-2" />
                                                                <h4 className="font-black text-[13px] leading-tight line-clamp-2">{event.title}</h4>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                                                            <h4 className="text-white font-black text-xs mb-1 truncate">{event.title}</h4>
                                                            <div className="flex items-center gap-2 text-[9px] font-bold text-white/70">
                                                                <Calendar size={10} /> {new Date(event.startDate).toLocaleDateString(locale)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="w-full py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800">
                                                    <Calendar size={32} className="text-slate-300 mb-2" />
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('no_event_recorded', 'aucune evenment enregistre')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── COMMUNITY MEMBERS SECTION ── */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                                            <h3 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t('members_community', 'Membre de ma comunaué')}</h3>
                                        </div>
                                        <button onClick={() => goTab('profile')} className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-tight">{t('view_all', 'Voir tout')}</button>
                                    </div>
                                    <div className="flex items-center gap-4 overflow-x-auto pb-6 noscrollbar -mx-5 sm:-mx-8 px-5 sm:px-8">
                                        {members.slice(0, 10).map((m, idx) => (
                                            <button key={m.id || idx} onClick={() => navigate(`/member/profile/${m.id}`)}
                                                className="flex flex-col items-center gap-3 shrink-0 group/member transition-all">
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm group-hover/member:shadow-xl group-hover/member:scale-110 group-hover/member:border-indigo-500 transition-all duration-300 relative">
                                                    {m.photo ? (
                                                        <img src={getImageUrl(m.photo)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-xs font-black uppercase">
                                                            {m.firstName?.[0]}{m.lastName?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-20 text-center tracking-tight">
                                                    {m.firstName}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── COMMUNITY POSTS SECTION ── */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                            <h3 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t('community_posts', 'publications de la communauté')}</h3>
                                        </div>
                                        <button onClick={() => goTab('activity')} className="text-[12px] font-bold text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-tight">{t('view_all', 'Voir tout')}</button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {communityPosts.length > 0 ? (
                                            communityPosts.slice(0, 4).map((post, idx) => (
                                                <div key={post.id || idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                                                                {post.author?.photo ? (
                                                                    <img src={getImageUrl(post.author.photo)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase text-xs">
                                                                        {post.author?.firstName?.[0] || 'C'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[14px] font-black text-slate-900 dark:text-white leading-tight">
                                                                    {post.author?.firstName} {post.author?.lastName}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                                                                        {POST_CATEGORIES.find(c => c.value === (post.type || 'general'))?.label.split(' ')[1] || 'Général'}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        {new Date(post.createdAt).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="text-slate-400 hover:text-slate-600 p-1">
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="min-h-[60px]">
                                                        <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                            {post.content}
                                                        </p>
                                                        {post.imageUrl && (
                                                            <div className="mt-4 rounded-2xl overflow-hidden shadow-sm">
                                                                <img src={getImageUrl(post.imageUrl)} alt="" className="w-full object-cover max-h-[250px] hover:scale-105 transition-transform duration-700" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                                                                <Heart size={16} />
                                                                <span className="text-[11px] font-bold">24</span>
                                                            </button>
                                                            <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                                                                <MessageSquare size={16} />
                                                                <span className="text-[11px] font-bold">12</span>
                                                            </button>
                                                        </div>
                                                        <button className="text-slate-400 hover:text-indigo-500 transition-colors">
                                                            <Share2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 mb-8">
                                                <Activity size={32} className="mx-auto text-slate-300 mb-2 opacity-50" />
                                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic">{t('no_posts', 'Aucune publication')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Événements                                            */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'events' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                                        <Calendar size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                            {t('upcoming_events', 'Événements')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('events_subtitle', 'Découvrez les activités de notre église')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map(event => {
                                    const isUpcoming = new Date(event.startDate) >= new Date();
                                    return (
                                        <div key={event.id} className={`rounded-[2.5rem] overflow-hidden group shadow-sm border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative ${isUpcoming ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent grayscale opacity-70'}`}>
                                            <div className="h-56 relative overflow-hidden">
                                                {event.imageUrl ? (
                                                    <img src={getImageUrl(event.imageUrl)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white">
                                                        <Calendar size={64} className="opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${isUpcoming ? 'bg-blue-500/90 text-white border-blue-400/50 shadow-lg shadow-blue-500/20' : 'bg-slate-500/90 text-white border-slate-400/50'}`}>
                                                        {isUpcoming ? t('upcoming', 'À venir') : t('past', 'Passé')}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 space-y-5">
                                                <h3 className="font-black text-[22px] leading-tight text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                    {event.title}
                                                </h3>
                                                
                                                <div className="space-y-4 pt-2">
                                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('date', 'Date')}</p>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                {new Date(event.startDate).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-800">
                                                            <Clock size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('time', 'Heure')}</p>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {event.location && (
                                                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-800">
                                                                <MapPin size={18} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('location', 'Lieu')}</p>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-2">
                                                                    {event.location}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {event.description && (
                                                    <div className="mt-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 italic">
                                                            " {event.description} "
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                    <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95">
                                                        {t('view_details', 'En savoir plus')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {events.length === 0 && (
                                    <div className="col-span-full py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <Calendar size={48} />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm italic font-bold uppercase tracking-widest group-hover:scale-110 transition-transform">
                                            {t('no_event_recorded', 'aucune evenment enregistre')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Cultes & Événements (Phase 6)                        */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'worship' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <MemberWorship />
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Mon profil                                            */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300 w-full space-y-6">

                                {/* Avatar card with Cover */}
                                <div className="rounded-[3rem] overflow-hidden relative border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm mb-8">
                                    {/* Clean Gradient Header */}
                                    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-950/20 dark:via-slate-800 dark:to-blue-950/20 px-8 py-10 sm:px-12 sm:py-12">
                                        <div className="flex flex-col sm:row items-center sm:items-center gap-8 text-center sm:text-left">
                                            {/* Avatar element */}
                                            <div className="relative group w-[160px] h-[160px] rounded-[2.5rem] flex items-center justify-center text-white font-black text-[56px] shrink-0 shadow-2xl shadow-indigo-500/20 overflow-hidden cursor-pointer ring-[6px] ring-white dark:ring-slate-700 transition-all duration-500 transform group-hover:scale-105"
                                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                                {profile?.photo ? (
                                                    <img src={getImageUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" onClick={handlePhotoClick} crossOrigin="anonymous" />
                                                ) : (
                                                    <div onClick={() => fileInputRef.current.click()}>{initials}</div>
                                                )}

                                                {/* Overlay pour modifier la photo */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                                                    onClick={() => fileInputRef.current.click()}>
                                                    <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-md border border-white/20 scale-90 group-hover:scale-100 transition-transform">
                                                        <Camera size={28} className="text-white" />
                                                    </div>
                                                </div>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </div>

                                            {/* Name + email */}
                                            <div className="flex-1 min-w-0 space-y-4">
                                                <div>
                                                    <h2 className="font-black font-jakarta text-3xl sm:text-5xl tracking-tighter text-slate-900 dark:text-white leading-tight">
                                                        {profile ? `${profile.firstName} ${profile.lastName}` : t('loading', 'Chargement...')}
                                                    </h2>
                                                    <p className="text-lg mt-1 font-bold text-indigo-500 dark:text-indigo-400">
                                                        {profile?.email || '...'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                                    <span className="px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-100 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                        {t('status_member', 'Membre')} {profile?.status || t('active', 'actif')}
                                                    </span>
                                                    {profile?.joinDate && (
                                                        <span className="px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {t('since', 'Depuis')} {new Date(profile.joinDate).getFullYear()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Edit button */}
                                            {!editing && (
                                                <button onClick={() => setEditing(true)}
                                                    className="sm:ml-auto w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-xl active:scale-95 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-600 hover:bg-slate-50">
                                                    <Edit3 size={24} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info card */}
                                <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3rem] shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                                    
                                    <div className="flex items-center gap-4 mb-12 relative z-10">
                                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                                        <h3 className="text-2xl font-black font-jakarta text-slate-900 dark:text-white tracking-tight">
                                            {t('personal_information', 'Informations personnelles')}
                                        </h3>
                                    </div>

                                    {editing ? (
                                        <form onSubmit={handleUpdateProfile} className="space-y-12 relative z-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {[
                                                    { label: t('first_name', 'Prénom'), key: 'firstName', icon: <User size={16} /> },
                                                    { label: t('last_name', 'Nom'), key: 'lastName', icon: <User size={16} /> },
                                                    { label: t('nickname', 'Surnom'), key: 'nickname', icon: <Camera size={16} /> },
                                                    { label: t('email', 'Email'), key: 'email', type: 'email', icon: <Mail size={16} /> },
                                                    { label: t('phone', 'Téléphone'), key: 'phone', icon: <Phone size={16} /> },
                                                    { label: t('address', 'Adresse'), key: 'address', icon: <MapPin size={16} /> },
                                                    { label: t('birth_place', 'Lieu de naissance'), key: 'birthPlace', icon: <MapPin size={16} /> },
                                                    { label: t('marital_status_label', 'État civil'), key: 'maritalStatus', icon: <Heart size={16} /> },
                                                    { label: t('spouse_name', 'Nom conjoint'), key: 'spouseName', icon: <Users size={16} /> },
                                                    { label: t('gender_label', 'Sexe'), key: 'gender', icon: <User size={16} /> },
                                                    { label: t('status', 'Statut'), key: 'status', icon: <Activity size={16} /> },
                                                ].map(f => (
                                                    <div key={f.key} className="space-y-2">
                                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">
                                                            <span className="text-indigo-500">{f.icon}</span>
                                                            {f.label}
                                                        </label>
                                                        <input 
                                                            type={f.type || 'text'} 
                                                            value={formData[f.key] || ''}
                                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[14px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all dark:text-white" 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-50 dark:border-slate-700">
                                                <button type="submit" disabled={savingProfile}
                                                    className="flex-1 py-4.5 px-8 rounded-2xl text-[12px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-500/30 active:scale-95 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {savingProfile ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                                    {savingProfile ? t('saving', 'Enregistrement...') : t('save', 'Enregistrer')}
                                                </button>
                                                <button type="button" onClick={() => setEditing(false)}
                                                    className="px-8 py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                                                >
                                                    {t('cancel', 'Annuler')}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                            {[
                                                { label: t('nickname', 'Surnom'), value: profile?.nickname, icon: <Camera size={18} /> },
                                                { label: t('gender_label', 'Sexe'), value: profile?.gender === 'M' ? t('masculine', 'Masculin') : (profile?.gender === 'F' ? t('feminine', 'Féminin') : profile?.gender), icon: <User size={18} /> },
                                                { label: t('marital_status_label', 'État civil'), value: profile?.maritalStatus, icon: <Heart size={18} /> },
                                                { label: t('member_category', 'Catégorie'), value: profile?.contactSubtype?.name || t('member', 'Membre'), icon: <Award size={18} /> },
                                                { label: t('phone', 'Téléphone'), value: profile?.phone, icon: <Phone size={18} /> },
                                                { label: t('email', 'Email'), value: profile?.email, icon: <Mail size={18} /> },
                                                { label: t('address', 'Adresse'), value: [profile?.address, profile?.city].filter(Boolean).join(', ') || '–', icon: <MapPin size={18} />, fullWidth: true },
                                                { label: t('birth_date', 'Date de naissance'), value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–', icon: <Calendar size={18} /> },
                                                { label: t('join_date', "Adhésion"), value: profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–', icon: <Clock size={18} /> },
                                                { label: t('member_code', 'Code membre'), value: profile?.memberCode || '–', icon: <CreditCard size={18} /> },
                                            ].filter(Boolean).map((item, i) => (
                                                <div key={i} className={`flex flex-col gap-3 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg group ${item.fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-50 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {item.icon}
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{item.label}</p>
                                                    </div>
                                                    <p className="text-[15px] font-black text-slate-900 dark:text-slate-100 break-words pl-1 tracking-tight">
                                                        {item.value || '–'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {activeTab === 'activity' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                                    <Activity size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                        {t('recent_activity', 'Activité récente')}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('latest_updates', 'Dernières mises à jour')}</p>
                                </div>
                            </div>
                            <div className="space-y-4 w-full">
                                {activityItems.length === 0 ? (
                                    <div className="py-32 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 -z-10" />
                                        <div className="w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-300 dark:text-amber-700 shadow-inner">
                                            <Activity size={48} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-black text-2xl mb-2">{t('no_recent_activity', 'Aucune activité récente')}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm italic max-w-sm mx-auto">{t('check_back_later_activity', 'Votre activité ici apparaîtra dès que vous interagirez avec la plateforme.')}</p>
                                    </div>
                                ) : (
                                    activityItems.map((item, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:row items-start sm:items-center justify-between gap-6 transition-all hover:shadow-xl hover:-translate-y-1 group">
                                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 ${item.amber ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'}`}>
                                                    {React.cloneElement(item.icon, { size: 22 })}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-slate-900 dark:text-slate-100 font-black text-[16px] leading-tight mb-1 truncate">{item.text}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">{item.date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                                                <Badge label={item.badge} color={item.amber ? 'amber' : 'blue'} />
                                                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-all border border-transparent hover:border-indigo-100">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Mes demandes                                          */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'requests' && (
                        <div className="animate-in fade-in duration-300 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/20">
                                    <FileText size={24} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                    {t('my_requests', 'Mes demandes')}
                                </h2>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                                <MemberRequests renderMode="cards" />
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Ma carte membre                                     */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'my_card' && (
                        <div className="animate-in fade-in duration-300 w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
                            <div className="w-full flex items-center gap-3 mb-10">
                                <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                                    <CreditCard size={24} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                        {t('my_member_card', 'Ma carte membre')}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('card_id_desc', 'Identification officielle au sein de la communauté')}</p>
                                </div>
                            </div>

                            {!activeCard ? (
                                <div className="w-full max-w-2xl py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center px-10">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 border border-slate-100 dark:border-slate-800">
                                        <CreditCard size={40} />
                                    </div>
                                    <h4 className="text-slate-900 dark:text-white font-black text-2xl mb-4">{t('no_active_card', 'Aucune carte active')}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-md mx-auto mb-10 italic">
                                        {t('card_not_generated_desc', "Votre carte de membre n'a pas encore été générée. Si vous êtes un nouveau membre, elle sera disponible après validation de votre dossier.")}
                                    </p>
                                    <button
                                        onClick={() => handleQuickCardRequest('member_card_new', 'Demande de Nouvelle Carte Membre')}
                                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3"
                                    >
                                        <PlusCircle size={20} /> {t('request_member_card', 'Commander une carte')}
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full max-w-4xl space-y-12 pb-16">
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-[2rem] flex items-start gap-5 text-amber-800 dark:text-amber-200 text-[14px] font-bold shadow-sm leading-relaxed">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center shrink-0 text-amber-600">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            {t('card_id_official_desc', "Cette carte est votre document d'identité officiel. Elle est requise pour accéder aux services réservés aux membres.")}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 place-items-center">
                                        {/* Recto */}
                                        <div className="space-y-6 w-full flex flex-col items-center">
                                            <span className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{t('front_side', 'Recto')}</span>
                                            <div
                                                className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden cursor-zoom-in group relative transition-all hover:-translate-y-2"
                                                onClick={() => setCardZoomSide('front')}
                                            >
                                                <CardDisplay card={activeCard} side="front" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all bg-white/95 text-slate-900 p-4 rounded-full shadow-2xl backdrop-blur-md">
                                                        <Maximize size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verso */}
                                        <div className="space-y-6 w-full flex flex-col items-center">
                                            <span className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{t('back_side', 'Verso')}</span>
                                            <div
                                                className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden cursor-zoom-in group relative transition-all hover:-translate-y-2"
                                                onClick={() => setCardZoomSide('back')}
                                            >
                                                <CardDisplay card={activeCard} side="back" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all bg-white/95 text-slate-900 p-4 rounded-full shadow-2xl backdrop-blur-md">
                                                        <Maximize size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center pt-10 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                                            <div className="px-8 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black text-[12px] tracking-widest shadow-sm">
                                                {t('card_status', 'Statut')}: <span className="uppercase text-slate-900 dark:text-white">{activeCard.status}</span>
                                            </div>
                                            <div className="px-8 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 font-black text-[12px] tracking-widest shadow-sm">
                                                ID: <span className="text-slate-900 dark:text-white">{activeCard.cardNumber}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_lost', t('declare_lost_card', 'Carte Perdue'))}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-[12px] font-black tracking-widest transition-all hover:bg-amber-100"
                                            >
                                                <AlertCircle size={18} /> {t('declare_lost_card', 'PERDUE')}
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_stolen', t('declare_stolen_card', 'Carte Volée'))}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-[12px] font-black tracking-widest transition-all hover:bg-rose-100"
                                            >
                                                <Lock size={18} /> {t('declare_stolen_card', 'VOLÉE')}
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_defective', t('declare_defective_card', 'Carte Défectueuse'))}
                                                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-2xl text-[12px] font-black tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <Settings size={18} /> {t('my_card_is_defective', 'DÉFECTUEUSE')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* HISTORIQUE DES DONS                                   */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'donations' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/20">
                                        <Heart size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('donation_history', 'Historique des dons')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('support_community', 'Votre soutien à la communauté')}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-[2.5rem] shadow-xl shadow-rose-500/5 border border-rose-100 dark:border-rose-900/30">
                                    <div className="bg-rose-50 dark:bg-rose-950/20 px-8 py-5 rounded-[2.2rem] flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 dark:border-rose-800">
                                            <TrendingUp size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest leading-none mb-2">
                                                {t('total_contribution', 'Contribution Totale')} {new Date().getFullYear()}
                                            </p>
                                            <p className="font-black text-slate-900 dark:text-white text-3xl leading-none tracking-tight">
                                                {displayTotal}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {donations.length === 0 ? (
                                    <div className="py-32 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50 -z-10" />
                                        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-300 dark:text-rose-700 shadow-inner">
                                            <Heart size={48} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-black text-2xl mb-2">{t('no_donation_recorded', 'Aucun don enregistré')}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm italic max-w-sm mx-auto">{t('donation_empty_desc', "Vos contributions apparaîtront ici. Merci pour votre générosité.")}</p>
                                    </div>
                                ) : (
                                    donations.map((d, i) => (
                                        <div key={d.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-6 transition-all hover:shadow-xl hover:-translate-y-1 group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-sm border border-rose-100 dark:border-rose-900/10">
                                                    <Heart size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 dark:text-slate-100 font-black text-[16px] leading-tight mb-1">{t('generous_donation', 'Don Généreux')}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-0.5 uppercase tracking-wider">
                                                            {d.date ? new Date(d.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                                            {d.paymentMethod && <span className="mx-2 text-slate-300">•</span>}
                                                            <span className="text-indigo-500 dark:text-indigo-400">{d.paymentMethod}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-xl tracking-tight">
                                                    +{parseFloat(d.amount).toLocaleString(locale)} <span className="text-xs text-slate-400 font-bold ml-1 uppercase">{d.currency || 'HTG'}</span>
                                                </p>
                                                <Badge label={t('recorded', 'Enregistré')} color="green" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'communion' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20">
                                        <Droplets size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('holy_communion_participation', 'Sainte Cène')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('spiritual_growth', 'Votre cheminement spirituel')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <Droplets className="mb-6 opacity-40" size={40} />
                                    <p className="text-[11px] font-black tracking-[0.2em] uppercase text-indigo-200">{t('total_participations', 'Total participations')}</p>
                                    <p className="text-5xl font-black mt-2 tracking-tighter">
                                        {ceremonies.filter(c => c.type === 'sainte_cene').length}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400">{t('last_participation', 'Dernière fois')}</p>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {ceremonies.filter(c => c.type === 'sainte_cene')[0]?.date ? new Date(ceremonies.filter(c => c.type === 'sainte_cene')[0].date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : t('none', 'Aucune')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {t('participation_history', 'Historique des participations')}
                                    </h3>
                                </div>

                                {ceremonies.filter(c => c.type === 'sainte_cene').length === 0 ? (
                                    <div className="py-32 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                                        <Droplets size={48} className="mx-auto text-slate-200 mb-6" />
                                        <p className="text-slate-400 font-bold italic max-w-sm mx-auto">{t('no_communion_history', "Aucun historique de participation à la Sainte Cène n'est enregistré.")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {ceremonies.filter(c => c.type === 'sainte_cene').map(c => (
                                            <div key={c.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-6 transition-all hover:shadow-xl hover:-translate-y-1 group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/10">
                                                        <Droplets size={22} />
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-900 dark:text-slate-100 font-black text-[16px] leading-tight mb-1">{c.title || t('holy_communion', 'Sainte Cène')}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-0.5 uppercase tracking-wider">{new Date(c.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                        </div>
                                                        {c.description && <p className="text-slate-400 text-[13px] mt-2 italic line-clamp-1">{c.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    <Badge label={t('present', 'Présent')} color="green" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-300 w-full px-4 sm:px-6 lg:px-8 py-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                                        <Bell size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('notifications', 'Notifications')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('latest_updates', 'Dernières mises à jour')}</p>
                                    </div>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="px-5 py-2.5 rounded-[1.5rem] bg-amber-500 text-white text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 ring ring-amber-500/30">
                                        {unreadCount} {t('unread', 'non lues')}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {notifications.filter(n => !n.isRead).length > 0 ? (
                                    notifications.filter(n => !n.isRead).map(n => (
                                        <div key={n.id} onClick={() => handleNotificationClick(n)} className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] shadow-sm border-2 border-amber-100 dark:border-amber-900/30 flex items-start justify-between gap-4 transition-all hover:shadow-md cursor-pointer relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                                                    <Bell size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 dark:text-slate-100 font-bold text-[14px] leading-tight">{n.title}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mt-1 uppercase tracking-wider">
                                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                    </p>
                                                    {n.message && <p className="text-slate-600 dark:text-slate-300 text-[13px] mt-2 leading-relaxed">{n.message}</p>}
                                                </div>
                                            </div>
                                            <div className="shrink-0 pt-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200 animate-pulse block" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    notifications.length > 0 && (
                                        <div className="py-8 px-6 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-center">
                                            <p className="text-slate-400 text-[11px] font-black italic tracking-widest">{t('no_unread_notifs', 'Aucune nouvelle notification')}</p>
                                        </div>
                                    )
                                )}

                                {notifications.filter(n => n.isRead).length > 0 && (
                                    <div className="pt-4">
                                        <button
                                            onClick={() => setIsOldNotificationsExpanded(!isOldNotificationsExpanded)}
                                            className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-[13px] font-black tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors uppercase">
                                                        {t('older_notifications', 'Anciennes notifications')}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                        {notifications.filter(n => n.isRead).length} {t('read_notifications', 'lues')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`transition-transform duration-500 ${isOldNotificationsExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>

                                        {isOldNotificationsExpanded && (
                                            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                {notifications.filter(n => n.isRead).map(n => (
                                                    <div key={n.id} className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-[1.5rem] border border-gray-50 dark:border-slate-800 flex items-start gap-4 opacity-75 hover:opacity-100 transition-opacity">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 flex items-center justify-center shrink-0">
                                                            <Bell size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-900 dark:text-slate-100 font-bold text-[13px]">{n.title}</p>
                                                            <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                                                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                            </p>
                                                            {n.message && <p className="text-slate-500 dark:text-slate-400 text-[12px] mt-1.5 leading-relaxed">{n.message}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {notifications.length === 0 && (
                                    <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300 dark:text-indigo-700">
                                            <Bell size={40} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-black text-xl mb-2">{t('no_notifications', 'Aucune notification')}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm italic">{t('check_back_later', 'Nous vous tiendrons au courant de tout changement !')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {activeTab === 'sunday_school' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
                                        <BookOpen size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('sunday_school', 'École du dimanche')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('ss_subtitle', 'Ma progression et mes classes actives')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Classes */}
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {t('my_enrolled_classes', 'Mes Classes Inscrites')}
                                    </h3>
                                </div>

                                {(!profile?.sundaySchoolClasses || profile.sundaySchoolClasses.length === 0) ? (
                                    <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <BookOpen size={40} />
                                        </div>
                                        <p className="text-slate-400 font-bold italic">{t('no_ss_class', "Vous n'êtes inscrit dans aucune classe pour le moment.")}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {profile.sundaySchoolClasses.map(cls => (
                                            <div key={cls.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                                                <div className="relative z-10">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-6 shadow-sm">
                                                        <BookOpen size={28} />
                                                    </div>
                                                    <h4 className="font-black text-slate-900 dark:text-white text-xl mb-1">{cls.name || t('class', 'Classe')}</h4>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-6">{cls.membership?.level || t('member', 'Membre')}</p>
                                                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-6">
                                                        <div className="flex -space-x-3">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-[10px] text-indigo-500 font-black">
                                                                    U{i}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Badge label={t('active', 'Actif')} color="indigo" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Attendance Sections */}
                            <div className="space-y-6">
                                {/* Current Month Attendance */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsSundayAttendanceExpanded(!isSundayAttendanceExpanded)}
                                        className="w-full flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                                                <CheckCircle size={22} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-[14px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                                                    {t('attendance_current_month', 'Présences du mois')}
                                                </h3>
                                                <p className="text-slate-400 text-[11px] font-bold mt-1 tracking-widest uppercase">{t('current_evaluation', 'Évaluation en cours')}</p>
                                            </div>
                                        </div>
                                        <ChevronDown size={22} className={`text-slate-300 transition-transform duration-500 relative z-10 ${isSundayAttendanceExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                                    </button>
                                    
                                    {isSundayAttendanceExpanded && (
                                        <div className="animate-in slide-in-from-top-4 duration-500 space-y-4">
                                            {currentMonthAttendance.length === 0 ? (
                                                <div className="py-16 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                                                    <Calendar size={32} className="mx-auto text-slate-200 mb-4" />
                                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic">{t('no_attendance_this_month', 'Aucune présence ce mois-ci')}</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {currentMonthAttendance.map(att => (
                                                        <div key={att.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${att.status === 'present' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                                    <Check size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-900 dark:text-slate-100 font-black text-[15px]">{att.class?.name}</p>
                                                                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{new Date(att.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge label={t(att.status)} color={att.status === 'present' ? 'green' : 'rose'} />
                                                                {att.report?.id && (
                                                                    <button
                                                                        onClick={() => setSsReportModal({ show: true, id: att.report.id })}
                                                                        className="block mt-2 text-[10px] font-black tracking-widest text-indigo-500 hover:text-indigo-600 hover:underline uppercase"
                                                                    >
                                                                        {t('view_report', 'Voir le rapport')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Past Attendance / Filters */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsSundayPastAttendanceExpanded(!isSundayPastAttendanceExpanded)}
                                        className="w-full flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm group-hover:rotate-12 transition-all">
                                                <Filter size={22} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-[14px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                                                    {t('past_attendance_filter', 'Filtres & Historique')}
                                                </h3>
                                                <p className="text-slate-400 text-[11px] font-bold mt-1 tracking-widest uppercase">{t('search_by_date', 'Filtrer par période')}</p>
                                            </div>
                                        </div>
                                        <ChevronDown size={22} className={`text-slate-300 transition-transform duration-500 relative z-10 ${isSundayPastAttendanceExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                    </button>

                                    {isSundayPastAttendanceExpanded && (
                                        <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                                            {/* Filters UI */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">{t('from', 'Du')}</label>
                                                    <input 
                                                        type="date" 
                                                        value={ssAttendanceFilter.startDate} 
                                                        onChange={e => setSsAttendanceFilter({...ssAttendanceFilter, startDate: e.target.value})}
                                                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-0 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">{t('to', 'Au')}</label>
                                                    <input 
                                                        type="date" 
                                                        value={ssAttendanceFilter.endDate} 
                                                        onChange={e => setSsAttendanceFilter({...ssAttendanceFilter, endDate: e.target.value})}
                                                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border-0 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    {(ssAttendanceFilter.startDate || ssAttendanceFilter.endDate) && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => setSsAttendanceFilter({startDate: '', endDate: '', month: 'all', year: new Date().getFullYear().toString()})}
                                                            className="w-full p-3 rounded-xl bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                                                        >
                                                            {t('reset', 'Réinitialiser')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Results List */}
                                            <div className="grid gap-3">
                                                {processedAttendance.length === 0 ? (
                                                    <div className="py-12 text-center text-slate-400 text-sm italic">{t('no_attendance_found', 'Aucune présence trouvée pour cette période.')}</div>
                                                ) : (
                                                    processedAttendance.map(att => (
                                                        <div key={att.id} className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${att.status === 'present' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                                                                    <Clock size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-900 dark:text-slate-100 font-bold text-[14px]">{att.class?.name}</p>
                                                                    <p className="text-slate-400 font-bold text-[10px] uppercase">{new Date(att.date).toLocaleDateString(locale)}</p>
                                                                </div>
                                                            </div>
                                                            <Badge label={t(att.status)} color={att.status === 'present' ? 'green' : 'rose'} />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Class Reports */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setIsSundayHistoryExpanded(!isSundayHistoryExpanded)}
                                        className="w-full flex items-center justify-between p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-amber-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                                                <FileText size={22} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-[14px] font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                                                    {t('class_reports', 'Rapports de leçons')}
                                                </h3>
                                                <p className="text-slate-400 text-[11px] font-bold mt-1 tracking-widest uppercase">{t('study_history', 'Historique des leçons')}</p>
                                            </div>
                                        </div>
                                        <ChevronDown size={22} className={`text-slate-300 transition-transform duration-500 relative z-10 ${isSundayHistoryExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                                    </button>

                                    {isSundayHistoryExpanded && (
                                        <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                                            {/* Report Filters */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] flex flex-wrap gap-4">
                                                <div className="flex-1 min-w-[200px] relative">
                                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder={t('search_reports', 'Rechercher une leçon...')}
                                                        value={ssReportFilter.query}
                                                        onChange={e => setSsReportFilter({...ssReportFilter, query: e.target.value})}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-0 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amber-500/20"
                                                    />
                                                </div>
                                                {(ssReportFilter.query || ssReportFilter.startDate) && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSsReportFilter({query: '', startDate: '', endDate: ''})}
                                                        className="px-6 rounded-xl bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all"
                                                    >
                                                        {t('clear', 'Effacer')}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reports List */}
                                            <div className="grid gap-3">
                                                {processedReports.length === 0 ? (
                                                    <div className="py-12 text-center text-slate-400 text-sm italic">{t('no_reports_found', 'Aucun rapport trouvé.')}</div>
                                                ) : (
                                                    processedReports.map(report => (
                                                        <div key={report.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                                                    <BookOpen size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-900 dark:text-slate-100 font-bold text-[15px] line-clamp-1">{report.lessonTitle || report.title || t('weekly_report', 'Leçon')}</p>
                                                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{report.class?.name} • {new Date(report.date).toLocaleDateString(locale)}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSsReportModal({show: true, id: report.id})}
                                                                className="px-6 py-2.5 bg-amber-100/50 hover:bg-amber-600 hover:text-white text-amber-700 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase"
                                                            >
                                                                {t('view', 'Voir')}
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
                                        <Users size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('groups', 'Mes Groupes')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('groups_subtitle', 'Ma vie de communauté et fraternité')}</p>
                                    </div>
                                </div>
                            </div>

                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type !== 'ministry').length === 0) ? (
                                <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                        <Users size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold italic">{t('no_group_desc', "Vous n'êtes membre d'aucun groupe pour le moment.")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {profile.memberGroups.filter(g => g.type !== 'ministry').map(g => (
                                        <div key={g.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                                            <div className="relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
                                                    <Users size={28} />
                                                </div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-xl mb-1">{g.name}</h4>
                                                <p className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.2em] mb-4">{g.type || t('community_group', 'Groupe de Fraternité')}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                                                    {g.description || t('no_description', 'Aucune description disponible pour ce groupe.')}
                                                </p>
                                                <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[10px] text-emerald-600 font-black">
                                                                M{i}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Badge label={t('active', 'Membre')} color="green" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* History Accordion */}
                            <div className="mt-12">
                                <button
                                    onClick={() => setIsGroupsHistoryExpanded(!isGroupsHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                                            <History size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[14px] font-black tracking-widest text-slate-400 group-hover:text-slate-900 dark:text-slate-100 transition-colors uppercase">
                                                {t('history_past_groups', 'Historique des groupes')}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">{t('past_memberships', 'Anciennes affiliations')}</p>
                                        </div>
                                    </div>
                                    <ChevronDown size={22} className={`text-slate-300 transition-transform duration-500 ${isGroupsHistoryExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                                </button>
                                {isGroupsHistoryExpanded && (
                                    <div className="mt-6 p-12 text-center bg-white dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
                                        <CloudOff size={32} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic">{t('no_inactive_found', 'Aucun historique de groupe trouvé.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ministries' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4 sm:px-6 lg:px-8 py-8">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20">
                                        <Building2 size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-jakarta tracking-tight text-slate-900 dark:text-white">
                                            {t('ministries', 'Mes Ministères')}
                                        </h2>
                                        <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{t('ministries_subtitle', 'Mon service au sein de la Maison du Seigneur')}</p>
                                    </div>
                                </div>
                            </div>

                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type === 'ministry').length === 0) ? (
                                <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-[3.5rem] border border-dashed border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                        <Building2 size={40} />
                                    </div>
                                    <p className="text-slate-400 font-bold italic">{t('no_ministry_desc', "Vous ne faites partie d'aucun ministère pour le moment.")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {profile.memberGroups.filter(g => g.type === 'ministry').map(m => (
                                        <div key={m.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                                            <div className="relative z-10">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
                                                    <Building2 size={28} />
                                                </div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-xl mb-1">{m.name}</h4>
                                                <p className="text-[11px] text-blue-500 font-black uppercase tracking-[0.2em] mb-4">{t('ministry_active', 'Ministère Actif')}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                                                    {m.description || t('no_description', 'Aucune description disponible pour ce ministère.')}
                                                </p>
                                                <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        <Badge label={t('member', 'Membre')} color="blue" />
                                                        {m.role && <Badge label={m.role} color="indigo" />}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-500">
                                                        <Heart size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Historique Accordion */}
                            <div className="mt-12">
                                <button
                                    onClick={() => setIsMinistriesHistoryExpanded(!isMinistriesHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                                            <History size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[14px] font-black tracking-widest text-slate-400 group-hover:text-slate-900 dark:text-slate-100 transition-colors uppercase">
                                                {t('history_past_ministries', 'Historique des ministères')}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">{t('past_service', 'Anciens services')}</p>
                                        </div>
                                    </div>
                                    <ChevronDown size={22} className={`text-slate-300 transition-transform duration-500 ${isMinistriesHistoryExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                </button>
                                {isMinistriesHistoryExpanded && (
                                    <div className="mt-6 p-12 text-center bg-white dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
                                        <CloudOff size={32} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic">{t('no_inactive_found', 'Aucun historique de ministère trouvé.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CREATE POST MODAL (Professional Version) ── */}
            {
                isPostModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-2xl bg-white dark:bg-slate-800 overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 rounded-[2.5rem] border-0">
                            <div className="flex items-center justify-between p-8 border-b border-gray-50 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/40">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                            {editingPostId ? <Edit3 size={20} /> : <MessageSquare size={20} />}
                                        </span>
                                        {editingPostId ? t('edit_post', 'Modifier la publication') : t('new_post', 'Nouvelle publication')}
                                    </h2>
                                    <p className="text-gray-400 text-[12px] font-medium mt-1 ml-13 italic">{t('share_with_community', 'Partagez avec votre communauté')}</p>
                                </div>
                                <button onClick={() => { setIsPostModalOpen(false); setEditingPostId(null); }} className="p-3 rounded-2xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900 dark:text-white active:scale-90">
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handlePostSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black sentence case tracking-[0.1em] text-gray-400 ml-1">{t('post_category', 'Catégorie de post')}</label>
                                        <select
                                            value={newPost.type}
                                            onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 shadow-sm focus:outline-none text-[13px] font-bold text-gray-700 dark:text-slate-100 transition-all appearance-none cursor-pointer"
                                        >
                                            {POST_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2 col-span-1 sm:col-span-2">
                                        <label className="text-[11px] font-black sentence case tracking-[0.1em] text-gray-400 ml-1">{t('visible_to', 'Visible pour (Destinataire)')}</label>
                                        <div className="flex flex-row overflow-x-auto sm:grid sm:grid-cols-3 gap-3 noscrollbar pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'church', targetSubtypeId: '' })}
                                                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 shrink-0 min-w-[100px] sm:min-w-0 ${newPost.visibilityScope === 'church' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/40' : 'border-gray-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-500/30'}`}
                                            >
                                                <Users size={18} className={newPost.visibilityScope === 'church' ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span className={`text-[10px] sm:text-[11px] font-bold ${newPost.visibilityScope === 'church' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>{t('entire_church', "Toute l'Église")}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'global', targetSubtypeId: '' })}
                                                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 shrink-0 min-w-[100px] sm:min-w-0 ${newPost.visibilityScope === 'global' ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-900/40' : 'border-gray-100 dark:border-slate-700 hover:border-amber-100 dark:hover:border-amber-500/30'}`}
                                            >
                                                <Home size={18} className={newPost.visibilityScope === 'global' ? 'text-amber-600' : 'text-gray-400'} />
                                                <span className={`text-[10px] sm:text-[11px] font-bold ${newPost.visibilityScope === 'global' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500'}`}>{t('all_elyon360', 'Tout Elyon360')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'subtype' })}
                                                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 shrink-0 min-w-[100px] sm:min-w-0 ${newPost.visibilityScope === 'subtype' ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-900/40' : 'border-gray-100 dark:border-slate-700 hover:border-violet-100 dark:hover:border-violet-500/30'}`}
                                            >
                                                <Activity size={18} className={newPost.visibilityScope === 'subtype' ? 'text-violet-600' : 'text-gray-400'} />
                                                <span className={`text-[10px] sm:text-[11px] font-bold ${newPost.visibilityScope === 'subtype' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500'}`}>{t('precise_target', 'Cible précise')}</span>
                                            </button>
                                        </div>

                                        {newPost.visibilityScope === 'subtype' && (
                                            <select
                                                value={newPost.targetSubtypeId}
                                                onChange={e => setNewPost({ ...newPost, targetSubtypeId: e.target.value })}
                                                className="w-full mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 focus:outline-none text-[13px] font-bold text-gray-700 dark:text-slate-200 transition-all appearance-none cursor-pointer animate-in slide-in-from-top-2 duration-300"
                                            >
                                                <option value="">{t('select_category_placeholder', 'Sélectionner une catégorie...')}</option>
                                                {subtypes.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">{t('post_title_optional', 'Titre (Optionnel)')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('post_title_placeholder', 'Donnez un titre percutant...')}
                                        value={newPost.title}
                                        onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none focus:ring-4 ring-indigo-500/5 transition-all text-[14px] font-medium text-gray-800 dark:text-slate-200 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">{t('your_message', 'Votre Message')}</label>
                                    <textarea
                                        placeholder={t('what_to_say_today', "Que souhaitez-vous dire aujourd'hui ?")}
                                        value={newPost.content}
                                        onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                        required
                                        className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-4 ring-indigo-500/5 transition-all text-[14px] font-medium min-h-[160px] resize-none text-gray-800 dark:text-slate-200 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="flex flex-row items-center justify-between gap-6 pt-4 border-t border-gray-50">
                                    <label className="cursor-pointer group">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 border-2 border-indigo-100/50 shadow-sm"
                                            title={newPost.imageFile ? t('change_image', "Changer l'image") : t('add_photo', 'Ajouter une photo')}>
                                            {newPost.imageFile ? <RefreshCw size={22} /> : <Image size={24} />}
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={e => setNewPost({ ...newPost, imageFile: e.target.files[0] })} />
                                    </label>

                                    {newPost.imageFile && (
                                        <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-black sentence case tracking-wider border border-emerald-100 animate-in slide-in-from-left-2 duration-300">
                                            📸 {newPost.imageFile.name}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={posting}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-[1.5rem] text-[13px] font-black sentence case tracking-widest shadow-[0_15px_30px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {posting ? (
                                            <>
                                                <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                {t('saving_post', 'Enregistrement...')}
                                            </>
                                        ) : (
                                            <><Send size={20} /> {editingPostId ? t('save', 'Enregistrer') : t('save', 'Enregistrer')}</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />

            {/* Modal de Demande de Carte (Raison Optionnelle) */}
            {
                cardRequestModal.show && (
                    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md p-8 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-slate-700">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{cardRequestModal.desc}</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-medium">
                                {cardRequestModal.type === 'member_card_new'
                                    ? t('add_note_optional', "Souhaitez-vous ajouter une remarque ? (Optionnel)")
                                    : t('provide_justification', "Veuillez fournir une raison justifiable pour cette déclaration s'il vous plaît (Obligatoire).")}
                            </p>
                            <div className="mb-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('additional_explanations', 'Explications supplémentaires')} <span className={cardRequestModal.type !== 'member_card_new' ? 'text-rose-500' : ''}>{cardRequestModal.type !== 'member_card_new' ? `* (${t('required', 'Obligatoire')})` : `(${t('optional', 'Optionnel')})`}</span></label>
                                <textarea
                                    value={cardRequestModal.reason}
                                    onChange={(e) => setCardRequestModal({ ...cardRequestModal, reason: e.target.value })}
                                    placeholder={cardRequestModal.type === 'member_card_new' ? t('additional_note_placeholder', "Remarque additionnelle...") : t('justification_placeholder', "Indiquez les circonstances justificatives (ex: perdue le 15, rayée)...")}
                                    rows="4"
                                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none resize-none transition-all ${cardRequestModal.type !== 'member_card_new' && !cardRequestModal.reason.trim() ? 'border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 bg-rose-50/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-indigo-400 dark:focus:border-indigo-400 focus:ring-indigo-400/20 focus:shadow-lg focus:shadow-indigo-500/10 dark:text-white'}`}
                                ></textarea>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCardRequestModal({ show: false, type: '', desc: '', reason: '' })}
                                    className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors"
                                >
                                    {t('cancel', 'Annuler')}
                                </button>
                                <button
                                    onClick={handleConfirmCardRequest}
                                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Send size={16} /> {t('send', 'Envoyer')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal Zoom Photo (Generalized) */}
            {
                (isZoomed || zoomedImageUrl) && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => { setIsZoomed(false); setZoomedImageUrl(null); }}>
                        <button className="absolute top-6 right-6 text-white hover:text-gray-300 active:scale-95 transition-all">
                            <X size={32} />
                        </button>
                        <img src={zoomedImageUrl || getImageUrl(profile?.photo)} alt="Zoom" className="max-w-full max-h-full rounded-2xl shadow-2xl transition-transform duration-500 animate-in zoom-in-95" />
                    </div>
                )
            }

            {/* Modal Zoom Card */}
            {
                cardZoomSide && activeCard && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 backdrop-blur-sm cursor-zoom-out"
                        onClick={() => setCardZoomSide(null)}
                    >
                        <button className="absolute top-6 right-6 text-white/50 hover:text-white active:scale-95 transition-all bg-white/10 p-3 rounded-full hover:bg-white/20">
                            <X size={24} />
                        </button>

                        <p className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em] mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                            {cardZoomSide === 'front' ? t('front_detailed_view', 'Vue Détaillée Recto') : t('back_detailed_view', 'Vue Détaillée Verso')}
                        </p>

                        <div
                            className="shadow-2xl shadow-indigo-500/20 rounded-2xl overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500"
                            onClick={(e) => e.stopPropagation()} // Prevent clicking the card itself from closing
                            style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}
                        >
                            <CardDisplay card={activeCard} side={cardZoomSide} />
                        </div>

                        <p className="text-white/30 text-[10px] font-medium mt-16 animate-in fade-in duration-700 delay-300">
                            {t('click_to_close', "Cliquez n'importe où pour fermer")}
                        </p>
                    </div>
                )
            }

            {ssReportModal.show && (
                <SundaySchoolReportDetails
                    isOpen={ssReportModal.show}
                    onClose={() => setSsReportModal({ show: false, id: null })}
                    reportId={ssReportModal.id}
                />
            )}
        </div >
    );
}
