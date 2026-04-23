import React from 'react';
import { Bell, Search, Send, MoreVertical, Sun, Moon, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const TopBar = ({ title, onMenuClick }) => {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 z-50 flex items-center transition-all px-6">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Elyon360</h1>
          
          <div className="h-4 w-[1px] bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>
          
          <button 
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="text-[12px] font-black text-slate-900 dark:text-slate-400 hidden sm:block"
          >
            <span className="uppercase">FR/EN</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="text-[12px] font-black text-slate-900 dark:text-slate-400 sm:hidden pr-2 border-r border-slate-50 dark:border-slate-800 mr-1"
          >
            <span className="uppercase">FR/EN</span>
          </button>

          <button className="relative p-1.5">
            <Bell size={18} className="text-slate-900 dark:text-white" />
            <span className="absolute top-1 right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[7px] font-black w-3 h-3 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
              0
            </span>
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-1.5 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
            <Send size={18} />
          </button>

          <button onClick={onMenuClick} className="p-1.5 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
