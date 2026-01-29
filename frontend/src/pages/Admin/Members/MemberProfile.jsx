import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import RelationshipsList from '../../../components/Admin/Relationships/RelationshipsList';
import OrganizationRolesList from '../../../components/Admin/Relationships/OrganizationRolesList';
import CommunicationModal from '../../../components/Admin/CommunicationModal';
import AttachmentModal from './AttachmentModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function MemberProfile() {
    const { t, language } = useLanguage();
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
            console.log('Member data:', res.data);
            console.log('Sunday School Classes:', res.data.sundaySchoolClasses);
            setMember(res.data);
            fetchHistory();
        } catch (err) {
            console.error("Error fetching member", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
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

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm(t('confirm_delete_attachment', 'Voulez-vous vraiment supprimer cet attachement ?'))) return;
        try {
            await api.delete(`/attachments/${attachmentId}`);
            fetchAttachments();
        } catch (err) {
            console.error("Error deleting attachment", err);
            alert(t('error_delete', 'Erreur lors de la suppression'));
        }
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
    }, [id]);

    useEffect(() => {
        if (member) {
            setNoteContent(member.notes || '');
        }
    }, [member]);

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await api.put(`/members/${id}`, { notes: noteContent });
            setIsNoteOpen(false);
            fetchMember();
        } catch (err) {
            alert(t('error_saving_note'));
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
                alert(t('error_updating_photo'));
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
            alert(t('error_updating_status'));
        }
    };

    const handleTypeUpdate = async () => {
        try {
            const payload = {};
            if (pendingCategory) {
                payload.subtypeId = pendingCategory.id;
            } else if (pendingBaptismalStatus) {
                payload.baptismalStatus = pendingBaptismalStatus;
            } else if (pendingMemberCategoryId) {
                payload.memberCategoryId = pendingMemberCategoryId;
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
            alert(t('error_updating_type'));
        }
    };

    if (loading) return <AdminLayout><div className="p-20 text-center font-bold text-gray-400 animate-pulse">{t('loading')}</div></AdminLayout>;
    if (!member) return <AdminLayout><div className="p-20 text-center text-red-500 font-bold">{t('member_not_found')}</div></AdminLayout>;

    return (
        <AdminLayout>
            {/* CLEAN CRM HEADER */}
            <div className="bg-white dark:bg-[#0b1437] border-b border-gray-100 dark:border-white/5 px-8 pt-4 pb-6">
                <div className="max-w-[1600px] mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all text-[11px] font-black tracking-widest mb-6 group">
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        {t('back')}
                    </button>

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-10">
                            <div className="relative group/avatar">
                                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-[#111c44] shadow-xl overflow-hidden bg-gray-50 dark:bg-black/40 flex items-center justify-center shrink-0 relative transition-transform duration-500 group-hover/avatar:scale-105">
                                    {member.photo ? <img src={member.photo} className="w-full h-full object-cover" alt="Profile" /> : <div className="text-4xl font-black text-indigo-400">{member.firstName[0]}{member.lastName[0]}</div>}
                                    <div
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in"
                                        onClick={() => member.photo && setShowPhotoModal(true)}
                                    >
                                        <label
                                            className="cursor-pointer p-2.5 bg-white rounded-xl shadow-2xl scale-0 group-hover/avatar:scale-100 transition-transform duration-300 hover:scale-110"
                                            onClick={(e) => e.stopPropagation()}
                                            title={t('change_photo', 'Changer la photo')}
                                        >
                                            <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-[24px] font-black text-[#2B3674] dark:text-white leading-none tracking-tight">{member.firstName} {member.lastName}</h3>
                                {member.nickname && <p className="text-sm font-bold text-gray-400 ml-1">Nickname : <span className="text-indigo-600">{member.nickname}</span></p>}
                                {member.spouseName && (
                                    <p className="text-sm font-bold text-gray-400 ml-1">
                                        {member.gender?.toLowerCase() === 'homme' ? 'Conjointe' : 'Conjoint'} : <span className="text-indigo-600">{member.spouseName}</span>
                                    </p>
                                )}

                                <div className="pt-3 max-w-3xl">
                                    {isNoteOpen ? (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <textarea
                                                autoFocus
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                placeholder={t('note_placeholder_summary', 'Entrez une note de synthèse...')}
                                                className="w-full h-24 p-4 bg-gray-50 dark:bg-black/40 rounded-xl text-[13px] font-bold text-[#2B3674] dark:text-white outline-none border-2 border-indigo-500/30 focus:border-indigo-500 transition-all resize-none shadow-inner"
                                            />
                                            <div className="flex gap-3 justify-end mt-2">
                                                <button
                                                    onClick={() => { setIsNoteOpen(false); setNoteContent(member.notes || ''); }}
                                                    className="px-4 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                                                >
                                                    {t('cancel')}
                                                </button>
                                                <button
                                                    onClick={handleSaveNote}
                                                    disabled={savingNote}
                                                    className="px-5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 transition-all"
                                                >
                                                    {savingNote ? '...' : t('save')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : member.notes ? (
                                        <div className="group flex items-start gap-3 animate-in fade-in">
                                            <p className="text-[13px] font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                                                "{member.notes}"
                                            </p>
                                            <button
                                                onClick={() => setIsNoteOpen(true)}
                                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsNoteOpen(true)}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold transition-all pt-1 opacity-80 hover:opacity-100 lg:ml-1"
                                        >
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black">+</span>
                                            {t('add_summary_note', 'Ajouter un résumé')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Right: Détails du membre (Refined labels) */}
                        <div className="text-right">
                            <h3 className="text-[12px] font-black text-gray-400 dark:text-gray-500 mb-4 tracking-[0.2em] uppercase">{t('member_details', 'Détails du membre')}</h3>
                            <div className="space-y-2">
                                <p className="text-[14px] font-bold text-gray-800 dark:text-gray-300 flex justify-end items-center gap-3">
                                    <span className="text-gray-400 text-[11px] uppercase tracking-wider">{t('join_date', 'Date Adhésion')} :</span>
                                    <span className="font-black">{member.joinDate ? new Date(member.joinDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}</span>
                                </p>
                                <p className="text-[14px] font-bold text-gray-800 dark:text-gray-300 flex justify-end items-center gap-3">
                                    <span className="text-gray-400 text-[11px] uppercase tracking-wider">{t('status', 'Statut')} :</span>
                                    <span>
                                        <span className={`${member.status === 'Inactif' ? 'text-red-500' : 'text-green-600'} mr-2`}>{t(member.status?.toLowerCase()) || member.status || 'Actif'}</span>
                                        <span className="text-gray-300 font-black text-[12px]">{member.statusChangeDate ? new Date(member.statusChangeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </span>
                                </p>
                                <p className="text-[14px] font-bold text-gray-800 dark:text-gray-300 flex justify-end items-center gap-3">
                                    <span className="text-gray-400 text-[11px] uppercase tracking-wider">{t('category', 'Catégorie')} :</span>
                                    <span>
                                        <span className="text-indigo-600 decoration-indigo-200/50 underline-offset-4 mr-2">{member.contactSubtype?.name || member.category?.name || t(member.baptismalStatus?.toLowerCase()) || member.baptismalStatus || t('not_baptized')}</span>
                                        <span className="text-gray-300 font-black text-[12px]">{member.categoryChangeDate ? new Date(member.categoryChangeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION TOOLBAR (Refined: No card wrapper, clean buttons) */}
            <div className="px-8 mt-6">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Edit Button */}
                        <button
                            onClick={() => navigate(`/admin/members?edit=${member.id}`)}
                            className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[12px] font-black tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                        >
                            {t('edit')}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>

                        {/* Status Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setTypeDropdownOpen(false); }}
                                className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-xl text-[12px] font-black tracking-widest hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                {t('mark_as', 'Marquer comme...')}
                                <svg className={`w-4 h-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {statusDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#111c44] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 py-2 z-[60] animate-in fade-in slide-in-from-top-1">
                                    {['Actif', 'Inactif', 'Transféré', 'Décédé', 'En déplacement'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { setPendingStatus(s); setShowStatusModal(true); setStatusDropdownOpen(false); }}
                                            className="w-full text-left px-6 py-3 text-[11px] font-black text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all tracking-widest"
                                        >
                                            {t(s.toLowerCase().replace(/ /g, '_')) || s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Unified Category Update Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setStatusDropdownOpen(false); }}
                                className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-xl text-[12px] font-black tracking-widest hover:text-indigo-600 transition-all flex items-center gap-2 active:scale-95 shadow-sm border border-gray-100 dark:border-white/5"
                            >
                                {t('change_category', 'Changer la catégorie')}
                                <svg className={`w-4 h-4 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {typeDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#111c44] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 py-4 z-[60] animate-in fade-in slide-in-from-top-1 overflow-hidden">
                                    <div className="px-6 py-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-900/10 mb-2">
                                        {t('classification', 'Classification du Contact')}
                                    </div>

                                    {allSubtypes.map(subtype => (
                                        <button
                                            key={subtype.id}
                                            onClick={() => { setPendingCategory(subtype); setPendingMemberCategoryId(null); setPendingBaptismalStatus(null); setShowCategoryModal(true); setTypeDropdownOpen(false); }}
                                            className="w-full text-left px-8 py-3 text-[11px] font-black text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 transition-all tracking-widest"
                                        >
                                            {subtype.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Message Button */}
                        <button
                            onClick={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                            className="ml-auto w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 active:scale-90 transition-all shadow-sm"
                        >
                            <MessageIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID - Optimized 2 Column Layout */}
            <div className="px-8 mt-10 pb-32">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* ROW 1: Infos personnelles | Coordonnées */}
                    {/* ROW 1: Infos personnelles | Coordonnées */}
                    <Accordion
                        title={t('personal_info', 'Infos personnelles')}
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        initialOpen={true}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-12">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('member_code', 'Code Membre')}</span>
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 px-2 py-0.5 rounded-lg">{member.memberCode || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('first_name', 'Firstname')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{member.firstName}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('last_name', 'Last name')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{member.lastName}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('nickname', 'Nickname')}</span>
                                    <span className="text-sm font-black text-indigo-600 italic">@{member.nickname || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('gender', 'Sexe')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{t(member.gender?.toLowerCase()) || member.gender}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('age', 'Âge')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{calculateAge(member.birthDate)} {t('years', 'ans')}</span>
                                </div>

                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('birth_date', 'Date de naissance')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('birth_place', 'Lieu de naissance')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{member.birthPlace || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('marital_status', 'État civil')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{t(member.maritalStatus?.toLowerCase()) || member.maritalStatus || '-'}</span>
                                </div>
                                {(member.maritalStatus === 'Marié(e)' || member.maritalStatus === 'Marié') && (
                                    <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                        <span className="text-xs font-bold text-gray-500 tracking-widest">{t('spouse_name', 'Conjoint(e)')}</span>
                                        <span className="text-sm font-black text-indigo-600">{member.spouseName || '-'}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-gray-500 tracking-widest">{t('nif_cin', 'Nif/Cin')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">{member.nifCin || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-3">
                                    <span className="text-xs font-bold text-indigo-500 tracking-widest">{t('join_date', 'Date adhésion')}</span>
                                    <span className="text-sm font-black text-[#2B3674] dark:text-white">
                                        {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Accordion>

                    <Accordion
                        title={t('contact_information', 'Coordonnées')}
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        initialOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-500 tracking-[0.2em] mb-3">{t('address', 'Adresse')}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest mt-0.5">Home ⭐</span>
                                            <div className="text-right">
                                                <p className="text-[13px] font-bold text-[#2B3674] dark:text-white">{member.address || '-'}</p>
                                                <p className="text-[11px] font-bold text-gray-500">{member.city ? `${member.city}${member.country ? ', ' + member.country : ''}` : member.country || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest">Work</span>
                                            <p className="text-[13px] font-bold text-[#2B3674] dark:text-white">{member.workAddress || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-500 tracking-[0.2em] mb-3">{t('email', 'Email')}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest">Personnelle ⭐</span>
                                            <a href={`mailto:${member.email}`} className="text-[13px] font-bold text-blue-600 hover:underline">{member.email || '-'}</a>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest">Work</span>
                                            <a href={`mailto:${member.workEmail}`} className="text-[13px] font-bold text-blue-600 hover:underline">{member.workEmail || '-'}</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-500 tracking-[0.2em] mb-3">{t('telephone', 'Téléphone')}</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest">Mobile ⭐</span>
                                            <p className="text-[13px] font-bold text-[#2B3674] dark:text-white">{member.phone || '-'}</p>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-gray-400 tracking-widest">Work</span>
                                            <p className="text-[13px] font-bold text-[#2B3674] dark:text-white">{member.workPhone || '-'}</p>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 dark:border-white/5 pb-2">
                                            <span className="text-[11px] font-bold text-red-500 tracking-widest">Urgence 🆘</span>
                                            <p className="text-[13px] font-bold text-[#2B3674] dark:text-white">{member.emergencyContact || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-500 tracking-[0.2em] mb-3">{t('online_presence', 'Présence en ligne')}</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-blue-600 text-[10px] text-white rounded-md flex items-center justify-center font-black">in</div>
                                            <a href={member.linkedinUrl?.startsWith('http') ? member.linkedinUrl : `https://${member.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-blue-600 hover:underline cursor-pointer">
                                                {member.linkedinUrl ? member.linkedinUrl.replace('https://', '').replace('www.', '') : '-'}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-indigo-600 text-[10px] text-white rounded-md flex items-center justify-center font-black">fb</div>
                                            <a href={member.facebookUrl?.startsWith('http') ? member.facebookUrl : `https://${member.facebookUrl}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-indigo-600 hover:underline cursor-pointer">
                                                {member.facebookUrl ? member.facebookUrl.replace('https://', '').replace('www.', '') : '-'}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Accordion>

                    {/* ROW 2: Historique des communications | Attachements */}
                    <Accordion title={t('communication_history', 'Historique des communications')} icon={<MessageIcon />}>
                        <div className="space-y-4">
                            {communications.map(c => (
                                <div key={c.id} className="p-6 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[15px] font-black text-[#2B3674] dark:text-white tracking-tight">{c.title}</p>
                                        <span className="text-[11px] font-black text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 leading-relaxed">{c.message}</p>
                                </div>
                            ))}
                            {communications.length === 0 && <div className="py-12 text-center text-xs font-black text-gray-400 tracking-widest">{t('no_communication_recorded', 'Aucune communication enregistrée')}</div>}
                        </div>
                    </Accordion>

                    <Accordion
                        title={t('attachments', 'Attachements')}
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
                    >
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-black/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-black text-indigo-500 tracking-[0.2em]">{t('manage_files', 'Gestion des documents')}</h4>
                                    <p className="text-[13px] font-bold text-gray-400 leading-relaxed max-w-sm">
                                        {t('attachment_instr', 'Uploadez des certificats, photos ou documents légaux directement sur le profil.')}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setAttachmentModalOpen(true); }}
                                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95 shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    {t('add', 'Ajouter')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {attachments.map(att => (
                                    <div key={att.id} className="p-6 bg-white dark:bg-black/20 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center justify-between group transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-gray-100/50 dark:hover:shadow-none">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${att.type === 'link' ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100 dark:shadow-none'}`}>
                                                <AttachmentIcon type={att.type} fileType={att.fileType} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-black text-[#2B3674] dark:text-white tracking-tight truncate">{att.name}</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-md text-[9px] font-black text-gray-500 dark:text-gray-400 tracking-widest">
                                                        {att.type === 'link' ? 'Lien' : att.fileType.toUpperCase()}
                                                    </span>
                                                    {att.size && <span className="text-[11px] font-bold text-gray-400">{(att.size / 1024).toFixed(1)} KB</span>}
                                                    <span className="text-[11px] font-bold text-gray-300">/ {new Date(att.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                            {att.type === 'file' ? (
                                                <a
                                                    href={`${api.defaults.baseURL.replace('/api', '')}${att.url}`}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 bg-gray-50 dark:bg-black text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-transparent dark:border-white/10"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </a>
                                            ) : (
                                                <a
                                                    href={att.url.startsWith('http') ? att.url : `https://${att.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 bg-gray-50 dark:bg-black text-amber-500 rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-transparent dark:border-white/10"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDeleteAttachment(att.id)}
                                                className="w-10 h-10 bg-gray-50 dark:bg-black text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-transparent dark:border-white/10"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {attachments.length === 0 && <div className="col-span-1 lg:col-span-2 py-16 text-center">
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    </div>
                                    <p className="text-xs font-black text-gray-400 tracking-widest">{t('no_attachments_found', 'Aucun attachement trouvé')}</p>
                                </div>}
                            </div>
                        </div>
                    </Accordion>

                    {/* ROW 3: Note de synthèse | Relations & Réseau */}

                    <Accordion title={t('relationships_network', 'Relations & réseaux')} icon={<NetworkIcon />}>
                        <RelationshipsList memberId={member.id} member={member} />
                        <OrganizationRolesList memberId={member.id} />
                    </Accordion>

                    {/* ROW 4: Historique des dons | Régulateur de Dîmes */}
                    <Accordion title={t('donations_history', 'Historique des dons')} icon={<MoneyIcon />}>
                        <div className="overflow-x-auto noscrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/40">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('date', 'Date')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('type', 'Type')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest text-right">{t('amount', 'Montant')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(member.donations || []).map(d => (
                                        <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-8 py-5 text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(d.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-xs font-bold text-indigo-500 tracking-widest">{d.type || '-'}</td>
                                            <td className="px-8 py-5 text-right text-sm font-black text-[#2B3674] dark:text-white">{parseFloat(d.amount).toLocaleString()} {d.currency}</td>
                                        </tr>
                                    ))}
                                    {(!member.donations || member.donations.length === 0) && (
                                        <tr><td colSpan="3" className="py-20 text-center text-xs font-bold text-gray-400 tracking-widest">{t('no_donations_recorded', 'Aucun don enregistré')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>

                    <Accordion title={t('tithe_regulator', 'Régulateur de dîmes')} icon={<TitheIcon />}>
                        <TitheRegulator donations={member.donations || []} />
                    </Accordion>

                    {/* ROW 6: Historique de statut | Historique de catégorie */}
                    <Accordion
                        title={t('status_history', 'Historique de statut')}
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    >
                        <div className="overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-12 text-center text-xs font-black text-gray-400 tracking-widest animate-pulse">{t('loading')}</div>
                            ) : history.statusHistory && history.statusHistory.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('date', 'Date')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('status', 'Statut')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('modified_by', 'Modifié par')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('notes', 'Notes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {history.statusHistory.map((h, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                                                <td className="px-8 py-5 text-xs font-bold text-[#2B3674] dark:text-white">
                                                    {new Date(h.changeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                                                </td>
                                                <td className="px-8 py-5 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                    {t(h.status?.toLowerCase().replace(/ /g, '_')) || h.status}
                                                </td>
                                                <td className="px-8 py-5 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : '-'}
                                                </td>
                                                <td className="px-8 py-5 text-xs text-gray-500 dark:text-gray-400 italic">
                                                    {h.notes && h.notes !== 'Status update' ? h.notes : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center text-xs font-black text-gray-400 tracking-widest">
                                    {t('no_status_history', 'Aucun historique de statut')}
                                </div>
                            )}
                        </div>
                    </Accordion>

                    <Accordion
                        title={t('category_history', 'Historique de catégorie')}
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                    >
                        <div className="overflow-x-auto">
                            {historyLoading ? (
                                <div className="py-12 text-center text-xs font-black text-gray-400 tracking-widest animate-pulse">{t('loading')}</div>
                            ) : history.categoryHistory && history.categoryHistory.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black/40">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('date', 'Date')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('category', 'Catégorie')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('modified_by', 'Modifié par')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('notes', 'Notes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {history.categoryHistory.map((h, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                                                <td className="px-8 py-5 text-xs font-bold text-[#2B3674] dark:text-white">
                                                    {new Date(h.changeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                                                </td>
                                                <td className="px-8 py-5 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                    {h.contactSubtype?.name || h.baptismalStatus || h.memberCategory?.name || t('unknown', 'Inconnu')}
                                                </td>
                                                <td className="px-8 py-5 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    {h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : '-'}
                                                </td>
                                                <td className="px-8 py-5 text-xs text-gray-500 dark:text-gray-400 italic">
                                                    {h.notes && !h.notes.includes('update') ? h.notes : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-12 text-center text-xs font-black text-gray-400 tracking-widest">
                                    {t('no_category_history', 'Aucun historique de catégorie')}
                                </div>
                            )}
                        </div>
                    </Accordion>

                    {/* ROW 6: Événements participés | Cérémonies participées */}
                    <Accordion title={t('events_attended', 'Événements participés')} icon={<CalendarIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(member.attendedEvents || []).map(e => (
                                <div key={e.id} className="bg-gray-50/50 dark:bg-black/20 p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white dark:bg-black rounded-xl flex items-center justify-center text-blue-600 text-lg font-black shadow-sm">{new Date(e.startDate).getDate()}</div>
                                    <div>
                                        <p className="text-sm font-black text-[#2B3674] dark:text-white">{e.title}</p>
                                        <p className="text-[11px] font-bold text-gray-400 tracking-widest mt-1">{new Date(e.startDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {(!member.attendedEvents || member.attendedEvents.length === 0) && (
                                <div className="col-span-2 py-12 text-center text-xs font-black text-gray-400 tracking-widest">{t('no_participation_recorded', 'Aucune participation enregistrée')}</div>
                            )}
                        </div>
                    </Accordion>

                    <Accordion title={t('ceremonies_attended', 'Cérémonies participées')} icon={<CeremonyIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(member.attendedCeremonies || []).map(c => (
                                <div key={c.id} className="bg-gray-50/50 dark:bg-black/20 p-6 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white dark:bg-black rounded-xl flex items-center justify-center text-amber-500 text-xl shadow-sm">✨</div>
                                    <div>
                                        <p className="text-sm font-black text-[#2B3674] dark:text-white">{c.name || c.title}</p>
                                        <p className="text-[11px] font-bold text-gray-400 tracking-widest mt-1">{c.date ? new Date(c.date).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                            ))}
                            {(!member.attendedCeremonies || member.attendedCeremonies.length === 0) && (
                                <div className="col-span-2 py-12 text-center text-xs font-black text-gray-400 tracking-widest">{t('no_participation_recorded', 'Aucune participation enregistrée')}</div>
                            )}
                        </div>
                    </Accordion>


                    {/* ROW 7: Historique des groupes */}
                    <Accordion title={t('groups_history', 'Historique des groupes')} icon={<GroupsIcon />}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/40">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('group_name', 'Nom du Groupe')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('type', 'Type')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('role', 'Rôle')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('status', 'Statut')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('join_date', 'Date Adhésion')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(member.memberGroups || []).map(g => (
                                        <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => navigate(`/admin/groups/${g.id}`)}
                                                    className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-tight"
                                                >
                                                    {g.name}
                                                </button>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {t(g.type?.toLowerCase()) || g.type}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase">
                                                    {g.group_member?.role || 'Membre'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${g.group_member?.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                                    g.group_member?.status === 'inactive' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                                        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                                    }`}>
                                                    {g.group_member?.status === 'active' ? t('active', 'Actif') :
                                                        g.group_member?.status === 'inactive' ? t('inactive', 'Inactif') :
                                                            t('paused', 'Mise en pause')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {g.group_member?.joinedAt ? new Date(g.group_member.joinedAt).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!member.memberGroups || member.memberGroups.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-xs font-black text-gray-400 tracking-widest">
                                                {t('no_groups_found', 'Aucun groupe trouvé')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>

                    {/* Sunday School History */}
                    <Accordion title={t('sunday_school_history', 'Historique École Dominicale')} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-black/40">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('class_name', 'Nom de la Classe')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('assignment_type', 'Type d\'Assignation')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('status', 'Statut')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">{t('join_date', 'Date d\'Adhésion')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(member.sundaySchoolClasses || []).map(cls => (
                                        <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => navigate(`/admin/sunday-school/${cls.id}`)}
                                                    className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-tight"
                                                >
                                                    {cls.name}
                                                </button>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${cls.sunday_school_member?.assignmentType === 'automatic'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                    {cls.sunday_school_member?.assignmentType === 'automatic' ? t('automatic', 'Automatique') : t('manual', 'Manuel')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${cls.sunday_school_member?.status === 'active'
                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {cls.sunday_school_member?.status === 'active' ? t('active', 'Actif') : t('inactive', 'Inactif')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {cls.sunday_school_member?.joinedAt ? new Date(cls.sunday_school_member.joinedAt).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!member.sundaySchoolClasses || member.sundaySchoolClasses.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center text-xs font-black text-gray-400 tracking-widest">
                                                {t('no_sunday_school_classes', 'Aucune classe d\'école dominicale')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Accordion>
                </div>
            </div>


            {/* Status Change Modal */}
            {showStatusModal && (
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
            )}

            {/* Category Change Modal (Unified) */}
            {showCategoryModal && (
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
            )}

            <CommunicationModal isOpen={messageModal.isOpen} onClose={() => setMessageModal({ ...messageModal, isOpen: false })} recipient={messageModal.recipient} recipients={messageModal.recipients} mode={messageModal.mode} />
            <AttachmentModal isOpen={attachmentModalOpen} onClose={() => setAttachmentModalOpen(false)} onSuccess={fetchAttachments} userId={id} />
            {showPhotoModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 transition-colors"><div className="absolute inset-0 bg-gray-900/95 backdrop-blur-2xl" onClick={() => setShowPhotoModal(false)}></div><div className="relative max-w-4xl max-h-[90vh] shadow-2xl"><button onClick={() => setShowPhotoModal(false)} className="absolute -top-16 right-0 text-white font-black text-xl">✕</button><img src={member.photo} className="w-full h-full object-contain rounded-[40px] border border-white/10" alt="Zoom" /></div></div>
            )}
        </AdminLayout>
    );
}

function DetailItem({ label, value, icon, isEmail, isFullWidth }) {
    return (
        <div className={`flex items-start gap-4 ${isFullWidth ? 'md:col-span-2' : ''}`}>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-black/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-transparent dark:border-white/5">{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.15em] mb-1">{label}</p>
                {isEmail ? (
                    <a href={`mailto:${value}`} className="text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block">{value}</a>
                ) : (
                    <p className="text-[13px] font-black text-[#2B3674] dark:text-white/90 truncate">{value || '-'}</p>
                )}
            </div>
        </div>
    );
}

function Accordion({ title, icon, children, initialOpen = false }) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    useEffect(() => { setIsOpen(initialOpen); }, [initialOpen]);
    return (
        <div className="bg-white dark:bg-[#111c44] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-md">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-10 py-8 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-black/10 transition-all">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-black/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm border border-transparent dark:border-white/5">{icon}</div>
                    <span className="text-[15px] font-black text-[#2B3674] dark:text-white tracking-tight">{title}</span>
                </div>
                <div className={`w-9 h-9 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180 bg-indigo-600 text-white border-transparent' : 'bg-white dark:bg-black/20 text-gray-400'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-12 py-12 border-t border-gray-50 dark:border-white/5 bg-gray-50/20 dark:bg-transparent">
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
