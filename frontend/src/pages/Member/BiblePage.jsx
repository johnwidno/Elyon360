import React from 'react';
import { Book, Search, ChevronRight, Bookmark, Headphones } from 'lucide-react';

const BiblePage = () => {
  const books = ['Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome'];

  return (
    <div className="p-6 flex flex-col gap-6 bg-white min-h-full">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Guide Bible</h2>
      
      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col gap-4 shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Book size={120} />
        </div>
        <div className="bg-white/20 self-start px-3 py-1 rounded-full text-[11px] font-black tracking-widest border border-white/20">
          Verset du jour
        </div>
        <p className="italic font-medium text-lg leading-relaxed z-10">
          "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle."
        </p>
        <div className="flex items-center justify-between z-10">
          <span className="font-black text-xs text-blue-200">Jean 3:16</span>
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><Bookmark size={16} /></button>
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><Headphones size={16} /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-black text-slate-900">Livres de la bible</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {books.map((book) => (
            <div key={book} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-blue-50 transition-all hover:shadow-sm">
              <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{book}</span>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BiblePage;
