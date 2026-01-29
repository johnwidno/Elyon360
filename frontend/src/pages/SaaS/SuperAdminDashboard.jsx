import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import PlanModal from '../../components/SaaS/PlanModal';

const SuperAdminDashboard = () => {
    const { logout } = useAuth();

    // Data State
    const [churches, setChurches] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState({ churchCount: 0, userCount: 0, donationTotal: 0 });

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('superAdminTab') || 'churches');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    // Advanced Filtering States
    const [churchSearch, setChurchSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    // Filter Logic
    const filteredChurches = churches.filter(church => {
        const matchesSearch =
            church.name.toLowerCase().includes(churchSearch.toLowerCase()) ||
            church.subdomain.toLowerCase().includes(churchSearch.toLowerCase()) ||
            (church.adminEmail && church.adminEmail.toLowerCase().includes(churchSearch.toLowerCase()));

        const churchDate = new Date(church.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const matchesDate = (!start || churchDate >= start) && (!end || churchDate <= end);

        return matchesSearch && matchesDate;
    });

    useEffect(() => {
        localStorage.setItem('superAdminTab', activeTab);
    }, [activeTab]);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [churchRes, statsRes, planRes] = await Promise.all([
                api.get('/saas/churches'),
                api.get('/saas/global-stats'),
                api.get('/saas/plans')
            ]);
            setChurches(churchRes.data);
            setStats(statsRes.data);
            setPlans(planRes.data);
        } catch (err) {
            console.error("Erreur loading data", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions: Churches ---

    const handleStatusChange = async (churchId, currentStatus) => {
        const church = churches.find(c => c.id === churchId);
        const isExpired = church && church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < new Date();
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        let updateData = { status: newStatus };

        if (newStatus === 'active' && isExpired) {
            if (window.confirm(`Cette église a un abonnement expiré. Voulez-vous renouveler l'abonnement d'un mois en l'activant ?`)) {
                const newExp = new Date();
                newExp.setMonth(newExp.getMonth() + 1);
                updateData.subscriptionExpiresAt = newExp;
            } else {
                if (!window.confirm("Activer sans renouveler ? Elle sera probablement suspendue de nouveau par le système.")) return;
            }
        } else {
            if (!window.confirm(`Êtes-vous sûr de vouloir ${newStatus === 'active' ? 'activer' : 'suspendre'} cette église ?`)) return;
        }

        try {
            await api.put(`/saas/churches/${churchId}/status`, updateData);
            setChurches(churches.map(c => c.id === churchId ? {
                ...c,
                status: newStatus,
                subscriptionExpiresAt: updateData.subscriptionExpiresAt || c.subscriptionExpiresAt
            } : c));
        } catch (error) {
            console.error("Error updating status", error);
            alert("Erreur lors de la mise à jour du statut");
        }
    };

    const handleDeleteChurch = async (churchId) => {
        if (!window.confirm("ATTENTION: Cette action est irréversible. Voulez-vous vraiment supprimer cette église et toutes ses données ?")) return;

        try {
            await api.delete(`/saas/churches/${churchId}`);
            setChurches(churches.filter(c => c.id !== churchId));
            // Update stats vaguely or fetch again
            setStats({ ...stats, churchCount: stats.churchCount - 1 });
        } catch (error) {
            console.error("Error deleting church", error);
            alert("Erreur lors de la suppression");
        }
    };

    // --- Actions: Plans ---

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
            alert("Erreur lors de l'enregistrement du plan");
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!window.confirm("Supprimer ce plan ?")) return;
        try {
            await api.delete(`/saas/plans/${planId}`);
            setPlans(plans.filter(p => p.id !== planId));
        } catch (error) {
            console.error("Error deleting plan", error);
            alert("Impossible de supprimer ce plan (peut-être utilisé par des églises ?)");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 font-sans">
            {/* Navbar Super Admin */}
            <nav className="bg-gray-800 dark:bg-gray-950 text-white px-6 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚡</span>
                    <h1 className="text-xl font-bold tracking-tight">ElyonSys 360 <span className="text-indigo-400">Super Admin</span></h1>
                </div>
                <div className="flex items-center space-x-4">
                    <NotificationDropdown />
                    <button onClick={logout} className="bg-red-600/90 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        Déconnexion
                    </button>
                </div>
            </nav>

            <main className="p-6 max-w-7xl mx-auto">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard icon="⛪" title="Églises Total" value={stats.churchCount} />
                    <StatCard icon="👥" title="Utilisateurs Total" value={stats.userCount} />
                    <StatCard icon="💰" title="Volume des Dons" value={`$${stats.donationTotal.toLocaleString()}`} />
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl w-fit mb-8">
                    <TabButton active={activeTab === 'churches'} onClick={() => setActiveTab('churches')}>
                        Gestion Églises
                    </TabButton>
                    <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')}>
                        Abonnements & Plans
                    </TabButton>
                    <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
                        Recherche Membres
                    </TabButton>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Chargement...</div>
                ) : (
                    <>
                        {activeTab === 'churches' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Liste des Églises</h2>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={exportToExcel}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center"
                                        >
                                            <span className="mr-2">📊</span> Excel
                                        </button>
                                        <button
                                            onClick={exportToPDF}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center"
                                        >
                                            <span className="mr-2">📄</span> PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Advanced Filters Bar */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Rechercher église, domaine, email..."
                                            value={churchSearch}
                                            onChange={(e) => setChurchSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Du</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Au</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Église</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sigle</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Membres</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Info Admin</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Début</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sommet</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredChurches.map((church) => (
                                                <tr key={church.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => window.location.href = `/super-admin/church/${church.id}`}
                                                            className="flex items-center group"
                                                        >
                                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                                                                {church.name.charAt(0)}
                                                            </div>
                                                            <div className="ml-4 text-left">
                                                                <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{church.name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{church.subdomain}.elyonsys.com</div>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{church.acronym || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => window.location.href = `/super-admin/church/${church.id}#member-list`}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                        >
                                                            👥 {church.userCount || 0}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{church.adminEmail || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {church.planName || church.plan}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            {church.subscriptionStartedAt ? new Date(church.subscriptionStartedAt).toLocaleDateString() : (church.createdAt ? new Date(church.createdAt).toLocaleDateString() : 'N/A')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${church.subscriptionExpiresAt && new Date(church.subscriptionExpiresAt) < new Date()
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20'
                                                            }`}>
                                                            {church.subscriptionExpiresAt ? new Date(church.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <StatusBadge status={church.status} />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => handleStatusChange(church.id, church.status)}
                                                            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border ${church.status === 'active'
                                                                ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                                                : 'border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                                }`}
                                                        >
                                                            {church.status === 'active' ? 'Suspendre' : 'Activer'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChurch(church.id)}
                                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredChurches.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 font-medium">Aucune église ne correspond à vos critères</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Plans d'Abonnement</h2>
                                    <button
                                        onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center"
                                    >
                                        <span className="mr-2">+</span> Nouveau Plan
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {plans.map((plan) => (
                                        <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6 flex flex-col relative transition-transform hover:-translate-y-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded uppercase font-bold tracking-wider">
                                                    {plan.interval}
                                                </span>
                                            </div>
                                            <div className="mb-6">
                                                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">${plan.price}</span>
                                                <span className="text-gray-500 dark:text-gray-400">/{plan.interval === 'monthly' ? 'mo' : 'an'}</span>
                                            </div>
                                            <ul className="space-y-3 mb-8 flex-1">
                                                {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="mr-2 text-green-500">✓</span> {feature}
                                                    </li>
                                                ))}
                                                {(!plan.features || plan.features.length === 0) && (
                                                    <li className="text-sm text-gray-400 italic">Aucune fonctionnalité listée</li>
                                                )}
                                            </ul>
                                            <div className="flex space-x-2 border-t pt-4 border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }}
                                                    className="flex-1 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    className="flex-1 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {plans.length === 0 && (
                                        <div className="col-span-3 text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <p className="text-gray-500 dark:text-gray-400">Aucun plan configuré. Créez votre premier plan !</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'search' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recherche Globale Membres</h2>

                                <div className="max-w-xl">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Rechercher par nom ou email..."
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                        <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">Entrez au moins 3 caractères pour lancer la recherche.</p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prénom & Nom</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rôle</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Église Appartenance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {searchResults.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td
                                                        className="px-6 py-4 whitespace-nowrap cursor-pointer group"
                                                        onClick={() => window.location.href = `/super-admin/member/${user.id}`}
                                                    >
                                                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                                            {user.firstName} {user.lastName}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                                                            {(() => {
                                                                if (!user.role) return 'Membre';
                                                                try {
                                                                    const parsed = JSON.parse(user.role);
                                                                    return Array.isArray(parsed) ? parsed[0] : parsed;
                                                                } catch (e) {
                                                                    return user.role || 'Membre';
                                                                }
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => window.location.href = `/super-admin/church/${user.church?.id}`}>
                                                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                                                            <span className="mr-2">⛪</span>
                                                            {user.church?.name || 'Inconnue'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">{user.church?.subdomain}.elyonsys.com</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {searchResults.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                                        Aucun membre trouvé. Essayez une autre recherche.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <PlanModal
                show={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                onSave={handleSavePlan}
                plan={editingPlan}
            />
        </div >
    );
};

// --- Sub-components ---

const StatCard = ({ icon, title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
        <span className="text-4xl mb-4">{icon}</span>
        <h3 className="text-gray-400 dark:text-gray-500 text-xs font-black uppercase tracking-widest mb-2">{title}</h3>
        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{value}</p>
    </div>
);

const TabButton = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${active
            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
    >
        {children}
    </button>
);

const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold uppercase rounded-full tracking-wide ${status === 'active'
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
        {status || 'Active'}
    </span>
);

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            // Filter only system/admin type if API returns all, but assuming backend protects logic.
            // For now, simple list.
            setNotifications(res.data.filter(n => !n.isRead));
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
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
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <span className="text-2xl">🔔</span>
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">
                        Notifications
                    </div>
                    {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Aucune nouvelle notification
                        </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.map(n => (
                                <div key={n.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => markAsRead(n.id)} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold ml-2">
                                            Lu
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;

