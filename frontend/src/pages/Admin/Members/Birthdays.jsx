import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import CommunicationModal from '../../../components/Admin/CommunicationModal';

// Icons
const MessageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

export default function Birthdays() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

    // Messaging State
    const [messageModal, setMessageModal] = useState({ isOpen: false, recipient: null, recipients: [], mode: 'individual' });

    // Period helper
    const calculatePeriodDates = (period) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let start = new Date(now);
        let end = new Date(now);

        switch (period) {
            case 'today':
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                end.setDate(diff + 6);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'next_month':
                start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                break;
            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'this_semester':
                const semester = now.getMonth() < 6 ? 0 : 1;
                start = new Date(now.getFullYear(), semester * 6, 1);
                end = new Date(now.getFullYear(), (semester + 1) * 6, 0);
                break;
            case 'fiscal_year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last_year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                break;
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const initialPeriod = calculatePeriodDates('this_week');

    const [filters, setFilters] = useState({
        search: '',
        period: 'this_week',
        startDate: initialPeriod.start,
        endDate: initialPeriod.end
    });

    const fetchBirthdays = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('query', filters.search);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await api.get(`/users/birthdays?${params.toString()}`);
            setBirthdays(res.data);
        } catch (error) {
            console.error("Error fetching birthdays:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBirthdays();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handlePeriodChange = (e) => {
        const period = e.target.value;
        const { start, end } = calculatePeriodDates(period);
        setFilters({ ...filters, period, startDate: start, endDate: end });
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const celebrantsToday = useMemo(() => {
        return birthdays.filter(b => b.celebrationDate.split('T')[0] === todayStr);
    }, [birthdays, todayStr]);

    const handleExportPDF = () => {
        const headers = [t('first_name'), t('last_name'), t('birth_date'), t('celebration_date'), t('age_turning'), t('phone'), t('email')];
        const data = birthdays.map(b => [
            b.firstName,
            b.lastName,
            new Date(b.birthDate).toLocaleDateString(),
            new Date(b.celebrationDate).toLocaleDateString() + ` (${b.dayOfWeek})`,
            b.ageTurning + ' ' + t('years'),
            b.phone || '-',
            b.email || '-'
        ]);
        exportToPDF(t('birthdays_report', 'Rapport Anniversaires'), headers, data);
    };

    const handleExportExcel = () => {
        const data = birthdays.map(b => ({
            [t('first_name')]: b.firstName,
            [t('last_name')]: b.lastName,
            [t('birth_date')]: new Date(b.birthDate).toLocaleDateString(),
            [t('celebration_date')]: new Date(b.celebrationDate).toLocaleDateString(),
            [t('day_of_week')]: b.dayOfWeek,
            [t('age_turning')]: b.ageTurning,
            [t('phone')]: b.phone,
            [t('email')]: b.email
        }));
        exportToExcel(t('birthdays_report', 'Rapport Anniversaires'), data);
    };

    return (
        <AdminLayout>
            <div className="bg-[#F4F7FE] dark:bg-[#0b1437] min-h-screen">
                {/* Modern Premium Header */}
                <div className="px-8 pt-8 pb-12">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div className="flex items-center gap-6 group">
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-4 bg-white dark:bg-[#111c44] text-[#2B3674] dark:text-white rounded-[20px] shadow-sm hover:shadow-xl hover:-translate-x-1 transition-all active:scale-95 border border-transparent hover:border-indigo-500/10"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div>
                                <h1 className="text-[34px] font-black text-[#2B3674] dark:text-white leading-none tracking-tight">
                                    {t('birthdays_management', 'Gestion des Anniversaires')}
                                </h1>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-widest rounded-lg border border-indigo-100 dark:border-white/5">
                                        🎂 {birthdays.length} {t('upcoming', 'à venir')}
                                    </span>
                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
                                        {t('birthdays_desc', 'Célébrez les membres de votre communauté.')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMessageModal({ isOpen: true, recipients: celebrantsToday, mode: 'bulk' })}
                                className="h-[56px] px-8 bg-indigo-600 text-white font-black text-[13px] tracking-widest rounded-[20px] shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
                                disabled={celebrantsToday.length === 0}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                {t('send_to_all_today', "Souhaiter à tous (Aujourd'hui)")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Premium Action Toolbar */}
                <div className="px-8 mb-10">
                    <div className="bg-white dark:bg-[#111c44] p-4 rounded-[30px] shadow-sm border border-transparent hover:border-indigo-500/10 transition-all flex flex-wrap items-center gap-4">
                        {/* Period Selector */}
                        <div className="relative group">
                            <select
                                className="pl-12 pr-10 py-3.5 bg-gray-50 dark:bg-black/20 rounded-2xl text-[13px] font-black text-[#2B3674] dark:text-white outline-none border-2 border-transparent focus:border-indigo-500/20 transition-all cursor-pointer appearance-none min-w-[200px]"
                                value={filters.period}
                                onChange={handlePeriodChange}
                            >
                                <option value="today">{t('today')}</option>
                                <option value="this_week">{t('this_week')}</option>
                                <option value="this_month">{t('this_month')}</option>
                                <option value="next_month">{t('next_month')}</option>
                                <option value="this_quarter">{t('this_quarter')}</option>
                                <option value="fiscal_year">{t('fiscal_year')}</option>
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[300px] group">
                            <input
                                type="text"
                                placeholder={t('search_members', 'Rechercher un membre...')}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-black/20 rounded-2xl text-sm font-bold text-[#2B3674] dark:text-white outline-none border-2 border-transparent focus:border-indigo-500/20 transition-all placeholder-gray-400"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>

                        {/* Date Range Group */}
                        <div className="flex items-center gap-3 bg-indigo-50/50 dark:bg-black/40 px-6 py-3 rounded-2xl border border-indigo-100 dark:border-white/5 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-400 tracking-widest">{t('from')}</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-xs font-black text-[#2B3674] dark:text-white outline-none min-w-[120px]"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, period: 'custom' })}
                                />
                            </div>
                            <div className="w-[1px] h-4 bg-indigo-200 dark:bg-white/10 mx-2"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-400 tracking-widest">{t('to')}</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-xs font-black text-[#2B3674] dark:text-white outline-none min-w-[120px]"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, period: 'custom' })}
                                />
                            </div>
                        </div>

                        {/* Export Group */}
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={handleExportExcel}
                                className="w-12 h-12 flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_excel')}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                title={t('export_pdf')}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="px-8 pb-32">
                    <div className="bg-white dark:bg-[#111c44] rounded-[40px] shadow-sm border border-transparent hover:border-indigo-500/10 transition-all overflow-hidden">
                        <div className="overflow-x-auto noscrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-black/20">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('member')}</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('birth_date')}</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('celebration')}</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('age')}</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('contact')}</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan="6" className="py-24 text-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div><p className="text-[11px] font-black text-gray-400 tracking-widest">{t('loading')}</p></div></td></tr>
                                    ) : birthdays.length === 0 ? (
                                        <tr><td colSpan="6" className="py-24 text-center font-black text-gray-400 dark:text-gray-600 text-xs tracking-[0.1em]">{t('no_birthdays_found')}</td></tr>
                                    ) : (
                                        birthdays.map((b, idx) => (
                                            <tr key={`${b.id}-${idx}`} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer">
                                                <td className="px-10 py-6" onClick={() => navigate(`/admin/members/${b.id}`)}>
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-indigo-600 font-black text-lg border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-all group-hover:scale-110 duration-500">
                                                            {b.photo ? <img src={b.photo} className="w-full h-full object-cover" alt="" /> : b.firstName?.[0] + b.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-[#2B3674] dark:text-white text-base leading-none group-hover:text-indigo-600 transition-colors tracking-tight">{b.firstName} {b.lastName}</div>
                                                            <div className="text-[10px] text-gray-400 font-black tracking-widest mt-2">{t('member')}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-sm font-bold text-gray-700 dark:text-gray-300" onClick={() => navigate(`/admin/members/${b.id}`)}>
                                                    {new Date(b.birthDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-10 py-6" onClick={() => navigate(`/admin/members/${b.id}`)}>
                                                    <div className="text-sm font-black text-[#2B3674] dark:text-white">{new Date(b.celebrationDate).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-indigo-500 font-black tracking-widest mt-1.5">{b.dayOfWeek}</div>
                                                </td>
                                                <td className="px-10 py-6" onClick={() => navigate(`/admin/members/${b.id}`)}>
                                                    <span className="px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-100 dark:border-white/5 shadow-sm tracking-widest">
                                                        {b.ageTurning} {t('years')}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6" onClick={() => navigate(`/admin/members/${b.id}`)}>
                                                    <div className="text-sm font-bold text-[#2B3674] dark:text-white underline decoration-indigo-500/20 underline-offset-4">{b.email || '-'}</div>
                                                    <div className="text-[11px] text-gray-400 font-black mt-1.5">{b.phone || '-'}</div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setMessageModal({ isOpen: true, recipient: b, mode: 'individual' }); }}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                            title={t('send_birthday_wish')}
                                                        >
                                                            <MessageIcon />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/members/${b.id}`); }}
                                                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-indigo-600 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-2xl transition-all hover:shadow-lg active:scale-90"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Modal */}
            <CommunicationModal
                isOpen={messageModal.isOpen}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                recipient={messageModal.recipient}
                recipients={messageModal.recipients}
                mode={messageModal.mode}
                defaultTitle={messageModal.mode === 'bulk' ? t('happy_birthday_all', "Joyeux Anniversaire à tous !") : t('happy_birthday', "Joyeux Anniversaire !")}
                defaultContent={t('birthday_message_template', "Bonjour {firstName}, toute la communauté vous souhaite un joyeux anniversaire !")}
            />
        </AdminLayout>
    );
}
