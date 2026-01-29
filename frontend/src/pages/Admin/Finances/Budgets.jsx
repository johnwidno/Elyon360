import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';

export default function Budgets() {
    const { t } = useLanguage();
    const [budgets, setBudgets] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        startDate: '',
        endDate: ''
    });

    // Report State
    const [reportModal, setReportModal] = useState({
        show: false,
        budget: null,
        expenses: [],
        loading: false
    });

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        currency: 'HTG',
        description: '',
        year: new Date().getFullYear(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: 'actif',
        bankAccountId: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [budRes, accRes, churchRes] = await Promise.all([
                    api.get('/budgets'),
                    api.get('/bank-accounts'),
                    api.get('/churches/settings')
                ]);
                setBudgets(budRes.data);
                setBankAccounts(accRes.data);
                setChurch(churchRes.data.church);
            } catch (err) {
                console.error("Error fetching budget data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived State
    const activeBudgets = budgets.filter(b => b.status === 'actif');

    const filteredBudgets = budgets.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            (b.description && b.description.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesStatus = filters.status === 'all' || b.status === filters.status;

        const matchesStartDate = !filters.startDate || new Date(b.startDate) >= new Date(filters.startDate);
        const matchesEndDate = !filters.endDate || new Date(b.endDate) <= new Date(filters.endDate);

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });

    // Budget Creation Logic
    const selectedBankAccount = bankAccounts.find(acc => acc.id === parseInt(formData.bankAccountId));

    // Calculate total reserved in selected account by ALREADY EXISTING budgets
    const budgetsLinkedToSelectedAccount = budgets.filter(b =>
        b.bankAccountId === parseInt(formData.bankAccountId) &&
        (b.status === 'actif' || b.status === 'suspendu')
    );

    const totalReservedInAccount = budgetsLinkedToSelectedAccount.reduce((sum, b) => {
        const spent = b.spent || 0;
        const remaining = Math.max(0, parseFloat(b.amount) - spent);
        return sum + remaining;
    }, 0);

    const availableToAllocate = selectedBankAccount
        ? parseFloat(selectedBankAccount.balance) - totalReservedInAccount
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (parseFloat(formData.amount) > availableToAllocate) {
            setError(`${t('fonds_insufficient_disp', 'Fonds insuffisants. Disponible: ')}${availableToAllocate.toLocaleString()} ${formData.currency}`);
            return;
        }

        try {
            const res = await api.post('/budgets', formData);
            setBudgets([...budgets, res.data]);
            setShowModal(false);
            setFormData({ name: '', amount: '', currency: 'HTG', description: '', year: new Date().getFullYear(), startDate: new Date().toISOString().split('T')[0], endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], status: 'actif', bankAccountId: '' });
        } catch (err) {
            console.error("Error creating budget", err);
            setError(err.response?.data?.message || t('error_creating_budget', "Erreur lors de la création du budget"));
        }
    };

    // Report Logic
    const handleOpenReport = async (budget) => {
        setReportModal({ show: true, budget, expenses: [], loading: true });
        try {
            // Fetch ALL expenses then filter (Client-side filtering as per current architecture)
            const res = await api.get('/expenses');
            const relatedExpenses = res.data.filter(e => e.budgetId === budget.id);
            setReportModal({ show: true, budget, expenses: relatedExpenses, loading: false });
        } catch (error) {
            console.error("Error fetching report details", error);
            setReportModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    const exportBudgetsToCSV = () => {
        const headers = [t('name', 'Nom'), t('start', 'Début'), t('end', 'Fin'), t('status'), t('amount'), t('spent', 'Dépensé'), t('remaining', 'restant'), t('currency'), t('source_account', 'Compte Source')];
        const rows = filteredBudgets.map(b => {
            const account = bankAccounts.find(a => a.id === b.bankAccountId);
            const spent = b.spent || 0;
            return [
                b.name,
                b.startDate,
                b.endDate,
                b.status,
                b.amount,
                spent,
                b.amount - spent,
                b.currency,
                account ? account.name : 'N/A'
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "liste_budgets.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportReportToExcel = () => {
        // Simple CSV export for the report expenses
        const headers = [t('date'), t('description'), t('category'), t('amount'), t('currency')];
        const rows = reportModal.expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.description,
            e.category,
            e.amount,
            reportModal.budget.currency
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapport_budget_${reportModal.budget.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div className="h-full overflow-y-auto">
                {/* Inject Print Styles */}
                <style>{`
                @media print {
                    @page { size: letter; margin: 0.5in; } /* 8.5x11 inches (Letter) */
                    
                    body * { 
                        visibility: hidden; 
                    }
                    
                    #printable-report, #printable-report * { 
                        visibility: visible; 
                    }
                    
                    #printable-report { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        margin: 0;
                        padding: 0;
                        background: white; 
                        color: black;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    /* Hide UI elements */
                    .no-print, button, .metrics-cards { 
                        display: none !important; 
                    }

                    /* Custom Header Sizing */
                    .print-church-name {
                        font-size: 14pt !important;
                        font-weight: bold !important;
                        margin-bottom: 5px;
                    }
                    
                    /* Print Padding Reset */
                    .print-no-padding {
                        padding: 0 !important;
                    }

                    /* Print Metrics Table */
                    .print-metrics-table {
                        display: table !important;
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        border: 1px solid black;
                    }
                    
                    .print-metrics-table th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold;
                        border: 1px solid black;
                        padding: 5px;
                        text-align: center;
                        font-size: 10pt;
                    }
                    
                    .print-metrics-table td {
                        border: 1px solid black;
                        padding: 5px;
                        text-align: center;
                        font-size: 11pt;
                        font-weight: bold;
                    }
                    
                    .print-church-contact {
                        font-size: 11pt !important;
                        font-style: italic !important;
                        font-weight: normal !important;
                        margin-bottom: 20px;
                    }

                    .print-budget-title {
                        font-size: 12pt !important;
                        font-weight: bold !important;
                    }
                    
                    .print-header-row {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: baseline !important;
                        border-bottom: 2px solid black;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }

                    /* Table styling */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    
                    th {
                        border-bottom: 2px solid black;
                        padding: 5px 0;
                        text-align: left;
                        font-size: 10pt;
                        font-weight: bold;
                    }
                    
                    td {
                        border-bottom: 1px solid #eee;
                        padding: 8px 0;
                        font-size: 10pt;
                    }
                    
                    .text-right { text-align: right; }

                    /* Footer */
                    .print-footer {
                        display: block !important;
                        margin-top: 50px;
                        page-break-inside: avoid;
                    }
                    
                    .signature-line {
                        border-top: 1px solid black;
                        width: 200px;
                        margin-top: 50px;
                        padding-top: 5px;
                        font-size: 10pt;
                    }
                }
            `}</style>

                {/* ... (rest of component unchanged) ... */}

                <div className="mb-10 flex justify-between items-center">
                    {/* ... */}
                </div>

                {/* ... (Budget Cards and List Table Sections remain effectively unchanged in structure, but need to ensure no syntax errors if I clipped them. I won't replace them unless needed. I will focus on the Modal part.) */}

                {/* ... */}


                <div className="mb-10 flex flex-wrap justify-between items-center gap-6 transition-colors px-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{t('budgets', 'Budgets')}</h1>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 mt-3 transition-colors">{t('budgets_desc', 'Gestion et suivi des enveloppes budgétaires.')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 dark:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-[13px] hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all shadow-lg active:scale-95"
                    >
                        + {t('new_budget', 'Nouveau Budget')}
                    </button>
                </div>

                {/* SECTION 1: ACTIVE BUDGETS CARDS */}
                <div className="mb-12 transition-colors px-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 flex items-center gap-2 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t('active_budgets', 'Budgets Actifs')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full py-20 text-center text-gray-400 dark:text-gray-600 font-medium italic transition-colors">{t('loading', 'Chargement...')}</div>
                        ) : activeBudgets.length === 0 ? (
                            <div className="col-span-full py-10 text-center bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-600 font-medium italic transition-all">
                                {t('no_active_budgets', 'Aucun budget actif pour le moment.')}
                            </div>
                        ) : (
                            activeBudgets.map(b => {
                                const spent = b.spent || 0;
                                const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                                return (
                                    <div key={b.id} className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-8 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{b.name}</h3>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-2 transition-colors">
                                                    {t('end')}: {new Date(b.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenReport(b)}
                                                className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors active:scale-95"
                                                title={t('view_report', 'Voir le rapport')}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-4 relative z-10 transition-colors">
                                            <div className="flex justify-between items-end">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                                                    {b.currency === 'HTG' ? 'G' : '$'} {parseFloat(spent).toLocaleString()}
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 transition-colors"> / {parseFloat(b.amount).toLocaleString()}</span>
                                            </div>

                                            <div className="w-full h-4 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100 dark:border-white/5 transition-colors">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between text-[11px] font-semibold transition-colors">
                                                <span className={percentage > 90 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}>{percentage.toFixed(1)}% {t('used', 'Utilisé')}</span>
                                                <span className="text-gray-500">{parseFloat(b.amount - spent).toLocaleString()} {t('remaining_text', 'restant')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* SECTION 2: BUDGET LIST TABLE */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all mx-8">
                    <div className="p-8 border-b border-gray-50 dark:border-white/5 flex flex-col items-start gap-4 transition-colors">
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('full_list', 'Liste Complète')}</h2>
                            <button
                                onClick={exportBudgetsToCSV}
                                className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-xl text-[11px] font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2 active:scale-95"
                            >
                                <span>📥</span> {t('export_list', 'Exporter la liste')}
                            </button>
                        </div>

                        {/* FILTERS TOOLBAR */}
                        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl transition-colors">
                            <input
                                type="text"
                                placeholder={t('search_budget', '🔍 Rechercher un budget...')}
                                className="bg-white dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                            <select
                                className="bg-white dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="all" className="dark:bg-[#1A1A1A]">{t('all_statuses', 'Tous les statuts')}</option>
                                <option value="actif" className="dark:bg-[#1A1A1A]">{t('active', 'Actif')}</option>
                                <option value="inactif" className="dark:bg-[#1A1A1A]">{t('inactive', 'Inactif')}</option>
                                <option value="suspendu" className="dark:bg-[#1A1A1A]">{t('suspended', 'Suspendu')}</option>
                            </select>
                            <input
                                type="date"
                                className="bg-white dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-gray-500 dark:text-gray-400 transition-all [color-scheme:dark]"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <input
                                type="date"
                                className="bg-white dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 text-gray-500 dark:text-gray-400 transition-all [color-scheme:dark]"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto noscrollbar transition-colors">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8F9FA]/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 transition-colors">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">{t('budget')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">{t('period', 'Période')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">{t('status')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right leading-none">{t('amount')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right leading-none">{t('consumed', 'Consommé')}</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right leading-none">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                {filteredBudgets.length === 0 ? (
                                    <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-400 dark:text-gray-600 italic font-medium">{t('no_budgets_found', 'Aucun budget trouvé pour ces critères.')}</td></tr>
                                ) : (
                                    filteredBudgets.map(b => {
                                        const account = bankAccounts.find(a => a.id === b.bankAccountId);
                                        const spent = b.spent || 0;
                                        return (
                                            <tr key={b.id} className="hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-all cursor-pointer group" onClick={() => handleOpenReport(b)}>
                                                <td className="px-8 py-5">
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{b.name}</div>
                                                    {account && <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold transition-colors">{account.name}</div>}
                                                </td>
                                                <td className="px-8 py-5 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-colors">
                                                    {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-tight transition-colors ${b.status === 'actif' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                                        b.status === 'suspendu' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                            'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-bold text-gray-900 dark:text-gray-100 transition-colors">
                                                    {parseFloat(b.amount).toLocaleString()} {b.currency}
                                                </td>
                                                <td className="px-8 py-5 text-right font-semibold text-gray-500 dark:text-gray-400 transition-colors">
                                                    {parseFloat(spent).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenReport(b); }}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg transition-colors active:scale-95"
                                                    >
                                                        {t('report', 'Rapport')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREATE MODAL */}
                {showModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in transition-colors">
                        <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl sm:rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden relative animate-scale-in flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-transparent dark:border-white/5 transition-colors">
                            <div className="p-8 sm:p-12 border-b border-gray-50 dark:border-white/5 flex justify-between items-center shrink-0 transition-colors">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 leading-none transition-colors">{t('new_budget', 'Nouveau Budget')}</h2>
                                    <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold uppercase tracking-tight">{t('allocate_funds', "Allocation des fonds de l'église")}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400 dark:text-gray-500 active:scale-95">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-8 sm:p-12 space-y-6 overflow-y-auto noscrollbar flex-1 transition-colors">
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-xl text-sm font-semibold animate-shake transition-colors">
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-50 dark:border-indigo-900/20 space-y-3 transition-colors">
                                        <div className="flex justify-between items-center transition-colors">
                                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight transition-colors">{t('source_account', 'Compte Source')}</span>
                                            {selectedBankAccount && (
                                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors">
                                                    {t('balance', 'Solde')}: {parseFloat(selectedBankAccount.balance).toLocaleString()} {selectedBankAccount.currency}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center transition-colors">
                                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight transition-colors">{t('available_for_this_budget', 'Disponible pour ce budget')}</span>
                                            <span className={`text-[11px] font-bold transition-colors ${availableToAllocate < 0 ? 'text-red-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                {availableToAllocate.toLocaleString()} {formData.currency}
                                            </span>
                                        </div>
                                        {availableToAllocate < 0 && (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                                                ⚠️ {t('insufficient_funds', 'Fonds insuffisants sur ce compte !')}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('budget_name_label', 'Nom du budget')}</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: Évangélisation..."
                                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-gray-900 dark:text-white"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 transition-colors">
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('allocated_amount', 'Montant alloué')}</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-900 dark:text-white"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('currency')}</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-gray-900 dark:text-white"
                                                value={formData.currency}
                                                onChange={e => {
                                                    setFormData({ ...formData, currency: e.target.value, bankAccountId: '' });
                                                }}
                                            >
                                                {['HTG', 'USD', 'EUR'].map(code => (
                                                    <option key={code} value={code} className="dark:bg-[#1A1A1A]">{code}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('bank_account_source', 'Compte Bancaire Source')} <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-gray-900 dark:text-white"
                                            value={formData.bankAccountId}
                                            onChange={e => setFormData({ ...formData, bankAccountId: e.target.value })}
                                        >
                                            <option value="" className="dark:bg-[#1A1A1A]">-- {t('select_source_account', 'Sélectionner le compte source')} --</option>
                                            {bankAccounts
                                                .filter(acc => acc.currency === formData.currency)
                                                .map(acc => (
                                                    <option key={acc.id} value={acc.id} className="dark:bg-[#1A1A1A]">
                                                        {acc.name} ({acc.bankName}) - {t('balance', 'Solde')}: {parseFloat(acc.balance).toLocaleString()} {acc.currency}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 transition-colors">
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('start_date', 'Date de début')}</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-xs text-gray-900 dark:text-white [color-scheme:dark]"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('end_date', 'Date de fin')}</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-xs text-gray-900 dark:text-white [color-scheme:dark]"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('status', 'Statut')}</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-xs text-gray-900 dark:text-white"
                                                value={formData.status}
                                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="actif" className="dark:bg-[#1A1A1A]">{t('active', 'Actif')}</option>
                                                <option value="inactif" className="dark:bg-[#1A1A1A]">{t('inactive', 'Inactif')}</option>
                                                <option value="suspendu" className="dark:bg-[#1A1A1A]">{t('suspended', 'Suspendu')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('description')}</label>
                                        <textarea
                                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-semibold min-h-[100px] text-gray-900 dark:text-white"
                                            placeholder={t('budget_objectives_placeholder', 'Objectifs de ce budget...')}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="p-8 sm:px-12 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 shrink-0 transition-colors">
                                    <button
                                        type="submit"
                                        disabled={parseFloat(formData.amount) > availableToAllocate || availableToAllocate <= 0}
                                        className={`w-full font-semibold text-[13px] uppercase tracking-wide py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] ${parseFloat(formData.amount) > availableToAllocate || availableToAllocate <= 0
                                            ? 'bg-gray-300 dark:bg-white/5 text-gray-500 dark:text-gray-600 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-800 shadow-indigo-100 dark:shadow-none'
                                            }`}
                                    >
                                        {t('create_budget_btn', 'Créer le budget')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* REPORT MODAL */}
                {reportModal.show && reportModal.budget && (
                    <div id="wrapper-report-modal" className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 animate-fade-in print:bg-white print:z-[99999] transition-colors" style={{ margin: 0 }}>
                        <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80 backdrop-blur-md no-print" onClick={() => setReportModal({ ...reportModal, show: false })}></div>
                        <div id="printable-report" className="bg-white dark:bg-[#1A1A1A] rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden relative animate-scale-in flex flex-col border border-transparent dark:border-white/5 transition-colors">

                            {/* HEADER - No Print Close Button */}
                            <div className="px-10 py-8 sm:px-14 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0 no-print transition-colors">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">{t('detailed_report', 'Rapport Détaillé')}</h2>
                                <div className="flex gap-2">
                                    <button onClick={handlePrintReport} className="bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[11px] font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors active:scale-95">
                                        🖨️ {t('print_pdf', 'Imprimer / PDF')}
                                    </button>
                                    <button onClick={exportReportToExcel} className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-xl text-[11px] font-semibold hover:bg-green-700 dark:hover:bg-green-800 transition-colors active:scale-95">
                                        📊 {t('excel', 'Excel')}
                                    </button>
                                    <button onClick={() => setReportModal({ ...reportModal, show: false })} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400 dark:text-gray-500 active:scale-95">
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 sm:p-14 overflow-y-auto noscrollbar flex-1 print-no-padding">
                                {/* PRINT HEADER SECTION */}
                                <div className="mb-12">
                                    {/* Church Info */}
                                    <div className="text-center mb-10">
                                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2 print-church-name">
                                            {church?.name || 'Ma Paroisse'}
                                        </h1>
                                        <p className="text-gray-400 font-medium text-sm print-church-contact">
                                            {church?.address || ''} {church?.city ? `, ${church.city}` : ''} | {church?.contactPhone || ''}
                                        </p>
                                    </div>

                                    {/* Budget Info Line */}
                                    <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-dashed border-gray-100 dark:border-white/5 pb-6 mb-8 print-header-row transition-colors">
                                        <div className="text-left">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight print-budget-title transition-colors">
                                                {reportModal.budget.name}
                                            </div>
                                            <div className="text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-tight text-[11px] mt-1 transition-colors">
                                                {t('period', 'Période')}: {new Date(reportModal.budget.startDate).toLocaleDateString()} - {new Date(reportModal.budget.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PRINT-ONLY SUMMARY METRICS */}
                                <div className="hidden print:block mb-8">
                                    <table className="print-metrics-table">
                                        <thead>
                                            <tr>
                                                <th>Budget Total</th>
                                                <th>Dépensé</th>
                                                <th>Restant</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{parseFloat(reportModal.budget.amount).toLocaleString()} {reportModal.budget.currency}</td>
                                                <td>{parseFloat(reportModal.budget.spent || 0).toLocaleString()} {reportModal.budget.currency}</td>
                                                <td>{parseFloat(reportModal.budget.amount - (reportModal.budget.spent || 0)).toLocaleString()} {reportModal.budget.currency}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* METRICS CARDS (Visible on Screen, Hidden on Print) */}
                                <div className="grid grid-cols-3 gap-8 mb-16 text-center metrics-cards no-print transition-colors">
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-8 border border-transparent dark:border-white/5 transition-colors">
                                        <div className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-tight mb-2 transition-colors">{t('budget_total', 'Budget Total')}</div>
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                                            {parseFloat(reportModal.budget.amount).toLocaleString()} {reportModal.budget.currency}
                                        </div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border border-transparent dark:border-red-900/20 transition-colors">
                                        <div className="text-[11px] text-red-400 dark:text-red-500 font-semibold uppercase tracking-tight mb-2 transition-colors">{t('spent', 'Dépensé')}</div>
                                        <div className="text-3xl font-bold text-red-600 dark:text-red-400 tracking-tight transition-colors">
                                            {parseFloat(reportModal.budget.spent || 0).toLocaleString()} {reportModal.budget.currency}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-8 border border-transparent dark:border-green-900/20 transition-colors">
                                        <div className="text-[11px] text-green-400 dark:text-green-500 font-semibold uppercase tracking-tight mb-2 transition-colors">{t('remaining', 'Restant')}</div>
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 tracking-tight transition-colors">
                                            {parseFloat(reportModal.budget.amount - (reportModal.budget.spent || 0)).toLocaleString()} {reportModal.budget.currency}
                                        </div>
                                    </div>
                                </div>

                                {/* EXPENSES TABLE */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-8 transition-colors">{t('expenses_detail', 'Détail des Dépenses')}</h3>
                                {reportModal.loading ? (
                                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 italic transition-colors">{t('loading_expenses', 'Chargement des dépenses...')}</div>
                                ) : reportModal.expenses.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-white/10 rounded-2xl text-gray-400 dark:text-gray-600 italic transition-all">
                                        {t('no_expenses_found', 'Aucune dépense enregistrée sur ce budget.')}
                                    </div>
                                ) : (
                                    <>
                                        <table className="w-full text-left border-collapse transition-colors">
                                            <thead>
                                                <tr className="border-b-2 border-gray-900 dark:border-white/20 transition-colors">
                                                    <th className="py-3 text-[11px] font-semibold text-gray-900 dark:text-white leading-none transition-colors">{t('date')}</th>
                                                    <th className="py-3 text-[11px] font-semibold text-gray-900 dark:text-white leading-none transition-colors">{t('description')}</th>
                                                    <th className="py-3 text-[11px] font-semibold text-gray-900 dark:text-white leading-none transition-colors">{t('category')}</th>
                                                    <th className="py-3 text-[11px] font-semibold text-gray-900 dark:text-white text-right leading-none transition-colors">{t('amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5 transition-colors">
                                                {reportModal.expenses.map(e => (
                                                    <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors">{new Date(e.date).toLocaleDateString()}</td>
                                                        <td className="py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors">{e.description}</td>
                                                        <td className="py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 transition-colors">{e.category}</td>
                                                        <td className="py-3 text-sm font-bold text-red-600 dark:text-red-400 text-right transition-colors">
                                                            - {parseFloat(e.amount).toLocaleString()} {reportModal.budget.currency}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Total Footer Row for Print */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                            <div className="text-right">
                                                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mr-4">{t('total_expenses_label', 'Total Dépenses:')}</span>
                                                <span className="text-xl font-bold text-red-600 tracking-tight transition-colors">
                                                    {parseFloat(reportModal.budget.spent || 0).toLocaleString()} {reportModal.budget.currency}
                                                </span>
                                            </div>
                                        </div>
                                        Refresh Church name in report...
                                    </>
                                )}

                                {/* PRINT FOOTER SIGNATURE */}
                                <div className="print-footer hidden">
                                    <div className="flex justify-between mt-20">
                                        <div className="signature-line">
                                            <p className="font-bold">{t('prepared_by', 'Préparé par :')}</p>
                                        </div>
                                        <div className="signature-line">
                                            <p className="font-bold">{t('responsible_pastor', 'Responsable / Pasteur :')}</p>
                                        </div>
                                    </div>
                                    <div className="text-center mt-10 text-[8pt] text-gray-400 italic">
                                        {t('generated_by_on', 'Généré par ElyonSys 360 le ')} {new Date().toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }
            </div>
        </AdminLayout >
    );
}
