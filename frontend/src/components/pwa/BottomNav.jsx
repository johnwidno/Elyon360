import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, List, Heart, Users, User } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const navItems = [
    { to: '/member', icon: Home, label: 'Acceuil' },
    { to: '/member/bible', icon: BookOpen, label: ' guide' },
    { to: '/member/worship', icon: List, label: 'Cultes' },
    { to: '/member/donations', icon: Heart, label: 'Don' },
    { to: '/member/chat', icon: Users, label: 'Chat' },
    { to: '/member/profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-50 transition-colors">
      {navItems.map((item) => {
        const isCurrentActive = location.pathname === item.to || (item.to === '/member' && location.pathname === '/member/');

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/member'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-0.5 transition-all duration-300 w-full
              ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}
            `}
          >
            {item.label === 'Profil' && user?.photo ? (
              <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${isCurrentActive ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}>
                <img src={getImageUrl(user.photo)} alt="Profil" className="w-full h-full object-cover" />
              </div>
            ) : (
              <item.icon size={22} strokeWidth={isCurrentActive ? 2.5 : 2} />
            )}
            <span className="text-[9px] font-bold text-center whitespace-nowrap">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
