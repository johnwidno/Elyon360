import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import {
    Plus, FileText, Clock, CheckCircle2, Eye, AlertCircle,
    ChevronDown, ChevronUp, Send, History as HistoryIcon, X
} from 'lucide-react';

const BORDER_CLR = '#e8eaf0';

// ── Shared status config ───────────────────────────────────────────────────────
const STATUS = {
    'non vue': { label: 'En cours', badgeColor: 'amber' },
    'vue': { label: 'En cours', badgeColor: 'amber' },
    'traitée': { label: 'Traitée', badgeColor: 'gray' },
    'suivi approfondi': { label: 'Approuvée', badgeColor: 'green' },
};

// ── Inline Badge (outlined style from reference) ───────────────────────────────
function StatusBadge({ status }) {
    const cfg = STATUS[status] || { label: status, badgeColor: 'gray' };
    const map = {
        amber: { border: '#f59e0b', text: '#b45309', bg: '#fffbeb' },
        green: { border: '#22c55e', text: '#166534', bg: '#f0fdf4' },
        gray: { border: '#d1d5db', text: '#6b7280', bg: '#f9fafb' },
    };
    const c = map[cfg.badgeColor] || map.gray;
    return (
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{ borderColor: c.border, color: c.text, background: c.bg }}>
            {cfg.label}
        </span>
    );
}

// ── Type labels ───────────────────────────────────────────────────────────────
const TYPE_LABELS = {
    marriage: 'Demande de mariage',
    baptism: 'Certificat de baptême',
    transfer: 'Transfert',
    member_card_new: 'Demande Nouvelle Carte',
    member_card_lost: 'Déclaration Carte Perdue',
    member_card_stolen: 'Déclaration Carte Volée',
    member_card_defective: 'Déclaration Carte Défectueuse',
    support: 'Support',
    ministry: 'Ministère',
    info: 'Information',
    reservation: 'Réservation de salle',
    meeting: 'Réunion',
    other: 'Autre',
};

