import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import AlertModal from '../../../components/ChurchAlertModal';

export default function OrganizationProfile() {
    const { t, language } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Status / Modal states
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    // Summary Note states
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Alert states
    const [showAddAlertModal, setShowAddAlertModal] = useState(false);
    const [newAlertMessage, setNewAlertMessage] = useState('');
    const [orgAlerts, setOrgAlerts] = useState([]);
    const [showAlertPopup, setShowAlertPopup] = useState(false);

    const fetchOrgAlerts = async () => {
        try {
            const res = await api.get(`/organizations/${id}/alerts`);
            setOrgAlerts(res.data || []);
            if (res.data && res.data.length > 0) {
                setShowAlertPopup(true);
            }
        } catch (err) {
            console.warn("Error fetching organization alerts", err);
        }
    };

    const fetchOrg = async () => {
        try {
            const res = await api.get(`/organizations/${id}`);
            setOrg(res.data);
        } catch (err) {
            console.error("Error fetching organization", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrg();
        fetchOrgAlerts();
    }, [id]);

    useEffect(() => {
        if (org) {
            setNoteContent(org.description || '');
        }
    }, [org]);

    const handleStatusUpdate = async () => {
        try {
            await api.put(`/organizations/${id}`, {
                status: pendingStatus,
                statusChangeDate: statusDate
            });
            setShowStatusModal(false);
            fetchOrg();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('status_update_error', 'Erreur lors de la mise à jour du statut'), type: 'error' });
        }
    };

    const handleSaveSummaryNote = async () => {
        setSavingNote(true);
        try {
            await api.put(`/organizations/${id}`, { description: noteContent });
            setIsNoteOpen(false);
            fetchOrg();
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('error_saving_note', 'Erreur lors de l\'enregistrement du résumé'), type: 'error' });
        } finally {
            setSavingNote(false);
        }
    };

    const handleAddAlert = async () => {
        try {
            await api.post(`/organizations/${id}/alerts`, { message: newAlertMessage });
            setShowAddAlertModal(false);
            setNewAlertMessage('');
            fetchOrgAlerts();
            setAlertMessage({ show: true, title: t('success'), message: t('alert_added_success', 'Alerte ajoutée avec succès'), type: 'success' });
        } catch (err) {
            setAlertMessage({ show: true, title: t('error'), message: t('error_adding_alert', 'Erreur lors de l\'ajout de l\'alerte'), type: 'error' });
        }
    };

    const handleDeleteAlert = async (alertId) => {
        try {
            await api.delete(`/organizations/${id}/alerts/${alertId}`);
            setOrgAlerts(prev => prev.filter(a => a.id !== alertId));
            if (orgAlerts.length <= 1) setShowAlertPopup(false);
        } catch (err) {
            console.error('Error deleting alert', err);
        }
    };

    if (loading) return <AdminLayout><div className="p-20 text-center font-semibold text-gray-400 dark:text-gray-600 transition-colors italic">{t('loading')}</div></AdminLayout>;
    if (!org) return (
        <AdminLayout>
            <div className="p-20 text-center transition-colors">
                <div className="font-bold text-red-500 text-2xl mb-4 italic transition-colors leading-none tracking-tight">{t('org_not_found', 'Organisation introuvable')}</div>
                <p className="text-gray-500 font-medium transition-colors">ID : {id}</p>
                {error && <p className="text-red-400 mt-4 font-semibold text-[11px] transition-colors">{t('error')}: {error}</p>}
                <button onClick={() => navigate(-1)} className="mt-8 px-10 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl font-semibold text-[13px] hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm">{t('back', 'Retour')}</button>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080808] transition-colors">
                {/* Header Section */}
                <div className="bg-white dark:bg-[#0b1437] border-b border-gray-100 dark:border-white/5 px-8 pt-8 pb-8 transition-colors">
                    <div className="max-w-[1700px] mx-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all text-[11px] font-black tracking-[0.2em] mb-8 group uppercase"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('back', 'Retour')}
                        </button>

                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                            {/* Left Side: Logo & Name */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 flex-1 relative z-10 text-center md:text-left">
                                <div className="relative group/avatar">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-hover/avatar:opacity-50 transition duration-1000"></div>
                                    <div className="relative w-36 h-36 rounded-[2.2rem] border-4 border-white dark:border-[#1A1A1A] overflow-hidden shadow-2xl bg-gray-50 dark:bg-black flex items-center justify-center p-6 transition-all group-hover/avatar:scale-[1.02]">
                                        {org.logo ? (
                                            <img src={org.logo} className="w-full h-full object-contain" alt="Logo" />
                                        ) : (
                                            <BuildingIcon className="w-16 h-16 text-indigo-500/20" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 dark:border-white/10">
                                        <div className={`w-3 h-3 rounded-full ${org.status === 'Inactif' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`}></div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 flex-1">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none capitalize">
                                            {org.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase py-1 px-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                                {org.subtype?.name || org.type || 'Organisation'}
                                            </span>
                                            {org.isSystem && (
                                                <span className="text-[11px] font-black text-amber-600 tracking-widest uppercase py-1 px-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                    {t('system')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-w-3xl">
                                        {isNoteOpen ? (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <textarea
                                                    autoFocus
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    placeholder={t('note_placeholder_summary', 'Entrez une note de synthèse...')}
                                                    className="w-full h-32 p-5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[13px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none shadow-stripe"
                                                />
                                                <div className="flex gap-3 justify-end mt-4">
                                                    <button onClick={() => { setIsNoteOpen(false); setNoteContent(org.description || ''); }} className="px-6 py-2.5 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">{t('cancel')}</button>
                                                    <button
                                                        onClick={handleSaveSummaryNote}
                                                        disabled={savingNote}
                                                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {savingNote ? t('saving') : t('save')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group/note relative">
                                                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed italic border-l-4 border-indigo-500/20 pl-4 py-1">
                                                    {org.description || t('no_description_provided', 'Aucune description fournie.')}
                                                </p>
                                                <button
                                                    onClick={() => setIsNoteOpen(true)}
                                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-[11px] font-black tracking-widest uppercase transition-all mt-3 opacity-0 group-hover/note:opacity-100"
                                                >
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black">+</span>
                                                    {t('add_summary_note', 'Modifier le résumé')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Top Right: Organisation Details */}
                            <div className="text-right hidden lg:block">
                                <h3 className="text-[12px] font-black text-gray-400 dark:text-gray-500 mb-4 tracking-widest uppercase">{t('org_details', 'Détails de l\'organisation')}</h3>
                                <div className="space-y-2">
                                    <p className="text-[14px] font-bold text-gray-800 dark:text-gray-300 flex justify-end items-center gap-3">
                                        <span className="text-gray-400 text-[11px] tracking-wider uppercase">{t('status', 'Statut')} :</span>
                                        <span>
                                            <span className={`${org.status === 'Inactif' ? 'text-rose-500' : 'text-emerald-500'} font-black mr-2`}>{t(org.status?.toLowerCase()) || org.status || 'Actif'}</span>
                                            <span className="text-gray-400 font-bold text-[12px]">{org.statusChangeDate ? new Date(org.statusChangeDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTION TOOLBAR */}
                <div className="px-8 mt-8">
                    <div className="max-w-[1700px] mx-auto">
                        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-[#0b1437] p-1.5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-premium relative z-30">
                            <button
                                onClick={() => navigate(`/admin/organizations?edit=${org.id}`)}
                                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                {t('edit')}
                            </button>

                            <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('mark_as', 'Marquer comme...')}
                                    <svg className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#111c44] rounded-2xl shadow-3xl border border-gray-100 dark:border-white/10 py-3 z-[110] animate-in fade-in slide-in-from-top-1">
                                            {['Actif', 'Inactif', 'En déplacement', 'Décédé', 'Transféré'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { setPendingStatus(s); setShowStatusModal(true); setDropdownOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    {t(s.toLowerCase()) || s}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="h-6 w-px bg-gray-100 dark:bg-white/5 mx-2"></div>

                            <button
                                onClick={() => setShowAddAlertModal(true)}
                                className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-[12px] font-bold text-gray-700 dark:text-gray-300 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {t('add_alert', 'Ajouter une alerte')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="px-8 mt-10 pb-32">
                    <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN (lg:col-span-7) */}
                        <div className="lg:col-span-7 space-y-6">
                            <Accordion title={t('org_summary', 'Résumé de l\'organisation')} initialOpen={true}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('basic_info', 'Informations de base')}</h4>
                                        <div className="space-y-1">
                                            <SummaryItem label={t('name', 'Nom')} value={org.name} />
                                            <SummaryItem label={t('type', 'Type')} value={org.subtype?.name || org.type} />
                                            <SummaryItem label={t('status', 'Statut')} value={t(org.status?.toLowerCase()) || org.status} />
                                            <SummaryItem label={t('status_date', 'Échéance Statut')} value={org.statusChangeDate ? new Date(org.statusChangeDate).toLocaleDateString() : '-'} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('system_info', 'Données système')}</h4>
                                        <div className="space-y-1">
                                            <SummaryItem label={t('id', 'Identifiant')} value={org.id} />
                                            <SummaryItem label={t('system_managed', 'Géré par le système')} value={org.isSystem ? t('yes') : t('no')} />
                                            <SummaryItem label={t('created_at', 'Créé le')} value={org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'} />
                                        </div>
                                    </div>
                                </div>
                            </Accordion>

                            <Accordion title={t('donations_history', 'Historique des Dons')}>
                                <div className="overflow-x-auto">
                                    {(!org.donations || org.donations.length === 0) ? (
                                        <p className="py-8 text-center text-xs text-gray-400 italic">{t('no_donations_recorded')}</p>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-black/40">
                                                <tr>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('type')}</th>
                                                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                                                {org.donations.map(d => (
                                                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                                        <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-medium">
                                                            {new Date(d.date).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/10">
                                                                {t(d.type?.toLowerCase()) || d.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-black text-gray-900 dark:text-white">
                                                            {parseFloat(d.amount).toLocaleString()} <span className="text-[10px] text-gray-400 ml-1">{d.currency}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </Accordion>

                            <Accordion title={t('tithe_regulator', 'Régulateur de Dîmes')}>
                                <TitheRegulator donations={org.donations || []} />
                            </Accordion>

                            <Accordion title={t('partner_groups', 'Groupes Partenaires')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(!org.partnerGroups || org.partnerGroups.length === 0) ? (
                                        <p className="col-span-2 py-8 text-center text-xs text-gray-400 italic">{t('no_groups_found')}</p>
                                    ) : (
                                        org.partnerGroups.map(g => (
                                            <div key={g.id} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between group transition-all hover:border-indigo-500/30">
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-800 dark:text-white tracking-tight">{g.name}</p>
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{g.type}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1A1A] flex items-center justify-center text-indigo-500 shadow-sm border border-gray-100 dark:border-white/10 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    <GroupsIcon className="h-4 w-4" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Accordion>
                        </div>

                        {/* RIGHT COLUMN (lg:col-span-5) */}
                        <div className="lg:col-span-5 space-y-6">
                            <Accordion title={t('contact_information', 'Coordonnées')} initialOpen={true}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-6">
                                        <DetailItem label={t('email')} value={org.email} icon={<EmailIcon />} isEmail />
                                        <DetailItem label={t('phone')} value={org.phone} icon={<PhoneIcon />} />
                                        {org.website && <DetailItem label={t('website')} value={org.website} icon={<GlobeIcon />} isLink />}
                                        <DetailItem label={t('address')} value={org.address} icon={<LocationIcon />} />
                                    </div>
                                </div>
                            </Accordion>

                            <Accordion title={t('events_attended', 'Événements participés')}>
                                <div className="space-y-4">
                                    {(!org.attendedEvents || org.attendedEvents.length === 0) ? (
                                        <p className="py-8 text-center text-xs text-gray-400 italic">{t('no_participation_recorded')}</p>
                                    ) : (
                                        org.attendedEvents.map(e => (
                                            <div key={e.id} className="p-4 bg-gray-50/50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-4 group transition-all hover:border-indigo-500/30">
                                                <div className="w-12 h-12 bg-white dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-[16px] italic shrink-0">
                                                    {new Date(e.startDate).getDate()}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-800 dark:text-white tracking-tight leading-none mb-1">{e.title}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(e.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Accordion>

                            <Accordion title={t('ceremonies_attended', 'Cérémonies participées')}>
                                <div className="grid grid-cols-1 gap-4">
                                    {(!org.attendedCeremonies || org.attendedCeremonies.length === 0) ? (
                                        <p className="py-8 text-center text-xs text-gray-400 italic">{t('no_ceremonies_recorded')}</p>
                                    ) : (
                                        org.attendedCeremonies.map(c => (
                                            <div key={c.id} className="p-5 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4 group transition-all hover:border-amber-500/30">
                                                <div className="w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                                    <CeremonyIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-800 dark:text-white tracking-tight leading-none mb-1">{c.title}</p>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">{c.type}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Accordion>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/95 backdrop-blur-xl animate-fade-in" onClick={() => setShowStatusModal(false)}></div>
                        <div className="relative bg-white dark:bg-[#0D0D0D] rounded-[3.5rem] p-12 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/5 animate-scale-in">
                            <div className="mb-10 text-center">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">{t('change_status')}</h3>
                                <p className="text-[14px] font-bold text-gray-500 dark:text-gray-400">
                                    {t('pass_status_to')}: <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[12px] ml-1">{t(pendingStatus.toLowerCase()) || pendingStatus}</span>
                                </p>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('effective_date')}</label>
                                    <input
                                        type="date"
                                        value={statusDate}
                                        onChange={(e) => setStatusDate(e.target.value)}
                                        className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl outline-none text-[15px] font-black text-gray-900 dark:text-white transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        onClick={() => setShowStatusModal(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-[11px] tracking-widest text-gray-400 uppercase hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        onClick={handleStatusUpdate}
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        {t('confirm')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Alert Modal */}
                {showAddAlertModal && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAddAlertModal(false)} />
                        <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-10 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('add_alert', 'Ajouter une alerte')}</h3>
                                    <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">{org.name}</p>
                                </div>
                            </div>
                            <textarea
                                autoFocus
                                value={newAlertMessage}
                                onChange={e => setNewAlertMessage(e.target.value)}
                                placeholder={t('alert_message_placeholder', 'Ex: Organisation en retard de paiement, à contacter...')}
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-black rounded-2xl outline-none text-sm font-medium text-gray-800 dark:text-white shadow-sm h-32 resize-none focus:ring-2 focus:ring-rose-500/20 border border-transparent focus:border-rose-200 transition-all"
                            />
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setShowAddAlertModal(false); setNewAlertMessage(''); }} className="flex-1 py-3.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">{t('cancel')}</button>
                                <button onClick={handleAddAlert} disabled={!newAlertMessage.trim()} className="flex-1 py-3.5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-40">{t('confirm')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alert Pop-up */}
                {showAlertPopup && orgAlerts.length > 0 && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white dark:bg-[#1a1a2e] border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-orange-400 animate-pulse" />
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-rose-500 tracking-widest uppercase mb-1">{t('org_alert', 'Alerte organisation')}</p>
                                        {orgAlerts.map(a => (
                                            <div key={a.id} className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-[13px] font-semibold text-gray-800 dark:text-white leading-snug">{a.message}</p>
                                                <button onClick={() => handleDeleteAlert(a.id)} className="text-gray-300 hover:text-rose-500 transition-colors shrink-0 text-xs mt-0.5">✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowAlertPopup(false)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="mt-4 h-0.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-400 rounded-full" style={{ animation: 'shrink 12s linear forwards' }} />
                                </div>
                            </div>
                        </div>
                        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
                    </div>
                )}
            </div>

            <AlertModal
                isOpen={alertMessage.show}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
            />
        </AdminLayout>
    );

}

function ToolbarButton({ label, icon }) {
    const { t } = useLanguage();
    return (
        <button className="px-5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            {label}
            {icon && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            )}
        </button>
    );
}

function SummaryItem({ label, value }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[12px] font-medium text-gray-500">{label}</span>
            <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">{value || <span className="text-gray-300 italic">None found.</span>}</span>
        </div>
    );
}

function DetailItem({ label, value, icon, isEmail, isLink }) {
    const { t } = useLanguage();
    return (
        <div className="flex items-start gap-4 group transition-all">
            <div className="w-12 h-12 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center text-gray-400 dark:text-indigo-600/30 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-stripe border border-gray-100 dark:border-white/5">
                {icon}
            </div>
            <div className="overflow-hidden py-1">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1 transition-colors tracking-widest uppercase">{label}</p>
                {isEmail ? (
                    <a href={`mailto:${value}`} className="text-[14px] font-black text-indigo-600 hover:text-indigo-700 break-all transition-all underline decoration-indigo-500/20 underline-offset-4">{value}</a>
                ) : isLink && value && value !== t('not_specified') ? (
                    <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-black text-indigo-600 hover:text-indigo-700 transition-all underline decoration-indigo-500/20 underline-offset-4">{value}</a>
                ) : (
                    <p className="text-[14px] font-black text-gray-900 dark:text-white transition-colors">{value}</p>
                )}
            </div>
        </div>
    );
}

const BuildingIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);
const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
);
const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

function Accordion({ title, children, initialOpen = false }) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    return (
        <div className="bg-white dark:bg-[#111c44] rounded-lg shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-[#f8f9fa] dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/30 transition-all border-b border-gray-100 dark:border-white/5"
            >
                <div className="flex items-center gap-3">
                    <span className="text-[14px] font-bold text-gray-700 dark:text-white tracking-tight">{title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

function TitheRegulator({ donations }) {
    const { t, language } = useLanguage();
    const months = language === 'en'
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentYear = new Date().getFullYear();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 transition-colors">
            {months.map((m, idx) => {
                const paid = donations.some(d =>
                    (d.type?.toLowerCase() === 'dime' || d.type?.toLowerCase() === 'dîme') &&
                    new Date(d.date).getMonth() === idx &&
                    new Date(d.date).getFullYear() === currentYear
                );
                return (
                    <div key={m} className={`p-8 rounded-[2rem] border transition-all text-center flex flex-col items-center justify-center group ${paid ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20 shadow-premium' : 'bg-gray-50/50 dark:bg-black border-transparent opacity-40 hover:opacity-100 shadow-inner'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{m}</p>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-stripe transition-all duration-500 group-hover:scale-110 ${paid ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white dark:bg-[#1A1A1A] text-gray-200 dark:text-gray-800 border border-gray-100 dark:border-white/5'}`}>
                            {paid ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        {paid && <p className="mt-4 text-[9px] font-black text-emerald-700 dark:text-emerald-500 transition-colors uppercase tracking-widest">{t('settled', 'Réglé')}</p>}
                    </div>
                );
            })}
        </div>
    );
}

// Icons
const MoneyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const TitheIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const GroupsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const CeremonyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);
