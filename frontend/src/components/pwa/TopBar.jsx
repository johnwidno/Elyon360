import React from 'react';
import { Bell, Search, Send, MoreVertical, Sun, Moon, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMember } from '../../context/MemberContext';
import api from '../../api/axios';

const SearchResultsContent = ({ searchResults, isSearching, searchQuery, navigate, setShowResults, getImageUrl }) => (
  <div className="flex flex-col gap-6">
    {(searchResults.events.length > 0 || isSearching) && (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Événements</h4>
        {isSearching ? (
          <div className="p-2 text-xs text-slate-400">Recherche...</div>
        ) : (
          <div className="flex flex-col gap-1">
            {searchResults.events.map(event => (
              <button
                key={event.id}
                onClick={() => { navigate(`/member/events/${event.id}`); setShowResults(false); }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{event.title}</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'À venir'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )}

    {(searchResults.members.length > 0 || isSearching) && (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Membres</h4>
        {isSearching ? (
          <div className="p-2 text-xs text-slate-400">Recherche...</div>
        ) : (
          <div className="flex flex-col gap-1">
            {searchResults.members.map(member => (
              <button
                key={member.id}
                onClick={() => { navigate(`/member/profile/${member.id}`); setShowResults(false); }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {member.photo ? (
                    <img src={getImageUrl(member.photo)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-slate-200 text-slate-500">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.firstName} {member.lastName}</span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">{member.church?.name || 'Membre'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )}

    {!isSearching && searchResults.members.length === 0 && searchResults.events.length === 0 && searchQuery.length > 1 && (
      <div className="p-4 text-center text-sm text-slate-400">
        Aucun résultat pour "{searchQuery}"
      </div>
    )}
  </div>
);

const TopBar = ({ title, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { 
    activeSegment, setActiveSegment, 
    searchQuery, setSearchQuery,
    searchResults, isSearching,
    showResults, setShowResults
  } = useMember();

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const toSentenceCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 z-50 flex flex-col transition-all">
      {/* Main Row */}
      <div className="h-16 md:h-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 min-w-fit">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase lg:hidden">Elyon360</h1>
          <div className="h-4 w-[1px] bg-slate-100 dark:bg-slate-800 hidden lg:block"></div>
        </div>

        {/* Center Navigation - Desktop */}
        <div className="hidden lg:flex items-center gap-8 ml-8">
          <button 
            onClick={() => { setActiveSegment('membre'); navigate('/member'); }}
            className={`text-lg lg:text-xl font-black transition-all relative ${
              activeSegment === 'membre' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-400'
            }`}
          >
            Membre
            {activeSegment === 'membre' && (
              <motion.div 
                layoutId="tab-active-desktop" 
                className="absolute -bottom-7 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" 
              />
            )}
          </button>
          <span className="text-slate-300 text-xl font-light">|</span>
          <button 
            onClick={() => { setActiveSegment('communaute'); navigate('/member'); }}
            className={`text-lg lg:text-xl font-black transition-all relative ${
              activeSegment === 'communaute' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-400'
            }`}
          >
            Communauté
            {activeSegment === 'communaute' && (
              <motion.div 
                layoutId="tab-active-desktop" 
                className="absolute -bottom-7 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" 
              />
            )}
          </button>
        </div>

        {/* Right Actions & Search */}
        <div className="flex items-center gap-3 md:gap-6 flex-1 justify-end">
          {/* Search Bar - Now on the right */}
          <div className="hidden lg:block relative group min-w-[280px] max-w-[400px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Recherche"
              value={searchQuery}
              onChange={(e) => { 
                setSearchQuery(e.target.value); 
                if (location.pathname !== '/member' && e.target.value.length > 0) navigate('/member'); 
              }}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl py-2 pl-11 pr-4 text-app-meta font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-800 shadow-sm transition-all"
            />

            {/* Search Results Dropdown (Desktop) */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[100] max-h-[60vh] overflow-y-auto noscrollbar"
                >
                  <div className="p-4">
                    <SearchResultsContent 
                      searchResults={searchResults} 
                      isSearching={isSearching} 
                      searchQuery={searchQuery} 
                      navigate={navigate} 
                      setShowResults={setShowResults}
                      getImageUrl={getImageUrl}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Icons Group */}
          <div className="hidden lg:flex items-center gap-6">
            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Send size={22} />
            </button>
            <button 
              onClick={toggleTheme}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button className="relative text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            
            <div 
              onClick={() => navigate('/member/profile')}
              className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-50 dark:border-slate-800 cursor-pointer hover:border-slate-200 transition-all"
            >
              {user?.photo ? (
                <img src={getImageUrl(user.photo)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold text-xs uppercase">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Actions Mobile */}
          <div className="lg:hidden flex items-center gap-1">
            <button 
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="text-[10px] font-black p-2 text-slate-500 pr-3 border-r border-slate-50 mr-1"
            >
              {language.toUpperCase()}
            </button>
            <button className="p-2 text-slate-900 dark:text-white">
              <Bell size={18} />
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 ${theme === 'dark' ? 'text-amber-400' : 'text-slate-900'}`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 text-blue-600">
              <Send size={18} />
            </button>
            <button onClick={onMenuClick} className="p-2 text-slate-900 dark:text-white">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Row (Persistent) */}
      <div className="lg:hidden px-4 pb-4 flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setActiveSegment('membre'); navigate('/member'); }}
            className={`text-app-body font-black transition-all relative ${
              activeSegment === 'membre' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-400'
            }`}
          >
            Membre
            {activeSegment === 'membre' && (
              <motion.div 
                layoutId="tab-active-mobile" 
                className="absolute -bottom-3 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" 
              />
            )}
          </button>
          <button 
            onClick={() => { setActiveSegment('communaute'); navigate('/member'); }}
            className={`text-app-body font-black transition-all relative ${
              activeSegment === 'communaute' 
                ? 'text-slate-900 dark:text-white' 
                : 'text-slate-400'
            }`}
          >
            Communauté
            {activeSegment === 'communaute' && (
              <motion.div 
                layoutId="tab-active-mobile" 
                className="absolute -bottom-3 left-0 right-0 h-1 bg-slate-900 dark:bg-white rounded-full" 
              />
            )}
          </button>
        </div>
        
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Recherche membre, événement..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (location.pathname !== '/member' && e.target.value.length > 0) navigate('/member');
            }}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-11 pr-4 text-app-meta font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-200 dark:focus:ring-slate-800 shadow-sm transition-all"
          />
          
          {/* Mobile Search Results Dropdown */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[100] max-h-[60vh] overflow-y-auto noscrollbar"
              >
                <div className="p-4">
                  <SearchResultsContent 
                    searchResults={searchResults} 
                    isSearching={isSearching} 
                    searchQuery={searchQuery} 
                    navigate={navigate} 
                    setShowResults={setShowResults}
                    getImageUrl={getImageUrl}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
