import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import AlertModal from '../../components/ChurchAlertModal';
import { useLanguage } from '../../context/LanguageContext';
import {
    User, Bell, Heart, MessageSquare, LogOut, LayoutDashboard,
    Settings, BookOpen, Users, Building2, Activity,
    Mail, Phone, Edit3, Check, X, Menu, ChevronRight,
    MapPin, FileText, Send, Plus, Calendar, Home, Maximize2, CreditCard, Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import MemberRequests from './MemberRequests';
import MemberCardGeneratorModal from '../../components/Admin/Members/MemberCardGeneratorModal';

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const SIDEBAR_BG = '#1a2035';
const ACTIVE_BG = 'rgba(99,102,241,0.18)';
const ACTIVE_CLR = '#818cf8';
const BORDER_CLR = '#e8eaf0';
const BG_CLR = '#f0f2f8';
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
    return (
        <div
            className={`bg-white rounded-2xl border ${className}`}
            style={{ borderColor: BORDER_CLR, ...style }}
        >
            {children}
        </div>
    );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function PageTitle({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h1 className="font-bold text-gray-900" style={{ fontSize: '24px', letterSpacing: '-0.2px' }}>{title}</h1>
            {subtitle && <p className="text-gray-400 mt-1 text-sm">{subtitle}</p>}
        </div>
    );
}

// ─── ICON CIRCLE ──────────────────────────────────────────────────────────────
function IconCircle({ icon, amber = false }) {
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
                background: amber ? '#fef3c7' : '#eef0f6',
                color: amber ? '#f59e0b' : '#8a94a6'
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
    const { t, language } = useLanguage();
    const [donations, setDonations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editing, setEditing] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile drawer
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // Dropdown for profile
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
    const fetchData = async () => {
        try {
            console.log("MemberHome: Fetching data...");
            const [profRes, donRes, notifRes, postsRes, subRes] = await Promise.all([
                api.get('/members/profile').catch(err => { console.error("Profile fetch error:", err); return { data: null }; }),
                api.get('/donations/my').catch(err => { console.error("Donations fetch error:", err); return { data: [] }; }),
                api.get('/notifications').catch(err => { console.error("Notifications fetch error:", err); return { data: [] }; }),
                api.get('/community-posts').catch(err => { console.error("Posts fetch error:", err); return { data: [] }; }),
                api.get('/contact-subtypes').catch(err => { console.error("Subtypes fetch error:", err); return { data: [] }; })
            ]);

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
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

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
            text: `Don de ${parseFloat(d.amount).toLocaleString()} ${d.currency || 'HTG'} enregistré`,
            date: d.date ? new Date(d.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            badge: 'Don', badgeColor: 'rose'
        })),
        ...notifications.map(n => ({
            id: `notif-${n.id}`,
            timestamp: new Date(n.createdAt).getTime(),
            icon: <Bell size={16} />, amber: false,
            text: n.title,
            date: n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            badge: 'Notif', badgeColor: 'blue'
        }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);

    // ── nav items ──────────────────────────────────────────────────────────────
    const navItems = [
        { id: 'dashboard', label: "Vue d'ensemble", icon: <LayoutDashboard size={15} /> },
        { id: 'profile', label: 'Mon Profil', icon: <User size={15} /> },
        { id: 'activity', label: 'Activité Récente', icon: <Activity size={15} /> },
        { id: 'requests', label: 'Mes Demandes', icon: <FileText size={15} /> },
        { id: 'donations', label: 'Historique des Dons', icon: <Heart size={15} /> },
        { id: 'sunday', label: 'Classes Dominicales', icon: <BookOpen size={15} /> },
        { id: 'groups', label: 'Groupes', icon: <Users size={15} /> },
        { id: 'ministries', label: 'Ministères', icon: <Building2 size={15} /> },
        { id: 'my_card', label: 'Ma Carte Membre', icon: <CreditCard size={15} /> }
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
        <div className="flex flex-col h-full" style={{ background: SIDEBAR_BG }}>
            {/* Logo & Church Info */}
            <div className="px-5 py-6 border-b border-white/5">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-[17px] font-black overflow-hidden bg-white shadow-lg">
                        {profile?.church?.logoUrl ? (
                            <img src={getImageUrl(profile.church.logoUrl)} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                                <span className="font-black text-white">{(profile?.church?.acronym || profile?.church?.name || '✝')[0].toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold text-indigo-400 tracking-[0.15em] mb-1 uppercase">
                            ELYONSYS 360
                        </p>
                        <p className="text-white font-black text-[17px] leading-tight tracking-tight uppercase truncate">
                            {profile?.church?.acronym || 'SIGLE'}
                        </p>
                    </div>
                </div>
                {profile?.church?.name && (
                    <p className="text-white/50 text-[11px] font-medium leading-tight truncate px-1" title={profile.church.name}>
                        {profile.church.name}
                    </p>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto noscrollbar">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/25 px-3 mb-2">Navigation</p>
                <div className="space-y-0.5">
                    {navItems.map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => goTab(item.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                                style={{ background: active ? ACTIVE_BG : 'transparent' }}
                            >
                                <span style={{ color: active ? ACTIVE_CLR : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                                <span className="text-[12.5px] font-medium flex-1 truncate"
                                    style={{ color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)' }}>
                                    {item.label}
                                </span>
                                {item.badge && (
                                    <span className="w-5 h-5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shrink-0">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

        </div >
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: FONT, background: BG_CLR }}>

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
                <div className="flex items-center justify-between px-4 sm:px-6 shrink-0"
                    style={{ height: '56px', background: '#fff', borderBottom: `1px solid ${BORDER_CLR}`, zIndex: 50 }}>
                    <div className="flex items-center gap-3">
                        {/* Hamburger (mobile/tablet) */}
                        <button className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400"
                            onClick={() => setSidebarOpen(true)}>
                            <Menu size={18} />
                        </button>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <LayoutDashboard size={14} className="text-gray-300" />
                            <span className="font-medium text-gray-500 text-[13px]">
                                {navItems.find(n => n.id === activeTab)?.label || 'Espace Membre'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Global Search Button */}
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
                            style={{ color: '#8a94a6' }} title="Recherche globale">
                            <Search size={17} />
                        </button>

                        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
                            style={{ color: '#8a94a6' }} onClick={() => goTab('notifications')}>
                            <Bell size={17} />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />}
                        </button>

                        {/* Profile Dropdown Container */}
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black cursor-pointer overflow-hidden border border-gray-100"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} title={`${profile?.firstName} ${profile?.lastName}`}>
                                {profile?.photo ? (
                                    <img src={getImageUrl(profile.photo)} alt="P" className="w-full h-full object-cover" />
                                ) : initials}
                            </div>

                            {/* Dropdown Menu */}
                            {isProfileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setIsProfileDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                            <p className="font-bold text-gray-900 text-[14px]">
                                                {profile?.firstName} {profile?.lastName}
                                            </p>
                                            <p className="text-gray-500 text-[11px] truncate mt-0.5" title={profile?.email}>
                                                {profile?.email}
                                            </p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => { goTab('profile'); setIsProfileDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors text-[13px] font-medium"
                                            >
                                                <User size={15} />
                                                Mon Profil
                                            </button>
                                            {isStaff && (
                                                <button
                                                    onClick={() => navigate('/admin')}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-colors text-[13px] font-medium"
                                                >
                                                    <LayoutDashboard size={15} />
                                                    Espace Administrateur
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-2 border-t border-gray-100">
                                            <button
                                                onClick={() => { setIsProfileDropdownOpen(false); logout(); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-[13px] font-medium"
                                            >
                                                <LogOut size={15} />
                                                Déconnexion
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1"
                    style={{ background: '#fff', borderTop: `1px solid ${BORDER_CLR}`, height: '58px' }}>
                    {[
                        { id: 'dashboard', icon: <Home size={18} /> },
                        { id: 'activity', icon: <Activity size={18} /> },
                        { id: 'requests', icon: <FileText size={18} /> },
                        { id: 'donations', icon: <Heart size={18} /> },
                        { id: 'notifications', icon: <Bell size={18} />, badge: unreadCount },
                    ].map(item => (
                        <button key={item.id} onClick={() => goTab(item.id)}
                            className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
                            style={{ color: activeTab === item.id ? '#6366f1' : '#9ca3af' }}>
                            {item.icon}
                            {item.badge > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-6">

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* VUE D'ENSEMBLE                                        */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                    {profile?.photo ? (
                                        <img src={getImageUrl(profile.photo)} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="font-bold text-gray-900" style={{ fontSize: '24px' }}>
                                        {t('hello', 'Bonjour')}, {profile ? `${profile.firstName} ${profile.lastName}` : 'Chargement...'} 👋
                                    </h1>
                                    <p className="text-gray-400 text-sm mt-0.5">{t('welcome_member_space', 'Bienvenue dans votre espace membre')}</p>
                                </div>
                                <div className="sm:ml-auto">
                                    <button
                                        onClick={() => setIsPostModalOpen(true)}
                                        title="Publier un message"
                                        className="group flex items-center justify-center w-[54px] h-[54px] rounded-2xl  text-indigo shadow-[0_12px_35px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(99,102,241,0.5)] hover:bg-indigo-150 transition-all duration-300 active:scale-95 border-2 border-transparent hover:border-white/10"
                                    >
                                        <div className="flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                                            <Send size={20} strokeWidth={2.5} />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* ── Dashboard Content (Activity & Notifications) ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Recent Activity */}
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                                        <h4 className="font-black text-[14px] text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                            <Activity size={18} className="text-indigo-500" />
                                            Activité Récente
                                        </h4>
                                        <button onClick={() => goTab('activity')} className="text-indigo-500 text-[11px] font-bold hover:underline">Voir tout</button>
                                    </div>
                                    <div className="space-y-4">
                                        {activityItems.slice(0, 5).map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] font-medium text-gray-700 truncate">{item.text}</p>
                                                    <p className="text-[10px] text-gray-400">{item.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {activityItems.length === 0 && <p className="text-gray-400 text-[12px] italic">Aucune activité</p>}
                                    </div>
                                </Card>

                                {/* Recent Notifications */}
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                                        <h4 className="font-black text-[14px] text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                            <Bell size={18} className="text-amber-500" />
                                            Notifications
                                        </h4>
                                        <button onClick={() => goTab('notifications')} className="text-amber-500 text-[11px] font-bold hover:underline">Voir tout</button>
                                    </div>
                                    <div className="space-y-4">
                                        {notifications.slice(0, 5).map((n, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                                                    <Bell size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] font-medium text-gray-700 truncate">{n.title}</p>
                                                    <p className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && <p className="text-gray-400 text-[12px] italic">Aucune notification</p>}
                                    </div>
                                </Card>
                            </div>

                            {/* ── Community Posts Feed (Mobile: Horizontal Scroll) ── */}
                            <div className="mt-4 sm:hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2">
                                        <MessageSquare size={16} className="text-indigo-500" />
                                        Communauté
                                    </h3>
                                    {communityPosts.length > postsLimit && (
                                        <button onClick={() => setPostsLimit(prev => prev === 5 ? 10 : prev + 10)} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                            {postsLimit === 5 ? 'Voir tout' : 'Voir plus'}
                                        </button>
                                    )}
                                </div>
                                <div className={postsLimit > 5 ? "space-y-4" : "flex gap-4 overflow-x-auto pb-4 snap-x -mx-4 px-4 scrollbar-hide"}>
                                    {communityPosts.filter(p => postFilter === 'all' || p.type === postFilter).slice(0, postsLimit).map(post => {
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
                                                                <p className="text-[12px] font-bold text-gray-900 truncate">{post.author?.firstName} {post.author?.lastName}</p>
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
                                                    <p className="text-[12px] text-gray-600 line-clamp-3 leading-relaxed mb-3">{post.content}</p>
                                                    {post.imageUrl && (
                                                        <div className="relative group h-32 rounded-xl overflow-hidden mb-3 border border-gray-100 cursor-pointer"
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
                                        <p className="text-gray-400 text-sm py-4 italic">Aucune publication</p>
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
                                    <h3 className="font-bold text-gray-800 text-[18px] flex items-center gap-3">
                                        <MessageSquare size={20} className="text-indigo-500" />
                                        Publications de la Communauté
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Filtrer par :</label>
                                        <select
                                            value={postFilter}
                                            onChange={(e) => setPostFilter(e.target.value)}
                                            className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[12px] font-bold text-gray-600 focus:outline-none focus:ring-2 ring-indigo-500/20"
                                        >
                                            <option value="all">Toutes</option>
                                            {POST_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label.split(' ')[1]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {communityPosts.filter(p => postFilter === 'all' || p.type === postFilter).slice(0, postsLimit).map(post => {
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
                                                            <p className="font-black text-[14px] text-gray-900 tracking-tight">{post.author?.firstName} {post.author?.lastName}</p>
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
                                                {post.title && <h3 className="font-bold text-base text-gray-900 mb-2 leading-tight">{post.title}</h3>}
                                                <p className="text-gray-600 text-[13px] whitespace-pre-line mb-4 leading-relaxed line-clamp-4">{post.content}</p>
                                                {post.imageUrl && (
                                                    <div className="relative group rounded-xl overflow-hidden mt-4 bg-gray-50 border border-gray-100 h-48 cursor-pointer"
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
                                            Charger les publications anciennes <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {communityPosts.length === 0 && (
                                    <div className="text-center py-16 bg-white/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><MessageSquare size={24} /></div>
                                        <p className="text-gray-500 text-[14px] font-medium">Aucune publication pour l'instant.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* MON PROFIL                                            */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {
                        activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300 w-full space-y-6">

                                {/* Avatar card with Cover */}
                                <Card className="overflow-hidden p-0 relative border-0 shadow-lg">
                                    {/* Cover Background */}
                                    <div className="h-40 sm:h-52 w-full relative z-0 bg-indigo-900 border-b border-white/10">
                                        {profile?.photo ? (
                                            <>
                                                {/* Blurred background version of photo */}
                                                <img src={getImageUrl(profile.photo)} alt="Cover Blur" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125" crossOrigin="anonymous" />
                                                {/* Overlay to darken and integrate */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-black/20 mix-blend-multiply"></div>
                                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/60 to-transparent"></div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-800 to-[#1a2035]"></div>
                                        )}
                                    </div>

                                    {/* Lower section with info */}
                                    <div className="px-8 pb-8 pt-0 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left relative z-10 -mt-[60px]">
                                        {/* Avatar element */}
                                        <div className="relative group w-[120px] h-[120px] rounded-full flex items-center justify-center text-white font-serif text-[36px] shrink-0 shadow-2xl overflow-hidden cursor-pointer ring-4 ring-white"
                                            style={{ background: '#1a2035' }}>
                                            {profile?.photo ? (
                                                <img src={getImageUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onClick={handlePhotoClick} crossOrigin="anonymous" />
                                            ) : (
                                                <div onClick={() => fileInputRef.current.click()}>{initials}</div>
                                            )}

                                            {/* Overlay pour modifier la photo */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                onClick={() => fileInputRef.current.click()}>
                                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                                    <Edit3 size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </div>

                                        {/* Name + email */}
                                        <div className="flex-1 min-w-0 mt-4 sm:mt-0 sm:pb-2">
                                            <h2 className="font-black text-white text-3xl sm:text-4xl drop-shadow-md tracking-tight mb-1"
                                                style={{ fontFamily: SERIF }}>
                                                {profile ? `${profile.firstName} ${profile.lastName}` : 'Chargement...'}
                                            </h2>
                                            <p className="text-gray-200 text-lg mb-4 drop-shadow-sm font-medium" style={{ fontFamily: FONT }}>
                                                {profile?.email || '...'}
                                            </p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                                                <span className="px-5 py-1.5 rounded-full text-[13px] font-bold border shadow-sm"
                                                    style={{ background: '#fdf3e7', color: '#856404', borderColor: '#f1e5d1' }}>
                                                    Membre {profile?.status || 'actif'}
                                                </span>
                                                {profile?.joinDate && (
                                                    <span className="px-5 py-1.5 rounded-full text-[13px] font-bold border shadow-sm"
                                                        style={{ background: '#fff', color: '#1a2035', borderColor: '#e8eaf0' }}>
                                                        Depuis {new Date(profile.joinDate).getFullYear()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Edit button */}
                                        {!editing && (
                                            <div className="sm:ml-auto">
                                                <button onClick={() => setEditing(true)}
                                                    className="flex items-center gap-2 px-6 py-2.5 border rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all hover:shadow-sm"
                                                    style={{ borderColor: BORDER_CLR }}>
                                                    <Edit3 size={15} /> Modifier
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Info card */}
                                <Card className="p-10">
                                    <h3 className="font-bold text-[#1a2035] mb-8"
                                        style={{ fontSize: '20px', fontFamily: SERIF }}>
                                        Informations Personnelles
                                    </h3>

                                    {/* Removed roles/status badges section per user request */}

                                    {editing ? (
                                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                {[
                                                    { label: 'Prénom', key: 'firstName' },
                                                    { label: 'Nom', key: 'lastName' },
                                                    { label: 'SousNom (Surnom)', key: 'nickname' },
                                                    { label: 'Sexe', key: 'gender' },
                                                    { label: 'Lieu de naissance', key: 'birthPlace' },
                                                    { label: 'Statut', key: 'status' },
                                                    { label: 'Statut matrimonial', key: 'maritalStatus' },
                                                    { label: 'Nom conjoint', key: 'spouseName' },
                                                    { label: 'Email', key: 'email', type: 'email' },
                                                    { label: 'Téléphone', key: 'phone' },
                                                    { label: 'Adresse', key: 'address' },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{f.label}</label>
                                                        <input type={f.type || 'text'} value={formData[f.key] || ''}
                                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                            className="w-full px-5 py-3.5 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                                            style={{ borderColor: BORDER_CLR }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 pt-4 max-w-sm">
                                                <button type="button" onClick={() => setEditing(false)}
                                                    className="flex-1 py-3 border rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: BORDER_CLR }}>
                                                    Annuler
                                                </button>
                                                <button type="submit" disabled={savingProfile}
                                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95"
                                                    style={{ background: '#1a2035' }}>
                                                    {savingProfile ? '...' : 'Enregistrer'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                                            {[
                                                { label: 'Surnom', value: profile?.nickname },
                                                { label: 'Sexe', value: profile?.gender === 'M' ? 'Masculin' : (profile?.gender === 'F' ? 'Féminin' : profile?.gender) },
                                                { label: 'Lieu de naissance', value: profile?.birthPlace },
                                                { label: 'Statut', value: profile?.status },
                                                { label: 'Statut matrimonial', value: profile?.maritalStatus },
                                                profile?.maritalStatus?.toLowerCase().includes('marié') && { label: 'Nom conjoint', value: profile?.spouseName },
                                                { label: 'Catégorie de membre', value: profile?.contactSubtype?.name || 'Membre' },
                                                { label: 'Téléphone', value: profile?.phone },
                                                { label: 'Email', value: profile?.email },
                                                { label: 'Adresse', value: [profile?.address, profile?.city].filter(Boolean).join(', ') || '–' },
                                                { label: 'Date de naissance', value: profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–' },
                                                { label: 'Date d\'adhésion', value: profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '–' },
                                                { label: 'Code membre', value: profile?.memberCode || '–' },
                                            ].filter(Boolean).map((item, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8a94a6]">{item.label}</p>
                                                    <p className="text-[15px] font-medium text-[#1a2035]" style={{ fontFamily: FONT }}>
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
                            <PageTitle title="Activité Récente" />
                            <div className="space-y-3 w-full">
                                {activityItems.length === 0 ? (
                                    <Card className="p-12 text-center text-gray-400">
                                        <Activity size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p>Aucune activité récente</p>
                                    </Card>
                                ) : (
                                    activityItems.map((item, i) => (
                                        <RowCard key={i}
                                            left={<IconCircle icon={item.icon} amber={item.amber} />}
                                            center={
                                                <>
                                                    <p className="text-gray-800 font-medium text-[13px]">{item.text}</p>
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
                    {/* MES DEMANDES                                          */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {
                        activeTab === 'requests' && (
                            <div className="animate-in fade-in duration-300 w-full">
                                <PageTitle title="Mes Demandes" />
                                {/* Use MemberRequests component but wrap the list items in our style */}
                                <MemberRequests renderMode="cards" />
                            </div>
                        )
                    }

                    {/* ══════════════════════════════════════════════════════ */}
                    {/* MA CARTE MEMBRE                                     */}
                    {/* ══════════════════════════════════════════════════════ */}
                    {activeTab === 'my_card' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col items-center">
                            <PageTitle
                                title="Ma Carte Membre"
                                subtitle="Votre identification officielle au sein de la communauté."
                            />

                            {!activeCard ? (
                                <Card className="w-full max-w-2xl p-16 text-center border-dashed border-2 flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                        <CreditCard size={40} />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-gray-900 font-black text-lg">Aucune carte active</p>
                                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                                            Votre carte de membre n'a pas encore été générée ou est en attente d'activation. Si vous n'en avez jamais fait la demande, vous pouvez le faire maintenant.
                                        </p>
                                        <div className="pt-4 border-t border-gray-100 flex justify-center">
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_new', 'Demande de Nouvelle Carte Membre')}
                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Effectuer une demande de carte
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="w-full max-w-4xl space-y-12 pb-12">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 text-[13px] font-medium shadow-sm">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                            <Settings size={18} className="text-amber-600" />
                                        </div>
                                        <span>Cette carte est votre document d'identité officiel. Notez qu'elle ne peut pas être modifiée par l'utilisateur.</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 place-items-center relative">
                                        {/* RECTO */}
                                        <div className="space-y-4 w-full flex flex-col items-center">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Côté Recto</p>
                                            <div
                                                className="shadow-2xl shadow-indigo-200/50 rounded-xl overflow-hidden ring-1 ring-black/5 cursor-zoom-in group relative transition-transform hover:-translate-y-1"
                                                onClick={() => setCardZoomSide('front')}
                                            >
                                                <CardDisplay card={activeCard} side="front" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 p-3 rounded-full shadow-lg backdrop-blur-sm">
                                                        <Maximize2 size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VERSO */}
                                        <div className="space-y-4 w-full flex flex-col items-center">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Côté Verso</p>
                                            <div
                                                className="shadow-2xl shadow-indigo-200/50 rounded-xl overflow-hidden ring-1 ring-black/5 cursor-zoom-in group relative transition-transform hover:-translate-y-1"
                                                onClick={() => setCardZoomSide('back')}
                                            >
                                                <CardDisplay card={activeCard} side="back" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 p-3 rounded-full shadow-lg backdrop-blur-sm">
                                                        <Maximize2 size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 pt-8">
                                        <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[12px] font-black tracking-widest uppercase border border-indigo-100">
                                            Statut de la carte: {activeCard.status}
                                        </div>
                                        <p className="text-gray-400 text-[11px] font-medium italic">Identification Member ID: {activeCard.cardNumber}</p>

                                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_lost', 'Déclaration de Carte Perdue')}
                                                className="px-4 py-2 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                J'ai perdu ma carte
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_stolen', 'Déclaration de Carte Volée')}
                                                className="px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                On a volé ma carte
                                            </button>
                                            <button
                                                onClick={() => handleQuickCardRequest('member_card_defective', 'Déclaration de Carte Défectueuse')}
                                                className="px-4 py-2 border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
                                            >
                                                Ma carte est défectueuse
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
                                <PageTitle title="Historique des Dons" />
                                <Card className="px-4 py-3 text-right shrink-0 ml-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                        Total {new Date().getFullYear()}
                                    </p>
                                    <p className="font-bold text-gray-900 mt-0.5" style={{ fontSize: '18px' }}>
                                        {displayTotal}
                                    </p>
                                </Card>
                            </div>

                            <div className="space-y-3">
                                {donations.length === 0 ? (
                                    <Card className="p-12 text-center">
                                        <Heart size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm">Aucun don enregistré</p>
                                    </Card>
                                ) : donations.map(d => (
                                    <RowCard key={d.id}
                                        left={<IconCircle icon={<Heart size={16} />} amber />}
                                        center={
                                            <>
                                                <p className="text-gray-800 font-medium text-[13px]">{d.type || 'Don'}</p>
                                                <p className="text-gray-400 text-[11px] mt-0.5">
                                                    {d.date ? new Date(d.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                    {d.paymentMethod && <> · {d.paymentMethod}</>}
                                                </p>
                                            </>
                                        }
                                        right={
                                            <p className="font-bold text-gray-900 text-[15px]">
                                                {parseFloat(d.amount).toLocaleString(locale)} {d.currency || 'HTG'}
                                            </p>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <PageTitle title="Notifications"
                                subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'} />
                            <div className="space-y-3">
                                {notifications.length === 0 ? (
                                    <Card className="p-12 text-center">
                                        <Bell size={36} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm">Aucune notification</p>
                                    </Card>
                                ) : notifications.map(n => (
                                    <RowCard key={n.id}
                                        left={<IconCircle icon={<Bell size={16} />} amber={!n.isRead} />}
                                        center={
                                            <>
                                                <p className="text-gray-800 font-medium text-[13px]">{n.title}</p>
                                                <p className="text-gray-400 text-[11px] mt-0.5">
                                                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                                </p>
                                                {n.message && <p className="text-gray-500 text-[12px] mt-1">{n.message}</p>}
                                            </>
                                        }
                                        right={!n.isRead ? <span className="w-2 h-2 rounded-full bg-amber-500 block" /> : null}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sunday' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <PageTitle title="Classes Dominicales" />
                            {!profile?.sundaySchoolClasses || profile.sundaySchoolClasses.length === 0 ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <BookOpen size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>Vous n'êtes inscrit à aucune classe dominicale.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profile.sundaySchoolClasses.map(cls => (
                                        <Card key={cls.id} className="p-5 flex flex-col hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                                                <BookOpen size={20} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-1">{cls.name}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2">{cls.description || 'Pas de description.'}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <PageTitle title="Groupes" />
                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type !== 'ministry').length === 0) ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <Users size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>Vous n'êtes membre d'aucun groupe.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profile.memberGroups.filter(g => g.type !== 'ministry').map(g => (
                                        <Card key={g.id} className="p-5 flex flex-col hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center mb-4">
                                                <Users size={20} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-1">{g.name}</h4>
                                            <p className="text-[11px] text-gray-400 uppercase font-black tracking-wider mb-2">{g.type || 'Groupe'}</p>
                                            <p className="text-sm text-gray-500 line-clamp-2">{g.description || 'Pas de description.'}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'ministries' && (
                        <div className="animate-in fade-in duration-300 w-full">
                            <PageTitle title="Ministères" />
                            {(!profile?.memberGroups || profile.memberGroups.filter(g => g.type === 'ministry').length === 0) ? (
                                <Card className="p-12 text-center text-gray-400">
                                    <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
                                    <p>Vous ne faites partie d'aucun ministère.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profile.memberGroups.filter(g => g.type === 'ministry').map(m => (
                                        <Card key={m.id} className="p-5 flex flex-col hover:border-indigo-200 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                                                <Building2 size={20} />
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-1">{m.name}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-2">{m.description || 'Pas de description.'}</p>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div> {/* end scrollable content */}
            </div> {/* end main area */}

            {/* ── CREATE POST MODAL (Professional Version) ── */}
            {
                isPostModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                        <Card className="w-full max-w-2xl bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 rounded-[2.5rem] border-0">
                            <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                            {editingPostId ? <Edit3 size={20} /> : <MessageSquare size={20} />}
                                        </span>
                                        {editingPostId ? 'Modifier la Publication' : 'Nouvelle Publication'}
                                    </h2>
                                    <p className="text-gray-400 text-[12px] font-medium mt-1 ml-13 italic">Partagez avec votre communauté</p>
                                </div>
                                <button onClick={() => { setIsPostModalOpen(false); setEditingPostId(null); }} className="p-3 rounded-2xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900 active:scale-90">
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handlePostSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Catégorie de post</label>
                                        <select
                                            value={newPost.type}
                                            onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none text-[13px] font-bold text-gray-700 transition-all appearance-none cursor-pointer"
                                        >
                                            {POST_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2 col-span-1 sm:col-span-2">
                                        <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Visible pour (Destinataire)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'church', targetSubtypeId: '' })}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newPost.visibilityScope === 'church' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-100'}`}
                                            >
                                                <Users size={18} className={newPost.visibilityScope === 'church' ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span className={`text-[11px] font-bold ${newPost.visibilityScope === 'church' ? 'text-indigo-700' : 'text-gray-500'}`}>Toute l'Église</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'global', targetSubtypeId: '' })}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newPost.visibilityScope === 'global' ? 'border-amber-600 bg-amber-50/50' : 'border-gray-100 hover:border-amber-100'}`}
                                            >
                                                <Home size={18} className={newPost.visibilityScope === 'global' ? 'text-amber-600' : 'text-gray-400'} />
                                                <span className={`text-[11px] font-bold ${newPost.visibilityScope === 'global' ? 'text-amber-700' : 'text-gray-500'}`}>Tout Elyon360</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, visibilityScope: 'subtype' })}
                                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newPost.visibilityScope === 'subtype' ? 'border-violet-600 bg-violet-50/50' : 'border-gray-100 hover:border-violet-100'}`}
                                            >
                                                <Activity size={18} className={newPost.visibilityScope === 'subtype' ? 'text-violet-600' : 'text-gray-400'} />
                                                <span className={`text-[11px] font-bold ${newPost.visibilityScope === 'subtype' ? 'text-violet-700' : 'text-gray-500'}`}>Cible précise</span>
                                            </button>
                                        </div>

                                        {newPost.visibilityScope === 'subtype' && (
                                            <select
                                                value={newPost.targetSubtypeId}
                                                onChange={e => setNewPost({ ...newPost, targetSubtypeId: e.target.value })}
                                                className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none text-[13px] font-bold text-gray-700 transition-all appearance-none cursor-pointer animate-in slide-in-from-top-2 duration-300"
                                            >
                                                <option value="">Sélectionner une catégorie...</option>
                                                {subtypes.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Titre (Optionnel)</label>
                                    <input
                                        type="text"
                                        placeholder="Donnez un titre percutant..."
                                        value={newPost.title}
                                        onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none focus:ring-4 ring-indigo-500/5 transition-all text-[14px] font-medium text-gray-800 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">Votre Message</label>
                                    <textarea
                                        placeholder="Que souhaitez-vous dire aujourd'hui ?"
                                        value={newPost.content}
                                        onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                        required
                                        className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none focus:ring-4 ring-indigo-500/5 transition-all text-[14px] font-medium min-h-[160px] resize-none text-gray-800 placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-gray-50">
                                    <label className="cursor-pointer group w-full sm:w-auto">
                                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-[12px] uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border-2 border-indigo-100/50 shadow-sm shadow-indigo-100/20">
                                            <Plus size={20} />
                                            {newPost.imageFile ? 'Changer l\'image' : 'Ajouter une Photo'}
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
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <><Send size={20} /> {editingPostId ? '' : ''}</>
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
            {cardRequestModal.show && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500"></div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2 leading-tight">{cardRequestModal.desc}</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">
                            {cardRequestModal.type === 'member_card_new'
                                ? "Souhaitez-vous ajouter une remarque ? (Optionnel)"
                                : "Veuillez fournir une raison justifiable pour cette déclaration s'il vous plaît (Obligatoire)."}
                        </p>

                        <div className="mb-8">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Explications supplémentaires <span className={cardRequestModal.type !== 'member_card_new' ? 'text-rose-500' : ''}>{cardRequestModal.type !== 'member_card_new' ? '*' : '(Optionnel)'}</span></label>
                            <textarea
                                value={cardRequestModal.reason}
                                onChange={(e) => setCardRequestModal({ ...cardRequestModal, reason: e.target.value })}
                                placeholder={cardRequestModal.type === 'member_card_new' ? "Remarque additionnelle..." : "Indiquez les circonstances justificatives (ex: perdue le 15, rayée)..."}
                                rows="4"
                                className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none resize-none transition-all ${cardRequestModal.type !== 'member_card_new' && !cardRequestModal.reason.trim() ? 'border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 bg-rose-50/30' : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 focus:shadow-lg focus:shadow-indigo-500/10'}`}
                            ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCardRequestModal({ show: false, type: '', desc: '', reason: '' })}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmCardRequest}
                                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Send size={16} /> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            {cardZoomSide && activeCard && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setCardZoomSide(null)}
                >
                    <button className="absolute top-6 right-6 text-white/50 hover:text-white active:scale-95 transition-all bg-white/10 p-3 rounded-full hover:bg-white/20">
                        <X size={24} />
                    </button>

                    <p className="text-white/50 text-[11px] font-black uppercase tracking-[0.3em] mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                        {cardZoomSide === 'front' ? 'Vue Détaillée Recto' : 'Vue Détaillée Verso'}
                    </p>

                    <div
                        className="shadow-2xl shadow-indigo-500/20 rounded-2xl overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-500"
                        onClick={(e) => e.stopPropagation()} // Prevent clicking the card itself from closing
                        style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}
                    >
                        <CardDisplay card={activeCard} side={cardZoomSide} />
                    </div>

                    <p className="text-white/30 text-[10px] font-medium mt-16 animate-in fade-in duration-700 delay-300">
                        Cliquez n'importe où pour fermer
                    </p>
                </div>
            )}

            {/* Menu de Changement de Rôle (si Admin/Secrétaire présent dans les rôles) */}
            {
                authUser?.role && Array.isArray(authUser.role) && authUser.role.length > 1 && (
                    <div className="fixed bottom-6 right-6 z-40">
                        <div className="group relative">
                            <button className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 overflow-hidden">
                                {profile?.church?.logoUrl ? (
                                    <img src={getImageUrl(profile.church.logoUrl)} alt="L" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Users size={24} />
                                )}
                            </button>
                            <div className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                                        <Building2 size={12} className="text-indigo-600" />
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Espaces de travail</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    {authUser.role.map(r => (
                                        <button key={r} onClick={() => window.location.href = (r === 'member' ? '/member' : '/admin')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${r === 'member' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                                                {r === 'member' ? <User size={14} /> : <Settings size={14} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] leading-tight capitalize">Connecté comme {r}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Cliquez pour basculer</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
