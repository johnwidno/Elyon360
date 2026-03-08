/* src/layouts/PublicLayout.jsx */
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Moon, Sun, UserCircle, Home, MessageCircle, Info, PlusCircle } from 'lucide-react';
import { useState } from 'react';

const PublicLayout = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isDark = theme === 'dark';

    const navLinks = [
        { label: t('nav_home'), to: '/' },
        { label: t('nav_about'), to: '/#about' },
        { label: t('nav_services'), to: '/#services' },
        { label: t('nav_contact'), to: '/contact' },
    ];

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* ======= NAVBAR ======= */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark
                ? 'bg-[#0f133d]/90 border-white/10 text-white'
                : 'bg-white/80 border-gray-200/50 text-[#1a1f4d]'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">

                        {/* === MOBILE LEFT: Hamburger menu === */}
                        <div className="flex md:hidden items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg ${isDark ? 'text-white' : 'text-[#1a1f4d]'
                                    }`}
                            >
                                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* === Logo (center on mobile, left on desktop) === */}
                        <Link to="/" className="flex items-center text-xl sm:text-[22px] font-extrabold tracking-tight">
                            <span className={isDark ? 'text-white' : 'text-[#1a1f4d]'}>ElyonSys</span>
                            <span className="text-[#ea762a] ml-0.5">360</span>
                        </Link>

                        {/* === Desktop Nav (hidden on mobile) === */}
                        <nav className="hidden md:flex items-center space-x-10">
                            {navLinks.map((link, i) => (
                                <Link key={i} to={link.to} className={`text-[15px] font-medium transition-colors hover:text-[#ea762a] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* === Desktop Right Actions === */}
                        <div className="hidden md:flex items-center space-x-3">
                            <button onClick={toggleTheme} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${isDark ? 'border-white/20 text-yellow-400 hover:bg-white/10' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`} title={isDark ? 'Mode clair' : 'Mode sombre'}>
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button onClick={toggleLang} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${isDark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                {lang}
                            </button>
                            <Link to="/login" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-[#1a1f4d] hover:bg-gray-50'}`}>
                                {t('nav_signup')}
                            </Link>
                            <Link to="/register-church" className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all hover:scale-[1.02] ${isDark ? 'bg-white text-[#1a1f4d] hover:bg-gray-100' : 'bg-[#1a1f4d] text-white hover:bg-[#12162b]'}`}>
                                {t('nav_create')}
                            </Link>
                        </div>

                        {/* === MOBILE RIGHT: Dark mode + Lang + Login === */}
                        <div className="flex md:hidden items-center space-x-1">
                            <button
                                onClick={toggleTheme}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border ${isDark ? 'border-white/20 text-yellow-400' : 'border-gray-200 text-gray-500'
                                    }`}
                            >
                                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={toggleLang}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${isDark ? 'border-white/20 text-gray-300' : 'border-gray-200 text-gray-500'
                                    }`}
                            >
                                {lang}
                            </button>
                            <Link to="/login" className={`w-9 h-9 flex items-center justify-center rounded-full ${isDark ? 'text-white' : 'text-[#1a1f4d]'}`}>
                                <UserCircle className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ======= MOBILE SIDEBAR OVERLAY (full height, on top of page) ======= */}
            {sidebarOpen && (
                <>
                    {/* Dark backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Sidebar panel */}
                    <div
                        className="fixed top-0 left-0 h-full w-[280px] z-50 md:hidden flex flex-col overflow-y-auto"
                        style={{ background: 'linear-gradient(180deg, #0f133d 0%, #2b2060 60%, #191e57 100%)' }}
                    >
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                            <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center text-xl font-extrabold tracking-tight">
                                <span className="text-white">ElyonSys</span>
                                <span className="text-[#ea762a] ml-0.5">360</span>
                            </Link>
                            <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 px-4 py-6 space-y-1">
                            {navLinks.map((link, i) => (
                                <Link
                                    key={i}
                                    to={link.to}
                                    onClick={() => setSidebarOpen(false)}
                                    className="block px-4 py-3 rounded-xl text-[15px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Action buttons */}
                        <div className="px-4 py-8 pb-40 space-y-3 border-t border-white/10 mt-auto">
                            <Link to="/login" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/20 text-white/90 text-[15px] font-semibold hover:bg-white/10 hover:text-white transition-all">
                                <UserCircle className="w-5 h-5 text-white/50" />
                                <span>{t('nav_signup')}</span>
                            </Link>
                            <Link to="/register-church" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[linear-gradient(135deg,#ea762a,#d56820)] text-white text-[15px] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#ea762a]/20">
                                <PlusCircle className="w-5 h-5" />
                                <span>{t('nav_create')}</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* ======= MAIN CONTENT ======= */}
            {/* Added pb-16 on mobile to account for the bottom navigation bar */}
            <main className="flex-grow pb-16 md:pb-0">
                {children}
            </main>

            {/* ======= FOOTER ======= */}
            <footer className="relative overflow-hidden text-gray-400 py-12 sm:py-16" style={{ background: 'linear-gradient(135deg, #0f133d 0%, #2b2060 50%, #191e57 100%)' }}>
                <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 pb-10 border-b border-white/10">
                        <div>
                            <h3 className="text-white text-lg font-bold mb-3">ElyonSys 360</h3>
                            <p className="text-sm leading-relaxed">{t('footer_desc')}</p>
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-bold mb-3">{t('footer_links')}</h3>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link to="/" className="hover:text-white transition-colors">{t('nav_home')}</Link></li>
                                <li><Link to="/#services" className="hover:text-white transition-colors">{t('footer_features')}</Link></li>
                                <li><Link to="/#about" className="hover:text-white transition-colors">{t('nav_about')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-bold mb-3">{t('footer_contact')}</h3>
                            <p className="text-sm">support@elyonsys360.com</p>
                        </div>
                    </div>
                    <div className="mt-6 text-center text-xs tracking-wider uppercase font-medium border-t border-white/5 pt-6">
                        <p>&copy; {new Date().getFullYear()} ElyonSys 360. {t('footer_rights')}</p>
                    </div>
                </div>
            </footer>

            {/* ======= MOBILE BOTTOM NAVIGATION ======= */}
            <nav className={`md:hidden fixed bottom-0 left-0 w-full z-50 border-t ${isDark ? 'bg-[#0f133d] border-white/10' : 'bg-white border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]'}`}>
                <div className="flex justify-around items-center h-[70px] px-2">
                    <Link to="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-90 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#ea762a]'}`}>
                        <Home className="w-[22px] h-[22px]" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                    </Link>

                    <Link to="/#about" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-90 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#ea762a]'}`}>
                        <Info className="w-[22px] h-[22px]" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">À propos</span>
                    </Link>

                    <Link to="/contact" className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all active:scale-90 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#ea762a]'}`}>
                        <MessageCircle className="w-[22px] h-[22px]" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Contact</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
};

export default PublicLayout;
