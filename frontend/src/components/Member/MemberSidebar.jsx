import React from 'react';
import { X, LogOut, LayoutDashboard, UserCircle, Calendar, Activity, FileText, Heart, BookOpen, Music, Users, Building2, CreditCard, Droplets } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const MemberSidebar = ({ isOpen, onClose, onNavClick, logout }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'dashboard', label: t('overview', "Vue d'ensemble"), icon: <LayoutDashboard size={18} />, path: '/member' },
        { id: 'profile', label: t('my_profile', 'Mon profil'), icon: <UserCircle size={18} />, path: '/member' },
        { id: 'events', label: t('upcoming_events', 'Événements à venir'), icon: <Calendar size={18} />, path: '/member' },
        { id: 'activity', label: t('recent_activity', 'Activité récente'), icon: <Activity size={18} />, path: '/member' },
        { id: 'requests', label: t('my_requests', 'Mes demandes'), icon: <FileText size={18} />, path: '/member' },
        { id: 'donations', label: t('donation_history', 'Historique des dons'), icon: <Heart size={18} />, path: '/member' },
        { id: 'communion', label: t('holy_communion', 'Sainte Cène'), icon: <Droplets size={18} />, path: '/member' },
        { id: 'sunday_school', label: t('sunday_school', 'École du dimanche'), icon: <BookOpen size={18} />, path: '/member' },
        { id: 'worship', label: t('worship', 'Cultes & Événements'), icon: <Music size={18} />, path: '/member' },
        { id: 'groups', label: t('groups', 'Groupes'), icon: <Users size={18} />, path: '/member' },
        { id: 'ministries', label: t('ministries', 'Ministères'), icon: <Building2 size={18} />, path: '/member' },
        { id: 'my_card', label: t('my_member_card', 'Ma carte membre'), icon: <CreditCard size={18} />, path: '/member' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#080c14] text-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-[#151b28]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-10 border-b border-[#151b28]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-1.5 font-black text-xl">
                                <span>Elyon Syst</span>
                                <span className="text-[#F97316]">360</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 tracking-[0.2em] mt-0.5">EDP • 2024</span>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={24} /></button>
                    </div>
                </div>
                <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavClick(item)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-[14px] transition-all text-slate-400 hover:text-white hover:bg-white/5`}
                        >
                            <div className="p-1.5 rounded-lg bg-slate-800/50">
                                {item.icon}
                            </div>
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="p-6 border-t border-[#151b28]">
                    <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-4 text-rose-400 font-bold hover:bg-rose-500/10 rounded-xl transition-all">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberSidebar;
