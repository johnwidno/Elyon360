import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import SearchableSelect from '../../../components/SearchableSelect';
import { useLanguage } from '../../../context/LanguageContext';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

export default function Groups() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [showModal, setShowModal] = useState(false);

    // Member Addition Modal States
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedRole, setSelectedRole] = useState('membre');
    const [memberSearch, setMemberSearch] = useState('');
    const [joinedAt, setJoinedAt] = useState(new Date().toISOString().split('T')[0]);

    // Custom Modals
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'ministry',
        leaderId: '',
        leaderName: '',
        meetingDay: '',
        meetingTime: ''
    });

    // For leader selection
    const [allMembersForLeader, setAllMembersForLeader] = useState([]);

    const [filteredGroups, setFilteredGroups] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        type: ''
    });

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups');
            setGroups(response.data);
            setFilteredGroups(response.data);
        } catch (error) {
            console.error("Erreur chargement groupes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        let result = [...groups];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(g =>
                g.name.toLowerCase().includes(q) ||
                (g.leaderName && g.leaderName.toLowerCase().includes(q))
            );
        }
        if (filters.type) {
            result = result.filter(g => g.type === filters.type);
        }
        setFilteredGroups(result);
    }, [filters, groups]);

    const stats = useMemo(() => ({
        total: groups.length,
        ministry: groups.filter(g => g.type === 'ministry').length,
        cell: groups.filter(g => g.type === 'cell').length,
        department: groups.filter(g => g.type === 'department').length
    }), [groups]);

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/groups/${deleteId}`);
            setGroups(groups.filter(g => g.id !== deleteId));
            setAlertMessage({ show: true, title: t('success'), message: t('group_deleted_success'), type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('delete_error'), type: 'error' });
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const [editId, setEditId] = useState(null);

    const handleEdit = async (group) => {
        setFormData({
            name: group.name,
            description: group.description,
            type: group.type,
            leaderId: '',
            leaderName: group.leaderName,
            meetingDay: group.meetingDay,
            meetingTime: group.meetingTime
        });
        setEditId(group.id);
        // Fetch members for leader selection
        try {
            const res = await api.get('/members');
            setAllMembersForLeader(res.data);
        } catch (err) {
            console.error('Error fetching members:', err);
        }
        setShowModal(true);
    };

    const handleCreate = async () => {
        setFormData({ name: '', description: '', type: 'ministry', leaderId: '', leaderName: '', meetingDay: '', meetingTime: '' });
        setEditId(null);
        // Fetch members for leader selection
        try {
            const res = await api.get('/members');
            setAllMembersForLeader(res.data);
        } catch (err) {
            console.error('Error fetching members:', err);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/groups/${editId}`, formData);
                fetchGroups();
                setAlertMessage({ show: true, title: t('success'), message: t('group_updated_success'), type: 'success' });
            } else {
                await api.post('/groups', formData);
                fetchGroups();
                setAlertMessage({ show: true, title: t('success'), message: t('group_created_success'), type: 'success' });
            }
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', description: '', type: 'ministry', leaderName: '', meetingDay: '', meetingTime: '' });
        } catch (error) {
            console.error("Group Op Error:", error);
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenAddMember = async (groupId) => {
        setSelectedGroupId(groupId);
        setShowAddMemberModal(true);
        setMemberSearch('');
        setJoinedAt(new Date().toISOString().split('T')[0]);
        // Fetch members only when needed
        try {
            const res = await api.get('/members');
            setAllMembers(res.data);
        } catch (error) {
            console.error("Erreur chargement membres:", error);
        }
    };

    const handleAddMemberSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${selectedGroupId}/members`, {
                userId: selectedMember,
                role: selectedRole,
                joinedAt: joinedAt
            });
            setAlertMessage({ show: true, title: t('success'), message: t('member_added_success'), type: 'success' });
            setShowAddMemberModal(false);
            setSelectedMember('');
            setSelectedRole('membre');
            setSelectedGroupId(null);
        } catch (error) {
            setAlertMessage({
                show: true,
                title: t('error'),
                message: error.response?.data?.message || t('operation_error'),
                type: 'error'
            });
        }
    };

    const handleExportPDF = () => {
        const headers = [t('group_name'), t('type'), t('responsible'), t('meeting')];
        const data = filteredGroups.map(g => [
            g.name,
            t(`group_type_${g.type}`) || g.type,
            g.leaderName || '-',
            g.meetingDay ? `${g.meetingDay} ${g.meetingTime}` : '-'
        ]);
        exportToPDF(t('groups_list'), headers, data);
    };

    const handleExportExcel = () => {
        const data = filteredGroups.map(g => ({
            [t('group_name')]: g.name,
            [t('type')]: t(`group_type_${g.type}`) || g.type,
            [t('responsible')]: g.leaderName || '-',
            [t('meeting')]: g.meetingDay ? `${g.meetingDay} ${g.meetingTime}` : '-'
        }));
        exportToExcel(t('groups_list'), data);
    };

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 transition-colors">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-4 text-gray-400 hover:text-indigo-600 bg-white dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-black border border-gray-100 dark:border-white/5 rounded-2xl transition-all shadow-sm active:scale-95"
                            title={t('back_to_dashboard')}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{t('groups_ministries')}</h1>
                            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2">{t('groups_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold text-[13px] rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        {t('new_group')}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label={t('total_groups')} value={stats.total} icon="📊" color="text-indigo-600" bg="bg-indigo-50" />
                    <StatCard label={t('ministries')} value={stats.ministry} icon="🙏" color="text-purple-600" bg="bg-purple-50" />
                    <StatCard label={t('cells')} value={stats.cell} icon="🏠" color="text-green-600" bg="bg-green-50" />
                    <StatCard label={t('departments')} value={stats.department} icon="🏢" color="text-blue-600" bg="bg-blue-50" />
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                    {/* Row 1: Filters */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex flex-nowrap items-center gap-3 overflow-x-auto noscrollbar transition-colors bg-white/50 dark:bg-black/20">
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
                        <select
                            className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-400 outline-none transition-all cursor-pointer appearance-none"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">{t('all_types')}</option>
                            <option value="ministry">{t('ministries')}</option>
                            <option value="cell">{t('cells')}</option>
                            <option value="department">{t('departments')}</option>
                        </select>
                    </div>

                    {/* Row 2: Controls */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between gap-4 transition-colors bg-white dark:bg-[#1A1A1A]">
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

                    {/* Data Display */}
                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">{t('loading')}</div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">{t('no_groups_found')}</div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('group_name')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('type')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('responsible')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('meeting')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500">{t('member_count', 'Membres')}</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-semibold text-gray-500">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {filteredGroups.map(group => (
                                        <tr key={group.id} onClick={() => navigate(`/admin/groups/${group.id}`)} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                        {group.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white text-[13px]">{group.name}</div>
                                                        <div className="text-[11px] text-gray-500">{group.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 uppercase">
                                                    {t(`group_type_${group.type}`) || group.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                                {group.leaderName || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                                {group.meetingDay} {group.meetingTime && `${t('at', 'à')} ${group.meetingTime}`}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                                                    {group.memberCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleEdit(group)} className="p-2 text-gray-400 hover:text-blue-600 transition-all" title={t('edit')}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/groups/${group.id}`); }} className="p-2 text-gray-400 hover:text-indigo-600 transition-all" title={t('view_members')}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenAddMember(group.id); }} className="p-2 text-gray-400 hover:text-green-600 transition-all" title={t('add_member')}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                                    </button>
                                                    <button onClick={() => confirmDelete(group.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredGroups.map(group => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    t={t}
                                    onEdit={(e) => { e.stopPropagation(); handleEdit(group); }}
                                    onDelete={(e) => { e.stopPropagation(); confirmDelete(group.id); }}
                                    onClick={() => navigate(`/admin/groups/${group.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto noscrollbar transition-all">
                    <div className="flex items-center justify-center min-h-screen p-4 text-center">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg w-full border border-gray-100 dark:border-white/10 transition-colors relative z-10">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 transition-colors leading-none tracking-tight">
                                    {editId ? t('edit_group') : t('add_group_ministry')}
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('group_name')}</label>
                                        <input type="text" name="name" placeholder={t('group_name_placeholder')} required onChange={handleChange} value={formData.name} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('description')}</label>
                                        <textarea name="description" placeholder={t('group_description_placeholder')} rows="2" onChange={handleChange} value={formData.description} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('type')}</label>
                                        <select name="type" onChange={handleChange} value={formData.type} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none">
                                            <option value="ministry">{t('group_type_ministry')}</option>
                                            <option value="cell">{t('group_type_cell')}</option>
                                            <option value="department">{t('group_type_department')}</option>
                                            <option value="other">{t('group_type_other')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('responsible_name')}</label>
                                        <SearchableSelect
                                            options={allMembersForLeader.map(m => ({
                                                id: m.id,
                                                name: `${m.firstName} ${m.lastName} ${m.memberCode ? `(${m.memberCode})` : ''}`
                                            }))}
                                            value={formData.leaderId}
                                            onChange={(id) => {
                                                const leader = allMembersForLeader.find(m => m.id === id);
                                                setFormData({
                                                    ...formData,
                                                    leaderId: id,
                                                    leaderName: leader ? `${leader.firstName} ${leader.lastName}` : ''
                                                });
                                            }}
                                            placeholder={t('select_group_leader', 'Select group leader...')}
                                            displayKey="name"
                                            valueKey="id"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('meeting_day')}</label>
                                            <input type="text" name="meetingDay" placeholder={t('meeting_day_placeholder')} onChange={handleChange} value={formData.meetingDay} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('meeting_time')}</label>
                                            <input type="time" name="meetingTime" onChange={handleChange} value={formData.meetingTime} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 outline-none">{t('cancel')}</button>
                                    <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[12px] font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 outline-none">{editId ? t('save') : t('create')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal (Quick Add) */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-[160] overflow-y-auto noscrollbar">
                    <div className="flex items-center justify-center min-h-screen p-4 text-center">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowAddMemberModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full border border-gray-100 dark:border-white/10 relative z-10">
                            <form onSubmit={handleAddMemberSubmit} className="p-8">
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
                                                {allMembers
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
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-6 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transaction-all">{t('cancel')}</button>
                                    <button type="submit" disabled={!selectedMember} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('add')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title={t('delete_group_title')}
                message={t('delete_group_confirm')}
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

// Helper Components
const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-[20px] p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-100 dark:border-white/5 group">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} dark:bg-black/40 flex items-center justify-center text-xl shadow-sm border border-transparent dark:border-white/5 transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">{label}</div>
            </div>
        </div>
    </div>
);

const GroupCard = ({ group, t, onEdit, onDelete, onClick }) => (
    <div onClick={onClick} className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group relative cursor-pointer">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center text-2xl shadow-sm">
                {group.type === 'ministry' ? '🙏' : group.type === 'cell' ? '🏠' : group.type === 'department' ? '🏢' : '👥'}
            </div>
            <span className="px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 uppercase">
                {t(`group_type_${group.type}`) || group.type}
            </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{group.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8">{group.description}</p>

        <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>👤</span>
                <span className="font-semibold">{group.leaderName || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>⏰</span>
                <span>{group.meetingDay} {group.meetingTime}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>👥</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{group.memberCount || 0} {t('member_count', 'Membres')}</span>
            </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-white/5 pt-4">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 transition-all hover:bg-white dark:hover:bg-white/5 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-all hover:bg-white dark:hover:bg-white/5 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </div>
);
