import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageSquare, Users, BookOpen, HandHeart, CreditCard, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import TopBar from '../components/pwa/TopBar';
import BottomNav from '../components/pwa/BottomNav';

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
    { label: 'Evénements à venir', path: '/events' },
    { label: 'Demandes', path: '/requests' },
    { label: 'Communauté', path: '/community' },
    { label: 'Classe Dominicale', path: '/sunday-school' },
    { label: 'Sainte Sène', path: '/communion' },
    { label: 'Dons / Dimes', path: '/member/donations' },
    { label: 'Joindre un groupes', path: '/groups' },
    { label: 'Ma carte Membre', path: '/member/member-card' }
  ];

  return (
    <div className="app-shell">
      <div className="app-container">
        <TopBar title={getTitle()} onMenuClick={() => setIsMenuOpen(true)} />

        <main className="main-content">
          <Outlet />
        </main>

        <BottomNav />

        {/* Global Sidebar Menu */}
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
                      {user?.church?.name ? user.church.name.charAt(0).toUpperCase() + user.church.name.slice(1).toLowerCase() : 'Eglise de Dieu'}
                      <span className="ml-1 opacity-40 font-medium">({user?.church?.acronym || 'SIGLE'})</span>
                    </h2>
                  </div>
                  <button onClick={() => { setIsMenuOpen(false); setIsEspaceOpen(false); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white -mr-2 -mt-2"><X size={20} /></button>
                </div>

                <div className="flex-1 space-y-0 overflow-y-auto">
                  {menuItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                      className="w-full text-left py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between group"
                    >
                      <span className="text-base font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-8 space-y-4 text-right">
                  {/* Mon Espace with Submenu logic */}
                  <div className="border-b border-slate-50 dark:border-slate-800 pb-2">
                    {(() => {
                      // Safety parse for roles
                      let roles = [];
                      if (user?.role) {
                        if (Array.isArray(user.role)) {
                          roles = user.role;
                        } else if (typeof user.role === 'string') {
                          try {
                            roles = JSON.parse(user.role);
                            if (!Array.isArray(roles)) roles = [roles];
                          } catch (e) {
                            roles = user.role.split(',').map(r => r.trim());
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
                                // Single role logic
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
  );
};

export default PWALayout;
