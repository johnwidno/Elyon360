import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const SuperAdminMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const res = await api.get(`/saas/users/${id}`);
                setMember(res.data);
            } catch (error) {
                console.error("Error fetching member details", error);
                alert("Erreur lors du chargement des détails du membre");
                navigate('/super-admin');
            } finally {
                setLoading(false);
            }
        };
        fetchMember();
    }, [id, navigate]);

    if (loading) return <div className="p-10 text-center text-gray-500">Chargement...</div>;
    if (!member) return null;

    const safeRoleParse = (role) => {
        if (!role) return 'Membre';
        try {
            const parsed = JSON.parse(role);
            return Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
            return role;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <span className="mr-2">←</span> Retour
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Top Banner Style */}
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-500"></div>

                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 flex items-end space-x-5 mb-6">
                            <div className="h-32 w-32 rounded-3xl bg-white dark:bg-gray-700 p-2 shadow-xl border-4 border-white dark:border-gray-800">
                                <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-5xl">
                                    👤
                                </div>
                            </div>
                            <div className="pb-2">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                    {member.firstName} {member.lastName}
                                </h1>
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-sm flex items-center">
                                    <span className="mr-2 text-lg">🛡️</span> {safeRoleParse(member.role)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Informations de Contact</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">📧</span>
                                            <span className="font-medium">{member.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                                            <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">📅</span>
                                            <span className="font-medium italic">Inscrit le {new Date(member.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Statut Compte</h3>
                                    <div className="inline-flex items-center px-4 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold uppercase">
                                        Compte Actif
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Église d'Appartenance</h3>
                                    <div className="flex items-start space-x-4">
                                        <div className="text-3xl">⛪</div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">
                                                {member.church?.name}
                                            </h4>
                                            <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3">
                                                {member.church?.subdomain}.elyonsys.com
                                            </p>
                                            <button
                                                onClick={() => navigate(`/super-admin/church/${member.church?.id}`)}
                                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all"
                                            >
                                                Voir le Profil de l'Église
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminMemberProfile;
