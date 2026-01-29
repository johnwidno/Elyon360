import { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function Inventory() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        category: '',
        location: '',
        status: 'bon_etat'
    });

    const fetchItems = async () => {
        try {
            const res = await api.get('/inventory');
            setItems(res.data);
        } catch (error) {
            console.error("Erreur chargement inventaire:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/inventory/${editId}`, formData);
                setAlertMessage({ show: true, title: t('success'), message: t('item_updated_success'), type: 'success' });
            } else {
                await api.post('/inventory', formData);
                setAlertMessage({ show: true, title: t('success'), message: t('item_added_success'), type: 'success' });
            }
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', description: '', quantity: 0, category: '', location: '', status: 'bon_etat' });
            fetchItems();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('save_error'), type: 'error' });
        }
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            category: item.category,
            location: item.location,
            status: item.status
        });
        setEditId(item.id);
        setShowModal(true);
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/inventory/${deleteId}`);
            setAlertMessage({ show: true, title: t('success'), message: t('item_deleted_success'), type: 'success' });
            fetchItems();
        } catch (error) {
            setAlertMessage({ show: true, title: t('error'), message: t('delete_error'), type: 'error' });
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <AdminLayout>
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-12 bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in gap-8 transition-colors">
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-50 dark:bg-black p-5 rounded-2xl transition-colors border border-indigo-100 dark:border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">{t('inventory_management')}</h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('inventory_desc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditId(null); setFormData({ name: '', description: '', quantity: 0, category: '', location: '', status: 'bon_etat' }); setShowModal(true); }}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    {t('add_item')}
                </button>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-colors noscrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="bg-gray-50/50 dark:bg-black/20 transition-colors">
                        <tr>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('name')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('category')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('quantity_short')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('location')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                            <th className="px-10 py-5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                        {loading ? (
                            <tr><td colSpan="6" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors animate-pulse">{t('loading')}</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="6" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors">{t('no_items_found')}</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group animate-slide-up">
                                    <td className="px-10 py-6 whitespace-nowrap text-[14px] font-semibold text-gray-900 dark:text-white transition-colors">{item.name}</td>
                                    <td className="px-10 py-6 whitespace-nowrap text-[12px] text-gray-500 uppercase font-medium">{item.category}</td>
                                    <td className="px-10 py-6 whitespace-nowrap text-[14px] text-gray-900 dark:text-white font-bold">{item.quantity}</td>
                                    <td className="px-10 py-6 whitespace-nowrap text-[12px] text-gray-500 dark:text-gray-400 font-medium transition-colors">{item.location}</td>
                                    <td className="px-10 py-6 whitespace-nowrap">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold border ${item.status === 'bon_etat' ? 'bg-green-50 dark:bg-green-900/10 text-green-600 border-green-100 dark:border-white/5' :
                                            item.status === 'reparer' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 border-amber-100 dark:border-white/5' : 'bg-red-50 dark:bg-red-900/10 text-red-600 border-red-100 dark:border-white/5'
                                            }`}>
                                            {t(`status_${item.status}`) || item.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-2.5 text-gray-400 hover:text-blue-600 transition-all bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl hover:scale-105 active:scale-95" title={t('edit')}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => confirmDelete(item.id)} className="p-2.5 text-gray-400 hover:text-red-500 transition-all bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl hover:scale-105 active:scale-95" title={t('delete')}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[150] overflow-y-auto noscrollbar">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-2xl transform transition-all sm:max-w-lg w-full z-10 border border-gray-100 dark:border-white/10 transition-colors">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white transition-colors">
                                    {editId ? t('edit_item') : t('new_item')}
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('item_name')}</label>
                                        <input type="text" name="name" placeholder={t('item_name_placeholder')} required onChange={handleChange} value={formData.name}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('category')}</label>
                                        <input type="text" name="category" placeholder={t('category_placeholder')} onChange={handleChange} value={formData.category}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('quantity')}</label>
                                            <input type="number" name="quantity" onChange={handleChange} value={formData.quantity}
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('status')}</label>
                                            <select name="status" onChange={handleChange} value={formData.status} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none">
                                                <option value="bon_etat">{t('status_bon_etat')}</option>
                                                <option value="reparer">{t('status_reparer')}</option>
                                                <option value="hors_service">{t('status_hors_service')}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('location')}</label>
                                        <input type="text" name="location" placeholder={t('location_placeholder')} onChange={handleChange} value={formData.location}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('description')}</label>
                                        <textarea name="description" placeholder={t('description_placeholder')} rows="3" onChange={handleChange} value={formData.description}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>
                                </div>
                                <div className="mt-10 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                                        {editId ? t('save') : t('add')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title={t('delete_item_title')}
                message={t('delete_item_confirm')}
            />

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
