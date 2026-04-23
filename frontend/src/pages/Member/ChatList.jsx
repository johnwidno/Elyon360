import React, { useState } from 'react';
import { Search, Send, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatList = () => {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'groups'
  
  const chats = [
    { id: 1, name: 'Pasteur Samuel', lastMsg: 'Que Dieu vous bénisse !', time: '14:20', unread: 2, avatar: 'PS' },
    { id: 2, name: 'Sœur Marie', lastMsg: 'Merci pour le verset.', time: 'Hier', unread: 0, avatar: 'SM' },
    { id: 3, name: 'Frère Jean', lastMsg: 'À dimanche !', time: 'Lundi', unread: 0, avatar: 'FJ' },
  ];

  const groups = [
    { id: 101, name: 'Groupe de Louange', lastMsg: 'Répétition à 18h.', time: '10:05', unread: 5, avatar: 'GL' },
    { id: 102, name: 'Jeunesse Elyon', lastMsg: 'Sortie prévue ce samedi.', time: 'Hier', unread: 0, avatar: 'JE' },
  ];

  const list = activeTab === 'chats' ? chats : groups;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 flex flex-col gap-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher une conversation..."
            className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-6 text-base font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl h-12">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 rounded-xl flex items-center justify-center gap-2 text-app-body font-black transition-all ${activeTab === 'chats' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <MessageCircle size={16} /> Discussions
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`flex-1 rounded-xl flex items-center justify-center gap-2 text-app-body font-black transition-all ${activeTab === 'groups' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Users size={16} /> Groupes
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto noscrollbar px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((chat) => (
            <motion.div 
              key={chat.id}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-50 hover:bg-slate-50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                {chat.avatar}
              </div>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-app-title truncate pr-2">{chat.name}</h4>
                  <span className="text-app-meta font-bold text-slate-400 shrink-0">{chat.time}</span>
                </div>
                <p className="text-app-body text-slate-500 font-medium truncate pr-4">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-app-micro font-black text-white shadow-lg shadow-blue-200 shrink-0">
                  {chat.unread}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
