import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import ConfirmModal from '../../ConfirmModal';
import AlertModal from '../../ChurchAlertModal';
import { useNavigate } from 'react-router-dom';

const OrganizationRolesList = ({ memberId, isTableView }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const fetchRoles = async () => {
        try {
            const res = await api.get(`/relationships/user/${memberId}/organization-roles`);
            setRoles(res.data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) fetchRoles();
    }, [memberId]);

    const handleDelete = async () => {
        const organizationId = confirmModal.id;
        if (!organizationId) return;
        try {
            await api.delete(`/relationships/organization-role/${memberId}/${organizationId}`);
            setRoles(prev => prev.filter(r => r.organizationId !== organizationId));
        } catch (error) {
            console.error("Error deleting role:", error);
        } finally {
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    if (isTableView) {
        return (
            <div className="overflow-x-auto mt-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <p className="text-[11px] font-black text-gray-400">{t('organizational_roles', 'Rôles Organisationnels')}</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditData(null); setShowModal(true); }}
                        className="text-[11px] font-bold text-stripe-blue hover:underline flex items-center gap-1"
                    >
                        + {t('add_role', 'Ajouter un rôle')}
                    </button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-black/40">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('organization', 'Organisation')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('role', 'Rôle')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 hidden sm:table-cell">{t('description', 'Description')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400">{t('status', 'Statut')}</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-400 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5 text-[12px]">
                        {roles.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-xs text-gray-400">
                                    {t('no_org_roles', 'Aucun rôle organisationnel enregistré.')}
                                </td>
                            </tr>
                        ) : roles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {role.organization?.logo ? (
                                            <img src={role.organization.logo} alt="" className="w-8 h-8 rounded object-contain bg-white" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                                                {role.organization?.name?.[0]}
                                            </div>
                                        )}
                                        <span
                                            className="font-bold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/organizations/${role.organization?.id}`); }}
                                        >
                                            {role.organization?.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[9px] font-black">
                                        {t(role.role?.toLowerCase()) || role.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <span className="text-gray-500 dark:text-gray-400 text-[11px] truncate max-w-[150px] inline-block">{role.description || '-'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${role.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {t(role.status?.toLowerCase()) || role.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setEditData(role); setShowModal(true); }} className="text-indigo-400 hover:text-indigo-600 transition-colors p-1" title={t('edit', 'Modifier')}>✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: role.organizationId }); }} className="text-rose-500 hover:text-rose-700 transition-colors p-1" title={t('delete', 'Supprimer')}>✕</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {showModal && (
                    <AddOrganizationRoleModal
                        memberId={memberId}
                        editData={editData}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false);
                            fetchRoles();
                        }}
                    />
                )}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, id: null })}
                    onConfirm={handleDelete}
                    title={t('confirm_delete', 'Confirmer la suppression')}
                    message={t('confirm_remove_role', 'Êtes-vous sûr de vouloir retirer ce rôle ?')}
                />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-white/5 p-10 mt-10 transition-colors shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight transition-colors">{t('organizational_roles', 'Rôles Organisationnels')}</h3>
                <button
                    onClick={() => { setEditData(null); setShowModal(true); }}
                    className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                    + {t('add', 'Ajouter')}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600 font-medium text-[13px] animate-pulse transition-colors">{t('loading')}</div>
            ) : roles.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-700 font-medium text-[13px] bg-gray-50/50 dark:bg-white/5 rounded-[1.5rem] transition-colors">
                    {t('no_org_roles', 'Aucun rôle organisationnel.')}
                </div>
            ) : (
                <div className="space-y-3">
                    {roles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-none transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden transition-colors shadow-sm group-hover:scale-110 transition-transform">
                                    {role.organization?.logo ? (
                                        <img src={role.organization.logo} alt="" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xl italic uppercase">{role.organization?.name?.[0]}</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div
                                        className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight transition-colors cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/organizations/${role.organization?.id}`); }}
                                    >
                                        {role.organization?.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-3 transition-colors">
                                        <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[8px] transition-colors shadow-[inset_0_0_0_1px_rgba(79,70,229,0.1)]">
                                            {t(role.role?.toLowerCase()) || role.role}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] transition-colors ${role.status === 'Active' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                            {t(role.status?.toLowerCase()) || role.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ml-4">
                                <button
                                    onClick={() => { setEditData(role); setShowModal(true); }}
                                    className="text-gray-400 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                    title={t('edit', 'Modifier')}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, id: role.organizationId })}
                                    className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title={t('delete', 'Supprimer')}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <AddOrganizationRoleModal
                    memberId={memberId}
                    editData={editData}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchRoles();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title={t('confirm_delete', 'Confirmer la suppression')}
                message={t('confirm_remove_role', 'Êtes-vous sûr de vouloir retirer ce rôle ?')}
            />
        </div>
    );
};

const AddOrganizationRoleModal = ({ memberId, editData, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [role, setRole] = useState('Member');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Active');
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    useEffect(() => {
        if (editData) {
            setSelectedOrg(editData.organization);
            setRole(editData.role || 'Member');
            setDescription(editData.description || '');
            setNotes(editData.notes || '');
            setStatus(editData.status || 'Active');
        } else {
            setSelectedOrg(null);
            setRole('Member');
            setDescription('');
            setNotes('');
            setStatus('Active');
            setSearch('');
        }
    }, [editData]);

    useEffect(() => {
        if (search.length > 2) {
            const delaySearch = setTimeout(async () => {
                try {
                    const res = await api.get('/organizations'); // Should filter backend side ideally
                    const filtered = res.data.filter(o =>
                        o.name.toLowerCase().includes(search.toLowerCase())
                    );
                    setResults(filtered.slice(0, 5));
                } catch (error) {
                    console.error("Search error:", error);
                }
            }, 300);
            return () => clearTimeout(delaySearch);
        } else {
            setResults([]);
        }
    }, [search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrg || !role) return;

        setLoading(true);
        try {
            if (editData) {
                await api.put(`/relationships/organization-role/${memberId}/${editData.organizationId}`, {
                    role,
                    description,
                    notes,
                    status
                });
            } else {
                await api.post('/relationships/organization-role', {
                    userId: memberId,
                    organizationId: selectedOrg.id,
                    role,
                    description,
                    notes
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Save error:", error);
            setAlertMessage({
                show: true,
                title: t('error', 'Erreur'),
                message: t('error_saving_role', "Erreur lors de la sauvegarde du rôle"),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const roles = ["Fondateur", "Président", "Membre", "Bénévole", "Employé", "Responsable"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors p-4">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-8 animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">{editData ? t('edit_org_role', 'Modifier le rôle') : t('assign_org_role', 'Attribuer un rôle organisationnel')}</h3>
                <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-6 transition-colors">{t('link_member_to_org', 'Lier ce membre à une organisation')}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Search Organization */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                                {t('search_organization', "Rechercher l'organisation")}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all disabled:opacity-50"
                                    placeholder={t('org_name_placeholder', "Nom de l'organisation...")}
                                    value={selectedOrg ? selectedOrg.name : search}
                                    disabled={!!editData}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setSelectedOrg(null);
                                    }}
                                />
                                {selectedOrg && !editData && (
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedOrg(null); setSearch(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}

                                {/* Search Results Dropdown */}
                                {!selectedOrg && search.length > 2 && results.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto noscrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                        {results.map(org => (
                                            <div
                                                key={org.id}
                                                onClick={() => {
                                                    setSelectedOrg(org);
                                                    setSearch('');
                                                }}
                                                className="p-3 hover:bg-indigo-600 dark:hover:bg-indigo-600 group cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:bg-white/20 group-hover:text-white transition-colors">
                                                    {org.name[0]}
                                                </div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-white transition-colors">
                                                    {org.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Role Select */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                                {t('role')}
                            </label>
                            <select
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all appearance-none cursor-pointer"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                {roles.map(r => <option key={r} value={r} className="dark:bg-[#1A1A1A]">{t(r.toLowerCase()) || r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                                {t('description', 'Description (Optionnel)')}
                            </label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all"
                                placeholder={t('description_placeholder', "Description...")}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Status (Only in Edit mode) */}
                        {editData ? (
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                                    {t('status', 'Statut')}
                                </label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all appearance-none cursor-pointer"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="Active" className="dark:bg-[#1A1A1A]">{t('active', 'Actif')}</option>
                                    <option value="Former" className="dark:bg-[#1A1A1A]">{t('former', 'Ancien')}</option>
                                    <option value="On Leave" className="dark:bg-[#1A1A1A]">{t('on_leave', 'En congé')}</option>
                                </select>
                            </div>
                        ) : (
                            <div className="hidden sm:block"></div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                            {t('notes', 'Notes (Optionnel)')}
                        </label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all resize-none h-16"
                            placeholder={t('note_placeholder', "Note supplémentaire...")}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 transition-colors">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-50 dark:bg-white/5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95 transition-colors"
                        >
                            {t('cancel', 'Annuler')}
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedOrg || loading}
                            className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
                        >
                            {loading ? t('saving', 'Sauvegarde...') : (editData ? t('save', 'Enregistrer') : t('assign', 'Attribuer'))}
                        </button>
                    </div>
                </form>
            </div>

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </div>
    );
};

export default OrganizationRolesList;
