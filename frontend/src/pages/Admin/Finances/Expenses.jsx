import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';

export default function Expenses() {
    const { t } = useLanguage();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const filterBudgetId = queryParams.get('budgetId');

    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [balances, setBalances] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        currency: 'HTG',
        budgetId: filterBudgetId || '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        bankAccountId: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [expRes, budRes, balRes, accRes] = await Promise.all([
                    api.get('/expenses'),
                    api.get('/budgets'),
                    api.get('/donations/balances'),
                    api.get('/bank-accounts')
                ]);
                setExpenses(expRes.data);
                setBudgets(budRes.data);
                setBalances(balRes.data);
                setBankAccounts(accRes.data);
            } catch (err) {
                console.error("Error fetching expense data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await api.post('/expenses', formData);
            setExpenses([res.data, ...expenses]);
            setShowModal(false);
            setFormData({ description: '', amount: '', currency: 'HTG', budgetId: '', category: '', date: new Date().toISOString().split('T')[0], bankAccountId: '' });

            // Refresh budgets to update the "spent" amount
            const budRes = await api.get('/budgets');
            setBudgets(budRes.data);
        } catch (err) {
            console.error("Error creating expense", err);
            setError(err.response?.data?.message || t('error_saving_expense', "Erreur lors de l'enregistrement de la dépense"));
        }
    };

    // Merge balances with default currencies to ensure visibility
    const baseCurrencies = ['HTG', 'USD', 'EUR'];
    const mergedBalances = baseCurrencies.map(code => {
        const found = balances.find(b => b.code === code);
        return found ? found : { code, balance: 0 };
    });
    // Add any other currencies found in balances that are not in baseCurrencies
    balances.forEach(b => {
        if (!baseCurrencies.includes(b.code)) {
            mergedBalances.push(b);
        }
    });

    const selectedBudget = budgets.find(b => b.id === parseInt(formData.budgetId));
    const remainingInBudget = selectedBudget ? parseFloat(selectedBudget.amount) - (selectedBudget.spent || 0) : 0;

    const handleBudgetChange = (e) => {
        const bId = e.target.value;
        const budget = budgets.find(b => b.id === parseInt(bId));
        if (budget) {
            setFormData({ ...formData, budgetId: bId, currency: budget.currency });
        } else {
            setFormData({ ...formData, budgetId: bId });
        }
    };

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-8 pb-12 transition-colors">
                {/* Header Section */}
                <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-6 transition-colors px-8">
                    <div className="flex flex-col items-start gap-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight transition-colors">
                            {filterBudgetId ? `${t('report', 'Rapport')}: ${budgets.find(b => b.id === parseInt(filterBudgetId))?.name || t('budget')}` : t('expenses', 'Dépenses')}
                        </h1>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 mt-3 transition-colors">
                            {filterBudgetId ? t('budget_expenses_desc', "Liste des dépenses imputées à ce budget spécifique.") : t('expenses_desc', "Suivez les sorties d'argent et gérez vos coûts.")}
                        </p>
                        {filterBudgetId && (
                            <button
                                onClick={() => window.location.href = '/admin/finances/expenses'}
                                className="text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold mt-2 hover:underline transition-colors active:scale-95"
                            >
                                ← {t('view_all_expenses', 'Voir toutes les dépenses')}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-red-600 dark:bg-red-500 text-white px-8 py-4 rounded-xl font-semibold text-[13px] hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-lg active:scale-95"
                    >
                        + {t('new_expense', 'Enregistrer une Dépense')}
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors mx-8">
                    <table className="w-full text-left border-collapse transition-colors">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 transition-colors">
                                <th className="px-10 py-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('description')}</th>
                                <th className="px-10 py-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('budget')}</th>
                                <th className="px-10 py-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('amount')}</th>
                                <th className="px-10 py-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 leading-none">{t('date')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                            {loading ? (
                                <tr><td colSpan="4" className="px-10 py-20 text-center text-gray-400 dark:text-gray-600 font-medium italic transition-colors">{t('loading')}</td></tr>
                            ) : expenses.filter(e => !filterBudgetId || e.budgetId === parseInt(filterBudgetId)).length === 0 ? (
                                <tr><td colSpan="4" className="px-10 py-20 text-center text-gray-400 dark:text-gray-600 font-medium italic transition-colors">
                                    {filterBudgetId ? t('no_expenses_for_budget', 'Aucune dépense enregistrée sur ce budget.') : t('no_expenses_found', 'Aucune dépense trouvée.')}
                                </td></tr>
                            ) : (
                                expenses
                                    .filter(e => !filterBudgetId || e.budgetId === parseInt(filterBudgetId))
                                    .map(e => (
                                        <tr key={e.id} className="hover:bg-indigo-50/30 dark:hover:bg-white/5 transition-all group">
                                            <td className="px-10 py-6">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 transition-colors tracking-tight">{e.description}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-1 transition-colors">{e.category || t('no_category', 'Sans catégorie')}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-semibold uppercase tracking-tight transition-colors border border-transparent dark:border-white/5">
                                                    {e.budget?.name || t('out_of_budget', 'Hors Budget')}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-xl font-bold text-red-600 dark:text-red-400 tracking-tight transition-colors uppercase">
                                                    - {e.currency === 'HTG' ? 'G' : '$'} {parseFloat(e.amount).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-10 py-6 text-xs text-gray-500 dark:text-gray-400 font-semibold transition-colors">
                                                {new Date(e.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in transition-colors">
                        <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-scale-in flex flex-col max-h-[90vh] border border-gray-100 dark:border-white/10 transition-colors">
                            <div className="p-10 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0 transition-colors">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 tracking-tight leading-none transition-colors">{t('new_expense', 'Nouvelle Dépense')}</h2>
                                    <p className="text-gray-400 dark:text-gray-500 text-[11px] font-semibold uppercase tracking-tight mt-2 transition-colors">{t('new_expense_desc', "Enregistrement d'une sortie de fonds")}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400 dark:text-gray-500 active:scale-95">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden transition-colors">
                                <div className="p-10 space-y-6 overflow-y-auto noscrollbar flex-1 transition-colors bg-white dark:bg-[#1A1A1A]">
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-6 py-4 rounded-xl text-sm font-semibold animate-shake transition-colors">
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    {selectedBudget && (
                                        <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-50 dark:border-red-900/20 transition-colors">
                                            <div className="flex justify-between items-center transition-colors">
                                                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-tight transition-colors">{t('available_in_budget', 'Disponible dans ce budget')}</span>
                                                <span className={`text-sm font-bold transition-colors ${parseFloat(formData.amount) > remainingInBudget ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {selectedBudget.currency} {remainingInBudget.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="mt-4 w-full h-1.5 bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden transition-colors">
                                                <div
                                                    className="h-full bg-red-500 dark:bg-red-600 transition-all duration-500"
                                                    style={{ width: `${Math.max(0, Math.min(100, (parseFloat(formData.amount || 0) / (remainingInBudget || 1)) * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('expense_reason_label', 'Motif de la dépense')}</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder={t('expense_reason_placeholder', 'Ex: Facture électricité, Achat chaises...')}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 transition-colors">
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('amount')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-bold text-red-600 dark:text-red-400 outline-none"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('currency')}</label>
                                            <select
                                                disabled={!!formData.budgetId}
                                                className="w-full bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-semibold opacity-70 text-gray-900 dark:text-white outline-none"
                                                value={formData.currency}
                                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                            >
                                                {['HTG', 'USD', 'EUR'].map(code => (
                                                    <option key={code} value={code} className="dark:bg-[#1A1A1A]">{code}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('impute_to_budget', 'Imputer au budget')}</label>
                                        <select
                                            required
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-semibold text-gray-900 dark:text-white outline-none"
                                            value={formData.budgetId}
                                            onChange={handleBudgetChange}
                                        >
                                            <option value="" className="dark:bg-[#1A1A1A] text-gray-500 italic">-- {t('select_budget', 'Sélectionner un budget')} --</option>
                                            {budgets
                                                .filter(b => b.status !== 'inactif' || b.id === parseInt(formData.budgetId))
                                                .map(b => (
                                                    <option key={b.id} value={b.id} className="dark:bg-[#1A1A1A]">
                                                        {b.name} [{b.status}] ({b.currency} {parseFloat(b.amount - (b.spent || 0)).toLocaleString()} {t('remaining')})
                                                    </option>
                                                ))}
                                        </select>
                                        {selectedBudget && (
                                            <p className="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 transition-colors">
                                                ℹ️ {t('funds_deduction_notice', 'Les fonds seront déduits du compte source du budget.')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 transition-colors">
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('category')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('category_placeholder', 'Ex: Administration, Social...')}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight mb-2.5 block transition-colors">{t('date')}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 transition-all font-semibold text-gray-900 dark:text-white [color-scheme:dark] outline-none"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 shrink-0 transition-colors">
                                    {parseFloat(formData.amount) > remainingInBudget && (
                                        <div className="mb-6 text-center animate-shake">
                                            <span className="text-red-600 dark:text-red-500 font-semibold text-[11px] uppercase tracking-tight bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full border border-red-100 dark:border-red-900/30">
                                                ⚠️ {t('budget_exceeded_error', 'Le montant dépasse le budget. Action impossible.')}
                                            </span>
                                        </div>
                                    )}
                                    <button className="w-full bg-red-600 dark:bg-red-500 text-white font-semibold text-[13px] uppercase tracking-wide py-5 rounded-2xl hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={parseFloat(formData.amount) > remainingInBudget}
                                        type="submit"
                                    >
                                        {t('validate_expense_btn', 'Valider la Dépense')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
