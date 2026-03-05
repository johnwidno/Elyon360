import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import AlertModal from '../../components/ChurchAlertModal';

const ChurchRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        churchName: '',
        subdomain: '',
        acronym: '',
        adminEmail: '',
        adminPassword: '',
        contactPhone: '',
        plan: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [plans, setPlans] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('moncash');
    const [focusedField, setFocusedField] = useState(null);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/saas/plans');
                setPlans(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, plan: res.data[0].id }));
                }
            } catch (err) {
                console.error("Error fetching plans", err);
            }
        };
        fetchPlans();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/saas/register-church', { ...formData, paymentMethod });

            if (res.data.redirectUrl) {
                // Store orderId for verification after MonCash/Stripe redirect
                if (res.data.orderId) {
                    localStorage.setItem('pendingOrderId', res.data.orderId);
                }
                // For paid plans, church is not created in DB yet, so we don't have a church.id here.
                // We'll rely on the redirect to MonCash/Stripe and then to PaymentSuccess.
                window.location.href = res.data.redirectUrl;
            } else {
                setAlertMessage({
                    show: true,
                    title: 'Succès !',
                    message: "Église créée avec succès ! Vous pouvez maintenant vous connecter.",
                    type: 'success'
                });
                navigate('/login');
            }
        } catch (err) {
            console.error("Register Error:", err);
            const msg = err.response?.data?.message || "Erreur lors de l'inscription.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = (fieldName) =>
        `w-full bg-transparent border-b-2 transition-all duration-300 outline-none text-[15px] text-gray-800 py-3 px-1 ${focusedField === fieldName
            ? 'border-blue-600'
            : 'border-gray-200 hover:border-gray-300'
        }`;

    const labelClasses = (fieldName) =>
        `block text-[13px] font-semibold mb-1 transition-colors duration-200 ${focusedField === fieldName ? 'text-blue-600' : 'text-gray-800'
        }`;

    const helperClasses = 'text-[11px] text-gray-400 mt-1.5 font-medium';

    return (
        <div className="min-h-screen bg-[#fafaf9] font-['Inter',sans-serif] relative">
            {/* Top Navigation */}
            <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">E</span>
                    </div>
                    <span className="font-bold text-gray-800 text-[15px] tracking-tight">ElyonSys 360</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors">Accueil</Link>
                    <Link to="/services" className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors">Services</Link>
                    <Link to="/contact" className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors">Contact</Link>
                    <Link to="/login" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Se connecter</Link>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-[1320px] mx-auto px-8 py-3 flex gap-16 min-h-[calc(100vh-73px)]">
                {/* Left - Form Area */}
                <div className="flex-1 max-w-[820px]">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
                            Créer votre église
                        </h1>
                        <p className="text-[14px] text-gray-400 font-medium">
                            Étape 1 sur 2 — Informations de l'église
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-lg">1</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all duration-700"></div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center">
                            <span className="text-gray-300 font-bold text-lg">2</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-[13px] font-medium mb-4 animate-shake">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Row 1: Church Name — Acronym — Phone (3 columns) */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-x-8 gap-y-8 mb-2">
                            <div>
                                <label className={labelClasses('churchName')}>Nom de l'église</label>
                                <input
                                    type="text" name="churchName" required
                                    className={inputClasses('churchName')}
                                    placeholder="Nom complet de la congrégation"
                                    onFocus={() => setFocusedField('churchName')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleChange}
                                />
                                <p className={helperClasses}>Le nom officiel de votre congrégation</p>
                            </div>

                        </div>

                        {/* Row 2: Email — Password (2 columns) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 mb-1">
                            <div>
                                <label className={labelClasses('acronym')}>Sigle</label>
                                <input
                                    type="text" name="acronym" required
                                    className={inputClasses('acronym')}
                                    placeholder="Ex: EEG"
                                    onFocus={() => setFocusedField('acronym')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
                                    value={formData.acronym}
                                />
                                <p className={helperClasses}>Abréviation de 2 à 5 lettres</p>
                            </div>
                            <div>
                                <label className={labelClasses('contactPhone')}>Téléphone</label>
                                <input
                                    type="tel" name="contactPhone" required
                                    className={inputClasses('contactPhone')}
                                    placeholder="+509 0000 0000"
                                    onFocus={() => setFocusedField('contactPhone')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleChange}
                                />
                                <p className={helperClasses}>Numéro de contact principal</p>
                            </div>
                            <div>
                                <label className={labelClasses('adminEmail')}>Email administrateur</label>
                                <input
                                    type="email" name="adminEmail" required
                                    className={inputClasses('adminEmail')}
                                    placeholder="admin@votre-eglise.com"
                                    onFocus={() => setFocusedField('adminEmail')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleChange}
                                />
                                <p className={helperClasses}>Utilisé pour la connexion au tableau de bord</p>
                            </div>
                            <div>
                                <label className={labelClasses('adminPassword')}>Mot de passe</label>
                                <input
                                    type="password" name="adminPassword" required
                                    className={inputClasses('adminPassword')}
                                    placeholder="••••••••"
                                    onFocus={() => setFocusedField('adminPassword')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleChange}
                                />
                                <p className={helperClasses}>Minimum 6 caractères</p>
                            </div>
                        </div>

                        {/* Row 3: Subdomain — full width */}
                        <div className="mb-2">
                            <label className={labelClasses('subdomain')}>Adresse web souhaitée</label>
                            <div className="flex items-center">
                                <input
                                    type="text" name="subdomain" required
                                    className={`flex-1 bg-transparent border-b-2 transition-all duration-300 outline-none text-[15px] text-gray-800 py-3 px-1 ${focusedField === 'subdomain' ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    placeholder="votre-eglise"
                                    onFocus={() => setFocusedField('subdomain')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleChange}
                                />
                                <span className="text-gray-400 font-semibold text-[13px] pl-2 pb-1 border-b-2 border-gray-200 py-3 whitespace-nowrap">.elyonsys360.com</span>
                            </div>
                            <p className={helperClasses}>L'URL unique de votre espace en ligne</p>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-gray-100 my-4"></div>

                        {/* Plan Selection */}
                        <div className="mb-2">
                            <label className={labelClasses('plan')}>Forfait</label>
                            <div className="relative mt-1">
                                <select
                                    name="plan"
                                    className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-700 outline-none appearance-none cursor-pointer transition-all hover:border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                                    onChange={handleChange}
                                    value={formData.plan}
                                >
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — {p.price} HTG / {p.interval === 'monthly' ? 'mois' : 'an'}
                                        </option>
                                    ))}
                                    {plans.length === 0 && <option value="">Chargement des forfaits...</option>}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-8">
                            <label className="block text-[13px] font-semibold text-gray-800 mb-3">Méthode de paiement</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button"
                                    onClick={() => setPaymentMethod('moncash')}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'moncash'
                                        ? 'border-blue-400 bg-blue-50/50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-2xl">🇭🇹</span>
                                    <div className="text-left">
                                        <span className="block text-[13px] font-bold text-gray-800">MonCash</span>
                                        <span className="block text-[11px] text-gray-400 font-medium">Paiement mobile</span>
                                    </div>
                                    {paymentMethod === 'moncash' && (
                                        <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </button>

                                <button type="button"
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'stripe'
                                        ? 'border-blue-400 bg-blue-50/50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-2xl">💳</span>
                                    <div className="text-left">
                                        <span className="block text-[13px] font-bold text-gray-800">Carte crédit</span>
                                        <span className="block text-[11px] text-gray-400 font-medium">Visa / Mastercard</span>
                                    </div>
                                    {paymentMethod === 'stripe' && (
                                        <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-[12px] font-medium">Des questions ?</span>
                                <a href="tel:+50900000000" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span className="text-[12px] font-semibold">Appelez-nous</span>
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/"
                                    className="px-6 py-3 text-[13px] font-semibold text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-50"
                                >
                                    Annuler
                                </Link>
                                <button type="submit" disabled={loading}
                                    className="group relative px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-100 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Traitement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Continuer</span>
                                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right - Decorative Panel */}
                <div className="hidden lg:flex w-[400px] shrink-0">
                    <div className="w-full bg-indigo-950 rounded-[2.5rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-3xl shadow-indigo-950/20 group">
                        {/* Background Pattern/Image - Synchronized with Login */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1600&auto=format&fit=crop"
                                alt="Community background"
                                className="w-full h-full object-cover opacity-20 scale-110 animate-slow-zoom-subtle"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-transparent to-indigo-950/40"></div>
                        </div>

                        {/* Background decorations - Refined for sync */}
                        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-[-10%] left-[-15%] w-[60%] h-[60%] bg-white/5 rounded-full blur-2xl"></div>

                        {/* Logo */}
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-6 shadow-xl">
                                <span className="text-white font-bold text-xl">⛪</span>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="relative z-10 flex-1 flex flex-col justify-center pb-10">
                            <h2 className="text-white text-[42px] font-extrabold leading-tight mb-6 tracking-tight">
                                Digitalisez<br />
                                <span className="text-indigo-400">votre ministère</span>
                            </h2>
                            <p className="text-white/80 text-[16px] font-medium leading-relaxed mb-10 max-w-[340px]">
                                Rejoignez les communautés haïtiennes qui gèrent efficacement leur administration pour la gloire de Dieu avec ElyonSys 360.
                            </p>
                            <Link to="/services"
                                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-[15px] px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all duration-300 w-fit shadow-2xl shadow-indigo-900/50"
                            >
                                En savoir plus
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </Link>
                        </div>

                        {/* Profile badge - Synchronized look */}
                        <div className="relative z-10 mt-auto flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 shadow-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white/5">
                                ES
                            </div>
                            <div>
                                <p className="text-white font-bold text-[15px] leading-tight mb-0.5">ElyonSys 360</p>
                                <p className="text-white/60 text-[11px] font-bold tracking-widest uppercase">Premium SaaS Platform</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease 3; }
                input::placeholder {
                    color: #c5c5c5;
                    font-weight: 400;
                }
                input:focus::placeholder {
                    opacity: 0.5;
                    transition: opacity 0.3s ease;
                }
                ::placeholder {
                    transition: opacity 0.3s ease;
                }
            ` }} />
            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </div >
    );
};

export default ChurchRegister;
