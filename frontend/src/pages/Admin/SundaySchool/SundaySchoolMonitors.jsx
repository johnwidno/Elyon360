import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';
import SearchableSelect from '../../../components/SearchableSelect';
import { useLanguage } from '../../../context/LanguageContext';

export default function SundaySchoolMonitors() {
    const { t } = useLanguage();
    const [monitors, setMonitors] = useState([]);
    const [members, setMembers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const [form, setForm] = useState({
        userId: '',
        classId: '',
        role: 'monitor'
    });

    const fetchData = async () => {
        try {
            const [monRes, memRes, clsRes] = await Promise.all([
                api.get('/sunday-school/monitors'),
                api.get('/members'),
                api.get('/sunday-school/classes')
            ]);
            setMonitors(monRes.data);
            setMembers(memRes.data);
            setClasses(clsRes.data);
        } catch (error) {
            console.error("Fetch data error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/sunday-school/monitors', form);
            setAlertMessage({ show: true, title: t('success'), message: t('monitor_assigned_success', 'Moniteur assigné avec succès'), type: 'success' });
            setShowModal(false);
            fetchData();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('operation_error'), type: 'error' });
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sunday_school')} - {t('monitors', 'Moniteurs')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('monitors_management_desc', 'Gérez les moniteurs et les rôles du comité.')}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none font-bold text-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    {t('assign_monitor', 'Assigner un Moniteur')}
                </button>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-black/40 border-b border-gray-100 dark:border-white/5">
                            <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('name')}</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('role')}</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('class')}</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {loading ? (
                            <tr><td colSpan="4" className="px-8 py-10 text-center text-gray-500">{t('loading')}</td></tr>
                        ) : monitors.length === 0 ? (
                            <tr><td colSpan="4" className="px-8 py-10 text-center text-gray-500">{t('no_monitors_found', 'Aucun moniteur trouvé.')}</td></tr>
                        ) : (
                            monitors.map((mon) => (
                                <tr key={mon.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-900 dark:text-white leading-none whitespace-nowrap">{mon.user?.firstName} {mon.user?.lastName}</div>
                                        <div className="text-[11px] text-gray-400 mt-1.5 font-medium">{mon.user?.email}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">{t(mon.role)}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">{mon.class?.name || t('all', 'Toutes')}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button className="text-red-500 hover:text-red-700 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-12">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#0D0D0D] rounded-[3rem] overflow-hidden shadow-2xl transform transition-all sm:max-w-xl w-full z-10 border border-transparent dark:border-white/10">
                            <form onSubmit={handleSubmit} className="p-12">
                                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white tracking-tight">{t('assign_monitor')}</h3>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('member')}</label>
                                        <SearchableSelect
                                            options={members.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName} (${m.email})` }))}
                                            value={form.userId}
                                            onChange={val => setForm({ ...form, userId: val })}
                                            placeholder={t('choose_member')}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('role')}</label>
                                        <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50">
                                            <option value="monitor">{t('monitor', 'Moniteur')}</option>
                                            <option value="superintendent">{t('superintendent', 'Surintendant')}</option>
                                            <option value="assistant">{t('assistant')}</option>
                                            <option value="secretary">{t('secretary', 'Secrétaire')}</option>
                                            <option value="treasurer">{t('treasurer', 'Trésorier')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('class')}</label>
                                        <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-[15px] outline-none focus:border-indigo-500/50">
                                            <option value="">{t('all_classes', 'Toutes les classes')}</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 bg-gray-50 dark:bg-black border border-transparent dark:border-white/5 rounded-3xl text-[13px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="px-12 py-5 bg-indigo-600 text-white rounded-3xl text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95">
                                        {t('assign', 'Assigner')}
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
