import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageSquare, Users, BookOpen, HandHeart, CreditCard, UserPlus, FileText, ChevronRight, Home, Church, MoreVertical } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import TopBar from '../components/pwa/TopBar';
import BottomNav from '../components/pwa/BottomNav';
import SidebarDesktop from '../components/pwa/SidebarDesktop';

import { MemberProvider } from '../context/MemberContext';

const PWALayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/member' || path === '/member/') return 'ElyonSys';
    if (path.includes('/bible')) return 'Bible';
    if (path.includes('/worship')) return 'Cultes';
    if (path.includes('/donations')) return 'Dons';
    if (path.includes('/chat')) return 'Messages';
    if (path.includes('/profile')) return 'Mon Profil';
    return 'ElyonSys';
  };

  const [isEspaceOpen, setIsEspaceOpen] = React.useState(false);

  const menuItems = [
    { label: 'Acceuil', path: '/member', icon: <Home size={18} /> },
    { label: 'Guide Biblique', path: '/member/bible', icon: <BookOpen size={18} /> },
    { label: 'Culte', path: '/member/worship', icon: <Church size={18} /> },
    { label: 'Don', path: '/member/donations', icon: <HandHeart size={18} /> },
    { label: 'Groupe & Chat', path: '/member/chat', icon: <Users size={18} /> },
    { label: 'Ecole Dominicale', path: '/member/sunday-school', icon: <BookOpen size={18} /> },
    { label: 'Sainte scene', path: '/member/communion', icon: <HandHeart size={18} /> },
    { label: 'Carte Membre', path: '/member/member-card', icon: <CreditCard size={18} /> },
    { label: 'Autres', path: '/member/others', icon: <MoreVertical size={18} /> },
  ];

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
  };

  return (
    <MemberProvider>
      <div className="app-shell lg:flex-row lg:items-start lg:justify-start">
        {/* Sidebar Desktop - Hidden on Mobile */}
        <SidebarDesktop onMenuClick={() => setIsMenuOpen(true)} />

        <div className="app-container lg:ml-72 lg:w-[calc(100%-18rem)] transition-all">
          <TopBar title={getTitle()} onMenuClick={() => setIsMenuOpen(true)} />

          <main className="main-content lg:pt-24 pt-44 transition-all">
            <div className="w-full px-2 lg:px-6">
              <Outlet />
            </div>
          </main>

          <div className="lg:hidden">
            <BottomNav />
          </div>

          {/* Global Sidebar Menu (Mobile) */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setIsMenuOpen(false); setIsEspaceOpen(false); }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                />
                <motion.div
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-slate-900 z-[101] shadow-2xl flex flex-col p-6"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-0.5">
                      <p className="text-app-micro font-light text-slate-400 tracking-widest uppercase">Elyon 360</p>
                      <h2 className="text-app-body font-black text-slate-900 dark:text-white leading-tight">
                        {user?.church?.name 
                          ? toSentenceCase(user.church.name) 
                          : 'ElyonSys'}
                        <span className="ml-1 opacity-40 font-medium">({user?.church?.acronym || '360'})</span>
                      </h2>
                    </div>
                    <button onClick={() => { setIsMenuOpen(false); setIsEspaceOpen(false); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white -mr-2 -mt-2"><X size={20} /></button>
                  </div>

                  <div className="flex-1 space-y-0 overflow-y-auto noscrollbar">
                    {menuItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                        className="w-full text-left py-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-all">
                          {item.icon}
                        </div>
                        <span className="text-base font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                        <ChevronRight size={16} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-8 space-y-4 text-right">
                    <div className="border-b border-slate-50 dark:border-slate-800 pb-2">
                      {(() => {
                        let roles = [];
                        if (user?.role) {
                          if (Array.isArray(user.role)) {
                            roles = user.role;
                          } else if (typeof user.role === 'string') {
                            try {
                              if (Array.isArray(user.role)) {
                                roles = user.role;
                              } else {
                                roles = JSON.parse(user.role);
                                if (!Array.isArray(roles)) roles = [roles];
                              }
                            } catch (e) {
                              roles = typeof user.role === 'string' ? user.role.split(',').map(r => r.trim()) : [user.role];
                            }
                          }
                        }
                        const hasMultipleRoles = roles.length > 1;
                        return (
                          <>
                            <button
                              onClick={() => {
                                if (hasMultipleRoles) {
                                  setIsEspaceOpen(!isEspaceOpen);
                                } else {
                                  const primaryRole = roles[0] || 'member';
                                  const path = primaryRole.toLowerCase().includes('admin') ? '/admin' : '/member';
                                  navigate(path);
                                  setIsMenuOpen(false);
                                }
                              }}
                              className="text-base font-bold text-slate-900 dark:text-white opacity-80 flex items-center justify-end gap-2 w-full"
                            >
                              Mon espace
                              {hasMultipleRoles && (
                                <motion.span animate={{ rotate: isEspaceOpen ? 180 : 0 }}>▾</motion.span>
                              )}
                            </button>
                            <AnimatePresence>
                              {isEspaceOpen && hasMultipleRoles && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-2 space-y-2 pr-4"
                                >
                                  {roles.map((r, i) => {
                                    const normalizedRole = r.toLowerCase();
                                    const label = normalizedRole === 'member' ? 'Espace membre' :
                                      normalizedRole.includes('admin') ? 'Espace admin' :
                                        `Espace ${r}`;
                                    const path = normalizedRole.includes('admin') ? '/admin' : '/member';
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => { navigate(path); setIsMenuOpen(false); setIsEspaceOpen(false); }}
                                        className="block w-full text-right text-app-meta font-black text-blue-600 hover:text-blue-700"
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        );
                      })()}
                    </div>
                    <div className="border-b border-slate-50 dark:border-slate-800 pb-2">
                      <button
                        onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                        className="text-base font-bold text-slate-900 dark:text-white opacity-80"
                      >
                        Paramètres
                      </button>
                    </div>
                    <div className="pb-2">
                      <button
                        onClick={() => { logout(); setIsMenuOpen(false); }}
                        className="text-base font-bold text-rose-500 opacity-80"
                      >
                        Quitter
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MemberProvider>
  );
};


export default PWALayout;
