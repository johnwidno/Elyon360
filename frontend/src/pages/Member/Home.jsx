import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import AlertModal from '../../components/ChurchAlertModal';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
    User, Bell, Heart, MessageSquare, LogOut, LayoutDashboard,
    Settings, BookOpen, Users, Building2, Activity,
    Mail, Phone, Edit3, Check, X, Menu, ChevronRight,
    MapPin, FileText, Send, Plus, Calendar, Home, Maximize2, CreditCard, Search, Image, RefreshCw, Clock, ChevronDown,
    Moon, Sun, Droplets, History, CloudOff, CheckCircle, Download, Filter, Music
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MemberRequests from './MemberRequests';
import MemberCardGeneratorModal from '../../components/Admin/Members/MemberCardGeneratorModal';
import SundaySchoolReportDetails from '../Admin/SundaySchool/SundaySchoolReportDetails';
import MemberWorship from './MemberWorship';

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const SIDEBAR_BG = '#0f172a';
const SIDEBAR_BORDER = '#1e293b';
const ACTIVE_BG = '#1e293b';
const ACTIVE_CLR = '#6366f1';
const BORDER_CLR = '#f1f5f9';
const BG_CLR = '#f8fafc';
const FONT = "'Inter','Segoe UI',sans-serif";
const SERIF = "'Inter', sans-serif"; // Using Inter for headers as well for consistency

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
            className={`bg-white dark:bg-slate-800 rounded-2xl border transition-colors ${className}`}
            style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9', ...style }}
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
        amber: { border: '#f59e0b', text: '#b45309', bg: '#fffbeb' },
        green: { border: '#22c55e', text: '#166534', bg: '#f0fdf4' },
        gray: { border: '#d1d5db', text: '#6b7280', bg: '#f9fafb' },
        blue: { border: '#6366f1', text: '#4338ca', bg: '#eef2ff' },
        rose: { border: '#f43f5e', text: '#be123c', bg: '#fff1f2' },
    };
    const c = map[color] || map.gray;
    return (
        <span
            className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{ borderColor: c.border, color: c.text, background: c.bg }}
        >
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


    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                // Search for members
                const mRes = await api.get(`/members?search=${searchQuery}`);
                setSearchResults(Array.isArray(mRes.data) ? mRes.data.slice(0, 5) : []);

                // Filter local posts
                const matches = communityPosts.filter(p =>
                    p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 5);
                setPostResults(matches);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, communityPosts]);

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
        <div className="flex flex-col h-full border-r" style={{ background: SIDEBAR_BG, borderColor: SIDEBAR_BORDER }}>
            {/* Logo & Church Info */}
            <div className="px-5 py-8 border-b" style={{ borderColor: SIDEBAR_BORDER }}>
                <div className="flex items-center gap-5 mb-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-[19px] font-black overflow-hidden bg-white shadow-lg border-2 border-slate-800">
                        {profile?.church?.logoUrl ? (
                            <img src={getImageUrl(profile.church.logoUrl)} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                <span className="font-black text-white">{(profile?.church?.acronym || profile?.church?.name || '✝')[0].toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase">
                            ELYONSYS 360
                        </p>
                        <p className="text-white font-black text-[18px] leading-relaxed tracking-tight uppercase truncate">
                            {profile?.church?.acronym || 'SIGLE'}
                        </p>
                    </div>
                </div>
                {profile?.church?.name && (
                    <p className="text-slate-400 text-[12px] font-semibold leading-loose truncate px-1" title={profile.church.name}>
                        {profile.church.name}
                    </p>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-6 overflow-y-auto noscrollbar">
                <div className="space-y-1">
                    {navItems.map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => goTab(item.id)}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left group"
                                style={{
                                    background: active ? ACTIVE_BG : 'transparent',
                                    color: active ? '#fff' : '#94a3b8'
                                }}>
                                <span className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {item.icon}
                                </span>
                                <span className={`text-[13px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                {item.badge && (
                                    <span className="ml-auto w-5 h-5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Logout at bottom */}
            <div className="p-3 mt-auto border-t" style={{ borderColor: SIDEBAR_BORDER }}>
                <button onClick={logout}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-red-400 hover:bg-red-500/10 group">
                    <LogOut size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-[13px] font-bold">{t('logout', 'Déconnexion')}</span>
                </button>
            </div>
        </div >
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-slate-950' : ''}`} style={{ fontFamily: FONT, background: isDark ? '#020617' : BG_CLR }}>

            {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
            <div className="hidden lg:flex flex-col shrink-0 h-full overflow-hidden" style={{ width: '260px' }}>
                <SidebarContent />
            </div>

            {/* ── MOBILE DRAWER OVERLAY ────────────────────────────────────── */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="flex flex-col shrink-0 h-full" style={{ width: '220px' }}>
                        <SidebarContent />
                    </div>
                    <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                </div>
            )}

            {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── TOP HEADER BAR ──────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 sm:px-6 shrink-0 relative transition-colors"
                    style={{ height: '64px', background: isDark ? '#0f172a' : '#fff', borderBottom: `1px solid ${isDark ? '#1e293b' : BORDER_CLR}`, zIndex: 90 }}>
                    <div className="flex items-center gap-3">
                        {/* Hamburger (mobile/tablet) */}
                        <button className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400"
                            onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-gray-400 text-sm">
                            <LayoutDashboard size={16} className="text-gray-300" />
                            <span className="font-bold text-gray-800 dark:text-slate-200 text-[14px] tracking-tight">
                                {navItems.find(n => n.id === activeTab) ? t(navItems.find(n => n.id === activeTab).id, navItems.find(n => n.id === activeTab).label) : t('member_space', 'Espace Membre')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* 1. Global Search Bar */}
                        <div className="relative group flex items-center" ref={searchRef}>
                            {/* Desktop Search */}
                            <div className="hidden md:flex items-center relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search size={15} className="text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('search_posts', "Rechercher des publications...")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-gray-50 dark:bg-slate-900/50 border border-transparent focus:border-indigo-100 dark:focus:border-indigo-500/20 rounded-2xl text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-white dark:text-gray-100 transition-all placeholder-gray-400 outline-none"
                                />

                                {/* Desktop Search Results with Publications */}
                                {searchQuery.trim() && (
                                    <div className="absolute top-full left-0 mt-3 w-96 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-[101] overflow-hidden max-h-[80vh] overflow-y-auto noscrollbar">
                                        {/* Membres Section */}
                                        <div className="p-4 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{t('member_results', 'Membres')}</p>
                                        </div>
                                        {searchResults.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-[11px] italic">{t('no_member_found', 'Aucun membre trouvé')}</div>
                                        ) : (
                                            searchResults.map(m => (
                                                <div key={m.id} className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-slate-700"
                                                    onClick={() => { setActiveTab('dashboard'); setSearchQuery(`${m.firstName} ${m.lastName}`); setIsSearchOpen(false); }}>
                                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 text-[10px] font-bold">
                                                        {m.photo ? <img src={getImageUrl(m.photo)} className="w-full h-full object-cover" /> : <span className="uppercase">{m.firstName?.[0] || ''}{m.lastName?.[0] || ''}</span>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white dark:text-gray-100 truncate">
                                                            {m.firstName} {m.lastName}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {/* Publications Section */}
                                        <div className="p-4 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{t('publication_results', 'Publications')}</p>
                                        </div>
                                        {postResults.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-[11px] italic">{t('no_post_found', 'Aucune publication trouvée')}</div>
                                        ) : (
                                            postResults.map(p => (
                                                <div key={p.id} className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer border-b border-gray-50 dark:border-slate-700"
                                                    onClick={() => { setActiveTab('dashboard'); setSearchQuery(p.title || p.content.slice(0, 10)); setIsSearchOpen(false); }}>
                                                    <p className="text-[12px] font-bold text-gray-900 dark:text-white line-clamp-1">{p.title || t('untitled_post', 'Sans titre')}</p>
                                                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{p.content}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Search Button & Toggleable Overlay */}
                            <div className="md:hidden">
                                <button
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isSearchOpen ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                >
                                    {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                                </button>

                                {isSearchOpen && (
                                    <div className="fixed inset-0 z-[120] bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top duration-300">
                                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder={t('search_posts', "Rechercher des publications...")}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-[15px] font-bold outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') setIsSearchOpen(false);
                                                        if (e.key === 'Enter') setIsSearchOpen(false);
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setIsSearchOpen(false)}
                                                className="p-3 text-gray-500 font-bold text-sm uppercase tracking-wider"
                                            >
                                                {t('close', 'Fermer')}
                                            </button>
                                        </div>
                                        <div className="p-4 max-h-[calc(100vh-100px)] overflow-y-auto noscrollbar">
                                            {searchQuery.trim() && (
                                                <div className="space-y-6">
                                                    {/* Membres Section */}
                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('member_results', 'Membres')}</p>
                                                        {searchResults.length === 0 ? (
                                                            <div className="p-6 text-center text-gray-400 text-sm italic">{t('no_member_found', 'Aucun membre trouvé')}</div>
                                                        ) : (
                                                            searchResults.map(m => (
                                                                <div key={m.id} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-[1.5rem] flex items-center gap-4 active:scale-95 transition-all shadow-sm"
                                                                    onClick={() => { setActiveTab('dashboard'); setSearchQuery(`${m.firstName} ${m.lastName}`); setIsSearchOpen(false); }}>
                                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 font-bold">
                                                                        {m.photo ? <img src={getImageUrl(m.photo)} className="w-full h-full object-cover" /> : <span className="uppercase text-lg">{m.firstName?.[0] || ''}{m.lastName?.[0] || ''}</span>}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Publications Section */}
                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('publication_results', 'Publications')}</p>
                                                        {postResults.length === 0 ? (
                                                            <div className="p-6 text-center text-gray-400 text-sm italic">{t('no_post_found', 'Aucune publication trouvée')}</div>
                                                        ) : (
                                                            postResults.map(p => (
                                                                <div key={p.id} className="p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-gray-100 dark:border-slate-700 active:scale-95 transition-all"
                                                                    onClick={() => { setActiveTab('dashboard'); setSearchQuery(p.title || p.content.slice(0, 10)); setIsSearchOpen(false); }}>
                                                                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2 truncate">{p.title || t('untitled_post', 'Sans titre')}</h4>
                                                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{p.content}</p>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Language Toggle */}
                        <div className="flex items-center bg-gray-50 dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
                            <button onClick={() => lang !== 'FR' && toggleLang()} className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter transition-all ${lang === 'FR' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>FR</button>
                            <button onClick={() => lang !== 'EN' && toggleLang()} className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter transition-all ${lang === 'EN' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-gray-400'}`}>EN</button>
                        </div>

                        {/* 3. Notifications */}
                        <div className="relative">
                            <button
                                className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isNotificationsOpen ? 'bg-amber-50 text-amber-600' : 'hover:bg-gray-50 text-gray-400'}`}
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                <Bell size={19} />
                                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white animate-pulse" />}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-[101] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                        <div className="p-6 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                            <h4 className="font-black text-gray-900 dark:text-white dark:text-gray-100 text-sm italic uppercase tracking-widest">{t('notifications', 'Notifications')}</h4>
                                            {unreadCount > 0 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded-full italic">{unreadCount} {t('new_notifications_count', 'nouvelle(s)')}</span>}
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
                                                            <p className="text-[12px] font-bold text-gray-900 dark:text-white dark:text-gray-100 tracking-tight leading-snug">{n.title}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <button onClick={() => { goTab('notifications'); setIsNotificationsOpen(false); }}
                                            className="w-full p-4 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors bg-white dark:bg-slate-800">
                                            {t('view_all_notifications', 'Voir toutes les notifications')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Theme Toggle (Desktop - After notifications) */}
                        <button
                            onClick={toggleTheme}
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 shadow-sm"
                            title={isDark ? "Light Mode" : "Dark Mode"}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* 4. Add Post Button (Send) */}
                        <button
                            onClick={() => setIsPostModalOpen(true)}
                            title={t('publish_message', 'Publier un message')}
                            className="flex items-center justify-center p-2.5 rounded-xl shadow-lg shadow-indigo-50 dark:shadow-none bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={18} strokeWidth={2.5} />
                        </button>

                        {/* 5. Profile Dropdown Container */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black cursor-pointer overflow-hidden border border-gray-100 group shadow-sm transition-all active:scale-95"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} title={`${profile?.firstName} ${profile?.lastName}`}>
                                {profile?.photo ? (
                                    <img src={getImageUrl(profile.photo)} alt="P" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : initials}
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100] cursor-pointer" onClick={() => setIsProfileDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-700 z-[101] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                        <div className="px-6 py-6 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                                            <p className="font-black text-gray-900 dark:text-white dark:text-gray-100 text-[15px] italic">
                                                {profile?.firstName} {profile?.lastName}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium truncate mt-1 italic" title={profile?.email}>
                                                {profile?.email}
                                            </p>
                                        </div>
                                        <div className="p-3 space-y-1">
                                            <button
                                                onClick={() => { goTab('profile'); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                                            >
                                                <User size={16} /> {t('my_profile', 'Mon Profil')}
                                            </button>
                                            {isStaff && (
                                                <button
                                                    onClick={() => navigate('/admin')}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                >
                                                    <LayoutDashboard size={16} />
                                                    {t('admin_space', 'Espace administrateur')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { goTab('settings'); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                                            >
                                                <Settings size={16} /> {t('settings', 'Paramètres')}
                                            </button>
                                            <div className="h-px bg-gray-100/50 my-1 mx-4" />
                                            <button
                                                onClick={logout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <LogOut size={16} /> {t('logout', 'Déconnexion')}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
                <div className="sm:hidden fixed bottom-1 left-0 right-0 z-40 flex items-center justify-around px-2 py-1 transition-all mx-4 rounded-3xl"
                    style={{ background: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1e293b' : BORDER_CLR}`, height: '58px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    {[
                        { id: 'dashboard', icon: <Home size={18} /> },
                        { id: 'activity', icon: <Activity size={18} /> },
                        { id: 'requests', icon: <FileText size={18} /> },
                        { id: 'communion', icon: <Droplets size={18} /> },
                        { id: 'donations', icon: <Heart size={18} /> },
                        { id: 'toggle-theme', icon: isDark ? <Sun size={18} /> : <Moon size={18} />, action: toggleTheme },
                    ].map(item => (
                        <button key={item.id} onClick={item.action ? item.action : () => goTab(item.id)}
                            className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
                            style={{ color: (activeTab === item.id) ? '#6366f1' : '#9ca3af' }}>
                            {item.icon}
                        </button>
                    ))}
                </div>

                {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-6">

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Vue d'ensemble                                        */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in mt-2 fade-in duration-300">
                            {/* Welcome Card */}
                            <div className={`p-8 rounded-[2rem] border shadow-sm relative overflow-hidden group transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110 ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-50/50'}`} />
                                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/20 border-4 border-white dark:border-slate-800 shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                        {profile?.photo ? (
                                            <img src={getImageUrl(profile.photo)} alt="Me" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                                            {t('hello', 'Hello')}, {profile ? `${profile.firstName} ${profile.lastName}` : t('loading')} 👋
                                        </h1>
                                        <p className="text-slate-500 font-medium text-lg">{t('welcome_member_space', 'Welcome to your member space')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Dashboard Content (Activity Accordion) ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Upcoming Events */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="w-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                <Calendar className="text-indigo-500" size={20} />
                                                {t('upcoming_events')}
                                            </h3>
                                            <button onClick={() => goTab('events')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                                {t('view_all')}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {events.filter(e => new Date(e.startDate) >= new Date()).slice(0, 4).map(event => (
                                                <div key={event.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-indigo-500">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                            <span className="text-[10px] font-bold uppercase leading-none">{new Date(event.startDate).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { month: 'short' })}</span>
                                                            <span className="text-lg font-bold leading-none mt-1">{new Date(event.startDate).getDate()}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                                                            <div className="flex items-center gap-2 mt-2 text-slate-400 text-[11px] font-medium">
                                                                <Clock size={12} />
                                                                <span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                {event.location && (
                                                                    <>
                                                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                        <MapPin size={12} />
                                                                        <span className="truncate">{event.location}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {events.filter(e => new Date(e.startDate) >= new Date()).length === 0 && (
                                                <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                                    <p className="text-slate-400 text-sm italic">{t('no_upcoming_events', 'Aucun événement à venir')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Recent Activity */}
                                <div className="space-y-8">
                                    <div className="w-full">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                                            <Activity className="text-indigo-500" size={20} />
                                            {t('recent_activity')}
                                        </h3>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                            {activityItems.slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex gap-4 group/item">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.amber ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 'bg-slate-50 dark:bg-slate-700/50 text-indigo-500 dark:text-indigo-400'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1">
                                                        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover/item:text-indigo-600 transition-colors">{item.text}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-1">{item.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {activityItems.length === 0 && <p className="text-slate-400 text-xs text-center py-4">{t('no_recent_activity')}</p>}
                                            <button onClick={() => goTab('activity')} className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all">
                                                {t('view_all_history')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* ── Community Posts Feed (Mobile: Horizontal Scroll) ── */}
                            <div className="mt-4 sm:hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-800 dark:text-slate-200 text-[15px] flex items-center gap-2">
                                        <MessageSquare size={16} className="text-indigo-500" />
                                        {t('community', 'Communauté')}
                                    </h3>
                                    {communityPosts.length > postsLimit && (
                                        <button onClick={() => setPostsLimit(prev => prev === 5 ? 10 : prev + 10)} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                            {postsLimit === 5 ? 'Voir tout' : 'Voir plus'}
                                        </button>
                                    )}
                                </div>
                                <div className={postsLimit > 5 ? "space-y-4" : "flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide"}>
                                    {communityPosts
                                        .filter(p => postFilter === 'all' || p.type === postFilter)
                                        .filter(p =>
                                            !searchQuery ||
                                            p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.author?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.author?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .slice(0, postsLimit).map(post => {
                                            const category = POST_CATEGORIES.find(c => c.value === post.type) || POST_CATEGORIES[0];
                                            const isAuthor = post.authorId == profile?.id;
                                            const isAdmin = isStaff;

                                            return (
                                                <div key={post.id} className="min-w-[280px] snap-center">
                                                    <Card className="p-4 h-full border-2 border-indigo-50/50 relative overflow-hidden">
                                                        <div className="flex items-center justify-between gap-3 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                                                    {post.author?.photo ? <img src={getImageUrl(post.author.photo)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-[10px] uppercase">{post.author?.firstName?.[0] || 'A'}</div>}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">{post.author?.firstName} {post.author?.lastName}</p>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">{category.label.split(' ')[1]}</span>
                                                                        {post.targetSubtype && <span className="text-[8px] font-bold text-gray-400 uppercase">🎯 {post.targetSubtype.name}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {(isAuthor || isAdmin) && (
                                                                <div className="flex items-center gap-1">
                                                                    <button onClick={() => handleEditPost(post)} className="p-1.5 bg-indigo-50 text-indigo-400 rounded-lg">
                                                                        <Edit3 size={12} />
                                                                    </button>
                                                                    <button onClick={() => handleDeletePost(post.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg">
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] text-gray-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-3">{post.content}</p>
                                                        {post.imageUrl && post.imageUrl.trim() !== '' && (
                                                            <div className="relative group h-32 rounded-xl overflow-hidden mb-3 border border-gray-100 dark:border-slate-700 cursor-pointer"
                                                                onClick={() => setZoomedImageUrl(getImageUrl(post.imageUrl))}>
                                                                <img src={getImageUrl(post.imageUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                <div className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Maximize2 size={16} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <p className="text-[9px] text-gray-400 font-medium">
                                                            {new Date(post.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    {communityPosts.length === 0 && (
                                        <p className="text-gray-400 text-sm py-4 italic">{t('no_publication', 'Aucune publication')}</p>
                                    )}

                                    {postsLimit > 5 && communityPosts.length > postsLimit && (
                                        <div className="flex justify-center py-4">
                                            <button onClick={() => setPostsLimit(prev => prev + 10)}
                                                className="text-[10px] font-black uppercase text-indigo-600 border border-indigo-100 px-6 py-2 rounded-full hover:bg-indigo-50">
                                                Voir les plus anciens
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity + Notifications row (Removed to prevent duplicates) */}
                            {/* ── Community Posts Feed (Desktop Only) ── */}
                            <div className="hidden sm:block mt-8 w-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-800 dark:text-slate-200 text-[18px] flex items-center gap-3">
                                        <MessageSquare size={20} className="text-indigo-500" />
                                        {t('community_posts', 'Publications de la communauté')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">{t('filter_by', 'Filtrer par :')}</label>
                                        <select
                                            value={postFilter}
                                            onChange={(e) => setPostFilter(e.target.value)}
                                            className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[12px] font-bold text-gray-600 focus:outline-none focus:ring-2 ring-indigo-500/20"
                                        >
                                            <option value="all">{t('all', 'Toutes')}</option>
                                            {POST_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label.split(' ')[1]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {communityPosts
                                        .filter(p => (postFilter === 'all' || p.type === postFilter))
                                        .filter(p =>
                                            !searchQuery ||
                                            p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.author?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.author?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .slice(0, postsLimit).map(post => {
                                            const dateLabel = new Date(post.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                                            const category = POST_CATEGORIES.find(c => c.value === post.type) || POST_CATEGORIES[0];
                                            const isAuthor = post.authorId == profile?.id;
                                            const isAdmin = isStaff;

                                            return (
                                                <Card key={post.id} className="p-6 border-l-4 hover:shadow-xl hover:shadow-indigo-500/5 transition-all" style={{ borderLeftColor: category.color === 'blue' ? '#6366f1' : (category.color === 'rose' ? '#f43f5e' : (category.color === 'amber' ? '#f59e0b' : '#10b981')) }}>
                                                    <div className="flex items-center justify-between gap-4 mb-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-full overflow-hidden text-white flex justify-center items-center text-xs font-black shadow-sm shrink-0"
                                                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                                                {post.author?.photo ? <img src={getImageUrl(post.author.photo)} alt="" className="w-full h-full object-cover" /> : post.author?.firstName?.[0] || 'A'}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-[14px] text-gray-900 dark:text-white tracking-tight">{post.author?.firstName} {post.author?.lastName}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-gray-400 font-medium">{dateLabel}</span>
                                                                    {post.targetSubtype && (
                                                                        <>
                                                                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                                            <span className="text-[9px] font-bold text-gray-400 uppercase">🎯 {post.targetSubtype.name}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge label={category.label.split(' ')[1]} color={category.color} />
                                                            {(isAuthor || isAdmin) && (
                                                                <div className="flex items-center gap-1">
                                                                    <button onClick={() => handleEditPost(post)} className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all">
                                                                        <Edit3 size={14} />
                                                                    </button>
                                                                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {post.title && <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2 leading-tight">{post.title}</h3>}
                                                    <p className="text-gray-600 dark:text-slate-400 text-[13px] whitespace-pre-line mb-4 leading-relaxed line-clamp-4">{post.content}</p>
                                                    {post.imageUrl && post.imageUrl.trim() !== '' && (
                                                        <div className="relative group rounded-xl overflow-hidden mt-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 h-48 cursor-pointer"
                                                            onClick={() => setZoomedImageUrl(getImageUrl(post.imageUrl))}>
                                                            <img src={getImageUrl(post.imageUrl)} alt="Attachment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            <div className="absolute top-3 right-3 w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                                <Maximize2 size={20} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                </div>

                                {communityPosts.length > postsLimit && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setPostsLimit(prev => prev + 4)}
                                            className="px-12 py-4 rounded-[1.5rem] bg-white border-2 border-indigo-50 text-indigo-600 font-black text-[12px] uppercase tracking-widest hover:border-indigo-600/20 hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-sm active:scale-95"
                                        >
                                            {t('load_older_posts', 'Charger les publications anciennes')} <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {communityPosts.length === 0 && (
                                    <div className="text-center py-16 bg-white/50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-700">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><MessageSquare size={24} /></div>
                                        <p className="text-gray-500 dark:text-gray-400 text-[14px] font-medium italic">{t('no_publication_yet', 'Aucune publication pour l\'instant.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Événements                                            */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'events' && (
                        <div className="animate-in fade-in duration-300 w-full space-y-8">
                            <PageTitle title={t('upcoming_events')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {events.map(event => {
                                    const isUpcoming = new Date(event.startDate) >= new Date();
                                    return (
                                        <Card key={event.id} className={`p-0 overflow-hidden group border-0 shadow-xl shadow-indigo-500/5 transition-all hover:scale-[1.02] ${isUpcoming ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-900/50 grayscale opacity-70'}`}>
                                            <div className="h-40 relative">
                                                {event.imageUrl ? (
                                                    <img src={getImageUrl(event.imageUrl)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white">
                                                        <Calendar size={48} className="opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                                                    <Badge label={isUpcoming ? t('upcoming', 'À venir') : t('past', 'Passé')} color={isUpcoming ? 'blue' : 'gray'} />
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2">{event.title}</h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                                                        <Calendar size={14} className="text-indigo-400" />
                                                        {new Date(event.startDate).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                                                        <Clock size={14} className="text-indigo-400" />
                                                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {event.location && (
                                                        <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                                                            <MapPin size={14} className="text-indigo-400" />
                                                            <span className="truncate">{event.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {event.description && <p className="text-slate-400 text-xs line-clamp-2 italic">{event.description}</p>}
                                            </div>
                                        </Card>
                                    );
                                })}
                                {events.length === 0 && (
                                    <div className="col-span-full py-24 text-center bg-white dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-200">
                                            <Calendar size={32} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-bold mb-2">{t('no_events_found', 'Aucun événement trouvé')}</h4>
                                        <p className="text-slate-400 text-sm italic">{t('check_back_later', 'Revenez plus tard pour de nouvelles activités !')}</p>
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
                    {
                        activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300 w-full space-y-6">

                                {/* Avatar card with Cover */}
                                <Card className="overflow-hidden p-0 relative border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-white dark:bg-slate-800">
                                    {/* Clean Gradient Header */}
                                    <div className="bg-gradient-to-br from-white via-indigo-50/60 to-slate-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-900 px-10 pt-10 pb-10 border-b border-gray-100/50 dark:border-white/5">

                                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 text-center sm:text-left">
                                            {/* Avatar element */}
                                            <div className="relative group w-[140px] h-[140px] rounded-[2.5rem] flex items-center justify-center text-white font-black text-[48px] shrink-0 shadow-2xl shadow-indigo-500/10 overflow-hidden cursor-pointer ring-[5px] ring-indigo-100 dark:ring-indigo-500/20 transition-all duration-500 group-hover:rounded-[2rem] group-hover:scale-105"
                                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                                {profile?.photo ? (
                                                    <img src={getImageUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" onClick={handlePhotoClick} crossOrigin="anonymous" />
                                                ) : (
                                                    <div onClick={() => fileInputRef.current.click()}>{initials}</div>
                                                )}

                                                {/* Overlay pour modifier la photo */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                                                    onClick={() => fileInputRef.current.click()}>
                                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 scale-90 group-hover:scale-100 transition-transform">
                                                        <Edit3 size={24} className="text-white" />
                                                    </div>
                                                </div>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </div>

                                            {/* Name + email */}
                                            <div className="flex-1 min-w-0 sm:pb-2 space-y-3">
                                                <div>
                                                    <h2 className="font-black text-3xl sm:text-4xl tracking-tighter text-gray-900 dark:text-white leading-tight">
                                                        {profile ? `${profile.firstName} ${profile.lastName}` : t('loading', 'Chargement...')}
                                                    </h2>
                                                    <p className="text-base mt-2 font-bold text-indigo-500 dark:text-indigo-400">
                                                        {profile?.email || '...'}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                                    <span className="px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                        {t('status_member', 'Membre')} {profile?.status || t('active', 'actif')}
                                                    </span>
                                                    {profile?.joinDate && (
                                                        <span className="px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {t('since', 'Depuis')} {new Date(profile.joinDate).getFullYear()}
                                                        </span>
                                                    )}
                                                    {profile?.memberCode && (
                                                        <span className="px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/20 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                                            {profile.memberCode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Edit button */}
                                            {!editing && (
                                                <div className="sm:ml-auto pb-2">
                                                    <button onClick={() => setEditing(true)}
                                                        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-[13px] font-black tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40">
                                                        <Edit3 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                {/* Info card */}
                                <Card className="p-10">
                                    <h3 className="font-bold text-[#1a2035] dark:text-white mb-8"
                                        style={{ fontSize: '20px', fontFamily: SERIF }}>
                                        {t('personal_information', 'Informations personnelles')}
                                    </h3>

                                    {/* Removed roles/status badges section per user request */}

                                    {editing ? (
                                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                {[
                                                    { label: t('first_name', 'Prénom'), key: 'firstName' },
                                                    { label: t('last_name', 'Nom'), key: 'lastName' },
                                                    { label: t('nickname', 'Surnom'), key: 'nickname' },
                                                    { label: t('gender_label', 'Sexe'), key: 'gender' },
                                                    { label: t('birth_place', 'Lieu de naissance'), key: 'birthPlace' },
                                                    { label: t('status', 'Statut'), key: 'status' },
                                                    { label: t('marital_status_label', 'État civil'), key: 'maritalStatus' },
                                                    { label: t('spouse_name', 'Nom conjoint'), key: 'spouseName' },
                                                    { label: t('email', 'Email'), key: 'email', type: 'email' },
                                                    { label: t('phone', 'Téléphone'), key: 'phone' },
                                                    { label: t('address', 'Adresse'), key: 'address' },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{f.label}</label>
                                                        <input type={f.type || 'text'} value={formData[f.key] || ''}
                                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                            className="w-full px-5 py-3.5 rounded-xl border dark:border-slate-700 dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500/50 transition-all dark:text-white"
                                                            style={{ borderColor: isDark ? '#334155' : BORDER_CLR }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 pt-4 max-w-sm">
                                                <button type="button" onClick={() => setEditing(false)}
                                                    className="flex-1 py-3 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: BORDER_CLR }}>
                                                    {t('cancel', 'Annuler')}
                                                </button>
                                                <button type="submit" disabled={savingProfile}
                                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 bg-[#1a2035] dark:bg-indigo-600"
                                                >
                                                    {savingProfile ? '...' : t('save', 'Enregistrer')}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {[
                                                { label: t('nickname', 'Surnom'), value: profile?.nickname, icon: <User size={14} className="text-indigo-400" /> },
                                                { label: t('gender_label', 'Sexe'), value: profile?.gender === 'M' ? t('masculine', 'Masculin') : (profile?.gender === 'F' ? t('feminine', 'Féminin') : profile?.gender), icon: <Users size={14} className="text-indigo-400" /> },
                                                { label: t('marital_status_label', 'État civil'), value: profile?.maritalStatus, icon: <Heart size={14} className="text-indigo-400" /> },
                                                { label: t('member_category', 'Catégorie de membre'), value: profile?.contactSubtype?.name || t('member', 'Membre'), icon: <LayoutDashboard size={14} className="text-indigo-400" /> },
                                                { label: t('phone', 'Téléphone'), value: profile?.phone, icon: <Phone size={14} className="text-indigo-400" /> },
                                                { label: t('email', 'Email'), value: profile?.email, icon: <Mail size={14} className="text-indigo-400" /> },
                                                { label: t('address', 'Adresse'), value: [profile?.address, profile?.city].filter(Boolean).join(', ') || '–', icon: <MapPin size={14} className="text-indigo-400" /> },
                                                { label: t('birth_date', 'Date de naissance'), value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–', icon: <Calendar size={14} className="text-indigo-400" /> },
                                                { label: t('join_date', "Date d'adhésion"), value: profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–', icon: <Clock size={14} className="text-indigo-400" /> },
                                                { label: t('member_code', 'Code membre'), value: profile?.memberCode || '–', icon: <CreditCard size={14} className="text-indigo-400" /> },
                                            ].filter(Boolean).map((item, i) => (
                                                <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {item.icon}
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-500 transition-colors uppercase">{item.label}</p>
                                                    </div>
                                                    <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 break-words pl-5" style={{ fontFamily: FONT }}>
                                                        {item.value || '–'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )
                    }

                    {activeTab === 'activity' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <PageTitle title={t('recent_activity', 'Activité récente')} />
                            <div className="space-y-3 w-full">
                                {activityItems.length === 0 ? (
                                    <Card className="p-12 text-center text-gray-400">
                                        <Activity size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p>{t('no_recent_activity', 'Aucune activité récente')}</p>
                                    </Card>
                                ) : (
                                    activityItems.map((item, i) => (
                                        <RowCard key={i}
                                            left={<IconCircle icon={item.icon} amber={item.amber} />}
                                            center={
                                                <>
                                                    <p className="text-gray-800 dark:text-slate-200 font-medium text-[13px]">{item.text}</p>
                                                    <p className="text-gray-400 text-[11px] mt-0.5">{item.date}</p>
                                                </>
                                            }
                                            right={<Badge label={item.badge} color={item.badgeColor} />}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Mes demandes                                          */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {
                        activeTab === 'requests' && (
                            <div className="animate-in fade-in duration-300 w-full">
                                <PageTitle title={t('my_requests', 'Mes demandes')} />
                                {/* Use MemberRequests component but wrap the list items in our style */}
                                <MemberRequests renderMode="cards" />
                            </div>
                        )
                    }

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* Ma carte membre                                     */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'my_card' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col items-center">
                            <PageTitle
                                title={t('my_member_card', 'Ma carte membre')}
                                subtitle={t('card_id_desc', 'Votre identification officielle au sein de la communauté.')}
                            />

                            {!activeCard ? (
                                <Card className="w-full max-w-2xl p-16 text-center border-dashed border-2 dark:border-slate-700 flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-600">
                                        <CreditCard size={40} />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-gray-900 dark:text-white font-black text-lg">{t('no_active_card', 'Aucune carte active')}</p>
                                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                                            {t('card_not_generated_desc', "Votre carte de membre n'a pas encore été générée ou est en attente d'activation. Si vous n'en avez jamais fait la demande, vous pouvez le faire maintenant.")}
                                        </p>
                                        <div className="pt-4 border-t border-gray-100 flex justify-center">
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_new', 'Demande de Nouvelle Carte Membre')}
                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                <Plus size={16} /> {t('request_member_card', 'Effectuer une demande de carte')}
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="w-full max-w-4xl space-y-12 pb-12">
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex items-center gap-4 text-amber-800 dark:text-amber-200 text-[13px] font-medium shadow-sm">
                                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                                            <Settings size={18} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span>{t('card_id_official_desc', "Cette carte est votre document d'identité officiel. Notez qu'elle ne peut pas être modifiée par l'utilisateur.")}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 place-items-center relative">
                                        {/* Recto */}
                                        <div className="space-y-4 w-full flex flex-col items-center">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('front_side', 'Côté recto')}</p>
                                            <div
                                                className="shadow-2xl shadow-indigo-200/50 rounded-xl overflow-hidden ring-1 ring-black/5 cursor-zoom-in group relative transition-transform hover:-translate-y-1"
                                                onClick={() => setCardZoomSide('front')}
                                            >
                                                <CardDisplay card={activeCard} side="front" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 dark:text-white p-3 rounded-full shadow-lg backdrop-blur-sm">
                                                        <Maximize2 size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verso */}
                                        <div className="space-y-4 w-full flex flex-col items-center">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('back_side', 'Côté verso')}</p>
                                            <div
                                                className="shadow-2xl shadow-indigo-200/50 rounded-xl overflow-hidden ring-1 ring-black/5 cursor-zoom-in group relative transition-transform hover:-translate-y-1"
                                                onClick={() => setCardZoomSide('back')}
                                            >
                                                <CardDisplay card={activeCard} side="back" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 dark:text-white p-3 rounded-full shadow-lg backdrop-blur-sm">
                                                        <Maximize2 size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 pt-8">
                                        <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[12px] font-black tracking-widest border border-indigo-100">
                                            {t('card_status', 'Statut de la carte')}: {activeCard.status}
                                        </div>
                                        <p className="text-gray-400 text-[11px] font-medium italic">{t('member_id_identification', 'Identification member ID')}: {activeCard.cardNumber}</p>

                                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_lost', t('declare_lost_card', 'Déclaration de Carte Perdue'))}
                                                className="px-4 py-2 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                {t('declare_lost_card', 'Déclarer une carte perdue')}
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_stolen', t('declare_stolen_card', 'Déclaration de Carte Volée'))}
                                                className="px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                {t('declare_stolen_card', 'Déclarer une carte volée')}
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_defective', t('declare_defective_card', 'Déclaration de Carte Défectueuse'))}
                                                className="px-4 py-2 border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                {t('my_card_is_defective', 'Ma carte est défectueuse')}
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
                        <div className="animate-in fade-in duration-300 w-full">
                            <div className="flex items-start justify-between mb-6">
                                <PageTitle title={t('donation_history', 'Historique des dons')} />
                                <Card className="px-4 py-3 text-right shrink-0 ml-4">
                                    <p className="text-[10px] font-bold text-gray-400 tracking-wide">
                                        {t('total', 'Total')} {new Date().getFullYear()}
                                    </p>
                                    <p className="font-bold text-gray-900 dark:text-white mt-0.5" style={{ fontSize: '18px' }}>
                                        {displayTotal}
                                    </p>
                                </Card>
                            </div>

                            <div className="space-y-3">
                                {donations.length === 0 ? (
                                    <Card className="p-12 text-center">
                                        <Heart size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm">{t('no_donation_recorded', 'Aucun don enregistré')}</p>
                                    </Card>
                                ) : donations.map(d => (
                                    <RowCard key={d.id}
                                        left={<IconCircle icon={<Heart size={16} />} amber />}
                                        center={
                                            <>
                                                <p className="text-gray-800 dark:text-slate-200 font-medium text-[13px]">{t('donation', 'Don')}</p>
                                                <p className="text-gray-400 text-[11px] mt-0.5">
                                                    {d.date ? new Date(d.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    {d.paymentMethod && <> · {d.paymentMethod}</>}
                                                </p>
                                            </>
                                        }
                                        right={
                                            <p className="font-bold text-gray-900 dark:text-white text-[15px]">
                                                {parseFloat(d.amount).toLocaleString(locale)} {d.currency || 'HTG'}
                                            </p>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'communion' && (
                        <div className="animate-in fade-in duration-300 w-full text-left">
                            <PageTitle
                                title={t('holy_communion_participation', 'Participation à la Sainte Cène')}
                                subtitle={t('communion_desc', 'Suivez vos participations aux cérémonies de communion.')}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0 shadow-lg shadow-indigo-100">
                                    <Droplets className="mb-4 opacity-50" size={32} />
                                    <p className="text-[11px] font-black tracking-widest opacity-80">{t('total_participations', 'Total participations')}</p>
                                    <p className="text-4xl font-black mt-1">
                                        {ceremonies.filter(c => c.type === 'sainte_cene').length}
                                    </p>
                                </Card>
                                <Card className="p-6">
                                    <Calendar className="mb-4 text-amber-500" size={32} />
                                    <p className="text-[11px] font-black tracking-widest text-gray-400">{t('last_participation', 'Dernière participation')}</p>
                                    <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">
                                        {ceremonies.filter(c => c.type === 'sainte_cene')[0]?.date ? new Date(ceremonies.filter(c => c.type === 'sainte_cene')[0].date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : t('none', 'Aucune')}
                                    </p>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 tracking-tight flex items-center gap-3">
                                    <Clock size={18} className="text-indigo-500" />
                                    {t('participation_history', 'Historique des participations')}
                                </h3>

                                {ceremonies.filter(c => c.type === 'sainte_cene').length === 0 ? (
                                    <Card className="p-16 text-center border-dashed border-2 dark:border-slate-700">
                                        <Droplets size={48} className="mx-auto text-gray-100 mb-4" />
                                        <p className="text-gray-400 font-medium">{t('no_communion_history', "Aucun historique de participation à la Sainte Cène n'est enregistré pour le moment.")}</p>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {ceremonies.filter(c => c.type === 'sainte_cene').map(c => (
                                            <RowCard
                                                key={c.id}
                                                left={<IconCircle icon={<Droplets size={16} />} amber={false} />}
                                                center={
                                                    <>
                                                        <p className="text-gray-900 dark:text-white font-bold text-[14px]">{c.title || t('holy_communion', 'Sainte Cène')}</p>
                                                        <p className="text-gray-400 text-[11px] mt-0.5">{new Date(c.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                        {c.description && <p className="text-gray-500 text-[12px] mt-1 italic">{c.description}</p>}
                                                    </>
                                                }
                                                right={<Badge label={t('present', 'Présent')} color="green" />}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-300 w-full text-left">
                            <PageTitle title={t('notifications', 'Notifications')}
                                subtitle={unreadCount > 0 ? `${unreadCount} ${t('unread', 'non lue')}${unreadCount > 1 ? 's' : ''}` : t('all_up_to_date', 'Tout est à jour')} />

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {notifications.filter(n => !n.isRead).length === 0 ? (
                                        notifications.length > 0 && notifications.filter(n => !n.isRead).length === 0 && (
                                            <div className="mb-4 p-6 bg-indigo-50/30 border-2 border-dashed border-indigo-100/50 rounded-[1.5rem] text-center">
                                                <p className="text-gray-400 text-[11px] font-black italic tracking-widest">{t('no_unread_notifs', 'Saisie à jour : aucune nouvelle notification')}</p>
                                            </div>
                                        )
                                    ) : notifications.filter(n => !n.isRead).map(n => (
                                        <RowCard key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            left={<IconCircle icon={<Bell size={16} />} amber />}
                                            center={
                                                <>
                                                    <p className="text-gray-800 dark:text-slate-200 font-bold text-[13px]">{n.title}</p>
                                                    <p className="text-gray-400 text-[11px] mt-0.5">
                                                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                    </p>
                                                    {n.message && <p className="text-gray-500 text-[12px] mt-1 line-clamp-2">{n.message}</p>}
                                                </>
                                            }
                                            right={<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200 animate-pulse" />}
                                        />
                                    ))}
                                </div>

                                {notifications.filter(n => n.isRead).length > 0 && (
                                    <div className="pt-4">
                                        <button
                                            onClick={() => setIsOldNotificationsExpanded(!isOldNotificationsExpanded)}
                                            className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] hover:bg-gray-50 transition-all group active:scale-[0.99] shadow-sm"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-white transition-colors">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-[13px] font-black tracking-widest text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors">
                                                        {t('older_notifications', 'Anciennes notifications')}
                                                    </h3>
                                                    <p className="text-[11px] text-gray-400 font-medium">
                                                        {notifications.filter(n => n.isRead).length} {t('read_notifications', 'conversations lues')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`transition-transform duration-500 ${isOldNotificationsExpanded ? 'rotate-180 text-indigo-600' : 'text-gray-300'}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>

                                        {isOldNotificationsExpanded && (
                                            <div className="mt-3 space-y-3 animate-in slide-in-from-top-4 duration-500">
                                                {notifications.filter(n => n.isRead).map(n => (
                                                    <RowCard key={n.id}
                                                        left={<IconCircle icon={<Bell size={16} />} amber={false} />}
                                                        center={
                                                            <>
                                                                <p className="text-gray-500 font-medium text-[13px]">{n.title}</p>
                                                                <p className="text-gray-400 text-[11px] mt-0.5">
                                                                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                                </p>
                                                                {n.message && <p className="text-gray-400 text-[12px] mt-1 opacity-75">{n.message}</p>}
                                                            </>
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {notifications.length === 0 && (
                                    <Card className="p-12 text-center">
                                        <Bell size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm">{t('no_notifications', 'Aucune notification')}</p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}


                    {activeTab === 'sunday_school' && (
                        <div className="animate-in fade-in duration-300 w-full text-left">
                            <PageTitle title={t('sunday_school', 'École du dimanche')} subtitle={t('ss_subtitle', 'Gérez vos classes et suivez vos progrès spirituels')} />

                            {/* Current Classes */}
                            {(!profile?.sundaySchoolClasses || profile.sundaySchoolClasses.length === 0) ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <BookOpen size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>{t('no_ss_class', "Vous n'êtes inscrit dans aucune classe pour le moment.")}</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {profile.sundaySchoolClasses.map(cls => (
                                        <Card key={cls.id} className="p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                                            <div className="flex items-start justify-between relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-4 transition-transform group-hover:-rotate-6">
                                                    <BookOpen size={24} />
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-slate-200 text-lg mb-1">{cls.name || t('class', 'Classe')}</h4>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-4">{cls.membership?.level || t('member', 'Membre')}</p>
                                            <div className="flex items-center gap-3 mt-auto">
                                                <div className="flex -space-x-2">
                                                    {[1, 2].map(i => (
                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-gray-100 dark:bg-slate-700 overflow-hidden">
                                                            <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] text-indigo-400 font-bold">U</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[11px] text-gray-500">{t('active_class', 'Classe active')}</span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Attendance Current Month */}
                            <div className="mt-8">
                                <button
                                    onClick={() => setIsSundayAttendanceExpanded(!isSundayAttendanceExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[1.5rem] border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm transition-transform group-hover:scale-110">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[13px] font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                                                {t('attendance_current_month', 'Présence aux classes (mois en cours)')}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={`text-emerald-300 transition-transform duration-500 ${isSundayAttendanceExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                                </button>
                                {isSundayAttendanceExpanded && (
                                    <div className="mt-4 p-2 bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
                                        {currentMonthAttendance.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
                                                <p className="text-gray-400 text-[11px] font-black tracking-widest italic">{t('no_attendance_this_month', 'Aucune présence enregistrée ce mois-ci.')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {currentMonthAttendance.map(att => (
                                                    <div key={att.id} className="flex items-center justify-between p-4 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 rounded-2xl transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 ${att.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                                <Check size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{att.class?.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(att.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge label={t(att.status)} color={att.status === 'present' ? 'green' : 'rose'} />
                                                            {att.report?.id && (
                                                                <button
                                                                    onClick={() => setSsReportModal({ show: true, id: att.report.id })}
                                                                    className="block mt-1 text-[9px] font-black tracking-widest text-indigo-500 hover:text-indigo-600 hover:underline"
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

                            {/* Past Attendance with Filter */}
                            <div className="mt-4">
                                <button
                                    onClick={() => setIsSundayPastAttendanceExpanded(!isSundayPastAttendanceExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-[1.5rem] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm group-hover:rotate-12 transition-all">
                                            <Filter size={18} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[13px] font-black tracking-widest text-indigo-500 dark:text-indigo-300">
                                                {t('past_attendance_filter', 'Présence passée et filtres')}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={`text-indigo-200 transition-transform duration-500 ${isSundayPastAttendanceExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                </button>
                                {isSundayPastAttendanceExpanded && (
                                    <div className="mt-4 p-6 bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-[2rem] animate-in slide-in-from-top-4 duration-500 shadow-sm">
                                        <div className="flex flex-wrap items-end gap-4 mb-6 p-6 bg-gray-50 dark:bg-slate-900/50 rounded-[2rem] border border-gray-100/50 dark:border-slate-800 shadow-sm transition-all focus-within:shadow-indigo-500/5">
                                            <div className="flex-1 min-w-[150px] relative">
                                                <label className="block text-[10px] font-black tracking-widest text-indigo-400 mb-2 ml-1 uppercase">{t('from', 'Du')}</label>
                                                <div className="relative group">
                                                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none group-focus-within:scale-110 transition-transform" />
                                                    <input
                                                        type="date"
                                                        value={ssAttendanceFilter.startDate}
                                                        onChange={e => setSsAttendanceFilter({ ...ssAttendanceFilter, startDate: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-4 ring-indigo-500/10 outline-none shadow-sm transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-[150px] relative">
                                                <label className="block text-[10px] font-black tracking-widest text-indigo-400 mb-2 ml-1 uppercase">{t('to', 'Au')}</label>
                                                <div className="relative group">
                                                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none group-focus-within:scale-110 transition-transform" />
                                                    <input
                                                        type="date"
                                                        value={ssAttendanceFilter.endDate}
                                                        onChange={e => setSsAttendanceFilter({ ...ssAttendanceFilter, endDate: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-4 ring-indigo-500/10 outline-none shadow-sm transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-[130px] relative">
                                                <label className="block text-[10px] font-black tracking-widest text-indigo-400 mb-2 ml-1 uppercase">{t('month', 'Mois')}</label>
                                                <select
                                                    value={ssAttendanceFilter.month}
                                                    onChange={e => setSsAttendanceFilter({ ...ssAttendanceFilter, month: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl px-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-4 ring-indigo-500/10 outline-none shadow-sm transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="all">{t('all', 'Tous')}</option>
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <option key={i + 1} value={i + 1}>
                                                            {new Date(2000, i, 1).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { month: 'long' })}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 min-w-[110px] relative">
                                                <label className="block text-[10px] font-black tracking-widest text-indigo-400 mb-2 ml-1 uppercase">{t('year', 'Année')}</label>
                                                <select
                                                    value={ssAttendanceFilter.year}
                                                    onChange={e => setSsAttendanceFilter({ ...ssAttendanceFilter, year: e.target.value })}
                                                    className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl px-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-4 ring-indigo-500/10 outline-none shadow-sm transition-all appearance-none cursor-pointer"
                                                >
                                                    {Array.from({ length: 10 }, (_, i) => {
                                                        const y = new Date().getFullYear() - 5 + i;
                                                        return <option key={y} value={y}>{y}</option>;
                                                    })}
                                                </select>
                                            </div>
                                            {(ssAttendanceFilter.startDate || ssAttendanceFilter.endDate || ssAttendanceFilter.month !== 'all') && (
                                                <button
                                                    onClick={() => setSsAttendanceFilter({ startDate: '', endDate: '', month: 'all', year: new Date().getFullYear().toString() })}
                                                    className="h-[42px] px-5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    {t('clear', 'Effacer')}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {processedAttendance.length === 0 ? (
                                                <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[1.5rem]">
                                                    <History size={32} className="mx-auto text-gray-100 mb-3" />
                                                    <p className="text-gray-400 text-[11px] font-black tracking-widest italic">{t('no_past_attendance_found', 'Aucun résultat pour cette période.')}</p>
                                                </div>
                                            ) : (
                                                processedAttendance.map(att => (
                                                    <div key={att.id} className="flex items-center justify-between p-4 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 rounded-2xl transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${att.status === 'present' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                                <Clock size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200">{att.class?.name}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{new Date(att.date).toLocaleDateString(locale)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge label={t(att.status)} color={att.status === 'present' ? 'green' : 'rose'} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Class Reports / Historique */}
                            <div className="mt-4">
                                <button
                                    onClick={() => setIsSundayHistoryExpanded(!isSundayHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-gray-50/50 dark:bg-slate-900/50 rounded-[1.5rem] border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors shadow-sm">
                                            <FileText size={18} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[13px] font-black tracking-widest text-gray-400 group-hover:text-gray-900 dark:text-gray-100 transition-colors">
                                                {t('class_reports', 'Rapports de classe')}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={`text-gray-300 transition-transform duration-500 ${isSundayHistoryExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                                </button>
                                {isSundayHistoryExpanded && (
                                    <div className="mt-4 p-4 bg-white dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
                                        {/* Report Filters */}
                                        <div className="flex flex-wrap items-center gap-4 mb-6 p-6 bg-amber-50/30 dark:bg-amber-950/10 rounded-[2rem] border border-amber-100/30 dark:border-amber-900/10 shadow-sm">
                                            <div className="flex-1 min-w-[200px] relative">
                                                <label className="block text-[8px] font-black tracking-widest text-amber-500/60 mb-2 ml-1 uppercase">{t('search', 'Rechercher')}</label>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                                                    <input
                                                        type="text"
                                                        value={ssReportFilter.query}
                                                        onChange={e => setSsReportFilter({ ...ssReportFilter, query: e.target.value })}
                                                        placeholder={t('search_lesson_placeholder', 'Leçon, classe...')}
                                                        className="w-full bg-white dark:bg-slate-900 border-0 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-2 ring-amber-500/20 outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-[150px] relative">
                                                <label className="block text-[8px] font-black tracking-widest text-amber-500/60 mb-2 ml-1 uppercase">{t('from', 'Du')}</label>
                                                <div className="relative">
                                                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={ssReportFilter.startDate}
                                                        onChange={e => setSsReportFilter({ ...ssReportFilter, startDate: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-900 border-0 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-2 ring-amber-500/20 outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-[150px] relative">
                                                <label className="block text-[8px] font-black tracking-widest text-amber-500/60 mb-2 ml-1 uppercase">{t('to', 'Au')}</label>
                                                <div className="relative">
                                                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={ssReportFilter.endDate}
                                                        onChange={e => setSsReportFilter({ ...ssReportFilter, endDate: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-900 border-0 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-bold dark:text-white focus:ring-2 ring-amber-500/20 outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            {(ssReportFilter.query || ssReportFilter.startDate || ssReportFilter.endDate) && (
                                                <button
                                                    onClick={() => setSsReportFilter({ query: '', startDate: '', endDate: '' })}
                                                    className="h-[42px] px-5 bg-amber-100/50 text-amber-700 rounded-xl hover:bg-amber-100 transition-all text-[10px] font-black uppercase tracking-widest mt-4 sm:mt-6"
                                                >
                                                    {t('clear', 'Effacer')}
                                                </button>
                                            )}
                                        </div>

                                        {processedReports.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <CloudOff size={32} className="mx-auto text-gray-100 mb-3" />
                                                <p className="text-gray-400 text-[11px] font-black tracking-widest italic">{t('no_reports_found', 'Aucun rapport de classe trouvé.')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {processedReports.map(report => (
                                                    <div key={report.id} className="flex items-center justify-between p-4 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 rounded-2xl transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-110">
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200 line-clamp-1">{report.lessonTitle || report.title || t('weekly_report', 'Rapport hebdomadaire')}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{report.class?.name} • {new Date(report.date).toLocaleDateString(locale)}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSsReportModal({ show: true, id: report.id })}
                                                            className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95 whitespace-nowrap"
                                                        >
                                                            {t('view', 'Voir')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="animate-in fade-in duration-300 w-full text-left">
                            <PageTitle title={t('groups', 'Groupes')} />
                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type !== 'ministry').length === 0) ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <Users size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>{t('no_group_desc', "Vous n'êtes membre d'aucun groupe.")}</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profile.memberGroups.filter(g => g.type !== 'ministry').map(g => (
                                        <Card key={g.id} className="p-5 flex flex-col hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
                                                <Users size={20} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-1">{g.name}</h4>
                                            <p className="text-[11px] text-gray-400 font-black tracking-wider mb-2">{g.type || t('group', 'Groupe')}</p>
                                            <p className="text-sm text-gray-500 line-clamp-2">{g.description || t('no_description', 'Pas de description.')}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Historique Accordion */}
                            <div className="mt-8">
                                <button
                                    onClick={() => setIsGroupsHistoryExpanded(!isGroupsHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors shadow-sm">
                                            <History size={18} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[13px] font-black tracking-widest text-gray-400 group-hover:text-gray-900 dark:text-gray-100 transition-colors">
                                                {t('history_past_groups', 'Historique / groupes passés')}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={`text-gray-300 transition-transform duration-500 ${isGroupsHistoryExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                </button>
                                {isGroupsHistoryExpanded && (
                                    <div className="mt-4 p-8 text-center bg-white dark:bg-slate-800/20 border border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
                                        <CloudOff size={32} className="mx-auto text-gray-100 mb-3" />
                                        <p className="text-gray-400 text-[11px] font-black tracking-widest italic">{t('no_inactive_found', 'Aucun groupe inactif ou historique trouvé.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ministries' && (
                        <div className="animate-in fade-in duration-300 w-full text-left">
                            <PageTitle title={t('ministries', 'Ministères')} />
                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type === 'ministry').length === 0) ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>{t('no_ministry_desc', "Vous ne faites partie d'aucun ministère.")}</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profile.memberGroups.filter(g => g.type === 'ministry').map(m => (
                                        <Card key={m.id} className="p-5 flex flex-col hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                                                <Building2 size={20} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-1">{m.name}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2">{m.description || t('no_description', 'Pas de description.')}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Historique Accordion */}
                            <div className="mt-8">
                                <button
                                    onClick={() => setIsMinistriesHistoryExpanded(!isMinistriesHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors shadow-sm">
                                            <History size={18} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[13px] font-black tracking-widest text-gray-400 group-hover:text-gray-900 dark:text-gray-100 transition-colors">
                                                {t('history_past_ministries', 'Historique / ministères passés')}
                                            </h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={20} className={`text-gray-300 transition-transform duration-500 ${isMinistriesHistoryExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                </button>
                                {isMinistriesHistoryExpanded && (
                                    <div className="mt-4 p-8 text-center bg-white dark:bg-slate-800/20 border border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
                                        <CloudOff size={32} className="mx-auto text-gray-100 mb-3" />
                                        <p className="text-gray-400 text-[11px] font-black tracking-widest italic">{t('no_inactive_found', 'Aucun ministère inactif ou historique trouvé.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div > {/* end scrollable content */}
            </div > {/* end main area */}

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
