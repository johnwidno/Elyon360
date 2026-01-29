import React, { useState } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';

const AttachmentModal = ({ isOpen, onClose, onSuccess, userId }) => {
    const { t } = useLanguage();
    const [type, setType] = useState('file'); // 'file' or 'link'
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('name', name);
            formData.append('type', type);

            if (type === 'file') {
                if (!file) {
                    alert(t('error_select_file', 'Veuillez sélectionner un fichier'));
                    setLoading(false);
                    return;
                }
                formData.append('file', file);
            } else {
                if (!url) {
                    alert(t('error_enter_link', 'Veuillez entrer un lien'));
                    setLoading(false);
                    return;
                }
                formData.append('url', url);
            }

            await api.post('/attachments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onSuccess();
            onClose();
            // Reset state
            setName('');
            setFile(null);
            setUrl('');
            setType('file');
        } catch (error) {
            console.error("Error adding attachment:", error);
            alert(error.response?.data?.message || t('error_saving', "Erreur lors de l'enregistrement"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 transition-all backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-transparent dark:border-white/5 animate-scale-in">
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-50 dark:border-white/5">
                    <h3 className="text-xl font-black text-[#2B3674] dark:text-white tracking-tight">
                        {t('add_attachment', 'Ajouter un attachement')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="flex bg-gray-50 dark:bg-black p-1.5 rounded-2xl gap-1">
                        <button
                            type="button"
                            onClick={() => setType('file')}
                            className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-xl transition-all ${type === 'file' ? 'bg-white dark:bg-[#1A1A1A] text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {t('file', 'Fichier')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('link')}
                            className={`flex-1 py-3 text-[11px] font-black tracking-widest rounded-xl transition-all ${type === 'link' ? 'bg-white dark:bg-[#1A1A1A] text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {t('link', 'Lien')}
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('attachment_name', 'Nom de l\'attachement')}</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-black border-2 border-transparent focus:border-indigo-500/20 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-white transition-all"
                                placeholder={t('enter_name_placeholder', 'Ex: Certificat de baptême')}
                            />
                        </div>

                        {type === 'file' ? (
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('file', 'Fichier')}</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="hidden"
                                        id="attachment-file-input"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    />
                                    <label
                                        htmlFor="attachment-file-input"
                                        className="flex flex-col items-center justify-center w-full min-h-[140px] px-6 py-10 bg-gray-50 dark:bg-black border-2 border-dashed border-gray-100 dark:border-white/5 hover:border-indigo-500/30 rounded-[2rem] cursor-pointer transition-all group"
                                    >
                                        <svg className="w-10 h-10 text-gray-300 group-hover:text-indigo-500 transition-colors mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-[12px] font-black text-gray-400 group-hover:text-indigo-600 transition-colors tracking-widest text-center">
                                            {file ? file.name : t('choose_file_instr', 'Cliquez pour uploader')}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2">PDF, Word, Excel, Images (Max 10MB)</p>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-widest ml-1">{t('url', 'Lien (URL)')}</label>
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border-2 border-transparent focus:border-indigo-500/20 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-white transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-[11px] font-black text-gray-400 tracking-widest hover:text-gray-600 transition-colors"
                        >
                            {t('cancel', 'Annuler')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? t('saving', 'Chargement...') : t('save', 'Enregistrer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttachmentModal;
