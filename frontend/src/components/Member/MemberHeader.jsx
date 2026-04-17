import React from 'react';
import { Menu, Bell, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';

const MemberHeader = ({ onMenuClick, getImageUrl, userInitials }) => {
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user: authUser } = useAuth();
    const isDark = theme === 'dark';

    return (
        <header className="sticky top-0 z-[1000] flex items-center justify-between px-5 h-16 bg-white/95 dark:bg-black/95 border-b border-slate-50 dark:border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="p-1">
                    <Menu size={28} className="text-[#1B2559] dark:text-white" />
                </button>
                <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1 font-black text-[18px]">
                        <span className="text-[#1B2559] dark:text-white">Elyon Syst</span>
                        <span className="text-[#F97316]">360</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1B2559]/60 dark:text-slate-500 tracking-[0.1em] -mt-0.5">EDP</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="text-[12px] font-black tracking-widest text-[#4318FF] dark:text-indigo-400 uppercase hidden sm:block">FR/EN</button>
                <button onClick={toggleTheme} className="p-2 bg-[#F4F7FE] dark:bg-slate-900 rounded-full text-[#4318FF] dark:text-indigo-400 transition-all hover:scale-105">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="relative">
                    <div className="w-9 h-9 bg-[#F4F7FE] dark:bg-slate-900 rounded-full flex items-center justify-center text-[#4318FF]">
                       <Bell size={20} />
                    </div>
                    <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-[8px] font-black text-white">0</span>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-100">
                     {authUser?.photo ? (
                         <img src={getImageUrl(authUser.photo)} alt="" className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center bg-[#4318FF] text-white text-[12px] font-black">{userInitials}</div>
                     )}
                </div>
            </div>
        </header>
    );
};

export default MemberHeader;
