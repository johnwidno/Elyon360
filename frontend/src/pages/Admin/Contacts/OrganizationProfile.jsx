import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';

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
    }, [id]);

    const handleStatusUpdate = async () => {
        try {
            await api.put(`/organizations/${id}`, {
                status: pendingStatus,
                statusChangeDate: statusDate
            });
            setShowStatusModal(false);
            fetchOrg();
        } catch (err) {
            alert(t('status_update_error', 'Erreur lors de la mise à jour du statut'));
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
            <div className="bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-white/5 px-10 py-12 transition-colors">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all text-[11px] font-semibold mb-8 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('back', 'Retour')}
                </button>
                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-16">
                    {/* Left Side: Logo + Name + Subtype */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-12 flex-1 text-center md:text-left">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-white/5 overflow-hidden shadow-sm bg-gray-50 dark:bg-black flex items-center justify-center p-6 transition-all">
                                {org.logo ? <img src={org.logo} className="w-full h-full object-contain" alt="Logo" /> : <BuildingIcon className="w-12 h-12 text-indigo-100 dark:text-indigo-900/40" />}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{org.name}</h2>
                                <button
                                    onClick={() => navigate(`/admin/organizations?edit=${org.id}`)}
                                    className="p-3 bg-indigo-50 dark:bg-black border border-transparent dark:border-white/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all active:scale-95 shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[14px] font-medium text-indigo-600 dark:text-indigo-400 transition-colors opacity-60">
                                {org.subtype?.name || org.type || 'organisation'}
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Status */}
                    <div className="flex items-center gap-16 transition-colors">
                        <div className="hidden lg:block h-24 w-[1px] bg-gray-100 dark:bg-white/5 transition-colors"></div>
                        <div className="text-right">
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mb-1 transition-colors">{t('status', 'Statut')}</p>
                            <p className={`text-xl font-bold transition-colors tracking-tight ${org.status === 'Inactif' ? 'text-red-500' : 'text-green-600'}`}>
                                {t(org.status?.toLowerCase()) || org.status || t('active', 'Actif')}
                            </p>
                            <div className="flex items-center justify-center lg:justify-end gap-4 mt-3">
                                {org.isSystem && (
                                    <span className="text-[9px] font-semibold text-white bg-indigo-600 dark:bg-indigo-500 px-3 py-1 rounded-lg shadow-sm italic">{t('system')}</span>
                                )}
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 italic font-medium transition-colors opacity-60 leading-none">
                                    {org.statusChangeDate ? new Date(org.statusChangeDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : t('current')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shared Actions Toolbar */}
                <div className="mt-16 pt-12 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-6 items-center transition-colors">
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="px-8 py-3.5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 rounded-xl text-[13px] font-semibold hover:bg-white dark:hover:bg-white/5 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                        >
                            {t('mark_as')}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 py-2 z-50 overflow-hidden">
                                {['Actif', 'Inactif', 'En déplacement', 'Décédé', 'Transféré'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setPendingStatus(s);
                                            setShowStatusModal(true);
                                            setDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-8 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-indigo-600 hover:text-white transition-all"
                                    >
                                        {t(s.toLowerCase()) || s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 transition-all">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
                    <div className="relative bg-white dark:bg-[#1A1A1A] rounded-3xl p-10 shadow-2xl w-full max-w-md border border-gray-100 dark:border-white/10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 transition-colors">{t('change_status')}</h3>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mb-8">{t('pass_status_to')}: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{t(pendingStatus.toLowerCase()) || pendingStatus}</span></p>

                        <div className="space-y-10 transition-colors">
                            <div className="space-y-4">
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors ml-1">{t('effective_date')}</label>
                                <input
                                    type="date"
                                    value={statusDate}
                                    onChange={(e) => setStatusDate(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl outline-none text-[14px] font-medium text-gray-800 dark:text-white transition-all shadow-sm [color-scheme:light]"
                                />
                            </div>

                            <div className="flex gap-4 pt-6 transition-colors">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 py-3.5 rounded-xl font-semibold text-[13px] text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-[13px] shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    {t('confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Information Section: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-10 mb-10 transition-colors">
                {/* Column 1: Identity & Contact */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                    <h3 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-8 pb-4 border-b border-gray-100 dark:border-white/5 transition-colors">{t('identity_contact')}</h3>
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DetailItem label={t('email')} value={org.email || t('not_specified')} icon={<EmailIcon />} isEmail />
                            <DetailItem label={t('phone')} value={org.phone || t('not_specified')} icon={<PhoneIcon />} />
                            <DetailItem label={t('website')} value={org.website || t('not_specified')} icon={<GlobeIcon />} isLink />
                            <DetailItem label={t('address')} value={org.address || t('not_specified')} icon={<LocationIcon />} />
                        </div>
                    </div>
                </div>

                {/* Column 2: Description */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
                    <h3 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-8 pb-4 border-b border-gray-100 dark:border-white/5 transition-colors">{t('description_notes')}</h3>
                    <div className="p-8 bg-gray-50 dark:bg-black rounded-2xl min-h-[140px] transition-colors border border-gray-100 dark:border-white/5">
                        <p className="text-[14px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed transition-colors">
                            {org.description || t('no_description_provided')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Activity Sections (2 Columns, Aligned) */}
            <div className="pt-10 pb-20 px-10 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-8 transition-colors">{t('activity_history', 'Historique des Activités')}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start transition-colors">
                    {/* Left Column Activity Sections */}
                    <div className="space-y-10 transition-colors">
                        <Accordion title={t('donations_history', 'Historique des Dons')} icon={<MoneyIcon />}>
                            <div className="overflow-x-auto noscrollbar transition-colors">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                        <tr className="border-b border-gray-50 dark:border-white/5">
                                            <th className="py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">{t('date')}</th>
                                            <th className="py-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">{t('type')}</th>
                                            <th className="py-4 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">{t('amount', 'Montant')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                                        {(org.donations || []).map(d => (
                                            <tr key={d.id} className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="py-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">{new Date(d.date).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                                                <td className="py-4 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{t(d.type?.toLowerCase()) || d.type}</td>
                                                <td className="py-4 text-right text-[14px] font-bold text-gray-900 dark:text-white tracking-tight italic">{parseFloat(d.amount).toLocaleString(language === 'en' ? 'en-US' : 'fr-FR')} <span className="text-[10px] opacity-40">{d.currency}</span></td>
                                            </tr>
                                        ))}
                                        {(!org.donations || org.donations.length === 0) && (
                                            <tr>
                                                <td colSpan="3" className="py-12 text-center font-semibold text-gray-300 dark:text-gray-700 text-[11px] italic transition-colors">{t('no_donations_recorded', 'Aucun don enregistré')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Accordion>

                        <Accordion title={t('partner_groups', 'Groupes Partenaires')} icon={<GroupsIcon />}>
                            <div className="grid grid-cols-1 gap-6 transition-colors">
                                {(org.partnerGroups || []).map(g => (
                                    <div key={g.id} className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center justify-between transition-all hover:border-indigo-100 dark:hover:border-white/10 group">
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors leading-none">{g.name}</p>
                                            <p className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2 opacity-60 transition-colors uppercase leading-none">{g.type}</p>
                                        </div>
                                        <div className="bg-indigo-100 dark:bg-indigo-900/20 px-4 py-1.5 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase shadow-sm transition-colors">{t('partner', 'Partenaire')}</div>
                                    </div>
                                ))}
                                {(!org.partnerGroups || org.partnerGroups.length === 0) && (
                                    <div className="py-12 text-center font-semibold text-gray-300 dark:text-gray-700 text-[11px] italic transition-colors">{t('no_groups_found', 'Aucun groupe trouvé')}</div>
                                )}
                            </div>
                        </Accordion>

                        <Accordion title={t('ceremonies', 'Cérémonies')} icon={<CeremonyIcon />}>
                            <div className="space-y-6 transition-colors">
                                {(org.attendedCeremonies || []).map(c => (
                                    <div key={c.id} className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-8 transition-all hover:border-indigo-100 dark:hover:border-white/10 group">
                                        <div className="w-16 h-16 bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                                            <CeremonyIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight transition-colors leading-none">{c.title}</p>
                                            <p className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2 opacity-60 italic transition-colors uppercase leading-none">{c.type}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!org.attendedCeremonies || org.attendedCeremonies.length === 0) && (
                                    <div className="py-12 text-center font-semibold text-gray-300 dark:text-gray-700 text-[11px] italic transition-colors">{t('no_ceremonies_recorded', 'Aucune cérémonie enregistrée')}</div>
                                )}
                            </div>
                        </Accordion>
                    </div>

                    {/* Right Column Activities */}
                    <div className="space-y-10 transition-colors">
                        <Accordion title={t('tithe_regulator', 'Régulateur de Dîmes')} icon={<TitheIcon />}>
                            <TitheRegulator donations={org.donations || []} />
                        </Accordion>

                        <Accordion title={t('events', 'Événements')} icon={<CalendarIcon />}>
                            <div className="space-y-6 transition-colors">
                                {(org.attendedEvents || []).map(e => (
                                    <div key={e.id} className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-8 transition-all hover:border-indigo-100 dark:hover:border-white/10 group">
                                        <div className="w-16 h-16 bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-100 dark:border-white/5 font-bold text-xl group-hover:scale-110 transition-transform italic tracking-tight">
                                            {new Date(e.startDate).getDate()}
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight transition-colors leading-none">{e.title}</p>
                                            <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 mt-2 italic transition-colors leading-none">{new Date(e.startDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!org.attendedEvents || org.attendedEvents.length === 0) && (
                                    <div className="py-12 text-center font-semibold text-gray-300 dark:text-gray-700 text-[11px] italic transition-colors">{t('no_participation_recorded', 'Aucune participation enregistrée')}</div>
                                )}
                            </div>
                        </Accordion>
                    </div>
                </div>
            </div>
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

function DetailItem({ label, value, icon, isEmail, isLink }) {
    const { t } = useLanguage();
    return (
        <div className="flex items-start gap-4 group transition-all">
            <div className="w-12 h-12 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center text-gray-400 dark:text-indigo-400/30 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-gray-100 dark:border-white/5">
                {icon}
            </div>
            <div className="overflow-hidden py-1">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1 transition-colors">{label}</p>
                {isEmail ? (
                    <a href={`mailto:${value}`} className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 break-all transition-all underline decoration-indigo-500/20 underline-offset-4">{value}</a>
                ) : isLink && value !== t('not_specified') ? (
                    <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-all underline decoration-indigo-500/20 underline-offset-4">{value}</a>
                ) : (
                    <p className="text-[14px] font-bold text-gray-800 dark:text-white transition-colors">{value}</p>
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

function Accordion({ title, icon, children }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`rounded-3xl transition-all duration-300 ${isOpen ? 'bg-white dark:bg-[#1A1A1A] shadow-lg border-indigo-100 dark:border-white/5' : 'bg-gray-50 dark:bg-black border-transparent'} border-2 overflow-hidden`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-8 flex items-center justify-between transition-colors"
            >
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-black text-indigo-400 dark:text-indigo-600 border border-gray-50 dark:border-white/5 shadow-sm'}`}>
                        {icon}
                    </div>
                    <span className={`text-[13px] font-bold transition-colors ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-600'}`}>{title}</span>
                </div>
                <div className={`w-10 h-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all ${isOpen ? 'rotate-180 bg-indigo-50 dark:bg-black' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-colors ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-8 pb-10 border-t border-gray-100 dark:border-white/5 pt-8 transition-colors">
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
                    <div key={m} className={`p-8 rounded-3xl border-2 transition-all text-center flex flex-col items-center justify-center group ${paid ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-500/20 shadow-sm' : 'bg-gray-50/50 dark:bg-white/5 border-transparent opacity-40 hover:opacity-100'}`}>
                        <p className={`text-[10px] font-bold mb-4 transition-colors ${paid ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>{m}</p>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${paid ? 'bg-green-500 text-white shadow-xl shadow-green-100 dark:shadow-none' : 'bg-white dark:bg-[#1A1A1A] text-gray-200 dark:text-gray-800 border border-gray-100 dark:border-white/5'}`}>
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
                        {paid && <p className="mt-4 text-[10px] font-bold text-green-700 dark:text-green-500 transition-colors">{t('settled', 'Réglé')}</p>}
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
