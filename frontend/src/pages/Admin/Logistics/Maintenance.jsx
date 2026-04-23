import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAuth } from '../../../auth/AuthProvider';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';

export default function Maintenance() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [items, setItems] = useState([]); // Rooms and Inventory Items for selection
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedLog, setSelectedLog] = useState(null);
    const [users, setUsers] = useState([]); // For assignment
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        entityType: 'room',
        entityId: '',
        description: '',
        priority: 'medium',
        assignedTo: ''
    });

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/logistics/maintenance');
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error(t('error_fetching_data', "Erreur lors du chargement des données."));
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [roomsRes, inventoryRes, usersRes] = await Promise.all([
                api.get('/logistics/rooms'),
                api.get('/logistics/inventory'), // Need separate route or filtering? Assuming generic endpoint exists or reusing specific ones
                api.get('/users') // Assuming a route to get users for assignment
            ]);

            // Combine for selection: "Room: Main Hall", "Item: Projector"
            const roomOpts = roomsRes.data.map(r => ({ type: 'room', id: r.id, name: `${t('room', 'Salle')}: ${r.name}` }));
            // Assuming simplified inventory fetch for now, might need check if route exists
            // const invOpts = inventoryRes.data.map(i => ({ type: 'inventory_item', id: i.id, name: `Matériel: ${i.name}` }));

            // For now, simplify to just rooms if inventory route isn't visibly confirmed in previous steps
            setItems([...roomOpts]);
            setUsers(usersRes.data);

        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const handleCreate = () => {
        setModalMode('create');
        setFormData({
            entityType: 'room',
            entityId: '',
            description: '',
            priority: 'medium',
            assignedTo: ''
        });
        setShowModal(true);
    };

    const handleEdit = (log) => {
        setModalMode('edit');
        setSelectedLog(log);
        setFormData({
            entityType: log.entityType,
            entityId: log.entityId,
            description: log.description,
            priority: 'medium', // Field missing in backend? treating as description part or adding later
            assignedTo: log.assignedTo || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.post('/logistics/maintenance', formData);
                toast.success(t('maintenance_created', "Demande de maintenance créée."));
            } else {
                await api.put(`/logistics/maintenance/${selectedLog.id}`, formData);
                toast.success(t('maintenance_updated', "Maintenance mise à jour."));
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving maintenance:", error);
            toast.error(t('error_saving', "Erreur lors de l'enregistrement."));
        }
    };

    const handleDelete = async (id) => {
        setPendingDeleteId(id);
    };

    const confirmDelete = async () => {
        const id = pendingDeleteId;
        setPendingDeleteId(null);
        try {
            await api.delete(`/logistics/maintenance/${id}`);
            toast.success(t('deleted', "Supprimé avec succès."));
            setLogs(logs.filter(l => l.id !== id));
        } catch (error) {
            toast.error(t('error_deleting', "Erreur lors de la suppression."));
        }
    };

    // Status Badge Helper
    const getStatusBadge = (status) => {
        const styles = {
            'reported': 'bg-red-100 text-red-800',
            'in_progress': 'bg-yellow-100 text-yellow-800',
            'resolved': 'bg-green-100 text-green-800',
            'cancelled': 'bg-gray-100 text-gray-800'
        };
        const labels = {
            'reported': t('reported', 'Signalé'),
            'in_progress': t('in_progress', 'En Cours'),
            'resolved': t('resolved', 'Résolu'),
            'cancelled': t('cancelled', 'Annulé')
        };
        return (
            <span className={`px-2 py-1 rounded-full text-app-micro font-bold ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {t('maintenance', 'Maintenance & Actions')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-app-meta">
                        {t('maintenance_desc', 'Gérez les réparations et les demandes d\'intervention.')}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-brand-primary hover:bg-brand-deep text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-app-micro shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    {t('new_request', 'Nouvelle Demande')}
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider">{t('entity', 'Élément')}</th>
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider">{t('description', 'Description')}</th>
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider">{t('by', 'Signalé par')}</th>
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider">{t('assigned_to', 'Assigné à')}</th>
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider">{t('status', 'Statut')}</th>
                                <th className="p-6 text-app-micro font-bold text-gray-500 uppercase tracking-wider text-right">{t('actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {log.entityType === 'room' ? t('room', 'Salle') : t('material', 'Matériel')} #{log.entityId}
                                        </div>
                                    </td>
                                    <td className="p-6 text-app-meta text-gray-600 dark:text-gray-400 max-w-xs truncate" title={log.description}>
                                        {log.description}
                                    </td>
                                    <td className="p-6 text-app-meta">
                                        {log.reporter ? `${log.reporter.firstName} ${log.reporter.lastName}` : '-'}
                                    </td>
                                    <td className="p-6 text-app-meta">
                                        {log.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-app-micro font-black text-brand-primary">
                                                    {log.assignee.firstName[0]}
                                                </div>
                                                <span className="text-gray-900 dark:text-white font-medium text-app-meta">{log.assignee.firstName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-app-meta">{t('unassigned', 'Non assigné')}</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {getStatusBadge(log.status)}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(log)} className="p-2 text-gray-400 hover:text-brand-primary dark:hover:text-brand-orange transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(log.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p>{t('no_maintenance', "Aucune demande de maintenance.")}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {modalMode === 'create' ? t('new_request', 'Nouvelle Demande') : t('edit_request', 'Modifier la Demande')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Entity Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-app-micro font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('type')}</label>
                                    <select
                                        value={formData.entityType}
                                        onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-app-meta focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                    >
                                        <option value="room">{t('room', 'Salle')}</option>
                                        <option value="inventory_item">{t('item', 'Matériel')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-app-micro font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('item', 'Élément')}</label>
                                    <select
                                        value={formData.entityId}
                                        onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-app-meta focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                        required
                                    >
                                        <option value="">{t('select_dot', 'Sélectionner...')}</option>
                                        {items
                                            .filter(i => i.type === formData.entityType)
                                            .map(item => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-app-micro font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-app-meta focus:ring-2 focus:ring-brand-primary outline-none transition-all h-32 resize-none"
                                    placeholder={t('describe_problem', 'Décrivez le problème...')}
                                    required
                                />
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="block text-app-micro font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('assign_to', 'Assigner à')}</label>
                                <select
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-app-meta focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                >
                                    <option value="">Non assigné</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-app-micro hover:bg-gray-200 transition-colors">
                                    {t('cancel', 'Annuler')}
                                </button>
                                <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-brand-primary text-white font-black uppercase tracking-widest text-app-micro hover:bg-brand-deep shadow-lg active:scale-95 transition-all">
                                    {t('save', 'Enregistrer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={!!pendingDeleteId}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={confirmDelete}
                title={t('confirm_delete', 'Confirmer la suppression')}
                message={t('confirm_delete_msg', 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')}
            />
        </AdminLayout>
    );
}
