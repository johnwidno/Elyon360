import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import AlertModal from '../../../components/ChurchAlertModal';
import CommunicationModal from '../../../components/Admin/CommunicationModal';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import { useLanguage } from '../../../context/LanguageContext';
import BatchMemberCardGeneratorModal from '../../../components/Admin/Members/BatchMemberCardGeneratorModal';
import { 
    Users, UserPlus, MessageSquare, Search, 
    FileText, Table as TableIcon, Eye, Edit, Trash2, 
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Mail, Phone
} from 'lucide-react';

export default function Members() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subtypes, setSubtypes] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    // Custom Modal States
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    
    const [page, setPage] = useState(1);
    const MEMBERS_PER_PAGE = 10;

    // Messaging State
    const [messageModal, setMessageModal] = useState({ isOpen: false, recipient: null, recipients: [], mode: 'individual' });
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // Filtering & Stats states
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        status: '',
        category: '',
        dateStart: '',
        dateEnd: ''
    });

    const statsData = useMemo(() => {
        const getStatus = (m) => (m.status || 'actif').toLowerCase();
        const getBaptism = (m) => (m.baptismalStatus || '').toLowerCase();

        return {
            total: members.length,
            active: members.filter(m => getStatus(m) === 'actif' || getStatus(m) === 'active').length,
            inactive: members.filter(m => getStatus(m) === 'inactif' || getStatus(m) === 'inactive').length,
            traveling: members.filter(m => getStatus(m) === 'en déplacement' || getStatus(m) === 'traveling').length,
            baptized: members.filter(m => getBaptism(m) === 'baptized' || getBaptism(m) === 'baptisé').length,
            candidates: members.filter(m => getBaptism(m) === 'candidate' || getBaptism(m) === 'candidat').length,
            adherents: members.filter(m => getBaptism(m) === 'adherent' || getBaptism(m) === 'adhérent').length,
            transferred: members.filter(m => getStatus(m) === 'transféré' || getStatus(m) === 'transferred').length,
            deceased: members.filter(m => getStatus(m) === 'décédé' || getStatus(m) === 'deceased').length,
        };
    }, [members]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRes, subtypesRes] = await Promise.all([
                    api.get('/members'),
                    api.get('/contacts/classification/subtypes')
                ]);
                setMembers(membersRes.data);
                setFilteredMembers(membersRes.data);

                const filteredSubtypes = subtypesRes.data.filter(s => {
                    const typeName = s.type?.name?.toLowerCase().trim();
                    return typeName === 'membre' || typeName === 'member';
                });
                setSubtypes(filteredSubtypes);

                if (location.state?.fromVisitor && location.state?.prefillData) {
                    navigate('/admin/members/new', { 
                        state: { 
                            prefillData: { ...location.state.prefillData, role: ['member'] }, 
                            fromVisitor: true, 
                            visitorId: location.state.visitorId 
                        },
                        replace: true 
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, location.state]);

    useEffect(() => {
        let result = [...members];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(m =>
                m.firstName.toLowerCase().includes(q) ||
                m.lastName.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q)
            );
        }
        if (filters.status) result = result.filter(m => m.status === filters.status);
        if (filters.category) result = result.filter(m => m.subtypeId === parseInt(filters.category));
        if (filters.dateStart) result = result.filter(m => new Date(m.createdAt) >= new Date(filters.dateStart));
        if (filters.dateEnd) {
            const end = new Date(filters.dateEnd);
            end.setHours(23, 59, 59, 999);
            result = result.filter(m => new Date(m.createdAt) <= end);
        }
        setFilteredMembers(result);
    }, [filters, members]);

    const displayedMembers = useMemo(() => {
        return filteredMembers.slice((page - 1) * MEMBERS_PER_PAGE, page * MEMBERS_PER_PAGE);
    }, [filteredMembers, page]);

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/members/${deleteId}`);
            setMembers(members.filter(m => m.id !== deleteId));
            setAlertMessage({ show: true, title: t('success', 'Succès'), message: 'Membre supprimé avec succès.', type: 'success' });
        } catch (error) {
            setAlertMessage({ show: true, title: t('error', 'Erreur'), message: 'Erreur lors de la suppression.', type: 'error' });
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    const handleExportPDF = () => {
        const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut'];
        const data = filteredMembers.map(m => [m.firstName, m.lastName, m.email, m.phone, m.status]);
        exportToPDF('Liste des membres', headers, data);
    };

    const handleExportExcel = () => {
        const data = filteredMembers.map(m => ({
            'Prénom': m.firstName,
            'Nom': m.lastName,
            'Email': m.email,
            'Téléphone': m.phone,
            'Statut': m.status
        }));
        exportToExcel('Liste des membres', data);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 p-6 font-['Inter'] transition-colors">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm">
                            <Users size={32} className="text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                Membres / Vue d'ensemble
                            </h1>
                            <p className="text-[13px] font-medium text-gray-400 dark:text-gray-500 mt-2">
                                Analysez et gérez vos membres
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setMessageModal({ isOpen: true, recipients: filteredMembers, mode: 'bulk' })}
                            className="px-6 py-3 bg-[#111C44] text-white rounded-xl font-bold text-[13px] hover:bg-[#1A2E6E] transition-all flex items-center gap-2 active:scale-95"
                        >
                            Message groupé
                        </button>
                        <button 
                            onClick={() => navigate('/admin/members/new')}
                            className="px-6 py-3 bg-[#111C44] text-white rounded-xl font-bold text-[13px] hover:bg-[#1A2E6E] transition-all flex items-center gap-2 active:scale-95"
                        >
                            Nouveau membre
                        </button>
                    </div>
                </div>

                {/* Horizontal Stats Bar */}
                <div className="bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <StatItem label="Total" value={statsData.total} />
                        <StatItem label="Actif" value={statsData.active} />
                        <StatItem label="Inactif" value={statsData.inactive} />
                        <StatItem label="En déplacement" value={statsData.traveling} />
                        <StatItem label="Baptisé :" value={statsData.baptized} />
                        <StatItem label="Candidat au baptême :" value={statsData.candidates} />
                        <StatItem label="Adhérent" value={statsData.adherents} />
                        <StatItem label="transféré :" value={statsData.transferred} />
                        <StatItem label="Décédé" value={statsData.deceased} />
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-4 py-2">
                    <div className="relative flex-1 min-w-[200px] max-w-sm group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#111C44]" />
                        <input 
                            type="text" 
                            placeholder="Recherche" 
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border-none rounded-full text-[13px] font-medium outline-none focus:ring-2 focus:ring-[#111C44]/20 transition-all dark:text-white"
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>

                    <select 
                        className="bg-transparent text-[13px] font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                        <option value="En déplacement">En déplacement</option>
                    </select>

                    <select 
                        className="bg-transparent text-[13px] font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">Toutes catégories</option>
                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <div className="flex items-center gap-4 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 font-medium">By date</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-medium lowercase">Du</span>
                            <input type="date" className="bg-transparent outline-none cursor-pointer font-medium" value={filters.dateStart} onChange={(e) => setFilters({...filters, dateStart: e.target.value})} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-medium lowercase">Au</span>
                            <input type="date" className="bg-transparent outline-none cursor-pointer font-medium" value={filters.dateEnd} onChange={(e) => setFilters({...filters, dateEnd: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 ml-auto">
                        <button onClick={handleExportExcel} className="p-2 text-gray-400 hover:text-emerald-500 transition-colors" title="Export Excel">
                            <TableIcon size={20} />
                        </button>
                        <button onClick={handleExportPDF} className="p-2 text-gray-400 hover:text-rose-500 transition-colors" title="Export PDF">
                            <FileText size={20} />
                        </button>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto noscrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 dark:border-white/5">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Photo</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Sexe</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Age</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-20 text-center text-gray-400 italic">Chargement...</td>
                                    </tr>
                                ) : displayedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-20 text-center text-gray-400 italic">Aucun membre trouvé</td>
                                    </tr>
                                ) : (
                                    displayedMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-white/5 flex items-center justify-center text-brand-primary dark:text-brand-orange font-black text-[13px] overflow-hidden">
                                                    {member.photo ? (
                                                        <img src={member.photo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer group/name" onClick={() => navigate(`/admin/members/${member.id}`)}>
                                                <div>
                                                    <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight group-hover/name:text-[#111C44] transition-colors">
                                                        {member.firstName} {member.lastName}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                                                        {member.city || 'Ville'}, {member.department || 'Département'}, {member.country || 'Pays'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                                                        <Phone size={10} className="text-gray-400" />
                                                        {member.phone || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600">
                                                        <Mail size={10} />
                                                        {member.email || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${member.gender === 'M' || member.gender === 'Masculin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600'}`}>
                                                    {member.gender === 'M' || member.gender === 'Masculin' ? 'M' : 'F'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
                                                    {calculateAge(member.birthDate)} <span className="text-[10px] text-gray-400 ml-0.5">ans</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const category = subtypes.find(s => s.id === member.subtypeId)?.name?.toLowerCase() || 'adult';
                                                    const colorClasses = {
                                                        adult: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
                                                        youth: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
                                                        child: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600',
                                                        student: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                                                    };
                                                    return (
                                                        <span className={`px-4 py-1 ${colorClasses[category] || 'bg-gray-50 text-gray-600'} text-[10px] font-black lowercase tracking-widest rounded-lg`}>
                                                            {category}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[12px] font-bold text-gray-600 dark:text-gray-400">
                                                    {Array.isArray(member.role) ? member.role[0] : member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${member.status?.toLowerCase() === 'actif' || !member.status ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                                                    {member.status?.toLowerCase() === 'actif' || !member.status ? 'active' : member.status?.toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => navigate(`/admin/members/${member.id}`)}
                                                        className="p-2 text-gray-400 hover:text-[#111C44] transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent rounded-xl hover:scale-110 active:scale-95 shadow-sm"
                                                        title="Voir le profil"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setMessageModal({ isOpen: true, recipient: member, mode: 'individual' })}
                                                        className="p-2 text-gray-400 hover:text-brand-primary dark:hover:text-brand-orange transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent rounded-xl hover:scale-110 active:scale-95 shadow-sm"
                                                        title="Envoyer un message"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <button onClick={() => navigate(`/admin/members/edit/${member.id}`)} className="p-2 text-gray-400 hover:text-amber-500 transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent rounded-xl hover:scale-110 active:scale-95 shadow-sm" title="Modifier">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => { setDeleteId(member.id); setShowDeleteModal(true); }} className="p-2 text-gray-400 hover:text-rose-500 transition-all bg-gray-50 dark:bg-gray-800/50 border border-transparent rounded-xl hover:scale-110 active:scale-95 shadow-sm" title="Supprimer">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600 italic">
                            Showing {displayedMembers.length} of {filteredMembers.length} members
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page === 1}
                                className="p-2 text-gray-400 hover:text-[#111C44] disabled:opacity-30"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * MEMBERS_PER_PAGE >= filteredMembers.length}
                                className="p-2 text-gray-400 hover:text-[#111C44] disabled:opacity-30"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Supprimer ce membre ?"
                message="Cette action est irréversible."
            />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />

            <CommunicationModal
                isOpen={messageModal.isOpen}
                onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
                recipient={messageModal.recipient}
                recipients={messageModal.recipients}
                mode={messageModal.mode}
            />
        </AdminLayout>
    );
}

const StatItem = ({ label, value }) => (
    <div className="flex items-center gap-2 text-[13px]">
        <span className="text-gray-400 dark:text-gray-600 font-medium whitespace-nowrap">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
);
