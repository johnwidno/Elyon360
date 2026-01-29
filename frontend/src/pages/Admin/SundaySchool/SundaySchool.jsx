import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function SundaySchool() {
    const { t } = useLanguage();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClassModal, setShowClassModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const [classData, setClassData] = useState({
        name: '',
        description: '',
        ageGroup: '',
        teacherId: ''
    });

    const fetchClasses = async () => {
        try {
            const res = await api.get('/sunday-school/classes');
            setClasses(res.data);
        } catch (error) {
            console.error("Erreur chargement classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleClassSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sunday-school/classes', classData);
            setAlertMessage({ show: true, title: t('success'), message: t('class_created_success'), type: 'success' });
            setShowClassModal(false);
            setClassData({ name: '', description: '', ageGroup: '', teacherId: '' });
            fetchClasses();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('creation_error'), type: 'error' });
        }
    };

    const handleInputChange = (e) => {
        setClassData({ ...classData, [e.target.name]: e.target.value });
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">{t('sunday_school')}</h1>
                <button
                    onClick={() => setShowClassModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    {t('new_class')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">{t('loading')}</p>
                ) : classes.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 col-span-full">{t('no_classes_found')}</p>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="bg-white dark:bg-[#1A1A1A] p-6 rounded-lg shadow hover:shadow-md transition border border-gray-100 dark:border-white/5">
                            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-400 mb-2">{cls.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{cls.description || t('no_description')}</p>
                            <div className="flex justify-between items-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-500">
                                <span>{t('age_group')}: {cls.ageGroup || t('all')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for new class */}
            {showClassModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowClassModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-2xl transform transition-all sm:max-w-lg w-full z-10 border border-gray-100 dark:border-white/10">
                            <form onSubmit={handleClassSubmit} className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">{t('create_new_class')}</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('class_name')}</label>
                                        <input type="text" name="name" required onChange={handleInputChange} value={classData.name}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('age_group')}</label>
                                        <input type="text" name="ageGroup" placeholder="ex: 3-5 ans" onChange={handleInputChange} value={classData.ageGroup}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('description')}</label>
                                        <textarea name="description" rows="3" onChange={handleInputChange} value={classData.description}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowClassModal(false)} className="px-6 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all outline-none active:scale-95">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 outline-none">
                                        {t('create')}
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
