import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import PlanModal from '../../components/SaaS/PlanModal';
import { Copy, CheckCircle, X } from 'lucide-react';
import {
    HiOutlinePlayCircle,
    HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import {
    LayoutDashboard, Church as ChurchIcon, CreditCard, Users,
    LogOut, Search, TrendingUp,
    DollarSign, Activity,
    FileSpreadsheet,
    Bell, Trash2, Edit, ShieldCheck,
    ExternalLink, PauseCircle, PlayCircle, FileText, ChevronLeft,
    Sun, Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ChurchEditModal from '../../components/SaaS/ChurchEditModal';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaRevenueChart, RegistrationBarChart, PlanPieChart, UserGrowthChart } from '../../components/SaaS/StatsCharts';
import AlertModal from '../../components/ChurchAlertModal';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', confirmColor = 'red' }) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal Panel */}
            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${confirmColor === 'red' ? 'bg-red-100 dark:bg-red-900/30' : confirmColor === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <HiOutlineExclamationTriangle className={`h-6 w-6 ${confirmColor === 'red' ? 'text-red-600' : confirmColor === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        className={`inline-flex justify-center rounded-xl border border-transparent shadow-sm px-5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${colorClasses[confirmColor] || colorClasses.red}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-2.5 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuperAdminDashboard = () => {
    const { user: currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Data State
    const [churches, setChurches] = useState([]);
    const [plans, setPlans] = useState([]);
    const [superStats, setSuperStats] = useState({
        kpis: { totalRevenue: 0, monthlyRevenue: 0, revenueGrowth: 0, churchGrowth: 0, totalChurches: 0, activeChurches: 0, totalUsers: 0 },
        charts: { planDistribution: [], revenueHistory: [], registrationHistory: [], userHistory: [] }
    });
    const [transactions, setTransactions] = useState([]);

    // UI State
    const [, setLoading] = useState(true);
    const [activeView, setActiveView] = useState(() => localStorage.getItem('superAdminView') || 'dashboard');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showChurchModal, setShowChurchModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [editingChurch, setEditingChurch] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [superAdmins, setSuperAdmins] = useState([]);
    const [loadingSuperAdmins, setLoadingSuperAdmins] = useState(false);

    // Bulk Selection State
    const [selectedChurches, setSelectedChurches] = useState([]);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        confirmColor: 'red',
        onConfirm: () => { }
    });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    // Advanced Filtering States
    const [statsYear, setStatsYear] = useState(new Date().getFullYear());
    const [statsMonth, setStatsMonth] = useState(new Date().getMonth() + 1);
    const [churchSearch, setChurchSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Transaction Filtering States
    const [transSearch, setTransSearch] = useState('');
    const [transStartDate, setTransStartDate] = useState('');
    const [transEndDate, setTransEndDate] = useState('');
    const [selectedTransPlan, setSelectedTransPlan] = useState('all');
    const [selectedTransStatus, setSelectedTransStatus] = useState('all');

    const handleSearch = async (query) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/saas/users/search?q=${query}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search error", error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [churchRes, planRes, statsRes, transRes] = await Promise.all([
                api.get('/saas/churches'),
                api.get('/saas/plans/all'),
                api.get(`/saas/superadmin/stats?year=${statsYear}&month=${statsMonth}`),
                api.get('/saas/superadmin/transactions')
            ]);
            setChurches(churchRes.data);
            setPlans(planRes.data);
            setSuperStats(statsRes.data);
            setTransactions(transRes.data);
        } catch (err) {
            console.error("Erreur loading data", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchData();
        localStorage.setItem('superAdminView', activeView);
    }, [activeView, statsYear, statsMonth]);

    const fetchSuperAdmins = async () => {
        setLoadingSuperAdmins(true);
        try {
            const resChurches = await api.get('/saas/churches');
            const systemChurch = resChurches.data.find(c => c.subdomain === 'admin-system');
            if (systemChurch) {
                const resUsers = await api.get(`/saas/churches/${systemChurch.id}/users`);
                setSuperAdmins(resUsers.data);
            }
        } catch (error) {
            console.error("Error fetching super admins", error);
        } finally {
            setLoadingSuperAdmins(false);
        }
    };

    useEffect(() => {
        if (activeView === 'super-admins') {
            fetchSuperAdmins();
        }
    }, [activeView]);

    // Filter Logic
    const filteredChurches = (churches || []).filter(church => {
        const matchesSearch =
            (church.name || '').toLowerCase().includes(churchSearch.toLowerCase()) ||
            (church.subdomain || '').toLowerCase().includes(churchSearch.toLowerCase()) ||
            (church.adminEmail && church.adminEmail.toLowerCase().includes(churchSearch.toLowerCase()));

        const churchDate = new Date(church.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesDate = (!start || churchDate >= start) && (!end || churchDate <= end);

        const matchesPlan = selectedPlan === 'all' || (church.planName || '').toLowerCase().includes(selectedPlan.toLowerCase());

        const isExpired = (church.status === 'active' || church.status === 'suspended') &&
            church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < new Date();

        let matchesStatus = selectedStatus === 'all' || church.status === selectedStatus;
        if (selectedStatus === 'expired') {
            matchesStatus = isExpired;
        } else if (selectedStatus === 'active') {
            matchesStatus = church.status === 'active' && !isExpired;
        } else if (selectedStatus === 'suspended') {
            matchesStatus = church.status === 'suspended' && !isExpired;
        }

        return matchesSearch && matchesDate && matchesPlan && matchesStatus;
    });

    const filteredTransactions = (transactions || []).filter(t => {
        const matchesSearch =
            (t.church?.name || '').toLowerCase().includes(transSearch.toLowerCase()) ||
            (t.church?.adminEmail || '').toLowerCase().includes(transSearch.toLowerCase());

        const tDate = new Date(t.createdAt);
        const start = transStartDate ? new Date(transStartDate) : null;
        const end = transEndDate ? new Date(transEndDate) : null;
        const matchesDate = (!start || tDate >= start) && (!end || tDate <= end);

        const matchesPlan = selectedTransPlan === 'all' || (t.plan?.name || '').toLowerCase().includes(selectedTransPlan.toLowerCase());

        // Use church status for transaction filtering if available
        const churchStatus = t.church?.status || 'active';
        const isExpired = (churchStatus === 'active' || churchStatus === 'suspended') &&
            t.church?.subscriptionExpiresAt && new Date(t.church?.subscriptionExpiresAt) < new Date();

        let matchesStatus = selectedTransStatus === 'all' || churchStatus === selectedTransStatus;
        if (selectedTransStatus === 'expired') {
            matchesStatus = isExpired;
        } else if (selectedTransStatus === 'active') {
            matchesStatus = churchStatus === 'active' && !isExpired;
        } else if (selectedTransStatus === 'suspended') {
            matchesStatus = churchStatus === 'suspended' && !isExpired;
        }

        return matchesSearch && matchesDate && matchesPlan && matchesStatus;
    });

    // Export Functions
    const exportToExcel = async () => {
        const { utils, writeFile } = await import('xlsx');
        const data = filteredChurches.map(c => ({
            'Nom Église': c.name,
            'Sous-domaine': c.subdomain,
            'Membres': c.userCount,
            'Email Admin': c.adminEmail,
            'Plan': c.planName,
            'Date Début': c.subscriptionStartedAt ? new Date(c.subscriptionStartedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString(),
            'Date Sommet': c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).toLocaleDateString() : 'N/A',
            'Statut': c.status
        }));
        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Églises");
        writeFile(wb, `ElyonSys360_Eglises_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();
        doc.text("ElyonSys 360 - Liste des Églises", 14, 15);

        const tableData = filteredChurches.map(c => [
            c.name,
            c.subdomain,
            c.userCount,
            c.adminEmail,
            c.planName,
            c.subscriptionStartedAt ? new Date(c.subscriptionStartedAt).toLocaleDateString() : (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'),
            c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).toLocaleDateString() : 'N/A',
            c.status
        ]);

        autoTable(doc, {
            head: [['Église', 'Domaine', 'Membres', 'Admin', 'Plan', 'Début', 'Sommet', 'Statut']],
            body: tableData,
            startY: 20
        });
        doc.save(`ElyonSys360_Eglises_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // --- Actions: Churches ---

    const handleStatusChange = async (churchId, currentStatus) => {
        const church = churches.find(c => c.id === churchId);
        const isExpired = church && church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < new Date();
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        let updateData = { status: newStatus };

        if (newStatus === 'active' && isExpired) {
            setConfirmModal({
                isOpen: true,
                title: 'Abonnement expiré',
                message: `Cette église a un abonnement expiré. Voulez-vous renouveler l'abonnement d'un mois en l'activant ?`,
                confirmText: 'Renouveler & Activer',
                confirmColor: 'green',
                onConfirm: () => {
                    const newExp = new Date();
                    newExp.setMonth(newExp.getMonth() + 1);
                    updateData.subscriptionExpiresAt = newExp;
                    performStatusUpdate(churchId, updateData, newStatus);
                }
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: `Confirmer le changement de statut`,
                message: `Voulez-vous vraiment ${newStatus === 'active' ? 'activer' : 'suspendre'} cette église ?\n\n${newStatus !== 'active' ? 'L\'accès sera bloqué pour tous les utilisateurs.' : 'L\'accès sera rétabli.'}`,
                confirmText: newStatus === 'active' ? 'Activer' : 'Suspendre',
                confirmColor: newStatus === 'active' ? 'green' : 'yellow',
                onConfirm: () => performStatusUpdate(churchId, updateData, newStatus)
            });
        }
    };

    const performStatusUpdate = async (churchId, updateData, newStatus) => {
        try {
            await api.put(`/saas/churches/${churchId}/status`, updateData);
            setChurches(churches.map(c => c.id === churchId ? {
                ...c,
                status: newStatus,
                subscriptionExpiresAt: updateData.subscriptionExpiresAt || c.subscriptionExpiresAt
            } : c));
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Error updating status", error);
            setAlertMessage({
                show: true,
                title: "Erreur",
                message: "Erreur lors de la mise à jour du statut",
                type: "error"
            });
        }
    };

    const handleEditChurch = (church) => {
        setEditingChurch(church);
        setShowChurchModal(true);
    };

    const handleSaveChurch = async (churchData) => {
        try {
            await api.put(`/saas/churches/${editingChurch.id}/details`, churchData);
            setChurches(churches.map(c => c.id === editingChurch.id ? { ...c, ...churchData } : c));
            setShowChurchModal(false);
            setEditingChurch(null);
        } catch (error) {
            console.error("Error saving church", error);
            setAlertMessage({
                show: true,
                title: "Erreur",
                message: "Erreur lors de l'enregistrement des modifications",
                type: "error"
            });
        }
    };

    const handleDeleteChurch = (churchId) => {
        const church = churches.find(c => c.id === churchId);
        if (church?.subdomain === 'admin-system') {
            setAlertMessage({
                show: true,
                title: "Restriction",
                message: "L'institution système (admin-system) ne peut pas être supprimée.",
                type: "warning"
            });
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Supprimer l\'église ?',
            message: 'ATTENTION: Cette action est irréversible.\n\nVoulez-vous vraiment supprimer cette église et toutes ses données (membres, dons, événements...) ?',
            confirmText: 'Supprimer définitivement',
            confirmColor: 'red',
            onConfirm: async () => {
                try {
                    await api.delete(`/saas/churches/${churchId}`);
                    setChurches(churches.filter(c => c.id !== churchId));
                    setSuperStats(prev => ({
                        ...prev,
                        kpis: { ...prev.kpis, totalChurches: prev.kpis.totalChurches - 1 }
                    }));
                    setSelectedChurches(prev => prev.filter(id => id !== churchId));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error deleting church", error);
                    setAlertMessage({
                        show: true,
                        title: "Erreur",
                        message: error.response?.data?.message || "Erreur lors de la suppression",
                        type: "error"
                    });
                }
            }
        });
    };

    // Bulk Actions
    const handleSelectChurch = (churchId) => {
        const church = churches.find(c => c.id === churchId);
        if (church?.subdomain === 'admin-system') {
            return; // Cannot select system church for bulk actions
        }
        setSelectedChurches(prev => {
            if (prev.includes(churchId)) {
                return prev.filter(id => id !== churchId);
            } else {
                return [...prev, churchId];
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedChurches(filteredChurches.filter(c => c.subdomain !== 'admin-system').map(c => c.id));
        } else {
            setSelectedChurches([]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedChurches.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: `Supprimer ${selectedChurches.length} églises ?`,
            message: `ATTENTION: Vous allez supprimer ${selectedChurches.length} églises.\n\nCette action est IRRÉVERSIBLE et supprimera TOUTES les données associées (membres, dons, etc.).\n\nVoulez-vous vraiment continuer ?`,
            confirmText: `Supprimer ${selectedChurches.length} églises`,
            confirmColor: 'red',
            onConfirm: async () => {
                let _successCount = 0;
                let _failCount = 0;

                for (const churchId of selectedChurches) {
                    try {
                        await api.delete(`/saas/churches/${churchId}`);
                        _successCount++;
                    } catch (error) {
                        console.error(`Error deleting church ${churchId}`, error);
                        _failCount++;
                    }
                }

                // Refresh data
                fetchData();
                setSelectedChurches([]);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };



    const handleDeleteSuperAdmin = (userId) => {
        if (!currentUser?.role?.includes('super_admin')) return;

        setConfirmModal({
            isOpen: true,
            title: 'Supprimer cet accès ?',
            message: 'Voulez-vous vraiment supprimer cet utilisateur de l\'administration système ?\n\nCette action retirera ses accès à ce tableau de bord.',
            confirmText: 'Supprimer l\'accès',
            confirmColor: 'red',
            onConfirm: async () => {
                try {
                    await api.delete(`/saas/users/${userId}`);
                    setSuperAdmins(prev => prev.filter(u => u.id !== userId));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error deleting super admin", error);
                    setAlertMessage({
                        show: true,
                        title: "Erreur",
                        message: error.response?.data?.message || "Erreur lors de la suppression",
                        type: "error"
                    });
                }
            }
        });
    };

    const handleNewSuperAdmin = () => {
        // Rediriger vers la création de membre pour l'église admin-system
        const fetchSystemChurch = async () => {
            const resChurches = await api.get('/saas/churches');
            const systemChurch = resChurches.data.find(c => c.subdomain === 'admin-system');
            if (systemChurch) {
                window.location.href = `/super-admin/church/${systemChurch.id}/members/new`;
            }
        };
        fetchSystemChurch();
    };

    const handleSavePlan = async (planData) => {
        try {
            if (editingPlan) {
                const res = await api.put(`/saas/plans/${editingPlan.id}`, planData);
                setPlans(plans.map(p => p.id === editingPlan.id ? res.data : p));
            } else {
                const res = await api.post('/saas/plans', planData);
                setPlans([...plans, res.data]);
            }
            setShowPlanModal(false);
            setEditingPlan(null);
        } catch (error) {
            console.error("Error saving plan", error);
            setAlertMessage({
                show: true,
                title: "Erreur",
                message: "Erreur lors de l'enregistrement du plan",
                type: "error"
            });
        }
    };

    const handleDeletePlan = async (planId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer ce plan ?',
            message: 'Voulez-vous vraiment supprimer ce plan ?\n\nLes églises utilisant ce plan ne seront pas supprimées.',
            confirmText: 'Supprimer le plan',
            confirmColor: 'red',
            onConfirm: async () => {
                try {
                    await api.delete(`/saas/plans/${planId}`);
                    setPlans(plans.filter(p => p.id !== planId));
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error("Error deleting plan", error);
                    setAlertMessage({
                        show: true,
                        title: "Erreur",
                        message: "Impossible de supprimer ce plan (peut-être utilisé par des églises ?)",
                        type: "error"
                    });
                }
            }
        });
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                className="w-72 bg-white dark:bg-[#1e293b] border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-xl z-30"
            >
                <div className="p-8 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight dark:text-white">Elyon<span className="text-indigo-600">360</span></h1>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Super Administration</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={20} />} label="Tableau de bord" />
                    <NavButton active={activeView === 'churches'} onClick={() => setActiveView('churches')} icon={<ChurchIcon size={20} />} label="Églises" />
                    <NavButton active={activeView === 'super-admins'} onClick={() => setActiveView('super-admins')} icon={<ShieldCheck size={20} />} label="Contributeurs" />
                    <NavButton active={activeView === 'plans'} onClick={() => setActiveView('plans')} icon={<CreditCard size={20} />} label="Abonnements" />
                    <NavButton active={activeView === 'search'} onClick={() => setActiveView('search')} icon={<Users size={20} />} label="Recherche Globale" />
                    <NavButton active={activeView === 'transactions'} onClick={() => setActiveView('transactions')} icon={<DollarSign size={20} />} label="Transactions" />
                </nav>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all font-bold text-sm group">
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 z-20">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-bold capitalize text-gray-800 dark:text-white">
                            {activeView === 'dashboard' ? 'Vue d\'ensemble' : (activeView === 'super-admins' ? 'Utilisateurs Système' : activeView)}
                        </h2>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Recherche rapide..."
                                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#0f172a] border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                            />
                        </div>
                        <NotificationDropdown />
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#0f172a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center border border-transparent dark:border-gray-800"
                            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
                        >
                            {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
                        </button>
                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black shadow-lg">
                                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-bold dark:text-white leading-tight">{currentUser?.firstName} {currentUser?.lastName}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    {currentUser?.role?.includes('super_admin') ? 'Super Admin' : (currentUser?.role?.includes('super_admin_secretaire') ? 'Secrétaire' : 'Contributeur')}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrolled Viewport */}
                <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-[#0f172a]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeView === 'dashboard' && <DashboardView stats={superStats} year={statsYear} setYear={setStatsYear} month={statsMonth} setMonth={setStatsMonth} />}
                            {activeView === 'churches' && <ChurchesView
                                churches={filteredChurches}
                                onStatusChange={handleStatusChange}
                                onEdit={handleEditChurch}
                                onDelete={handleDeleteChurch}
                                onSelect={handleSelectChurch}
                                onSelectAll={handleSelectAll}
                                selectedIds={selectedChurches}
                                allSelected={filteredChurches.length > 0 && selectedChurches.length === filteredChurches.length}
                                onBulkDelete={handleBulkDelete}
                                onExportExcel={exportToExcel}
                                onExportPDF={exportToPDF}
                                churchSearch={churchSearch}
                                setChurchSearch={setChurchSearch}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                endDate={endDate}
                                setEndDate={setEndDate}
                                selectedPlan={selectedPlan}
                                setSelectedPlan={setSelectedPlan}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                                currentUser={currentUser}
                            />}
                            {activeView === 'plans' && <PlansView
                                plans={plans}
                                onEdit={(p) => { setEditingPlan(p); setShowPlanModal(true); }}
                                onDelete={handleDeletePlan}
                                onNew={() => { setEditingPlan(null); setShowPlanModal(true); }}
                                currentUser={currentUser}
                            />}
                            {activeView === 'super-admins' && <SuperAdminsView
                                users={superAdmins}
                                loading={loadingSuperAdmins}
                                onNew={handleNewSuperAdmin}
                                onDelete={handleDeleteSuperAdmin}
                                currentUser={currentUser}
                            />}
                            {activeView === 'search' && <GlobalSearchView
                                results={searchResults}
                                onSearch={handleSearch}
                            />}
                            {activeView === 'transactions' && <TransactionsView
                                transactions={filteredTransactions}
                                search={transSearch}
                                setSearch={setTransSearch}
                                startDate={transStartDate}
                                setStartDate={setTransStartDate}
                                endDate={transEndDate}
                                setEndDate={setTransEndDate}
                                selectedPlan={selectedTransPlan}
                                setSelectedPlan={setSelectedTransPlan}
                                selectedStatus={selectedTransStatus}
                                setSelectedStatus={setSelectedTransStatus}
                            />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <PlanModal
                show={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                onSave={handleSavePlan}
                plan={editingPlan}
            />

            <ChurchEditModal
                show={showChurchModal}
                onClose={() => setShowChurchModal(false)}
                onSave={handleSaveChurch}
                church={editingChurch}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmColor={confirmModal.confirmColor}
            />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </div>
    );
};

// --- Sub-components & Views ---

const NavButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const DashboardView = ({ stats, year, setYear, month, setMonth }) => {
    const revenueData = stats.charts.revenueHistory.map(h => ({ name: h.name, revenue: h.revenue }));
    const registrationData = stats.charts.registrationHistory.map(h => ({ name: h.name, registrations: h.registrations }));
    const userData = stats.charts.userHistory?.map(u => ({ name: u.name, users: u.users })) || [];
    const planData = stats.charts.planDistribution.map(p => ({ name: p.name, value: p.value }));

    const revRef = useRef(null);
    const regRef = useRef(null);
    const userRef = useRef(null);

    useEffect(() => {
        // Scroll to current month (index 11)
        const scrollAmount = 750; // Approximative for 13 months
        if (revRef.current) revRef.current.scrollLeft = scrollAmount;
        if (regRef.current) regRef.current.scrollLeft = scrollAmount;
        if (userRef.current) userRef.current.scrollLeft = scrollAmount;
    }, [stats]);

    const kpiCards = [
        {
            title: 'Revenu Total',
            value: (stats.kpis.totalRevenue || 0).toLocaleString('fr-FR') + ' HTG',
            trend: null,
            trendUp: true,
            icon: <DollarSign size={20} className="text-emerald-500" />,
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
            subtitle: null,
        },
        {
            title: 'Revenu Mensuel',
            value: (stats.kpis.monthlyRevenue || 0).toLocaleString('fr-FR') + ' HTG',
            trend: stats.kpis.revenueGrowth && stats.kpis.revenueGrowth !== 0 ? (stats.kpis.revenueGrowth > 0 ? `+${stats.kpis.revenueGrowth.toFixed(1)}%` : `${stats.kpis.revenueGrowth.toFixed(1)}%`) : null,
            trendUp: stats.kpis.revenueGrowth >= 0,
            icon: <TrendingUp size={20} className="text-indigo-500" />,
            iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
            subtitle: "Vs mois dernier",
        },
        {
            title: 'Eglises Actives',
            value: stats.kpis.activeChurches || 0,
            trend: stats.kpis.churchGrowth && stats.kpis.churchGrowth !== 0 ? (stats.kpis.churchGrowth > 0 ? `+${stats.kpis.churchGrowth.toFixed(1)}%` : `${stats.kpis.churchGrowth.toFixed(1)}%`) : null,
            trendUp: stats.kpis.churchGrowth >= 0,
            icon: <ChurchIcon size={20} className="text-blue-500" />,
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            subtitle: 'Sur ' + (stats.kpis.totalChurches || 0) + ' au total',
        },
        {
            title: 'Utilisateurs Actifs',
            value: stats.kpis.totalUsers || 0,
            trend: null,
            trendUp: true,
            icon: <Users size={20} className="text-purple-500" />,
            iconBg: 'bg-purple-50 dark:bg-purple-900/20',
            subtitle: null,
        },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        { v: 1, n: "Janvier" }, { v: 2, n: "Février" }, { v: 3, n: "Mars" },
        { v: 4, n: "Avril" }, { v: 5, n: "Mai" }, { v: 6, n: "Juin" },
        { v: 7, n: "Juillet" }, { v: 8, n: "Août" }, { v: 9, n: "Septembre" },
        { v: 10, n: "Octobre" }, { v: 11, n: "Novembre" }, { v: 12, n: "Décembre" }
    ];

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Vue d&apos;ensemble</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Performance globale de la plateforme ElyonSys 360.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Données en direct</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <KpiCard key={i} {...card} />
                ))}
            </div>

            {/* Filters Row - Added before graphs */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observation Annuelle</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-black text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm min-w-[120px]"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mois de Référence</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-gray-50 dark:bg-[#0f172a] border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-black text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm min-w-[140px]"
                        >
                            {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                        </select>
                    </div>
                </div>

                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-500/20">
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-2">
                        <Activity size={14} />
                        <span>Données Filtrées: {months.find(m => m.v === month).n} {year}</span>
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolution du Revenu */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Evolution du Revenu</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">Historique mensuel des encaissements</p>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="p-6 overflow-x-auto scrollbar-hide" ref={revRef}>
                        <div className="h-72 w-full min-w-[800px]">
                            <AreaRevenueChart data={revenueData} />
                        </div>
                    </div>
                </div>

                {/* Nouvelles Inscriptions (Moved here) */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Nouvelles Inscriptions</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 whitespace-nowrap">Eglises enregistrees par mois</p>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <ChurchIcon size={16} className="text-blue-500" />
                        </div>
                    </div>
                    <div className="p-6 overflow-x-auto scrollbar-hide" ref={regRef}>
                        <div className="h-72 w-full min-w-[800px]">
                            <RegistrationBarChart data={registrationData} />
                        </div>
                    </div>
                </div>

                {/* Evolution des Membres (Full Width Row) */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden lg:col-span-2">
                    <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Evolution des Membres</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Croissance cumulative des utilisateurs</p>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Users size={16} className="text-purple-500" />
                        </div>
                    </div>
                    <div className="p-6 overflow-x-auto scrollbar-hide" ref={userRef}>
                        <div className="h-72 w-full min-w-[1000px]">
                            <UserGrowthChart data={userData} />
                        </div>
                    </div>
                </div>

                {/* Distribution des Plans (Full Width at Bottom) */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden lg:col-span-2">
                    <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">Distribution des Plans</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Repartition par type d&apos;abonnement</p>
                        </div>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <CreditCard size={16} className="text-amber-500" />
                        </div>
                    </div>
                    <div className="p-6 h-80 w-full">
                        <PlanPieChart data={planData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, iconBg, trend, trendUp, subtitle }) => (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className={"p-2.5 rounded-xl " + (iconBg || 'bg-gray-50 dark:bg-[#0f172a]')}>
                {icon}
            </div>
            {trend && (
                <span className={"text-[10px] font-black px-2 py-1 rounded-lg " + (trendUp
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                )}>
                    {trend}
                </span>
            )}
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black dark:text-white tracking-tight">{value}</h4>
        {subtitle && (
            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1 font-medium">{subtitle}</p>
        )}
    </div>
);

const ChurchesView = ({
    churches, onStatusChange, onEdit, onDelete,
    onSelect, onSelectAll, selectedIds, allSelected,
    onBulkDelete, onExportExcel, onExportPDF,
    churchSearch, setChurchSearch,
    startDate, setStartDate, endDate, setEndDate,
    selectedPlan, setSelectedPlan,
    selectedStatus, setSelectedStatus,
    currentUser
}) => {
    const now = new Date();
    const isSuperAdmin = currentUser?.role?.includes('super_admin');
    const [instWidth, setInstWidth] = useState(240);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const startResizing = (e) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = instWidth;
        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(80, startWidth + (moveEvent.pageX - startX));
            setInstWidth(newWidth);
            if (newWidth < 120) setIsCollapsed(true);
            else setIsCollapsed(false);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const toggleCollapse = () => {
        if (isCollapsed) {
            setInstWidth(240);
            setIsCollapsed(false);
        } else {
            setInstWidth(80);
            setIsCollapsed(true);
        }
    };

    const activeCount = churches.filter(c => c.status === 'active' && (!c.subscriptionExpiresAt || new Date(c.subscriptionExpiresAt) >= now)).length;
    const suspendedCount = churches.filter(c => c.status === 'suspended' || ((c.status === 'active') && c.subscriptionExpiresAt && new Date(c.subscriptionExpiresAt) < now)).length;
    const inactiveCount = churches.filter(c => c.status === 'inactive').length;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Gestion des Eglises</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Administrez toutes les institutions partenaires de la plateforme.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onExportExcel} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        <span>Excel</span>
                    </button>
                    <button onClick={onExportPDF} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <FileText size={14} className="text-red-400" />
                        <span>PDF</span>
                    </button>
                    {isSuperAdmin && (
                        <button onClick={onBulkDelete} disabled={selectedIds.length === 0}
                            className={"flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm border " + (selectedIds.length > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600' : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed')}>
                            <Trash2 size={14} />
                            {selectedIds.length > 0 && <span>({selectedIds.length})</span>}
                        </button>
                    )}
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{churches.length}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">Institutions enregistrees</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Actives</p>
                    <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">Abonnements en cours</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Suspendues / Inactives</p>
                    <p className="text-3xl font-black text-orange-500">{suspendedCount + inactiveCount}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">Requierent attention</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col lg:flex-row gap-3 items-end flex-wrap">
                    <div className="relative flex-1" style={{ minWidth: '220px' }}>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input type="text" placeholder="Nom, domaine ou email..." value={churchSearch}
                            onChange={(e) => setChurchSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700 dark:text-gray-300 placeholder-gray-400" />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '140px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Du</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '140px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Au</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '150px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plan</label>
                        <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300">
                            <option value="all">Tous les plans</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                            <option value="free">Gratuit</option>
                        </select>
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '150px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Statut</label>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-300">
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                            <option value="expired">Expire</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: '860px' }}>
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-[#0f172a]/60 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 w-10">
                                    <input type="checkbox" checked={allSelected} onChange={onSelectAll} className="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500" />
                                </th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 relative group/col" style={{ width: instWidth }}>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={toggleCollapse} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors mr-1" title={isCollapsed ? "Expand" : "Collapse"}>
                                            <ChevronLeft size={12} className={"transition-transform " + (isCollapsed ? 'rotate-180' : '')} />
                                        </button>
                                        {!isCollapsed && <span>Institution</span>}
                                    </div>
                                    <div onMouseDown={startResizing} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 group-hover/col:border-r border-indigo-500/10 transition-colors z-10" />
                                </th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Admin / Email</th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Membres</th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Plan</th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Debut / Expiration</th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Statut</th>
                                <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {churches.length === 0 ? (
                                <tr><td colSpan="8" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <ChurchIcon size={24} className="text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium">Aucune institution trouvee</p>
                                    </div>
                                </td></tr>
                            ) : churches.map(c => {
                                const isExpired = (c.status === 'active' || c.status === 'suspended') && c.subscriptionExpiresAt && new Date(c.subscriptionExpiresAt) < now;
                                const displayStatus = isExpired ? 'expired' : c.status;
                                return (
                                    <tr key={c.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                        <td className="px-5 py-4">
                                            <input type="checkbox" disabled={c.subdomain === 'admin-system'} checked={selectedIds.includes(c.id)} onChange={() => onSelect(c.id)}
                                                className={"rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 " + (c.subdomain === 'admin-system' ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer')} />
                                        </td>
                                        <td className="px-5 py-4 overflow-hidden" style={{ width: instWidth }}>
                                            <div className="flex items-center space-x-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-[10px] font-black flex-shrink-0">
                                                    {(c.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                {!isCollapsed && (
                                                    <div className="min-w-0 transition-opacity">
                                                        <a href={`/super-admin/church/${c.id}`} className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-full hover:text-indigo-600 transition-colors block">
                                                            {c.name}
                                                        </a>
                                                        <p className="text-[10px] text-gray-400 truncate max-w-full">{c.subdomain}.elyonsys.com</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{c.adminName || 'Admin'}</p>
                                            <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{c.adminEmail || 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center space-x-1.5">
                                                <Users size={12} className="text-gray-400" />
                                                <span className="text-[13px] font-black text-gray-800 dark:text-white">{c.userCount || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 uppercase rounded-lg border border-indigo-100 dark:border-indigo-900/40 whitespace-nowrap">
                                                {c.planName || 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[10px] font-bold text-emerald-600">D: {c.subscriptionStartedAt ? new Date(c.subscriptionStartedAt).toLocaleDateString('fr-FR') : new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                                            <p className={"text-[10px] font-bold " + (isExpired ? 'text-red-500' : 'text-gray-400')}>S: {c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={displayStatus} /></td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button onClick={() => window.location.href = `/super-admin/church/${c.id}`} className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all" title="Voir details">
                                                    <ExternalLink size={15} />
                                                </button>
                                                {isSuperAdmin && (
                                                    <>
                                                        <button onClick={() => onEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Modifier">
                                                            <Edit size={15} />
                                                        </button>
                                                        <button onClick={() => onStatusChange(c.id, c.status)} className="p-2 text-gray-400 hover:text-amber-600 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all" title="Changer statut">
                                                            {c.status === 'active' ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                                                        </button>
                                                        {c.subdomain !== 'admin-system' && (
                                                            <button onClick={() => onDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Supprimer">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {churches.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] text-gray-400 font-medium">
                            <span className="font-black text-gray-600 dark:text-gray-300">{churches.length}</span> institution(s) affichee(s)
                            {selectedIds.length > 0 && <span className="ml-2 text-indigo-600 font-black"> — {selectedIds.length} selectionnee(s)</span>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SuperAdminsView = ({ users, loading, onNew, onDelete, currentUser }) => {
    const userRoles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role];
    const isSuperAdmin = userRoles.includes('super_admin');

    const roleLabels = {
        'super_admin': 'Super Admin',
        'super_admin_secretaire': 'Secretaire',
        'superaduser': 'Utilisateur SA'
    };

    const safeRoleParse = (role) => {
        if (!role) return 'Membre';
        if (Array.isArray(role)) return role[0];
        try {
            const parsed = typeof role === 'string' ? JSON.parse(role) : role;
            return Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
            return String(role);
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Contributeurs</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Personnel administratif du systeme central ElyonSys 360.</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={onNew} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                        <span>+</span>
                        <span>Ajouter Contributeur</span>
                    </button>
                )}
            </div>

            {/* Stats mini */}
            <div className="flex items-center space-x-4">
                <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <ShieldCheck size={16} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{users.length}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/80 dark:bg-[#0f172a]/60 border-b border-gray-100 dark:border-gray-800">
                            <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Utilisateur</th>
                            <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Role</th>
                            <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Email</th>
                            <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                        {loading ? (
                            <tr><td colSpan="4" className="px-8 py-16 text-center">
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-gray-400">Chargement...</p>
                                </div>
                            </td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" className="px-8 py-16 text-center">
                                <p className="text-sm text-gray-400">Aucun contributeur trouve.</p>
                            </td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[11px] font-black flex-shrink-0">
                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{u.firstName} {u.lastName}</p>
                                            <div className="flex items-center space-x-1 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Connecte</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase rounded-lg border border-indigo-100 dark:border-indigo-900/40 whitespace-nowrap">
                                        {roleLabels[safeRoleParse(u.role)] || safeRoleParse(u.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{u.email}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                        <button onClick={() => window.location.href = `/super-admin/member/${u.id}`}
                                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-black uppercase rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
                                            Profil
                                        </button>
                                        {isSuperAdmin && (
                                            <>
                                                <button onClick={() => window.location.href = `/super-admin/member/${u.id}`} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Modifier">
                                                    <Edit size={15} />
                                                </button>
                                                {u.id !== currentUser.id && (
                                                    <button onClick={() => onDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Supprimer">
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PlansView = ({ plans, onEdit, onDelete, onNew, currentUser }) => {
    const userRoles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role];
    const isSuperAdmin = userRoles.includes('super_admin');
    const cycleColors = { monthly: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/40', yearly: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-900/40', '2years': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100', '3years': 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100', custom: 'bg-gray-100 dark:bg-gray-800 text-gray-600 border-gray-200' };
    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Plans & Tarification</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Gerez les offres d&apos;abonnement disponibles sur la plateforme.</p>
                </div>
                {isSuperAdmin && (
                    <button onClick={onNew} className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                        <span>+</span><span>Nouveau Plan</span>
                    </button>
                )}
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(p => {
                    const cycleLabels = { monthly: 'Mensuel', yearly: 'Annuel', '2years': '2 Ans', '3years': '3 Ans', custom: 'Personnalise' };
                    const cycleLabel = cycleLabels[p.billingCycle] || cycleLabels[p.interval] || p.interval;
                    const durationLabel = p.durationMonths ? `${p.durationMonths} mois` : (p.interval === 'yearly' ? '12 mois' : '1 mois');
                    const colorClass = cycleColors[p.billingCycle || p.interval] || cycleColors.custom;
                    return (
                        <div key={p.id} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col hover:shadow-lg hover:shadow-indigo-500/10 transition-all overflow-hidden group">
                            {/* Card Header */}
                            <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800/80 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-black dark:text-white">{p.name}</h3>
                                    <div className="flex items-baseline space-x-1.5 mt-1">
                                        <span className="text-3xl font-black text-indigo-600 tracking-tight">{p.price}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HTG / {durationLabel}</span>
                                    </div>
                                </div>
                                <span className={"px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border whitespace-nowrap " + colorClass}>
                                    {cycleLabel}
                                </span>
                            </div>
                            {/* Meta */}
                            <div className="px-6 py-4 bg-gray-50/60 dark:bg-[#0f172a]/40 border-b border-gray-50 dark:border-gray-800/60">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="text-gray-400 uppercase tracking-widest">Duree</span>
                                    <span className="text-gray-700 dark:text-gray-300">{durationLabel}</span>
                                </div>
                                {p.startDate && (
                                    <div className="flex items-center justify-between text-[10px] font-bold mt-1">
                                        <span className="text-gray-400 uppercase tracking-widest">Debut</span>
                                        <span className="text-emerald-600">{new Date(p.startDate).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                )}
                                {p.endDate && (
                                    <div className="flex items-center justify-between text-[10px] font-bold mt-1">
                                        <span className="text-gray-400 uppercase tracking-widest">Fin</span>
                                        <span className="text-red-500">{new Date(p.endDate).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                )}
                                {!p.startDate && !p.endDate && (
                                    <p className="text-[10px] text-gray-400 italic mt-1">Pas de dates fixes</p>
                                )}
                            </div>
                            {/* Features */}
                            <div className="px-6 py-4 flex-1">
                                <ul className="space-y-2.5">
                                    {Array.isArray(p.features) && p.features.map((f, i) => (
                                        <li key={i} className="flex items-start space-x-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                            <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <HiOutlinePlayCircle className="text-emerald-500 w-3 h-3" />
                                            </div>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-gray-50 dark:border-gray-800/60">
                                {isSuperAdmin ? (
                                    <div className="flex space-x-2">
                                        <button onClick={() => onEdit(p)} className="flex-1 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 transition-colors border border-gray-200 dark:border-gray-700">
                                            Modifier
                                        </button>
                                        <button onClick={() => onDelete(p.id)} className="p-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/30">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-2.5 px-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-[10px] font-bold text-blue-600 dark:text-blue-400 text-center uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                                        Consultation Uniquement
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const GlobalSearchView = ({ results, onSearch }) => (
    <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
            <h2 className="text-2xl font-black dark:text-white tracking-tight">Meta-recherche</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Recherchez n&apos;importe quel membre a travers l&apos;ensemble des installations ElyonSys 360.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                <input
                    type="text"
                    placeholder="Nom, prenom ou adresse email..."
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-[#0f172a] border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-300 dark:text-white"
                />
            </div>
            {results.length === 0 && (
                <div className="flex flex-col items-center mt-8 space-y-3 pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Search size={20} className="text-indigo-400" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Saisissez un terme pour lancer la recherche</p>
                </div>
            )}
        </div>

        {/* Results table */}
        {results.length > 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        <span className="font-black text-gray-800 dark:text-white">{results.length}</span> resultat(s) trouve(s)
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: '600px' }}>
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-[#0f172a]/60 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Utilisateur</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Institution</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400">Role</th>
                                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {results.map(u => (
                                <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[11px] font-black text-gray-600 dark:text-gray-300 flex-shrink-0">
                                                {u.firstName?.[0]}{u.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{u.firstName} {u.lastName}</p>
                                                <p className="text-[10px] text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <ChurchIcon size={13} className="text-indigo-500 flex-shrink-0" />
                                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{u.church?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase rounded-lg border border-gray-200 dark:border-gray-700">
                                            {u.role || 'Member'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button onClick={() => window.location.href = `/super-admin/member/${u.id}`}
                                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/40">
                                                Voir Profil
                                            </button>
                                            <button onClick={() => window.location.href = `/super-admin/member/${u.id}`} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Modifier">
                                                <Edit size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);

const TransactionsView = ({
    transactions,
    search, setSearch,
    startDate, setStartDate,
    endDate, setEndDate,
    selectedPlan, setSelectedPlan,
    selectedStatus, setSelectedStatus
}) => {
    const now = new Date();
    const [transTab, setTransTab] = useState('all');
    const [copiedId, setCopiedId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 15;
    const [instWidth, setInstWidth] = useState(200);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const startResizing = (e) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = instWidth;
        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(80, startWidth + (moveEvent.pageX - startX));
            setInstWidth(newWidth);
            if (newWidth < 120) setIsCollapsed(true);
            else setIsCollapsed(false);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const toggleCollapse = () => {
        if (isCollapsed) {
            setInstWidth(200);
            setIsCollapsed(false);
        } else {
            setInstWidth(80);
            setIsCollapsed(true);
        }
    };

    const activeTransactions = transactions.filter(t => {
        const expiry = t.periodEnd ? new Date(t.periodEnd) : (t.church?.subscriptionExpiresAt ? new Date(t.church.subscriptionExpiresAt) : null);
        return expiry && expiry >= now;
    });
    const pastTransactions = transactions.filter(t => {
        const expiry = t.periodEnd ? new Date(t.periodEnd) : (t.church?.subscriptionExpiresAt ? new Date(t.church.subscriptionExpiresAt) : null);
        return !expiry || expiry < now;
    });

    const displayedRows = transTab === 'all' ? transactions : transTab === 'active' ? activeTransactions : pastTransactions;
    const totalPages = Math.ceil(displayedRows.length / rowsPerPage);
    const paginatedRows = displayedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleTabChange = (tab) => { setTransTab(tab); setCurrentPage(1); };

    const copyToClipboard = (text, id) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 1500);
            });
        }
    };

    const totalAmount = transactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const activeAmount = activeTransactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const exportCSV = () => {
        const headers = ['Date', 'Institution', 'Montant', 'Devise', 'ID Transaction', 'Methode', 'Statut', 'Fin Plan'];
        const csvRows = displayedRows.map(t => {
            const churchStatus = t.church?.status || 'active';
            const isExp = (churchStatus === 'active' || churchStatus === 'suspended') && t.church?.subscriptionExpiresAt && new Date(t.church?.subscriptionExpiresAt) < now;
            const st = isExp ? 'Expire' : (churchStatus === 'active' ? 'Actif' : churchStatus === 'suspended' ? 'Suspendu' : churchStatus);
            return [
                new Date(t.createdAt).toLocaleString('fr-FR'),
                t.church?.name || '',
                parseFloat(t.amount).toLocaleString('fr-FR'),
                t.currency || '',
                t.gatewayReference || '',
                t.paymentMethod || '',
                st,
                t.periodEnd ? new Date(t.periodEnd).toLocaleDateString('fr-FR') : (t.church?.subscriptionExpiresAt ? new Date(t.church.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '')
            ];
        });
        const csv = [headers, ...csvRows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
        link.download = 'transactions_' + new Date().toISOString().slice(0, 10) + '.csv';
        link.click();
    };

    const statCards = [
        { label: 'Toutes', count: transactions.length, value: totalAmount, colorActive: 'bg-indigo-600 border-indigo-600 shadow-indigo-500/20', tab: 'all' },
        { label: 'Actives', count: activeTransactions.length, value: activeAmount, colorActive: 'bg-emerald-500 border-emerald-500 shadow-emerald-500/20', tab: 'active' },
        { label: 'Passees', count: pastTransactions.length, value: totalAmount - activeAmount, colorActive: 'bg-slate-600 border-slate-600 shadow-slate-500/20', tab: 'past' },
    ];

    const renderTable = (rows, emptyMsg) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '860px' }}>
                <thead>
                    <tr className="bg-gray-50/80 dark:bg-[#0f172a]/60 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap">Date</th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap relative group/col" style={{ width: instWidth }}>
                            <div className="flex items-center space-x-2">
                                <button onClick={toggleCollapse} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors mr-1" title={isCollapsed ? "Expand" : "Collapse"}>
                                    <ChevronLeft size={12} className={"transition-transform " + (isCollapsed ? 'rotate-180' : '')} />
                                </button>
                                {!isCollapsed && <span>Institution</span>}
                            </div>
                            <div onMouseDown={startResizing} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 group-hover/col:border-r border-indigo-500/10 transition-colors z-10" />
                        </th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap">Montant</th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap">ID Transaction</th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap">Methode</th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap">Statut</th>
                        <th className="px-5 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 whitespace-nowrap text-right">Fin Plan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <DollarSign size={24} className="text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">{emptyMsg}</p>
                                </div>
                            </td>
                        </tr>
                    ) : rows.map(t => {
                        const churchStatus = t.church?.status || 'active';
                        const isExpired = (churchStatus === 'active' || churchStatus === 'suspended') &&
                            t.church?.subscriptionExpiresAt && new Date(t.church?.subscriptionExpiresAt) < now;
                        const finalStatus = isExpired ? 'expired' : churchStatus;
                        const txId = t.gatewayReference || '';
                        const shortId = txId.length > 22 ? txId.slice(0, 10) + '...' + txId.slice(-6) : (txId || 'N/A');
                        return (
                            <tr key={t.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                <td className="px-5 py-4">
                                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </td>
                                <td className="px-5 py-4 overflow-hidden" style={{ width: instWidth }}>
                                    <div className="flex items-center space-x-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-[10px] font-black flex-shrink-0">
                                            {(t.church?.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        {!isCollapsed && (
                                            <div className="min-w-0 transition-opacity">
                                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate max-w-full">{t.church?.name || '—'}</p>
                                                <p className="text-[10px] text-gray-400 truncate max-w-full">{t.church?.subdomain ? t.church.subdomain + '.elyonsys.com' : '—'}</p>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="text-[13px] font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                        {parseFloat(t.amount).toLocaleString('fr-FR')} <span className="text-[10px] font-bold text-gray-400">{t.currency}</span>
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center space-x-1.5 group/id">
                                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg whitespace-nowrap" title={txId}>{shortId}</span>
                                        {txId && txId !== 'N/A' && (
                                            <button onClick={() => copyToClipboard(txId, t.id)} className="opacity-0 group-hover/id:opacity-100 p-1 rounded text-gray-400 hover:text-indigo-600 transition-all" title="Copier ID">
                                                {copiedId === t.id ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-bold uppercase text-[9px] tracking-wider whitespace-nowrap border border-gray-200 dark:border-gray-700">
                                        {t.paymentMethod || '—'}
                                    </span>
                                </td>
                                <td className="px-5 py-4"><StatusBadge status={finalStatus} /></td>
                                <td className="px-5 py-4 text-right">
                                    <span className={"text-[10px] font-bold whitespace-nowrap " + (finalStatus === 'expired' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400')}>
                                        {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString('fr-FR') : (t.church?.subscriptionExpiresAt ? new Date(t.church.subscriptionExpiresAt).toLocaleDateString('fr-FR') : '—')}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Transactions</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Suivi complet des flux financiers et abonnements de la plateforme.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={exportCSV} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        <span>Exporter CSV</span>
                    </button>
                    <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <FileText size={14} className="text-red-400" />
                        <span>Imprimer</span>
                    </button>
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map(card => (
                    <button
                        key={card.tab}
                        onClick={() => handleTabChange(card.tab)}
                        className={"text-left p-5 rounded-2xl border-2 transition-all shadow-sm " + (transTab === card.tab
                            ? 'text-white shadow-lg ' + card.colorActive
                            : 'bg-white dark:bg-[#1e293b] border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                        )}
                    >
                        <p className={"text-[10px] font-black uppercase tracking-widest mb-1 " + (transTab === card.tab ? 'text-white/70' : 'text-gray-400')}>{card.label}</p>
                        <p className={"text-3xl font-black tracking-tight " + (transTab === card.tab ? 'text-white' : 'text-gray-900 dark:text-white')}>{card.count}</p>
                        <p className={"text-[11px] font-bold mt-1 " + (transTab === card.tab ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')}>
                            {card.value.toLocaleString('fr-FR')} HTG
                        </p>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col lg:flex-row gap-3 items-end flex-wrap">
                    <div className="relative flex-1" style={{ minWidth: '200px' }}>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text" placeholder="Institution, email..." value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700 dark:text-gray-300 placeholder-gray-400"
                        />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '140px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Du</label>
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '140px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Au</label>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '150px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plan</label>
                        <select value={selectedPlan} onChange={(e) => { setSelectedPlan(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700 dark:text-gray-300">
                            <option value="all">Tous les plans</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div className="flex flex-col space-y-1" style={{ minWidth: '150px' }}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Statut</label>
                        <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-gray-700 dark:text-gray-300">
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                            <option value="expired">Expire</option>
                        </select>
                    </div>
                    {(search || startDate || endDate || selectedPlan !== 'all' || selectedStatus !== 'all') && (
                        <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setSelectedPlan('all'); setSelectedStatus('all'); setCurrentPage(1); }}
                            className="flex items-center space-x-1.5 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all whitespace-nowrap border border-red-100 dark:border-red-900/30 self-end">
                            <X size={13} /><span>Effacer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Tab Bar */}
                <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-6 pt-1">
                    {[
                        { key: 'all', label: 'Toutes', count: transactions.length, dot: null },
                        { key: 'active', label: 'Actives', count: activeTransactions.length, dot: 'bg-emerald-500' },
                        { key: 'past', label: 'Passees', count: pastTransactions.length, dot: 'bg-gray-400' }
                    ].map(tab => (
                        <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                            className={"flex items-center space-x-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all mr-1 " + (transTab === tab.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            )}>
                            {tab.dot && <div className={"w-2 h-2 rounded-full " + tab.dot}></div>}
                            <span>{tab.label}</span>
                            <span className={"px-1.5 py-0.5 text-[10px] font-black rounded-full " + (transTab === tab.key
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            )}>{tab.count}</span>
                        </button>
                    ))}
                </div>

                {renderTable(paginatedRows, 'Aucune transaction trouvee')}

                {/* Footer: count + pagination */}
                {displayedRows.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 gap-3">
                        <p className="text-[11px] text-gray-400 font-medium">
                            Affichage <span className="font-black text-gray-600 dark:text-gray-300">{Math.min((currentPage - 1) * rowsPerPage + 1, displayedRows.length)}-{Math.min(currentPage * rowsPerPage, displayedRows.length)}</span> sur <span className="font-black text-gray-600 dark:text-gray-300">{displayedRows.length}</span> transactions
                        </p>
                        {totalPages > 1 && (
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">Prec.</button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const page = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : currentPage + i - 2);
                                    if (page < 1 || page > totalPages) return null;
                                    return (
                                        <button key={page} onClick={() => setCurrentPage(page)}
                                            className={"w-8 h-8 text-xs font-bold rounded-lg transition-colors " + (currentPage === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300')}
                                        >{page}</button>
                                    );
                                })}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">Suiv.</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        active: { color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'text-emerald-600', label: 'Actif' },
        inactive: { color: 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.5)]', text: 'text-gray-500', label: 'Inactif' },
        suspended: { color: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]', text: 'text-orange-600', label: 'Suspendu' },
        expired: { color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]', text: 'text-red-600', label: 'Expiré' },
        pending: { color: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]', text: 'text-blue-500', label: 'En attente' }
    };
    const { color, text, label } = config[status] || config.inactive;

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${color}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${text}`}>
                {label}
            </span>
        </div>
    );
};

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.filter(n => !n.isRead));
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-3 bg-gray-50 dark:bg-[#0f172a] text-gray-400 hover:text-indigo-600 rounded-2xl transition-all">
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white dark:border-[#1e293b] rounded-full"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-4 w-96 bg-white dark:bg-[#1e293b] rounded-[32px] shadow-2xl py-6 z-50 border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="px-8 pb-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                            <h4 className="font-black text-sm dark:text-white uppercase tracking-widest">Notifications</h4>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">{notifications.length}</span>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="px-8 py-10 text-center text-xs text-gray-400 font-medium italic">
                                Le silence est d'or. Aucune urgence.
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto mt-2">
                                {notifications.map(n => {
                                    const idMatch = n.title.match(/\[ID:(\d+)\]/);
                                    const churchId = idMatch ? idMatch[1] : null;
                                    const cleanTitle = n.title.replace(/\[ID:\d+\]/, '').trim();

                                    return (
                                        <div key={n.id} className="px-8 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-50 dark:border-gray-800/50 last:border-0 border-l-4 border-l-transparent hover:border-l-indigo-500 group">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                        <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{cleanTitle}</p>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-2">
                                                        {n.message}
                                                        <span className="block mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="px-3 py-1 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-700 rounded-lg text-[9px] font-black text-indigo-600 uppercase hover:bg-indigo-50 transition-all shadow-sm"
                                                    >
                                                        Ok
                                                    </button>
                                                    {churchId && (
                                                        <button
                                                            onClick={() => {
                                                                markAsRead(n.id);
                                                                window.location.href = `/super-admin/church/${churchId}`;
                                                            }}
                                                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                                                        >
                                                            Profil
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;

