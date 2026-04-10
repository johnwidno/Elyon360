import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function Ceremonies() {
    const { t } = useLanguage();
    const [ceremonies, setCeremonies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const [formData, setFormData] = useState({
        title: '',
        type: 'autre',
        date: new Date().toISOString().split('T')[0],
        description: '',
        participants: ''
    });

    const fetchCeremonies = async () => {
        try {
            const res = await api.get('/ceremonies');
            setCeremonies(res.data);
        } catch (error) {
            console.error("Erreur chargement cérémonies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCeremonies();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/ceremonies', formData);
            setAlertMessage({ show: true, title: t('success'), message: t('ceremony_registered_success'), type: 'success' });
            setShowModal(false);
            setFormData({ title: '', type: 'autre', date: new Date().toISOString().split('T')[0], description: '', participants: '' });
            fetchCeremonies();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('registration_error'), type: 'error' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <AdminLayout>
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-12 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in gap-8 transition-colors">
                <div className="flex items-center gap-6">
                    <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-5 rounded-2xl transition-colors border border-brand-primary/10 dark:border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{t('ceremonies_management')}</h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('ceremonies_desc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand-primary text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-brand-deep transition-all shadow-lg shadow-brand-primary/20 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    {t('new_ceremony')}
                </button>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors noscrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-50/50 dark:bg-black/20 transition-colors">
                        <tr>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('ceremony')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('type')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('date')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('description')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                        {loading ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors animate-pulse">{t('loading')}</td></tr>
                        ) : ceremonies.length === 0 ? (
                            <tr><td colSpan="4" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors">{t('no_ceremonies_found')}</td></tr>
                        ) : (
                            ceremonies.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group animate-slide-up">
                                    <td className="px-10 py-6 whitespace-nowrap text-[14px] font-bold text-gray-900 dark:text-white transition-colors">{c.title}</td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <span className="px-3 py-1 bg-brand-primary/5 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-orange rounded-lg text-[10px] font-bold border border-brand-primary/10 dark:border-white/5 uppercase tracking-widest leading-none">
                                            {t(`ceremony_type_${c.type}`) || c.type}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap text-[13px] text-gray-600 dark:text-gray-400 font-medium">{new Date(c.date).toLocaleDateString()}</td>
                                    <td className="px-10 py-6 text-[13px] text-gray-500 dark:text-gray-500 italic max-w-md truncate">{c.description || t('no_description')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto noscrollbar transition-all">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl transform transition-all sm:max-w-xl w-full z-10 border border-gray-100 dark:border-white/10 transition-colors">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white transition-colors leading-none tracking-tight">{t('register_ceremony')}</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('ceremony_title')}</label>
                                        <input type="text" name="title" placeholder={t('ceremony_title_placeholder')} required onChange={handleChange} value={formData.title}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('type')}</label>
                                            <select name="type" onChange={handleChange} value={formData.type} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer appearance-none shadow-sm">
                                                <option value="bapteme">{t('ceremony_type_bapteme')}</option>
                                                <option value="mariage">{t('ceremony_type_mariage')}</option>
                                                <option value="sainte_cene">{t('ceremony_type_sainte_cene')}</option>
                                                <option value="autre">{t('ceremony_type_autre')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('date')}</label>
                                            <input type="date" name="date" required onChange={handleChange} value={formData.date}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm [color-scheme:light]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('description')}</label>
                                        <textarea name="description" placeholder={t('ceremony_desc_placeholder')} rows="4" onChange={handleChange} value={formData.description}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-sm resize-none"></textarea>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 outline-none">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="px-10 py-3 bg-brand-primary text-white rounded-xl text-[12px] font-bold hover:bg-brand-deep transition-all shadow-lg shadow-brand-primary/20 active:scale-95 outline-none">
                                        {t('register')}
                                    </button>
                                </div>
                            </form>
                        </div>
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
