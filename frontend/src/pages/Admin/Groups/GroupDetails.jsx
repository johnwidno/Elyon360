import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ActivityList from './components/ActivityList';
import ActivityModal from './components/ActivityModal';

export default function GroupDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]); // Members of the group
    const [allMembers, setAllMembers] = useState([]); // All members in church (for selection)

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedRole, setSelectedRole] = useState('membre');
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [statusChangedAt, setStatusChangedAt] = useState(new Date().toISOString().split('T')[0]);
    const [memberSearch, setMemberSearch] = useState('');
    const [joinedAt, setJoinedAt] = useState(new Date().toISOString().split('T')[0]);

    // Status filter
    const [statusFilter, setStatusFilter] = useState('all');

    // Edit member modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMemberId, setEditMemberId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        role: '',
        status: '',
        statusChangedAt: '',
        joinedAt: ''
    });

    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [activeSection, setActiveSection] = useState('members'); // members, activities
    const [activities, setActivities] = useState([]);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [initialActivityTab, setInitialActivityTab] = useState('details');

    // Calculate member statistics
    const memberStats = {
        total: members.length,
        active: members.filter(m => m.group_member?.status === 'active').length,
        inactive: members.filter(m => m.group_member?.status === 'inactive').length,
        paused: members.filter(m => m.group_member?.status === 'paused').length
    };

    const fetchGroupData = async () => {
        try {
            const res = await api.get(`/groups/${id}/members`);
            setGroup(res.data);
            setMembers(res.data.groupMembers || []);
        } catch (error) {
            console.error("Erreur chargement groupe details:", error);
            navigate('/admin/groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await api.get(`/groups/${id}/activities`);
            setActivities(res.data);
        } catch (error) {
            console.error("Error fetching activities:", error);
        }
    };

    const fetchAllMembers = async () => {
        try {
            const res = await api.get('/members');
            setAllMembers(res.data);
        } catch (error) {
            console.error("Erreur chargement liste membres:", error);
        }
    };

    useEffect(() => {
        fetchGroupData();
        fetchAllMembers();
        fetchActivities();
    }, [id]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/members`, {
                userId: selectedMember,
                role: selectedRole,
                status: selectedStatus,
                statusChangedAt: statusChangedAt,
                joinedAt: joinedAt
            });
            setAlertMessage({ show: true, title: t('success'), message: t('member_added_success'), type: 'success' });
            setShowAddModal(false);
            setSelectedMember('');
            setSelectedRole('membre');
            setSelectedStatus('active');
            setStatusChangedAt(new Date().toISOString().split('T')[0]);
            fetchGroupData(); // Refresh list
        } catch (error) {
            setAlertMessage({
                show: true,
                title: t('error'),
                message: error.response?.data?.message || t('operation_error'),
                type: 'error'
            });
        }
    };

    const confirmRemoveMember = (userId) => {
        setDeleteId(userId);
        setShowDeleteModal(true);
    };

    const handleRemoveMember = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/groups/${id}/members/${deleteId}`);
            setMembers(members.filter(m => m.id !== deleteId));
            setAlertMessage({ show: true, title: t('success'), message: t('member_removed_success'), type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const handleEditMember = (member) => {
        setEditMemberId(member.id);
        setEditFormData({
            role: member.group_member?.role || 'membre',
            status: member.group_member?.status || 'active',
            statusChangedAt: member.group_member?.statusChangedAt ? new Date(member.group_member.statusChangedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            joinedAt: member.group_member?.joinedAt ? new Date(member.group_member.joinedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowEditModal(true);
    };

    const handleUpdateMember = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/groups/${id}/members/${editMemberId}`, editFormData);
            setAlertMessage({ show: true, title: t('success'), message: t('member_updated_success', 'Membre mis à jour avec succès'), type: 'success' });
            setShowEditModal(false);
            fetchGroupData();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title and Group Info
        doc.setFontSize(22);
        doc.setTextColor(43, 54, 116); // #2B3674
        doc.text(group.name, 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${t('generated_on')}: ${new Date().toLocaleDateString()}`, 14, 28);

        // Summary Box
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 35, 180, 25, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`${t('total')}: ${memberStats.total}`, 20, 45);
        doc.text(`${t('active')}: ${memberStats.active}`, 20, 52);
        doc.text(`${t('inactive')}: ${memberStats.inactive}`, 70, 45);
        doc.text(`${t('paused')}: ${memberStats.paused}`, 70, 52);

        // Table Data
        const tableBody = members.map(m => [
            m.memberCode || '-',
            `${m.firstName} ${m.lastName}`,
            m.email,
            m.phone || '-',
            m.group_member?.role,
            m.group_member?.status === 'active' ? t('active') : m.group_member?.status === 'inactive' ? t('inactive') : t('paused'),
            m.group_member?.joinedAt ? new Date(m.group_member.joinedAt).toLocaleDateString() : '-'
        ]);

        doc.autoTable({
            head: [[t('code', 'Code'), t('name'), t('email'), t('phone', 'Téléphone'), t('role'), t('status'), t('joined_date')]],
            body: tableBody,
            startY: 70,
            theme: 'striped',
            headStyles: { fillColor: [43, 54, 116] },
            styles: { fontSize: 9 }
        });

        doc.save(`${group.name}_report_${new Date().getTime()}.pdf`);
    };

    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();

        const createSheet = (data, sheetName) => {
            const formattedData = data.map(m => ({
                [t('code', 'Code')]: m.memberCode || '-',
                [t('name')]: `${m.firstName} ${m.lastName}`,
                [t('email')]: m.email,
                [t('phone', 'Téléphone')]: m.phone || '-',
                [t('role')]: m.group_member?.role,
                [t('status')]: m.group_member?.status,
                [t('joined_date')]: m.group_member?.joinedAt ? new Date(m.group_member.joinedAt).toLocaleDateString() : '-'
            }));
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        };

        // Sheet 1: Active
        createSheet(members.filter(m => m.group_member?.status === 'active'), t('active'));

        // Sheet 2: Inactive
        createSheet(members.filter(m => m.group_member?.status === 'inactive'), t('inactive'));

        // Sheet 3: Paused
        createSheet(members.filter(m => m.group_member?.status === 'paused'), t('paused'));

        // Sheet 4: All
        createSheet(members, t('all'));

        XLSX.writeFile(workbook, `${group.name}_export_${new Date().getTime()}.xlsx`);
    };

    const handleStatusToggle = async () => {
        try {
            const newStatus = group.status === 'active' ? 'inactive' : 'active';
            await api.put(`/groups/${id}`, { status: newStatus });
            setGroup({ ...group, status: newStatus });
            setAlertMessage({ show: true, title: t('success'), message: t('status_updated', 'Statut mis à jour'), type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    // Activity Handlers
    const handleSaveActivity = async (activityData) => {
        try {
            if (selectedActivity) {
                await api.put(`/groups/${id}/activities/${selectedActivity.id}`, activityData);
                setAlertMessage({ show: true, title: t('success'), message: "Activité mise à jour", type: 'success' });
            } else {
                await api.post(`/groups/${id}/activities`, activityData);
                setAlertMessage({ show: true, title: t('success'), message: "Activité créée", type: 'success' });
            }
            setShowActivityModal(false);
            fetchActivities();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm(t('confirm_delete'))) return;
        try {
            await api.delete(`/groups/${id}/activities/${activityId}`);
            setAlertMessage({ show: true, title: t('success'), message: "Activité supprimée", type: 'success' });
            fetchActivities();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleAddParticipant = async (payload) => {
        try {
            await api.post(`/groups/${id}/activities/${selectedActivity.id}/participants`, payload);

            // Refresh single activity
            const res = await api.get(`/groups/${id}/activities/${selectedActivity.id}`);
            setSelectedActivity(res.data);
            fetchActivities(); // Refresh list to update counts
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: error.response?.data?.message || t('operation_error'), type: 'error' });
        }
    };

    const handleRemoveParticipant = async (activityId, userId) => {
        try {
            await api.delete(`/groups/${id}/activities/${activityId}/participants/${userId}`);
            // Refresh single activity
            const res = await api.get(`/groups/${id}/activities/${selectedActivity.id}`);
            setSelectedActivity(res.data);
            fetchActivities();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleUpdateParticipant = async (activityId, userId, status) => {
        try {
            await api.put(`/groups/${id}/activities/${activityId}/participants/${userId}`, { status });
            // Refresh single activity
            const res = await api.get(`/groups/${id}/activities/${selectedActivity.id}`);
            setSelectedActivity(res.data);
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">{t('loading')}</div>
        </AdminLayout>
    );

    if (!group) return null;

    // Filter out members already in the group
    const availableMembers = allMembers.filter(m => !members.some(gm => gm.id === m.id));

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/groups')}
                            className="p-4 text-gray-400 hover:text-indigo-600 bg-white dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-black border border-gray-100 dark:border-white/5 rounded-2xl transition-all shadow-sm active:scale-95"
                            title={t('back_to_groups')}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{group.name}</h1>
                                <button
                                    onClick={handleStatusToggle}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${group.status === 'active'
                                        ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                                        }`}
                                >
                                    {group.status === 'active' ? t('active') : t('inactive', 'Inactif')}
                                </button>
                            </div>
                            <div className="flex gap-4 items-center">
                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-100 dark:border-white/10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                    {t(`group_type_${group.type}`) || group.type}
                                </span>
                                {group.leaderName && (
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <span>👤</span> {group.leaderName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold text-[13px] rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        {t('add_member_to_group', 'Ajouter un membre')}
                    </button>
                </div>

                {/* Description Grid */}
                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 mb-8 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('about')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl">{group.description || t('no_description')}</p>

                    <div className="flex gap-8 mt-6 pt-6 border-t border-gray-50 dark:border-white/5">
                        <div className="text-sm">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('meeting_day')}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{group.meetingDay || '-'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('meeting_time')}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{group.meetingTime || '-'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('members_count')}</span>
                            <div className="flex gap-3">
                                <span className="font-semibold text-gray-900 dark:text-white">{memberStats.total} total</span>
                                <span className="text-green-600 dark:text-green-400">({memberStats.active} actifs)</span>
                                <span className="text-red-600 dark:text-red-400">({memberStats.inactive} inactifs)</span>
                                <span className="text-yellow-600 dark:text-yellow-400">({memberStats.paused} pause)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-1">
                    <button
                        onClick={() => setActiveSection('members')}
                        className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${activeSection === 'members'
                            ? 'border-indigo-600 text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-indigo-900/10'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('group_members', 'Membres du Groupe')}
                    </button>
                    <button
                        onClick={() => setActiveSection('activities')}
                        className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${activeSection === 'activities'
                            ? 'border-indigo-600 text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-indigo-900/10'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('group_activities', 'Activités')}
                    </button>
                </div>

                {/* Members List */}
                {activeSection === 'members' && (
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('group_members', 'Membres du Groupe')}</h2>

                                {/* Status Filter Segment and Export Buttons */}
                                <div className="flex gap-2">
                                    <div className="flex gap-1 bg-gray-50 dark:bg-black/40 p-1 rounded-xl">
                                        {['all', 'active', 'inactive', 'paused'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === status
                                                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                                    }`}
                                            >
                                                {t(status === 'all' ? 'all' : status === 'active' ? 'active' : status === 'inactive' ? 'inactive' : 'paused', status === 'all' ? 'Tout' : status === 'active' ? 'Actif' : status === 'inactive' ? 'Inactif' : 'Mise en pause')}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleExportExcel}
                                        className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 384 512"><path d="M48 448V64c0-8.8 7.2-16 16-16H224v80c0 17.7 14.3 32 32 32h80V448c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16zM64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V154.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0H64zm90.9 233.3c-8.1-10.5-23.2-12.3-33.7-4.2s-12.3 23.2-4.2 33.7L161.6 320l-44.5 57.3c-8.1 10.5-6.3 25.5 4.2 33.7s25.5 6.3 33.7-4.2L192 359.1l37.1 47.6c8.1 10.5 23.2 12.3 33.7 4.2s12.3-23.2 4.2-33.7L222.4 320l44.5-57.3c8.1-10.5 6.3-25.5-4.2-33.7s-25.5-6.3-33.7 4.2L192 280.9l-37.1-47.6z" /></svg>
                                        Excel
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 384 512"><path d="M64 464c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16H224v80c0 17.7 14.3 32 32 32h80V448c0 8.8-7.2 16-16 16H64zM64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V154.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0H64zM112 256c-8.8 0-16 7.2-16 16s7.2 16 16 16h48c8.8 0 16-7.2 16-16s-7.2-16-16-16H112zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16h80c8.8 0 16-7.2 16-16s-7.2-16-16-16H112zm0-192c-8.8 0-16 7.2-16 16s7.2 16 16 16h48c8.8 0 16-7.2 16-16s-7.2-16-16-16H112z" /></svg>
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {members.filter(m => statusFilter === 'all' || m.group_member?.status === statusFilter).length === 0 ? (
                            <div className="p-12 text-center text-gray-400 text-sm font-medium">{t('no_members_in_group')}</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('member_code', 'Code')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('member')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('role')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('phone', 'Téléphone')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('status', 'Statut')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('joined_date')}</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-semibold text-gray-500">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {members.filter(m => statusFilter === 'all' || m.group_member?.status === statusFilter).map(member => (
                                        <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-6 py-4 text-[13px] font-medium text-gray-600 dark:text-gray-400">
                                                {member.memberCode || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                                                        {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-500">{member.firstName[0]}</span>}
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => navigate(`/admin/members/${member.id}`)}
                                                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-[13px]"
                                                        >
                                                            {member.firstName} {member.lastName}
                                                        </button>
                                                        <div className="text-[11px] text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase">
                                                    {member.group_member?.role || 'Membre'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[12px] text-gray-600 dark:text-gray-400 font-medium">
                                                {member.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${member.group_member?.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                                    member.group_member?.status === 'inactive' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                                        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                                                    }`}>
                                                    {member.group_member?.status === 'active' ? t('active', 'Actif') :
                                                        member.group_member?.status === 'inactive' ? t('inactive', 'Inactif') :
                                                            t('paused', 'Mise en pause')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-gray-400">
                                                {member.group_member?.joinedAt ? new Date(member.group_member.joinedAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditMember(member)}
                                                        className="text-indigo-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-medium text-xs"
                                                    >
                                                        {t('edit', 'Modifier')}
                                                    </button>
                                                    <button
                                                        onClick={() => confirmRemoveMember(member.id)}
                                                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium text-xs"
                                                    >
                                                        {t('remove', 'Retirer')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Activities Section */}
                {activeSection === 'activities' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('group_activities', 'Activités du Groupe')}</h2>
                                <p className="text-sm text-gray-500 mt-1">{t('manage_activities_desc', 'Gérez les événements et activités du groupe')}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedActivity(null); setInitialActivityTab('details'); setShowActivityModal(true); }}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                {t('create_activity', 'Créer une activité')}
                            </button>
                        </div>
                        <ActivityList
                            activities={activities}
                            onEdit={(a) => { setSelectedActivity(a); setInitialActivityTab('details'); setShowActivityModal(true); }}
                            onDelete={handleDeleteActivity}
                            onView={(a) => { setSelectedActivity(a); setInitialActivityTab('details'); setShowActivityModal(true); }}
                            onViewParticipants={(a) => { setSelectedActivity(a); setInitialActivityTab('participants'); setShowActivityModal(true); }}
                        />
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[160] overflow-y-auto noscrollbar">
                    <div className="flex items-center justify-center min-h-screen p-4 text-center">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowAddModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full border border-gray-100 dark:border-white/10 relative z-10">
                            <form onSubmit={handleAddMember} className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('add_member_to_group')}</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('select_member')}</label>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder={t('search_member', 'Rechercher un membre...')}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                            />
                                            <select
                                                value={selectedMember}
                                                onChange={(e) => setSelectedMember(e.target.value)}
                                                required
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">{t('choose_member', 'Choisir un membre...')}</option>
                                                {availableMembers
                                                    .filter(m => {
                                                        const q = memberSearch.toLowerCase();
                                                        return m.firstName.toLowerCase().includes(q) ||
                                                            m.lastName.toLowerCase().includes(q) ||
                                                            m.email.toLowerCase().includes(q) ||
                                                            (m.memberCode && m.memberCode.toLowerCase().includes(q));
                                                    })
                                                    .map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.firstName} {m.lastName} {m.memberCode && `(${m.memberCode})`} - {m.email}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('role_in_group')}</label>
                                            <select
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="membre">{t('member', 'Membre')}</option>
                                                <option value="responsable">{t('leader', 'Responsable')}</option>
                                                <option value="assistant">{t('assistant', 'Assistant')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('adhesion_date', "Date d'adhésion")}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]"
                                                value={joinedAt}
                                                onChange={(e) => setJoinedAt(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Status and Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('member_status', 'Statut Membre')}</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="active">{t('active', 'Actif')}</option>
                                                <option value="inactive">{t('inactive', 'Inactif')}</option>
                                                <option value="paused">{t('paused', 'Mise en pause')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('status_changed_date', 'Date Changement')}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]"
                                                value={statusChangedAt}
                                                onChange={(e) => setStatusChangedAt(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transaction-all">{t('cancel')}</button>
                                    <button type="submit" disabled={!selectedMember} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('add')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[160] overflow-y-auto noscrollbar">
                    <div className="flex items-center justify-center min-h-screen p-4 text-center">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowEditModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full border border-gray-100 dark:border-white/10 relative z-10">
                            <form onSubmit={handleUpdateMember} className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('edit_member', 'Modifier le membre')}</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('role_in_group')}</label>
                                            <select
                                                value={editFormData.role}
                                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="membre">{t('member', 'Membre')}</option>
                                                <option value="responsable">{t('leader', 'Responsable')}</option>
                                                <option value="assistant">{t('assistant', 'Assistant')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('adhesion_date')}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]"
                                                value={editFormData.joinedAt}
                                                onChange={(e) => setEditFormData({ ...editFormData, joinedAt: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('member_status')}</label>
                                            <select
                                                value={editFormData.status}
                                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="active">{t('active', 'Actif')}</option>
                                                <option value="inactive">{t('inactive', 'Inactif')}</option>
                                                <option value="paused">{t('paused', 'Mise en pause')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t('status_changed_date')}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]"
                                                value={editFormData.statusChangedAt}
                                                onChange={(e) => setEditFormData({ ...editFormData, statusChangedAt: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transaction-all">{t('cancel')}</button>
                                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition-all">{t('save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {showActivityModal && (
                <ActivityModal
                    activity={selectedActivity}
                    onClose={() => setShowActivityModal(false)}
                    onSave={handleSaveActivity}
                    onAddParticipant={handleAddParticipant}
                    onRemoveParticipant={handleRemoveParticipant}
                    onUpdateParticipant={handleUpdateParticipant}
                    members={allMembers}
                    initialTab={initialActivityTab}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleRemoveMember}
                title={t('remove_member_title')}
                message={t('remove_member_confirm')}
            />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </AdminLayout>
    );
}
