import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Heart, CreditCard, Landmark, Phone, ArrowRight, 
  CheckCircle2, Loader2, ChevronLeft, HandHeart,
  TrendingUp, Star, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MemberDonations_PWA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('selection'); // selection, amount, method, confirmation
  
  const donationTypes = [
    { id: 'tithe', label: 'Dîmes', icon: Star, color: 'bg-amber-500', desc: '10% de vos revenus pour soutenir la vision.' },
    { id: 'offering', label: 'Offrandes', icon: HandHeart, color: 'bg-blue-500', desc: 'Soutien libre aux activités de l\'église.' },
    { id: 'special', label: 'Don Spécial', icon: Heart, color: 'bg-rose-500', desc: 'Projets spécifiques ou aide humanitaire.' }
  ];

  const paymentMethods = [
    { id: 'moncash', label: 'MonCash', icon: Phone, color: 'text-red-600', desc: 'Paiement mobile rapide' },
    { id: 'card', label: 'Carte Bancaire', icon: CreditCard, color: 'text-blue-600', desc: 'Visa, Mastercard, etc.' },
    { id: 'transfer', label: 'Virement', icon: Landmark, color: 'text-emerald-600', desc: 'Virement bancaire direct' }
  ];

  const handleNext = () => {
    if (step === 'selection') setStep('amount');
    else if (step === 'amount') setStep('method');
    else if (step === 'method') setStep('confirmation');
  };

  const handleBack = () => {
    if (step === 'amount') setStep('selection');
    else if (step === 'method') setStep('amount');
    else if (step === 'confirmation') setStep('method');
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors pb-32">
      <div className="p-6 max-w-lg mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Dons & Dîmes</h1>
          <div className="w-10"></div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div 
              key="selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Quel type de don souhaitez-vous faire ?</h2>
                <p className="text-slate-400 text-sm font-medium">Votre générosité soutient nos missions.</p>
              </div>

              <div className="space-y-4">
                {donationTypes.map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => { setSelectedType(type); handleNext(); }}
                    className="w-full text-left p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-blue-500/30 transition-all group flex items-center gap-5"
                  >
                    <div className={`${type.color} p-4 rounded-2xl text-white shadow-lg shadow-${type.color.split('-')[1]}-500/20`}>
                      <type.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 dark:text-white text-base">{type.label}</h3>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed">{type.desc}</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'amount' && (
            <motion.div 
              key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Entrez le montant</h2>
                <p className="text-slate-400 text-sm font-medium">Pour : <span className="text-blue-600 font-bold">{selectedType?.label}</span></p>
              </div>

              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
                <input 
                  autoFocus
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 pl-12 text-4xl font-black text-slate-900 dark:text-white border-none outline-none focus:ring-2 ring-blue-500/20"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['10', '50', '100', '500'].map(val => (
                  <button 
                    key={val} 
                    onClick={() => setAmount(val)}
                    className="py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                  >
                    ${val}
                  </button>
                ))}
                <button className="col-span-2 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20" onClick={handleNext}>Continuer</button>
              </div>
            </motion.div>
          )}

          {step === 'method' && (
            <motion.div 
              key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Mode de paiement</h2>
                <p className="text-slate-400 text-sm font-medium">Montant : <span className="text-blue-600 font-bold">${amount}</span></p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button 
                    key={method.id}
                    onClick={handleNext}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-5 hover:bg-white dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                      <method.icon className={method.color} size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm">{method.label}</h3>
                      <p className="text-slate-400 text-[10px] font-medium">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'confirmation' && (
            <motion.div 
              key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12 space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Merci pour votre don !</h2>
                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                  Votre contribution de <span className="text-emerald-600 font-bold">${amount}</span> a été reçue avec gratitude.
                </p>
              </div>
              <button 
                onClick={() => navigate('/member')}
                className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Retour à l'accueil
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-center gap-2 opacity-30">
          <ShieldCheck size={16} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paiement 100% sécurisé</span>
        </div>

      </div>
    </div>
  );
};

export default MemberDonations_PWA;
