import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AlertModal from '../../components/ChurchAlertModal';

export default function PublicActivityRegistration() {
    const { token } = useParams();
    const { t } = useLanguage();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [finished, setFinished] = useState(false);
    const [regMode, setRegMode] = useState('visitor'); // 'visitor' or 'member'
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    const [memberData, setMemberData] = useState({
        email: '',
        password: '',
        memberCode: ''
    });

    useEffect(() => {
        const isRegistered = localStorage.getItem(`reg_token_${token}`);
        if (isRegistered) {
            setFinished(true);
            setLoading(false);
        } else {
            fetchActivity();
        }
    }, [token]);

    const fetchActivity = async () => {
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseURL}/public/activities/${token}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Erreur');

            if (data.alreadyRegistered) {
                setFinished(true);
                localStorage.setItem(`reg_token_${token}`, 'true');
            } else {
                setActivity(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVisitorSubmit = async (e) => {
        e.preventDefault();
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseURL}/public/activities/${token}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Erreur');
            setSuccess(true);
        } catch (err) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: err.message, type: 'error' });
        }
    };

    const handleMemberSubmit = async (e) => {
        e.preventDefault();
        try {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseURL}/public/activities/${token}/register-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Erreur');
            setSuccess(true);
        } catch (err) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: err.message, type: 'error' });
        }
    };

    const handleOk = () => {
        localStorage.setItem(`reg_token_${token}`, 'true');
        setFinished(true);
        setSuccess(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-500">Chargement...</div>;

    if (finished) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
                <div className="text-indigo-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Déjà inscrit</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Vous avez déjà complété l'inscription pour cette activité. Ce lien n'est plus disponible pour vous.</p>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-100 dark:border-white/5 pt-4">ElyonSys 360</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
                <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lien invalide ou expiré</h2>
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
                <div className="text-green-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Inscription Réussie !</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Merci {formData.firstName}. Votre présence a bien été enregistrée pour l'évènement <strong>{activity?.name}</strong>.</p>
                <button
                    onClick={handleOk}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                    OK
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-8 text-white text-center">
                    <div className="flex flex-col gap-2 items-center mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Événement organisé par</h3>
                        <div className="flex flex-col gap-2">
                            {activity?.groupName && (
                                <h2 className="text-[14px] font-bold tracking-widest leading-none">
                                    le groupe {activity.groupName}
                                </h2>
                            )}
                            {activity?.churchName && (
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider opacity-90 leading-none">
                                    {activity.churchName}
                                </h4>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">{activity?.name}</h1>
                </div>

                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{activity?.description}</p>

                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="font-semibold">
                                    {activity?.date && new Date(activity.date).toLocaleDateString()}
                                    {activity?.endDate && activity.endDate !== activity.date && ` - ${new Date(activity.endDate).toLocaleDateString()}`}
                                </span>
                            </div>
                            {activity?.startTime && (
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="font-semibold">{activity.startTime}</span>
                                </div>
                            )}
                            {activity?.location && (
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>{activity.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reg Mode Tabs */}
                    <div className="flex p-1 bg-gray-50 dark:bg-black/40 rounded-2xl mb-8 border border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => setRegMode('visitor')}
                            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${regMode === 'visitor' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Visiteur
                        </button>
                        <button
                            onClick={() => setRegMode('member')}
                            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${regMode === 'member' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Membre
                        </button>
                    </div>

                    {regMode === 'visitor' ? (
                        <form onSubmit={handleVisitorSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                                <input
                                    type="tel"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Confirmer ma présence
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMemberSubmit} className="space-y-5">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-white/5 mb-6">
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                                    Veuillez vous identifier avec vos accès membres pour confirmer votre présence automatiquement.
                                </p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Email</label>
                                <input
                                    type="email" required
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                    value={memberData.email}
                                    onChange={e => setMemberData({ ...memberData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Mot de Passe</label>
                                <input
                                    type="password" required
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-bold text-[#2B3674] dark:text-white"
                                    value={memberData.password}
                                    onChange={e => setMemberData({ ...memberData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Code Membre Unique</label>
                                <input
                                    type="text" required
                                    placeholder="ex: DW261EEG"
                                    className="w-full bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:indigo-500/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all font-black tracking-[0.2em] text-[#2B3674] dark:text-white text-center"
                                    value={memberData.memberCode}
                                    onChange={e => setMemberData({ ...memberData, memberCode: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                S'identifier & Confirmer
                            </button>
                        </form>
                    )}
                </div>
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
}
