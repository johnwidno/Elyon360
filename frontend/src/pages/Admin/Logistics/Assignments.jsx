import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useAuth } from '../../../auth/AuthProvider';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';

export default function Assignments() {
    const { t } = useLanguage();
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [assignmentData, setAssignmentData] = useState({ managerId: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [roomsRes, usersRes] = await Promise.all([
                api.get('/logistics/rooms'),
                api.get('/users')
            ]);
            setRooms(roomsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast.error(t('error_fetching', "Erreur chargement données"));
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = (room) => {
        setSelectedRoom(room);
        setAssignmentData({ managerId: room.managerId || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/logistics/rooms/${selectedRoom.id}`, { managerId: assignmentData.managerId });
            toast.success(t('assignment_updated', "Responsable mis à jour !"));
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error assigning manager:", error);
            toast.error(t('error_saving', "Erreur lors de l'enregistrement."));
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {t('assignments', 'Responsables & Affectations')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {t('assignments_desc', 'Gérez les responsables des salles et des équipements.')}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                            <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('room', 'Salle')}</th>
                            <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('capacity', 'Capacité')}</th>
                            <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('current_manager', 'Responsable Actuel')}</th>
                            <th className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {rooms.map(room => {
                            const manager = users.find(u => u.id === room.managerId);
                            return (
                                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-6 font-bold text-gray-900 dark:text-white">{room.name}</td>
                                    <td className="p-6 text-sm text-gray-500">{room.capacity} pers.</td>
                                    <td className="p-6">
                                        {manager ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {manager.firstName[0]}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {manager.firstName} {manager.lastName}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Non assigné</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => handleAssign(room)}
                                            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors"
                                        >
                                            {t('change', 'Changer')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assigner un Responsable</h3>
                            <p className="text-xs text-gray-500 mt-1">Pour la salle <span className="font-bold">{selectedRoom?.name}</span></p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Responsable</label>
                                <select
                                    value={assignmentData.managerId}
                                    onChange={(e) => setAssignmentData({ managerId: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Aucun Responsable --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold">Annuler</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
