import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { useLanguage } from '../../../context/LanguageContext';

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
                        // Clear param
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
                // Use the returned object which now has the rich subtype data
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
            // alert(t('error_saving', 'Erreur lors de la sauvegarde'));
        }
    };

    const handleEdit = (org) => {
        if (org.isSystem) return; // Prevent editing virtual churches
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
            <div className="mb-12 flex flex-wrap md:flex-nowrap justify-between items-center bg-white dark:bg-[#1A1A1A] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm animate-fade-in gap-8 transition-colors">
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-50 dark:bg-black p-5 rounded-2xl transition-colors border border-indigo-100 dark:border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors leading-none">{t('organizations')}</h1>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">{t('management_desc')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-auto transition-colors">
                    <button
                        onClick={handleExportPDF}
                        className="bg-red-50 dark:bg-black text-red-600 dark:text-red-400 px-6 py-3 rounded-xl font-semibold text-[12px] hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 border border-transparent dark:border-white/5 shadow-sm"
                        title={t('export_pdf')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden lg:inline">PDF</span>
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="bg-green-50 dark:bg-black text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-semibold text-[12px] hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 active:scale-95 border border-transparent dark:border-white/5 shadow-sm"
                        title={t('export_excel')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden lg:inline">Excel</span>
                    </button>

                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-[13px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden lg:inline">{t('new_org')}</span>
                        <span className="lg:hidden">+</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-auto max-h-[calc(100vh-320px)] transition-colors noscrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-white/5 transition-colors">
                        <tr>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 transition-colors">{t('name')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 transition-colors">{t('type')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 transition-colors">{t('contact')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 transition-colors">{t('address')}</th>
                            <th className="px-10 py-5 text-[11px] font-semibold text-gray-500 transition-colors text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 transition-colors">
                        {loading ? (
                            <tr><td colSpan="5" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors animate-pulse">{t('loading')}</td></tr>
                        ) : orgs.length === 0 ? (
                            <tr><td colSpan="5" className="px-10 py-24 text-center text-gray-400 dark:text-gray-600 font-semibold text-[11px] transition-colors">{t('no_orgs')}</td></tr>
                        ) : (
                            orgs.map((o, index) => (
                                <tr key={o.id}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all group animate-slide-up opacity-0 cursor-pointer"
                                    onClick={() => navigate(`/admin/organizations/${o.id}`)}
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}>
                                    <td className="px-10 py-5">
                                        <div className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors text-[14px] leading-tight">{o.name}</div>
                                    </td>
                                    <td className="px-10 py-5">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold ${o.isSystem ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-white/5' : 'bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-600 border border-gray-100 dark:border-white/5'}`}>
                                            {o.subtype?.name || o.type || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-5">
                                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">{o.email || '—'}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-500 font-medium mt-1 transition-colors">{o.phone || '-'}</p>
                                    </td>
                                    <td className="px-10 py-6 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                        {o.address || '—'}
                                    </td>
                                    <td className="px-10 py-5 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2 transition-colors">
                                            <Link to={`/admin/organizations/${o.id}`} className="text-gray-400 hover:text-blue-600 transition-all p-2.5 bg-gray-50 dark:bg-black/20 rounded-xl hover:scale-105 active:scale-95 border border-gray-100 dark:border-white/5" title={t('view')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            {!o.isSystem && (
                                                <button onClick={() => handleEdit(o)} className="text-gray-400 hover:text-amber-500 transition-all p-2.5 bg-gray-50 dark:bg-black/20 rounded-xl hover:scale-105 active:scale-95 border border-gray-100 dark:border-white/5" title={t('edit')}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

            {showModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-all">
                    <div className="relative bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-100 dark:border-white/10 transition-colors z-10">
                        {/* Modal Header */}
                        <div className="bg-white dark:bg-[#1A1A1A] p-10 border-b border-gray-100 dark:border-white/5 shrink-0 transition-colors">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-none transition-colors">
                                        {editId ? t('edit_org') : t('new_org')}
                                    </h3>
                                    <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2">{t('org_info_desc')}</p>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-transparent dark:border-white/5 transition-all font-bold active:scale-95 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden transition-colors">
                            <div className="bg-white dark:bg-[#1A1A1A] px-10 py-8 overflow-y-auto noscrollbar flex-1 transition-colors">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {/* Section: Identification */}
                                    <div className="md:col-span-2">
                                        <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-4 transition-colors">{t('identification_classification')}</h4>
                                        <div className="h-px bg-gray-100 dark:bg-white/5 w-full transition-colors"></div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('org_name')} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all placeholder-gray-400"
                                            placeholder={t('org_name_placeholder')} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('category')} <span className="text-red-500">*</span></label>
                                        <select required value={formData.subtypeId} onChange={e => setFormData({ ...formData, subtypeId: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all cursor-pointer appearance-none">
                                            <option value="">{t('select_category')}</option>
                                            {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('website', 'Site Web (URL)')}</label>
                                        <input type="url" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all placeholder-gray-400"
                                            placeholder="https://..." />
                                    </div>

                                    {/* Section: Contact */}
                                    <div className="md:col-span-2 mt-8">
                                        <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-4 transition-colors">{t('contact_location')}</h4>
                                        <div className="h-px bg-gray-100 dark:bg-white/5 w-full transition-colors"></div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('official_email', 'Email Officiel')}</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all placeholder-gray-400"
                                            placeholder="contact@exemple.com" />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('phone', 'Téléphone')}</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all placeholder-gray-400"
                                            placeholder="+1 ..." />
                                    </div>

                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('address_hq')}</label>
                                        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all placeholder-gray-400"
                                            placeholder={t('address_placeholder')} />
                                    </div>

                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 transition-colors">{t('notes')}</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[14px] font-medium text-gray-700 dark:text-white outline-none focus:border-blue-500/30 transition-all min-h-[140px] resize-none noscrollbar placeholder-gray-400"
                                            placeholder={t('notes_placeholder')} />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 dark:bg-[#080808] p-8 flex justify-end gap-4 shrink-0 transition-colors border-t dark:border-white/5">
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-white dark:bg-black text-gray-500 dark:text-gray-500 text-[12px] font-semibold rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 shadow-sm">
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="px-10 py-3 bg-blue-600 text-white text-[12px] font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all">
                                    {editId ? t('save') : t('confirm')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
