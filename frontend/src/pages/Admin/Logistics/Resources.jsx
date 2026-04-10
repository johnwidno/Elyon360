import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../../layouts/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import AlertModal from '../../../components/ChurchAlertModal';

const Resources = () => {
    const { t } = useLanguage();
    const [resources, setResources] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list, add
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    // Form State
    const [form, setForm] = useState({
        name: '',
        categoryId: '',
        roomId: '',
        quantity: 0,
        quantity_available: 0,
        status: 'bon_etat'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [resResources, resRooms] = await Promise.all([
                axios.get('http://localhost:5000/api/inventory', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/logistics/rooms', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setResources(resResources.data);
            setRooms(resRooms.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Ensure quantity_available matches quantity initially if not specified
            const payload = { ...form, quantity_available: form.quantity };

            await axios.post('http://localhost:5000/api/inventory', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForm({ name: '', categoryId: '', roomId: '', quantity: 0, quantity_available: 0, status: 'bon_etat' });
            setView('list');
            fetchData();
        } catch (error) {
            setAlertMessage({
                show: true,
                title: t('error', 'Erreur'),
                message: error.response?.data?.message || t('error_creating', "Erreur lors de la création"),
                type: 'error'
            });
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('resources', 'Matériels')} <span className="text-brand-primary dark:text-brand-orange">& {t('inventory', 'Inventaire')}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {t('resources_desc', 'Suivez l\'état et la localisation de vos équipements.')}
                    </p>
                </div>
                <button onClick={() => setView('add')} className="px-6 py-3 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-lg active:scale-95">
                    + {t('add_item', 'Ajouter un article')}
                </button>
            </div>

            {view === 'add' && (
                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm mb-8 animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('add_material', 'Ajouter du Matériel')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('name', 'Nom')}</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('room_location', 'Salle / Emplacement')}</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })} required>
                                <option value="">{t('choose_dot', 'Choisir...')}</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building?.name})</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('quantity', 'Quantité')}</label>
                                <input type="number" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('status', 'État')}</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="bon_etat">{t('good_condition', 'Bon État')}</option>
                                    <option value="reparer">{t('to_repair', 'À Réparer')}</option>
                                    <option value="hors_service">{t('out_of_service', 'Hors Service')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="px-6 py-3 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all active:scale-95">{t('save', 'Enregistrer')}</button>
                            <button type="button" onClick={() => setView('list')} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{t('cancel', 'Annuler')}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('item_name', 'Nom')}</th>
                                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('location', 'Lieu')}</th>
                                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('quantity', 'Quantité')}</th>
                                <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('status', 'État')}</th>
                                <th className="pb-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {resources.length > 0 ? resources.map(item => (
                                <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-4 font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-orange transition-colors">{item.name}</td>
                                    <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {rooms.find(r => r.id === item.roomId)?.name || 'N/A'}
                                    </td>
                                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest 
                                            ${item.status === 'bon_etat' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                                                item.status === 'reparer' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                                                    'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                                            {item.status === 'bon_etat' ? t('good_condition', 'Bon état') : item.status === 'reparer' ? t('to_repair', 'À réparer') : t('out_of_service', 'Hors service')}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button className="text-gray-400 hover:text-brand-primary dark:hover:text-brand-orange transition-colors font-bold text-[11px] uppercase tracking-wider">{t('edit', 'Modifier')}</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-400 italic">{t('no_material_found', 'Aucun matériel trouvé.')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </AdminLayout>
    );
};

export default Resources;
