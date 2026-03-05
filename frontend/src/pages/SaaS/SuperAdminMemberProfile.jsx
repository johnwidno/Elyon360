import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import AlertModal from '../../components/ChurchAlertModal';
import {
    ArrowLeft, Mail, Calendar, Shield, Key,
    User, Phone, MapPin, Church as ChurchIcon,
    ExternalLink, Facebook, Instagram, Twitter,
    ShieldCheck, Activity, Clock, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const SuperAdminMemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const isGodAdmin = currentUser?.role?.includes('super_admin');

    const roleLabels = {
        'super_admin': 'Super administrateur',
        'super_admin_secretaire': 'Super administrateur secrétaire',
        'superaduser': 'Super administrateur utilisateur'
    };

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const res = await api.get(`/saas/users/${id}`);
                setMember(res.data);
                const roleValue = Array.isArray(res.data.role) ? res.data.role[0] : (typeof res.data.role === 'string' && res.data.role.startsWith('[') ? JSON.parse(res.data.role)[0] : res.data.role);
                setNewRole(roleValue || 'superaduser');
            } catch (error) {
                console.error("Error fetching member details", error);
                setAlertMessage({ show: true, title: "Erreur", message: "Chargement impossible", type: "error" });
                setTimeout(() => navigate('/super-admin'), 2000);
            } finally {
                setLoading(false);
            }
        };
        fetchMember();
    }, [id, navigate]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    if (!member) return null;

    const handleUpdate = async (data) => {
        setSaving(true);
        try {
            await api.put(`/saas/users/${id}`, data);
            setMember({ ...member, ...data });
            setAlertMessage({ show: true, title: "Succès", message: "Action effectuée avec succès !", type: "success" });
            if (data.password) setShowPasswordModal(false);
        } catch (error) {
            setAlertMessage({ show: true, title: "Erreur", message: "Une erreur est survenue", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const safeRoleParse = (role) => {
        if (!role) return 'Membre';
        if (Array.isArray(role)) return role[0];
        try { return JSON.parse(role)[0]; } catch (e) { return String(role); }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 font-sans">
            {/* Topbar Navigation */}
            <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black tracking-tight dark:text-white">Profil utilisateur</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black rounded-lg">
                        ID : {String(member.id || '').slice(0, 8)}
                    </span>
                </div>
            </header>

            <main className="max-w-full mx-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-[#1e293b] rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden sticky top-28">
                            <div className="p-8 flex flex-col items-center">
                                <div className="w-44 h-44 bg-gray-50 dark:bg-[#0f172a] rounded-[48px] flex items-center justify-center border-4 border-gray-50 dark:border-gray-800 p-2 overflow-hidden">
                                    {member.photo ? (
                                        <img src={member.photo} alt="Profile" className="w-full h-full object-cover rounded-[36px]" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-600 rounded-[36px] flex items-center justify-center text-white text-6xl font-black">
                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                        </div>
                                    )}
                                </div>
                                <h1 className="mt-6 text-2xl font-black text-center dark:text-white">{member.firstName} {member.lastName}</h1>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">Utilisateur plateforme</p>
                            </div>

                            <div className="p-6 border-t border-gray-50 dark:border-gray-800 space-y-3">
                                <h4 className="text-[10px] font-bold text-gray-400 mb-4 px-2">Affiliation institutionnelle</h4>
                                <div className="p-4 bg-gray-50 dark:bg-[#0f172a]/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                                            {member.church?.name?.charAt(0)}
                                        </div>
                                        <p className="text-xs font-black dark:text-white">{member.church?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/super-admin/church/${member.church?.id}`)}
                                        className="w-full py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        Voir l'institution <ExternalLink size={10} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-50 dark:border-gray-800 space-y-2">
                                <SocialLink icon={<Facebook size={14} />} label="Facebook" />
                                <SocialLink icon={<Instagram size={14} />} label="Instagram" />
                                <SocialLink icon={<Twitter size={14} />} label="Twitter" />
                            </div>

                            <div className="p-6 bg-gray-50/50 dark:bg-[#0f172a]/20 border-t border-gray-50 dark:border-gray-800">
                                <button className="w-full py-4 bg-indigo-600 text-white rounded-3xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                                    Accepter modifications
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-9 space-y-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1e293b] rounded-[40px] shadow-xl border border-gray-100 dark:border-gray-800 p-10">

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-50 dark:border-gray-800">
                                <div>
                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tight mb-1">Identité & rôle</p>
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white">{member.firstName} {member.lastName}</h2>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg text-emerald-600 text-[10px] font-black">
                                            Statut : Actif
                                        </div>
                                        <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-amber-600 text-[10px] font-black">
                                            {roleLabels[safeRoleParse(member.role)] || safeRoleParse(member.role)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 py-10">
                                <DetailItem label="Adresse email" value={member.email} icon={<Mail size={14} />} />
                                <DetailItem label="Rôle système" value={safeRoleParse(member.role)} icon={<Shield size={14} />} />
                                <DetailItem label="Date d'inscription" value={new Date(member.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} icon={<Calendar size={14} />} />
                                <DetailItem label="Numéro de téléphone" value={member.phone || 'Non renseigné'} icon={<Phone size={14} />} />
                                <DetailItem label="Localisation" value={member.city || 'Non renseignée'} icon={<MapPin size={14} />} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-gray-50 dark:border-gray-800">
                                <section className="space-y-6">
                                    <h3 className="text-lg font-black dark:text-white">Sécurité du compte</h3>
                                    <div className="p-6 bg-gray-50/50 dark:bg-[#0f172a]/30 rounded-[32px] border border-gray-100 dark:border-gray-800 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black dark:text-white">Double authentification</p>
                                                <p className="text-[10px] text-gray-500 font-bold tracking-tight">Non activé par l'utilisateur</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300">
                                                <ShieldCheck size={16} />
                                            </div>
                                        </div>
                                        {isGodAdmin && (
                                            <button
                                                onClick={() => setShowPasswordModal(true)}
                                                className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Key size={14} /> Réinitialiser le mot de passe
                                            </button>
                                        )}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-lg font-black dark:text-white">Historique d'activité</h3>
                                    <div className="space-y-4">
                                        <ActivityLog icon={<Activity size={14} />} label="Dernière connexion" value="Il y a 2 heures" color="text-indigo-500" />
                                        <ActivityLog icon={<Clock size={14} />} label="Dernière modification" value="23/02/2026" color="text-amber-500" />
                                        <ActivityLog icon={<Info size={14} />} label="Total des sessions" value="48 sessions" color="text-emerald-500" />
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {showPasswordModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#1e293b] rounded-[40px] w-full max-w-md p-10 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 italic">Sécurisation compte</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Définissez un nouveau mot de passe sécurisé pour l'utilisateur.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 mb-3 block px-1">Nouveau mot de passe (SHA-256)</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0f172a] border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all">Annuler</button>
                                <button onClick={() => handleUpdate({ password: newPassword })} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">Valider</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

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

const DetailItem = ({ label, value, icon }) => (
    <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-gray-50 dark:bg-[#0f172a] rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-gray-100 dark:border-gray-800 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-black dark:text-white">{value}</p>
        </div>
    </div>
);

const SocialLink = ({ icon, label }) => (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-[#0f172a] text-gray-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                {icon}
            </div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{label}</span>
        </div>
        <ExternalLink size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
    </div>
);

const ActivityLog = ({ icon, label, value, color }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1e293b] border border-gray-50 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gray-50 dark:bg-[#0f172a] ${color}`}>
                {icon}
            </div>
            <p className="text-[11px] font-black dark:text-white">{label}</p>
        </div>
        <span className="text-xs font-bold text-gray-400">{value}</span>
    </div>
);

export default SuperAdminMemberProfile;
