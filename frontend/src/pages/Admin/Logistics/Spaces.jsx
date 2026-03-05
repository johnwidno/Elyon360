import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import AdminLayout from '../../../layouts/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Spaces = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState('grid');
    const [showBuildingModal, setShowBuildingModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [activeRoomTab, setActiveRoomTab] = useState('general');
    const [editingBuildingId, setEditingBuildingId] = useState(null);
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [showStats, setShowStats] = useState(true);
    const [pendingDelete, setPendingDelete] = useState(null); // { id, type: 'building' | 'room' }

    // Form States
    const initialBuildingState = {
        name: '', code: '', type: '', description: '',
        address: '', city: '', district: '', country: '', latitude: '', longitude: '',
        surfaceArea: '', floors: '', totalRooms: '', capacity: '', constructionYear: '', condition: 'Bon',
        status: 'Actif', usage: 'Culte',
        managerType: 'Membre', managerName: '', managerPhone: '', managerEmail: ''
    };
    const [buildingForm, setBuildingForm] = useState(initialBuildingState);

    const initialRoomState = {
        // Identification
        name: '', code: '', buildingId: '', floor: '', type: '',
        // Caractéristiques physiques
        area: '', capacity: '', layout: '', condition: 'Bon',
        // Statut & disponibilité
        status: 'Libre', authorizedUse: '', isBookable: true, maxBookingDuration: '', requiresApproval: false,
        // Horaires
        recurringSchedule: [], defaultAvailability: null, bookingRules: null,
        // Équipements
        facilities: [],
        // Responsable
        managerId: '', managerType: 'Membre', managerContact: '',
        // Sécurité
        pmrAccess: false, emergencyExits: false, electricalSystem: true, specialRules: '',
        // Maintenance
        lastInspection: '', nextMaintenance: '', maintenanceHistory: [], observations: '',
        // Médias
        photos: [], layoutPlan: ''
    };
    const [roomForm, setRoomForm] = useState(initialRoomState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [buildingsRes, roomsRes] = await Promise.all([
                api.get('/logistics/buildings'),
                api.get('/logistics/rooms')
            ]);
            setBuildings(buildingsRes.data);
            setRooms(roomsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading data", error);
            const errorMessage = error.response?.data?.message || error.message || "Erreur de chargement des données";
            toast.error(t('error_loading', errorMessage));
            setLoading(false);
        }
    };

    const validateBuildingForm = () => {
        const required = ['name', 'code', 'type', 'address', 'city'];
        const missing = required.filter(field => !buildingForm[field]);
        if (missing.length > 0) {
            toast.error(`Champs obligatoires manquants: ${missing.join(', ')}`);
            return false;
        }
        return true;
    };

    const validateCurrentTab = () => {
        // Check required fields for the current tab
        switch (activeTab) {
            case 'general':
                if (!buildingForm.name || !buildingForm.code || !buildingForm.type) {
                    toast.error('Veuillez remplir tous les champs obligatoires de l\'onglet Général (Nom, Code, Type)');
                    return false;
                }
                break;
            case 'location':
                if (!buildingForm.address || !buildingForm.city) {
                    toast.error('Veuillez remplir tous les champs obligatoires de l\'onglet Localisation (Adresse, Ville)');
                    return false;
                }
                break;
            // Other tabs don't have required fields
            case 'physical':
            case 'status':
            case 'manager':
                return true;
        }
        return true;
    };


    const handleCreateOrUpdateBuilding = async (e) => {
        e.preventDefault();
        if (!validateBuildingForm()) return;

        try {
            if (editingBuildingId) {
                await api.put(`/logistics/buildings/${editingBuildingId}`, buildingForm);
                toast.success("Bâtiment mis à jour avec succès !");
            } else {
                await api.post('/logistics/buildings', buildingForm);
                toast.success("Bâtiment créé avec succès !");
            }
            resetBuildingForm();
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
        }
    };

    const handleEditBuilding = (building) => {
        setBuildingForm(building);
        setEditingBuildingId(building.id);
        setShowBuildingModal(true);
    };

    const handleDeleteBuilding = async (id) => {
        setPendingDelete({ id, type: 'building' });
    };

    const resetBuildingForm = () => {
        setBuildingForm(initialBuildingState);
        setEditingBuildingId(null);
        setShowBuildingModal(false);
    };

    const [showRoomList, setShowRoomList] = useState(true);

    // ... existing handlers ...

    const handleDeleteRoom = async (id) => {
        setPendingDelete({ id, type: 'room' });
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const { id, type } = pendingDelete;
        setPendingDelete(null);
        try {
            if (type === 'building') {
                await api.delete(`/logistics/buildings/${id}`);
                toast.success("Bâtiment supprimé.");
            } else {
                await api.delete(`/logistics/rooms/${id}`);
                toast.success("Salle supprimée avec succès");
            }
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression.");
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            if (editingRoomId) {
                await api.put(`/logistics/rooms/${editingRoomId}`, roomForm);
                toast.success("Salle mise à jour avec succès !");
            } else {
                await api.post('/logistics/rooms', roomForm);
                toast.success("Salle créée avec succès !");
            }
            setRoomForm(initialRoomState);
            setEditingRoomId(null);
            setShowRoomModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur de création");
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    {/* ... Title ... */}
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('spaces', 'Espaces')} <span className="text-indigo-600 dark:text-indigo-400">& {t('rooms', 'Salles')}</span>
                    </h1>
                    {/* ... subtitle ... */}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-white dark:bg-white/5 p-1 rounded-xl flex border border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vue Grille"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Vue Liste"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('dashboard')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Tableau de Bord"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </button>
                    </div>

                    <button
                        onClick={() => { resetBuildingForm(); setShowBuildingModal(true); }}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 flex items-center gap-2 justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {t('add_building', 'Ajouter Bâtiment')}
                    </button>
                    {buildings.length > 0 && (
                        <button
                            onClick={() => setShowRoomModal(true)}
                            className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 justify-center"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            {t('add_room', 'Ajouter Salle')}
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {buildings.map(b => (
                        <div key={b.id} className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditBuilding(b)} className="p-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteBuilding(b.id)} className="p-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-6 pr-20">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        {b.name}
                                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 uppercase tracking-widest">{b.code || 'N/A'}</span>
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {b.address}, {b.city}
                                    </p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${b.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {b.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">{b.totalRooms || 0}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Salles</span>
                                </div>
                                <div className="text-center border-l border-gray-200 dark:border-white/10">
                                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">{b.capacity || 0}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Capacité</span>
                                </div>
                                <div className="text-center border-l border-gray-200 dark:border-white/10">
                                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">{b.surfaceArea || '-'} m²</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Surface</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Salles disponbiles</h4>
                                {rooms.filter(r => r.buildingId === b.id).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {rooms.filter(r => r.buildingId === b.id).map(room => (
                                            <div key={room.id} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm truncate">{room.name}</span>
                                                    <span className="text-[10px] text-gray-400">{room.type}</span>
                                                </div>
                                                <span className={`w-2 h-2 rounded-full ${['Libre', 'Active'].includes(room.status) ? 'bg-emerald-500' : room.status === 'Occupée' ? 'bg-amber-500' : 'bg-rose-500'}`} title={room.status}></span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                        <p className="text-sm text-gray-400 italic">Aucune salle configurée.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-left">
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nom / Code</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Localisation</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacité</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="py-4 px-6 text-end text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {buildings.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900 dark:text-white">{b.name}</div>
                                            <div className="text-xs text-gray-400">{b.code}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{b.type}</td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-900 dark:text-white">{b.city}</div>
                                            <div className="text-xs text-gray-400">{b.address}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                                            {b.capacity} pers. <span className="text-gray-300 mx-1">|</span> {b.totalRooms} salles
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-end">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditBuilding(b)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDeleteBuilding(b.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in-up space-y-8">
                    {/* DASHBOARD VIEW */}
                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                        >
                            <svg className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            {showStats ? 'Masquer Statistiques' : 'Afficher Statistiques'}
                        </button>
                        <button
                            onClick={() => setShowRoomList(!showRoomList)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                        >
                            <svg className={`w-4 h-4 transition-transform ${showRoomList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            {showRoomList ? 'Masquer Liste' : 'Afficher Liste'}
                        </button>
                    </div>

                    {showStats && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KPICard title="Total Bâtiments" value={buildings.length || 0} icon="building" color="indigo" />
                                <KPICard title="Total Salles" value={rooms.length || 0} icon="room" color="emerald" />
                                <KPICard title="Capacité Totale" value={buildings.reduce((acc, b) => acc + (parseInt(b.capacity) || 0), 0)} icon="users" color="blue" />
                                <KPICard title="En Maintenance" value={rooms.filter(r => ['En maintenance', 'En rénovation'].includes(r.status) || ['En maintenance', 'En rénovation'].includes(r.condition)).length} icon="tool" color="rose" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* CHART 1: Room Status Distribution */}
                                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">État des Salles</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Libre', value: rooms.filter(r => ['Libre', 'Active'].includes(r.status)).length },
                                                        { name: 'Occupée', value: rooms.filter(r => r.status === 'Occupée').length },
                                                        { name: 'Maintenance', value: rooms.filter(r => ['En maintenance', 'En rénovation'].includes(r.status)).length },
                                                        { name: 'Autre', value: rooms.filter(r => !['Libre', 'Active', 'Occupée', 'En maintenance', 'En rénovation'].includes(r.status)).length }
                                                    ]}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10B981" /> {/* Free - Emerald */}
                                                    <Cell fill="#F59E0B" /> {/* Occupied - Amber */}
                                                    <Cell fill="#EF4444" /> {/* Maintenance - Red */}
                                                    <Cell fill="#9CA3AF" /> {/* Other - Gray */}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* CHART 2: Capacity by Building */}
                                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Capacité par Bâtiment</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={buildings.map(b => ({ name: b.name, capacity: b.capacity || 0 }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} tick={{ fill: '#9CA3AF' }} />
                                                <YAxis tick={{ fill: '#9CA3AF' }} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1F2937', color: 'white' }} />
                                                <Bar dataKey="capacity" fill="#6366F1" radius={[10, 10, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rooms List Table */}
                    {showRoomList && (
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-fade-in-up">
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Liste des Salles</h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                        {rooms.length} salles
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-[#1A1A1A] z-10">
                                        <tr className="border-b border-gray-100 dark:border-white/10 text-left">
                                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Salle</th>
                                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Bâtiment</th>
                                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacité</th>
                                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                            <th className="py-4 px-6 text-end text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {rooms.map(room => {
                                            const building = buildings.find(b => b.id === room.buildingId);
                                            return (
                                                <tr key={room.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <button
                                                            onClick={() => navigate(`/admin/logistics/rooms/${room.id}`)}
                                                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left title-font"
                                                        >
                                                            {room.name}
                                                        </button>
                                                        <div className="text-xs text-gray-400">{room.code}</div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">{building?.name || 'N/A'}</div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{room.type}</td>
                                                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{room.capacity} pers.</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${['Libre', 'Active'].includes(room.status) ? 'bg-emerald-100 text-emerald-700' :
                                                            room.status === 'Occupée' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${['Libre', 'Active'].includes(room.status) ? 'bg-emerald-500' :
                                                                room.status === 'Occupée' ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}></span>
                                                            {room.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-end">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => navigate(`/admin/logistics/rooms/${room.id}`)}
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                                                title="Voir/Modifier"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const normalizedRoom = {
                                                                        ...room,
                                                                        recurringSchedule: Array.isArray(room.recurringSchedule) ? room.recurringSchedule :
                                                                            (typeof room.recurringSchedule === 'string' ? JSON.parse(room.recurringSchedule) : []),
                                                                        facilities: Array.isArray(room.facilities) ? room.facilities :
                                                                            (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : []),
                                                                        photos: Array.isArray(room.photos) ? room.photos :
                                                                            (typeof room.photos === 'string' ? JSON.parse(room.photos) : []),
                                                                        maintenanceHistory: Array.isArray(room.maintenanceHistory) ? room.maintenanceHistory :
                                                                            (typeof room.maintenanceHistory === 'string' ? JSON.parse(room.maintenanceHistory) : [])
                                                                    };
                                                                    setRoomForm(normalizedRoom);
                                                                    setEditingRoomId(room.id);
                                                                    setShowRoomModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                                                                title="Gérer"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BUILDING MODAL */}
            {showBuildingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {editingBuildingId ? 'Modifier Bâtiment' : 'Nouveau Bâtiment'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {editingBuildingId ? 'Mettre à jour les informations du lieu.' : 'Enregistrez un nouveau lieu pour votre église.'}
                                </p>
                            </div>
                            <button onClick={resetBuildingForm} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-white dark:hover:bg-white/10">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100 dark:border-white/5 px-8">
                            {['general', 'location', 'physical', 'status', 'manager'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        if (validateCurrentTab()) {
                                            setActiveTab(tab);
                                        } else {
                                            toast.error('Veuillez remplir tous les champs requis avant de continuer.');
                                        }
                                    }}
                                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    {t(tab, tab.charAt(0).toUpperCase() + tab.slice(1))}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 overflow-y-auto noscrollbar flex-1">
                            <form id="buildingForm" onSubmit={handleCreateOrUpdateBuilding} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {activeTab === 'general' && (
                                    <>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom du Bâtiment <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.name} onChange={e => setBuildingForm({ ...buildingForm, name: e.target.value })} required />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Code / Référence <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.code} onChange={e => setBuildingForm({ ...buildingForm, code: e.target.value })} required />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type de Bâtiment <span className="text-red-500">*</span></label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.type} onChange={e => setBuildingForm({ ...buildingForm, type: e.target.value })} required>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="Temple">Temple</option>
                                                <option value="Chapelle">Chapelle</option>
                                                <option value="Salle polyvalente">Salle polyvalente</option>
                                                <option value="Bureau administratif">Bureau administratif</option>
                                                <option value="Salle de réunion">Salle de réunion</option>
                                                <option value="École">École</option>
                                                <option value="Bibliothèque">Bibliothèque</option>
                                                <option value="Clinique / Dispensaire">Clinique / Dispensaire</option>
                                                <option value="Centre communautaire">Centre communautaire</option>
                                                <option value="Logement">Logement</option>
                                                <option value="Maison d'hôtes">Maison d'hôtes</option>
                                                <option value="Cuisine">Cuisine</option>
                                                <option value="Entrepôt">Entrepôt</option>
                                                <option value="Parking">Parking</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                            <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                                value={buildingForm.description} onChange={e => setBuildingForm({ ...buildingForm, description: e.target.value })} />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'location' && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Adresse Complète <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.address} onChange={e => setBuildingForm({ ...buildingForm, address: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ville <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.city} onChange={e => setBuildingForm({ ...buildingForm, city: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quartier / Zone</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.district} onChange={e => setBuildingForm({ ...buildingForm, district: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pays</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.country} onChange={e => setBuildingForm({ ...buildingForm, country: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Latitude</label>
                                                <input type="number" step="any" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={buildingForm.latitude} onChange={e => setBuildingForm({ ...buildingForm, latitude: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Longitude</label>
                                                <input type="number" step="any" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    value={buildingForm.longitude} onChange={e => setBuildingForm({ ...buildingForm, longitude: e.target.value })} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'physical' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Superficie (m²)</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.surfaceArea} onChange={e => setBuildingForm({ ...buildingForm, surfaceArea: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nb. Étages</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.floors} onChange={e => setBuildingForm({ ...buildingForm, floors: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nb. Salles</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.totalRooms} onChange={e => setBuildingForm({ ...buildingForm, totalRooms: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Capacité Totale</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.capacity} onChange={e => setBuildingForm({ ...buildingForm, capacity: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Année Construction</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.constructionYear} onChange={e => setBuildingForm({ ...buildingForm, constructionYear: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">État Général</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.condition} onChange={e => setBuildingForm({ ...buildingForm, condition: e.target.value })}>
                                                <option value="Bon">Bon</option>
                                                <option value="Moyen">Moyen</option>
                                                <option value="Mauvais">Mauvais</option>
                                                <option value="En rénovation">En rénovation</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'status' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Statut</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.status} onChange={e => setBuildingForm({ ...buildingForm, status: e.target.value })}>
                                                <option value="Actif">Actif</option>
                                                <option value="Inactif">Inactif</option>
                                                <option value="En maintenance">En maintenance</option>
                                                <option value="Fermé temporairement">Fermé temporairement</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Usage Principal</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.usage} onChange={e => setBuildingForm({ ...buildingForm, usage: e.target.value })} placeholder="Ex: Culte, Mixte" />
                                        </div>
                                    </>
                                )}

                                {activeTab === 'manager' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type Responsable</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.managerType} onChange={e => setBuildingForm({ ...buildingForm, managerType: e.target.value })}>
                                                <option value="Membre">Membre</option>
                                                <option value="Staff">Staff</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom Complet</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.managerName} onChange={e => setBuildingForm({ ...buildingForm, managerName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Téléphone</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.managerPhone} onChange={e => setBuildingForm({ ...buildingForm, managerPhone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                            <input type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={buildingForm.managerEmail} onChange={e => setBuildingForm({ ...buildingForm, managerEmail: e.target.value })} />
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                            {/* Left: Cancel or Previous button */}
                            <div>
                                {activeTab === 'general' ? (
                                    <button onClick={resetBuildingForm} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                        Annuler
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const tabs = ['general', 'location', 'physical', 'status', 'manager'];
                                            const currentIndex = tabs.indexOf(activeTab);
                                            if (currentIndex > 0) {
                                                setActiveTab(tabs[currentIndex - 1]);
                                            }
                                        }}
                                        className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Précédent
                                    </button>
                                )}
                            </div>

                            {/* Right: Next or Submit button */}
                            <div>
                                {activeTab === 'manager' ? (
                                    <button
                                        type="submit"
                                        form="buildingForm"
                                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95"
                                    >
                                        {editingBuildingId ? 'Mettre à jour' : 'Créer Bâtiment'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (validateCurrentTab()) {
                                                const tabs = ['general', 'location', 'physical', 'status', 'manager'];
                                                const currentIndex = tabs.indexOf(activeTab);
                                                if (currentIndex < tabs.length - 1) {
                                                    setActiveTab(tabs[currentIndex + 1]);
                                                }
                                            }
                                        }}
                                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95 flex items-center gap-2"
                                    >
                                        Suivant
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROOM MODAL - Multi-tab comprehensive form */}
            {showRoomModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in flex flex-col">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {editingRoomId ? 'Modifier Salle' : 'Nouvelle Salle'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {editingRoomId ? 'Mettre à jour les informations de la salle.' : 'Enregistrez une nouvelle salle dans un bâtiment.'}
                                </p>
                            </div>
                            <button onClick={() => { setShowRoomModal(false); setRoomForm(initialRoomState); setEditingRoomId(null); }} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-white dark:hover:bg-white/10">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex border-b border-gray-100 dark:border-white/5 px-8 overflow-x-auto">
                            {['general', 'physical', 'status', 'schedules', 'equipment', 'manager', 'security'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveRoomTab(tab)}
                                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeRoomTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    {tab === 'general' && 'Général'}
                                    {tab === 'physical' && 'Caractéristiques'}
                                    {tab === 'status' && 'Statut & Usage'}
                                    {tab === 'schedules' && 'Horaires'}
                                    {tab === 'equipment' && 'Équipements'}
                                    {tab === 'manager' && 'Responsable'}
                                    {tab === 'security' && 'Sécurité'}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 overflow-y-auto noscrollbar flex-1">
                            <form id="roomForm" onSubmit={handleCreateRoom} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* TAB 1: GÉNÉRAL */}
                                {activeRoomTab === 'general' && (
                                    <>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom de la Salle <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Code / Référence</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.code} onChange={e => setRoomForm({ ...roomForm, code: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bâtiment Associé <span className="text-red-500">*</span></label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.buildingId} onChange={e => setRoomForm({ ...roomForm, buildingId: e.target.value })} required>
                                                <option value="">-- Sélectionner --</option>
                                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Étage / Niveau</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} placeholder="Ex: RDC, 1er étage" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type de Salle <span className="text-red-500">*</span></label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} required>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="Culte">Culte</option>
                                                <option value="Réunion">Réunion</option>
                                                <option value="Classe">Classe</option>
                                                <option value="Répétition">Répétition</option>
                                                <option value="Bureau">Bureau</option>
                                                <option value="Polyvalente">Polyvalente</option>
                                                <option value="Stockage">Stockage</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* TAB 2: CARACTÉRISTIQUES PHYSIQUES */}
                                {activeRoomTab === 'physical' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Superficie (m²)</label>
                                            <input type="number" step="0.01" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.area} onChange={e => setRoomForm({ ...roomForm, area: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Capacité Maximale <span className="text-red-500">*</span></label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Disposition</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.layout} onChange={e => setRoomForm({ ...roomForm, layout: e.target.value })}>
                                                <option value="">-- Sélectionner --</option>
                                                <option value="Théâtre">Théâtre</option>
                                                <option value="Classe">Classe</option>
                                                <option value="Cercle">Cercle</option>
                                                <option value="Modulable">Modulable</option>
                                                <option value="Fixe">Fixe</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">État Général</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.condition} onChange={e => setRoomForm({ ...roomForm, condition: e.target.value })}>
                                                <option value="Bon">Bon</option>
                                                <option value="Moyen">Moyen</option>
                                                <option value="Mauvais">Mauvais</option>
                                                <option value="En maintenance">En maintenance</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* TAB 3: STATUT & USAGE */}
                                {activeRoomTab === 'status' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Statut</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.status} onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}>
                                                <option value="Libre">Libre</option>
                                                <option value="Occupée">Occupée</option>
                                                <option value="Réservée">Réservée</option>
                                                <option value="En maintenance">En maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Usage Autorisé</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.authorizedUse} onChange={e => setRoomForm({ ...roomForm, authorizedUse: e.target.value })} placeholder="formation, répétition, culte" />
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={roomForm.isBookable} onChange={e => setRoomForm({ ...roomForm, isBookable: e.target.checked })} />
                                            <label className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Réservable</label>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Durée Max Réservation (heures)</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.maxBookingDuration} onChange={e => setRoomForm({ ...roomForm, maxBookingDuration: e.target.value })} />
                                        </div>
                                        <div className="flex items-center col-span-2">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={roomForm.requiresApproval} onChange={e => setRoomForm({ ...roomForm, requiresApproval: e.target.checked })} />
                                            <label className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Requiert une approbation pour réservation</label>
                                        </div>
                                    </>
                                )}


                                {/* TAB 4: HORAIRES */}
                                {activeRoomTab === 'schedules' && (
                                    <div className="col-span-2 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Horaires Récurrents</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Définissez les créneaux fixes hebdomadaires (ex: culte du dimanche, réunions)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSchedule = [...(roomForm.recurringSchedule || []), { day: 'Dimanche', startTime: '08:00', endTime: '12:00', description: '' }];
                                                    setRoomForm({ ...roomForm, recurringSchedule: newSchedule });
                                                }}
                                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Ajouter un créneau
                                            </button>
                                        </div>

                                        {Array.isArray(roomForm.recurringSchedule) && roomForm.recurringSchedule.length > 0 ? (
                                            <div className="space-y-4">
                                                {roomForm.recurringSchedule.map((schedule, index) => (
                                                    <div key={index} className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jour</label>
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={schedule.day}
                                                                    onChange={e => {
                                                                        const updated = [...roomForm.recurringSchedule];
                                                                        updated[index].day = e.target.value;
                                                                        setRoomForm({ ...roomForm, recurringSchedule: updated });
                                                                    }}
                                                                >
                                                                    <option value="Lundi">Lundi</option>
                                                                    <option value="Mardi">Mardi</option>
                                                                    <option value="Mercredi">Mercredi</option>
                                                                    <option value="Jeudi">Jeudi</option>
                                                                    <option value="Vendredi">Vendredi</option>
                                                                    <option value="Samedi">Samedi</option>
                                                                    <option value="Dimanche">Dimanche</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Début</label>
                                                                <input
                                                                    type="time"
                                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={schedule.startTime}
                                                                    onChange={e => {
                                                                        const updated = [...roomForm.recurringSchedule];
                                                                        updated[index].startTime = e.target.value;
                                                                        setRoomForm({ ...roomForm, recurringSchedule: updated });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fin</label>
                                                                <input
                                                                    type="time"
                                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={schedule.endTime}
                                                                    onChange={e => {
                                                                        const updated = [...roomForm.recurringSchedule];
                                                                        updated[index].endTime = e.target.value;
                                                                        setRoomForm({ ...roomForm, recurringSchedule: updated });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex items-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = roomForm.recurringSchedule.filter((_, i) => i !== index);
                                                                        setRoomForm({ ...roomForm, recurringSchedule: updated });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Supprimer
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description (optionnel)</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                value={schedule.description || ''}
                                                                onChange={e => {
                                                                    const updated = [...roomForm.recurringSchedule];
                                                                    updated[index].description = e.target.value;
                                                                    setRoomForm({ ...roomForm, recurringSchedule: updated });
                                                                }}
                                                                placeholder="Ex: Culte dominical, Réunion de prière, École du dimanche"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                                                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-2">Aucun horaire récurrent</p>
                                                <p className="text-sm text-gray-400">Cliquez sur "Ajouter un créneau" pour définir des horaires fixes</p>
                                            </div>
                                        )}
                                    </div>
                                )}


                                {activeRoomTab === 'equipment' && (
                                    <div className="col-span-2 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Équipements & Matériels</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Listez les équipements disponibles dans cette salle avec leurs quantités</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFacilities = [...(roomForm.facilities || []), { name: '', quantity: 1, shared: false }];
                                                    setRoomForm({ ...roomForm, facilities: newFacilities });
                                                }}
                                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                                Ajouter équipement
                                            </button>
                                        </div>

                                        {Array.isArray(roomForm.facilities) && roomForm.facilities.length > 0 ? (
                                            <div className="space-y-4">
                                                {roomForm.facilities.map((equipment, index) => (
                                                    <div key={index} className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nom de l'équipement</label>
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={equipment.name}
                                                                    onChange={e => {
                                                                        const updated = [...roomForm.facilities];
                                                                        updated[index].name = e.target.value;
                                                                        setRoomForm({ ...roomForm, facilities: updated });
                                                                    }}
                                                                >
                                                                    <option value="">-- Sélectionner --</option>
                                                                    <option value="Chaises">Chaises</option>
                                                                    <option value="Tables">Tables</option>
                                                                    <option value="Projecteur">Projecteur</option>
                                                                    <option value="Écran">Écran</option>
                                                                    <option value="Sono / Sound system">Sono / Sound system</option>
                                                                    <option value="Microphones">Microphones</option>
                                                                    <option value="Climatisation">Climatisation</option>
                                                                    <option value="Ventilateurs">Ventilateurs</option>
                                                                    <option value="Tableau">Tableau</option>
                                                                    <option value="Piano / Instruments">Piano / Instruments</option>
                                                                    <option value="Wifi">Wifi</option>
                                                                    <option value="Autre">Autre</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantité</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                    value={equipment.quantity}
                                                                    onChange={e => {
                                                                        const updated = [...roomForm.facilities];
                                                                        updated[index].quantity = parseInt(e.target.value) || 1;
                                                                        setRoomForm({ ...roomForm, facilities: updated });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex items-end gap-2">
                                                                <div className="flex items-center flex-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        checked={equipment.shared}
                                                                        onChange={e => {
                                                                            const updated = [...roomForm.facilities];
                                                                            updated[index].shared = e.target.checked;
                                                                            setRoomForm({ ...roomForm, facilities: updated });
                                                                        }}
                                                                    />
                                                                    <label className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Partagé</label>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = roomForm.facilities.filter((_, i) => i !== index);
                                                                        setRoomForm({ ...roomForm, facilities: updated });
                                                                    }}
                                                                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                                                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <p className="text-gray-500 dark:text-gray-400 font-semibold mb-2">Aucun équipement</p>
                                                <p className="text-sm text-gray-400">Cliquez sur "Ajouter équipement" pour commencer</p>
                                            </div>
                                        )}
                                    </div>
                                )}


                                {/* TAB 6: RESPONSABLE */}
                                {activeRoomTab === 'manager' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type Responsable</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.managerType} onChange={e => setRoomForm({ ...roomForm, managerType: e.target.value })}>
                                                <option value="Membre">Membre</option>
                                                <option value="Staff">Staff</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.managerContact} onChange={e => setRoomForm({ ...roomForm, managerContact: e.target.value })} placeholder="Téléphone ou email" />
                                        </div>
                                    </>
                                )}

                                {/* TAB 7: SÉCURITÉ & MAINTENANCE */}
                                {activeRoomTab === 'security' && (
                                    <>
                                        <div className="flex items-center">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={roomForm.pmrAccess} onChange={e => setRoomForm({ ...roomForm, pmrAccess: e.target.checked })} />
                                            <label className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Accès PMR (Personnes à Mobilité Réduite)</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={roomForm.emergencyExits} onChange={e => setRoomForm({ ...roomForm, emergencyExits: e.target.checked })} />
                                            <label className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Issues de secours</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={roomForm.electricalSystem} onChange={e => setRoomForm({ ...roomForm, electricalSystem: e.target.checked })} />
                                            <label className="ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Système électrique fonctionnel</label>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Règles Particulières</label>
                                            <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                                value={roomForm.specialRules} onChange={e => setRoomForm({ ...roomForm, specialRules: e.target.value })} placeholder="Interdictions, limitations sonores, etc." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dernière Inspection</label>
                                            <input type="date" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.lastInspection} onChange={e => setRoomForm({ ...roomForm, lastInspection: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prochaine Maintenance</label>
                                            <input type="date" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={roomForm.nextMaintenance} onChange={e => setRoomForm({ ...roomForm, nextMaintenance: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observations</label>
                                            <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                                value={roomForm.observations} onChange={e => setRoomForm({ ...roomForm, observations: e.target.value })} />
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>

                        <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                            <div>
                                {activeRoomTab === 'general' ? (
                                    <button onClick={() => { setShowRoomModal(false); setRoomForm(initialRoomState); setEditingRoomId(null); }} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                        Annuler
                                    </button>
                                ) : (
                                    <button onClick={() => {
                                        const tabs = ['general', 'physical', 'status', 'schedules', 'equipment', 'manager', 'security'];
                                        const currentIndex = tabs.indexOf(activeRoomTab);
                                        if (currentIndex > 0) setActiveRoomTab(tabs[currentIndex - 1]);
                                    }} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Précédent
                                    </button>
                                )}
                            </div>
                            <div>
                                {activeRoomTab === 'security' ? (
                                    <button type="submit" form="roomForm" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95">
                                        {editingRoomId ? 'Mettre à jour' : 'Créer Salle'}
                                    </button>
                                ) : (
                                    <button onClick={() => {
                                        const tabs = ['general', 'physical', 'status', 'schedules', 'equipment', 'manager', 'security'];
                                        const currentIndex = tabs.indexOf(activeRoomTab);
                                        if (currentIndex < tabs.length - 1) setActiveRoomTab(tabs[currentIndex + 1]);
                                    }} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95 flex items-center gap-2">
                                        Suivant
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={pendingDelete?.type === 'building' ? 'Supprimer ce bâtiment ?' : 'Supprimer cette salle ?'}
                message={pendingDelete?.type === 'building'
                    ? 'Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible.'
                    : 'Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible.'}
            />
        </AdminLayout>
    );
};

// ... existing code ...
export default Spaces;

const KPICard = ({ title, value, icon, color }) => {
    const icons = {
        'building': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
        'room': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
        'users': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
        'tool': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    };

    const bgColors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${bgColors[color]}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icons[icon]}
                    </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {value ?? 0}
            </div>
        </div>
    );
};
