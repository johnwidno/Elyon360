import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';
import {
    Plus, FileText, Clock, CheckCircle2, Eye, AlertCircle,
    ChevronDown, ChevronUp, Send, History as HistoryIcon, X,
    PlusCircle, ShieldAlert, Maximize, Search, ArrowRight
} from 'lucide-react';

const BORDER_CLR = '#e8eaf0';

// ── Shared status config ───────────────────────────────────────────────────────
const STATUS = {
    'non vue': { label: 'En cours', badgeColor: 'indigo' },
    'vue': { label: 'Consulté', badgeColor: 'blue' },
    'traitée': { label: 'Terminé', badgeColor: 'green' },
    'suivi approfondi': { label: 'Approuvée', badgeColor: 'emerald' },
};

// ── Inline Badge (pill style from reference) ───────────────────────────────
function StatusBadge({ status }) {
    const cfg = STATUS[status] || { label: status, badgeColor: 'gray' };
    const map = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        gray: 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700',
    };
    const c = map[cfg.badgeColor] || map.gray;
    return (
        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${c}`}>
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
    const [searchQuery, setSearchQuery] = useState('');
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
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">{t('loading')}…</p>
        </div>
    );

    const filteredRequests = requests.filter(r => 
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        TYPE_LABELS[r.requestType]?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col sm:row sm:items-center justify-between gap-6">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('search_requests', 'Rechercher une demande...')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 text-[13px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
                    />
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 ${showForm ? 'bg-slate-500 shadow-slate-500/20' : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'}`}>
                    {showForm ? <><X size={18} /> {t('cancel', 'Annuler')}</> : <><PlusCircle size={18} /> {t('new_request', 'Nouvelle demande')}</>}
                </button>
            </div>

            {/* Submit Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 p-8 sm:p-10 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300 shadow-2xl shadow-indigo-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                        <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">{t('new_request', 'Nouvelle demande')}</h3>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">{t('title', 'Titre')}</label>
                                <input type="text" required value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Demande de baptême"
                                    className="w-full px-6 py-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-[14px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">{t('type', 'Type')}</label>
                                <select value={formData.requestType}
                                    onChange={e => setFormData({ ...formData, requestType: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-[14px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:text-white appearance-none">
                                    {requestTypes.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">{t('description', 'Description')}</label>
                            <textarea required value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Expliquez votre demande en détail..."
                                rows={4} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-[14px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:text-white resize-none" />
                        </div>
                        <button type="submit" disabled={submitting}
                            className="w-full py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
                        >
                            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> {t('send_request', 'Envoyer la demande')}</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Request list */}
            {filteredRequests.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 p-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
                        <FileText size={48} />
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-2">{t('no_requests', 'Aucune demande')}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('no_requests_desc', 'Vous n\'avez pas encore effectué de demandes officielles.')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map(req => (
                        <div key={req.id} className="group">
                            {/* Main Card */}
                            <div className={`bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 active:scale-[0.99] ${expandedRequest === req.id ? 'rounded-b-none border-b-transparent shadow-xl ring-2 ring-indigo-500/10' : ''}`}
                                onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}>
                                
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${expandedRequest === req.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight mb-1">{req.title || TYPE_LABELS[req.requestType] || req.requestType}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-full">{req.requestType}</span>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                    <StatusBadge status={req.status} />
                                    <div className={`transition-transform duration-500 ${expandedRequest === req.id ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedRequest === req.id && (
                                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-b-[2rem] border border-slate-100 dark:border-slate-700 border-t-transparent px-8 sm:px-24 pb-10 pt-4 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300 shadow-xl shadow-indigo-500/5">
                                    {/* Description Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-px bg-slate-200 dark:bg-slate-700" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{t('request_details', 'Détails de la demande')}</p>
                                        </div>
                                        {req.status === 'non vue' ? (
                                            <textarea defaultValue={req.description}
                                                onBlur={e => handleUpdateDescription(req.id, e.target.value)}
                                                rows={4} className="w-full px-6 py-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-[14px] font-medium text-slate-700 dark:text-slate-300 resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400" />
                                        ) : (
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-slate-700 dark:text-slate-300 text-[14px] leading-relaxed italic">"{req.description || '—'}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Note */}
                                    {req.internalNote && (
                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-[1.5rem] p-6 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                                                <ShieldAlert size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Note de l'administration</p>
                                                <p className="text-amber-900 dark:text-amber-200 text-sm font-bold leading-relaxed">{req.internalNote}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* History Timeline */}
                                    {req.history && req.history.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-px bg-slate-200 dark:bg-slate-700" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{t('history', 'Historique')}</p>
                                            </div>
                                            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-slate-700">
                                                {req.history.map((h, i) => (
                                                    <div key={i} className="relative flex gap-6 group/item">
                                                        <div className={`absolute -left-[24px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 transition-all ${i === 0 ? 'bg-indigo-600 scale-125' : 'bg-slate-200'}`} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className={`text-[13px] font-black uppercase tracking-tight ${i === 0 ? 'text-indigo-600' : 'text-slate-500'}`}>{STATUS[h.newStatus]?.label || h.newStatus}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{h.createdAt ? new Date(h.createdAt).toLocaleDateString(locale) : ''}</p>
                                                            </div>
                                                            {h.note && <p className="text-[12px] text-slate-500 dark:text-slate-400 italic mb-2">"{h.note}"</p>}
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
};

export default MemberRequests;
