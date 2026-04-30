import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import MemberForm from '../../../components/Admin/MemberForm';
import CommunicationModal from '../../../components/Admin/CommunicationModal';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { useLanguage } from '../../../context/LanguageContext';
import BatchMemberCardGeneratorModal from '../../../components/Admin/Members/BatchMemberCardGeneratorModal';

// Icons
const MessageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

const CurrentTime = () => {
    const { language } = useLanguage();
    const [date, setDate] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <span className="text-app-micro font-bold text-gray-500 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5 whitespace-nowrap tracking-wider transition-all">
            {date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })} • {date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
        </span>
    );
};

export default function Members() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
    const [roles, setRoles] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [memberCategories, setMemberCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Custom Modal States
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [showAllMembers, setShowAllMembers] = useState(false);

    const [page, setPage] = useState(1);
    const MEMBERS_PER_PAGE = 7;

    // Messaging State
    const [messageModal, setMessageModal] = useState({ isOpen: false, recipient: null, recipients: [], mode: 'individual' });
    const [visitorConversionInfo, setVisitorConversionInfo] = useState(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // Filtering & Stats states
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: '',
        country: '',
        category: '',
        dateStart: '',
        dateEnd: ''
    });

    const statsData = useMemo(() => ({
        total: members.length,
        active: members.filter(m => m.status === 'Actif' || m.status === 'Active' || !m.status).length,
        traveling: members.filter(m => m.status === 'En déplacement' || m.status === 'Traveling').length,
        transferred: members.filter(m => m.status === 'Transféré' || m.status === 'Transferred').length,
        deceased: members.filter(m => m.status === 'Décédé' || m.status === 'Deceased').length,
        abandoned: members.filter(m => m.status === 'Abandonné' || m.status === 'Abandoned').length,
        boys: members.filter(m => m.gender === 'M' || m.gender === 'Masculin' || m.gender === 'Male').length,
        girls: members.filter(m => m.gender === 'F' || m.gender === 'Féminin' || m.gender === 'Female').length,
    }), [members]);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', role: ['member'], subtypeId: '',
        phone: '', address: '', city: '', country: '', gender: '', birthDate: '', maritalStatus: '', photo: ''
    });

    // Fetch Members
    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data);
            setFilteredMembers(response.data);
        } catch (error) {
            console.error("Erreur chargement membres:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, rolesRes, subtypesRes, categoriesRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/roles'),
                    api.get('/contacts/classification/subtypes'),
                    api.get('/member-categories')
                ]);
                setMembers(membersRes.data);
                setFilteredMembers(membersRes.data);
                setRoles(rolesRes.data);

                const filteredSubtypes = subtypesRes.data.filter(s => {
                    const typeName = s.type?.name?.toLowerCase().trim();
                    return typeName === 'membre' || typeName === 'member';
                });
                setSubtypes(filteredSubtypes);
                setMemberCategories(categoriesRes.data);

                if (location.state?.fromVisitor && location.state?.prefillData) {
                    const { visitorId, fromVisitor, prefillData } = location.state;
                    setVisitorConversionInfo({ visitorId, fromVisitor });
                    setFormData({ ...formData, ...prefillData, role: ['member'] });
                    setShowModal(true);
                    setAlertMessage({
                        show: true,
                        title: t('info', 'Info'),
                        message: t('visitor_conversion_info', 'Complétez les informations manquantes pour convertir ce visiteur en membre'),
                        type: 'success'
                    });
                    navigate(location.pathname, { replace: true });
                }

                const editIdStr = searchParams.get('edit');
                if (editIdStr) {
                    const memberToEdit = membersRes.data.find(m => m.id === parseInt(editIdStr));
                    if (memberToEdit) {
                        setFormData(memberToEdit);
                        setEditId(memberToEdit.id);
                        setShowModal(true);
                        searchParams.delete('edit');
                        setSearchParams(searchParams);
                    }
                }
            } catch (error) {
                console.error("Error fetching public projection:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [searchParams, location.state]);

    const handleMemberSuccess = async (data) => {
        if (visitorConversionInfo?.fromVisitor && visitorConversionInfo?.visitorId) {
            try {
                const newMemberId = data.member?.id;
                if (newMemberId) {
                    await api.put(`/visitors/${visitorConversionInfo.visitorId}`, {
                        convertedToMemberId: newMemberId,
                        status: 'integrated',
                        viewStatus: 'viewed'
                    });
                    setVisitorConversionInfo(null);
                }
            } catch (err) {
                console.error("Error linking visitor to member:", err);
            }
        }
        fetchMembers();
    };

    useEffect(() => {
        let result = [...members];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(m =>
                m.firstName.toLowerCase().includes(q) ||
                m.lastName.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.memberCode && m.memberCode.toLowerCase().includes(q))
            );
        }
        if (filters.status) result = result.filter(m => m.status === filters.status);
        if (filters.country) result = result.filter(m => m.country === filters.country);
        if (filters.category) result = result.filter(m => m.subtypeId === parseInt(filters.category));
        if (filters.dateStart) result = result.filter(m => new Date(m.createdAt) >= new Date(filters.dateStart));
        if (filters.dateEnd) {
            const end = new Date(filters.dateEnd);
            end.setHours(23, 59, 59, 999);
            result = result.filter(m => new Date(m.createdAt) <= end);
        }
        setFilteredMembers(result);
        // Clear selection when filters change to avoid confusion
        setSelectedMemberIds([]);
    }, [filters, members]);

    useEffect(() => {
        setPage(1);
    }, [filteredMembers]);

    const displayedMembers = useMemo(() => {
        return showAllMembers ? filteredMembers : filteredMembers.slice((page - 1) * MEMBERS_PER_PAGE, page * MEMBERS_PER_PAGE);
    }, [filteredMembers, showAllMembers, page]);

    const totalMembers = filteredMembers.length;
    const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
    const startRecord = totalMembers === 0 ? 0 : (page - 1) * MEMBERS_PER_PAGE + 1;
    const endRecord = Math.min(page * MEMBERS_PER_PAGE, totalMembers);

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/members/${deleteId}`);
            setMembers(members.filter(m => m.id !== deleteId));
            setAlertMessage({ show: true, title: t('success', 'Succès'), message: t('member_deleted_success', 'Membre supprimé avec succès.'), type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: t('delete_error', 'Erreur lors de la suppression.'), type: 'error' });
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const handleCreate = () => {
        setFormData({
            firstName: '', lastName: '', email: '', password: '', role: ['member'], subtypeId: '',
            phone: '', address: '', city: '', country: '', gender: '', birthDate: '', maritalStatus: '', photo: '', nifCin: ''
        });
        setEditId(null);
        setShowModal(true);
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const handleExportPDF = () => {
        const headers = [t('first_name'), t('last_name'), t('email'), t('phone'), t('country'), t('roles'), t('entry'), t('status')];
        const data = filteredMembers.map(m => [
            m.firstName, m.lastName, m.email, m.phone, m.country,
            Array.isArray(m.role) ? m.role.join(", ") : m.role,
            new Date(m.createdAt).toLocaleDateString(),
            m.status || t('active')
        ]);
        exportToPDF(t('member_list'), headers, data);
    };

    const handleExportExcel = () => {
        const data = filteredMembers.map(m => ({
            [t('first_name')]: m.firstName,
            [t('last_name')]: m.lastName,
            [t('email')]: m.email,
            [t('phone')]: m.phone,
            [t('country')]: m.country,
            [t('roles')]: Array.isArray(m.role) ? m.role.join(", ") : m.role,
            [t('entry_date')]: new Date(m.createdAt).toLocaleDateString(),
            [t('status')]: m.status || t('active')
        }));
        exportToExcel(t('member_list'), data);
    };

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/contacts')}
                            className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-stripe hover:bg-brand-primary/5 hover:text-brand-primary transition-all active:scale-95 group"
                        >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-app-micro font-black text-brand-primary tracking-[0.1em]">
                                <span className="w-8 h-[2px] bg-brand-primary"></span>
                                <span>{t('contacts', 'Contacts')}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                {t('members_management', 'Gestion des Membres')}
                            </h1>
                            <p className="text-app-meta font-medium text-gray-500 dark:text-gray-400 mt-2">
                                {t('members_management_subtitle', 'Consultez, ajoutez et gérez tous les membres de votre communauté.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                        <CurrentTime />
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => setMessageModal({ isOpen: true, recipients: filteredMembers, mode: 'bulk' })}
                                className="px-6 py-3.5 bg-brand-primary/5 dark:bg-white/5 text-brand-primary dark:text-brand-orange font-black text-app-micro rounded-2xl border border-brand-primary/10 dark:border-white/5 hover:bg-brand-primary hover:text-white transition-all flex items-center gap-2 active:scale-95 tracking-widest disabled:opacity-50"
                                disabled={filteredMembers.length === 0}
                            >
                                <MessageIcon />
                                <span className="hidden sm:inline">{t('message_all', 'Message groupé')}</span>
                            </button>

                            <button
                                onClick={handleCreate}
                                className="px-8 py-3.5 bg-brand-primary text-white font-black text-app-micro rounded-2xl shadow-premium hover:bg-brand-deep transition-all flex items-center gap-2 active:scale-95 tracking-widest whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('add_member', 'Nouveau Membre')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    <StatCard label={t('total_members')} value={statsData.total} icon="👥" color="brand" subtitle={t('all_time', 'Total inscrits')} />
                    <StatCard label={t('active')} value={statsData.active} icon="✅" color="emerald" subtitle={t('engaged', 'Membres actifs')} />
                    <StatCard label={t('traveling')} value={statsData.traveling} icon="✈️" color="orange" subtitle={t('away', 'En déplacement')} />
                    <StatCard label={t('deceased')} value={statsData.deceased} icon="🕊️" color="brand" subtitle={t('in_memoriam', 'En mémoire')} />
                </div>

                {/* Filters & Table Container */}
                <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                    {/* Toolbar */}
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-50 dark:border-gray-800/50 flex flex-wrap items-center justify-between gap-6 transition-colors bg-white/50 dark:bg-gray-800/10 backdrop-blur-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={`${t('search')}...`}
                                    className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-[#0f172a] border border-transparent dark:border-gray-800 rounded-2xl text-app-meta font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary w-full sm:w-48 transition-all dark:text-white placeholder-gray-400/60 outline-none"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                />
                            </div>

                            <select
                                className="px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-transparent dark:border-gray-800 rounded-2xl text-app-micro font-black tracking-widest text-gray-500 dark:text-gray-400 outline-none transition-all cursor-pointer appearance-none min-w-[140px] focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">{t('all_status', 'Tous les statuts')}</option>
                                <option value="Actif">{t('active')}</option>
                                <option value="Inactif">{t('inactive')}</option>
                                <option value="En déplacement">{t('traveling')}</option>
                            </select>

                            <select
                                className="px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-transparent dark:border-gray-800 rounded-2xl text-app-micro font-black tracking-widest text-gray-500 dark:text-gray-400 outline-none transition-all cursor-pointer appearance-none min-w-[140px] focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5"
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">{t('all_categories', 'Toutes catégories')}</option>
                                {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <div className="flex p-1.5 bg-gray-50 dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2.5 rounded-xl text-app-micro font-black tracking-widest transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-brand-primary dark:text-brand-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    <span className="hidden xl:inline">{t('list_view', 'Liste')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2.5 rounded-xl text-app-micro font-black tracking-widest transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-brand-primary dark:text-brand-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    <span className="hidden xl:inline">{t('grid_view', 'Grille')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {totalMembers > MEMBERS_PER_PAGE && (
                                <button
                                    onClick={() => {
                                        setShowAllMembers(!showAllMembers);
                                        if (!showAllMembers) setPage(1);
                                    }}
                                    className="px-4 py-2 border border-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-orange rounded-xl text-[11px] font-bold hover:underline transition-all"
                                >
                                    {showAllMembers ? t('show_less', 'Voir moins') : t('view_all_records', 'Voir tout les records')}
                                </button>
                            )}

                            <button
                                onClick={handleExportExcel}
                                className="w-11 h-11 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_excel')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>

                            <button
                                onClick={handleExportPDF}
                                className="w-11 h-11 flex items-center justify-center bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange rounded-2xl border border-brand-orange/20 hover:bg-brand-orange hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_pdf')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </button>

                            {selectedMemberIds.length > 0 && (
                                <button
                                    onClick={() => setShowBatchModal(true)}
                                    className="px-6 h-11 flex items-center gap-2 bg-brand-primary text-white rounded-2xl font-black text-app-micro uppercase tracking-widest hover:bg-brand-deep transition-all shadow-lg shadow-brand-primary/10 dark:shadow-none animate-bounce-subtle"
                                >
                                    <span>🎴</span>
                                    <span>{t('generate_cards', 'Générer')} {selectedMemberIds.length} {t('cards', 'Cartes')}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-450px)] noscrollbar">
                        {loading ? (
                            <div className="px-10 py-32 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                    <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black tracking-widest text-brand-primary">{t('loading')}</p>
                                </div>
                            </div>
                        ) : displayedMembers.length === 0 ? (
                            <div className="px-10 py-32 text-center text-gray-300 dark:text-gray-600 font-black tracking-widest text-[10px] italic">
                                {t('no_members_found', 'Aucun membre trouvé')}
                            </div>
                        ) : viewMode === 'list' ? (
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="sticky top-0 z-20 bg-white dark:bg-[#1e293b]">
                                    <tr>
                                        <th className="px-6 py-5 border-b border-gray-50 dark:border-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={selectedMemberIds.length === filteredMembers.length && filteredMembers.length > 0}
                                                onChange={() => {
                                                    if (selectedMemberIds.length === filteredMembers.length) setSelectedMemberIds([]);
                                                    else setSelectedMemberIds(filteredMembers.map(m => m.id));
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-10 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800">{t('member', 'Membre')}</th>
                                        <th className="px-6 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 hidden xl:table-cell">{t('member_code', 'Code')}</th>
                                        <th className="px-6 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 hidden md:table-cell">{t('gender', 'Genre')}</th>
                                        <th className="px-6 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 hidden md:table-cell">{t('age', 'Âge')}</th>
                                        <th className="px-6 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 hidden lg:table-cell">{t('category', 'Catégorie')}</th>
                                        <th className="px-6 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 hidden lg:table-cell">{t('status', 'Statut')}</th>
                                        <th className="px-10 py-5 text-app-micro font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 text-right">{t('actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800 transition-colors">
                                    {displayedMembers.map((member, index) => (
                                        <tr key={member.id} className={`hover:bg-gray-50 dark:hover:bg-brand-primary/5 transition-all group animate-slide-up cursor-pointer ${selectedMemberIds.includes(member.id) ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : ''}`} style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}>
                                            <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMemberIds.includes(member.id)}
                                                    onChange={() => {
                                                        setSelectedMemberIds(prev => prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]);
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-10 py-6" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-brand-primary dark:text-brand-orange font-extrabold text-app-body border border-gray-100 dark:border-gray-800 overflow-hidden group-hover:scale-110 transition-all shadow-sm">
                                                        {member.photo ? <img src={member.photo} className="w-full h-full object-cover" alt="" /> : `${member.firstName?.[0]}${member.lastName?.[0]}`}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 dark:text-white transition-colors text-app-body leading-tight group-hover:text-brand-primary tracking-tight">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-app-micro font-black text-gray-400 dark:text-gray-500 tracking-widest mt-1 opacity-60">{member.country || t('no_country')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 hidden xl:table-cell">
                                                <span className="text-app-micro font-black text-brand-primary dark:text-brand-orange bg-brand-primary/5 dark:bg-brand-primary/20 px-3 py-1.5 rounded-xl border border-brand-primary/10 dark:border-white/10">
                                                    #{member.memberCode || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 hidden md:table-cell">
                                                <span className={`px-4 py-1.5 rounded-xl text-app-micro font-black tracking-widest border border-transparent ${member.gender === 'M' || member.gender === 'Masculin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>
                                                    {member.gender === 'M' || member.gender === 'Masculin' ? t('gender_short_m', 'H') : t('gender_short_f', 'F')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 hidden md:table-cell">
                                                <div className="text-app-meta font-black text-gray-700 dark:text-gray-300 transition-colors tracking-tight">{calculateAge(member.birthDate)} <span className="text-app-micro text-gray-400 font-bold ml-1">{t('years_old', 'ans')}</span></div>
                                            </td>
                                            <td className="px-6 py-6 hidden lg:table-cell">
                                                <span className="text-app-micro font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 w-fit tracking-tighter">
                                                    {subtypes.find(s => s.id === member.subtypeId)?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-2">
                                                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-app-micro font-black tracking-widest border border-blue-100 dark:border-blue-800/20 w-fit">
                                                        {Array.isArray(member.role) ? member.role[0] : member.role}
                                                    </span>
                                                    <span className={`text-app-micro font-black tracking-widest px-3 py-1 w-fit rounded-lg ${member.status?.toLowerCase() === 'actif' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange'}`}>
                                                        {t(member.status?.toLowerCase()) || member.status || t('active')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                                        className="p-3 text-gray-400 hover:text-brand-primary dark:hover:text-brand-orange transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10 rounded-xl hover:scale-110 active:scale-95 shadow-sm"
                                                        title={t('send_message')}
                                                    >
                                                        <MessageIcon />
                                                    </button>
                                                    <button onClick={() => { setEditId(member.id); setFormData(member); setShowModal(true); }} className="p-3 text-gray-400 hover:text-amber-500 transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/20 rounded-xl hover:scale-110 active:scale-95 shadow-sm" title={t('edit')}>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => confirmDelete(member.id)} className="p-3 text-gray-400 hover:text-red-500 transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-red-100 dark:hover:border-red-900/20 rounded-xl hover:scale-110 active:scale-95 shadow-sm" title={t('delete')}>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-10 transition-all">
                                {displayedMembers.map(member => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        t={t}
                                        navigate={navigate}
                                        onEdit={() => { setEditId(member.id); setFormData(member); setShowModal(true); }}
                                        onDelete={() => confirmDelete(member.id)}
                                        getMessageModal={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                        calculateAge={calculateAge}
                                        subtypeName={subtypes.find(s => s.id === member.subtypeId)?.name}
                                        memberCategories={memberCategories}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination Area */}
                        {!showAllMembers && totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-t border-gray-50 dark:border-gray-800/50 gap-4 mt-auto">
                                    <div className="text-app-micro font-bold text-gray-500">
                                        {t('pagination_showing', 'Affichage')} {startRecord}-{endRecord} {t('pagination_of', 'sur')} {totalMembers} {t('pagination_records', 'records')}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-app-micro font-bold">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            {t('prev_pagination', 'Préc.')}
                                        </button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= page - 1 && pageNum <= page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${page === pageNum ? 'bg-brand-primary text-white shadow-sm' : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === page - 2 ||
                                            pageNum === page + 2
                                        ) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}

                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        className="px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-500 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        {t('next', 'Suiv.')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title={t('delete_member_title')}
                message={t('delete_member_confirm')}
            />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />

            <MemberForm
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditId(null); }}
                onSuccess={handleMemberSuccess}
                editId={editId}
                initialData={formData}
                roles={roles}
                subtypes={subtypes}
                memberCategories={memberCategories}
            />

            <CommunicationModal
                isOpen={messageModal.isOpen}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                recipient={messageModal.recipient}
                recipients={messageModal.recipients}
                mode={messageModal.mode}
            />
            {showBatchModal && (
                <BatchMemberCardGeneratorModal
                    members={members.filter(m => selectedMemberIds.includes(m.id))}
                    onClose={() => setShowBatchModal(false)}
                    onSuccess={() => setSelectedMemberIds([])}
                />
            )}
        </AdminLayout>
    );
}

// Unified StatCard for consistency
const StatCard = ({ label, value, icon, color, subtitle }) => {
    const colorVariants = {
        brand: 'bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-orange',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        purple: 'bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-orange',
        orange: 'bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange',
        blue: 'bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-orange'
    };

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-2xl hover:shadow-brand-primary/5 hover:-translate-y-1 duration-300 group">
            <div className="flex items-start justify-between">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-app-micro font-black text-gray-400 tracking-widest">{label}</p>
                        <h4 className="text-3xl font-black dark:text-white tracking-tighter leading-none">{value}</h4>
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${colorVariants[color]} flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                <p className="text-app-micro text-gray-400 font-bold tracking-widest leading-none">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};

const MemberCard = ({ member, t, navigate, onEdit, onDelete, getMessageModal, calculateAge, subtypeName, memberCategories = [] }) => (
    <div
        onClick={() => navigate(`/admin/members/${member.id}`)}
        className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
    >
        <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-xl text-app-micro font-black tracking-widest ${member.status?.toLowerCase() === 'actif' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange'}`}>
            {t(member.status?.toLowerCase()) || member.status || t('active')}
        </div>

        <div className="relative mb-8">
            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-3xl font-black text-brand-primary dark:text-brand-orange border-4 border-white dark:border-[#1e293b] shadow-xl overflow-hidden group-hover:scale-105 transition-all duration-500">
                {member.photo ? <img src={member.photo} className="w-full h-full object-cover" alt="" /> : `${member.firstName?.[0]}${member.lastName?.[0]}`}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-lg border border-gray-50 dark:border-gray-800">
                <span className="text-sm">{member.gender === 'M' || member.gender === 'Masculin' ? '👨' : '👩'}</span>
            </div>
        </div>

        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-brand-primary transition-colors tracking-tight">{member.firstName} {member.lastName}</h3>
        <p className="text-app-micro font-black text-gray-400 dark:text-gray-500 tracking-widest mb-6">{subtypeName || '-'}</p>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl transition-all border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10">
                <p className="text-app-micro text-gray-400 font-black tracking-widest mb-2">{t('age', 'Âge')}</p>
                <p className="text-app-body font-black text-gray-900 dark:text-white">{calculateAge(member.birthDate)} <span className="text-app-micro opacity-40">{t('years_uppercase', 'ANS')}</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl transition-all border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10">
                <p className="text-app-micro text-gray-400 font-black tracking-widest mb-2">{t('role', 'Rôle')}</p>
                <p className="text-app-body font-black text-gray-900 dark:text-white truncate">{Array.isArray(member.role) ? member.role[0] : member.role}</p>
            </div>
        </div>

        <div className="w-full space-y-3 mb-10">
            <div className="flex items-center gap-3 text-app-micro font-bold text-gray-500 dark:text-gray-400 justify-center">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 shadow-stripe rounded-xl">📧</span>
                <span className="truncate max-w-[150px] tracking-tighter">{member.email || t('no_email')}</span>
            </div>
            <div className="flex items-center gap-3 text-app-micro font-bold text-gray-500 justify-center">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">📱</span>
                <span className="uppercase tracking-tight">{member.phone || t('no_number')}</span>
            </div>
        </div>

        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <button onClick={getMessageModal} className="w-12 h-12 flex items-center justify-center bg-brand-primary/5 dark:bg-white/5 text-brand-primary dark:text-brand-orange rounded-2xl hover:bg-brand-primary hover:text-white transition-all transform active:scale-95 shadow-sm border border-transparent hover:border-brand-primary/10 dark:hover:border-white/10"><MessageIcon /></button>
            <button onClick={onEdit} className="w-12 h-12 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all transform active:scale-95 shadow-sm border border-transparent hover:border-amber-100 dark:hover:border-amber-900/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
            <button onClick={onDelete} className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all transform active:scale-95 shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/20"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
    </div>
);
