import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import AdminLayout from '../../../layouts/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { exportToPDF } from '../../../utils/exportUtils';

const RoomProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [room, setRoom] = useState(null);
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [equipmentForm, setEquipmentForm] = useState({
        name: '',
        quantity: 1,
        isShared: false,
        status: 'bon_etat'
    });

    const handleExport = (range) => {
        let start, end;
        const now = new Date();
        const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31);

        switch (range) {
            case 'day':
                start = new Date(baseDate);
                end = new Date(baseDate);
                break;
            case 'week':
                start = new Date(baseDate);
                end = new Date(baseDate);
                end.setDate(baseDate.getDate() + 6);
                break;
            case 'month':
                start = firstDayOfMonth;
                end = lastDayOfMonth;
                break;
            case 'year':
                start = firstDayOfYear;
                end = lastDayOfYear;
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            default:
                return;
        }

        const headers = [t('date'), t('time'), t('type'), t('name')];
        const exportData = [];

        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const frToEnDays = {
            'dimanche': 'sunday', 'lundi': 'monday', 'mardi': 'tuesday',
            'mercredi': 'wednesday', 'jeudi': 'thursday', 'vendredi': 'friday',
            'samedi': 'saturday'
        };
        const enDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            const dayNameFr = daysFr[currentDate.getDay()];
            const dayNameEn = enDays[currentDate.getDay()];
            const dateStr = currentDate.toLocaleDateString();

            // 1. Recurring Room Schedules
            let roomSchedules = [];
            try {
                roomSchedules = typeof room.recurringSchedule === 'string'
                    ? JSON.parse(room.recurringSchedule)
                    : (Array.isArray(room.recurringSchedule) ? room.recurringSchedule : []);
            } catch (e) { }

            roomSchedules.forEach(s => {
                if (s.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[s.day?.toLowerCase()] === dayNameEn) {
                    exportData.push([dateStr, `${s.startTime} - ${s.endTime}`, t('unavailability'), t('unavailability')]);
                }
            });

            // 2. Groups
            (room.groups || []).forEach(g => {
                let gs = g.recurringSchedule;
                if (typeof gs === 'string') try { gs = JSON.parse(gs); } catch (e) { }
                if (gs && (gs.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[gs.day?.toLowerCase()] === dayNameEn)) {
                    exportData.push([dateStr, `${gs.startTime} - ${gs.endTime}`, t('group', 'Groupe'), g.name]);
                }
            });

            // 3. Classes
            (room.sundaySchoolClasses || []).forEach(ssc => {
                let sss = ssc.recurringSchedule;
                if (typeof sss === 'string') try { sss = JSON.parse(sss); } catch (e) { }
                if (sss && (sss.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[sss.day?.toLowerCase()] === dayNameEn)) {
                    exportData.push([dateStr, `${sss.startTime} - ${sss.endTime}`, t('class', 'Classe'), ssc.name]);
                }
            });

            // 4. Reservations
            (room.reservations || []).forEach(res => {
                const resDate = new Date(res.startTime);
                if (resDate.toDateString() === currentDate.toDateString()) {
                    exportData.push([
                        dateStr,
                        `${resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                        t('reservation', 'Réservation'),
                        res.title
                    ]);
                }
            });

            // 5. Events
            (room.events || []).forEach(event => {
                const eventDate = new Date(event.startDate);
                if (eventDate.toDateString() === currentDate.toDateString()) {
                    exportData.push([
                        dateStr,
                        `${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                        t('event'),
                        event.title
                    ]);
                }
            });
        }

        if (exportData.length === 0) {
            toast.error(t('no_data', 'Aucune donnée à exporter'));
            return;
        }

        exportData.sort((a, b) => {
            const dateA = new Date(a[0].split('/').reverse().join('-'));
            const dateB = new Date(b[0].split('/').reverse().join('-'));
            if (dateA - dateB !== 0) return dateA - dateB;
            return a[1].localeCompare(b[1]);
        });

        const headerLines = [
            { text: church?.name || 'ElyonSys 360', align: 'center' },
            { text: room.building?.name || 'Bâtiment', align: 'center' },
            { text: room.building?.address || 'Adresse du bâtiment', align: 'center', style: 'italic' },
            { text: `${room.name} • ${room.manager ? `${room.manager.firstName} ${room.manager.lastName}` : 'Sans responsable'}`, align: 'center' },
            { text: `Horaire : période du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}`, align: 'center' }
        ];

        const footerText = `Généré le: ${new Date().toLocaleString()}`;

        exportToPDF(`${room.name}_planning_${range}`, headers, exportData, '', { headerLines, footerText });
    };

    const fetchData = async () => {
        try {
            const [roomRes, churchRes] = await Promise.all([
                api.get(`/logistics/rooms/${id}`),
                api.get('/churches/settings')
            ]);
            setRoom(roomRes.data);
            setChurch(churchRes.data.church);
        } catch (error) {
            console.error("Error fetching data:", error);
            const msg = error.response?.data?.message || "Erreur lors du chargement des données";
            toast.error(msg);
            navigate('/admin/logistics/spaces');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, navigate]);

    const handleAddEquipment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory', {
                ...equipmentForm,
                roomId: id
            });
            toast.success("Équipement ajouté");
            setShowEquipmentModal(false);
            setEquipmentForm({ name: '', quantity: 1, isShared: false, status: 'bon_etat' });
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de l'ajout");
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        </AdminLayout>
    );

    if (!room) return null;

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 space-y-8 animate-fade-in-up pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => navigate('/admin/logistics/spaces')}
                                className="p-2 bg-white dark:bg-white/5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {room.name}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-app-micro font-bold uppercase tracking-wider ${['Libre', 'Active'].includes(room.status) ? 'bg-emerald-100 text-emerald-700' :
                                room.status === 'Occupée' ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                }`}>
                                {room.status}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 pl-12 text-app-meta">
                            {room.building?.name} • {room.capacity} personnes • {room.type}
                        </p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Tabs */}
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-2 border border-gray-100 dark:border-white/5 inline-flex">
                            {['overview', 'equipment', 'schedule'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-[1.5rem] text-app-meta font-bold transition-all ${activeTab === tab
                                        ? 'bg-brand-primary text-white shadow-lg active:scale-95'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                >
                                    {tab === 'overview' ? t('overview', "Vue d'ensemble") :
                                        tab === 'equipment' ? t('equipment', "Équipements") :
                                            t('planning', "Planning")}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-8 min-h-[400px]">
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-app-micro font-bold text-gray-400 uppercase tracking-widest mb-4">{t('general_info', 'Informations Générales')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('room_code', 'Code Salle')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.code || t('na', 'N/A')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('building', 'Bâtiment')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.building?.name || t('na', 'N/A')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('floor', 'Étage')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.floor || t('na', 'N/A')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('surface', 'Surface')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.area ? `${room.area} m²` : t('na', 'N/A')}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-app-micro font-bold text-gray-400 uppercase tracking-widest mb-4">{t('management_access', 'Gestion & Accès')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('manager', 'Responsable')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">
                                                        {room.manager ? `${room.manager.firstName} ${room.manager.lastName}` : t('none', 'Aucun')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('management_type', 'Type de gestion')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.managerType || t('standard', 'Standard')}</div>
                                                </div>
                                                <div>
                                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black mb-1">{t('pmr_access', 'Accès PMR')}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-app-meta">{room.pmrAccess ? t('yes', 'Oui') : t('no', 'Non')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'equipment' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('inventory_equipment', 'Inventaire & Équipements')}</h3>
                                        <button
                                            onClick={() => setShowEquipmentModal(true)}
                                            className="px-6 py-3 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-app-micro rounded-2xl transition-all shadow-lg active:scale-95"
                                        >
                                            + {t('add', 'Ajouter')}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-100 dark:border-white/5 text-left">
                                                    <th className="py-3 px-4 text-app-micro font-bold text-gray-400 uppercase tracking-wider">{t('name', 'Nom')}</th>
                                                    <th className="py-3 px-4 text-app-micro font-bold text-gray-400 uppercase tracking-wider">{t('quantity', 'Quantité')}</th>
                                                    <th className="py-3 px-4 text-app-micro font-bold text-gray-400 uppercase tracking-wider">{t('shared', 'Partagé')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {(() => {
                                                    let items = [];
                                                    if (room.inventoryItems && room.inventoryItems.length > 0) {
                                                        items = room.inventoryItems;
                                                    } else if (room.facilities) {
                                                        try {
                                                            const parsed = typeof room.facilities === 'string' ? JSON.parse(room.facilities) : room.facilities;
                                                            items = Array.isArray(parsed) ? parsed : [parsed];
                                                        } catch (e) {
                                                            items = typeof room.facilities === 'string' ? room.facilities.split(',').map(f => f.trim()) : room.facilities;
                                                        }
                                                    }

                                                    if (items.length === 0) {
                                                        return (
                                                            <tr>
                                                                <td colSpan="3" className="py-8 text-center text-gray-500 italic">
                                                                    {t('no_equipment', 'Aucun équipement répertorié.')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    return items.map((item, idx) => {
                                                        const name = typeof item === 'string' ? item : (item.name || item.label || 'N/A');
                                                        const quantity = item.quantity || '-';
                                                        const shared = item.isShared ?? item.shared ?? null;

                                                        return (
                                                            <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{name}</td>
                                                                <td className="py-3 px-4 text-gray-500">{quantity}</td>
                                                                <td className="py-3 px-4">
                                                                    {shared !== null ? (
                                                                        <span className={`px-2 py-1 rounded text-app-micro font-bold ${shared ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-gray-600'}`}>
                                                                            {shared ? t('yes', 'Oui') : t('no', 'Non')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('room_recurring_schedule', 'Horaires Récurrents de la Salle')}</h3>
                                        {(() => {
                                            let schedules = [];
                                            try {
                                                schedules = typeof room.recurringSchedule === 'string'
                                                    ? JSON.parse(room.recurringSchedule)
                                                    : (Array.isArray(room.recurringSchedule) ? room.recurringSchedule : []);
                                            } catch (e) {
                                                console.error("Error parsing recurringSchedule", e);
                                            }

                                            if (schedules.length === 0) {
                                                return <p className="text-gray-500 italic mb-8">{t('no_recurring_schedule', 'Aucun horaire récurrent défini pour cette salle.')}</p>;
                                            }

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                                    {schedules.map((s, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white text-app-meta">{s.day}</div>
                                                                <div className="text-app-micro text-gray-500 font-medium">{s.description || t('fixed_availability', 'Disponibilité fixe')}</div>
                                                            </div>
                                                            <span className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-app-micro font-black uppercase tracking-widest text-brand-primary dark:text-brand-orange shadow-sm border border-brand-primary/20 dark:border-white/10">
                                                                {s.startTime} - {s.endTime}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('resident_groups_classes', 'Groupes & Classes Résidents')}</h3>
                                        {((room.groups || []).length > 0 || (room.sundaySchoolClasses || []).length > 0) ? (
                                            <div className="space-y-4">
                                                {/* Groups Mapping */}
                                                {(room.groups || []).map(group => {
                                                    let scheduleDisplay = 'Horaire non défini';
                                                    if (group.recurringSchedule) {
                                                        try {
                                                            const sched = typeof group.recurringSchedule === 'string'
                                                                ? JSON.parse(group.recurringSchedule)
                                                                : group.recurringSchedule;
                                                            if (sched && sched.day && sched.startTime && sched.endTime) {
                                                                const day = sched.day.charAt(0).toUpperCase() + sched.day.slice(1);
                                                                scheduleDisplay = `${day} • ${sched.startTime} - ${sched.endTime}`;
                                                            }
                                                        } catch (e) { }
                                                    }
                                                    return (
                                                        <div key={`group-${group.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-brand-primary/5 dark:bg-white/5 border border-brand-primary/10 dark:border-white/5">
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white text-app-meta">{group.name}</div>
                                                                <div className="text-app-micro text-gray-500 font-medium">
                                                                    {group.type ? (t(`group_type_${group.type}`) || group.type) : t('group', 'Groupe')} • {group.leaderName || t('no_manager', 'Sans responsable')}
                                                                </div>
                                                            </div>
                                                            <span className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-app-micro font-black uppercase tracking-widest text-brand-primary dark:text-brand-orange shadow-sm border border-brand-primary/20 dark:border-white/10">
                                                                {scheduleDisplay}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {/* Sunday School Mapping */}
                                                {(room.sundaySchoolClasses || []).map(ssc => {
                                                    let scheduleDisplay = 'Horaire non défini';
                                                    if (ssc.recurringSchedule) {
                                                        try {
                                                            const sched = typeof ssc.recurringSchedule === 'string'
                                                                ? JSON.parse(ssc.recurringSchedule)
                                                                : ssc.recurringSchedule;
                                                            if (sched && sched.day && sched.startTime && sched.endTime) {
                                                                const day = sched.day.charAt(0).toUpperCase() + sched.day.slice(1);
                                                                scheduleDisplay = `${day} • ${sched.startTime} - ${sched.endTime}`;
                                                            }
                                                        } catch (e) { }
                                                    }
                                                    return (
                                                        <div key={`ssc-${ssc.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 dark:bg-white/5 border border-emerald-100 dark:border-white/5">
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white text-app-meta">{ssc.name}</div>
                                                                <div className="text-app-micro text-gray-500 font-medium">{t('sunday_school_class_desc', "Classe d'École du Dimanche")}</div>
                                                            </div>
                                                            <span className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-app-micro font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-white/10">
                                                                {scheduleDisplay}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">{t('no_classes_assigned', 'Aucun groupe ou classe assigné à cette salle.')}</p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('reservations_events', 'Réservations & Événements')}</h3>
                                        {((room.reservations || []).length > 0 || (room.events || []).length > 0) ? (
                                            <div className="space-y-4">
                                                {/* Reservations Mapping */}
                                                {(room.reservations || []).map(res => (
                                                    <div key={`res-${res.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white text-app-meta">{res.title}</div>
                                                            <div className="text-app-micro text-gray-500 font-medium">{new Date(res.startTime).toLocaleDateString()}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-app-micro font-bold text-gray-900 dark:text-white uppercase tracking-widest">{t('reservation', 'Réservation')}</div>
                                                            <div className="text-app-micro text-gray-500 font-medium">
                                                                {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Events Mapping */}
                                                {(room.events || []).map(event => (
                                                    <div key={`event-${event.id}`} className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 dark:bg-white/5 border border-indigo-100/50 dark:border-white/5">
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white text-app-meta">{event.title}</div>
                                                            <div className="text-app-micro text-gray-500 font-medium">{new Date(event.startDate).toLocaleDateString()}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-app-micro font-black text-brand-primary dark:text-brand-orange uppercase tracking-widest mb-1">{t('event', 'Événement')}</div>
                                                            <div className="text-app-micro text-gray-500 font-medium">
                                                                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">{t('no_ponctual_events', 'Aucune réservation ou événement ponctuel.')}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Stats or Additional Info */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-brand-primary to-brand-deep rounded-[2.5rem] p-8 text-white shadow-xl shadow-brand-primary/20 dark:shadow-none">
                            <h3 className="text-lg font-bold mb-2 opacity-90">{t('capacity', 'Capacité')}</h3>
                            <div className="text-5xl font-black mb-2">{room.capacity || 0}</div>
                            <div className="text-app-micro opacity-75 uppercase tracking-widest font-black">{t('people_max', 'personnes maximum')}</div>
                        </div>

                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-8">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('configuration', 'Configuration')}</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-orange">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black">{t('layout', 'Disposition')}</div>
                                    <div className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-app-meta">{room.layout || t('standard', 'Standard')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-white/5 text-emerald-600 dark:text-emerald-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-app-micro text-gray-500 uppercase tracking-widest font-black">{t('condition', 'État')}</div>
                                    <div className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-app-meta">{room.condition || t('good', 'Bon')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm p-8">
                            <div className="mb-6 pt-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                    {t('room_calendar', 'Calendrier de la salle')}:
                                </h3>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-app-micro font-black text-gray-400 uppercase tracking-widest mr-1">
                                        {t('download_label', 'télécharge :')}
                                    </span>
                                     {[
                                        { id: 'day', label: 'today_sentence' },
                                        { id: 'week', label: 'this_week_sentence' },
                                        { id: 'month', label: 'this_month_sentence' },
                                        { id: 'quarter', label: 'this_quarter_sentence' },
                                        { id: 'year', label: 'this_year_sentence' }
                                    ].map(range => (
                                        <button
                                            key={range.id}
                                            onClick={() => handleExport(range.id)}
                                            className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-transparent hover:border-brand-primary/30 rounded-xl text-app-micro font-black text-gray-500 hover:text-brand-primary transition-all active:scale-95 uppercase tracking-widest"
                                        >
                                            {t(range.label)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const days = [
                                        t('sunday', 'Dimanche'), t('monday', 'Lundi'), t('tuesday', 'Mardi'),
                                        t('wednesday', 'Mercredi'), t('thursday', 'Jeudi'), t('friday', 'Vendredi'),
                                        t('saturday', 'Samedi')
                                    ];
                                    const frToEnDays = {
                                        'dimanche': 'sunday', 'lundi': 'monday', 'mardi': 'tuesday',
                                        'mercredi': 'wednesday', 'jeudi': 'thursday', 'vendredi': 'friday',
                                        'samedi': 'saturday'
                                    };
                                    const enDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

                                    const today = new Date();
                                    const next7Days = Array.from({ length: 7 }, (_, i) => {
                                        const d = new Date(today);
                                        d.setDate(today.getDate() + i);
                                        return d;
                                    });

                                    return next7Days.map(date => {
                                        const dayNameFr = days[date.getDay()];
                                        const dayNameEn = enDays[date.getDay()];
                                        const isToday = date.toDateString() === today.toDateString();

                                        // Find all activities for this day
                                        let dayActivities = [];

                                        // 1. Recurring Schedules (Room settings)
                                        let roomSchedules = [];
                                        try {
                                            roomSchedules = typeof room.recurringSchedule === 'string'
                                                ? JSON.parse(room.recurringSchedule)
                                                : (Array.isArray(room.recurringSchedule) ? room.recurringSchedule : []);
                                        } catch (e) { }

                                        roomSchedules.forEach(s => {
                                            if (s.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[s.day?.toLowerCase()] === dayNameEn) {
                                                dayActivities.push({ ...s, type: 'fixed', label: 'Indisponibilité' });
                                            }
                                        });

                                        // 2. Groups
                                        (room.groups || []).forEach(g => {
                                            let gs = g.recurringSchedule;
                                            if (typeof gs === 'string') try { gs = JSON.parse(gs); } catch (e) { }
                                            if (gs && (gs.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[gs.day?.toLowerCase()] === dayNameEn)) {
                                                dayActivities.push({ startTime: gs.startTime, endTime: gs.endTime, label: g.name, type: 'group' });
                                            }
                                        });

                                        // 3. Sunday School
                                        (room.sundaySchoolClasses || []).forEach(ssc => {
                                            let sss = ssc.recurringSchedule;
                                            if (typeof sss === 'string') try { sss = JSON.parse(sss); } catch (e) { }
                                            if (sss && (sss.day?.toLowerCase() === dayNameFr.toLowerCase() || frToEnDays[sss.day?.toLowerCase()] === dayNameEn)) {
                                                dayActivities.push({ startTime: sss.startTime, endTime: sss.endTime, label: ssc.name, type: 'class' });
                                            }
                                        });

                                        // 4. Reservations
                                        (room.reservations || []).forEach(res => {
                                            const resDate = new Date(res.startTime);
                                            if (resDate.toDateString() === date.toDateString()) {
                                                dayActivities.push({
                                                    startTime: resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                                                    endTime: new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                                                    label: res.title,
                                                    type: 'reservation'
                                                });
                                            }
                                        });

                                        // 5. Events
                                        (room.events || []).forEach(event => {
                                            const eventDate = new Date(event.startDate);
                                            if (eventDate.toDateString() === date.toDateString()) {
                                                dayActivities.push({
                                                    startTime: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                                                    endTime: event.endDate ? new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '??:??',
                                                    label: event.title,
                                                    type: 'event'
                                                });
                                            }
                                        });

                                        // Sort activities by start time
                                        dayActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

                                        const isOccupied = dayActivities.length > 0;

                                        return (
                                         <div key={date.toISOString()} className={`p-4 rounded-2xl border transition-all ${isToday ? 'bg-brand-primary/5 border-brand-primary/20 dark:bg-brand-primary/10 dark:border-brand-primary/20 shadow-sm' : 'border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5'}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                         <span className="text-app-meta font-bold text-gray-900 dark:text-white uppercase tracking-wider">{dayNameFr}</span>
                                                        <span className="text-app-micro text-gray-400 font-bold uppercase tracking-widest">{date.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                                                        {isToday && <span className="px-2 py-0.5 rounded-full bg-brand-primary text-app-micro font-black text-white uppercase tracking-widest">{t('today', "Aujourd'hui")}</span>}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-app-micro font-bold uppercase tracking-wider ${isOccupied ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {isOccupied ? t('room_occupied', 'Occupée') : t('room_free', 'Libre')}
                                                    </span>
                                                </div>

                                                {dayActivities.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {dayActivities.map((act, idx) => (
                                                            <div key={idx} className="flex items-center justify-between group">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className={`w-1 h-3 rounded-full shrink-0 ${act.type === 'fixed' ? 'bg-gray-400' : act.type === 'group' ? 'bg-indigo-400' : act.type === 'class' ? 'bg-emerald-400' : 'bg-violet-400'}`}></div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-app-micro text-gray-600 dark:text-gray-400 truncate font-bold leading-tight">{act.label}</span>
                                                                        {act.description && (
                                                                            <span className="text-app-micro text-gray-400 dark:text-gray-500 truncate italic leading-tight">
                                                                                {act.description.length > 40 ? act.description.substring(0, 40) + '...' : act.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-app-micro font-mono font-bold text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0">
                                                                    {act.startTime}-{act.endTime}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-app-micro text-gray-400 italic">{t('full_day_availability', 'Disponibilité totale toute la journée')}</div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipment Modal */}
                {showEquipmentModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-scale-in">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{t('add_equipment', 'Ajouter un équipement')}</h3>
                            <form onSubmit={handleAddEquipment} className="space-y-4">
                                <div>
                                    <label className="block text-app-micro font-bold text-gray-400 uppercase tracking-widest mb-2">{t('item_name', "Nom de l'article")}</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-app-meta"
                                        value={equipmentForm.name}
                                        onChange={e => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-app-micro font-bold text-gray-400 uppercase tracking-widest mb-2">{t('quantity', 'Quantité')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-app-meta"
                                            value={equipmentForm.quantity}
                                            onChange={e => setEquipmentForm({ ...equipmentForm, quantity: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-app-micro font-bold text-gray-400 uppercase tracking-widest mb-2">{t('shared', 'Partagé')}</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-app-meta"
                                            value={equipmentForm.isShared}
                                            onChange={e => setEquipmentForm({ ...equipmentForm, isShared: e.target.value === 'true' })}
                                        >
                                            <option value="false">{t('no', 'Non')}</option>
                                            <option value="true">{t('yes', 'Oui')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-app-micro rounded-2xl transition-all shadow-lg active:scale-95"
                                    >
                                        {t('add', 'Ajouter')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEquipmentModal(false)}
                                        className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-app-micro rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-title"
                                    >
                                        {t('cancel', 'Annuler')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default RoomProfile;
