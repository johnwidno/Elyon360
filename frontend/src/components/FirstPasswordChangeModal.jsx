import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../context/LanguageContext';

const FirstPasswordChangeModal = () => {
    const { user, logout, updateUser } = useAuth();
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user?.mustChangePassword) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError(t('passwords_not_matching', 'Les mots de passe ne correspondent pas.'));
            return;
        }

        if (newPassword.length < 6) {
            setError(t('password_too_short', 'Le mot de passe doit contenir au moins 6 caractères.'));
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/change-password', {
                currentPassword,
                newPassword
            });
            // Update local user state
            updateUser({ mustChangePassword: false });
        } catch (err) {
            setError(err.response?.data?.message || t('error_changing_password', 'Erreur lors du changement de mot de passe.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-gray-900/90 backdrop-blur-2xl flex items-center justify-center p-8 overflow-y-auto noscrollbar">
            <div className="bg-white dark:bg-[#080808] w-full max-w-xl rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/5 relative overflow-hidden animate-scale-in">
                {/* Visual Flair */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="text-center mb-12">
                    <div className="w-100 h2-10 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <svg className="w-10 h-15 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-400 dark:text-white tracking-tight leading-none mb-4 uppercase">{t('secure_your_account', 'Sécurisez votre compte')}</h2>
                    <p className="text-[14px] text-gray-400 font-bold tracking-widest Sentence case mb-2">{t('password_change_required', 'Changement de mot de passe requis')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600 font-medium max-w-sm mx-auto leading-relaxed">{t('first_login_notice', 'Pour votre sécurité, vous devez changer votre mot de passe temporaire avant de continuer.')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                    {error && (
                        <div className="p-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] shrink-0">✕</div>
                            <p className="text-[12px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[14px] font-black text-gray-600 Sentence case tracking-[0.1em] ml-2 mb-2 block">{t('current_password', 'Mot de passe actuel')}</label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/40 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-black p-3 rounded-[1rem] text-[15px] font-bold text-gray-900 dark:text-white transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        <div className="space-y-2">
                            <label className="text-[14px] font-black text-gray-600 Sentence case tracking-[0.1em] ml-2 mb-2 block">{t('new_password', 'Nouveau mot de passe')}</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/40 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-black p-3 rounded-[1rem] text-[15px] font-bold text-gray-900 dark:text-white transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[14px] font-black text-gray-600 Sentence case tracking-[0.1em] ml-2 mb-2 block">{t('confirm_password', 'Confirmer')}</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/40 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-black p-3 rounded-[1rem] text-[15px] font-bold text-gray-900 dark:text-white transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-[1rem] text-[14px] font-black Sentence case tracking-[0.15em] hover:bg-indigo-700 shadow-2xl shadow-indigo-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? t('processing', 'Traitement...') : t('update_and_continue', 'Mettre à jour & Continuer')}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            className="w-full py-2 text-gray-400 hover:text-gray-900 dark:hover:text-white text-[14px] font-black Sentence case tracking-[0.2em] transition-all"
                        >
                            {t('logout_and_cancel', 'Se déconnecter & Annuler')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirstPasswordChangeModal;
