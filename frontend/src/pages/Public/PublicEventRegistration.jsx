import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

export default function PublicEventRegistration() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [registered, setRegistered] = useState(false);
    const [showMemberLogin, setShowMemberLogin] = useState(false);

    const [guestData, setGuestData] = useState({
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
        const fetchEvent = async () => {
            try {
                const response = await api.get(`/public/events/${token}`);
                setEvent(response.data);
                if (response.data.alreadyRegistered) setRegistered(true);
            } catch (err) {
                setError(err.response?.data?.message || t('link_error_or_expired', 'Lien invalide ou expiré.'));
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [token, t]);

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/public/events/${token}/register-guest`, {
                guestName: `${guestData.firstName} ${guestData.lastName}`,
                guestEmail: guestData.email,
                guestPhone: guestData.phone
            });
            setRegistered(true);
        } catch (err) {
            alert(err.response?.data?.message || t('registration_error', "Erreur lors de l'inscription."));
        }
    };

    const handleMemberSubmit = async (e) => {
        e.preventDefault();
        try {
            // We need to ensure the user is logged in first or use the register-member endpoint which expects auth or login params
            // The publicActivityController's registerMember handles login internally if not auth.
            // Let's check publicEventController again. It uses verifyToken.
            // Wait, publicActivityController's registerMember (line 103) manually verifies credentials.
            // My publicEventController's registerMember (line 70) uses req.user.id.
            // I should make it consistent with publicActivityController if I want "login during registration".

            // RE-CHECK: publicActivityController.js line 103-130 does manual verification!
            // I should update publicEventController.js to do the same to be consistent and avoid requiring a separate login step.

            await api.post(`/public/events/${token}/register-member`, memberData);
            setRegistered(true);
        } catch (err) {
            alert(err.response?.data?.message || t('invalid_credentials', "Identifiants invalides."));
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 animate-pulse uppercase tracking-widest text-xs">{t('loading')}</div>;
    if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-red-500 uppercase tracking-widest text-xs p-8 text-center">{error}</div>;

    if (registered) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 max-w-lg w-full text-center animate-scale-in">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">{t('registration_confirmed', 'Inscription Confirmée !')}</h2>
                    <p className="text-gray-500 font-medium mb-10 leading-relaxed">{t('registration_confirmed_desc', 'Nous avons hâte de vous voir à cet événement. Un email de confirmation vous sera envoyé.')}</p>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
                        {t('back_to_home', 'Retour à l\'accueil')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full">
                {/* Event Header Card */}
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8 animate-slide-up">
                    <div className="p-10">
                        <div className="mb-8">
                            <p className="text-[14px] font-bold text-gray-400 mb-1">le groupe {event.groupName || 'Église'}</p>
                            <h1 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{event.churchName}</h1>
                        </div>

                        <div className="inline-block px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6">
                            Événement Spécial
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight tracking-tight">{event.title}</h1>
                        <p className="text-gray-500 text-lg leading-relaxed mb-10">{event.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('date')}</p>
                                    <p className="font-bold text-gray-900">{new Date(event.startDate).toLocaleDateString()} {event.startTime}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('location')}</p>
                                    <p className="font-bold text-gray-900">{event.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Form Card */}
                <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex border-b border-gray-100">
                        <button onClick={() => setShowMemberLogin(false)} className={`flex-1 py-6 text-sm font-bold transition-all ${!showMemberLogin ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'}`}>{t('guest_registration', 'Je suis un invité')}</button>
                        <button onClick={() => setShowMemberLogin(true)} className={`flex-1 py-6 text-sm font-bold transition-all ${showMemberLogin ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'}`}>{t('member_registration', 'Je suis membre')}</button>
                    </div>

                    <div className="p-10">
                        {!showMemberLogin ? (
                            <form onSubmit={handleGuestSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('first_name', 'Prénom')}</label>
                                        <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={guestData.firstName} onChange={e => setGuestData({ ...guestData, firstName: e.target.value })} placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('last_name', 'Nom')}</label>
                                        <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={guestData.lastName} onChange={e => setGuestData({ ...guestData, lastName: e.target.value })} placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Email</label>
                                    <input type="email" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={guestData.email} onChange={e => setGuestData({ ...guestData, email: e.target.value })} placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('phone', 'Téléphone')}</label>
                                    <input type="tel" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={guestData.phone} onChange={e => setGuestData({ ...guestData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200 mt-4">
                                    {t('confirm_registration', 'Confirmer mon inscription')}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleMemberSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Email</label>
                                    <input type="email" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={memberData.email} onChange={e => setMemberData({ ...memberData, email: e.target.value })} placeholder="votre@email.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('member_code', 'Code Membre')}</label>
                                        <input required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none uppercase" value={memberData.memberCode} onChange={e => setMemberData({ ...memberData, memberCode: e.target.value })} placeholder="M-XXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('password', 'Mot de passe')}</label>
                                        <input type="password" required className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-white focus:border-indigo-500/30 transition-all outline-none" value={memberData.password} onChange={e => setMemberData({ ...memberData, password: e.target.value })} placeholder="••••••••" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200 mt-4">
                                    {t('confirm_registration', 'Confirmer mon inscription')}
                                </button>
                            </form>
                        )}
                        <p className="mt-8 text-center text-[11px] text-gray-400 font-medium">En vous inscrivant, vous acceptez de recevoir des communications concernant cet événement.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
