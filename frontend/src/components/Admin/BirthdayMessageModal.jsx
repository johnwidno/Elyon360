import { useState } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

export default function BirthdayMessageModal({ isOpen, onClose, recipient, recipients, mode = 'individual' }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [messageType, setMessageType] = useState('email');
    const [title, setTitle] = useState("Joyeux Anniversaire !");
    const [content, setContent] = useState("Bonjour {firstName}, toute la communauté vous souhaite un joyeux anniversaire !");
    const [status, setStatus] = useState({ show: false, message: '', type: 'success' });

    if (!isOpen) return null;

    const handleSend = async () => {
        setLoading(true);
        try {
            const targets = mode === 'bulk' ? recipients : [recipient];

            for (const target of targets) {
                const personalizedContent = content.replace(/{firstName}/g, target.firstName);
                await api.post('/communication/send-message', {
                    recipientId: target.id,
                    type: messageType,
                    title: title,
                    message: personalizedContent
                });
            }

            setStatus({
                show: true,
                message: mode === 'bulk' ? "Messages envoyés à tous !" : "Message envoyé !",
                type: 'success'
            });

            setTimeout(() => {
                onClose();
                setStatus({ show: false, message: '', type: 'success' });
            }, 1500);

        } catch (error) {
            console.error("Error sending message:", error);
            setStatus({ show: true, message: "Erreur lors de l'envoi.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {mode === 'bulk'
                                ? t('send_to_all_today', "Envoyer à tous (aujourd'hui)")
                                : t('send_birthday_wish', "Souhaiter un anniversaire")}
                        </h3>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {status.show && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {status.message}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Type Selection */}
                        <div className="flex gap-4 p-1 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => setMessageType('email')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${messageType === 'email' ? 'bg-white dark:bg-[#1A1A1A] text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                EMAIL
                            </button>
                            <button
                                onClick={() => setMessageType('sms')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${messageType === 'sms' ? 'bg-white dark:bg-[#1A1A1A] text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                SMS
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Objet / Titre</label>
                            <input
                                type="text"
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Message</label>
                            <textarea
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-xl text-[13px] font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-32 resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <p className="mt-2 text-[10px] text-gray-500 px-1 italic">
                                Astuce: Utilisez {"{firstName}"} pour personnaliser automatiquement le prénom.
                            </p>
                        </div>

                        {mode === 'bulk' && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-white/5">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Destinataires</p>
                                <p className="text-[12px] text-blue-700 dark:text-blue-300 font-medium">
                                    {recipients.length} membres fêtent leur anniversaire aujourd'hui.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-bold text-[13px] rounded-2xl hover:bg-gray-100 transition-all"
                        >
                            {t('cancel', 'Annuler')}
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="flex-2 py-4 bg-blue-600 text-white font-bold text-[13px] rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? t('sending', "Envoi...") : (mode === 'bulk' ? "Diffuser à tous" : "Envoyer")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
