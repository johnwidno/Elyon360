
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import axios from 'axios';
import api from '../api/axios';
import { Search, User, LogOut, Setting, Bell, Activity, BookOpen } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import { useLanguage } from '../context/LanguageContext';
import MustChangePasswordModal from '../components/Admin/MustChangePasswordModal';

const AdminLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const { lang, toggleLang, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (name) => {
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const isSettingsPage = location.pathname === '/admin/settings';
    const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
    const isAdmin = userRoles.includes('admin');
    const showSetupModal = user && user.setupCompleted === false && !isSettingsPage && isAdmin;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        {
            name: t('dashboard'),
            href: '/admin',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="11" width="7" height="10"></rect>
                    <rect x="3" y="15" width="7" height="6"></rect>
                </svg>
            )
        },
        {
            name: t('contacts'),
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            ),
            permission: 'members',
            children: [
                { name: t('overview', "Vue d'ensemble"), href: '/admin/contacts' },
                { name: t('members'), href: '/admin/members' },
                { name: t('visitors'), href: '/admin/visitors' },
                { name: t('organizations'), href: '/admin/organizations' },
            ]
        },
        {
            name: t('events'),
            href: '/admin/events',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            ),
            permission: 'events'
        },
        {
            name: t('groups'),
            href: '/admin/groups',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            ),
            permission: 'groups'
        },
        {
            name: t('finances'),
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            ),
            permission: 'finances',
            children: [
                { name: t('income'), href: '/admin/finances' },
                { name: t('expenses'), href: '/admin/expenses' },

                { name: t('budgets'), href: '/admin/budgets' },
                { name: t('accounts_and_treasury', 'Comptes & Trésorerie'), href: '/admin/finances/accounts' },
            ]
        },
        {
            name: t('sunday_school'),
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
            ),
            permission: 'sunday-school',
            children: [
                { name: t('overview'), href: '/admin/sunday-school' },
                { name: t('classes'), href: '/admin/sunday-school/classes' },
                { name: t('monitors', 'Moniteurs'), href: '/admin/sunday-school/monitors' },
            ]
        },
        {
            name: t('worship_management', 'Gestion des Cultes'),
            href: '/admin/worship',
            icon: <BookOpen className="w-5 h-5" />,
            permission: 'worship'
        },

        {
            name: t('ceremonies'),
            href: '/admin/ceremonies',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                </svg>
            ),
            permission: 'ceremonies'
        },
        {
            name: t('logistics', 'Logistique'),
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            ),
            permission: 'logistics', // Ensure this permission is handled or added to roles
            children: [
                { name: t('overview', "Vue d'ensemble"), href: '/admin/logistics' },
                { name: t('spaces', 'Espaces & Salles'), href: '/admin/logistics/spaces' },
                { name: t('reservations_schedule', 'Réservations & Horaires'), href: '/admin/logistics/reservations' },
                { name: t('resources', 'Matériels'), href: '/admin/logistics/resources' },
                { name: t('inventory', 'Inventaire'), href: '/admin/inventory' },
                { name: t('maintenance', 'Maintenance & Actions'), href: '/admin/logistics/maintenance' },
                { name: t('assignments', 'Responsables & Affectations'), href: '/admin/logistics/assignments' },
            ]
        },
        {
            name: t('services', 'Services'),
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
            ),
            permission: 'services',
            children: [
                { name: t('member_cards_management', 'Gestion des Cartes'), href: '/admin/services/cards' },
                { name: t('advanced_search_builder', 'Recherche Avancée'), href: '/admin/services/search-builder' },
                { name: t('user_requests', 'Demandes Utilisateurs'), href: '/admin/services/requests' },
                { name: t('other_services', 'Autres'), href: '/admin/services/other' },
            ]
        },
        {
            name: t('settings'),
            href: '/admin/settings',
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            ),
            permission: 'settings'
        },
    ].filter(item => {
        const userRoles = Array.isArray(user.role) ? user.role : [user.role];
        if (!item.permission) return true;
        if (userRoles.includes('admin') || userRoles.includes('super_admin')) return true;
        return user?.permissions?.includes(item.permission);
    });

    return (
        <div className="flex h-screen bg-white dark:bg-[#0B0F19] transition-colors duration-200 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-[110]
                ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0 lg:w-24'} 
                bg-white dark:bg-[#111C44] text-gray-900 dark:text-white transition-all duration-300 ease-in-out flex flex-col border-r border-gray-100 dark:border-white/5 shadow-2xl lg:shadow-none
            `}>
                <div className="p-8 flex flex-col relative shrink-0">
                    <div className={`${!sidebarOpen && 'lg:opacity-0 lg:pointer-events-none'} transition-all duration-300 overflow-hidden`}>
                        <div className="flex items-center gap-4 mb-4">
                            {user?.churchLogo ? (
                                <img
                                    src={user.churchLogo.startsWith('http') ? user.churchLogo : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.churchLogo}`}
                                    alt="Church Logo"
                                    className="w-12 h-12 object-contain rounded-xl"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-brand-primary/20">
                                    {(user?.churchAcronym || user?.churchName || 'E')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-app-micro font-bold text-brand-primary dark:text-brand-orange tracking-wider mb-0.5">{t('elyonsys_360', 'ELYONSYS 360')}</p>
                                <h1 className="font-bold text-app-title tracking-tight text-gray-900 dark:text-white truncate">
                                    {user?.churchAcronym || 'EDM'}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary dark:hover:text-brand-orange transition-colors hidden lg:block">
                        <svg className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {/* Mobile Close Button */}
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 lg:py-8 px-6 noscrollbar">
                    <ul className="space-y-3">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href || (item.children && item.children.some(child => location.pathname === child.href));

                            if (item.children) {
                                const isOpen = openMenus[item.name];

                                return (
                                    <li key={item.name} className="space-y-2">
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                                ? 'bg-brand-primary/10 dark:bg-white/5 text-brand-primary dark:text-white font-semibold'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className={`${isActive ? 'text-brand-primary dark:text-brand-orange' : 'text-gray-400 dark:text-gray-600 group-hover:text-brand-primary'} transition-colors`}>
                                                    {item.icon}
                                                </div>
                                                <span className={`${!sidebarOpen && 'lg:hidden'} ml-3.5 text-app-meta`}>{item.name}</span>
                                            </div>
                                            {(sidebarOpen || (window.innerWidth < 1024)) && (
                                                <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-orange' : 'text-gray-300 dark:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>

                                        {(sidebarOpen || (window.innerWidth < 1024)) && isOpen && (
                                            <ul className="mt-2 ml-6 space-y-2 border-l-2 border-gray-50 dark:border-white/5 pl-4 py-2 transition-all">
                                                {item.children.map(child => {
                                                    const isChildActive = location.pathname === child.href;
                                                    return (
                                                        <li key={child.name}>
                                                            <Link
                                                                to={child.href}
                                                                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                                                className={`flex items-center px-6 py-2.5 rounded-xl text-app-meta font-medium transition-all duration-300 ${isChildActive
                                                                    ? 'text-brand-primary dark:text-white bg-brand-primary/5 dark:bg-white/10 border border-brand-primary/10 dark:border-white/5 shadow-sm'
                                                                    : 'text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <span>{child.name}</span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            }

                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                                        className={`flex items-center px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                            ? 'bg-brand-primary text-white shadow-[0_10px_20px_-5px_rgba(26,31,77,0.3)] font-semibold'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                                            }`}
                                    >
                                        <div className={`${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-600 group-hover:text-brand-primary'} transition-colors`}>
                                            {item.icon}
                                        </div>
                                        <span className={`${!sidebarOpen && 'lg:hidden'} ml-4 text-app-body tracking-tight`}>{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-8 border-t border-gray-100 dark:border-white/5 shrink-0">
                    <button onClick={handleLogout} className="flex items-center w-full px-5 py-4 text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-all rounded-[1.5rem] hover:bg-rose-50 dark:hover:bg-rose-900/20 group">
                        <div className="transition-transform group-hover:rotate-12">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <span className={`${!sidebarOpen && 'lg:hidden'} ml-4 font-bold text-app-meta tracking-tight`}>{t('logout', 'Déconnexion')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-[#0B0F19] transition-colors duration-500">
                {/* Top Header */}
                <header className="bg-white/80 dark:bg-[#111C44]/80 backdrop-blur-xl z-[90] transition-all duration-500 py-4 lg:py-6 px-4 lg:px-12 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4 lg:gap-6">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-gray-50 dark:bg-black/20 border border-transparent dark:border-white/5 text-gray-400 dark:text-gray-500 hover:text-brand-primary dark:hover:text-white rounded-xl lg:rounded-2xl transition-all active:scale-95 shadow-sm">
                                <svg className={`w-5 h-5 transition-transform duration-500 ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                            <h2 className="text-app-micro font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] hidden sm:block">
                                {t('admin')} <span className="mx-2 text-gray-300 dark:text-white/10">|</span> <span className="text-gray-900 dark:text-white">{location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'dashboard'}</span>
                            </h2>
                        </div>

                        <div className="flex items-center space-x-3 lg:space-x-6">
                            {/* Global Search Bar */}
                            <div className="relative hidden md:block group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('search_member', 'Rechercher...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-40 lg:w-72 bg-gray-50 dark:bg-black/20 border border-transparent dark:border-white/5 rounded-xl lg:rounded-2xl text-app-meta font-medium focus:ring-4 focus:ring-brand-primary/10 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 outline-none shadow-sm"
                                />

                                {/* Search Results Dropdown */}
                                {searchQuery.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1A1D2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 z-[100] max-h-[400px] overflow-y-auto noscrollbar overflow-x-hidden">
                                        <div className="p-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                                            <p className="text-app-micro font-black text-gray-400 uppercase tracking-widest">{t('member_results', 'Résultats')}</p>
                                        </div>
                                        {searchResults.length === 0 && !isSearching ? (
                                            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-app-micro italic">{t('no_member_found', 'Aucun résultat')}</div>
                                        ) : (
                                            <div className="p-2">
                                                {searchResults.map(m => (
                                                    <div key={m.id} className="p-3 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer flex items-center gap-4 group/item"
                                                        onClick={() => { navigate(`/admin/members/${m.id}`); setSearchQuery(''); }}>
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary dark:text-brand-orange text-app-micro font-black">
                                                            {m.photo ? <img src={m.photo.startsWith('http') ? m.photo : `${process.env.REACT_APP_API_URL || ''}/uploads/${m.photo}`} className="w-full h-full object-cover" /> : (m.firstName?.[0] || 'M')}
                                                        </div>
                                                        <div className="min-w-0 flex-1 text-left">
                                                            <p className="text-app-meta font-bold text-gray-900 dark:text-white group-hover/item:text-brand-primary dark:group-hover/item:text-brand-orange transition-colors truncate">
                                                                {m.firstName} {m.lastName}
                                                            </p>
                                                            <p className="text-app-micro text-gray-400 dark:text-gray-500 font-medium truncate capitalize">{m.status || (m.type?.name) || 'Membre'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Language Toggle */}
                            <div className="flex items-center p-1 bg-gray-50 dark:bg-black/20 border border-transparent dark:border-white/5 rounded-xl lg:rounded-2xl">
                                <button onClick={() => lang !== 'FR' && toggleLang()} className={`px-2.5 lg:px-4 py-1.5 rounded-lg lg:rounded-xl text-app-micro font-black transition-all ${lang === 'FR' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-400'}`}>FR</button>
                                <button onClick={() => lang !== 'EN' && toggleLang()} className={`px-2.5 lg:px-4 py-1.5 rounded-lg lg:rounded-xl text-app-micro font-black transition-all ${lang === 'EN' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-400'}`}>EN</button>
                            </div>

                            <DarkModeToggle />

                            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/admin/settings')}>
                                <div className="text-right hidden sm:block">
                                    <div className="text-app-meta font-black text-gray-900 dark:text-white tracking-tight leading-none group-hover:text-brand-primary transition-colors mb-1">{user?.firstName || 'Admin'}</div>
                                    <div className="text-app-micro font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{user?.role?.[0] || 'ADMIN'}</div>
                                </div>
                                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/20 border-2 border-transparent dark:border-white/5 group-hover:border-brand-orange/30 flex items-center justify-center text-brand-primary dark:text-brand-orange font-black text-lg shadow-sm transition-all group-hover:scale-105">
                                    {user?.firstName ? user.firstName[0] : 'A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative flex flex-col noscrollbar transition-colors">
                    {showSetupModal && (
                        <div className="fixed inset-0 z-[9999] bg-gray-900/80 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 lg:p-12 transition-all">
                            <div className="bg-white dark:bg-[#080808] rounded-[3rem] lg:rounded-[4rem] shadow-2xl border border-transparent dark:border-white/5 p-8 lg:p-20 max-w-2xl w-full text-center animate-scale-in transition-colors">
                                <div className="text-5xl lg:text-7xl mb-8 lg:mb-12 bg-gray-50 dark:bg-black w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center rounded-[2rem] lg:rounded-[2.5rem] mx-auto scale-110 shadow-sm border border-transparent dark:border-white/5">🏗️</div>
                                <h2 className="text-2xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4 lg:mb-6 leading-none transition-colors uppercase">{t('configuration_required', 'Configuration Requise')}</h2>
                                <p className="text-gray-400 dark:text-gray-500 font-bold tracking-wide leading-loose mb-10 lg:mb-14 text-app-meta lg:text-app-body transition-colors">
                                    {t('setup_msg', 'Votre compte nécessite une configuration initiale pour accéder à toutes les fonctionnalités.')}
                                </p>
                                <Link
                                    to="/admin/settings"
                                    className="block w-full bg-brand-primary text-white font-black text-app-meta lg:text-app-body tracking-widest uppercase py-5 lg:py-6 rounded-2xl lg:rounded-[2rem] hover:bg-brand-deep transition-all shadow-xl shadow-brand-primary/20 active:scale-95"
                                >
                                    {t('setup_btn', 'Commencer la configuration')}
                                </Link>
                            </div>
                        </div>
                    )}
                    <MustChangePasswordModal user={user} />
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
