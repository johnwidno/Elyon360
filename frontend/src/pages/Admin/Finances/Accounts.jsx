import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { exportToExcel } from '../../../utils/exportUtils';

export default function Accounts() {
    const { t } = useLanguage();
    const [accounts, setAccounts] = useState([]);
    const [donations, setDonations] = useState([]); // Pending donations
    const [depositedDonations, setDepositedDonations] = useState([]); // Deposited/History
    const [members, setMembers] = useState([]); // For depositor selection
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [showAllRecords, setShowAllRecords] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: ''
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);

    // Forms Data
    const [createForm, setCreateForm] = useState({ name: '', bankName: '', accountNumber: '', currency: 'HTG' });
    const [depositForm, setDepositForm] = useState({ bankAccountId: '', donationIds: [], depositDate: '', depositedById: '' });
    const [depositorSearch, setDepositorSearch] = useState('');

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [accRes, donRes, membersRes] = await Promise.all([
                api.get('/bank-accounts'),
                api.get('/donations'),
                api.get('/users')
            ]);
            setAccounts(accRes.data);
            setMembers(membersRes.data || []);

            // Split donations
            const allDonations = donRes.data || [];
            setDonations(allDonations.filter(d => d.status === 'pending' || d.status === 'en_attente'));
            setDepositedDonations(allDonations.filter(d => d.status === 'deposited' || d.status === 'complete').sort((a, b) => new Date(b.date) - new Date(a.date)));

        } catch (err) {
            console.error("Error fetching data", err);
            setError(t('data_load_error', "Impossible de charger les données. Vérifiez que le serveur est démarré. ") + (err.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('/bank-accounts', createForm);
            setShowCreateModal(false);
            setCreateForm({ name: '', bankName: '', accountNumber: '', currency: 'HTG' });
            fetchData();
            setSuccess(t('account_created_success', "Compte créé avec succès !"));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('creation_error', "Erreur lors de la création"));
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!depositForm.bankAccountId) {
            setError(t('select_bank_account_error', "Veuillez sélectionner un compte bancaire."));
            return;
        }
        if (depositForm.donationIds.length === 0) {
            setError(t('select_donations_error', "Veuillez sélectionner au moins une donation à déposer."));
            return;
        }
        if (!depositForm.depositDate) {
            setError(t('select_date_error', "Veuillez sélectionner la date d'encaissement."));
            return;
        }
        if (!depositForm.depositedById) {
            setError(t('select_depositor_error', "Veuillez sélectionner la personne qui a effectué le dépôt."));
            return;
        }

        try {
            await api.post('/bank-accounts/deposit', depositForm);
            setShowDepositModal(false);
            setDepositForm({ bankAccountId: '', donationIds: [], depositDate: '', depositedById: '' });
            setDepositorSearch('');
            fetchData();
            setSuccess("Dépôt effectué avec succès !");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors du dépôt");
        }
    };

    // Filter donations compatible with selected account for deposit
    const selectedAccount = accounts.find(a => a.id === parseInt(depositForm.bankAccountId));
    const compatibleDonations = selectedAccount
        ? donations.filter(d => d.currency === selectedAccount.currency)
        : [];

    // Calculate totals
    const totalPending = donations.reduce((acc, curr) => {
        acc[curr.currency] = (acc[curr.currency] || 0) + parseFloat(curr.amount);
        return acc;
    }, {});

    const getFilteredData = () => {
        let data = activeTab === 'pending' ? donations : depositedDonations;

        if (filters.startDate) {
            data = data.filter(d => new Date(d.date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            data = data.filter(d => new Date(d.date) <= new Date(filters.endDate));
        }
        if (filters.type) {
            data = data.filter(d => d.type === filters.type);
        }

        // Limit to 10 most recent records unless 'Show All' is active
        if (!showAllRecords && data.length > 10) {
            return data.slice(0, 10);
        }

        return data;
    };

    const filteredList = getFilteredData();

    return (
        <AdminLayout>
            <div className="mb-10 flex flex-nowrap justify-between items-center gap-6 px-8 transition-colors">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{t('finances_accounts', 'Comptes & Trésorerie')}</h1>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 mt-3">{t('finances_accounts_desc', 'Gérez vos comptes bancaires et vos dépôts.')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-green-600 dark:bg-[#1A1A1A] text-white px-6 py-4 rounded-xl font-semibold text-[13px] hover:bg-green-700 transition-all shadow-sm active:scale-95 border border-transparent dark:border-white/5"
                    >
                        {t('make_deposit', 'Faire un Dépôt')}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-4 rounded-xl font-semibold text-[13px] hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                    >
                        {t('new_account', 'Nouveau Compte')}
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 px-8 transition-colors">
                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 transition-all">
                    <h3 className="text-gray-400 dark:text-gray-500 font-semibold text-[11px] mb-4">{t('cash_on_hand_pending', 'Espèces en Main (Attente)')}</h3>
                    {Object.entries(totalPending).length > 0 ? (
                        Object.entries(totalPending).map(([curr, amount]) => (
                            <div key={curr} className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 transition-colors">
                                {amount.toLocaleString()} {curr}
                            </div>
                        ))
                    ) : (
                        <div className="text-2xl font-bold text-gray-300 dark:text-gray-700 tracking-tight">0.00</div>
                    )}
                </div>
            </div>

            {/* Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 transition-colors">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-8 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-colors"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors">{acc.bankName}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 relative z-10 transition-colors">{acc.name}</h3>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-6 relative z-10 transition-colors">{acc.accountNumber || t('no_number', 'Sans numéro')}</p>

                        <div className="pt-6 border-t border-gray-50 dark:border-white/5 relative z-10 transition-colors">
                            <span className="block text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 transition-colors">{t('current_balance', 'Solde actuel')}</span>
                            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight transition-colors">
                                {parseFloat(acc.balance).toLocaleString()} {acc.currency}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports Section */}
            <div className="mt-16 transition-colors">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all">
                        <div className="flex flex-wrap gap-4 w-full md:w-auto">
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block">{t('start_date', 'Date Début')}</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 font-bold text-xs focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block">{t('end_date', 'Date Fin')}</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2 font-bold text-xs focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-all [color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block">{t('type')}</label>
                                <select
                                    value={filters.type}
                                    onChange={e => setFilters({ ...filters, type: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-none rounded-xl px-4 py-2.5 font-bold text-xs focus:ring-2 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 min-w-[150px] transition-all"
                                >
                                    <option value="" className="dark:bg-[#1A1A1A]">{t('all_types', 'Tous les types')}</option>
                                    <option value="dime" className="dark:bg-[#1A1A1A]">{t('dime', 'Dîme')}</option>
                                    <option value="offrande" className="dark:bg-[#1A1A1A]">{t('offrande', 'Offrande')}</option>
                                    <option value="don" className="dark:bg-[#1A1A1A]">{t('don', 'Don')}</option>
                                    <option value="action_de_grace" className="dark:bg-[#1A1A1A]">{t('thanksgiving', 'Action de grâce')}</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const dataToExport = getFilteredData().map(d => ({
                                    'Date Don': new Date(d.date).toLocaleDateString(),
                                    'Date Encaissement': d.depositDate ? new Date(d.depositDate).toLocaleDateString() : '-',
                                    Donateur: d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonyme',
                                    Type: d.type,
                                    Montant: d.amount,
                                    Devise: d.currency,
                                    Statut: activeTab === 'pending' ? 'En Attente' : 'Déposé',
                                    Compte: activeTab === 'history' && d.bankAccountId ? accounts.find(a => a.id === d.bankAccountId)?.name : '-',
                                    'Ajouté par': d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-',
                                    'Encaissé par': d.depositedBy ? `${d.depositedBy.firstName} ${d.depositedBy.lastName}` : '-'
                                }));
                                exportToExcel(`Rapport_Tresorerie_${activeTab}`, dataToExport);
                            }}
                            className="bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold text-[13px] hover:bg-green-700 dark:hover:bg-green-800 transition-all shadow-lg shadow-green-100 dark:shadow-none flex items-center gap-2 active:scale-95"
                        >
                            <span>📊</span> {t('export_excel', 'Exporter Excel')}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6 transition-colors">
                    <div className="flex items-center gap-6 border-b border-gray-100 dark:border-white/5 transition-colors">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'pending' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
                        >
                            {t('cash_on_hand_pending_tab', `Espèces en Attente (${donations.length})`)}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 text-sm font-semibold transition-all ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
                        >
                            {t('deposit_history', 'Historique des Dépôts')}
                        </button>
                    </div>
                    {((activeTab === 'pending' && donations.length > 10) || (activeTab === 'history' && depositedDonations.length > 10)) && (
                        <button
                            onClick={() => setShowAllRecords(!showAllRecords)}
                            className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
                        >
                            {showAllRecords ? `${t('show_10_recent', 'Afficher les 10 récents')}` : `${t('view_all', 'Voir tout')} (${activeTab === 'pending' ? donations.length : depositedDonations.length})`}
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all">
                    {activeTab === 'pending' ? (
                        <div className="overflow-x-auto noscrollbar transition-colors">
                            <table className="w-full text-left">
                                <thead className="bg-[#F8F9FA]/50 dark:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('date')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('member', 'Donateur')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('type')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('added_by', 'Ajouté par')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 text-right leading-none">{t('amount')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 text-right leading-none">{t('status')}</th>
                                        <th className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 text-center leading-none">{t('action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                    {filteredList.length === 0 ? (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 dark:text-gray-600 italic font-medium">{t('no_pending_cash', 'Aucune espèce en attente trouvée.')}</td></tr>
                                    ) : (
                                        filteredList.map(d => (
                                            <tr key={d.id} className="hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-all group">
                                                <td className="px-6 py-5 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-colors">{new Date(d.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors">{d.member ? `${d.member.firstName} ${d.member.lastName}` : t('anonymous', 'Anonyme')}</td>
                                                <td className="px-6 py-5"><span className="px-3 py-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg text-[10px] font-semibold text-gray-600 dark:text-gray-400 transition-colors">{d.type}</span></td>
                                                <td className="px-6 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase transition-colors">{d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-bold text-indigo-600 dark:text-indigo-400 transition-colors">{parseFloat(d.amount).toLocaleString()} {d.currency}</td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="text-[10px] font-semibold text-amber-500 dark:text-amber-600 uppercase transition-colors flex items-center justify-end gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                                                        {t('pending', 'En Attente')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() => {
                                                            // Pre-select this donation and open modal
                                                            setDepositForm({
                                                                bankAccountId: '',
                                                                donationIds: [d.id],
                                                                depositDate: '',
                                                                depositedById: ''
                                                            });
                                                            setDepositorSearch('');
                                                            setShowDepositModal(true);
                                                        }}
                                                        className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-[11px] hover:bg-green-700 dark:hover:bg-green-800 transition-all shadow-sm active:scale-95"
                                                    >
                                                        {t('deposit', 'Déposer')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto noscrollbar transition-colors">
                            <table className="w-full text-left">
                                <thead className="bg-[#F8F9FA]/50 dark:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5">
                                    <tr>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('date_donation', 'Date Don')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('date_deposit', 'Date Encaissement')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('member', 'Donateur')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('account', 'Compte')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('added_by', 'Ajouté par')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('deposited_by', 'Encaissé par')}</th>
                                        <th className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 text-right leading-none">{t('amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                    {filteredList.length === 0 ? (
                                        <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400 dark:text-gray-600 italic font-medium">{t('no_deposit_history', 'Aucun historique de dépôt trouvé.')}</td></tr>
                                    ) : (
                                        filteredList.map(d => {
                                            const account = accounts.find(a => a.id === d.bankAccountId);
                                            return (
                                                <tr key={d.id} className="hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-all group">
                                                    <td className="px-4 py-5 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-colors">{new Date(d.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-5 text-sm font-semibold text-green-600 dark:text-green-500 transition-colors">{d.depositDate ? new Date(d.depositDate).toLocaleDateString() : '-'}</td>
                                                    <td className="px-4 py-5 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors">{d.member ? `${d.member.firstName} ${d.member.lastName}` : t('anonymous', 'Anonyme')}</td>
                                                    <td className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors">{account ? `${account.bankName}` : '-'}</td>
                                                    <td className="px-4 py-5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors">{d.createdBy ? `${d.createdBy.firstName} ${d.createdBy.lastName}` : '-'}</td>
                                                    <td className="px-4 py-5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 transition-colors">{d.depositedBy ? `${d.depositedBy.firstName} ${d.depositedBy.lastName}` : '-'}</td>
                                                    <td className="px-4 py-5 text-right font-bold text-green-600 dark:text-green-500 transition-colors">{parseFloat(d.amount).toLocaleString()} {d.currency}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Account Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 transition-colors">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-width-lg relative z-10 p-8 animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 transition-colors">{t('new_account', 'Nouveau Compte')}</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('account_name_label', 'Nom du compte (ex: Principal)')}</label>
                                <input type="text" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('bank')}</label>
                                    <input type="text" required value={createForm.bankName} onChange={e => setCreateForm({ ...createForm, bankName: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all" placeholder="Ex: BNC" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('currency')}</label>
                                    <select value={createForm.currency} onChange={e => setCreateForm({ ...createForm, currency: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all">
                                        <option value="HTG" className="dark:bg-[#1A1A1A]">HTG</option>
                                        <option value="USD" className="dark:bg-[#1A1A1A]">USD</option>
                                        <option value="EUR" className="dark:bg-[#1A1A1A]">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('account_number_label', 'Numéro de compte (Optionnel)')}</label>
                                <input type="text" value={createForm.accountNumber} onChange={e => setCreateForm({ ...createForm, accountNumber: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all" />
                            </div>

                            {error && <p className="text-red-500 dark:text-red-400 text-xs font-semibold transition-colors">{error}</p>}

                            <button type="submit" className="w-full bg-indigo-600 dark:bg-indigo-700 text-white font-bold text-[13px] py-4 rounded-2xl mt-4 hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95">
                                {t('create_account_btn', 'Créer le Compte')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 transition-colors">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowDepositModal(false)}></div>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-w-2xl relative z-10 p-8 animate-scale-in border border-transparent dark:border-white/5 max-h-[90vh] overflow-y-auto noscrollbar transition-colors">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 transition-colors">{t('make_deposit_title', 'Effectuer un Dépôt')}</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('to_which_account', 'Vers quel compte ?')}</label>
                                <select
                                    value={depositForm.bankAccountId}
                                    onChange={e => setDepositForm({ ...depositForm, bankAccountId: e.target.value, donationIds: [] })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                >
                                    <option value="" className="dark:bg-[#1A1A1A]">{t('select_account', 'Sélectionnez un compte...')}</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="dark:bg-[#1A1A1A]">{acc.name} ({acc.bankName}) - {acc.currency}</option>
                                    ))}
                                </select>
                            </div>

                            {depositForm.bankAccountId && (
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl p-6 border border-indigo-50 dark:border-indigo-900/20 transition-colors">
                                    <div className="flex justify-between items-center mb-4 transition-colors">
                                        <h3 className="text-indigo-900 dark:text-indigo-300 font-bold text-sm transition-colors">{t('available_donations', 'Donations disponibles')} ({selectedAccount?.currency})</h3>
                                        <button
                                            onClick={() => setDepositForm({ ...depositForm, donationIds: compatibleDonations.map(d => d.id) })}
                                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                        >
                                            {t('select_all', 'Tout sélectionner')}
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 noscrollbar transition-colors">
                                        {compatibleDonations.length > 0 ? (
                                            compatibleDonations.map(d => (
                                                <label key={d.id} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={depositForm.donationIds.includes(d.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setDepositForm(prev => ({ ...prev, donationIds: [...prev.donationIds, d.id] }));
                                                                } else {
                                                                    setDepositForm(prev => ({ ...prev, donationIds: prev.donationIds.filter(id => id !== d.id) }));
                                                                }
                                                            }}
                                                            className="w-5 h-5 rounded-lg border-gray-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 dark:bg-black/20 transition-all cursor-pointer"
                                                        />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm transition-colors">{d.type}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold transition-colors">{new Date(d.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 transition-colors">
                                                        {parseFloat(d.amount).toLocaleString()} {d.currency}
                                                    </span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm italic transition-colors">Aucune donation en attente pour cette devise.</p>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-indigo-100 dark:border-white/5 flex justify-between items-center transition-colors">
                                        <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase transition-colors">{t('total_to_deposit', 'Total à déposer')}</span>
                                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight transition-colors">
                                            {compatibleDonations
                                                .filter(d => depositForm.donationIds.includes(d.id))
                                                .reduce((sum, d) => sum + parseFloat(d.amount), 0)
                                                .toLocaleString()} {selectedAccount?.currency}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('deposit_date_label', "Date d'encaissement")} <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            value={depositForm.depositDate}
                                            onChange={e => setDepositForm({ ...depositForm, depositDate: e.target.value })}
                                            required
                                            className="w-full bg-white dark:bg-black/20 border border-indigo-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 block transition-colors">{t('deposited_by_label', 'Encaissé par')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder={t('search_person', 'Rechercher une personne...')}
                                            value={depositorSearch}
                                            onChange={e => {
                                                setDepositorSearch(e.target.value);
                                                // Clear selection if user modifies the search
                                                if (depositForm.depositedById) {
                                                    setDepositForm({ ...depositForm, depositedById: '' });
                                                }
                                            }}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-indigo-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 mb-2 text-gray-900 dark:text-white transition-all"
                                        />
                                        <select
                                            value={depositForm.depositedById}
                                            onChange={e => {
                                                const selectedId = e.target.value;
                                                setDepositForm({ ...depositForm, depositedById: selectedId });
                                                // Update search input with selected person's name
                                                if (selectedId) {
                                                    const selectedMember = members.find(m => m.id === parseInt(selectedId));
                                                    if (selectedMember) {
                                                        setDepositorSearch(`${selectedMember.firstName} ${selectedMember.lastName}`);
                                                    }
                                                }
                                            }}
                                            required
                                            size={depositorSearch.trim() && !depositForm.depositedById ? "5" : "1"}
                                            className="w-full bg-white dark:bg-black/20 border border-indigo-100 dark:border-white/5 rounded-xl px-4 py-2.5 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all"
                                        >
                                            <option value="" className="dark:bg-[#1A1A1A]">{t('select')}</option>
                                            {members
                                                .filter(m => {
                                                    if (!depositorSearch.trim()) return true;
                                                    const searchLower = depositorSearch.toLowerCase().trim();
                                                    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                                                    return fullName.includes(searchLower);
                                                })
                                                .map(m => (
                                                    <option key={m.id} value={m.id} className="dark:bg-[#1A1A1A]">
                                                        {m.firstName} {m.lastName}
                                                    </option>
                                                ))}
                                            {depositorSearch.trim() && members.filter(m => {
                                                const searchLower = depositorSearch.toLowerCase().trim();
                                                const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                                                return fullName.includes(searchLower);
                                            }).length === 0 && (
                                                    <option value="" disabled className="dark:bg-[#1A1A1A]">{t('no_results', 'Aucun résultat trouvé')}</option>
                                                )}
                                        </select>
                                        {depositorSearch.trim() && !depositForm.depositedById && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">
                                                {members.filter(m => {
                                                    const searchLower = depositorSearch.toLowerCase().trim();
                                                    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                                                    return fullName.includes(searchLower);
                                                }).length} {t('persons_found', 'personne(s) trouvée(s)')}
                                            </p>
                                        )}
                                        {depositForm.depositedById && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold flex items-center gap-1 transition-colors">
                                                <span>✓</span> {t('selected', 'Sélectionné')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold transition-colors">{error}</p>}

                            <button
                                onClick={handleDeposit}
                                disabled={!depositForm.bankAccountId || depositForm.donationIds.length === 0}
                                className={`w-full font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl active:scale-95 ${!depositForm.bankAccountId || depositForm.donationIds.length === 0
                                    ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                                    : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800 shadow-green-100 dark:shadow-none'
                                    }`}
                            >
                                {t('confirm_deposit', 'Confirmer le Dépôt')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {
                success && (
                    <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up z-[120]">
                        <span>✅</span>
                        <span className="font-bold text-sm">{success}</span>
                    </div>
                )
            }
        </AdminLayout >
    );
}
