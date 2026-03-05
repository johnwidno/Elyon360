import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import AlertModal from '../../../components/ChurchAlertModal';
import { exportToExcel } from '../../../utils/exportUtils';

const CurrentTime = () => {
    const { language } = useLanguage();
    const [date, setDate] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5 whitespace-nowrap tracking-wider transition-all">
            {date.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })} • {date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
        </span>
    );
};

export default function Visitors() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [reviewForm, setReviewForm] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '', wantsMembership: false });
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', description: '', wantsMembership: false, notes: '' });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'former'
    const [showMoreNew, setShowMoreNew] = useState(false);
    const [showMoreFormer, setShowMoreFormer] = useState(false);

    const fetchVisitors = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await api.get(`/visitors?${params.toString()}`);
            setVisitors(res.data);
        } catch (err) {
            console.error("Error fetching visitors", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            fetchVisitors();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, startDate, endDate]);

    const handleSearch = () => {
        setLoading(true);
        fetchVisitors();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/visitors', formData);
            setVisitors([res.data, ...visitors]);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', description: '', wantsMembership: false, notes: '' });
            setAlertMessage({ show: true, title: t('success'), message: t('visitor_created', 'Visiteur créé avec succès'), type: 'success' });
        } catch (err) {
            console.error("Error creating visitor", err);
            setAlertMessage({ show: true, title: t('error'), message: t('error_creating_visitor', 'Erreur lors de la création du visiteur'), type: 'error' });
        }
    };

    const handleMarkAsViewed = (visitor) => {
        setSelectedVisitor(visitor);
        setReviewForm({
            firstName: visitor.firstName || '',
            lastName: visitor.lastName || '',
            email: visitor.email || '',
            phone: visitor.phone || '',
            notes: visitor.notes || '',
            wantsMembership: visitor.wantsMembership
        });
        setShowReviewModal(true);
    };

    const handleReviewSubmit = async () => {
        try {
            await api.put(`/visitors/${selectedVisitor.id}`, {
                firstName: reviewForm.firstName,
                lastName: reviewForm.lastName,
                email: reviewForm.email,
                phone: reviewForm.phone,
                notes: reviewForm.notes,
                wantsMembership: reviewForm.wantsMembership,
                viewStatus: 'viewed'
            });
            setShowReviewModal(false);
            setSelectedVisitor(null);
            fetchVisitors();
            setAlertMessage({ show: true, title: t('success'), message: t('visitor_reviewed', 'Visiteur revu avec succès'), type: 'success' });
        } catch (err) {
            console.error("Error reviewing visitor", err);
            setAlertMessage({ show: true, title: t('error'), message: t('error_updating_status'), type: 'error' });
        }
    };

    const handleConvertToMember = (visitor) => {
        navigate('/admin/members', {
            state: {
                prefillData: {
                    firstName: visitor.firstName,
                    lastName: visitor.lastName,
                    email: visitor.email,
                    phone: visitor.phone,
                    notes: visitor.notes || visitor.description
                },
                fromVisitor: true,
                visitorId: visitor.id
            }
        });
    };

    const handleExportToExcel = () => {
        const exportData = visitors.map(v => ({
            [t('first_name')]: v.firstName,
            [t('last_name')]: v.lastName,
            [t('email')]: v.email || '-',
            [t('phone')]: v.phone || '-',
            [t('description')]: v.description || '-',
            [t('wants_membership')]: v.wantsMembership ? t('yes') : t('no'),
            [t('view_status')]: t(v.viewStatus),
            [t('status_integrated')]: t(`status_${v.status}`),
            [t('date')]: new Date(v.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')
        }));
        exportToExcel('visiteurs', exportData);
    };

    const newVisitors = visitors.filter(v => v.viewStatus === 'not_viewed' || !v.viewStatus);
    const formerVisitors = visitors.filter(v => v.viewStatus === 'viewed');

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-premium animate-fade-in transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl transition-all border border-indigo-100/50 dark:border-white/5 group-hover:scale-105">
                            <svg className="h-8 w-8 text-stripe-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-[10px] font-black text-stripe-blue tracking-[0.1em]">
                                <span className="w-8 h-[2px] bg-stripe-blue"></span>
                                <span>{t('contacts', 'Contacts')}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors leading-none">
                                {t('visitors', 'Gestion des Visiteurs')}
                            </h1>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                                {t('visitors_desc', 'Suivez les nouvelles personnes qui visitent votre église.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-stripe-blue text-white px-8 py-3.5 rounded-2xl font-black text-[11px] tracking-widest shadow-premium hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            {t('new_visitor', 'Nouveau Visiteur')}
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-premium flex flex-wrap items-end gap-6 transition-all">
                    <div className="flex-1 min-w-[280px] space-y-2">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder={t('search_placeholder', 'Nom, email, téléphone...')}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-gray-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-stripe-blue transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="w-[200px] space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest ml-1">{t('from_date', 'Du')}</label>
                        <input type="date" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-none focus:border-stripe-blue transition-all shadow-stripe" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="w-[200px] space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest ml-1">{t('to_date', 'Au')}</label>
                        <input type="date" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-none focus:border-stripe-blue transition-all shadow-stripe" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>

                {/* Tab Selection & Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                    <div className="bg-white dark:bg-[#1A1A1A] p-1.5 rounded-3xl flex gap-1 border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`px-10 py-3 rounded-[1.25rem] text-[11px] font-black tracking-widest transition-all flex items-center gap-3 ${activeTab === 'new'
                                ? 'bg-stripe-blue text-white shadow-premium'
                                : 'text-gray-400 dark:text-gray-500 hover:text-stripe-blue dark:hover:text-stripe-purple'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activeTab === 'new' ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                            {t('new_visitors', 'Nouveaux')}
                            <span className="opacity-60">({newVisitors.length})</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('former')}
                            className={`px-10 py-3 rounded-[1.25rem] text-[11px] font-black tracking-widest transition-all flex items-center gap-3 ${activeTab === 'former'
                                ? 'bg-stripe-blue text-white shadow-premium'
                                : 'text-gray-400 dark:text-gray-500 hover:text-stripe-blue dark:hover:text-stripe-purple'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activeTab === 'former' ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                            {t('former_visitors', 'Anciens')}
                            <span className="opacity-60">({formerVisitors.length})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportToExcel}
                            className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-800/20 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
                            title={t('export_excel')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] shadow-premium border border-gray-100 dark:border-white/5 overflow-hidden transition-all">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)] noscrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-20 bg-white dark:bg-[#1A1A1A] transition-colors">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5">{t('visitor', 'Visiteur')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5">{t('contact')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5 text-center">{t('wants_membership', 'Intérêt')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5 text-center">{t('status')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5">{t('date')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest border-b border-gray-50 dark:border-white/5 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-10 py-32 text-center animate-pulse"><p className="text-[10px] font-black tracking-widest text-gray-300">{t('loading')}</p></td></tr>
                                ) : (activeTab === 'new' ? newVisitors : formerVisitors).length === 0 ? (
                                    <tr><td colSpan="6" className="px-10 py-32 text-center text-gray-300 font-black tracking-widest text-[10px] italic">{t('no_visitors', 'Aucun visiteur trouvé')}</td></tr>
                                ) : (activeTab === 'new' ? newVisitors : formerVisitors).map((v, index) => (
                                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-indigo-900/10 transition-all group animate-slide-up" style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center text-stripe-blue dark:text-stripe-purple font-black text-[11px] group-hover:scale-110 group-hover:bg-indigo-50 transition-all shadow-stripe">
                                                    {v.firstName?.[0]}{v.lastName?.[0]}
                                                </div>
                                                <div className="font-black text-gray-900 dark:text-white tracking-tight text-[14px]">{v.firstName} {v.lastName}</div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-[12px] font-black text-gray-900 dark:text-white tracking-tight">{v.email || '—'}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 opacity-60">{v.phone || '-'}</p>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest border border-transparent ${v.wantsMembership ? 'bg-indigo-50 dark:bg-indigo-900/30 text-stripe-blue' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                                                {v.wantsMembership ? t('yes') : t('no')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border border-transparent ${v.viewStatus === 'viewed' ? 'bg-purple-50 dark:bg-purple-900/30 text-stripe-purple' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                                                {t(v.viewStatus || 'not_viewed')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-[11px] text-gray-400 dark:text-gray-500 font-bold tracking-tight opacity-60">
                                            {new Date(v.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleMarkAsViewed(v)} className="p-3 bg-gray-50 dark:bg-black border border-transparent hover:border-indigo-100 dark:hover:border-white/5 text-gray-400 hover:text-stripe-purple rounded-xl transition-all transform active:scale-95 shadow-stripe" title={t('review_visitor')}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                                {!v.convertedToMemberId && v.status !== 'integrated' && (
                                                    <button onClick={() => handleConvertToMember(v)} className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-xl text-[10px] font-black tracking-widest hover:bg-emerald-600 hover:text-white transition-all transform active:scale-95 border border-transparent dark:border-emerald-800/20 shadow-stripe">{t('become_member', 'Convertir')}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals - All updated to match premium design */}
            {showModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/90 backdrop-blur-md transition-all">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-premium-hover w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/5 animate-scale-in">
                        <div className="p-10 border-b border-gray-50 dark:border-white/5 flex justify-between items-center shrink-0">
                            <div>
                                <div className="flex items-center space-x-2 text-[9px] font-black text-stripe-blue tracking-[0.1em] mb-1">
                                    <span className="w-6 h-[2.5px] bg-stripe-blue"></span>
                                    <span>{t('entry', 'Fiche d\'inscription')}</span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{t('new_visitor')}</h2>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">{t('visitor_info_desc', 'Ajoutez une nouvelle personne visitant l\'assemblée.')}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent dark:border-white/5 shadow-stripe">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto noscrollbar bg-white dark:bg-[#1A1A1A]">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('first_name')} <span className="text-rose-500">*</span></label>
                                    <input type="text" required className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all shadow-stripe" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('last_name')} <span className="text-rose-500">*</span></label>
                                    <input type="text" required className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all shadow-stripe" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('email')}</label>
                                    <input type="email" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-stripe focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('phone')}</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-stripe focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('description')}</label>
                                <textarea className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none h-24 resize-none noscrollbar shadow-stripe focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all" placeholder="..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-black p-5 rounded-2xl shadow-stripe border border-gray-100 dark:border-white/5 cursor-pointer group" onClick={() => setFormData({ ...formData, wantsMembership: !formData.wantsMembership })}>
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.wantsMembership ? 'bg-stripe-blue border-stripe-blue shadow-premium' : 'border-gray-200 dark:border-gray-800 dark:bg-white/5'}`}>
                                    {formData.wantsMembership && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="text-[12px] font-black text-gray-600 dark:text-gray-500 select-none tracking-tight">{t('wants_membership', 'Interessé par le membership')}</span>
                            </div>
                            <div className="space-y-3 py-4 border-t border-gray-50 dark:border-white/5">
                                <button className="w-full bg-stripe-blue text-white font-black text-[11px] tracking-widest py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-premium active:scale-95">{t('save', 'Enregistrer')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal - Updated */}
            {showReviewModal && selectedVisitor && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/90 backdrop-blur-md transition-all">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-premium-hover w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/5 animate-scale-in">
                        <div className="p-10 border-b border-gray-50 dark:border-white/5 shrink-0">
                            <div className="flex items-center space-x-2 text-[9px] font-black text-stripe-purple tracking-[0.1em] mb-1">
                                <span className="w-6 h-[2.5px] bg-stripe-purple"></span>
                                <span>{t('review', 'Suivi')}</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{t('review_visitor', 'Revue de visite')}</h2>
                            <p className="text-sm font-black text-stripe-blue mt-2 tracking-wide opacity-80">{selectedVisitor.firstName} {selectedVisitor.lastName}</p>
                        </div>
                        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto noscrollbar bg-white dark:bg-[#1A1A1A]">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('first_name')}</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none shadow-stripe" value={reviewForm.firstName} onChange={e => setReviewForm({ ...reviewForm, firstName: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('last_name')}</label>
                                    <input type="text" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none shadow-stripe" value={reviewForm.lastName} onChange={e => setReviewForm({ ...reviewForm, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest">{t('notes', 'Notes de suivi')}</label>
                                <textarea className="w-full bg-gray-50 dark:bg-[#0f172a] border border-transparent dark:border-gray-800 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 dark:text-white outline-none h-32 resize-none noscrollbar focus:ring-4 focus:ring-indigo-500/5 transition-all" value={reviewForm.notes} onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })} />
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 space-y-5">
                                <p className="text-[10px] font-black text-gray-400 tracking-widest text-center">{t('interest_question', 'Intérêt pour le membership?')}</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setReviewForm({ ...reviewForm, wantsMembership: true })} className={`flex-1 py-4 px-6 rounded-2xl font-black text-[11px] tracking-widest transition-all ${reviewForm.wantsMembership ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'}`}>{t('yes')}</button>
                                    <button onClick={() => setReviewForm({ ...reviewForm, wantsMembership: false })} className={`flex-1 py-4 px-6 rounded-2xl font-black text-[11px] tracking-widest transition-all ${!reviewForm.wantsMembership ? 'bg-gray-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'}`}>{t('no')}</button>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                <button onClick={handleReviewSubmit} className="flex-1 bg-indigo-600 text-white font-black text-[11px] tracking-widest py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/10 active:scale-95">{t('save_and_mark_viewed', 'Marquer comme Vu')}</button>
                                <button onClick={() => setShowReviewModal(false)} className="px-8 bg-white dark:bg-gray-800 text-gray-400 font-black text-[11px] tracking-widest py-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-all active:scale-95">{t('cancel')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={alertMessage.show}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
            />
        </AdminLayout>
    );
}
