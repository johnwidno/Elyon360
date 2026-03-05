import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { useLanguage } from '../../../context/LanguageContext';
import AlertModal from '../../../components/ChurchAlertModal';

export default function Organizations() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState([]);
    const [subtypes, setSubtypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', subtypeId: '', description: '', website: '', logo: '' });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgsRes, subtypesRes] = await Promise.all([
                    api.get('/organizations'),
                    api.get('/contacts/classification/subtypes')
                ]);
                setOrgs(orgsRes.data);
                const filteredSubtypes = subtypesRes.data.filter(s => {
                    const typeName = s.type?.name?.toLowerCase().trim();
                    return typeName === 'organisation' || typeName === 'organization';
                });
                setSubtypes(filteredSubtypes);
                if (filteredSubtypes.length > 0) {
                    setFormData(f => ({ ...f, subtypeId: filteredSubtypes[0].id }));
                }

                // Auto-edit logic
                const editIdStr = searchParams.get('edit');
                if (editIdStr) {
                    const orgToEdit = orgsRes.data.find(o => o.id === parseInt(editIdStr));
                    if (orgToEdit) {
                        handleEdit(orgToEdit);
                        searchParams.delete('edit');
                        setSearchParams(searchParams);
                    }
                }
            } catch (err) {
                console.error("Error fetching organizations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                const res = await api.put(`/organizations/${editId}`, formData);
                setOrgs(orgs.map(o => o.id === editId ? res.data : o));
            } else {
                const res = await api.post('/organizations', formData);
                setOrgs([...orgs, res.data]);
            }
            setShowModal(false);
            setEditId(null);
            setFormData({ name: '', email: '', phone: '', address: '', subtypeId: subtypes[0]?.id || '', description: '', website: '', logo: '' });
        } catch (err) {
            console.error("Error saving organization", err);
            setAlertMessage({ show: true, title: t('error'), message: t('error_saving', 'Erreur lors de la sauvegarde'), type: 'error' });
        }
    };

    const handleEdit = (org) => {
        if (org.isSystem) return;
        setEditId(org.id);
        setFormData({
            name: org.name,
            email: org.email || '',
            phone: org.phone || '',
            address: org.address || '',
            subtypeId: org.subtypeId || '',
            description: org.description || '',
            website: org.website || '',
            logo: org.logo || ''
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditId(null);
        setFormData({ name: '', email: '', phone: '', address: '', subtypeId: subtypes[0]?.id || '', description: '', website: '', logo: '' });
        setShowModal(true);
    };

    const handleExportPDF = () => {
        const headers = [t('name'), t('type'), t('email'), t('phone'), t('address')];
        const data = orgs.map(o => [
            o.name,
            o.subtype?.name || o.type || 'N/A',
            o.email || '-',
            o.phone || '-',
            o.address || '-'
        ]);
        exportToPDF(t('organizations'), headers, data, t('org_list_title'));
    };

    const handleExportExcel = () => {
        const data = orgs.map(o => ({
            [t('name')]: o.name,
            [t('type')]: o.subtype?.name || o.type || 'N/A',
            [t('email')]: o.email || '-',
            [t('phone')]: o.phone || '-',
            [t('address')]: o.address || '-'
        }));
        exportToExcel(t('organizations'), data);
    };

    return (
        <AdminLayout>
            <div className="space-y-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-[#1A1A1A] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-premium animate-fade-in transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl transition-all border border-indigo-100/50 dark:border-white/5 group-hover:scale-105">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-stripe-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 text-[10px] font-black text-stripe-blue tracking-[0.1em]">
                                <span className="w-8 h-[2px] bg-stripe-blue"></span>
                                <span>{t('contacts', 'Contacts')}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors leading-none">{t('organizations', 'Partenaires')}</h1>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('organizations_desc', 'Gérez les églises locales, associations et autres organisations partenaires.')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-auto transition-colors">
                        <button
                            onClick={handleExportPDF}
                            className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 px-5 py-3.5 rounded-2xl font-black text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 border border-transparent dark:border-rose-800/20"
                            title={t('export_pdf')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden lg:inline">PDF</span>
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 px-5 py-3.5 rounded-2xl font-black text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 border border-transparent dark:border-emerald-800/20"
                            title={t('export_excel')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden lg:inline">EXCEL</span>
                        </button>

                        <button
                            onClick={handleCreate}
                            className="bg-stripe-blue text-white px-8 py-3.5 rounded-2xl font-black text-[11px] tracking-widest hover:bg-indigo-700 transition-all shadow-premium active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('new_org', 'Ajouter')}
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] shadow-premium border border-gray-100 dark:border-white/5 overflow-hidden transition-all">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] noscrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-20 bg-white dark:bg-[#1A1A1A] transition-colors">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800">{t('name', 'Nom')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800">{t('type', 'Catégorie')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800">{t('contact', 'Coordonnées')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800">{t('address', 'Adresse')}</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 transition-colors">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-10 py-32 text-center transition-colors">
                                        <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black tracking-widest">{t('loading')}</p>
                                        </div>
                                    </td></tr>
                                ) : orgs.length === 0 ? (
                                    <tr><td colSpan="5" className="px-10 py-32 text-center text-gray-300 dark:text-gray-600 font-black tracking-widest text-[10px] transition-colors italic">{t('no_orgs', 'Aucune organisation trouvée')}</td></tr>
                                ) : (
                                    orgs.map((o, index) => (
                                        <tr key={o.id}
                                            className="hover:bg-gray-50 dark:hover:bg-indigo-900/10 transition-all group animate-slide-up cursor-pointer"
                                            onClick={() => navigate(`/admin/organizations/${o.id}`)}
                                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}>
                                            <td className="px-10 py-6">
                                                <div className="font-black text-gray-900 dark:text-white group-hover:text-stripe-blue transition-colors text-[14px] leading-tight flex items-center gap-3 tracking-tight">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 flex items-center justify-center text-stripe-blue dark:text-stripe-purple font-black text-[11px] group-hover:scale-110 group-hover:bg-indigo-50 transition-all shadow-stripe">
                                                        {o.name?.[0]}
                                                    </div>
                                                    {o.name}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest ${o.isSystem ? 'bg-indigo-50 dark:bg-indigo-900/20 text-stripe-blue dark:text-stripe-purple border border-indigo-100 dark:border-white/5' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-transparent'}`}>
                                                    {o.subtype?.name || o.type || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-[12px] font-black text-gray-900 dark:text-white leading-tight tracking-tight">{o.email || '—'}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 transition-colors">{o.phone || '-'}</p>
                                            </td>
                                            <td className="px-10 py-6 text-[11px] text-gray-400 font-medium max-w-[200px] truncate">
                                                {o.address || '—'}
                                            </td>
                                            <td className="px-10 py-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2 transition-colors">
                                                    <Link to={`/admin/organizations/${o.id}`} className="text-gray-400 hover:text-stripe-blue transition-all p-3 bg-gray-50 dark:bg-black border border-transparent hover:border-indigo-100 dark:hover:border-white/5 rounded-xl hover:scale-110 active:scale-95 shadow-stripe" title={t('view')}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    {!o.isSystem && (
                                                        <button onClick={() => handleEdit(o)} className="text-gray-400 hover:text-amber-500 transition-all p-3 bg-gray-50 dark:bg-black border border-transparent hover:border-amber-100 dark:hover:border-white/5 rounded-xl hover:scale-110 active:scale-95 shadow-stripe" title={t('edit')}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal - Polished Design */}
            {showModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/90 backdrop-blur-md transition-all">
                    <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-premium-hover w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-100 dark:border-white/5 animate-scale-in transition-all">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-gray-50 dark:border-white/5 shrink-0">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2 text-[9px] font-black text-stripe-blue tracking-[0.1em] mb-1">
                                        <span className="w-6 h-[2.5px] bg-stripe-blue"></span>
                                        <span>{t('entry', 'Fiche d\'inscription')}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                        {editId ? t('edit_org', 'Modifier l\'organisation') : t('new_org', 'Nouvelle Organisation')}
                                    </h3>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">{t('org_info_desc', 'Renseignez les informations officielles de l\'institution partenaire.')}</p>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 border border-transparent dark:border-white/5 shadow-stripe">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="px-10 py-10 overflow-y-auto noscrollbar flex-1 bg-white dark:bg-[#1A1A1A]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('org_name', 'Nom de l\'organisation')} <span className="text-rose-500">*</span></label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                            placeholder={t('org_name_placeholder', 'Ex: Église de la Grâce, Vision Monde...')} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('category', 'Catégorie')} <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <select required value={formData.subtypeId} onChange={e => setFormData({ ...formData, subtypeId: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all appearance-none cursor-pointer shadow-stripe">
                                                <option value="">{t('select_category')}</option>
                                                {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('website', 'Site Web')}</label>
                                        <input type="url" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                            placeholder="https://www.exemple.com" />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('official_email', 'Email Officiel')}</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                            placeholder="contact@organisation.org" />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('phone', 'Téléphone')}</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                            placeholder="+509 ..." />
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('address_hq', 'Siège Social / Adresse')}</label>
                                        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all placeholder-gray-400/50 shadow-stripe"
                                            placeholder={t('address_placeholder', 'Indiquez l\'adresse physique complète')} />
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{t('notes', 'Observations / Description')}</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-[14px] font-bold text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-stripe-blue transition-all min-h-[120px] resize-none noscrollbar placeholder-gray-400/50 shadow-stripe"
                                            placeholder={t('notes_placeholder', 'Informations complémentaires sur le partenaire...')} />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-10 bg-gray-50 dark:bg-black/50 flex justify-end gap-4 shrink-0 transition-all border-t border-gray-100 dark:border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-500 font-bold text-[10px] tracking-widest rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95 shadow-stripe">
                                    {t('cancel', 'Annuler')}
                                </button>
                                <button type="submit" className="px-10 py-4 bg-stripe-blue text-white font-black text-[11px] tracking-widest rounded-2xl hover:bg-indigo-700 shadow-premium active:scale-95 transition-all">
                                    {editId ? t('save', 'Mettre à jour') : t('confirm', 'Créer l\'organisation')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
