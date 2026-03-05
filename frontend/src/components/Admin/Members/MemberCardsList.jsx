import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import ConfirmModal from '../../ConfirmModal'; // Ensure this matches your project structure
import MemberCardGeneratorModal from './MemberCardGeneratorModal';

const MemberCardsList = ({ memberId, member }) => {
    const { t } = useLanguage();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [generatorData, setGeneratorData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const fetchCards = async () => {
        try {
            const res = await api.get(`/member-cards/user/${memberId}`);
            setCards(res.data);
        } catch (error) {
            console.error("Error fetching member cards:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) fetchCards();
    }, [memberId]);

    const handleDelete = async () => {
        if (!confirmModal.id) return;
        try {
            await api.delete(`/member-cards/${confirmModal.id}`);
            setCards(prev => prev.filter(c => c.id !== confirmModal.id));
        } catch (error) {
            console.error("Error deleting member card:", error);
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <p className="text-[11px] font-black text-gray-400">{t('member_cards_history', 'Historique des cartes membre')}</p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setGeneratorData(null); setShowGenerator(true); }}
                        className="text-[11px] font-bold text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                    >
                        ⚙️ {t('generate_card', 'Générer une carte')}
                    </button>
                    <button
                        onClick={() => { setEditData(null); setViewMode(false); setShowModal(true); }}
                        className="text-[11px] font-bold text-stripe-blue hover:underline flex items-center gap-1"
                    >
                        + {t('give_card', 'Donner une carte (manuel)')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600 font-medium text-[13px] animate-pulse transition-colors">{t('loading')}</div>
            ) : cards.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-700 font-medium text-[13px] bg-gray-50/50 dark:bg-white/5 rounded-[1.5rem] transition-colors">
                    {t('no_cards', 'Aucune carte membre répertoriée.')}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-black/40">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('card_number', 'Num. Carte')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('received_date', 'Reçu le')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('status', 'Statut')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 hidden sm:table-cell">{t('description', 'Description')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                            {cards.map((card) => (
                                <tr key={card.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                        {card.cardNumber}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {card.issueDate}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${card.status === 'Active' ? 'bg-green-50 text-green-600' :
                                            card.status === 'Inactive' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {t(card.status?.toLowerCase()) || card.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="text-gray-500 dark:text-gray-400 text-[11px]">{card.description || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {card.templateId && <button onClick={() => { setGeneratorData(card); setShowGenerator(true); }} className="text-indigo-400 hover:text-indigo-600 transition-colors p-1" title={t('view_visual_card', 'Voir la Carte')}>👁️</button>}
                                            <button onClick={() => { setEditData(card); setViewMode(true); setShowModal(true); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1" title={t('view_details', 'Vue Détails')}>📄</button>
                                            <button onClick={() => { setEditData(card); setViewMode(false); setShowModal(true); }} className="text-indigo-400 hover:text-indigo-600 transition-colors p-1" title={t('edit', 'Modifier')}>✏️</button>
                                            <button onClick={() => setConfirmModal({ isOpen: true, id: card.id })} className="text-rose-500 hover:text-rose-700 transition-colors p-1" title={t('delete', 'Supprimer')}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <AddMemberCardModal
                    memberId={memberId}
                    editData={editData}
                    viewMode={viewMode}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchCards();
                    }}
                />
            )}

            {showGenerator && (
                <MemberCardGeneratorModal
                    member={member}
                    viewOnly={!!generatorData}
                    cardData={generatorData}
                    onClose={() => { setGeneratorData(null); setShowGenerator(false); }}
                    onSuccess={() => {
                        setGeneratorData(null);
                        setShowGenerator(false);
                        fetchCards();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title={t('confirm_delete', 'Confirmer la suppression')}
                message={t('confirm_delete_card', 'Êtes-vous sûr de vouloir supprimer cette carte ?')}
            />
        </div>
    );
};

const AddMemberCardModal = ({ memberId, editData, viewMode, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const [cardNumber, setCardNumber] = useState(editData ? editData.cardNumber : '');
    const [issueDate, setIssueDate] = useState(editData ? editData.issueDate : '');
    const [status, setStatus] = useState(editData ? editData.status : 'Active');
    const [description, setDescription] = useState(editData ? (editData.description || '') : '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editData) {
                await api.put(`/member-cards/${editData.id}`, {
                    cardNumber, issueDate, status, description
                });
            } else {
                await api.post('/member-cards', {
                    userId: memberId, cardNumber, issueDate, status, description
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving card:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors p-4">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
                    {viewMode ? t('view_card', 'Détails de la carte') : editData ? t('edit_card', 'Modifier la carte') : t('give_card', 'Donner une carte')}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 ml-1">{t('card_number', 'Numéro de carte')}</label>
                            <input
                                required
                                disabled={viewMode}
                                type="text"
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 ml-1">{t('issue_date', 'Reçue le')}</label>
                            <input
                                required
                                disabled={viewMode}
                                type="date"
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 ml-1">{t('status', 'Statut')}</label>
                            <select
                                disabled={viewMode}
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="Active">{t('active', 'Actif')}</option>
                                <option value="Inactive">{t('inactive', 'Inactif')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 ml-1">{t('description', 'Description (Volée, perduc...)')}</label>
                            <input
                                disabled={viewMode}
                                type="text"
                                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                placeholder={t('description_placeholder', 'Ex: Remplacé suite à perte...')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-6 py-3 bg-gray-50 rounded-xl font-bold text-[11px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition-all ${viewMode ? 'w-full text-center' : ''}`}
                        >
                            {viewMode ? t('close', 'Fermer') : t('cancel', 'Annuler')}
                        </button>
                        {!viewMode && (
                            <button
                                type="submit"
                                disabled={loading || !cardNumber || !issueDate}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-40"
                            >
                                {loading ? t('saving', 'Sauvegarde...') : t('save', 'Enregistrer')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemberCardsList;
