import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaCalendarAlt, FaClock } from 'react-icons/fa';
import AdminLayout from '../../../layouts/AdminLayout';
import AlertModal from '../../../components/ChurchAlertModal';
import { useLanguage } from '../../../context/LanguageContext';

const Reservations = () => {
    const { t } = useLanguage();
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list, add
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    // Form State
    const [form, setForm] = useState({
        title: '',
        roomId: '',
        startTime: '',
        endTime: '',
        type: 'Reunion',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [resRes, resRooms] = await Promise.all([
                axios.get('http://localhost:5000/api/logistics/reservations', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/logistics/rooms', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setReservations(resRes.data);
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
            // Assuming organizerId is the current user (handled in backend if not sent, or extract from token)
            // But good practice to send what we know. For now backend should handle it via req.user

            await axios.post('http://localhost:5000/api/logistics/reservations', form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForm({ title: '', roomId: '', startTime: '', endTime: '', type: 'Reunion', notes: '' });
            setView('list');
            fetchData();
        } catch (error) {
            setAlertMessage({
                show: true,
                title: 'Erreur',
                message: error.response?.data?.message || "Erreur lors de la réservation",
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

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {t('reservations', 'Planning')} <span className="text-brand-primary dark:text-brand-orange">& {t('bookings', 'Réservations')}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {t('reservations_desc', 'Gérez l\'occupation de vos salles et espaces.')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('add')}
                        className="px-6 py-3 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <FaPlus /> {t('new_reservation', 'Nouvelle Réservation')}
                    </button>
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            {t('cancel', 'Annuler')}
                        </button>
                    )}
                </div>
            </div>

            {view === 'add' && (
                <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm mb-8 animate-fade-in">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('book_room', 'Réserver une Salle')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('activity_title', "Titre de l'activité")}</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('room', 'Salle')}</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })} required>
                                <option value="">{t('choose_dot', 'Choisir...')}</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('start', 'Début')}</label>
                                <input type="datetime-local" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('end', 'Fin')}</label>
                                <input type="datetime-local" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('activity_type', "Type d'activité")}</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="Reunion">{t('meeting', 'Réunion')}</option>
                                <option value="Repetition">{t('rehearsal', 'Répétition')}</option>
                                <option value="Culte">{t('worship', 'Culte')}</option>
                                <option value="Formation">{t('training', 'Formation')}</option>
                                <option value="Autre">{t('other', 'Autre')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('notes', 'Notes')}</label>
                            <textarea className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all h-24 resize-none"
                                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-brand-primary hover:bg-brand-deep text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all active:scale-95">{t('confirm', 'Confirmer')}</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reservations.length === 0 ? (
                    <div className="col-span-3 text-center text-gray-400 italic py-20 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                        {t('no_reservation_found', 'Aucune réservation trouvée.')}
                    </div>
                ) : (
                    reservations.map(res => (
                        <div key={res.id} className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group relative border-l-4 border-l-brand-primary overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors">{res.title}</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-brand-primary/5 text-brand-primary dark:text-brand-orange px-2 py-1 rounded-lg">{res.type}</span>
                            </div>
                            <div className="space-y-3">
                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                                    <FaCalendarAlt className="text-brand-primary/40" /> {res.room?.name || 'Salle inconnue'}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm">
                                    <FaClock className="text-brand-primary/40" /> {formatDate(res.startTime)} - {formatDate(res.endTime)}
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-white/5 text-[11px] text-gray-400 uppercase tracking-widest font-bold">
                                {t('organized_by', 'Organisé par')}: <span className="text-gray-900 dark:text-white">{res.organizer?.firstName || t('unknown', 'Inconnu')}</span>
                            </div>
                        </div>
                    ))
                )}
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

export default Reservations;
