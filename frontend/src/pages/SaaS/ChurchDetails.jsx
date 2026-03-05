import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AlertModal from '../../components/ChurchAlertModal';
import {
    LayoutDashboard, Church as ChurchIcon, CreditCard, Users,
    ArrowLeft, Globe, Mail, Phone, MapPin,
    Facebook, Instagram, Twitter, ExternalLink,
    Star, Settings, Trash2, Edit, CheckCircle, XCircle,
    Calendar, Shield, Info, Activity, Clock, FileText,
    ChevronDown, ChevronRight, Eye, Heart, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const ChurchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'error' });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/saas/churches/${id}`);
                setChurch(res.data);
            } catch (error) {
                console.error("Error fetching church details", error);
                setAlertMessage({ show: true, title: 'Erreur', message: "Erreur lors du chargement des détails", type: 'error' });
                navigate('/super-admin');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-bold animate-pulse">Chargement de l'institution...</p>
            </div>
        </div>
    );
    if (!church) return null;

    const socialLinks = typeof church.socialLinks === 'string' ? JSON.parse(church.socialLinks || '{}') : (church.socialLinks || {});
    const pastoralTeam = typeof church.pastoralTeam === 'string' ? JSON.parse(church.pastoralTeam || '[]') : (church.pastoralTeam || []);
    const schedules = typeof church.schedules === 'string' ? JSON.parse(church.schedules || '[]') : (church.schedules || []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const hasAnySocial = socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.website;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 font-sans">
            {/* Topbar Navigation */}
            <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => navigate('/super-admin')}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-all group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black tracking-tight dark:text-white">Détails de l'institution</h2>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                            <Shield size={10} /> Gestion SaaS centralisée
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-tight border transition-all ${church.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600'
                        }`}>
                        {church.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                </div>
            </header>

            <main className="max-w-full mx-auto p-4 md:p-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >

                    {/* LEFT COLUMN: Identity & Quick Info */}
                    <div className="lg:col-span-3 space-y-6">
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1e293b] rounded-[32px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden sticky top-28"
                        >
                            {/* Logo Section */}
                            <div className="p-8 flex flex-col items-center">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-48 h-48 bg-gray-50 dark:bg-[#0f172a] rounded-[48px] flex items-center justify-center border-2 border-gray-100 dark:border-gray-800 p-4 shadow-inner overflow-hidden"
                                >
                                    {church.logoUrl ? (
                                        <img
                                            src={church.logoUrl.startsWith('http') ? church.logoUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.logoUrl}`}
                                            alt="Logo"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-600 rounded-[36px] flex items-center justify-center text-white text-7xl font-black shadow-lg shadow-indigo-500/30">
                                            {church.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </motion.div>
                                <div className="mt-8 flex flex-col items-center gap-2">
                                    <h1 className="text-2xl font-black text-center dark:text-white leading-tight">
                                        {church.name.charAt(0).toUpperCase() + church.name.slice(1).toLowerCase()}
                                    </h1>
                                    <a
                                        href={`http://localhost:3000/?tenant=${church.subdomain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 font-bold text-xs tracking-tight hover:bg-indigo-100 transition-all flex items-center gap-2"
                                    >
                                        Accéder au site web <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            {/* Information Hub */}
                            <div className="px-6 pb-6 space-y-4">
                                <CollapsibleSection
                                    title="Coordonnées"
                                    icon={<Info size={16} />}
                                    compact
                                >
                                    <div className="space-y-4 pt-4">
                                        <ContactItem icon={<Mail size={14} />} value={church.contactEmail || church.admin?.email} />
                                        <ContactItem icon={<Phone size={14} />} value={church.contactPhone || 'Non renseigné'} />
                                        <ContactItem icon={<MapPin size={14} />} value={church.city || 'Ville non renseignée'} />
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection
                                    title="Réseaux sociaux"
                                    icon={<Globe size={16} />}
                                    compact
                                >
                                    <div className="space-y-3 pt-3">
                                        <SocialLink icon={<Facebook size={16} />} label="Facebook" link={socialLinks.facebook} />
                                        <SocialLink icon={<Instagram size={16} />} label="Instagram" link={socialLinks.instagram} />
                                        <SocialLink icon={<Twitter size={16} />} label="Twitter" link={socialLinks.twitter} />
                                        <SocialLink icon={<Globe size={16} />} label="Site Web" link={socialLinks.website} />
                                        {!hasAnySocial && <p className="text-[11px] text-gray-400 italic text-center py-2">Aucun lien renseigné</p>}
                                    </div>
                                </CollapsibleSection>
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-50 dark:border-gray-800">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-full py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl text-[12px] font-black shadow-lg hover:bg-black transition-all"
                                >
                                    Fermer la page
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: Detailed Hub */}
                    <div className="lg:col-span-9 space-y-8">
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1e293b] rounded-[40px] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-10"
                        >
                            {/* Header Hub */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-50 dark:border-gray-800">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
                                        <span className="ml-2 text-xs font-bold text-amber-500">5.0 (Admin Rating)</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">{church.name} <span className="text-lg font-normal text-gray-400"> - {church.acronym}</span></h2>
                                </div>
                                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 text-xs font-bold">
                                    Plan {church.planName}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
                                <InfoBlock label="Responsable (PIC)" value={church.admin?.name || 'Non assigné'} subValue={church.admin?.email} />
                                <InfoBlock label="Statut officiel" value={church.status === 'active' ? 'Opérationnel' : 'Suspendu'} />
                                <InfoBlock label="Siège social" value={church.address || 'Adresse non renseignée'} subValue={church.city} />
                                <InfoBlock label="ID transaction" value={church.moncashTransactionId || 'Abonnement gratuit'} />
                                <InfoBlock label="Enregistré par" value="SaaS Portal" />
                                <InfoBlock label="Date d'adhésion" value={new Date(church.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
                            </div>

                            {/* Section: Features / Services */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                <CategoryBlock
                                    icon={<Activity size={18} />}
                                    title="Activité récente"
                                    items={[`${church.stats.members} Membres actifs`, `${church.stats.visitors} Visiteurs ce mois`]}
                                />
                                <CategoryBlock
                                    icon={<Users size={18} />}
                                    title="Équipe"
                                    items={pastoralTeam.length > 0 ? pastoralTeam.slice(0, 3).map(m => m.name) : ["Équipe non renseignée"]}
                                />
                                <CategoryBlock
                                    icon={<Clock size={18} />}
                                    title="Horaires"
                                    items={schedules.length > 0 ? schedules.slice(0, 3).map(s => `${s.day}: ${s.time}`) : ["Aucun horaire"]}
                                />
                            </div>

                            {/* Long Content sections - Accordions */}
                            <div className="mt-12 space-y-6">
                                <CollapsibleSection title="Mission de l'institution" icon={<Info size={18} />}>
                                    <div className="pt-4 space-y-3">
                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1">Énoncé de mission</h4>
                                        <div className="p-5 bg-gray-50 dark:bg-[#0f172a]/20 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic font-medium">
                                                "{church.mission || "L'institution n'a pas encore défini sa mission principale sur la plateforme."}"
                                            </p>
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="Vision globale" icon={<Eye size={18} />}>
                                    <div className="pt-4 space-y-3">
                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1">Perspective de vision</h4>
                                        <div className="p-5 bg-gray-50 dark:bg-[#0f172a]/20 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic font-medium">
                                                "{church.vision || "La vision stratégique de l'institution n'a pas encore été renseignée."}"
                                            </p>
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title="Valeurs fondamentales" icon={<Heart size={18} />}>
                                    <div className="pt-4 space-y-3">
                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1">Principes directeurs</h4>
                                        <div className="p-5 bg-gray-50 dark:bg-[#0f172a]/20 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                                            {church.values ? (
                                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic font-medium">"{church.values}"</p>
                                            ) : (
                                                <p className="text-gray-400 text-sm italic">Aucune valeur renseignée pour le moment.</p>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* Member Table Section */}
                                <section className="pt-8">
                                    <MemberList churchId={id} totalCount={church.stats.members} />
                                </section>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

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

const CollapsibleSection = ({ title, icon, children, defaultOpen = false, compact = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`overflow-hidden transition-all ${compact ? 'bg-transparent' : 'bg-white dark:bg-[#1e293b] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between transition-colors ${compact ? 'py-3' : 'p-6 hover:bg-gray-50/50 dark:hover:bg-[#0f172a]/20'}`}
            >
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className={`${compact ? 'text-gray-400' : 'p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600'}`}>
                        {icon}
                    </div>
                    <span className={`${compact ? 'text-[10px] font-bold text-gray-400 tracking-tight' : 'font-black text-lg'}`}>{title}</span>
                </div>
                <ChevronDown className={`transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} size={compact ? 12 : 20} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className={`${compact ? 'pb-2' : 'p-6 pt-0 border-t border-gray-50 dark:border-gray-800'}`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MemberList = ({ churchId, totalCount }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await api.get(`/saas/churches/${churchId}/users`);
                setMembers(res.data);
            } catch (error) {
                console.error("Error fetching members", error);
            } finally {
                setLoading(false);
            }
        };
        if (churchId) fetchMembers();
    }, [churchId]);

    const handleExportExcel = () => {
        const exportData = members.map(m => ({
            'Nom': `${m.firstName} ${m.lastName}`,
            'Email': m.email || 'N/A',
            'Téléphone': m.phone || 'N/A',
            'Rôle': m.role || 'Membre'
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
        XLSX.writeFile(workbook, `Membres_${churchId}.xlsx`);
    };

    if (loading) return <div className="p-20 text-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

    const displayedMembers = showAll ? members : members.slice(0, 5);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black dark:text-white">Membres ({totalCount})</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-900/40"
                    >
                        <FileSpreadsheet size={14} /> Exporter Excel
                    </button>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-2xl hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-900/40"
                    >
                        {showAll ? "Réduire la liste" : "Voir toute la liste"} <ChevronRight size={14} className={showAll ? 'rotate-90' : ''} />
                    </button>
                </div>
            </div>

            <div className="rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#1e293b]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-[#0f172a]/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400">Nom de l'utilisateur</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400">Email</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400">Téléphone</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400">Rôle</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            <AnimatePresence>
                                {displayedMembers.map((member, index) => (
                                    <motion.tr
                                        key={member.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[11px] font-black text-indigo-600">
                                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                                </div>
                                                <span className="text-xs font-black dark:text-white capitalize">{member.firstName} {member.lastName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">{member.email}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">{member.phone || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                {member.role || 'Membre'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right transform group-hover:-translate-x-1 transition-transform">
                                            <button
                                                onClick={() => navigate(`/super-admin/member/${member.id}`)}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                                title="Voir le profil"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {members.length === 0 && (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-xs text-gray-400 italic">Aucun membre trouvé</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

/* Redesign Assets Components */

const InfoBlock = ({ label, value, subValue }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400">{label}</p>
        <p className="text-sm font-black dark:text-white truncate max-w-full" title={value}>{value}</p>
        {subValue && <p className="text-[11px] text-gray-500 font-medium truncate max-w-full">{subValue}</p>}
    </div>
);

const CategoryBlock = ({ icon, title, items }) => (
    <div className="bg-gray-50/50 dark:bg-[#0f172a]/30 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
            {icon}
            <h4 className="text-xs font-black">{title}</h4>
        </div>
        <ul className="space-y-2">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></div>
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

const SocialLink = ({ icon, label, link }) => {
    const href = link ? (link.startsWith('http') ? link : `https://${link}`) : "#";
    return (
        <a
            href={href}
            onClick={(e) => !link && e.preventDefault()}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-3 p-3 rounded-2xl transition-all ${link
                ? 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                }`}
        >
            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <span className="text-xs font-bold">{label}</span>
        </a>
    );
};

const ContactItem = ({ icon, value }) => (
    <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors cursor-default">
        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-50 dark:border-gray-800">
            {icon}
        </div>
        <span className="text-[11px] font-bold truncate">{value}</span>
    </div>
);


export default ChurchDetails;
