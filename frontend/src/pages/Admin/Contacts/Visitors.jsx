import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';

export default function Visitors() {
    const { t, language } = useLanguage();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', notes: '' });

    useEffect(() => {
        const fetchVisitors = async () => {
            try {
                const res = await api.get('/visitors');
                setVisitors(res.data);
            } catch (err) {
                console.error("Error fetching visitors", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVisitors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/visitors', formData);
            setVisitors([...visitors, res.data]);
            setShowModal(false);
            setFormData({ fullName: '', email: '', phone: '', notes: '' });
        } catch (err) {
            console.error("Error creating visitor", err);
            // alert(t('error_creating_visitor', 'Erreur lors de la création du visiteur'));
        }
    };

    return (
        <AdminLayout>
            <div className="mb-12 flex flex-wrap md:flex-nowrap justify-between items-center bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in gap-8 transition-colors">
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-50 dark:bg-black p-4 rounded-2xl transition-colors border border-indigo-100 dark:border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors leading-none tracking-tight">{t('visitors')}</h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('visitors_desc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    {t('new_visitor')}
                </button>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors noscrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-white/5 transition-colors">
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500">{t('full_name')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500">{t('contact')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500">{t('status_integrated')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500">{t('date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                        {loading ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors animate-pulse">{t('loading')}</td></tr>
                        ) : visitors.length === 0 ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors">{t('no_visitors')}</td></tr>
                        ) : (
                            visitors.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group animate-slide-up cursor-pointer">
                                    <td className="px-10 py-6">
                                        <p className="font-semibold text-gray-900 dark:text-white text-[14px] leading-tight">{v.fullName}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{v.email || '—'}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-500 font-medium mt-1 transition-colors">{v.phone || '-'}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold border ${v.status === 'integrated' ? 'bg-green-50 dark:bg-green-900/10 text-green-600 border-green-100 dark:border-white/5' :
                                            v.status === 'contacted' ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 border-indigo-100 dark:border-white/5' : 'bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-600 border-gray-100 dark:border-white/5'
                                            }`}>
                                            {t(`status_${v.status}`) || v.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                        {new Date(v.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/10 transition-colors relative z-10">
                        <div className="p-10 border-b border-gray-100 dark:border-white/5 relative transition-colors">
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 w-10 h-10 rounded-xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-transparent dark:border-white/5 transition-all font-bold active:scale-95 shadow-sm">✕</button>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-none transition-colors">{t('new_visitor')}</h2>
                            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('visitor_info_desc')}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8 transition-colors">
                            <div>
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 mb-3 block transition-colors">{t('full_name')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all placeholder-gray-400"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 mb-3 block transition-colors">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all placeholder-gray-400"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 mb-3 block transition-colors">{t('phone')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all placeholder-gray-400"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 mb-3 block transition-colors">{t('notes')}</label>
                                <textarea
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-6 py-4 text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all h-32 resize-none noscrollbar placeholder-gray-400"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <button className="w-full bg-indigo-600 text-white font-semibold text-[13px] py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 transition-colors">
                                {t('save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
