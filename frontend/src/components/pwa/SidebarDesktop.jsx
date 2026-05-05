import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Church, 
  HandHeart, 
  Users, 
  GraduationCap, 
  Cross, 
  CreditCard, 
  MoreHorizontal,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const SidebarDesktop = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { label: 'Acceuil', path: '/member', icon: <Home size={22} /> },
    { label: 'Guide Biblique', path: '/member/bible', icon: <BookOpen size={22} /> },
    { label: 'Culte', path: '/member/worship', icon: <Church size={22} /> },
    { label: 'Don', path: '/member/donations', icon: <HandHeart size={22} /> },
    { label: 'Groupe & Chat', path: '/member/chat', icon: <Users size={22} /> },
    { label: 'Ecole Dominicale', path: '/member/sunday-school', icon: <GraduationCap size={22} /> },
    { label: 'Sainte scene', path: '/member/communion', icon: <Cross size={22} /> },
    { label: 'Carte Membre', path: '/member/member-card', icon: <CreditCard size={22} /> },
    { label: 'Autres', path: '/member/others', icon: <MoreHorizontal size={22} /> },
  ];

  const isActive = (path) => location.pathname === path;

  const [isEspaceOpen, setIsEspaceOpen] = React.useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 fixed left-0 top-0 z-[60] py-10 px-8 transition-colors duration-300">
      {/* ... Logo Section ... */}
      <div 
        onClick={onMenuClick}
        className="mb-12 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight uppercase">Elyon360</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">EDP</p>
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight mt-0.5">
          {user?.church?.name || "Eglise de Dieu de la Prophetie"}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 overflow-y-auto noscrollbar pr-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
              isActive(item.path) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'} transition-colors`}>
              {item.icon}
            </div>
            <span className={`text-[15px] font-semibold tracking-tight`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {/* Mon Espace / Switch Roles - Accordéon Dépliant */}
        {(() => {
          let roles = [];
          if (user?.role) {
            if (Array.isArray(user.role)) roles = user.role;
            else if (typeof user.role === 'string') {
              try { roles = JSON.parse(user.role); if (!Array.isArray(roles)) roles = [roles]; }
              catch (e) { roles = user.role.split(',').map(r => r.trim()); }
            }
          }
          const hasMultipleRoles = roles.length > 1;
          
          if (!hasMultipleRoles) return null;

          return (
            <div className="mb-2">
              <button 
                onClick={() => setIsEspaceOpen(!isEspaceOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={14} className="group-hover:text-blue-600" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Mon espace</span>
                </div>
                <div className={`transition-transform duration-300 ${isEspaceOpen ? 'rotate-90' : ''}`}>
                  <ChevronRight size={14} />
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${isEspaceOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-1 pb-2">
                  {roles.map((r, i) => {
                    const normalizedRole = r.toLowerCase();
                    const path = normalizedRole.includes('admin') ? '/admin' : '/member';
                    const isCurrentEspace = location.pathname.startsWith(path);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(path)}
                        className={`w-full text-left px-10 py-2 rounded-xl text-[13px] font-bold transition-all ${
                          isCurrentEspace 
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {normalizedRole === 'member' ? 'Espace membre' : `Espace ${r}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        <button 
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-4 px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all group/settings"
        >
          <div className="text-slate-400 group-hover/settings:text-blue-600 transition-colors">
            <Settings size={18} />
          </div>
          <span className="font-bold text-sm">Paramètres</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200 group"
        >
          <div className="text-rose-400 group-hover:text-rose-500">
            <LogOut size={18} />
          </div>
          <span className="text-sm font-bold">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarDesktop;
