import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import MemberForm from '../../../components/Admin/MemberForm';
import CommunicationModal from '../../../components/Admin/CommunicationModal';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { useLanguage } from '../../../context/LanguageContext';

// Icons
const UsersIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MaleIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const FemaleIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PlaneIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const ArrowRightIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
const HeartBrokenIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const XCircleIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MessageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

export default function Members() {
    const { t } = useLanguage();
    const navigate = useNavigate();
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

    // Messaging State
    const [messageModal, setMessageModal] = useState({ isOpen: false, recipient: null, recipients: [], mode: 'individual' });

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

    const stats = useMemo(() => ({
        total: members.length,
        active: members.filter(m => m.status === 'Actif' || m.status === 'Active' || !m.status).length,
        inactive: members.filter(m => m.status === 'Inactif' || m.status === 'Inactive').length,
        traveling: members.filter(m => m.status === 'En déplacement' || m.status === 'Traveling').length,
        deceased: members.filter(m => m.status === 'Décédé' || m.status === 'Deceased').length,
        transferred: members.filter(m => m.status === 'Transféré' || m.status === 'Transferred').length,
        abandoned: members.filter(m => m.status === 'Abandonné' || m.status === 'Abandoned').length,
        boys: members.filter(m => m.gender === 'M' || m.gender === 'Masculin' || m.gender === 'Male').length,
        girls: members.filter(m => m.gender === 'F' || m.gender === 'Féminin' || m.gender === 'Female').length,
    }), [members]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: ['member'],
        subtypeId: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        gender: '',
        birthDate: '',
        maritalStatus: '',
        photo: ''
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

                // Auto-edit logic
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
                console.error("Erreur chargement données:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [searchParams]);

    // Apply filters locally
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

        if (filters.status) {
            result = result.filter(m => m.status === filters.status);
        }

        if (filters.country) {
            result = result.filter(m => m.country === filters.country);
        }

        if (filters.category) {
            result = result.filter(m => m.subtypeId === parseInt(filters.category));
        }

        if (filters.dateStart) {
            const start = new Date(filters.dateStart);
            result = result.filter(m => new Date(m.createdAt) >= start);
        }

        if (filters.dateEnd) {
            const end = new Date(filters.dateEnd);
            // End of the day
            end.setHours(23, 59, 59, 999);
            result = result.filter(m => new Date(m.createdAt) <= end);
        }

        setFilteredMembers(result);
    }, [filters, members]);

    const displayedMembers = useMemo(() => {
        return showAllMembers ? filteredMembers : filteredMembers.slice(0, 12);
    }, [filteredMembers, showAllMembers]);

    // Confirm Delete Logic
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



    // Handle Create
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
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
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
            <div className="p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 transition-colors">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/contacts')}
                            className="p-4 text-gray-400 hover:text-indigo-600 bg-white dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-black border border-gray-100 dark:border-white/5 rounded-2xl transition-all shadow-sm active:scale-95"
                            title={t('back_to_dashboard')}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{t('Members management')}</h1>
                            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2">{t('Members desc')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMessageModal({ isOpen: true, recipients: filteredMembers, mode: 'bulk' })}
                            className="px-6 py-3 bg-indigo-50 dark:bg-black text-indigo-600 dark:text-indigo-400 font-bold text-[13px] rounded-xl border border-indigo-100 dark:border-white/5 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            disabled={filteredMembers.length === 0}
                            title={t('message_filtered', 'Message à la liste filtrée')}
                        >
                            <MessageIcon />
                            <span className="hidden sm:inline">{t('message_all', 'Message groupé')}</span>
                        </button>
                        <button onClick={handleCreate} className="px-6 py-3 bg-blue-600 text-white font-semibold text-[13px] rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition-all flex items-center gap-2 active:scale-95">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            {t('add_member')}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 gap-2 mb-8 transition-colors">
                    <StatCard label={t('total_members')} value={stats.total} icon="👥" color="text-indigo-600" bg="bg-indigo-50" />
                    <StatCard label={t('active')} value={stats.active} icon="✅" color="text-green-600" bg="bg-green-50" />
                    <StatCard label={t('traveling')} value={stats.traveling} icon="✈️" color="text-amber-600" bg="bg-amber-50" />
                    <StatCard label={t('transferred')} value={stats.transferred} icon="➡️" color="text-purple-600" bg="bg-purple-50" />
                    <StatCard label={t('deceased')} value={stats.deceased} icon="🕊️" color="text-gray-600" bg="bg-gray-100" />
                    <StatCard label={t('abandoned')} value={stats.abandoned} icon="❌" color="text-red-600" bg="bg-red-50" />
                    <StatCard label={t('men')} value={stats.boys} icon="👨" color="text-blue-600" bg="bg-blue-50" />
                    <StatCard label={t('women')} value={stats.girls} icon="👩" color="text-pink-600" bg="bg-pink-50" />
                </div>



                {/* Filters & Table Container */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                    {/* Filter Toolbar (Row 1) */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex flex-nowrap items-center gap-3 overflow-x-auto noscrollbar transition-colors bg-white/50 dark:bg-black/20">
                        {/* Search Input */}
                        <div className="relative flex-shrink-0 w-48">
                            <input
                                type="text"
                                placeholder={`${t('search')}...`}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[12px] font-medium text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-700 absolute left-3.5 top-3.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Date Range */}
                        <div className="flex-shrink-0 flex items-center gap-4 bg-gray-50 dark:bg-black px-6 py-3 rounded-xl border border-gray-100 dark:border-white/5 transition-colors shadow-sm">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">{t('from')}</span>
                            <input
                                type="date"
                                className="bg-transparent text-[12px] font-semibold text-gray-700 dark:text-gray-300 outline-none w-32 [color-scheme:light]"
                                value={filters.dateStart}
                                onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                            />
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">{t('to')}</span>
                            <input
                                type="date"
                                className="bg-transparent text-[12px] font-semibold text-gray-700 dark:text-gray-300 outline-none w-32 [color-scheme:light]"
                                value={filters.dateEnd}
                                onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                            />
                        </div>

                        {/* Selects */}
                        <select
                            className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-400 outline-none transition-all cursor-pointer appearance-none"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">{t('all_status')}</option>
                            <option value="Actif">{t('active')}</option>
                            <option value="Inactif">{t('inactive')}</option>
                            <option value="En déplacement">{t('traveling')}</option>
                        </select>

                        <select
                            className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-400 outline-none transition-all cursor-pointer appearance-none"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">{t('all_categories')}</option>
                            {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Actions Toolbar (Row 2) */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between gap-4 transition-colors bg-white dark:bg-[#1A1A1A]">
                        {/* Left Side: View All, List, Grid */}
                        <div className="flex items-center gap-3">
                            {!showAllMembers && filteredMembers.length > 12 && (
                                <button
                                    onClick={() => setShowAllMembers(true)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    {t('view_all_members')} ({filteredMembers.length})
                                </button>
                            )}
                            {showAllMembers && (
                                <button
                                    onClick={() => setShowAllMembers(false)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    {t('collapse_list')}
                                </button>
                            )}

                            <div className="flex p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    {t('list_view', 'Liste')}
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    {t('grid_view', 'Grille')}
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Export Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="w-9 h-9 flex items-center justify-center bg-green-50 dark:bg-black text-green-600 dark:text-green-500 rounded-xl border border-transparent dark:border-white/5 hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_excel')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>

                            <button
                                onClick={handleExportPDF}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-black text-red-600 dark:text-red-500 rounded-xl border border-transparent dark:border-white/5 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_pdf')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Main Content (Table or Grid) */}
                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">{t('loading')}</div>
                    ) : displayedMembers.length === 0 ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">{t('no_members_found')}</div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20 transition-colors">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('member')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden xl:table-cell">{t('member_code', 'Code')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden md:table-cell">{t('gender')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden md:table-cell">{t('age')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden md:table-cell">{t('birth_date')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden md:table-cell">{t('contact')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden lg:table-cell">{t('category')}</th>
                                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 hidden lg:table-cell">{t('role_status')}</th>
                                        <th className="px-3 py-3 text-right text-[11px] font-semibold text-gray-500">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                    {displayedMembers.map(member => (
                                        <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-4 transition-colors">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-all group-hover:scale-105 duration-500">
                                                        {member.photo ? <img src={member.photo} className="w-full h-full object-cover" alt="" /> : member.firstName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white transition-colors text-[14px] leading-tight group-hover:text-blue-600">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 dark:text-gray-500 transition-colors font-medium tracking-wider mt-1">{member.country || t('no_country')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 hidden xl:table-cell">
                                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg border border-indigo-100 dark:border-white/5">
                                                    {member.memberCode || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 hidden md:table-cell">
                                                <span className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold border ${member.gender === 'M' || member.gender === 'Masculin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-white/5' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-white/5'}`}>
                                                    {member.gender === 'M' || member.gender === 'Masculin' ? t('gender_short_m', 'H') : t('gender_short_f', 'F')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 hidden md:table-cell">
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors tracking-tight">{calculateAge(member.birthDate)}</div>
                                            </td>
                                            <td className="px-3 py-3 hidden md:table-cell text-[12px] font-medium text-gray-500 dark:text-gray-500 mt-1">
                                                {member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-3 py-3 hidden md:table-cell">
                                                <div className="text-[13px] font-semibold text-gray-900 dark:text-white transition-colors tracking-tight">{member.email}</div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-500 transition-colors font-medium mt-1">{member.phone || t('no_number')}</div>
                                            </td>
                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 transition-colors bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 px-3 py-1.5 rounded-lg">
                                                    {subtypes.find(s => s.id === member.subtypeId)?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 hidden lg:table-cell transition-colors">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold border border-blue-100 dark:border-white/5">
                                                        {Array.isArray(member.role) ? member.role[0] : member.role}
                                                    </span>
                                                    <span className={`text-[10px] font-semibold transition-colors px-3 py-1 rounded-lg border ${member.status === 'Actif' || member.status === 'Active' ? 'bg-green-50 dark:bg-green-900/10 text-green-500 dark:text-green-400 border-green-100 dark:border-white/5' :
                                                        member.status === 'Inactif' || member.status === 'Inactive' ? 'bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 border-red-100 dark:border-white/5' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-500 dark:text-amber-400 border-amber-100 dark:border-white/5'
                                                        }`}>
                                                        {t(member.status?.toLowerCase()) || member.status || t('active')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                                        className="p-2.5 text-gray-400 hover:text-indigo-600 transition-all bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl hover:scale-105 active:scale-95"
                                                        title={t('send_message')}
                                                    >
                                                        <MessageIcon />
                                                    </button>
                                                    <button onClick={() => {
                                                        setEditId(member.id);
                                                        setFormData(member);
                                                        setShowModal(true);
                                                    }} className="p-2.5 text-gray-400 hover:text-blue-600 transition-all bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl hover:scale-105 active:scale-95" title={t('edit')}>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => confirmDelete(member.id)} className="p-2.5 text-gray-400 hover:text-red-500 transition-all bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl hover:scale-105 active:scale-95" title={t('delete')}>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 p-8 transition-all">
                            {displayedMembers.map(member => (
                                <MemberCard
                                    key={member.id}
                                    member={member}
                                    t={t}
                                    navigate={navigate}
                                    onEdit={() => {
                                        setEditId(member.id);
                                        setFormData(member);
                                        setShowModal(true);
                                    }}
                                    onDelete={() => confirmDelete(member.id)}
                                    getMessageModal={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                    calculateAge={calculateAge}
                                    subtypeName={subtypes.find(s => s.id === member.subtypeId)?.name}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Removed */}
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
                onClose={() => {
                    setShowModal(false);
                    setEditId(null);
                }}
                onSuccess={fetchMembers}
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
        </AdminLayout>
    );
}

// Helper Components
const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-white dark:bg-[#111c44] rounded-[20px] p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 group">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} dark:bg-black/40 flex items-center justify-center text-xl shadow-sm border border-transparent dark:border-white/5 transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-[#2B3674] dark:text-white tracking-tight">{value}</div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">{label}</div>
            </div>
        </div>
    </div>
);

const MemberCard = ({ member, t, navigate, onEdit, onDelete, getMessageModal, calculateAge, subtypeName }) => (
    <div
        onClick={() => navigate(`/admin/members/${member.id}`)}
        className="bg-white dark:bg-[#111c44] rounded-[30px] p-6 shadow-sm border border-transparent hover:border-[#4318FF]/20 transition-all hover:shadow-2xl hover:-translate-y-2 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
    >
        {/* Status indicator */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest ${member.status === 'Actif' || member.status === 'Active' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
            }`}>
            {t(member.status?.toLowerCase()) || member.status || t('active')}
        </div>

        {/* Avatar Area */}
        <div className="relative mb-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 dark:bg-black/40 flex items-center justify-center text-3xl font-bold text-[#4318FF] border-4 border-white dark:border-[#111c44] shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {member.photo ? <img src={member.photo} className="w-full h-full object-cover" alt="" /> : member.firstName?.[0]}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#111c44] p-2 rounded-full shadow-lg border border-gray-50 dark:border-white/5">
                <span className="text-xs">{member.gender === 'M' || member.gender === 'Masculin' ? '👨' : '👩'}</span>
            </div>
        </div>

        {/* Info */}
        <h3 className="text-lg font-bold text-[#2B3674] dark:text-white mb-1 group-hover:text-[#4318FF] transition-colors">{member.firstName} {member.lastName}</h3>
        <p className="text-[11px] font-bold text-gray-400 tracking-widest mb-4">{subtypeName || '-'}</p>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="bg-[#F4F7FE] dark:bg-black/20 p-3 rounded-2xl transition-colors">
                <p className="text-[10px] text-gray-400 font-bold mb-1 tracking-wider">{t('age')}</p>
                <p className="text-sm font-bold text-[#2B3674] dark:text-white">{calculateAge(member.birthDate)} {t('years')}</p>
            </div>
            <div className="bg-[#F4F7FE] dark:bg-black/20 p-3 rounded-2xl transition-colors">
                <p className="text-[10px] text-gray-400 font-bold mb-1 tracking-wider">{t('role')}</p>
                <p className="text-sm font-bold text-[#2B3674] dark:text-white truncate">{Array.isArray(member.role) ? member.role[0] : member.role}</p>
            </div>
        </div>

        {/* Contact Info (Compact) */}
        <div className="w-full space-y-2 mb-8">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 justify-center">
                <span>📧</span>
                <span className="truncate max-w-[150px]">{member.email || t('no_email')}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 justify-center">
                <span>📱</span>
                <span>{member.phone || t('no_number')}</span>
            </div>
        </div>

        {/* Actions Backdrop Hover */}
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <button
                onClick={getMessageModal}
                className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-[#4318FF] rounded-xl hover:bg-[#4318FF] hover:text-white transition-all transform active:scale-95"
            >
                <MessageIcon />
            </button>
            <button
                onClick={onEdit}
                className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
                onClick={onDelete}
                className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all transform active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </div>
);


