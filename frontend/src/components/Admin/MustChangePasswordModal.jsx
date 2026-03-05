import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthProvider';
import { useLanguage } from '../../context/LanguageContext';
import AlertModal from '../ChurchAlertModal';

const MustChangePasswordModal = ({ user }) => {
    const { t } = useLanguage();
    const { logout, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'success' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setAlert({ show: true, title: t('error'), message: t('passwords_not_matching', 'Les mots de passe ne correspondent pas'), type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            updateUser({ mustChangePassword: false });

            setAlert({
                show: true,
                title: t('success'),
                message: t('password_changed_success', 'Mot de passe mis à jour avec succès'),
                type: 'success'
            });
        } catch (err) {
            console.error("Change password error:", err);
            setAlert({
                show: true,
                title: t('error'),
                message: err.response?.data?.message || t('error_changing_password', 'Erreur lors du changement de mot de passe'),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user || !user.mustChangePassword) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Background Image like the image provided */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1466611653911-954ff2127cd8?q=80&w=2070&auto=format&fit=crop")' }}
            >
                <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative bg-white w-full max-w-[440px] shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-scale-in transition-all">
                <div className="p-10 pb-9">
                    {/* Microsoft Contoso Style Logo */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <div className="absolute w-[2px] h-full bg-[#00a1f1]"></div>
                            <div className="absolute h-[2px] w-full bg-[#ffbb00]"></div>
                        </div>
                        <div className="flex items-baseline font-sans">
                            <span className="text-[20px] font-semibold text-[#505050] tracking-tight mr-1">
                                {user.churchAcronym || 'CONTOSO'}
                            </span>
                            <span className="text-[20px] font-normal text-[#505050]/80">
                                demo
                            </span>
                        </div>
                    </div>

                    <div className="mb-6">
                        {/* User email block */}
                        <div className="text-[15px] font-normal text-[#1b1b1b] mb-4 flex items-center gap-2">
                            <span>{user.email}</span>
                        </div>

                        <h2 className="text-[24px] font-semibold text-[#1b1b1b] mb-4 leading-tight">
                            {t('update_your_password', 'Update your password')}
                        </h2>
                        <p className="text-[15px] text-[#1b1b1b] leading-[1.4] font-normal mb-8">
                            {t('must_change_password_desc', 'You need to update your password because this is the first time you are signing in, or because your password has expired.')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div className="relative border-b border-[#000000]/40 focus-within:border-[#0067b8] transition-colors">
                                <input
                                    type="password"
                                    name="currentPassword"
                                    required
                                    placeholder={t('current_password', 'Current password')}
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="w-full bg-transparent py-2 outline-none text-[15px] font-normal text-[#1b1b1b] placeholder-[#1b1b1b]/60"
                                />
                            </div>
                            <div className="relative border-b border-[#000000]/40 focus-within:border-[#0067b8] transition-colors">
                                <input
                                    type="password"
                                    name="newPassword"
                                    required
                                    placeholder={t('new_password', 'New password')}
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full bg-transparent py-2 outline-none text-[15px] font-normal text-[#1b1b1b] placeholder-[#1b1b1b]/60"
                                />
                            </div>
                            <div className="relative border-b border-[#000000]/40 focus-within:border-[#0067b8] transition-colors">
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    placeholder={t('confirm_password', 'Confirm password')}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-transparent py-2 outline-none text-[15px] font-normal text-[#1b1b1b] placeholder-[#1b1b1b]/60"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#0067b8] hover:bg-[#005da6] text-white px-9 py-2 text-[15px] font-normal transition-all active:scale-[0.98] disabled:opacity-50 min-w-[108px]"
                                >
                                    {loading ? '...' : t('sign_in', 'Sign in')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <AlertModal
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </div>
    );
};

export default MustChangePasswordModal;
