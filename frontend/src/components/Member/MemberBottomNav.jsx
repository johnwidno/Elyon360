import React from 'react';
import { Home as HomeIcon, Activity, FileText, Megaphone, Heart, UserCircle, Moon } from 'lucide-react';

const MemberBottomNav = ({ activeTab, onTabClick, isDark }) => {
    const navItems = [
        { id: 'dashboard', icon: <HomeIcon size={26} />, path: '/member' },
        { id: 'activity', icon: <Activity size={26} />, path: '/member' },
        { id: 'requests', icon: <FileText size={26} />, path: '/member' },
        { id: 'news', icon: <Megaphone size={26} />, path: '/member' },
        { id: 'donations', icon: <Heart size={26} />, path: '/member' },
        { id: 'profile', icon: <UserCircle size={26} />, path: '#' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-[#080c14] border-t border-slate-100 dark:border-white/5 rounded-t-[2rem] shadow-lg flex items-center justify-around px-5 z-[50]">
            {navItems.map((item) => (
                <button 
                    key={item.id}
                    onClick={() => onTabClick(item)} 
                    className={`transition-all ${item.id === activeTab ? 'text-[#4318FF] scale-110' : 'text-[#A3AED0] hover:text-[#4318FF]'}`}
                >
                    {item.id === activeTab && (
                        <div className="absolute top-0 w-10 h-10 bg-[#4318FF]/5 rounded-xl -z-10" />
                    )}
                    {item.icon}
                </button>
            ))}
        </nav>
    );
};

export default MemberBottomNav;
