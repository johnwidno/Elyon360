import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';
import * as XLSX from 'xlsx';

export default function SundaySchoolClasses() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [memberCategories, setMemberCategories] = useState([]);

    const [form, setForm] = useState({
        name: '',
        description: '',
        minAge: '',
        maxAge: '',
        maritalStatus: 'any',
        baptismalStatus: 'any',
        memberCategoryId: '',
        gender: 'any',
        activeOnly: false,
        isDynamic: true
    });

    const fetchClasses = async () => {
        try {
            const res = await api.get('/sunday-school/classes');
            setClasses(res.data);
        } catch (error) {
            console.error("Fetch classes error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
        const fetchCategories = async () => {
            try {
                const res = await api.get('/member-categories');
                setMemberCategories(res.data);
            } catch (err) {
                console.error("Error fetching categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleExportExcel = () => {
        const data = filteredClasses.map(cls => ({
            [t('class_name')]: cls.name,
            [t('description')]: cls.description || '-',
            [t('age_group')]: cls.isDynamic ? `${cls.minAge || 0}-${cls.maxAge || '+'} ans` : t('manual'),
            [t('gender')]: t(cls.gender),
            [t('members_count')]: cls.classMembers?.length || 0,
            [t('created_at')]: new Date(cls.createdAt).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Classes");
        XLSX.writeFile(wb, `Classes_SundaySchool_${new Date().getFullYear()}.xlsx`);
    };

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cls.description && cls.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const createdAt = new Date(cls.createdAt);
        const start = dateRange.start ? new Date(dateRange.start) : null;
        let end = dateRange.end ? new Date(dateRange.end) : null;

        // Include full end day
        if (end) end.setHours(23, 59, 59, 999);

        const matchesDate = (!start || createdAt >= start) && (!end || createdAt <= end);

        return matchesSearch && matchesDate;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/sunday-school/classes/${editId}`, form);
                setAlertMessage({ show: true, title: t('success'), message: t('class_updated_success'), type: 'success' });
            } else {
                await api.post('/sunday-school/classes', form);
                setAlertMessage({ show: true, title: t('success'), message: t('class_created_success'), type: 'success' });
            }
            setShowModal(false);
            fetchClasses();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete', 'Voulez-vous vraiment supprimer cette classe ?'))) return;
        try {
            await api.delete(`/sunday-school/classes/${id}`);
            fetchClasses();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('delete_error'), type: 'error' });
        }
    };

    const handleEdit = (cls) => {
        setEditId(cls.id);
        setForm({
            name: cls.name,
            description: cls.description || '',
            minAge: cls.minAge || '',
            maxAge: cls.maxAge || '',
            maritalStatus: cls.maritalStatus,
            baptismalStatus: cls.baptismalStatus,
            memberCategoryId: cls.memberCategoryId || '',
            gender: cls.gender,
            activeOnly: cls.activeOnly,
            isDynamic: cls.isDynamic
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditId(null);
        setForm({
            name: '',
            description: '',
            minAge: '',
            maxAge: '',
            maritalStatus: 'any',
            baptismalStatus: 'any',
            memberCategoryId: '',
            gender: 'any',
            activeOnly: false,
            isDynamic: true
        });
    };

    return (
        <AdminLayout>
            {/* Row 1: Header & New Class Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                        {t('sunday_school')} - <span className="text-indigo-600 dark:text-indigo-400">{t('classes')}</span>
                        <span className="ml-3 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/20 font-bold align-middle">
                            {filteredClasses.length} {t('records', 'Records')}
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-2">
                        {t('classes_management_desc', 'Gérez les classes et leurs critères d\'éligibilité.')}
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="shrink-0 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition active:scale-95 flex items-center gap-3 shadow-xl shadow-indigo-100 dark:shadow-none font-black text-[11px] uppercase tracking-widest"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    {t('new_class')}
                </button>
            </div>

            {/* Row 2: Controls Cluster (Toggle, Search, Date, Excel) - Forced Single Row for LG+ */}
            <div className="bg-white dark:bg-[#1A1A1A] p-3 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm mb-10 flex flex-wrap lg:flex-nowrap items-center gap-4">
                {/* 1. View Toggle */}
                <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    </button>
                </div>

                {/* 2. Search Field */}
                <div className="relative flex-1 min-w-[200px]">
                    <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    <input
                        type="text"
                        placeholder={t('search_classes', 'Rechercher une classe...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0D0D0D] border-none rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                </div>

                {/* 3. Date Range Selector */}
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0D0D0D] px-4 py-2.5 rounded-xl shrink-0">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent border-none text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase outline-none"
                    />
                    <span className="text-gray-300 font-bold">→</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent border-none text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase outline-none"
                    />
                </div>

                {/* 4. Action: Excel Export */}
                <button
                    onClick={handleExportExcel}
                    className="shrink-0 bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition active:scale-95 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                    Excel
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="p-20 text-center bg-gray-50/50 dark:bg-black/20 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/5">
                    <div className="bg-white dark:bg-[#1A1A1A] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('no_classes_found')}</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">{searchTerm ? t('no_match_search', 'Aucune classe ne correspond à votre recherche.') : t('no_classes_desc', 'Commencez par créer votre première classe d\'école du dimanche.')}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((cls) => (
                        <div key={cls.id} className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm group hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{cls.name}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(cls)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></button>
                                    <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">{cls.description || t('no_description', 'Aucune description.')}</p>

                            <div className="space-y-3 pt-6 border-t border-gray-50 dark:border-white/5">
                                <div
                                    onClick={() => navigate(`/admin/sunday-school/classes/${cls.id}`)}
                                    className="flex justify-between text-[11px] font-bold uppercase tracking-wider cursor-pointer group/members hover:bg-indigo-50 dark:hover:bg-white/5 p-2 rounded-xl transition-all"
                                >
                                    <span className="text-gray-400 group-hover/members:text-indigo-500 transition-colors">{t('members')}</span>
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <span>{cls.classMembers?.length || 0}</span>
                                        <svg className="w-3 h-3 translate-y-[0.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider px-2">
                                    <span className="text-gray-400">{t('criteria', 'Critères')}</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {cls.isDynamic ? `${cls.minAge || 0}-${cls.maxAge || '+'} ans` : t('manual', 'Manuel')}
                                        </span>
                                        <div className="flex flex-wrap justify-end gap-1 mt-1">
                                            {cls.gender !== 'any' && (
                                                <span className="text-[9px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-500 uppercase tracking-tighter">
                                                    {t(cls.gender)}
                                                </span>
                                            )}
                                            {cls.activeOnly && (
                                                <span className="text-[9px] bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded text-green-600 dark:text-green-400 uppercase tracking-tighter font-bold">
                                                    {t('active_only', 'Actifs')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-8 py-6">{t('class_name')}</th>
                                <th className="px-8 py-6">{t('age_group')}</th>
                                <th className="px-8 py-6">{t('criteria', 'Critères')}</th>
                                <th className="px-8 py-6">{t('members')}</th>
                                <th className="px-8 py-6">{t('status')}</th>
                                <th className="px-8 py-6 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {filteredClasses.map((cls) => (
                                <tr key={cls.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{cls.name}</span>
                                            <span className="text-[11px] text-gray-400 line-clamp-1">{cls.description || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                                {cls.isDynamic ? `${cls.minAge || 0}-${cls.maxAge || '+'} ans` : t('manual', 'Manuel')}
                                            </span>
                                            <span className="text-[10px] text-gray-400 italic">{cls.isDynamic ? t('dynamic', 'Dynamique') : t('static', 'Statique')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {cls.gender !== 'any' && (
                                                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 px-2 py-0.5 rounded uppercase font-bold">{t(cls.gender)}</span>
                                            )}
                                            {cls.memberCategoryId && (
                                                <span className="text-[9px] bg-blue-50 dark:bg-blue-900/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold">{cls.admissionCategory?.name || t('category')}</span>
                                            )}
                                            {cls.baptismalStatus !== 'any' && !cls.memberCategoryId && (
                                                <span className="text-[9px] bg-blue-50 dark:bg-blue-900/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold">{t(cls.baptismalStatus)}</span>
                                            )}
                                            {cls.maritalStatus !== 'any' && (
                                                <span className="text-[9px] bg-purple-50 dark:bg-purple-900/10 text-purple-500 px-2 py-0.5 rounded uppercase font-bold">{t(cls.maritalStatus)}</span>
                                            )}
                                            {cls.gender === 'any' && cls.baptismalStatus === 'any' && cls.maritalStatus === 'any' && (
                                                <span className="text-[9px] text-gray-400 uppercase font-medium">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button
                                            onClick={() => navigate(`/admin/sunday-school/classes/${cls.id}`)}
                                            className="bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                                        >
                                            {cls.classMembers?.length || 0} {t('members')}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cls.activeOnly ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                                            {cls.activeOnly ? t('active_only') : t('all')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(cls)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></button>
                                            <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-12">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#0D0D0D] rounded-[3rem] overflow-hidden shadow-2xl transform transition-all sm:max-w-2xl w-full z-10 border border-transparent dark:border-white/10 uppercase-none">
                            <form onSubmit={handleSubmit} className="p-12">
                                <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white tracking-tight">{editId ? t('edit_class', 'Modifier la classe') : t('create_new_class')}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('class_name')}</label>
                                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] text-gray-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all font-semibold" />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('min_age', 'Âge Min')}</label>
                                        <input type="number" value={form.minAge} onChange={e => setForm({ ...form, minAge: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('max_age', 'Âge Max')}</label>
                                        <input type="number" value={form.maxAge} onChange={e => setForm({ ...form, maxAge: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50" />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('marital_status_label')}</label>
                                        <select value={form.maritalStatus} onChange={e => setForm({ ...form, maritalStatus: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50">
                                            <option value="any">{t('any', 'Peu importe')}</option>
                                            <option value="single">{t('single', 'Célibataire')}</option>
                                            <option value="married">{t('married', 'Marié(e)')}</option>
                                            <option value="widowed">{t('widowed', 'Veuf/Veuve')}</option>
                                            <option value="divorced">{t('divorced', 'Divorcé(e)')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('category_statutory', 'Classification du Contact')}</label>
                                        <select value={form.memberCategoryId} onChange={e => setForm({ ...form, memberCategoryId: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50">
                                            <option value="">{t('any', 'Peu importe')}</option>
                                            {memberCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('gender', 'Genre')}</label>
                                        <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50">
                                            <option value="any">{t('any', 'Peu importe')}</option>
                                            <option value="male">{t('male', 'Masculin / Garçons')}</option>
                                            <option value="female">{t('female', 'Féminin / Filles')}</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 py-4">
                                        <input
                                            type="checkbox"
                                            id="activeOnly"
                                            checked={form.activeOnly}
                                            onChange={e => setForm({ ...form, activeOnly: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="activeOnly" className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                                            {t('active_only_label', 'Membres Actifs Uniquement')}
                                        </label>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('description')}</label>
                                        <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50 resize-none font-medium"></textarea>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-3xl text-[13px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="px-12 py-5 bg-indigo-600 text-white rounded-3xl text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95">
                                        {editId ? t('update_btn') : t('create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
