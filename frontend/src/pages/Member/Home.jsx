import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';

export default function MemberHome() {
    const { logout } = useAuth();
    const [donations, setDonations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });

    const fetchData = async () => {
        try {
            const [profRes, donRes, notifRes] = await Promise.all([
                api.get('/members/profile'),
                api.get('/donations/my'),
                api.get('/notifications')
            ]);
            setProfile(profRes.data);
            setDonations(donRes.data);
            setNotifications(notifRes.data);
            setFormData({
                firstName: profRes.data.firstName,
                lastName: profRes.data.lastName,
                email: profRes.data.email
            });
        } catch (error) {
            console.error("Erreur membre:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put('/members/profile', formData);
            setEditing(false);
            fetchData();
        } catch (error) {
            alert("Erreur lors de la mise à jour");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-indigo-900 text-white py-6 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Mon Espace - ElyonSys 360</h1>
                        <p className="text-indigo-200">Bienvenue, {profile?.firstName}</p>
                    </div>
                    <button onClick={logout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition text-sm font-semibold">
                        Déconnexion
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold mb-4">
                                {profile?.firstName[0]}
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{profile?.firstName} {profile?.lastName}</h2>
                            <p className="text-gray-500 text-sm mb-2">{profile?.email}</p>
                            {/* Dropdown Menu for Context Switch */}
                            <div className="relative mt-4 inline-block text-left w-full">
                                {(profile?.permissions && profile.permissions.length > 0) ? (
                                    <>
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                        >
                                            Changer d'Espace
                                            <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {showMenu && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                <div className="py-1">
                                                    <span className="block px-4 py-2 text-sm text-gray-700 font-bold border-b bg-gray-50 cursor-default">
                                                        Espace Membre (Actif)
                                                    </span>
                                                    <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900">
                                                        Accéder à Mon Espace de Travail
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full text-center py-2 bg-gray-100 rounded-md text-gray-500 font-medium text-sm">
                                        Statut : Membre
                                    </div>
                                )}
                            </div>
                        </div>

                        {editing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full border rounded p-2 text-sm" placeholder="Prénom" />
                                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full border rounded p-2 text-sm" placeholder="Nom" />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold">Enregistrer</button>
                                    <button type="button" onClick={() => setEditing(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm font-bold">Annuler</button>
                                </div>
                            </form>
                        ) : (
                            <button onClick={() => setEditing(true)} className="w-full border border-indigo-600 text-indigo-600 py-2 rounded text-sm font-bold hover:bg-indigo-50 transition">
                                Modifier Profil
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-8">
                    {/* Notifications Section */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                            {notifications.some(n => !n.isRead) && <span className="w-3 h-3 bg-red-500 rounded-full"></span>}
                        </div>
                        <div className="p-6">
                            {notifications.length === 0 ? (
                                <p className="text-gray-500 text-sm">Aucune notification.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {notifications.map(n => (
                                        <li key={n.id} className={`p-4 rounded-lg flex gap-4 ${n.isRead ? 'bg-gray-50' : 'bg-indigo-50 border-l-4 border-indigo-600'}`}>
                                            <div className="text-xl">🔔</div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                                                <p className="text-gray-600 text-xs mt-1">{n.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">{new Date(n.createdAt).toLocaleString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Donations Section */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Mon Historique de Dons</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Montant</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Méthode</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {donations.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">Aucun don enregistré.</td></tr>
                                    ) : (
                                        donations.map((d) => (
                                            <tr key={d.id}>
                                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(d.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">{d.type}</span></td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">${parseFloat(d.amount).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 uppercase">{d.paymentMethod}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}