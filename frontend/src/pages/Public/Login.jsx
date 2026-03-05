import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import { useLanguage } from '../../context/LanguageContext';

const Login = ({ subdomain }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log("Attempting login with:", email);
            const response = await api.post('/auth/login', { email, password });
            const { token } = response.data;
            login(token);
            const decoded = jwtDecode(token);
            console.log("Login success, user:", decoded);
            const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];

            if (roles.includes('super_admin')) {
                navigate('/super-admin');
            } else {
                // All other roles (admin, member, etc.) default to the member personal space first
                navigate('/member');
            }
        } catch (err) {
            console.error("Login failed", err);
            const msg = err.response?.data?.message || t('invalid_credentials', 'Email ou mot de passe incorrect.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-['Inter',sans-serif]">
            {/* Left Side: Professional Worship Animation Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-950 items-center justify-center p-12">
                {/* Background Pattern/Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1600&auto=format&fit=crop"
                        alt="Community background"
                        className="w-full h-full object-cover opacity-20 scale-110 animate-slow-zoom-subtle"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-transparent to-indigo-950/40"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg">
                    {/* Header for Animation Section */}
                    <div className="mb-12">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-6 shadow-2xl">
                            <span className="text-white text-3xl font-bold">✨</span>
                        </div>
                        <h1 className="text-white text-5xl font-extrabold leading-tight mb-2 tracking-tight">
                            {t('welcome_to')} <br />
                            Elyon360
                        </h1>
                        <p className="text-white/80 text-xl font-medium leading-relaxed">
                            {t('login_to_space', 'Connectez-vous à votre espace')}
                        </p>
                    </div>

                    {/* Worship Joy Animation Area (Neutralized) */}
                    <div className="relative h-[300px] rounded-[2rem] overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-3xl shadow-black/30 group">
                        {/* Interior Background */}
                        <img
                            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
                            className="w-full h-full object-cover opacity-30 transform group-hover:scale-105 transition-transform duration-1000"
                            alt="Community Worship"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-transparent to-transparent"></div>

                        {/* Animation Layer */}
                        <div className="absolute inset-0 flex items-end justify-center pb-12">
                            {/* Worshiping Avatars (Refined) */}
                            <div className="flex items-end gap-6 h-full px-8">
                                <div className="flex flex-col items-center animate-bobbing-slow">
                                    <div className="relative w-16 h-16 rounded-full border-2 border-white/60 overflow-hidden bg-white/10 mb-2 shadow-2xl">
                                        <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar 1" className="w-full h-full object-cover" />
                                        <div className="absolute -top-1 -right-1 text-xs animate-pulse delay-500">✨</div>
                                    </div>
                                    <div className="w-4 h-8 bg-white/30 rounded-t-full animate-worship-hand origin-bottom"></div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="relative w-20 h-20 rounded-full border-4 border-white/80 overflow-hidden bg-white/20 mb-2 shadow-3xl ring-4 ring-white/5 animate-joy-scale">
                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar 2" className="w-full h-full object-cover" />
                                        <div className="absolute top-0 right-0 text-lg animate-float-sparkle-1">❤️</div>
                                    </div>
                                    <div className="w-12 h-2 bg-black/40 rounded-full blur-sm"></div>
                                </div>

                                <div className="flex flex-col items-center animate-bobbing-slow delay-700">
                                    <div className="relative w-16 h-16 rounded-full border-2 border-white/60 overflow-hidden bg-white/10 mb-2 shadow-2xl">
                                        <img src="https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=200&h=200" alt="Avatar 3" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-4 h-8 bg-white/30 rounded-t-full animate-worship-hand-alt origin-bottom"></div>
                                </div>
                            </div>

                            {/* Spirit Sparks & Glow */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/3 left-1/4 text-white/40 animate-float-sparkle-1">✨</div>
                                <div className="absolute top-1/4 right-1/4 text-white/30 animate-float-sparkle-2 delay-1000">🔥</div>
                                <div className="absolute bottom-1/3 right-1/3 text-white/20 animate-pulse">🌟</div>
                            </div>
                        </div>

                        {/* Top Badge (General) */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-1 rounded-full border border-white/10">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping delay-200"></span>
                            </div>
                            <span className="text-white text-[10px] font-bold tracking-widest uppercase">ElyonSys 360 Platform</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Branding & Language Toggle */}
                <div className="absolute bottom-2 left-12 right-12 flex items-center justify-between text-white/50">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold tracking-widest uppercase">ElyonSys 360</span>
                        <div className="w-12 h-px bg-white/20"></div>
                        <span className="text-xs uppercase">Premium Church SaaS</span>
                    </div>

                    {/* Language Toggle in Left Panel */}
                    <div className="flex items-center p-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
                        <button
                            onClick={() => language !== 'fr' && toggleLanguage()}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${language === 'fr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            FR
                        </button>
                        <button
                            onClick={() => language !== 'en' && toggleLanguage()}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 bg-gray-50/50 relative">

                {/* Mobile Language Toggle */}
                <div className="lg:hidden absolute top-8 right-8 flex items-center p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <button onClick={() => language !== 'fr' && toggleLanguage()} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${language === 'fr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>FR</button>
                    <button onClick={() => language !== 'en' && toggleLanguage()} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>EN</button>
                </div>

                <div className="max-w-md w-full mx-auto space-y-10">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm mb-12 hover:gap-3 transition-all group">
                            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            {t('back_home', 'Retour à l\'accueil')}
                        </Link>
                        <h2 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-4">
                            {t('login', 'Connexion')}
                        </h2>
                        <p className="text-gray-500 text-lg font-medium">
                            {subdomain
                                ? `${t('welcome_to')} ${subdomain.toUpperCase()}`
                                : t('login_to_space', 'Connectez-vous à votre espace')}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">{t('email_address', 'Adresse Email')}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                                        placeholder={t('email_placeholder')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700 tracking-wide uppercase">{t('password', 'Mot de passe')}</label>
                                    <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">{t('forgot_password', 'Mot de passe oublié ?')}</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 118 0v4h-8z" /></svg>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                                        placeholder={t('password_placeholder')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="animate-shake p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative flex justify-center items-center py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-base font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                t('login_btn', 'Se connecter')
                            )}
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-sm font-medium text-gray-500">
                                {t('no_account', 'Pas encore de compte ?')}{' '}
                                <Link to="/register-church" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors underline decoration-indigo-200 decoration-2 underline-offset-4">
                                    {t('register_here', 'Enregistrez votre église ici')}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slow-zoom-subtle {
                    0% { transform: scale(1.1); }
                    100% { transform: scale(1.2); }
                }
                @keyframes bobbing-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes joy-scale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes worship-hand {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(15deg); }
                }
                @keyframes worship-hand-alt {
                    0%, 100% { transform: rotate(5deg); }
                    50% { transform: rotate(-15deg); }
                }
                @keyframes float-sparkle-1 {
                    0% { transform: translate(0, 0) scale(1); opacity: 0; }
                    50% { transform: translate(-15px, -30px) scale(1.5); opacity: 1; }
                    100% { transform: translate(-30px, -60px) scale(1); opacity: 0; }
                }
                @keyframes float-sparkle-2 {
                    0% { transform: translate(0, 0) scale(1); opacity: 0; }
                    50% { transform: translate(20px, -40px) scale(1.3); opacity: 1; }
                    100% { transform: translate(40px, -80px) scale(1); opacity: 0; }
                }
                .animate-slow-zoom-subtle { animation: slow-zoom-subtle 30s linear infinite alternate; }
                .animate-bobbing-slow { animation: bobbing-slow 3s ease-in-out infinite; }
                .animate-joy-scale { animation: joy-scale 5s ease-in-out infinite; }
                .animate-worship-hand { animation: worship-hand 2.5s ease-in-out infinite; }
                .animate-worship-hand-alt { animation: worship-hand-alt 3s ease-in-out infinite; }
                .animate-float-sparkle-1 { animation: float-sparkle-1 5s ease-in-out infinite; }
                .animate-float-sparkle-2 { animation: float-sparkle-2 6s ease-in-out infinite; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    50% { transform: translateX(8px); }
                    75% { transform: translateX(-4px); }
                }
            ` }} />
        </div>
    );
};

export default Login;
