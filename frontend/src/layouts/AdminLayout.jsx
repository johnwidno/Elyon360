import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Calendar, 
    Settings, LogOut, Search, Bell, Moon, Sun, 
    ChevronLeft, ChevronRight, BookOpen, Cross, 
    ListTodo, Truck, Wallet, Network, UserCircle,
    ChevronDown, ChevronUp, UserPlus, Gift, Building2,
    PieChart, Receipt, Landmark, Layers, GraduationCap,
    Home, Box, Briefcase, ClipboardList, Settings2, CreditCard
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const darkMode = theme === 'dark';
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [churchName, setChurchName] = useState('Church name');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [openSubMenus, setOpenSubMenus] = useState({});
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const church = JSON.parse(localStorage.getItem('church'));
        let name = '';
        if (church?.name) {
            name = church.name;
        } else if (user?.churchName) {
            name = user.churchName;
        } else if (user?.church?.name) {
            name = user.church.name;
        }

        if (name) {
            const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            setChurchName(formattedName);
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const toggleSubMenu = (label) => {
        setOpenSubMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { 
            label: 'Contacts', 
            icon: Users,
            subItems: [
                { path: '/admin/contacts', label: "Vue d'ensemble", icon: PieChart },
                { path: '/admin/members', label: 'Liste des Membres', icon: Users },
                { path: '/admin/visitors', label: 'Visiteurs', icon: UserPlus },
                { path: '/admin/organizations', label: 'Organisations', icon: Building2 },
                { path: '/admin/birthdays', label: 'Anniversaires', icon: Gift },
            ]
        },
        { 
            label: 'Services', 
            icon: Box,
            subItems: [
                { path: '/admin/services/cards', label: 'Gestion des Cartes', icon: CreditCard },
                { path: '/admin/services/search-builder', label: 'Recherche Avancée', icon: Search },
                { path: '/admin/services/requests', label: 'Demandes', icon: ClipboardList },
            ]
        },
        { 
            label: 'Finances', 
            icon: Wallet,
            subItems: [
                { path: '/admin/finances', label: 'Revenus / Dons', icon: PieChart },
                { path: '/admin/expenses', label: 'Dépenses', icon: Receipt },
                { path: '/admin/budgets', label: 'Budgets', icon: Landmark },
                { path: '/admin/finances/accounts', label: 'Comptes', icon: Layers },
            ]
        },
        { 
            label: 'École Dominicale', 
            icon: BookOpen,
            subItems: [
                { path: '/admin/sunday-school', label: "Vue d'ensemble", icon: PieChart },
                { path: '/admin/sunday-school/classes', label: 'Classes', icon: GraduationCap },
                { path: '/admin/sunday-school/monitors', label: 'Moniteurs', icon: Users },
            ]
        },
        { 
            label: 'Gestion des Cultes', 
            icon: Cross,
            subItems: [
                { path: '/admin/worship', label: 'Tableau de bord', icon: PieChart },
                { path: '/admin/worship/builder/new', label: 'Nouveau Culte', icon: UserPlus },
            ]
        },
        { path: '/admin/events', icon: Calendar, label: 'Événements' },
        { path: '/admin/ceremonies', icon: ClipboardList, label: 'Cérémonies' },
        { path: '/admin/groups', icon: Network, label: 'Groupes & Ministères' },
        { path: '/admin/inventory', icon: Box, label: 'Inventaire' },
        { 
            label: 'Logistiques', 
            icon: Truck,
            subItems: [
                { path: '/admin/logistics', label: 'Dashboard', icon: PieChart },
                { path: '/admin/logistics/spaces', label: 'Espaces', icon: Home },
                { path: '/admin/logistics/resources', label: 'Ressources', icon: Box },
                { path: '/admin/logistics/reservations', label: 'Réservations', icon: Calendar },
                { path: '/admin/logistics/maintenance', label: 'Maintenance', icon: Briefcase },
                { path: '/admin/logistics/assignments', label: 'Affectations', icon: ClipboardList },
            ]
        },
    ];

    const formatTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${hours}:${minutes} - ${day}/${month}/${year}`;
    };

    return (
        <div className={`min-h-screen flex font-['Inter'] transition-colors ${darkMode ? 'dark bg-[#0a0a0a] text-white' : 'bg-[#fcfcfc] text-[#1a1a1a]'}`}>
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-[#0D0D0D] border-r border-gray-100 dark:border-white/5 transition-all duration-300 z-50 flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'hidden' : 'flex-1'}`}>
                        <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-[3px] flex items-center justify-center font-black text-gray-400 shrink-0">
                            {churchName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1 relative group/church">
                            <div className="max-w-[160px]">
                                <h2 className="text-sm font-black tracking-tighter truncate">ELYON 360</h2>
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest truncate block" title={churchName}>{churchName}</p>
                            </div>
                            
                            {/* Full name shows up on hover */}
                            <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-[#111C44] text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/church:opacity-100 group-hover/church:visible transition-all duration-300 z-[100] whitespace-nowrap shadow-2xl pointer-events-none border border-white/10">
                                {churchName}
                                <div className="absolute -top-1 left-4 w-2 h-2 bg-[#111C44] rotate-45 border-l border-t border-white/10"></div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[3px] text-gray-400 transition-all">
                        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto noscrollbar">
                    {menuItems.map((item, idx) => {
                        if (item.subItems) {
                            const isSubMenuOpen = openSubMenus[item.label];
                            const isParentActive = item.subItems.some(sub => location.pathname.startsWith(sub.path));
                            
                            return (
                                <div key={idx} className="space-y-1">
                                    <button 
                                        onClick={() => toggleSubMenu(item.label)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-[3px] transition-all group ${isParentActive ? 'bg-[#1a1f4d]/5 text-[#1a1f4d] dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon size={18} className={isParentActive ? 'text-[#1a1f4d] dark:text-white' : 'text-gray-400 group-hover:text-[#1a1f4d]'} />
                                            {!isSidebarCollapsed && <span className="text-[13px] font-bold">{item.label}</span>}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            isSubMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </button>
                                    
                                    {isSubMenuOpen && !isSidebarCollapsed && (
                                        <div className="pl-10 space-y-1 animate-fade-in">
                                            {item.subItems.map((sub, sIdx) => {
                                                const isSubActive = location.pathname === sub.path;
                                                return (
                                                    <Link
                                                        key={sIdx}
                                                        to={sub.path}
                                                        className={`flex items-center gap-3 px-4 py-2 rounded-[3px] text-[12px] font-bold transition-all ${isSubActive ? 'text-[#1a1f4d] bg-[#1a1f4d]/5 dark:text-white dark:bg-white/5' : 'text-gray-400 hover:text-[#1a1f4d] dark:hover:text-white'}`}
                                                    >
                                                        <sub.icon size={14} />
                                                        {sub.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={idx}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-[3px] transition-all group ${isActive ? 'bg-[#1a1f4d] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#1a1f4d]'} />
                                {!isSidebarCollapsed && <span className="text-[13px] font-bold">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 py-6 border-t border-gray-100 dark:border-white/5 space-y-1">
                    <Link to="/admin/settings" className="flex items-center gap-4 px-4 py-3 rounded-[3px] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 group transition-all">
                        <Settings size={18} className="text-gray-400 group-hover:text-[#1a1f4d]" />
                        {!isSidebarCollapsed && <span className="text-[13px] font-bold">Settings</span>}
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-[3px] text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 group transition-all text-left">
                        <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                        {!isSidebarCollapsed && <span className="text-[13px] font-bold">Deconection</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Header */}
                <header className="h-20 bg-white dark:bg-[#0D0D0D] border-b border-gray-100 dark:border-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
                    {/* Time & Date */}
                    <div className="text-[13px] font-bold text-[#1a1a1a] dark:text-white">
                        {formatTime(time)}
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 flex justify-center px-12">
                        <div className="relative w-full max-w-sm">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Recherche"
                                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f5] dark:bg-white/5 border-none rounded-full text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#1a1f4d]/10 transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="flex items-center gap-6">
                        {/* Language Toggle */}
                        <div className="flex items-center gap-2 text-[12px] font-bold">
                            <button onClick={() => setLanguage('fr')} className={language === 'fr' ? 'text-[#1a1a1a] dark:text-white' : 'text-gray-300'}>FR</button>
                            <span className="text-gray-200">|</span>
                            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'text-[#1a1a1a] dark:text-white' : 'text-gray-300'}>EN</button>
                        </div>

                        {/* Notifications */}
                        <button className="text-gray-400 hover:text-[#1a1f4d] dark:hover:text-white transition-colors relative">
                            <Bell size={18} />
                            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        </button>

                        {/* Dark Mode */}
                        <button onClick={toggleTheme} className="text-gray-400 hover:text-[#1a1f4d] dark:hover:text-white transition-colors">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Profile Section */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-white/10 group"
                            >
                                <div className="text-right hidden sm:block">
                                    <h4 className="text-[12px] font-black leading-none dark:text-white uppercase tracking-tight">{user.firstName} {user.lastName}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 truncate max-w-[120px]">{user.email}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform">
                                    {user.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={36} className="text-gray-300" />}
                                </div>
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-4 w-56 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-[3px] shadow-2xl py-2 z-50 animate-scale-in">
                                    <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 sm:hidden">
                                        <h4 className="text-[12px] font-black dark:text-white">{user.firstName} {user.lastName}</h4>
                                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                                    </div>
                                    <Link to="/admin/settings" className="flex items-center gap-3 px-6 py-3 text-[13px] font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                        <UserCircle size={16} /> Mon Profil
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                                        <LogOut size={16} /> Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Wrapper */}
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