// ─────────────────────────────────────────────────────────────────────────────
const MemberRequests = ({ renderMode = 'default' }) => {
    const { t, language } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedRequest, setExpandedRequest] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';

    const [formData, setFormData] = useState({ title: '', requestType: 'info', description: '' });

    const requestTypes = [
        { id: 'marriage', label: 'Demande de mariage' },
        { id: 'baptism', label: 'Certificat de baptême' },
        { id: 'transfer', label: 'Transfert' },
        { id: 'member_card_new', label: 'Demande Nouvelle Carte' },
        { id: 'member_card_lost', label: 'Déclaration Carte Perdue' },
        { id: 'member_card_stolen', label: 'Déclaration Carte Volée' },
        { id: 'member_card_defective', label: 'Déclaration Carte Défectueuse' },
        { id: 'support', label: 'Support' },
        { id: 'ministry', label: 'Ministère' },
        { id: 'info', label: 'Information' },
        { id: 'reservation', label: 'Réservation de salle' },
        { id: 'meeting', label: 'Réunion' },
        { id: 'other', label: 'Autre' },
    ];

    useEffect(() => { fetchMyRequests(); }, []);

    const fetchMyRequests = async () => {
        try {
            const res = await api.get('/member-requests');
            setRequests(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        } catch { toast.error(t('error_loading_data', 'Erreur de chargement')); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            await api.post('/member-requests', formData);
            toast.success(t('request_created_success', 'Demande envoyée !'));
            setFormData({ title: '', requestType: 'info', description: '' });
            setShowForm(false);
            fetchMyRequests();
        } catch { toast.error(t('error_creating_request', 'Erreur lors de la création')); }
        finally { setSubmitting(false); }
    };

    const handleUpdateDescription = async (id, description) => {
        try {
            await api.patch(`/member-requests/${id}`, { description });
            toast.success(t('request_updated_success', 'Mis à jour !'));
            fetchMyRequests();
        } catch { toast.error(t('error_updating_request', 'Erreur de mise à jour')); }
    };

    if (loading) return (
        <div className="text-center py-10 text-gray-400 text-sm">{t('loading')}…</div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // CARD RENDER MODE (used in Home.jsx "Mes Demandes" tab — matches reference)
    // ═══════════════════════════════════════════════════════════════════════════
    if (renderMode === 'cards') {
        return (
            <div className="space-y-4">
                {/* New Request Button */}
                <div className="flex justify-end">
                    <button onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all"
                        style={{ background: showForm ? '#6b7280' : '#6366f1' }}>
                        {showForm ? <><X size={14} /> Annuler</> : <><Plus size={14} /> Nouvelle demande</>}
                    </button>
                </div>

                {/* Submit Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl border p-5 space-y-4 animate-in slide-in-from-top-2 duration-200"
                        style={{ borderColor: '#c7d2fe' }}>
                        <h3 className="font-bold text-gray-800 text-[14px]">Nouvelle demande</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Titre</label>
                                    <input type="text" required value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Demande de baptême"
                                        className="w-full px-3.5 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                        style={{ borderColor: BORDER_CLR }} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Type</label>
                                    <select value={formData.requestType}
                                        onChange={e => setFormData({ ...formData, requestType: e.target.value })}
                                        className="w-full px-3.5 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                        style={{ borderColor: BORDER_CLR }}>
                                        {requestTypes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Description</label>
                                <textarea required value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Expliquez votre demande en détail..."
                                    rows={3} className="w-full px-3.5 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none"
                                    style={{ borderColor: BORDER_CLR }} />
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                                style={{ background: '#6366f1', opacity: submitting ? 0.7 : 1 }}>
                                {submitting ? '…' : <><Send size={15} /> Envoyer la demande</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* Request list — card rows matching reference */}
                {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: BORDER_CLR }}>
                        <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 text-sm">Aucune demande</p>
                        <p className="text-gray-300 text-[12px] mt-1">Cliquez "Nouvelle demande" pour commencer</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id}>
                                {/* Row Card */}
                                <div className="bg-white rounded-2xl border flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    style={{ borderColor: BORDER_CLR }}
                                    onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}>
                                    {/* Doc icon */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: '#eef0f6', color: '#8a94a6' }}>
                                        <FileText size={16} />
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-800 font-medium text-[13px] truncate">{req.title || TYPE_LABELS[req.requestType] || req.requestType}</p>
                                        <p className="text-gray-400 text-[11px] mt-0.5">
                                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                        </p>
                                    </div>
                                    {/* Status badge */}
                                    <StatusBadge status={req.status} />
                                    {/* Expand icon */}
                                    <span className="text-gray-300 ml-1">
                                        {expandedRequest === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                </div>

                                {/* Expanded detail */}
                                {expandedRequest === req.id && (
                                    <div className="bg-white rounded-b-2xl border border-t-0 px-5 pb-5 pt-3 space-y-4 animate-in slide-in-from-top-1 duration-200"
                                        style={{ borderColor: BORDER_CLR }}>
                                        {/* Description */}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Description</p>
                                            {req.status === 'non vue' ? (
                                                <textarea defaultValue={req.description}
                                                    onBlur={e => handleUpdateDescription(req.id, e.target.value)}
                                                    rows={3} className="w-full px-3.5 py-3 rounded-lg border text-sm text-gray-700 resize-none outline-none focus:ring-2 focus:ring-indigo-400"
                                                    style={{ borderColor: BORDER_CLR }} />
                                            ) : (
                                                <p className="text-gray-600 text-sm leading-relaxed">{req.description || '—'}</p>
                                            )}
                                        </div>

                                        {/* Internal note from admin */}
                                        {req.internalNote && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">Note de l'église</p>
                                                <p className="text-amber-800 text-sm">{req.internalNote}</p>
                                            </div>
                                        )}

                                        {/* History timeline */}
                                        {req.history && req.history.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-3">
                                                    <HistoryIcon size={12} /> Historique
                                                </p>
                                                <div className="space-y-3">
                                                    {req.history.map((h, i) => (
                                                        <div key={i} className="flex gap-3">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                                                {i < req.history.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1 rounded-full" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-bold text-gray-700">{STATUS[h.newStatus]?.label || h.newStatus}</p>
                                                                {h.note && <p className="text-[11px] text-gray-400 mt-0.5">{h.note}</p>}
                                                                <p className="text-[10px] text-gray-300 mt-0.5">{h.createdAt ? new Date(h.createdAt).toLocaleDateString(locale) : ''}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEFAULT RENDER MODE (fallback - same card style)
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white"
                    style={{ background: showForm ? '#6b7280' : '#6366f1' }}>
                    {showForm ? <><X size={14} /> Annuler</> : <><Plus size={14} /> Nouvelle demande</>}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#c7d2fe' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Titre</label>
                                <input type="text" required value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Demande de baptême"
                                    className="w-full px-3.5 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                    style={{ borderColor: BORDER_CLR }} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Type</label>
                                <select value={formData.requestType}
                                    onChange={e => setFormData({ ...formData, requestType: e.target.value })}
                                    className="w-full px-3.5 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                                    style={{ borderColor: BORDER_CLR }}>
                                    {requestTypes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <textarea required value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Expliquez votre demande..." rows={3}
                            className="w-full px-3.5 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                            style={{ borderColor: BORDER_CLR }} />
                        <button type="submit" disabled={submitting}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                            style={{ background: '#6366f1' }}>
                            <Send size={15} /> {submitting ? '…' : 'Envoyer'}
                        </button>
                    </form>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: BORDER_CLR }}>
                    <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 text-sm">Aucune demande</p>
                </div>
            ) : requests.map(req => (
                <div key={req.id}>
                    <div className="bg-white rounded-2xl border flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        style={{ borderColor: BORDER_CLR }}
                        onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: '#eef0f6', color: '#8a94a6' }}>
                            <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium text-[13px] truncate">{req.title || TYPE_LABELS[req.requestType] || req.requestType}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5">{req.createdAt ? new Date(req.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                        </div>
                        <StatusBadge status={req.status} />
                        <span className="text-gray-300">{expandedRequest === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                    </div>
                    {expandedRequest === req.id && (
                        <div className="bg-white rounded-b-2xl border border-t-0 px-5 pb-5 pt-3 space-y-3"
                            style={{ borderColor: BORDER_CLR }}>
                            <p className="text-gray-600 text-sm leading-relaxed">{req.description || '—'}</p>
                            {req.internalNote && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">Note de l'église</p>
                                    <p className="text-amber-800 text-sm">{req.internalNote}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default MemberRequests;
