import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import EventModal from './components/EventModal';
import { useLanguage } from '../../../context/LanguageContext';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';

export default function Events() {
    const { t } = useLanguage();
    const [events, setEvents] = useState([]);
    const [members, setMembers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [initialTab, setInitialTab] = useState('details');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [activeCategory, setActiveCategory] = useState('upcoming'); // 'upcoming' or 'past'
    const [showAllEvents, setShowAllEvents] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        dateStart: '',
        dateEnd: ''
    });

    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [editId, setEditId] = useState(null);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error("Erreur chargement événements:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get('/members');
            setMembers(response.data);
        } catch (error) {
            console.error("Erreur chargement membres:", error);
        }
    }

    const fetchRooms = async () => {
        try {
            const response = await api.get('/logistics/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error("Erreur chargement salles:", error);
        }
    };

    const fetchEventDetails = async (id) => {
        try {
            const response = await api.get(`/events/${id}`);
            setSelectedEvent(response.data);
        } catch (error) {
            console.error("Erreur chargement détails événement:", error);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchMembers();
        fetchRooms();
    }, []);

    // Statistics Calculation
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: events.length,
            upcoming: events.filter(e => {
                const eventEnd = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
                return eventEnd >= now;
            }).length,
            past: events.filter(e => {
                const eventEnd = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
                return eventEnd < now;
            }).length,
            participants: events.reduce((sum, e) => sum + (e.eventParticipants?.length || 0), 0)
        };
    }, [events]);

    // Filtering Logic
    const filteredEvents = useMemo(() => {
        const now = new Date();
        let result = events.filter(event => {
            const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
            const isUpcoming = eventEnd >= now;

            if (activeCategory === 'upcoming' && !isUpcoming) return false;
            if (activeCategory === 'past' && isUpcoming) return false;

            // Search filter
            if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                !event.description?.toLowerCase().includes(filters.search.toLowerCase()) &&
                !event.location?.toLowerCase().includes(filters.search.toLowerCase())) return false;

            // Date range filter
            if (filters.dateStart) {
                const start = new Date(filters.dateStart);
                if (new Date(event.startDate) < start) return false;
            }
            if (filters.dateEnd) {
                const end = new Date(filters.dateEnd);
                end.setHours(23, 59, 59, 999);
                if (new Date(event.startDate) > end) return false;
            }

            return true;
        });

        // Sorting
        if (activeCategory === 'upcoming') {
            result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        } else {
            result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        }

        return result;
    }, [events, activeCategory, filters]);

    const displayedEvents = useMemo(() => {
        return showAllEvents ? filteredEvents : filteredEvents.slice(0, 8);
    }, [filteredEvents, showAllEvents]);

    const handleExportPDF = () => {
        const headers = [t('title'), t('date'), t('location'), t('type'), t('participants_count', 'Participants')];
        const data = filteredEvents.map(e => [
            e.title,
            new Date(e.startDate).toLocaleString(),
            e.location || '-',
            t(`event_type_${e.type}`) || e.type,
            e.eventParticipants?.length || 0
        ]);
        exportToPDF(t('events_list', 'Liste des événements'), headers, data, t('events_report', 'Rapport des événements'));
    };

    const handleExportExcel = () => {
        const data = filteredEvents.map(e => ({
            [t('title')]: e.title,
            [t('date')]: new Date(e.startDate).toLocaleString(),
            [t('location')]: e.location || '-',
            [t('type')]: t(`event_type_${e.type}`) || e.type,
            [t('participants_count', 'Participants')]: e.eventParticipants?.length || 0
        }));
        exportToExcel(t('events_list', 'Liste des événements'), data);
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/events/${deleteId}`);
            setEvents(events.filter(e => e.id !== deleteId));
            setAlertMessage({ show: true, title: t('success'), message: t('event_deleted_success'), type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('delete_error'), type: 'error' });
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const handleEdit = (event) => {
        fetchEventDetails(event.id);
        setEditId(event.id);
        setInitialTab('details');
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditId(null);
        setSelectedEvent(null);
        setInitialTab('details');
        setShowModal(true);
    };

    const handleSubmit = async (formData) => {
        try {
            if (editId) {
                await api.put(`/events/${editId}`, formData);
                setAlertMessage({ show: true, title: t('success'), message: t('event_updated_success'), type: 'success' });
            } else {
                await api.post('/events', formData);
                setAlertMessage({ show: true, title: t('success'), message: t('event_created_success'), type: 'success' });
            }
            fetchEvents();
            setShowModal(false);
            setEditId(null);
            setSelectedEvent(null);
        } catch (error) {
            const msg = error.response?.data?.message || t('operation_error');
            setAlertMessage({ show: true, title: t('error'), message: msg, type: 'error' });
        }
    };

    const handleAddParticipant = async (participantData) => {
        if (!editId) return;
        try {
            if (participantData.userId) {
                await api.post(`/events/${editId}/participants/member`, { userId: participantData.userId });
            } else {
                await api.post(`/events/${editId}/participants/guest`, participantData);
            }
            fetchEventDetails(editId);
            fetchEvents();
        } catch (error) {
            const msg = error.response?.data?.message || t('operation_error');
            setAlertMessage({ show: true, title: t('error'), message: msg, type: 'error' });
        }
    };

    const handleRemoveParticipant = async (participantId) => {
        if (!editId) return;
        try {
            await api.delete(`/events/${editId}/participants/${participantId}`);
            fetchEventDetails(editId);
            fetchEvents();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    const onViewParticipants = (event) => {
        fetchEventDetails(event.id);
        setEditId(event.id);
        setInitialTab('participants');
        setShowModal(true);
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'service': return '🙏';
            case 'prayer': return '🤲';
            case 'concert': return '🎵';
            case 'conference': return '📢';
            default: return '📅';
        }
    };

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header Section */}
                <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-12 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in gap-8 transition-colors">
                    <div className="flex items-center gap-6">
                        <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-5 rounded-2xl transition-colors border border-brand-primary/10 dark:border-white/5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{t('events_management')}</h1>
                            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('events_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-brand-primary text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-brand-deep transition-all shadow-lg shadow-brand-primary/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        {t('new_event')}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label={t('total_events', 'Total Événements')} value={stats.total} icon="📅" color="text-brand-primary" bg="bg-brand-primary/5" />
                    <StatCard label={t('upcoming_events', 'À venir')} value={stats.upcoming} icon="⏳" color="text-emerald-500" bg="bg-emerald-50" />
                    <StatCard label={t('past_events', 'Écoulés')} value={stats.past} icon="✅" color="text-gray-400" bg="bg-gray-50" />
                    <StatCard label={t('total_participants', 'Participants')} value={stats.participants} icon="👥" color="text-brand-orange" bg="bg-brand-orange/10" />
                </div>

                {/* Filters & Content Container */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                    {/* Filter Toolbar (Row 1) */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex flex-wrap items-center gap-3 transition-colors bg-white/50 dark:bg-black/20">
                        {/* Search Input */}
                        <div className="relative flex-grow max-w-xs">
                            <input
                                type="text"
                                placeholder={`${t('search')}...`}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[12px] font-medium text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-black px-6 py-3 rounded-xl border border-gray-100 dark:border-white/5 transition-colors shadow-sm">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider text-xs">{t('from')}</span>
                            <input
                                type="date"
                                className="bg-transparent text-[11px] font-semibold text-gray-700 dark:text-gray-300 outline-none w-32 [color-scheme:light]"
                                value={filters.dateStart}
                                onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                            />
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider text-xs">{t('to')}</span>
                            <input
                                type="date"
                                className="bg-transparent text-[11px] font-semibold text-gray-700 dark:text-gray-300 outline-none w-32 [color-scheme:light]"
                                value={filters.dateEnd}
                                onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                            />
                        </div>

                        {/* Category Selector (Upcoming / Past) */}
                        <div className="flex p-1 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/5 ml-auto">
                            <button
                                onClick={() => setActiveCategory('upcoming')}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeCategory === 'upcoming' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {t('upcoming', 'À venir')}
                            </button>
                            <button
                                onClick={() => setActiveCategory('past')}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeCategory === 'past' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {t('past', 'Écoulés')}
                            </button>
                        </div>
                    </div>

                    {/* Actions Toolbar (Row 2) */}
                    <div className="p-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between gap-4 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="flex p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    {t('list_view', 'Liste')}
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    {t('grid_view', 'Grille')}
                                </button>
                            </div>

                            {!showAllEvents && filteredEvents.length > 8 && (
                                <button
                                    onClick={() => setShowAllEvents(true)}
                                    className="px-4 py-2 bg-brand-primary/5 dark:bg-white/5 hover:bg-brand-primary hover:text-white text-brand-primary dark:text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    {t('view_all', 'Voir tous')} ({filteredEvents.length})
                                </button>
                            )}
                            {showAllEvents && (
                                <button
                                    onClick={() => setShowAllEvents(false)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-blue-600 hover:text-white text-gray-500 dark:text-gray-400 text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    {t('show_less', 'Réduire')}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="w-9 h-9 flex items-center justify-center bg-green-50 dark:bg-black text-green-600 dark:text-green-500 rounded-xl border border-transparent dark:border-white/5 hover:bg-green-600 hover:text-white transition-all active:scale-95"
                                title={t('export_excel')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-black text-red-600 dark:text-red-500 rounded-xl border border-transparent dark:border-white/5 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                title={t('export_pdf')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    {loading ? (
                        <div className="py-20 text-center text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">{t('loading')}</div>
                    ) : displayedEvents.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">{t('no_events_found')}</div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('event', 'Événement')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('date')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('location')}</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('participants')}</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {displayedEvents.map(event => (
                                        <tr key={event.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/5 dark:bg-brand-primary/20 flex items-center justify-center text-xl">
                                                        {getEventIcon(event.type)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{event.title}</div>
                                                        <div className="text-[10px] text-brand-orange font-black uppercase tracking-widest mt-1">
                                                            {t(`event_type_${event.type}`) || event.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(event.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                    {event.location || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => onViewParticipants(event)}
                                                    className="px-3 py-1.5 rounded-lg bg-brand-primary/5 dark:bg-black/40 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-white transition-all border border-brand-primary/10 flex items-center gap-2"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                    {event.eventParticipants?.length || 0}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(event)} className="p-2 text-gray-400 hover:text-blue-600 transition-all bg-gray-50 dark:bg-black/20 rounded-lg" title={t('edit')}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => confirmDelete(event.id)} className="p-2 text-gray-400 hover:text-red-500 transition-all bg-gray-50 dark:bg-black/20 rounded-lg" title={t('delete')}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                            {displayedEvents.map(event => (
                                <div key={event.id} className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:translate-y-[-4px] transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>

                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-black flex items-center justify-center text-2xl shadow-sm">
                                            {getEventIcon(event.type)}
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/10 text-[9px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-100/50">
                                            {t(`event_type_${event.type}`) || event.type}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{event.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 line-clamp-2 leading-relaxed h-8">{event.description}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <div className="w-7 h-7 rounded-lg bg-brand-primary/5 dark:bg-black flex items-center justify-center text-xs text-brand-primary">📅</div>
                                            <span className="text-[11px] font-bold">{new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {new Date(event.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <div className="w-7 h-7 rounded-lg bg-brand-primary/5 dark:bg-black flex items-center justify-center text-xs text-brand-primary">📍</div>
                                            <span className="text-[11px] font-bold truncate">{event.location || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                                        <button
                                            onClick={() => onViewParticipants(event)}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-orange"
                                        >
                                            <span className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-5 h-5 rounded-full bg-brand-primary/10 border-2 border-white dark:border-[#1A1A1A] flex items-center justify-center text-[7px] font-black text-brand-primary">
                                                        {i === 3 ? '+' : ''}
                                                    </div>
                                                ))}
                                            </span>
                                            {event.eventParticipants?.length || 0} participants
                                        </button>

                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(event)} className="p-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all transform active:scale-90 shadow-sm border border-blue-100/50">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => confirmDelete(event.id)} className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all transform active:scale-90 shadow-sm border border-red-100/50">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <EventModal
                    event={selectedEvent}
                    members={members}
                    rooms={rooms}
                    onClose={() => setShowModal(false)}
                    onSave={handleSubmit}
                    onAddParticipant={handleAddParticipant}
                    onRemoveParticipant={handleRemoveParticipant}
                    initialTab={initialTab}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title={t('delete_event_title')}
                message={t('delete_event_confirm')}
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

// Sub-components
const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-lg transition-all transform hover:-translate-y-1 group">
        <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shadow-inner transition-transform group-hover:scale-110`}>
                <span className="text-2xl">{icon}</span>
            </div>
            <div>
                <div className={`text-2xl font-bold ${color} tracking-tight`}>{value}</div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mt-1">{label}</div>
            </div>
        </div>
    </div>
);
