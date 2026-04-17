import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../auth/AuthProvider';

const MemberHeader = ({ onMenuClick, getImageUrl, userInitials }) => {
    const { user: authUser } = useAuth();

    return (
        <header className="sticky top-0 z-[1000] flex items-center justify-between px-4 h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            {/* Left side: Brand with Hamburger for Mobile */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={onMenuClick} 
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                    <Menu size={24} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col leading-tight cursor-default">
                    <div className="flex items-center gap-1 font-black text-[15px] sm:text-[16px]">
                        <span className="text-[#1e1b4b] dark:text-white whitespace-nowrap">Elyon Syst</span>
                        <span className="text-orange-500">360</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">EDP</span>
                </div>
            </div>

            {/* Right side: Language, Notifications, Profile */}
            <div className="flex items-center gap-3 sm:gap-6">
                {/* Vertical Separator */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Language (FR/EN) */}
                <span className="text-[11px] sm:text-[12px] font-black tracking-tighter text-[#1e1b4b] dark:text-white uppercase cursor-pointer">
                    FR/EN
                </span>

                {/* Notifications Bell */}
                <div className="relative cursor-pointer group p-1">
                    <Bell size={20} className="text-[#4f46e5] dark:text-indigo-400 stroke-[2.5]" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white">0</span>
                </div>

                {/* Profile Photo */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 transition-transform active:scale-95 cursor-pointer">
                    {authUser?.photo ? (
                        <img src={getImageUrl(authUser.photo)} alt="User Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-[10px] font-black uppercase">
                            {userInitials}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default MemberHeader;
