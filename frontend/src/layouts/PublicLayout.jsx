import { useState } from 'react';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';
import { Menu, X, LogIn, PlusCircle, Home, Info, Briefcase, Calendar, Mail, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PublicLayout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { t, language, toggleLanguage } = useLanguage();

    const navLinks = [
        { name: t('nav_home', 'Accueil'), path: '/', icon: <Home size={20} /> },
        { name: t('nav_about', 'À propos'), path: '/about', icon: <Info size={20} /> },
        { name: t('nav_services', 'Services'), path: '/services', icon: <Briefcase size={20} /> },
        { name: t('nav_events', 'Événements'), path: '/events', icon: <Calendar size={20} /> },
        { name: t('nav_contact', 'Contact'), path: '/contact', icon: <Mail size={20} /> },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Navbar */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Icon - Top Left */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                    ElyonSys 360
                                </Link>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all border border-gray-100 dark:border-gray-700"
                            >
                                <Globe size={16} />
                                <span>{language === 'fr' ? 'EN' : 'FR'}</span>
                            </button>

                            <DarkModeToggle />

                            {/* Connection Icon for Mobile, Text for Desktop */}
                            <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium p-2 rounded-md flex items-center gap-2 transition-all hover:scale-105">
                                <LogIn size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="hidden sm:inline">{t('connection', 'Connexion')}</span>
                            </Link>

                            {/* Create Church Icon for Mobile, Text for Desktop */}
                            <Link to="/register-church" className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 sm:px-4 sm:py-2 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-400 font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 hover:scale-105 active:scale-95">
                                <PlusCircle size={20} />
                                <span className="hidden sm:inline">{t('create_my_church', 'Créer mon église')}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Content (Drawer Overlay) */}
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[200]">
                        {/* Backdrop - Click outside to close */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                            onClick={() => setIsMenuOpen(false)}
                        ></div>

                        {/* Drawer content - Appears over the Hero section */}
                        <div className="absolute top-0 left-0 bottom-0 w-[300px] bg-gradient-to-b from-indigo-700 via-purple-700 to-indigo-800 text-white shadow-2xl animate-in slide-in-from-left duration-500 ease-out flex flex-col">
                            <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                <span className="text-2xl font-black italic tracking-tighter">ElyonSys 360</span>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/10 font-bold transition-all group"
                                    >
                                        <span className="text-white group-hover:scale-110 transition-transform">{link.icon}</span>
                                        <span className="text-lg">{link.name}</span>
                                    </Link>
                                ))}

                                <div className="pt-8 space-y-4 px-4">
                                    <button
                                        onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold transition-all"
                                    >
                                        <Globe size={20} />
                                        <span>{language === 'fr' ? 'English' : 'Français'}</span>
                                    </button>

                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white text-indigo-900 font-black transition-all hover:bg-gray-100 shadow-lg"
                                    >
                                        <LogIn size={20} />
                                        <span>{t('connection', 'Connexion')}</span>
                                    </Link>

                                    <Link
                                        to="/register-church"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-yellow-400 text-indigo-900 font-black transition-all hover:bg-yellow-300 shadow-lg"
                                    >
                                        <PlusCircle size={20} />
                                        <span>{t('create_my_church', 'Créer mon église gratuitement')}</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-8 text-center bg-black/20">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{t('all_rights_reserved_custom', '© 2026 ElyonSys 360. Tous droits réservés.')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow bg-white dark:bg-gray-950 transition-colors duration-500 text-gray-900 dark:text-gray-100">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-black text-gray-400 py-16 transition-colors duration-500 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <h3 className="text-white text-2xl font-black italic tracking-tighter mb-6">ElyonSys 360</h3>
                        <p className="text-base leading-relaxed max-w-sm">
                            {t('footer_desc', 'Plateforme de gestion moderne pour les églises connectées.')}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6">{t('quick_links', 'Liens Rapides')}</h3>
                        <ul className="space-y-4 text-sm font-bold">
                            <li><Link to="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full group-hover:scale-150 transition-transform" /> {t('member_space', 'Espace Membre')}</Link></li>
                            <li><Link to="/admin" className="hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full group-hover:scale-150 transition-transform" /> {t('administration', 'Administration')}</Link></li>
                            <li><Link to="/register-church" className="hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full group-hover:scale-150 transition-transform" /> {t('register_church', 'Inscrire une église')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6">Contact</h3>
                        <p className="text-sm font-bold mb-2 flex items-center gap-2"><Mail size={14} className="text-indigo-500" /> support@elyonsys360.com</p>
                        <p className="text-sm font-medium text-gray-500">{t('available_24_7', 'Disponible 24h/24, 7j/7')}</p>
                    </div>
                </div>
                <div className="mt-16 border-t border-white/5 pt-8 text-center text-xs font-bold tracking-widest text-gray-600">
                    {t('all_rights_reserved_custom', '© 2026 ElyonSys 360. Tous droits réservés.')}
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
