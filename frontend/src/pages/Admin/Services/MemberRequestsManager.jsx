import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/AuthProvider';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
    ClipboardList,
    Search,
    Filter,
    Clock,
    User,
    ChevronRight,
    MessageSquare,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Eye,
    Trash2,
    Calendar,
    ArrowRight,
    Edit3,
    StickyNote,
    UserCheck,
    Download,
    History as HistoryIcon
} from 'lucide-react';

const MemberRequestsManager = () => {
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ total: 0, pending: 0, processed: 0 });

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [internalNote, setInternalNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const requestTypes = [
        { id: 'marriage', label: t('request_marriage') },
        { id: 'baptism', label: t('request_baptism') },
        { id: 'transfer', label: t('request_transfer') },
        { id: 'member_card', label: t('request_member_card') },
        { id: 'support', label: t('request_support') },
        { id: 'ministry', label: t('request_ministry') },
        { id: 'info', label: t('request_info') },
        { id: 'reservation', label: t('request_reservation') },
        { id: 'meeting', label: t('request_meeting') },
        { id: 'other', label: t('request_other') }
    ];

    const statusOptions = [
        { id: 'non vue', label: t('status_not_viewed'), color: 'bg-rose-500', icon: <AlertCircle size={14} /> },
        { id: 'vue', label: t('status_viewed'), color: 'bg-amber-500', icon: <Eye size={14} /> },
        { id: 'traitée', label: t('status_processed'), color: 'bg-emerald-500', icon: <CheckCircle2 size={14} /> },
        { id: 'suivi approfondi', label: t('status_follow_up'), color: 'bg-indigo-500', icon: <Clock3 size={14} /> }
    ];

    useEffect(() => {
        fetchRequests();
    }, [page, filterStatus, filterType, searchTerm]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                status: filterStatus,
                type: filterType,
                search: searchTerm,
                limit: 10
            };
            const res = await api.get('/member-requests', { params });
            setRequests(res.data.data);
            setTotalPages(res.data.totalPages);
            setStats({
                total: res.data.total,
                pending: res.data.data.filter(r => r.status === 'non vue').length,
                processed: res.data.data.filter(r => r.status === 'traitée').length
            });
        } catch (error) {
            toast.error(t('error_loading_data', 'Erreur lors du chargement des données'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, newStatus, note = null) => {
        setUpdatingStatus(true);
        try {
            await api.patch(`/member-requests/${requestId}`, {
                status: newStatus,
                internalNote: note !== null ? note : undefined
            });
            toast.success(t('request_updated_success'));
            fetchRequests();
            if (selectedRequest && selectedRequest.id === requestId) {
                // Refresh the modal data too
                const refreshRes = await api.get(`/member-requests/${requestId}`);
                setSelectedRequest(refreshRes.data);
            }
        } catch (error) {
            toast.error(t('update_error', 'Erreur de mise à jour'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete', 'Voulez-vous vraiment supprimer cet élément ?'))) return;
        try {
            await api.delete(`/member-requests/${id}`);
            toast.success(t('request_deleted_success'));
            fetchRequests();
        } catch (error) {
            toast.error(t('delete_error', 'Erreur de suppression'));
        }
    };

    const exportToExcel = () => {
        if (requests.length === 0) {
            toast.error(t('no_data_to_export', 'Aucune donnée à exporter'));
            return;
        }

        const exportData = requests.map(req => ({
            [t('member')]: `${req.member?.firstName} ${req.member?.lastName}`,
            [t('email')]: req.member?.email,
            [t('phone')]: req.member?.phone,
            [t('request_title')]: req.title,
            [t('request_type')]: requestTypes.find(t => t.id === req.requestType)?.label || req.requestType,
            [t('request_status')]: statusOptions.find(o => o.id === req.status)?.label || req.status,
            [t('date')]: new Date(req.createdAt).toLocaleString(),
            [t('internal_note')]: req.internalNote || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Member Requests");
        XLSX.writeFile(wb, `Member_Requests_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(t('export_success', 'Exportation réussie'));
    };

    const StatusBadge = ({ status }) => {
        const option = statusOptions.find(o => o.id === status);
        if (!option) return null;
        return (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${option.color} shadow-sm`}>
                {option.icon}
                {option.label}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-4 sm:p-8 min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] transition-colors duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                                <ClipboardList className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                    {t('member_requests')}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {t('manage_requests_desc', 'Gérez et suivez les demandes soumises par les membres de l\'église')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm min-w-[120px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('total', 'Total')}</p>
                            <p className="text-xl font-black text-indigo-600">{stats.total}</p>
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                        >
                            <Download size={16} className="text-emerald-500" /> Excel
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-xl">
                    <div className="relative col-span-1 lg:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('search_requests')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                        >
                            <option value="">{t('filter_by_type')}</option>
                            {requestTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                        >
                            <option value="">{t('filter_by_status')}</option>
                            {statusOptions.map(status => (
                                <option key={status.id} value={status.id}>{status.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('member', 'Membre')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('request_title', 'Titre')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('request_type', 'Type')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('request_status', 'Statut')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('date', 'Date')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-gray-400 font-bold animate-pulse">{t('loading')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center text-gray-400 font-bold">
                                            {t('no_requests')}
                                        </td>
                                    </tr>
                                ) : requests.map((req) => (
                                    <tr key={req.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-black uppercase shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                                    {req.member?.firstName?.[0]}{req.member?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900 dark:text-white">{req.member?.firstName} {req.member?.lastName}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{req.member?.phone || req.member?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{req.title}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                                {requestTypes.find(t => t.id === req.requestType)?.label || req.requestType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-500 font-medium">{new Date(req.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setShowDetailModal(true); setInternalNote(req.internalNote || ''); }}
                                                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600 transition-all rounded-xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-all rounded-xl border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === p
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-black'
                                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f0f0f] w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row animate-in zoom-in-95 duration-300">
                        {/* Member Sidebar */}
                        <div className="w-full sm:w-80 bg-gray-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-white/5 p-8 flex flex-col items-center shrink-0">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black mb-6 shadow-2xl shadow-indigo-500/30">
                                {selectedRequest.member?.firstName?.[0]}{selectedRequest.member?.lastName?.[0]}
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white text-center mb-1">
                                {selectedRequest.member?.firstName} {selectedRequest.member?.lastName}
                            </h2>
                            <p className="text-xs font-bold text-indigo-600 mb-8 uppercase tracking-widest">{t('member')}</p>

                            <div className="w-full space-y-4 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-lg"><User size={16} /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] uppercase font-black text-gray-400">{t('email')}</p>
                                        <p className="text-[11px] font-black text-gray-700 dark:text-white truncate">{selectedRequest.member?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-lg"><UserCheck size={16} /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] uppercase font-black text-gray-400">{t('phone')}</p>
                                        <p className="text-[11px] font-black text-gray-700 dark:text-white truncate">{selectedRequest.member?.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowDetailModal(false)} className="mt-auto w-full py-4 bg-white dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                                {t('close', 'Fermer')}
                            </button>
                        </div>

                        {/* Request Content */}
                        <div className="flex-1 overflow-y-auto p-8 sm:p-12 h-full custom-scrollbar">
                            <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
                                <div>
                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                                        {requestTypes.find(t => t.id === selectedRequest.requestType)?.label || selectedRequest.requestType}
                                    </span>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">{selectedRequest.title}</h1>
                                </div>
                                <StatusBadge status={selectedRequest.status} />
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                        <MessageSquare size={14} className="text-indigo-500" /> {t('description')}
                                    </h3>
                                    <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                                            {selectedRequest.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <Edit3 size={14} className="text-amber-500" /> {t('update_status')}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {statusOptions.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleUpdateStatus(selectedRequest.id, opt.id, internalNote)}
                                                    disabled={updatingStatus}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRequest.status === opt.id
                                                        ? `${opt.color} text-white ring-4 ring-offset-2 dark:ring-offset-black ${opt.color.replace('bg-', 'ring-')}/20`
                                                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <StickyNote size={14} className="text-emerald-500" /> {t('internal_note')}
                                        </h3>
                                        <textarea
                                            value={internalNote}
                                            onChange={(e) => setInternalNote(e.target.value)}
                                            placeholder={t('add_internal_note')}
                                            className="w-full p-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none resize-none h-24"
                                        />
                                        <button
                                            onClick={() => handleUpdateStatus(selectedRequest.id, selectedRequest.status, internalNote)}
                                            disabled={updatingStatus}
                                            className="w-full py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            {t('save_note', 'Enregistrer la note')}
                                        </button>
                                    </div>
                                </div>

                                {/* History Section in Modal */}
                                {selectedRequest.history && selectedRequest.history.length > 0 && (
                                    <div className="pt-8 border-t dark:border-white/5">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
                                            <HistoryIcon size={14} className="text-amber-500" /> {t('history_log')}
                                        </h3>
                                        <div className="space-y-6">
                                            {selectedRequest.history.map((h, i) => (
                                                <div key={i} className="flex gap-4 group/item">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50 mt-1.5 ring-4 ring-indigo-500/10"></div>
                                                        {i < selectedRequest.history.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 dark:bg-white/5 my-2 rounded-full"></div>}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                                    {statusOptions.find(o => o.id === h.newStatus)?.label || h.newStatus}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-gray-400">•</span>
                                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                                                                    {h.changedBy?.firstName} {h.changedBy?.lastName}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                                                                {new Date(h.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic border-l-2 border-indigo-100 dark:border-indigo-500/20 pl-3 py-1">
                                                            {h.note}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 border-t dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {t('submitted_on', 'Soumis le')} {new Date(selectedRequest.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {selectedRequest.assignedTo && (
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={14} className="text-indigo-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {t('assigned_to')}: {selectedRequest.assignedTo.firstName} {selectedRequest.assignedTo.lastName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default MemberRequestsManager;
