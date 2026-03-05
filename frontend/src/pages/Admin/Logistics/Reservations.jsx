import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaCalendarAlt, FaClock } from 'react-icons/fa';
import AlertModal from '../../../components/ChurchAlertModal';

const Reservations = () => {
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

    if (loading) return <div className="p-6">Chargement...</div>;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Réservations et Planning</h1>
                <div className="space-x-3">
                    <button
                        onClick={() => setView('add')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <FaPlus /> Nouvelle Réservation
                    </button>
                    {view !== 'list' && (
                        <button onClick={() => setView('list')} className="text-gray-600 underline">Annuler</button>
                    )}
                </div>
            </div>

            {view === 'add' && (
                <div className="bg-white p-6 rounded shadow mb-6 max-w-lg">
                    <h2 className="text-xl font-bold mb-4">Réserver une Salle</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Titre de l'activité</label>
                            <input type="text" className="w-full border p-2 rounded"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Salle</label>
                            <select className="w-full border p-2 rounded"
                                value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })} required>
                                <option value="">Choisir...</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4 mb-4">
                            <div className="w-1/2">
                                <label className="block text-gray-700 mb-2">Début</label>
                                <input type="datetime-local" className="w-full border p-2 rounded"
                                    value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-gray-700 mb-2">Fin</label>
                                <input type="datetime-local" className="w-full border p-2 rounded"
                                    value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Type d'activité</label>
                            <select className="w-full border p-2 rounded"
                                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="Reunion">Réunion</option>
                                <option value="Repetition">Répétition</option>
                                <option value="Culte">Culte</option>
                                <option value="Formation">Formation</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Notes</label>
                            <textarea className="w-full border p-2 rounded"
                                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Confirmer</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reservations.length === 0 ? (
                    <div className="col-span-3 text-center text-gray-500 py-10">Aucune réservation trouvée.</div>
                ) : (
                    reservations.map(res => (
                        <div key={res.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{res.title}</h3>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{res.type}</span>
                            </div>
                            <p className="text-gray-600 flex items-center gap-2 text-sm mb-2">
                                <FaCalendarAlt /> {res.room?.name || 'Salle inconnue'}
                            </p>
                            <p className="text-gray-500 flex items-center gap-2 text-sm">
                                <FaClock /> {formatDate(res.startTime)} - {formatDate(res.endTime)}
                            </p>
                            <div className="mt-3 text-sm text-gray-500">
                                Organisé par: <span className="font-medium">{res.organizer?.firstName || 'Inconnu'}</span>
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
        </div>
    );
};

export default Reservations;
