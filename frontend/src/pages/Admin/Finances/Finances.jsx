import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { exportToExcel } from '../../../utils/exportUtils';

// Simple Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder = "Select..." }) => {
    const { t } = useLanguage();
    if (placeholder === "Select...") placeholder = t('select_member_placeholder');
    if (placeholder === "Sélectionner...") placeholder = t('select_member_placeholder');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative">
            <div
                className="w-full border border-gray-100 dark:border-white/5 rounded-xl p-2.5 bg-gray-50 dark:bg-white/5 cursor-pointer flex justify-between items-center text-[13px] font-medium transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-auto animate-scale-in transition-colors">
                    <div className="p-2 border-b border-gray-50 dark:border-white/5 sticky top-0 bg-white dark:bg-[#1A1A1A] z-10 transition-colors">
                        <input
                            type="text"
                            className="w-full border-gray-100 dark:border-white/5 rounded-lg p-2 text-[13px] focus:ring-1 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all font-medium"
                            placeholder={`${t('search')}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={`p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer text-[13px] transition-colors ${opt.value === value ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-gray-400 dark:text-gray-600 text-[13px] text-center italic">{t('no_results')}</div>
                    )}
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

const COLORS = ['#3F3FD1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F43F5E', '#14B8A6'];

export default function Finances() {
    const { t } = useLanguage();
    const [donations, setDonations] = useState([]);
    const [members, setMembers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [stats, setStats] = useState({});
    const [overviewData, setOverviewData] = useState([]);
    const [supportedCurrencies, setSupportedCurrencies] = useState(['HTG', 'USD']);
    const [donationTypes, setDonationTypes] = useState(['offrande', 'dime', 'don_special', 'promesse']);
    const [paymentMethods, setPaymentMethods] = useState(['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT']);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [fetchError, setFetchError] = useState(null);

    // Filter States
    const [filterMember, setFilterMember] = useState('');
    const [filterType, setFilterType] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [formData, setFormData] = useState({
        amount: '',
        currency: 'HTG',
        type: 'offrande',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        notes: '',
        userId: '',
        isDeposited: false,
        bankAccountId: '',
        depositDate: new Date().toISOString().split('T')[0],
        depositedById: ''
    });

    const formatValue = (val) => {
        if (!val) return '0';
        if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' B';
        if (val >= 1000000) return (val / 1000000).toFixed(1) + ' M';
        if (val >= 1000) return (val / 1000).toFixed(1) + ' K';
        return val.toLocaleString();
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setFetchError(null);

            // Fetch primary financial data
            try {
                const [donRes, statsRes, overviewRes, accRes] = await Promise.all([
                    api.get('/donations'),
                    api.get('/donations/stats'),
                    api.get('/donations/overview'),
                    api.get('/bank-accounts')
                ]);
                console.log("[Dashboard] Primary data fetched:", {
                    donations: donRes.data?.length,
                    statsCurrencies: Object.keys(statsRes.data || {}),
                    overviewItems: overviewRes.data?.length,
                    accounts: accRes.data?.length
                });

                setDonations(donRes.data || []);
                setStats(statsRes.data || {});
                setOverviewData(overviewRes.data || []);
                setBankAccounts(accRes.data || []);
            } catch (err) {
                console.error("Finance data fetch error:", err);
                setFetchError(t('error_loading_finances'));
            }

            // Fetch members list
            try {
                const memRes = await api.get('/members');
                setMembers(memRes.data || []);
            } catch (err) {
                console.error("Members fetch error:", err);
            }

            // Fetch church settings (may fail if user lacks permission)
            try {
                const churchRes = await api.get('/churches/settings');
                if (churchRes.data?.church) {
                    const church = churchRes.data.church;
                    if (church.supportedCurrencies?.length > 0) {
                        setSupportedCurrencies(church.supportedCurrencies);
                    }
                    if (church.donationTypes) setDonationTypes(church.donationTypes);
                    if (church.paymentMethods) setPaymentMethods(church.paymentMethods);
                }
            } catch (err) {
                console.warn("Settings fetch error (possibly missing permissions):", err);
            }

        } catch (error) {
            console.error("Global fetchData error:", error);
            setFetchError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Mock data for Area Chart (Sales Overview)
    // Real data for Area Chart
    const chartData = useMemo(() => overviewData, [overviewData]);

    // Distribution Data for ALL active currencies
    const distributionsByCurrency = useMemo(() => {
        const result = {};
        Object.keys(stats).forEach(curr => {
            const statsByCurr = stats[curr]?.byType || {};
            result[curr] = donationTypes.map(type => {
                const typeKey = (type || '').toLowerCase();
                return {
                    name: type,
                    value: statsByCurr[typeKey] || 0
                };
            });
        });
        return result;
    }, [stats, donationTypes]);

    const activeDonationCurrency = useMemo(() => {
        const availableCurrencies = Object.keys(stats);
        return stats['HTG'] ? 'HTG' : (availableCurrencies[0] || 'HTG');
    }, [stats]);

    const analysisInsight = useMemo(() => {
        const s = stats[activeDonationCurrency];
        if (!s) return { title: t('no_data_this_month'), isPositive: true };

        const isPositive = s.growth >= 0;
        return {
            title: isPositive
                ? t('positive_growth_insight')
                : t('negative_growth_insight'),
            isPositive,
            growth: s.growth
        };
    }, [stats, activeDonationCurrency]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/donations', { ...formData, userId: formData.userId || null });
            setAlertMessage({ show: true, title: t('success'), message: t('donation_registered_success'), type: 'success' });
            setShowModal(false);
            setFormData({
                amount: '', currency: supportedCurrencies[0] || 'HTG', type: 'offrande',
                date: new Date().toISOString().split('T')[0], paymentMethod: 'CASH', notes: '', userId: '',
                isDeposited: false, bankAccountId: ''
            });
            fetchData();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('registration_error'), type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleExport = () => {
        const exportData = filteredDonations.map(d => ({
            Date: new Date(d.date).toLocaleDateString(),
            Membre: d.member ? `${d.member.firstName} ${d.member.lastName}` : 'Anonyme',
            Montant: d.amount,
            Devise: d.currency,
            Type: d.type,
            'Mode de paiement': d.paymentMethod,
            Statut: 'Confirmé'
        }));
        exportToExcel('Transactions_Financieres', exportData);
    };

    const memberOptions = useMemo(() => [
        { value: '', label: t('anonymous_non_member') },
        ...members.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName} ${m.memberCode ? `(${m.memberCode})` : ''}` }))
    ], [members, t]);

    const filteredDonations = useMemo(() => {
        return donations.filter(d => {
            const name = d.member ? `${d.member.firstName} ${d.member.lastName}` : 'anonyme';
            const code = d.member?.memberCode || '';
            const matchMember = filterMember ? (name.toLowerCase().includes(filterMember.toLowerCase()) || code.toLowerCase().includes(filterMember.toLowerCase())) : true;
            const matchType = filterType ? d.type === filterType : true;
            const dDate = new Date(d.date);
            const matchStart = dateRange.start ? dDate >= new Date(dateRange.start) : true;
            const matchEnd = dateRange.end ? dDate <= new Date(dateRange.end) : true;
            return matchMember && matchType && matchStart && matchEnd;
        });
    }, [donations, filterMember, filterType, dateRange]);

    return (
        <AdminLayout>
            <div className="animate-fade-in space-y-8 pb-12 transition-colors">
                {/* Header Section */}
                <div className="flex flex-wrap items-end justify-between gap-6 pb-2 px-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{t('finances_revenue')}</h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 transition-colors uppercase italic hidden">{t('finances_revenue')}</p>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('finances_description')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl text-[14px] font-bold border border-gray-100 dark:border-white/5 shadow-sm transition-all flex items-center gap-2"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {t('refresh')}
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <span>+</span> {t('new_donation')}
                        </button>
                    </div>
                </div>

                {fetchError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-bold animate-shake">
                        {fetchError}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8">
                    {Object.entries(stats).map(([curr, s], idx) => (
                        <div key={curr} className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2.5 rounded-xl transition-colors ${curr === 'HTG' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${s.growth >= 0 ? 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                    {s.growth >= 0 ? '+' : ''}{s.growth?.toFixed(1)}% {s.growth >= 0 ? '↑' : '↓'}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-between pl-1">
                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 transition-colors">{t('total_revenue')} ({curr})</p>
                                <div className="space-y-1">
                                    <h3 className="text-[28px] font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">
                                        {curr} {(s.total || 0).toLocaleString()}
                                    </h3>
                                    <div className="pt-2">
                                        <p className="inline-flex items-center px-2 py-1 bg-gray-50 dark:bg-white/5 rounded-lg text-[12px] text-gray-400 dark:text-gray-500 font-bold border border-gray-100/50 dark:border-white/5 transition-colors">
                                            + {(s.currentMonthTotal || 0).toLocaleString()} {t('this_month_short')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-6 opacity-3 dark:opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <svg className="w-20 h-20 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    ))}
                    <div className={`${analysisInsight.isPositive ? 'bg-indigo-600' : 'bg-red-600'} dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-sm text-white relative overflow-hidden group animate-slide-up transition-colors duration-500 border border-transparent dark:border-white/5`} style={{ animationDelay: '0.2s' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-white/10 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            {analysisInsight.growth !== undefined && (
                                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">
                                    {analysisInsight.growth >= 0 ? '+' : ''}{analysisInsight.growth.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-white/60 mb-1 leading-none">{t('monthly_analysis')}</p>
                            <h3 className="text-[17px] font-bold tracking-tight mb-3 leading-snug">
                                {analysisInsight.title}
                            </h3>
                            <button
                                onClick={() => setShowAnalysisModal(true)}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all"
                            >
                                {t('view_details')}
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Analysis Modal */}
                {showAnalysisModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in transition-colors">
                        <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalysisModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scale-up flex flex-col max-h-[90vh] border border-gray-100 dark:border-white/10 transition-colors">
                            <div className="p-10 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0 transition-colors">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{t('performance_details')}</h2>
                                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2 transition-colors">{t('monthly_comparison')}</p>
                                </div>
                                <button onClick={() => setShowAnalysisModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto noscrollbar flex-1 bg-white dark:bg-[#1A1A1A] transition-colors">
                                {Object.entries(stats).map(([curr, s]) => (
                                    <div key={curr} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors">{curr}</span>
                                                <h4 className="text-[18px] font-bold text-gray-900 dark:text-white transition-colors">{s.growth >= 0 ? t('growth') : t('decline')} de {Math.abs(s.growth || 0).toFixed(1)}%</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-bold text-gray-900 dark:text-white transition-colors">{curr} {s.currentMonthTotal?.toLocaleString()}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap transition-colors">{t('vs_last_month')}: {curr} {s.previousMonthTotal?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="h-2 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden flex transition-colors">
                                            {s.growth >= 0 ? (
                                                <>
                                                    <div className="h-full bg-gray-200 dark:bg-white/10" style={{ width: '50%' }}></div>
                                                    <div className="h-full bg-green-500 dark:bg-green-600 animate-slide-right" style={{ width: `${Math.min(s.growth || 0, 50)}%` }}></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-full bg-red-500 dark:bg-red-600 animate-slide-left" style={{ width: `${Math.min(Math.abs(s.growth || 0), 50)}%` }}></div>
                                                    <div className="h-full bg-gray-200 dark:bg-white/10" style={{ width: '50%' }}></div>
                                                </>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl transition-colors">
                                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 transition-colors">{t('current_month')}</p>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-white transition-colors">{curr} {s.currentMonthTotal?.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl transition-colors">
                                                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 transition-colors">{t('previous_month')}</p>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-white transition-colors">{curr} {s.previousMonthTotal?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 sm:p-8 bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5 flex justify-end shrink-0 transition-colors">
                                <button
                                    onClick={() => setShowAnalysisModal(false)}
                                    className="w-full sm:w-auto bg-gray-900 dark:bg-white/10 text-white dark:text-gray-300 px-8 py-3 rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-white/20 transition-all"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Area Chart - Overview */}
                    <div className="lg:col-span-3 bg-white dark:bg-[#1A1A1A] p-8 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm animate-slide-up transition-colors" style={{ animationDelay: '0.3s' }}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">{t('income_overview')}</h3>
                                <p className="text-gray-400 dark:text-gray-500 text-[13px] font-medium">{t('income_vs_expenses')}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-gray-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#3F3FD1]"></span> {t('income')}
                                </span>
                                <span className="flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-gray-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-100 dark:bg-indigo-900/40"></span> {t('expenses')}
                                </span>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3F3FD1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3F3FD1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/5" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--tw-bg-opacity)' }}
                                        itemStyle={{ color: '#3F3FD1' }}
                                        cursor={{ stroke: '#3F3FD1', strokeWidth: 1 }}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#3F3FD1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expenses" stroke="#BFDBFE" strokeWidth={2} fillOpacity={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Charts - Distribution for each currency */}
                    {Object.keys(distributionsByCurrency).map((curr, cIdx) => (
                        <div key={curr} className="bg-white dark:bg-[#1A1A1A] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm animate-slide-up transition-colors" style={{ animationDelay: `${0.4 + (cIdx * 0.1)}s` }}>
                            <div className="mb-4">
                                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">{t('distribution_by_type')}</h3>
                                <p className="text-gray-400 dark:text-gray-500 text-[11px] font-medium uppercase tracking-wider">{curr}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-center">
                                {/* Left: Donut Chart */}
                                <div className="h-[140px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={distributionsByCurrency[curr]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {distributionsByCurrency[curr].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatValue(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                        <span className={`font-bold text-gray-900 dark:text-white leading-none tracking-tight transition-colors ${stats[curr]?.total > 1000000 ? 'text-[10px]' : 'text-[14px]'}`}>
                                            {formatValue(stats[curr]?.total || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Compact Legend */}
                                <div className="space-y-1.5 border-l border-gray-50 dark:border-white/5 pl-4 py-1 transition-colors">
                                    {distributionsByCurrency[curr].map((item, idx) => (
                                        <div key={item.name} className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 truncate uppercase tracking-tight transition-colors">{item.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-900 dark:text-gray-200 pl-3 transition-colors">{formatValue(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-slide-up transition-colors" style={{ animationDelay: '0.5s' }}>
                    <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center flex-wrap gap-4 transition-colors">
                        <div>
                            <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">{t('recent_transactions')}</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-[13px] font-medium tracking-tight">{t('recent_transactions')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={`${t('member')}...`}
                                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-black/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all font-medium"
                                    value={filterMember}
                                    onChange={e => setFilterMember(e.target.value)}
                                />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <select
                                className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-[13px] font-bold text-gray-600 dark:text-gray-400 outline-none cursor-pointer transition-colors"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="" className="dark:bg-gray-900">{t('all')} {t('type')}s</option>
                                {donationTypes.map(t_str => <option key={t_str} value={t_str} className="capitalize dark:bg-gray-900">{t_str}</option>)}
                            </select>

                            <button
                                onClick={handleExport}
                                className="px-5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                                </svg>
                                {t('export')}
                            </button>

                            <div className="flex items-center gap-2 border-l border-gray-100 dark:border-white/5 pl-4 ml-1 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">Du</span>
                                    <input
                                        type="date"
                                        className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">Au</span>
                                    <input
                                        type="date"
                                        className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg text-[12px] font-semibold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto noscrollbar transition-colors bg-white dark:bg-[#1A1A1A]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F8F9FA]/50 dark:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5">
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">{t('date')}</th>
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">{t('member')}</th>
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">{t('amount')}</th>
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">{t('type')}</th>
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors leading-none">{t('payment_method')}</th>
                                    <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors text-right leading-none">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-400 dark:text-gray-600 font-medium italic">{t('loading')}</td></tr>
                                ) : filteredDonations.length === 0 ? (
                                    <tr><td colSpan="6" className="px-8 py-12 text-center text-gray-400 dark:text-gray-600 font-medium italic">{t('no_data')}</td></tr>
                                ) : (
                                    filteredDonations.map((donation, idx) => (
                                        <tr key={donation.id} className="hover:bg-indigo-50/40 dark:hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-5 text-[14px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap tracking-tight transition-colors">
                                                {new Date(donation.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-[12px] font-black text-indigo-600 dark:text-indigo-400 transition-colors">
                                                        {donation.member ? donation.member.firstName[0] : 'A'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-none mb-1 transition-colors">
                                                            {donation.member ? `${donation.member.firstName} ${donation.member.lastName}` : t('anonymous')}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold transition-colors">ID: #0{donation.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                                                    {donation.currency} {parseFloat(donation.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${donation.type === 'dime' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                                                    donation.type === 'offrande' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                                                        'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                    {donation.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight transition-colors">
                                                {donation.paymentMethod}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-[12px] transition-colors">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span>
                                                    {t('confirmed')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Redesigned Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in transition-colors">
                    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-in flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-transparent dark:border-white/5 transition-colors">
                        <div className="bg-white dark:bg-[#1A1A1A] p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 shrink-0 transition-colors">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-[20px] sm:text-[22px] font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{t('new_donation')}</h3>
                                    <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('donation_desc')}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden transition-colors">
                            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto noscrollbar flex-1 bg-white dark:bg-[#1A1A1A] transition-colors">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('amount')} <span className="text-red-500">*</span></label>
                                        <input type="number" name="amount" step="0.01" required onChange={handleChange} value={formData.amount}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-medium text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('currency')}</label>
                                        <select name="currency" onChange={handleChange} value={formData.currency} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none cursor-pointer transition-colors">
                                            {supportedCurrencies.map(c => <option key={c} value={c} className="bg-white dark:bg-gray-900">{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('member')}</label>
                                    <SearchableSelect
                                        options={memberOptions}
                                        value={formData.userId}
                                        onChange={(val) => setFormData({ ...formData, userId: val })}
                                        placeholder={t('select_member_placeholder')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('type')}</label>
                                        <select name="type" onChange={handleChange} value={formData.type} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none cursor-pointer capitalize transition-colors">
                                            {donationTypes.map(t => <option key={t} value={t} className="bg-white dark:bg-gray-900">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('payment_method')}</label>
                                        <select name="paymentMethod" onChange={handleChange} value={formData.paymentMethod} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none cursor-pointer capitalize transition-colors">
                                            {paymentMethods.map(m => <option key={m} value={m} className="bg-white dark:bg-gray-900">{m}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 transition-colors">
                                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                                        <input
                                            type="checkbox"
                                            name="isDeposited"
                                            checked={formData.isDeposited}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded-lg border-gray-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-900 transition-all cursor-pointer"
                                        />
                                        <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300 transition-colors">{t('deposited_on_account')}</span>
                                    </label>

                                    {formData.isDeposited && (
                                        <div className="space-y-4 animate-scale-up">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('bank_account')} <span className="text-red-500">*</span></label>
                                                <select
                                                    name="bankAccountId"
                                                    value={formData.bankAccountId}
                                                    onChange={handleChange}
                                                    required={formData.isDeposited}
                                                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none cursor-pointer transition-colors"
                                                >
                                                    <option value="" className="bg-white dark:bg-gray-900 text-gray-500 italic">{t('select_account_placeholder')}</option>
                                                    {bankAccounts
                                                        .filter(acc => acc.currency === formData.currency)
                                                        .map(acc => (
                                                            <option key={acc.id} value={acc.id} className="bg-white dark:bg-gray-900">
                                                                {acc.name} ({acc.bankName}) - {acc.currency}
                                                            </option>
                                                        ))}
                                                </select>
                                                {bankAccounts.filter(acc => acc.currency === formData.currency).length === 0 && (
                                                    <p className="text-[11px] text-red-500 dark:text-red-400 font-semibold mt-1">{t('no_account_found_currency')} {formData.currency}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('deposit_date_label')} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="date"
                                                    name="depositDate"
                                                    value={formData.depositDate}
                                                    onChange={handleChange}
                                                    required={formData.isDeposited}
                                                    className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none transition-colors [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('deposited_by')} <span className="text-red-500">*</span></label>
                                                <SearchableSelect
                                                    options={members.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName} ${m.memberCode ? `(${m.memberCode})` : ''}` }))}
                                                    value={formData.depositedById}
                                                    onChange={(val) => setFormData({ ...formData, depositedById: val })}
                                                    placeholder={t('select_member_placeholder')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('date')}</label>
                                    <input type="date" name="date" required onChange={handleChange} value={formData.date}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-semibold text-gray-900 dark:text-white outline-none transition-all [color-scheme:dark]" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 transition-colors uppercase leading-none">{t('note')}</label>
                                    <textarea name="notes" onChange={handleChange} value={formData.notes}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-50 dark:border-white/5 rounded-xl text-[14px] font-medium text-gray-900 dark:text-gray-200 outline-none h-24 resize-none transition-all placeholder-gray-400 dark:placeholder-gray-600" placeholder="..." />
                                </div>
                            </div>
                            <div className="p-6 sm:p-8 bg-gray-50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 shrink-0 transition-colors">
                                <button type="button" onClick={() => setShowModal(false)} className="hidden sm:block px-6 py-2.5 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold text-sm rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95">
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="w-full sm:w-auto px-10 py-3 bg-[#2D2D8A] text-white font-bold text-sm rounded-xl hover:bg-blue-900 shadow-lg active:scale-95 transition-all">
                                    {t('confirm_donation')}
                                </button>
                            </div>
                        </form>
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
