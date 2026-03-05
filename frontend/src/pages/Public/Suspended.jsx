import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CreditCard, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const Suspended = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f172a] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-white dark:bg-[#1e293b] rounded-[40px] shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                <div className="p-8 sm:p-12 text-center">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <ShieldAlert className="text-red-600 w-10 h-10" />
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                        Accès Restreint
                    </h1>

                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed">
                        Le compte de l'institution <span className="text-indigo-600 font-bold">"{user?.churchName || 'votre église'}"</span> est temporairement suspendu en raison d'un abonnement expiré.
                    </p>

                    <div className="space-y-4 mb-10">
                        <div className="p-6 bg-gray-50 dark:bg-[#0f172a] rounded-[32px] border border-gray-100 dark:border-gray-800 text-left flex items-start space-x-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mt-1">
                                <AlertCircle className="text-indigo-600 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Pourquoi ce blocage ?</h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                    Afin de maintenir la qualité de nos services et l'hébergement de vos données, un plan actif est requis.
                                    Vos données sont en sécurité et seront à nouveau accessibles dès le renouvellement.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => window.location.href = '/login'} // Or specific renewal link if available
                            className="flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-bold text-sm shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 transition-all group"
                        >
                            <CreditCard size={18} />
                            <span>Renouveler le Plan</span>
                            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                        </button>

                        <button
                            onClick={logout}
                            className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-[24px] font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Déconnexion
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-50 dark:border-gray-800">
                        <div className="flex items-center justify-center space-x-4 text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer">
                            <Mail size={14} />
                            <span>Contacter le support ElyonSys 360</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Suspended;
