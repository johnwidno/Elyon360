import React from 'react';
import { Home as HomeIcon, Activity, FileText, Megaphone, Heart, UserCircle, Moon } from 'lucide-react';

const MemberBottomNav = ({ activeTab, onTabClick, isDark }) => {
    const navItems = [
        { id: 'dashboard', icon: <HomeIcon size={28} />, path: '/member' },
        { id: 'activity', icon: <Activity size={28} />, path: '/member' },
        { id: 'requests', icon: <FileText size={28} />, path: '/member' },
        { id: 'news', icon: <Megaphone size={28} />, path: '/member' },
        { id: 'donations', icon: <Heart size={28} />, path: '/member' },
        { id: 'profile', icon: <UserCircle size={28} />, path: '#' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 z-[100]">
            {navItems.map((item) => (
                <button 
                    key={item.id}
                    onClick={() => onTabClick(item)} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full relative transition-all duration-300 ${item.id === activeTab ? 'text-[#4318FF] scale-110' : 'text-[#A3AED0] hover:text-[#4318FF]'}`}
                >
                    {item.id === activeTab && (
                        <div className="absolute top-4 w-12 h-12 bg-[#4318FF]/10 rounded-2xl -z-10" />
                    )}
                    {item.icon}
                </button>
            ))}
        </nav>
    );
};

export default MemberBottomNav;
