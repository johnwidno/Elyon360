import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import RelationshipsList from '../../../components/Admin/Relationships/RelationshipsList';
import OrganizationRolesList from '../../../components/Admin/Relationships/OrganizationRolesList';
import CommunicationModal from '../../../components/Admin/CommunicationModal';
import AttachmentModal from './AttachmentModal';
import MemberCardsList from '../../../components/Admin/Members/MemberCardsList';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/AuthProvider';

// ─── IMAGE URL HELPER ───────────────────────────────────────────────────────
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function MemberProfile() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const noteSectionRef = useRef(null);

    // Status / Modal states
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [updatingPhoto, setUpdatingPhoto] = useState(false);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [baptismalDropdownOpen, setBaptismalDropdownOpen] = useState(false);
    const [allSubtypes, setAllSubtypes] = useState([]);
    const [memberCategories, setMemberCategories] = useState([]);
    const [pendingMemberCategoryId, setPendingMemberCategoryId] = useState(null);

    // History states
    const [history, setHistory] = useState({ statusHistory: [], categoryHistory: [] });
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [pendingCategory, setPendingCategory] = useState(null);
    const [pendingBaptismalStatus, setPendingBaptismalStatus] = useState(null);
    const [categoryDate, setCategoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyNotes, setHistoryNotes] = useState('');
    const [communications, setCommunications] = useState([]);

    // Messaging State
    const [messageModal, setMessageModal] = useState({ isOpen: false, recipient: null, recipients: [], mode: 'individual' });

    // Attachments State
    const [attachments, setAttachments] = useState([]);
    const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
    const [fetchingAttachments, setFetchingAttachments] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Member Alerts (pop-up when opening the profile)
    const [memberAlerts, setMemberAlerts] = useState([]);
    const [showAlertPopup, setShowAlertPopup] = useState(false);
    const [showAddAlertModal, setShowAddAlertModal] = useState(false);
    const [newAlertMessage, setNewAlertMessage] = useState('');

    // Notes system (multi-item, different from résumé)
    const [memberNotes, setMemberNotes] = useState([]);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteForm, setNoteForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
    const [editingNoteId, setEditingNoteId] = useState(null);

    // Actions system
    const [memberActions, setMemberActions] = useState([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionForm, setActionForm] = useState({ type: 'email', description: '', date: new Date().toISOString().split('T')[0] });

    // Donation add/edit modal
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [donationForm, setDonationForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], type: 'Dîme', notes: '' });
    const [editingDonationId, setEditingDonationId] = useState(null);

    const [memberRequests, setMemberRequests] = useState([]);
    const [showPropertiesModal, setShowPropertiesModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    // Password View States
    const [showActualPassword, setShowActualPassword] = useState(false);
    const [passwordCountdown, setPasswordCountdown] = useState(0);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [visibilityCountdown, setVisibilityCountdown] = useState(0);

    // Donations pagination
    const [donationsPage, setDonationsPage] = useState(1);
    const [showAllDonations, setShowAllDonations] = useState(false);

    useEffect(() => {
        let timer;
        if (isCountingDown && passwordCountdown > 0) {
            timer = setInterval(() => {
                setPasswordCountdown(prev => prev - 1);
            }, 1000);
        } else if (passwordCountdown === 0 && isCountingDown) {
            setIsCountingDown(false);
            setShowActualPassword(true);
            setVisibilityCountdown(5);
        } else if (showActualPassword && visibilityCountdown > 0) {
            timer = setInterval(() => {
                setVisibilityCountdown(prev => prev - 1);
            }, 1000);
        } else if (showActualPassword && visibilityCountdown === 0) {
            setShowActualPassword(false);
        }
        return () => clearInterval(timer);
    }, [isCountingDown, passwordCountdown, showActualPassword, visibilityCountdown]);

    // Finance Data for donation form
    const [bankAccounts, setBankAccounts] = useState([]);
    const [churchMembers, setChurchMembers] = useState([]);
    const [supportedCurrencies, setSupportedCurrencies] = useState(['HTG', 'USD']);
    const [donationTypes, setDonationTypes] = useState(['offrande', 'dime', 'don_special', 'promesse']);
    const [paymentMethods, setPaymentMethods] = useState(['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT']);

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const fetchMember = async () => {
        try {
            const res = await api.get(`/members/${id}`);
            setMember(res.data);
            fetchHistory();
            fetchMemberAlerts();
            fetchMemberNotes();
            fetchMemberActions();
            fetchMemberRequests();
        } catch (err) {
            console.error("Error fetching member", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMemberRequests = async () => {
        try {
            const res = await api.get(`/members/${id}/requests`);
            setMemberRequests(res.data || []);
        } catch (err) { /* fail silently */ }
    };

    const fetchMemberNotes = async () => {
        try {
            const res = await api.get(`/members/${id}/notes`);
            setMemberNotes(res.data || []);
        } catch (err) { /* notes endpoint may not exist yet, fail silently */ }
    };

    const updateRequestViewStatus = async (requestId, viewStatus) => {
        try {
            await api.put(`/member-requests/${requestId}`, { viewStatus });
            fetchMemberRequests();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: "Erreur lors de la mise à jour du statut", type: 'error' });
        }
    };

    const fetchMemberActions = async () => {
        try {
            const res = await api.get(`/members/${id}/actions`);
            setMemberActions(res.data || []);
        } catch (err) { /* actions endpoint may not exist yet, fail silently */ }
    };

    const handleSaveNote = async () => {
        try {
            if (editingNoteId) {
                await api.put(`/members/${id}/notes/${editingNoteId}`, noteForm);
            } else {
                await api.post(`/members/${id}/notes`, noteForm);
            }
            setShowNoteModal(false);
            setNoteForm({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
            setEditingNoteId(null);
            fetchMemberNotes();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: t('error_saving_note'), type: 'error' });
        }
    };

    const handleDeleteNote = (noteId) => {
        setConfirmState({
            isOpen: true,
            title: t('delete_note', 'Supprimer la note'),
            message: t('confirm_delete_note', 'Voulez-vous vraiment supprimer cette note ?'),
            onConfirm: async () => {
                try {
                    await api.delete(`/members/${id}/notes/${noteId}`);
                    fetchMemberNotes();
                } catch (err) { console.error(err); }
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleSaveAction = async () => {
        try {
            await api.post(`/members/${id}/actions`, actionForm);
            setShowActionModal(false);
            setActionForm({ type: 'email', description: '', date: new Date().toISOString().split('T')[0] });
            fetchMemberActions();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: 'Erreur sauvegarde action', type: 'error' });
        }
    };

    const handleSaveDonation = async () => {
        try {
            // Validation for deposit
            if (donationForm.isDeposited) {
                if (!donationForm.bankAccountId) {
                    setAlertMessage({ show: true, title: t('error'), message: t('select_bank_account_error', "Veuillez sélectionner un compte bancaire."), type: 'error' });
                    return;
                }
                if (!donationForm.depositDate) {
                    setAlertMessage({ show: true, title: t('error'), message: t('select_date_error', "Veuillez sélectionner la date d'encaissement."), type: 'error' });
                    return;
                }
                if (!donationForm.depositedById) {
                    setAlertMessage({ show: true, title: t('error'), message: t('select_depositor_error', "Veuillez sélectionner la personne qui a effectué le dépôt."), type: 'error' });
                    return;
                }
            }

            const payload = {
                ...donationForm,
                userId: id, // Forced to current member
                amount: parseFloat(donationForm.amount)
            };

            if (editingDonationId) {
                await api.put(`/donations/${editingDonationId}`, payload);
                setAlertMessage({ show: true, title: t('success'), message: t('donation_updated_success', 'Don mis à jour avec succès'), type: 'success' });
            } else {
                await api.post('/donations', payload);
                setAlertMessage({ show: true, title: t('success'), message: t('donation_registered_success', 'Don enregistré avec succès'), type: 'success' });
            }
            setShowDonationModal(false);
            setEditingDonationId(null);
            setDonationForm({
                amount: '',
                currency: supportedCurrencies[0] || 'HTG',
                type: 'offrande',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'CASH',
                notes: '',
                userId: id,
                isDeposited: false,
                bankAccountId: '',
                depositDate: new Date().toISOString().split('T')[0],
                depositedById: ''
            });
            fetchMember();
        } catch (err) {
            console.error("Error saving donation", err);
            setAlertMessage({ show: true, title: t('error'), message: t('registration_error', 'Erreur lors de l’enregistrement'), type: 'error' });
        }
    };

    const fetchMemberAlerts = async () => {
        try {
            const res = await api.get(`/members/${id}/alerts`);
            if (res.data && res.data.length > 0) {
                setMemberAlerts(res.data);
                setShowAlertPopup(true);
                setTimeout(() => setShowAlertPopup(false), 12000);
            }
        } catch (err) {
            console.error('Error fetching member alerts', err);
        }
    };

    const handleAddAlert = async () => {
        if (!newAlertMessage.trim()) return;
        try {
            await api.post(`/members/${id}/alerts`, { message: newAlertMessage });
            setNewAlertMessage('');
            setShowAddAlertModal(false);
            setAlertMessage({ show: true, title: t('success', 'Succès'), message: t('alert_added_success'), type: 'success' });
            fetchMemberAlerts();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: t('error_adding_alert'), type: 'error' });
        }
    };

    const handleDeleteMemberAlert = async (alertId) => {
        try {
            await api.delete(`/members/${id}/alerts/${alertId}`);
            setMemberAlerts(prev => prev.filter(a => a.id !== alertId));
            if (memberAlerts.length <= 1) setShowAlertPopup(false);
        } catch (err) {
            console.error('Error deleting alert', err);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const [historyRes, commsRes] = await Promise.all([
                api.get(`/members/${id}/history`),
                api.get(`/communication/history/${id}`)
            ]);
            setHistory(historyRes.data);
            setCommunications(commsRes.data);
        } catch (err) {
            console.error("Error fetching history", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchAttachments = async () => {
        setFetchingAttachments(true);
        try {
            const res = await api.get(`/attachments/user/${id}`);
            setAttachments(res.data);
        } catch (err) {
            console.error("Error fetching attachments", err);
        } finally {
            setFetchingAttachments(false);
        }
    };

    const handleDeleteAttachment = (attachmentId) => {
        setConfirmState({
            isOpen: true,
            title: t('delete_attachment', 'Supprimer l\'attachement'),
            message: t('confirm_delete_attachment', 'Voulez-vous vraiment supprimer cet attachement ?'),
            onConfirm: async () => {
                try {
                    await api.delete(`/attachments/${attachmentId}`);
                    fetchAttachments();
                } catch (err) {
                    console.error("Error deleting attachment", err);
                    setAlertMessage({ show: true, title: t('error'), message: t('error_delete', 'Erreur lors de la suppression'), type: 'error' });
                }
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    useEffect(() => {
        fetchMember();
        const fetchSubtypes = async () => {
            try {
                const res = await api.get('/contacts/classification/subtypes');
                const filtered = res.data.filter(s => {
                    const typeName = s.type?.name?.toLowerCase().trim();
                    return typeName === 'membre' || typeName === 'member';
                });
                setAllSubtypes(filtered);
            } catch (err) {
                console.error("Error fetching subtypes", err);
            }
        };
        fetchSubtypes();
        const fetchCategories = async () => {
            try {
                const res = await api.get('/member-categories');
                setMemberCategories(res.data);
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };
        fetchCategories();
        fetchAttachments();

        // Fetch Finance Helpers
        const fetchFinanceHelpers = async () => {
            try {
                const [accRes, churchRes, memRes] = await Promise.all([
                    api.get('/bank-accounts'),
                    api.get('/churches/settings'),
                    api.get('/members')
                ]);
                setBankAccounts(accRes.data || []);
                if (churchRes.data?.church) {
                    const church = churchRes.data.church;
                    if (church.supportedCurrencies?.length > 0) setSupportedCurrencies(church.supportedCurrencies);
                    if (church.donationTypes) setDonationTypes(church.donationTypes);
                    if (church.paymentMethods) setPaymentMethods(church.paymentMethods);
                }
                setChurchMembers(memRes.data || []);
            } catch (err) {
                console.warn("Error fetching finance helpers", err);
            }
        };
        fetchFinanceHelpers();
    }, [id]);

    useEffect(() => {
        if (member) {
            setNoteContent(member.notes || '');
        }
    }, [member]);

    const handleSaveSummaryNote = async () => {
        setSavingNote(true);
        try {
            await api.put(`/members/${id}`, { notes: noteContent });
            setIsNoteOpen(false);
            fetchMember();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('error_saving_note'), type: 'error' });
        } finally {
            setSavingNote(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUpdatingPhoto(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                await api.put(`/members/${id}`, { photo: reader.result });
                fetchMember();
            } catch (err) {
                setAlertMessage({ show: true, title: t('error'), message: t('error_updating_photo'), type: 'error' });
            } finally {
                setUpdatingPhoto(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleStatusUpdate = async () => {
        try {
            await api.put(`/members/${id}`, {
                status: pendingStatus,
                statusChangeDate: statusDate,
                historyNotes: historyNotes
            });
            setShowStatusModal(false);
            setHistoryNotes('');
            fetchMember();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('error_updating_status'), type: 'error' });
        }
    };

    const handleTypeUpdate = async () => {
        try {
            const payload = {};
            if (pendingMemberCategoryId) {
                payload.memberCategoryId = pendingMemberCategoryId;
            } else if (pendingCategory) {
                payload.subtypeId = pendingCategory.id;
            } else if (pendingBaptismalStatus) {
                payload.baptismalStatus = pendingBaptismalStatus;
            }
            payload.categoryChangeDate = categoryDate;
            payload.historyNotes = historyNotes;

            await api.put(`/members/${id}`, payload);
            setShowCategoryModal(false);
            setPendingCategory(null);
            setPendingBaptismalStatus(null);
            setPendingMemberCategoryId(null);
            setHistoryNotes('');
            fetchMember();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('error_updating_type'), type: 'error' });
        }
    };

    const handleRequestAccess = async (type) => {
        try {
            await api.post('/member-requests', {
                targetUserId: id,
                requestType: type,
                subject: type === 'password_view' ? 'Request to view password' : 'Request to reset password',
                description: `Member ${user.firstName} ${user.lastName} requested access to ${type} for user ID ${id}`
            });
            setAlertMessage({ show: true, title: t('success'), message: t('request_sent_success', 'Demande envoyée avec succès'), type: 'success' });
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('request_sent_error', 'Erreur lors de l\'envoi de la demande'), type: 'error' });
        }
    };

    const handlePasswordEditMode = () => {
        setShowPasswordModal(true);
    };

    const handlePasswordResetWithRequest = () => {
        setShowPropertiesModal(false);
        const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
        const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
        const hasApprovedReset = memberRequests.some(r => r.requestType === 'password_reset' && r.status === 'approved');

        if (isAdmin || hasApprovedReset) {
            handlePasswordEditMode();
        } else {
            setConfirmState({
                isOpen: true,
                title: t('authorization_required', 'Autorisation requise'),
                message: t('request_password_reset_confirm', 'Vous n\'avez pas l\'autorisation de réinitialiser ce mot de passe. Souhaitez-vous envoyer une demande aux administrateurs ?'),
                onConfirm: () => {
                    handleRequestAccess('password_reset');
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }
            });
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword) return;
        try {
            await api.put(`/members/${id}`, { password: newPassword });
            setAlertMessage({ show: true, title: t('success'), message: t('password_updated_success', 'Mot de passe mis à jour avec succès'), type: 'success' });
            setShowPasswordModal(false);
            setNewPassword('');
            fetchMember();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('password_update_error', 'Erreur lors de la mise à jour du mot de passe'), type: 'error' });
        }
    };

    const DONATIONS_PER_PAGE = 7;
    const totalDonations = member?.donations?.length || 0;
    const totalDonationsPages = Math.ceil(totalDonations / DONATIONS_PER_PAGE);
    const displayedDonations = showAllDonations
        ? (member?.donations || [])
        : (member?.donations || []).slice((donationsPage - 1) * DONATIONS_PER_PAGE, donationsPage * DONATIONS_PER_PAGE);

    const startDonationCount = (donationsPage - 1) * DONATIONS_PER_PAGE + 1;
    const endDonationCount = Math.min(donationsPage * DONATIONS_PER_PAGE, totalDonations);

    if (loading) return <AdminLayout><div className="p-20 text-center font-bold text-gray-400 animate-pulse">{t('loading')}</div></AdminLayout>;
    if (!member) return <AdminLayout><div className="p-20 text-center text-red-500 font-bold">{t('member_not_found')}</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="bg-gradient-to-br from-white via-indigo-50/50 to-white dark:from-indigo-950 dark:via-[#0b1437] dark:to-slate-950 border-b border-gray-100 dark:border-white/5 px-8 pt-8 pb-10 transition-colors">
                <div className="max-w-[1700px] mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 dark:text-indigo-300/60 hover:text-indigo-600 dark:hover:text-white transition-all text-[11px] font-black tracking-widest mb-8 group">
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        {t('back')}
                    </button>

                    <div className="flex flex-col lg:flex-row items-start justify-between gap-10 relative">
                        {/* Left: Avatar + Name + Notes */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 relative z-10 flex-1 w-full lg:w-auto">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                                className="relative group/avatar shrink-0"
                            >
                                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[2.5rem] border-[5px] border-indigo-100 dark:border-indigo-500/20 shadow-2xl shadow-indigo-500/10 overflow-hidden bg-gray-50 dark:bg-slate-800 flex items-center justify-center relative transition-all duration-500 group-hover/avatar:rounded-[2rem] group-hover/avatar:scale-105">
                                    {member?.photo ? (
                                        <img src={getImageUrl(member.photo)} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <div className="text-4xl lg:text-6xl font-black text-indigo-400">
                                            {member?.firstName?.[0]}{member?.lastName?.[0]}
                                        </div>
                                    )}
                                    <div
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
                                        onClick={() => member.photo && setShowPhotoModal(true)}
                                    >
                                        <label
                                            className="cursor-pointer p-3 bg-white rounded-2xl shadow-2xl scale-0 group-hover/avatar:scale-100 transition-transform duration-300 hover:scale-110"
                                            onClick={(e) => e.stopPropagation()}
                                            title={t('change_photo', 'Changer la photo')}
                                        >
                                            <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                        </label>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-2 flex-1 pb-4 lg:pb-0 text-center sm:text-left"
                            >
                                <h3 className="text-[32px] lg:text-[44px] font-black text-gray-900 dark:text-white leading-none tracking-tight">{member?.firstName} {member?.lastName}</h3>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                                    {member?.nickname && (
                                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black text-indigo-600 dark:text-white/80 uppercase tracking-widest border border-indigo-100 dark:border-white/10">
                                            {member.nickname}
                                        </span>
                                    )}
                                    {member?.gender && (
                                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black text-indigo-600 dark:text-white/80 uppercase tracking-widest border border-indigo-100 dark:border-white/10">
                                            {t(member.gender.toLowerCase())}
                                        </span>
                                    )}
                                    {member?.memberCode && (
                                        <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/15 backdrop-blur-md rounded-full text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest border border-indigo-200 dark:border-indigo-500/20">
                                            {member.memberCode}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 max-w-3xl">
                                    {isNoteOpen ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="animate-in fade-in slide-in-from-top-2"
                                        >
                                            <textarea
                                                autoFocus
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                placeholder={t('note_placeholder_summary', 'Entrez une note de synthèse...')}
                                                className="w-full h-24 p-5 bg-white dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl text-[13px] font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 transition-all resize-none shadow-xl"
                                            />
                                            <div className="flex gap-3 justify-end mt-4">
                                                <button
                                                    onClick={() => { setIsNoteOpen(false); setNoteContent(member.notes || ''); }}
                                                    className="px-6 py-2.5 text-[10px] font-black text-gray-400 dark:text-white/40 hover:text-rose-500 dark:hover:text-rose-400 tracking-widest transition-colors uppercase"
                                                >
                                                    {t('cancel')}
                                                </button>
                                                <button
                                                    onClick={handleSaveSummaryNote}
                                                    disabled={savingNote}
                                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95 uppercase"
                                                >
                                                    {savingNote ? '...' : t('save')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : member.notes ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group flex items-start gap-3"
                                        >
                                            <p className="text-[14px] font-medium text-gray-600 dark:text-white/70 leading-relaxed border-l-4 border-indigo-200 dark:border-indigo-500/30 pl-4 py-1">
                                                {member.notes}
                                            </p>
                                            <button
                                                onClick={() => setIsNoteOpen(true)}
                                                className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-white/30 hover:text-indigo-600 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <button
                                            onClick={() => setIsNoteOpen(true)}
                                            className="flex items-center gap-2 text-gray-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white text-[11px] font-black uppercase tracking-widest transition-all pt-1 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 px-4 py-2.5 rounded-full border border-gray-200 dark:border-white/10"
                                        >
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black">+</span>
                                            {t('add_summary_note', 'Ajouter un résumé')}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Détails du membre */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="relative z-20 text-center lg:text-right w-full lg:w-auto"
                        >
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-white/30 mb-5 tracking-[0.2em] uppercase">{t('member_details', 'Détails du membre')}</h3>
                            <div className="space-y-3 bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-xl dark:shadow-2xl">
                                <p className="text-[13px] font-bold text-gray-800 dark:text-white flex flex-col lg:flex-row lg:justify-end items-center gap-1 lg:gap-3">
                                    <span className="text-gray-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('join_date', 'Date Adhésion')}</span>
                                    <span className="font-black text-indigo-600 dark:text-indigo-200">{member.joinDate ? new Date(member.joinDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</span>
                                </p>
                                <div className="h-px bg-gray-100 dark:bg-white/5 w-full"></div>
                                <p className="text-[13px] font-bold text-gray-800 dark:text-white flex flex-col lg:flex-row lg:justify-end items-center gap-1 lg:gap-3">
                                    <span className="text-gray-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('status', 'Statut')}</span>
                                    <span className="flex items-center gap-2">
                                        <span className={`${member.status === 'Inactif' ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'} font-black`}>{t(member.status?.toLowerCase()) || member.status || 'Actif'}</span>
                                        <span className="w-1 h-1 bg-gray-200 dark:bg-white/20 rounded-full"></span>
                                        <span className="text-gray-400 dark:text-white/40 font-black text-[11px]">{member.statusChangeDate ? new Date(member.statusChangeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </span>
                                </p>
                                <div className="h-px bg-white/5 w-full"></div>
                                <p className="text-[13px] font-bold text-gray-800 dark:text-white flex flex-col lg:flex-row lg:justify-end items-center gap-1 lg:gap-3">
                                    <span className="text-gray-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">{t('category', 'Catégorie')}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold underline decoration-indigo-400/20 underline-offset-4">
                                            {member.category?.name || member.contactSubtype?.name || t(member.baptismalStatus?.toLowerCase()) || member.baptismalStatus || t('not_baptized')}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-200 dark:bg-white/20 rounded-full"></span>
                                        <span className="text-gray-400 dark:text-white/40 font-black text-[11px]">{member.categoryChangeDate ? new Date(member.categoryChangeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ACTION TOOLBAR */}
            <div className="px-8 mt-8">
                <div className="max-w-[1700px] mx-auto">
                    <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#0b1437] p-1.5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-premium relative z-30">
                        <button className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            onClick={() => setShowAddAlertModal(true)}
                        >
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {t('add_alert', 'Ajouter une alerte')}
                        </button>

                        <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                        <button
                            onClick={() => navigate(`/admin/members?edit=${member.id}`)}
                            className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            {t('edit')}
                        </button>

                        <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                        <div className="relative">
                            <button
                                onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setTypeDropdownOpen(false); }}
                                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {t('mark_as', 'Marquer comme...')}
                                <svg className={`w-3.5 h-3.5 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {statusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#111c44] rounded-2xl shadow-3xl border border-gray-100 dark:border-white/10 py-3 z-[110] animate-in fade-in slide-in-from-top-1">
                                        {['Actif', 'Inactif', 'Transféré', 'Décédé', 'En déplacement'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setPendingStatus(s); setShowStatusModal(true); setStatusDropdownOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                            >
                                                {t(s.toLowerCase().replace(/ /g, '_')) || s}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                        {/* Changer de catégorie dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setStatusDropdownOpen(false); setBaptismalDropdownOpen(false); }}
                                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                {t('change_type', 'Changer de type/catégorie')}
                                <svg className={`w-3.5 h-3.5 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {typeDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setTypeDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#111c44] rounded-2xl shadow-3xl border border-gray-100 dark:border-white/10 py-3 z-[110] animate-in fade-in slide-in-from-top-1 max-h-[450px] overflow-y-auto noscrollbar">
                                        <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 mb-2">{t('select_category', 'Sélectionner une catégorie')}</p>

                                        {memberCategories.length > 0 ? (
                                            memberCategories.map(mc => (
                                                <button key={mc.id}
                                                    onClick={() => {
                                                        setPendingMemberCategoryId(mc.id);
                                                        setPendingCategory(mc); // Use pendingCategory for name display in modal
                                                        setPendingBaptismalStatus(null);
                                                        setShowCategoryModal(true);
                                                        setTypeDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-[13px] font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-between ${member.memberCategoryId === mc.id ? 'text-indigo-600 bg-indigo-50/30' : 'text-gray-600 dark:text-gray-400'}`}
                                                >
                                                    {mc.name}
                                                    {member.memberCategoryId === mc.id && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-4 py-4 text-[12px] text-gray-400 italic text-center">{t('no_categories_defined', 'Aucune catégorie définie')}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                        <button
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            onClick={() => console.log('Voir la carte du membre clicked')}
                        >
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h2m-2 4h2" />
                            </svg>
                            {t('view_member_card', 'Voir la Carte du membre')}
                        </button>

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                className="w-9 h-9 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-indigo-600 rounded-lg transition-all border border-gray-100 dark:border-white/10"
                            >
                                <MessageIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID - Matched to Image Layout */}
            <div className="px-8 mt-10 pb-32">
                <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN (lg:col-span-7) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Informations personnelles Card */}
                        <Accordion
                            title={t('constituent_summary', 'Informations personnelles')}
                            initialOpen={true}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-[12px] font-bold text-gray-400 mb-4">{t('personal_info', 'Personal info')}</h4>
                                    <div className="space-y-2">
                                        <SummaryItem label={t('constituent_id', 'Membre ID')} value={member.memberCode} />
                                        <SummaryItem label={t('nif_cin_label', 'NIF / CIN')} value={member.nifCin || '-'} />
                                        <SummaryItem label={t('gender', 'Sexe')} value={t(member.gender?.toLowerCase()) || member.gender} />
                                        <SummaryItem label={t('marital_status', 'État Civil')} value={t(member.maritalStatus?.toLowerCase()) || member.maritalStatus} />
                                        <SummaryItem label={t('birth_place', 'Lieu de naissance')} value={member.birthPlace} />
                                        <SummaryItem label={t('date_of_birth', 'Date de naissance')} value={member.birthDate ? new Date(member.birthDate).toLocaleDateString() : null} />
                                        <SummaryItem label={t('age', 'Âge')} value={`${calculateAge(member.birthDate)} ${t('years_old', 'ans')}`} />
                                        <SummaryItem label={t('blood_group', 'Groupe Sanguin')} value={member.bloodGroup || '-'} />
                                        <SummaryItem label={t('join_date', "Date d'adhésion")} value={member.joinDate ? new Date(member.joinDate).toLocaleDateString() : null} />
                                    </div>
                                    <button onClick={() => setShowPropertiesModal(true)} className="text-[12px] font-bold text-stripe-blue mt-6 hover:underline">{t('view_member_properties', 'Voir propriétés du membre')}</button>
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-gray-400 mb-4">{t('name_formats', 'Name formats')}</h4>
                                    <div className="space-y-2">
                                        <SummaryItem label={t('primary_addressee', 'Primary Addressee')} value={`${member.firstName} ${member.lastName}`} />
                                        <SummaryItem label={t('primary_salutation', 'Primary Salutation')} value={member.firstName} />
                                        <SummaryItem label={t('primary_envelope', 'Primary Envelope')} value={`${member.firstName} ${member.lastName}`} />
                                    </div>
                                </div>
                            </div>
                        </Accordion>

                        {/* Notes (multi-item, not résumé) */}
                        <Accordion title={`${t('notes', 'Notes')} ${memberNotes.length}`}>
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <button onClick={() => { setNoteForm({ title: '', date: new Date().toISOString().split('T')[0], description: '' }); setEditingNoteId(null); setShowNoteModal(true); }}
                                        className="text-[11px] font-bold text-stripe-blue hover:underline flex items-center gap-1">
                                        + {t('add_note', 'Ajouter une note')}
                                    </button>
                                </div>
                                {memberNotes.length === 0 ? (
                                    <p className="text-xs font-medium text-gray-400 italic py-4 text-center">{t('none_found', 'Aucun résultat.')}</p>
                                ) : memberNotes.map(note => (
                                    <div key={note.id} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[13px] font-bold text-gray-800 dark:text-white">{note.title}</p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setNoteForm({ title: note.title, date: note.date?.split('T')[0] || '', description: note.description }); setEditingNoteId(note.id); setShowNoteModal(true); }} className="text-indigo-400 hover:text-indigo-600 text-[11px]">✏️</button>
                                                <button onClick={() => handleDeleteNote(note.id)} className="text-rose-400 hover:text-rose-600 text-[11px]">✕</button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 mb-2">{note.date ? new Date(note.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : ''} • {note.addedBy ? `${note.addedBy.firstName} ${note.addedBy.lastName}` : t('system', 'Système')}</p>
                                        <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{note.description}</p>
                                    </div>
                                ))}
                            </div>
                        </Accordion>

                        {/* Actions */}
                        <Accordion title={`${t('actions', 'Actions')} ${memberActions.length > 0 ? memberActions.length : ''}`}>
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <button onClick={() => { setActionForm({ type: 'email', description: '', date: new Date().toISOString().split('T')[0] }); setShowActionModal(true); }}
                                        className="text-[11px] font-bold text-stripe-blue hover:underline flex items-center gap-1">
                                        + {t('add_action', 'Ajouter une action')}
                                    </button>
                                </div>
                                {memberActions.length === 0 ? (
                                    <p className="text-xs font-medium text-gray-400 italic py-4 text-center">{t('none_found', 'Aucun résultat.')}</p>
                                ) : memberActions.map(action => (
                                    <div key={action.id} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm
                                            ${action.type === 'email' ? 'bg-blue-50 text-blue-600' :
                                                action.type === 'phone' ? 'bg-green-50 text-green-600' :
                                                    action.type === 'meeting' ? 'bg-purple-50 text-purple-600' :
                                                        action.type === 'mail' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
                                            {action.type === 'email' ? '✉️' : action.type === 'phone' ? '📞' : action.type === 'meeting' ? '🤝' : action.type === 'mail' ? '📬' : '📌'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200 capitalize">{t(action.type, action.type)}</p>
                                                <span className="text-[10px] text-gray-400">{action.date ? new Date(action.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : ''}</span>
                                            </div>
                                            {action.description && <p className="text-[12px] text-gray-500 leading-snug mt-0.5">{action.description}</p>}
                                            <p className="text-[10px] text-gray-300 mt-1">{action.addedBy ? `${action.addedBy.firstName} ${action.addedBy.lastName}` : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Accordion>
                        {/* Demandes */}
                        <Accordion title={`Demande (${memberRequests.filter(r => r.viewStatus === 'non-vue' || !r.viewStatus).length} non vue, ${memberRequests.filter(r => r.viewStatus === 'suivi-demande').length} suivi demande)`}>
                            <div className="space-y-3">
                                {(memberRequests.length === 0) ? (
                                    <p className="text-xs font-medium text-gray-400 italic py-4 text-center">{t('none_found', 'Aucune demande enregistrée.')}</p>
                                ) : memberRequests.map(req => (
                                    <div key={req.id} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[13px] font-bold text-gray-800 dark:text-white">{req.subject}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${req.viewStatus === 'non-vue' || !req.viewStatus ? 'bg-rose-50 text-rose-600' : req.viewStatus === 'suivi-demande' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                                        {req.viewStatus || 'non-vue'}
                                                    </span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${req.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => updateRequestViewStatus(req.id, 'vue')} title="Marquer comme vue" className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded transition-all text-gray-400 hover:text-green-500">👁️</button>
                                                <button onClick={() => updateRequestViewStatus(req.id, 'suivi-demande')} title="Suivi demande" className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded transition-all text-gray-400 hover:text-amber-500">🔄</button>
                                                <button onClick={() => updateRequestViewStatus(req.id, 'non-vue')} title="Marquer comme non-vue" className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded transition-all text-gray-400 hover:text-rose-500">🚩</button>
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-gray-500">{req.description}</p>
                                        <p className="text-[10px] text-gray-300 mt-2">{req.createdAt ? new Date(req.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </Accordion>


                        <Accordion title={t('relationships', 'Relationships')}>
                            <RelationshipsList memberId={member.id} member={member} isTableView={true} />
                            <div className="mt-8 border-t border-gray-100 dark:border-white/5 pt-6">
                                <OrganizationRolesList memberId={member.id} isTableView={true} />
                            </div>
                        </Accordion>

                        <Accordion title={t('member_cards_history', 'Historique des cartes membre')}>
                            <MemberCardsList memberId={member.id} member={member} />
                        </Accordion>

                    </div>

                    {/* RIGHT COLUMN (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Contact Information Card */}
                        <Accordion
                            title={t('contact_information', 'Contact information')}
                            initialOpen={true}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[12px] font-bold text-gray-400 mb-4 flex items-center justify-between">
                                        {t('addresses', 'Addresses')}
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-600 flex items-center gap-1">Résidence <span className="text-yellow-400">★</span></p>
                                            <p className="text-[13px] text-gray-800 dark:text-gray-200 mt-1">
                                                {[
                                                    member.address,
                                                    member.city,
                                                    member.zipCode,
                                                    member.department,
                                                    member.country
                                                ].filter(Boolean).join(', ') || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <h4 className="text-[12px] font-bold text-gray-400 mt-8 mb-4">{t('email_addresses', 'Email addresses')}</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-600 flex items-center gap-1">{t('primary', 'Primaire')} <span className="text-yellow-400">★</span></p>
                                            <a href={`mailto:${member.email}`} title={t('primary', 'Primaire')} className="text-[13px] text-stripe-blue hover:underline">{member.email || '-'}</a>
                                        </div>
                                        {member.secondaryEmail && (
                                            <div>
                                                <p className="text-[12px] font-bold text-gray-600 flex items-center gap-1">{t('secondary', 'Secondaire')}</p>
                                                <a href={`mailto:${member.secondaryEmail}`} title={t('secondary', 'Secondaire')} className="text-[13px] text-stripe-blue hover:underline">{member.secondaryEmail}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-gray-400 mb-4">{t('phone_numbers', 'Phone numbers')}</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-600">{t('phone', 'Phone')} <span className="text-yellow-400">★</span></p>
                                            <p className="text-[13px] text-gray-800 dark:text-gray-200">{member.phone || '-'}</p>
                                        </div>
                                        {member.secondaryPhone && (
                                            <div>
                                                <p className="text-[12px] font-bold text-gray-600">{t('secondary_phone', 'Téléphone secondaire')}</p>
                                                <p className="text-[13px] text-gray-800 dark:text-gray-200">{member.secondaryPhone}</p>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-[12px] font-bold text-gray-400 mt-8 mb-4">{t('online_presence', 'Online presence')}</h4>
                                    <div className="space-y-3">
                                        {member.facebookUrl && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold">f</div>
                                                <a href={member.facebookUrl} target="_blank" rel="noreferrer" className="text-[13px] text-stripe-blue hover:underline">Facebook</a>
                                            </div>
                                        )}
                                        {member.linkedinUrl && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-[10px] text-white font-bold">in</div>
                                                <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="text-[13px] text-stripe-blue hover:underline">LinkedIn</a>
                                            </div>
                                        )}
                                        {member.instagramUrl && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-pink-600 rounded flex items-center justify-center text-[10px] text-white font-bold">ig</div>
                                                <a href={member.instagramUrl} target="_blank" rel="noreferrer" className="text-[13px] text-stripe-blue hover:underline">Instagram</a>
                                            </div>
                                        )}
                                        {member.tiktokUrl && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] text-white font-bold">tk</div>
                                                <a href={member.tiktokUrl} target="_blank" rel="noreferrer" className="text-[13px] text-stripe-blue hover:underline">TikTok</a>
                                            </div>
                                        )}
                                        {member.websiteUrl && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                </div>
                                                <a href={member.websiteUrl.startsWith('http') ? member.websiteUrl : `https://${member.websiteUrl}`} target="_blank" rel="noreferrer" className="text-[13px] text-stripe-blue hover:underline">{t('website', 'Site web')}</a>
                                            </div>
                                        )}
                                        {(!member.facebookUrl && !member.linkedinUrl && !member.instagramUrl && !member.tiktokUrl && !member.websiteUrl) && (
                                            <p className="text-xs text-gray-400 italic">{t('no_online_presence', 'No online presence found')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Accordion>

                        {/* Coordonnées professionnelles */}
                        <Accordion title={t('work_contacts', 'Coordonnées professionnelles')}>
                            <div className="space-y-4">
                                <SummaryItem label={t('work_address', 'Adresse de travail')} value={member.workAddress} />
                                <SummaryItem label={t('work_email', 'Email professionnel')} value={
                                    member.workEmail
                                        ? <a href={`mailto:${member.workEmail}`} className="text-stripe-blue hover:underline">{member.workEmail}</a>
                                        : null
                                } />
                                <SummaryItem label={t('work_phone', 'Téléphone professionnel')} value={member.workPhone} />
                                {(!member.workAddress && !member.workEmail && !member.workPhone) && (
                                    <p className="text-xs text-gray-400 italic text-center py-4">{t('none_found', 'Aucun résultat.')}</p>
                                )}
                            </div>
                        </Accordion>

                        {/* Contact d'urgence */}
                        <Accordion title={t('emergency_contacts', "Contact d'urgence")}>
                            <div className="space-y-4">
                                <SummaryItem label={t('full_name', 'Nom complet')} value={member.emergencyContact} />
                                <SummaryItem label={t('phone', 'Téléphone')} value={member.emergencyPhone} />
                                <SummaryItem label={t('email', 'Email')} value={member.emergencyEmail} />
                                {!member.emergencyContact && !member.emergencyPhone && !member.emergencyEmail && (
                                    <p className="text-xs text-gray-400 italic text-center py-4">{t('none_found', 'Aucun résultat.')}</p>
                                )}
                            </div>
                        </Accordion>


                        {/* Dîmes (Giving) */}
                        <Accordion title={`${t('tithes', 'Dîmes')} — ${member.donations?.filter(d => (d.type?.toLowerCase() === 'dime' || d.type?.toLowerCase() === 'dîme') && new Date(d.date).getFullYear() === new Date().getFullYear()).length || 0}`}>
                            <div className="space-y-4">
                                <TitheRegulator donations={member.donations || []} />
                            </div>
                        </Accordion>

                        {/* Historique des Dons */}
                        <Accordion title={`${t('donation_history', 'Historique des dons')} ${totalDonations}`}>
                            <div className="overflow-x-auto">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-[11px] font-bold text-gray-500">
                                        {!showAllDonations && totalDonations > 0 ? `Affichage ${startDonationCount}-${endDonationCount} sur ${totalDonations} transactions` : `${totalDonations} transactions`}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {totalDonations > DONATIONS_PER_PAGE && (
                                            <button onClick={() => {
                                                setShowAllDonations(!showAllDonations);
                                                if (!showAllDonations) setDonationsPage(1);
                                            }}
                                                className="text-[11px] font-bold text-stripe-blue hover:underline border border-stripe-blue/20 px-3 py-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 transition-colors">
                                                {showAllDonations ? t('show_less', 'Voir moins') : t('view_all_records', 'Voir tous les records')}
                                            </button>
                                        )}
                                        <button onClick={() => {
                                            setDonationForm({
                                                amount: '',
                                                currency: supportedCurrencies[0] || 'HTG',
                                                type: 'offrande',
                                                date: new Date().toISOString().split('T')[0],
                                                paymentMethod: 'CASH',
                                                notes: '',
                                                userId: id,
                                                isDeposited: false,
                                                bankAccountId: '',
                                                depositDate: new Date().toISOString().split('T')[0],
                                                depositedById: ''
                                            });
                                            setEditingDonationId(null);
                                            setShowDonationModal(true);
                                        }}
                                            className="text-[11px] font-bold text-stripe-blue hover:underline flex items-center gap-1">
                                            + {t('add_donation', 'Ajouter un don')}
                                        </button>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('date', 'Date')}</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('type', 'Type')}</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 text-right">{t('amount', 'Montant')}</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                        {displayedDonations.map(d => (
                                            <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{d.date ? new Date(d.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</td>
                                                <td className="px-4 py-3 text-gray-500">{d.donationType?.name || d.type || '-'}</td>
                                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-white text-right">{parseFloat(d.amount || 0).toLocaleString()} {d.currency}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => {
                                                        setDonationForm({
                                                            amount: d.amount,
                                                            currency: d.currency || 'HTG',
                                                            date: d.date?.split('T')[0] || '',
                                                            type: d.type || 'offrande',
                                                            paymentMethod: d.paymentMethod || 'CASH',
                                                            notes: d.notes || '',
                                                            userId: id,
                                                            isDeposited: !!d.bankAccountId,
                                                            bankAccountId: d.bankAccountId || '',
                                                            depositDate: d.depositDate?.split('T')[0] || d.date?.split('T')[0] || '',
                                                            depositedById: d.depositedById || ''
                                                        });
                                                        setEditingDonationId(d.id);
                                                        setShowDonationModal(true);
                                                    }}
                                                        className="text-[10px] text-indigo-400 hover:text-indigo-600 font-bold">✏️</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!member.donations || member.donations.length === 0) && (
                                            <tr><td colSpan="4" className="py-8 text-center text-xs text-gray-400">{t('no_donations_recorded', 'Aucun don enregistré')}</td></tr>
                                        )}
                                    </tbody>
                                </table>

                                {!showAllDonations && totalDonationsPages > 1 && (
                                    <div className="flex justify-end items-center gap-1.5 mt-4 text-[11px] font-bold">
                                        <button
                                            disabled={donationsPage === 1}
                                            onClick={() => setDonationsPage(prev => Math.max(1, prev - 1))}
                                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            {t('prev', 'Prec.')}
                                        </button>

                                        {[...Array(totalDonationsPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Only show a few pages around the current
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalDonationsPages ||
                                                (pageNum >= donationsPage - 1 && pageNum <= donationsPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setDonationsPage(pageNum)}
                                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${donationsPage === pageNum ? 'bg-stripe-blue text-white shadow-sm' : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === donationsPage - 2 ||
                                                pageNum === donationsPage + 2
                                            ) {
                                                return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                            }
                                            return null;
                                        })}

                                        <button
                                            disabled={donationsPage === totalDonationsPages}
                                            onClick={() => setDonationsPage(prev => Math.min(totalDonationsPages, prev + 1))}
                                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            {t('next', 'Suiv.')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Accordion>

                        {/* Attachments */}
                        <Accordion title={t('attachments', 'Attachments')}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setAttachmentModalOpen(true); }}
                                        className="text-[11px] font-bold text-stripe-blue hover:underline"
                                    >
                                        + {t('add_attachment', 'Add attachment')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {attachments.map(att => {
                                        const BASE_URL = api.defaults.baseURL?.replace('/api', '') || '';
                                        const fileUrl = att.url?.startsWith('http') ? att.url : `${BASE_URL}${att.url}`;

                                        return (
                                            <div key={att.id} className="flex items-center justify-between text-[12px] p-2 hover:bg-gray-50 rounded-lg group">
                                                <div className="flex items-center gap-2">
                                                    <AttachmentIcon type={att.type} fileType={att.fileType} />
                                                    <span className="font-medium text-gray-700">{att.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-600 font-bold transition-all">Voir</a>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch(fileUrl);
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.style.display = 'none';
                                                                a.href = url;

                                                                let filename = att.name || 'attachment';
                                                                const ext = att.url ? att.url.split('.').pop() : '';
                                                                if (ext && !filename.toLowerCase().endsWith(`.${ext.toLowerCase()}`) && ext.length <= 4) {
                                                                    filename += `.${ext}`;
                                                                }
                                                                a.download = filename;

                                                                document.body.appendChild(a);
                                                                a.click();
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (error) {
                                                                console.error("Download failed", error);
                                                                // Fallback to normal download or open if fetch fails
                                                                window.open(fileUrl, '_blank');
                                                            }
                                                        }}
                                                        className="text-indigo-400 hover:text-indigo-600 font-bold transition-all"
                                                    >
                                                        Télécharger
                                                    </button>
                                                    <button onClick={() => handleDeleteAttachment(att.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity">✕</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </Accordion>

                    </div>

                </div>{/* end max-w grid container */}
            </div>{/* end px-8 mt-10 pb-32 */}

            {/* EXTRA ACCORDIONS - full-width below the grid */}
            <div className="px-8 pb-32">
                <div className="max-w-[1700px] mx-auto space-y-6">

                    {/* Historique des communications */}
                    <Accordion title={`${t('communication_history', 'Historique des communications')} ${communications.length > 0 ? communications.length : ''}`}>
                        <div className="overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-12 text-center text-xs font-bold text-gray-400 animate-pulse">{t('loading')}</div>
                            ) : communications.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('date', 'Date')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('type', 'Type')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('subject', 'Sujet')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('sent_by', 'Envoyé par')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                        {communications.map((c, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/2">
                                                <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{c.createdAt ? new Date(c.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</td>
                                                <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">{c.type || 'Email'}</span></td>
                                                <td className="px-6 py-3 text-gray-800 dark:text-white font-medium">{c.title || c.subject || c.message?.substring(0, 60)}</td>
                                                <td className="px-6 py-3 text-gray-500">{c.sender ? `${c.sender.firstName} ${c.sender.lastName}` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center text-xs font-bold text-gray-400">{t('no_communications', 'Aucune communication enregistrée')}</div>
                            )}
                        </div>
                    </Accordion>


                    <Accordion
                        title={t('status_history', 'Historique de statut')}
                    >
                        <div className="overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-12 text-center text-xs font-bold text-gray-400 animate-pulse">{t('loading')}</div>
                            ) : history.statusHistory && history.statusHistory.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('date', 'Date')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('status', 'Statut')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('modified_by', 'Modifié par')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('notes', 'Notes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                        {history.statusHistory.map((h, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-3 text-gray-800 dark:text-gray-300">{new Date(h.changeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</td>
                                                <td className="px-6 py-3 font-bold text-indigo-600">{t(h.status?.toLowerCase().replace(/ /g, '_')) || h.status}</td>
                                                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : '-'}</td>
                                                <td className="px-6 py-3 text-gray-500 italic">{h.notes && h.notes !== 'Status update' ? h.notes : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center text-xs font-bold text-gray-400">{t('no_status_history', 'Aucun historique de statut')}</div>
                            )}
                        </div>
                    </Accordion>

                    <Accordion title={t('category_history', 'Historique de catégorie')}>
                        <div className="overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-12 text-center text-xs font-bold text-gray-400 animate-pulse">{t('loading')}</div>
                            ) : history.categoryHistory && history.categoryHistory.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('date', 'Date')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('category', 'Catégorie')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('modified_by', 'Modifié par')}</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('notes', 'Notes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                        {history.categoryHistory.map((h, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-3 text-gray-800 dark:text-gray-300">{new Date(h.changeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</td>
                                                <td className="px-6 py-3 font-bold text-indigo-600">{h.contactSubtype?.name || h.baptismalStatus || h.memberCategory?.name || t('unknown', 'Inconnu')}</td>
                                                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : '-'}</td>
                                                <td className="px-6 py-3 text-gray-500 italic">{h.notes && !h.notes.includes('update') ? h.notes : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center text-xs font-bold text-gray-400">{t('no_category_history', 'Aucun historique de catégorie')}</div>
                            )}
                        </div>
                    </Accordion>

                    {/* Events & Ceremonies */}
                    <Accordion title={t('events_attended', 'Événements participés')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(member.attendedEvents || []).map(e => (
                                <div key={e.id} className="bg-gray-50/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-black rounded-lg flex items-center justify-center text-blue-600 text-lg font-bold shadow-sm shrink-0">{new Date(e.startDate).getDate()}</div>
                                    <div>
                                        <button
                                            onClick={() => navigate('/admin/events')}
                                            className="text-sm font-bold text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors text-left"
                                        >
                                            {e.title}
                                        </button>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{new Date(e.startDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {(!member.attendedEvents || member.attendedEvents.length === 0) && (
                                <div className="col-span-2 py-8 text-center text-xs text-gray-400">{t('no_participation_recorded', 'Aucune participation enregistrée')}</div>
                            )}
                        </div>
                    </Accordion>

                    <Accordion title={t('ceremonies_attended', 'Cérémonies participées')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(member.attendedCeremonies || []).map(c => (
                                <div key={c.id} className="bg-gray-50/50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-black rounded-lg flex items-center justify-center text-amber-500 text-xl shadow-sm shrink-0">✨</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">{c.name || c.title}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{c.date ? new Date(c.date).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                            ))}
                            {(!member.attendedCeremonies || member.attendedCeremonies.length === 0) && (
                                <div className="col-span-2 py-8 text-center text-xs text-gray-400">{t('no_participation_recorded', 'Aucune participation enregistrée')}</div>
                            )}
                        </div>
                    </Accordion>



                    {/* Groups History */}
                    <Accordion title={t('groups_history', 'Historique des groupes')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/40">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('group_name', 'Groupe')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('type', 'Type')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('role', 'Rôle')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('status', 'Statut')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('join_date', 'Adhésion')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                    {(member.memberGroups || []).map(g => (
                                        <tr key={g.id}>
                                            <td className="px-6 py-3">
                                                <button onClick={() => navigate(`/admin/groups/${g.id}`)} className="font-bold text-indigo-600 hover:underline">{g.name}</button>
                                            </td>
                                            <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{t(g.type?.toLowerCase()) || g.type}</td>
                                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">{g.group_member?.role || 'Membre'}</span></td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${g.group_member?.status === 'active' ? 'bg-green-50 text-green-600' : g.group_member?.status === 'inactive' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                                    }`}>{g.group_member?.status === 'active' ? t('active', 'Actif') : g.group_member?.status === 'inactive' ? t('inactive', 'Inactif') : t('paused', 'En pause')}</span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{g.group_member?.joinedAt ? new Date(g.group_member.joinedAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                    {(!member.memberGroups || member.memberGroups.length === 0) && (
                                        <tr><td colSpan="5" className="py-10 text-center text-xs text-gray-400">{t('no_groups_found', 'Aucun groupe trouvé')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>

                    {/* Sunday School History */}
                    <Accordion title={t('sunday_school_history', 'Historique École Dominicale')}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/40">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('class_name', 'Classe')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('age', 'Âge')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('level', 'Niveau')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('status', 'Statut')}</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400">{t('join_date', 'Adhésion')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                    {(member.sundaySchoolClasses || []).map(cls => (
                                        <tr key={cls.id}>
                                            <td className="px-6 py-3"><button onClick={() => navigate(`/admin/sunday-school/classes/${cls.id}`)} className="font-bold text-indigo-600 hover:underline">{cls.name}</button></td>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{calculateAge(member.birthDate)} {t('years_old', 'ans')}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls.sunday_school_member?.level === 'Actuel' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {cls.sunday_school_member?.level === 'Actuel' ? t('active_members', 'Actuel') : t('non-actuel', 'Non-actuel')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls.sunday_school_member?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {cls.sunday_school_member?.status === 'active' ? t('active', 'Actif') : t('inactive', 'Inactif')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{cls.sunday_school_member?.joinedAt ? new Date(cls.sunday_school_member.joinedAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                    {(!member.sundaySchoolClasses || member.sundaySchoolClasses.length === 0) && (
                                        <tr><td colSpan="5" className="py-10 text-center text-xs text-gray-400">{t('no_sunday_school_classes', "Aucune classe d'école dominicale")}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>

                    {/* ==== MEMBER REQUESTS ==== */}
                    <Accordion title={`${t('member_requests', 'Demandes du membre')} ${memberRequests.length > 0 ? `(${memberRequests.length})` : ''}`}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-xs text-gray-400 font-medium">{t('requests_submitted_by_member', 'Demandes soumises par ce membre')}</p>
                                <button
                                    onClick={() => navigate('/admin/services/requests')}
                                    className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                    {t('manage_all_requests', 'Gérer toutes les demandes')} →
                                </button>
                            </div>
                            {memberRequests.length === 0 ? (
                                <div className="py-12 text-center text-xs font-bold text-gray-400">
                                    {t('no_requests_found', 'Aucune demande trouvée pour ce membre')}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberRequests.map(req => {
                                        const statusColors = {
                                            'non vue': 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
                                            'vue': 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
                                            'traitée': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                                            'suivi approfondi': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
                                        };
                                        const statusLabels = {
                                            'non vue': t('status_not_viewed', 'Non vue'),
                                            'vue': t('status_viewed', 'Vue'),
                                            'traitée': t('status_processed', 'Traitée'),
                                            'suivi approfondi': t('status_follow_up', 'Suivi approfondi'),
                                        };
                                        const typeLabels = {
                                            marriage: t('request_marriage', 'Mariage'),
                                            baptism: t('request_baptism', 'Baptême'),
                                            transfer: t('request_transfer', 'Transfert'),
                                            member_card: t('request_member_card', 'Carte membre'),
                                            support: t('request_support', 'Support'),
                                            ministry: t('request_ministry', 'Ministère'),
                                            info: t('request_info', 'Information'),
                                            reservation: t('request_reservation', 'Réservation'),
                                            meeting: t('request_meeting', 'Réunion'),
                                            other: t('request_other', 'Autre'),
                                        };
                                        return (
                                            <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-black shrink-0 group-hover:scale-110 transition-transform">
                                                        {(req.title || '?')[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-gray-800 dark:text-white">{req.title || t('no_title', 'Sans titre')}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {typeLabels[req.requestType] || req.requestType} &bull; {new Date(req.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {req.internalNote && (
                                                        <span className="hidden sm:block text-[10px] italic text-gray-400 max-w-[150px] truncate" title={req.internalNote}>
                                                            "{req.internalNote}"
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColors[req.status] || 'bg-gray-100 text-gray-500'}`}>
                                                        {statusLabels[req.status] || req.status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Accordion>

                </div>
            </div>

            {/* Status Change Modal */}
            {
                showStatusModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[40px] p-12 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{t('change_status')}</h3>
                            <p className="text-gray-400 font-bold text-xs tracking-widest mb-10">{t('passing_status_to', 'Passage du statut à')}: <span className="text-blue-600">{t(pendingStatus.toLowerCase()) || pendingStatus}</span></p>
                            <div className="space-y-10">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('effective_date')}</label>
                                    <input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} className="w-full px-8 py-5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-black text-[#2B3674] dark:text-white shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('notes')}</label>
                                    <textarea
                                        value={historyNotes}
                                        onChange={(e) => setHistoryNotes(e.target.value)}
                                        placeholder={t('add_note_placeholder', 'Pourquoi ce changement ?')}
                                        className="w-full px-8 py-5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-bold text-[#2B3674] dark:text-white shadow-sm h-32 resize-none"
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button onClick={() => { setShowStatusModal(false); setHistoryNotes(''); }} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t('cancel')}</button>
                                    <button onClick={handleStatusUpdate} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100">{t('confirm')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Category Change Modal (Unified) */}
            {
                showCategoryModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowCategoryModal(false); setPendingCategory(null); setPendingBaptismalStatus(null); }}></div>
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[40px] p-12 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{t('change_category')}</h3>
                            <p className="text-gray-400 font-bold text-xs tracking-widest mb-10">
                                {t('passing_category_to', 'Passage de la catégorie à')}: <span className="text-indigo-600 uppercase font-black">{pendingCategory ? pendingCategory.name : t(pendingBaptismalStatus)}</span>
                            </p>
                            <div className="space-y-10">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('effective_date')}</label>
                                    <input type="date" value={categoryDate} onChange={(e) => setCategoryDate(e.target.value)} className="w-full px-8 py-5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-black text-[#2B3674] dark:text-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('notes')}</label>
                                    <textarea
                                        value={historyNotes}
                                        onChange={(e) => setHistoryNotes(e.target.value)}
                                        placeholder={t('add_note_placeholder', 'Pourquoi ce changement ?')}
                                        className="w-full px-8 py-5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-bold text-[#2B3674] dark:text-white shadow-sm h-32 resize-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button onClick={() => { setShowCategoryModal(false); setPendingCategory(null); setPendingBaptismalStatus(null); setHistoryNotes(''); }} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest transition-colors hover:text-gray-600">{t('cancel')}</button>
                                    <button onClick={handleTypeUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95">{t('confirm')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <CommunicationModal isOpen={messageModal.isOpen} onClose={() => setMessageModal({ ...messageModal, isOpen: false })} recipient={messageModal.recipient} recipients={messageModal.recipients} mode={messageModal.mode} />
            <AttachmentModal isOpen={attachmentModalOpen} onClose={() => setAttachmentModalOpen(false)} onSuccess={fetchAttachments} userId={id} />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
            />

            {
                showPhotoModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 transition-colors"><div className="absolute inset-0 bg-gray-900/95 backdrop-blur-2xl" onClick={() => setShowPhotoModal(false)}></div><div className="relative max-w-4xl max-h-[90vh] shadow-2xl"><button onClick={() => setShowPhotoModal(false)} className="absolute -top-16 right-0 text-white font-black text-xl">✕</button><img src={getImageUrl(member.photo)} className="w-full h-full object-contain rounded-[40px] border border-white/10" alt="Zoom" /></div></div>
                )
            }

            {/* ===== MEMBER ALERT POPUP (auto-dismiss 12s) ===== */}
            {
                showAlertPopup && memberAlerts.length > 0 && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white dark:bg-[#1a1a2e] border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Red top bar */}
                            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-orange-400 animate-pulse" />
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-rose-500 tracking-widest uppercase mb-1">{t('member_alert', 'Alerte membre')}</p>
                                        {memberAlerts.map(a => (
                                            <div key={a.id} className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-[13px] font-semibold text-gray-800 dark:text-white leading-snug">{a.message}</p>
                                                <button onClick={() => handleDeleteMemberAlert(a.id)} className="text-gray-300 hover:text-rose-500 transition-colors shrink-0 text-xs mt-0.5" title={t('delete_alert')}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowAlertPopup(false)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                {/* Auto-dismiss progress bar */}
                                <div className="mt-4 h-0.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-400 rounded-full" style={{ animation: 'shrink 12s linear forwards' }} />
                                </div>
                            </div>
                        </div>
                        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
                    </div>
                )
            }

            {/* ===== ADD ALERT MODAL ===== */}
            {
                showAddAlertModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAddAlertModal(false)} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-10 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('add_alert', 'Ajouter une alerte')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest">{member.firstName} {member.lastName}</p>
                                </div>
                            </div>
                            <textarea
                                autoFocus
                                value={newAlertMessage}
                                onChange={e => setNewAlertMessage(e.target.value)}
                                placeholder={t('alert_message_placeholder', 'Ex: Membre inactif depuis quelques mois, à contacter...')}
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm h-32 resize-none focus:ring-2 focus:ring-rose-500/20 border border-transparent focus:border-rose-200 transition-all"
                            />
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setShowAddAlertModal(false); setNewAlertMessage(''); }} className="flex-1 py-3.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors">{t('cancel')}</button>
                                <button onClick={handleAddAlert} disabled={!newAlertMessage.trim()} className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-40">{t('confirm')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ===== NOTE MODAL (Titre / Date / Description) ===== */}
            {
                showNoteModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowNoteModal(false); setEditingNoteId(null); }} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-10 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{editingNoteId ? t('edit_note', 'Modifier la note') : t('add_note', 'Ajouter une note')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest">{member.firstName} {member.lastName}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('title', 'Titre')}</label>
                                    <input autoFocus type="text" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                                        placeholder={t('note_title_placeholder', 'Ex: Appel de suivi')}
                                        className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('date', 'Date')}</label>
                                    <input type="date" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                                        className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('description', 'Description')}</label>
                                    <textarea value={noteForm.description} onChange={e => setNoteForm({ ...noteForm, description: e.target.value })}
                                        placeholder={t('note_desc_placeholder', 'Détails de la note...')}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm h-28 resize-none focus:ring-2 focus:ring-blue-500/20 border border-transparent focus:border-blue-200 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setShowNoteModal(false); setEditingNoteId(null); }} className="flex-1 py-3.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors">{t('cancel')}</button>
                                <button onClick={handleSaveNote} disabled={!noteForm.title.trim()} className="flex-1 py-3.5 bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-40">{t('confirm')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ===== ACTION MODAL (Type / Date / Description) ===== */}
            {
                showActionModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowActionModal(false)} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-10 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('add_action', 'Ajouter une action')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest">{member.firstName} {member.lastName}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('action_type', "Type d'action")}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'email', label: 'Email', icon: '✉️' },
                                            { key: 'phone', label: t('phone_call', 'Appel tél.'), icon: '📞' },
                                            { key: 'meeting', label: t('meeting', 'Réunion'), icon: '🤝' },
                                            { key: 'mail', label: t('mail', 'Courrier'), icon: '📬' },
                                            { key: 'visit', label: t('visit', 'Visite'), icon: '🏠' },
                                            { key: 'other', label: t('other', 'Autre'), icon: '📌' },
                                        ].map(opt => (
                                            <button key={opt.key} onClick={() => setActionForm({ ...actionForm, type: opt.key })}
                                                className={`py-3 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${actionForm.type === opt.key ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 dark:bg-black/30 text-gray-600 border-gray-100 dark:border-white/5 hover:border-purple-200'}`}>
                                                <span>{opt.icon}</span>
                                                <span>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('date', 'Date')}</label>
                                    <input type="date" value={actionForm.date} onChange={e => setActionForm({ ...actionForm, date: e.target.value })}
                                        className="w-full px-6 py-3.5 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-purple-500/20 border border-transparent focus:border-purple-200 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('description', 'Description')}</label>
                                    <textarea autoFocus value={actionForm.description} onChange={e => setActionForm({ ...actionForm, description: e.target.value })}
                                        placeholder={t('action_desc_placeholder', 'Décrivez l\'action effectuée...')}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm h-24 resize-none focus:ring-2 focus:ring-purple-500/20 border border-transparent focus:border-purple-200 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowActionModal(false)} className="flex-1 py-3.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors">{t('cancel')}</button>
                                <button onClick={handleSaveAction} className="flex-1 py-3.5 bg-purple-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-100 dark:shadow-none transition-all active:scale-95">{t('confirm')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDonationModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowDonationModal(false); setEditingDonationId(null); }} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-10 shadow-2xl w-full max-w-xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex items-center gap-4 mb-8 shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <MoneyIcon />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{editingDonationId ? t('edit_donation', 'Modifier le don') : t('add_donation', 'Ajouter un don')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest">{member.firstName} {member.lastName}</p>
                                </div>
                            </div>

                            <div className="space-y-6 overflow-y-auto noscrollbar pr-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('amount', 'Montant')}</label>
                                        <input autoFocus type="number" step="0.01" value={donationForm.amount} onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-200 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('currency', 'Devise')}</label>
                                        <select value={donationForm.currency} onChange={e => setDonationForm({ ...donationForm, currency: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20">
                                            {supportedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('type', 'Type')}</label>
                                        <select value={donationForm.type} onChange={e => setDonationForm({ ...donationForm, type: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20 capitalize">
                                            {donationTypes.map(t_str => <option key={t_str} value={t_str}>{t_str}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('payment_method', 'Mode de paiement')}</label>
                                        <select value={donationForm.paymentMethod} onChange={e => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20 capitalize">
                                            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('date', 'Date')}</label>
                                    <input type="date" value={donationForm.date} onChange={e => setDonationForm({ ...donationForm, date: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-200 transition-all" />
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-black/30 rounded-[24px] border border-gray-100 dark:border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                                        <input type="checkbox" checked={donationForm.isDeposited} onChange={e => setDonationForm({ ...donationForm, isDeposited: e.target.checked })}
                                            className="w-5 h-5 rounded-lg border-gray-300 dark:border-rose-900/50 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{t('deposited_on_account', 'Dépôt direct sur compte')}</span>
                                    </label>

                                    {donationForm.isDeposited && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('bank_account', 'Compte Bancaire')} <span className="text-rose-500">*</span></label>
                                                <select value={donationForm.bankAccountId} onChange={e => setDonationForm({ ...donationForm, bankAccountId: e.target.value })}
                                                    className="w-full px-6 py-3.5 bg-white dark:bg-black rounded-xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-white/10">
                                                    <option value="">-- {t('select_account', 'Choisir un compte')} --</option>
                                                    {bankAccounts.filter(acc => acc.currency === donationForm.currency).map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('deposit_date_label', 'Date de dépôt')} <span className="text-rose-500">*</span></label>
                                                <input type="date" value={donationForm.depositDate} onChange={e => setDonationForm({ ...donationForm, depositDate: e.target.value })}
                                                    className="w-full px-6 py-3.5 bg-white dark:bg-black rounded-xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-white/10" />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('deposited_by', 'Déposé par')} <span className="text-rose-500">*</span></label>
                                                <select value={donationForm.depositedById} onChange={e => setDonationForm({ ...donationForm, depositedById: e.target.value })}
                                                    className="w-full px-6 py-3.5 bg-white dark:bg-black rounded-xl outline-none text-sm font-bold text-gray-800 dark:text-white shadow-sm border border-gray-100 dark:border-white/10">
                                                    <option value="">-- {t('select_person', 'Choisir une personne')} --</option>
                                                    {churchMembers.map(m => (
                                                        <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 tracking-widest ml-1 mb-2 block">{t('notes', 'Notes')}</label>
                                    <textarea value={donationForm.notes} onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                                        placeholder={t('donation_notes_placeholder', 'Note sur ce don (optionnel)...')}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-[24px] outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm h-24 resize-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-200 transition-all" />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8 shrink-0">
                                <button onClick={() => { setShowDonationModal(false); setEditingDonationId(null); }} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest transition-colors hover:text-gray-600">{t('cancel')}</button>
                                <button onClick={handleSaveDonation} disabled={!donationForm.amount || !donationForm.date} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-40">{t('confirm')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ===== MEMBER PROPERTIES MODAL ===== */}
            {/* Password Update Modal */}
            {
                showPasswordModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-[#0b1437] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                            <button onClick={() => setShowPasswordModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-rose-500 transition-colors">✕</button>

                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">{t('modify_password', 'Modifier le mot de passe')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">{t('new_security_key', 'Nouvelle clé de sécurité')}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 mb-4">{t('new_password', 'Nouveau mot de passe')}</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Ex: Elyon@2026!MB"
                                            className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-black p-5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white transition-all outline-none"
                                        />
                                        <div className="absolute inset-0 rounded-2xl border border-gray-100 dark:border-white/5 pointer-events-none group-focus-within:border-transparent"></div>
                                    </div>
                                    <p className="mt-4 text-[11px] text-gray-400 font-medium leading-relaxed">
                                        {t('password_notice', 'L\'utilisateur sera invité à changer ce mot de passe à sa prochaine connexion.')}
                                    </p>
                                </div>

                                <button
                                    onClick={handlePasswordUpdate}
                                    disabled={!newPassword}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {t('save_new_password', 'Enregistrer le nouveau mot de passe')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showPropertiesModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowPropertiesModal(false)} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[40px] p-12 shadow-2xl w-full max-w-lg border border-gray-100 dark:border-white/10 overflow-hidden animate-in scale-in">
                            <div className="absolute top-0 right-0 p-8">
                                <button onClick={() => setShowPropertiesModal(false)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-black/20 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors">✕</button>
                            </div>

                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-16 h-16 rounded-[24px] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('member_properties', 'Propriétés du membre')}</h3>
                                    <p className="text-[12px] text-gray-400 font-bold tracking-widest uppercase">{member.firstName} {member.lastName}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4 px-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-black text-gray-400 tracking-widest">{t('added_by', 'Ajouté par')}</span>
                                        <span className="text-[16px] font-black text-gray-900 dark:text-gray-100">
                                            {member.registrant ? `${member.registrant.firstName} ${member.registrant.lastName}` : t('system', 'Système')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-2">
                                        <span className="text-[11px] font-black text-gray-400 tracking-widest">{t('date_created', 'Date de création')}</span>
                                        <span className="text-[16px] font-black text-gray-900 dark:text-gray-100">
                                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-2">
                                        <span className="text-[11px] font-black text-gray-400 tracking-widest">{t('time_created', 'Heure de création')}</span>
                                        <span className="text-[16px] font-black text-gray-900 dark:text-gray-100">
                                            {member.createdAt ? new Date(member.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-2">
                                        <span className="text-[11px] font-black text-gray-400 tracking-widest">{t('password', 'Mot de passe')}</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[16px] font-black text-gray-900 dark:text-gray-100 tracking-[0.2em] min-w-[100px]">
                                                    {showActualPassword ? (member.tempPassword || '********') : '********'}
                                                </span>
                                                {showActualPassword && (
                                                    <span className="text-[10px] font-bold text-indigo-500 animate-pulse">
                                                        Masqué dans {visibilityCountdown}s
                                                    </span>
                                                )}
                                            </div>
                                            {!showActualPassword && (
                                                <button
                                                    onClick={() => {
                                                        setPasswordCountdown(10);
                                                        setIsCountingDown(true);
                                                    }}
                                                    disabled={isCountingDown}
                                                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50"
                                                >
                                                    {isCountingDown ? `Attendez ${passwordCountdown}s` : t('view', 'Voir')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePasswordResetWithRequest()}
                                    className="w-full mt-6 py-5 bg-indigo-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    {t('reset_password', 'Réinitialiser le mot de passe')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </AdminLayout >
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[12px] font-medium text-gray-500">{label}</span>
            <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">{value || <span className="text-gray-300 italic">None found.</span>}</span>
        </div>
    );
}

function Accordion({ title, children, initialOpen = false }) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    useEffect(() => { setIsOpen(initialOpen); }, [initialOpen]);
    return (
        <div className="bg-white dark:bg-[#111c44] rounded-lg shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#f8f9fa] dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/30 transition-all border-b border-gray-100 dark:border-white/5"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-gray-700 dark:text-white tracking-tight">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <svg className="w-4 h-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

function TitheRegulator({ donations }) {
    const months = ['Janv', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {months.map((m, idx) => {
                const paid = donations.some(d => (d.type?.toLowerCase() === 'dime' || d.type?.toLowerCase() === 'dîme') && new Date(d.date).getMonth() === idx && new Date(d.date).getFullYear() === currentYear);
                return (
                    <div key={m} className={`p-6 rounded-3xl border-2 transition-all text-center ${paid ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <p className={`text-[10px] font-black tracking-widest mb-3 ${paid ? 'text-green-600' : 'text-gray-400'}`}>{m}</p>
                        <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-colors ${paid ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>{paid ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}</div>
                    </div>
                );
            })}
        </div>
    );
}

const MoneyIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TitheIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GroupsIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const NetworkIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MessageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const CeremonyIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;

function AttachmentIcon({ type, fileType }) {
    if (type === 'link') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
    const ft = fileType?.toLowerCase();
    if (ft === 'pdf') return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 11v4m3-4v4m3-4v4" /></svg>;
    if (['doc', 'docx'].includes(ft)) return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    if (['xls', 'xlsx'].includes(ft)) return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    if (['png', 'jpg', 'jpeg'].includes(ft)) return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
}
