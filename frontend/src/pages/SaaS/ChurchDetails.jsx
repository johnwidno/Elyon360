import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ChurchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/saas/churches/${id}`);
                setChurch(res.data);
            } catch (error) {
                console.error("Error fetching church details", error);
                alert("Erreur lors du chargement des détails");
                navigate('/super-admin');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id, navigate]);

    if (loading) return <div className="p-10 text-center text-gray-500">Chargement...</div>;
    if (!church) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/super-admin')}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                        <span className="mr-2">←</span> Retour
                    </button>
                    <div className="flex space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${church.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                            {church.status}
                        </span>
                    </div>
                </div>

                {/* Main Identity Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <span className="text-9xl">⛪</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{church.name}</h1>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium text-lg mb-6 flex items-center gap-2">
                            {church.acronym} •
                            <a
                                href={window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                    ? `${window.location.protocol}//${window.location.host}/?tenant=${church.subdomain}`
                                    : `https://${church.subdomain}.elyonsys.com`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center"
                            >
                                {church.subdomain}.elyonsys.com
                                <span className="ml-1 text-sm">↗</span>
                            </a>
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div>
                                <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider mb-2">Administrateur</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">👤</div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">{church.admin?.name || 'Inconnu'}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{church.admin?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider mb-2">Abonnement</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xl text-indigo-600">⭐</div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">{church.planName}</p>
                                        <p className="text-gray-500 dark:text-gray-400">Actif depuis le {new Date(church.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Address Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📍 Adresse</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <span className="text-gray-400 mr-3 mt-1">🏠</span>
                                <div>
                                    <p className="text-gray-900 dark:text-gray-200 font-medium">{church.address || 'Non renseignée'}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{church.city || 'Ville non renseignée'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📞 Contact</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <span className="text-gray-400 mr-3">📧</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {church.contactEmail || church.admin?.email || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-400 mr-3">📱</span>
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {church.contactPhone || 'Non renseigné'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatBox
                        icon="👥"
                        title="Membres"
                        value={church.stats.members}
                        onClick={() => window.location.hash = '#member-list'}
                        className="cursor-pointer hover:scale-105 transition-transform"
                    />
                    <StatBox icon="👋" title="Visiteurs" value={church.stats.visitors} />
                    <StatBox icon="💰" title="Dons Total" value={`$${church.stats.donations.toLocaleString()}`} />
                </div>

                {/* Content Accordions */}
                <div className="space-y-4">
                    {/* Mission, Vision & Values */}
                    <AccordionItem title="🎯 Mission, Vision & Valeurs">
                        <div className="space-y-6 p-4">
                            <div>
                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">{church.missionTitle || 'Mission'}</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{church.mission || 'Non définie'}</p>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">{church.visionTitle || 'Vision'}</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{church.vision || 'Non définie'}</p>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Valeurs</h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{church.values || 'Non définies'}</p>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Social Media */}
                    <AccordionItem title="🌐 Réseaux Sociaux">
                        <div className="flex flex-wrap gap-3 p-4">
                            {(() => {
                                let social = church.socialLinks;
                                if (typeof social === 'string') {
                                    try { social = JSON.parse(social); } catch (e) { social = {}; }
                                }
                                return social && Object.entries(social).map(([platform, link]) => (
                                    link && (
                                        <a
                                            key={platform}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 capitalize hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                                        >
                                            {platform} ↗
                                        </a>
                                    )
                                ));
                            })()}
                            {(() => {
                                let social = church.socialLinks;
                                if (typeof social === 'string') {
                                    try { social = JSON.parse(social); } catch (e) { social = {}; }
                                }
                                return (!social || Object.values(social).every(v => !v)) && (
                                    <p className="text-gray-400 text-sm italic">Aucun réseau social connecté</p>
                                );
                            })()}
                        </div>
                    </AccordionItem>

                    {/* Pastoral Team */}
                    <AccordionItem title="👥 Équipe Pastorale">
                        <div className="space-y-4 p-4">
                            {(() => {
                                let team = church.pastoralTeam;
                                if (typeof team === 'string') {
                                    try { team = JSON.parse(team); } catch (e) { team = []; }
                                }
                                return team && Array.isArray(team) && team.map((member, idx) => (
                                    <div key={idx} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl overflow-hidden">
                                            {member.photo ? <img src={member.photo} alt={member.name} className="h-full w-full object-cover" /> : '👤'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{member.role}</p>
                                        </div>
                                    </div>
                                ));
                            })()}
                            {(() => {
                                let team = church.pastoralTeam;
                                if (typeof team === 'string') {
                                    try { team = JSON.parse(team); } catch (e) { team = []; }
                                }
                                return (!team || team.length === 0) && (
                                    <p className="text-gray-400 text-sm italic">Aucun membre d'équipe listé</p>
                                );
                            })()}
                        </div>
                    </AccordionItem>

                    {/* Schedules */}
                    <AccordionItem title="📅 Horaires & Cultes">
                        <div className="space-y-3 p-4">
                            {(() => {
                                let schedules = church.schedules;
                                if (typeof schedules === 'string') {
                                    try { schedules = JSON.parse(schedules); } catch (e) { schedules = []; }
                                }
                                return schedules && Array.isArray(schedules) && schedules.map((schedule, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                        <span className="font-medium text-gray-900 dark:text-white w-24">{schedule.day}</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{schedule.time}</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">{schedule.type}</span>
                                    </div>
                                ));
                            })()}
                            {(() => {
                                let schedules = church.schedules;
                                if (typeof schedules === 'string') {
                                    try { schedules = JSON.parse(schedules); } catch (e) { schedules = []; }
                                }
                                return (!schedules || schedules.length === 0) && (
                                    <p className="text-gray-400 text-sm italic">Aucun horaire configuré</p>
                                );
                            })()}
                        </div>
                    </AccordionItem>



                    {/* Member List Section */}
                    <div id="member-list-container">
                        <AccordionItem title={`📑 Liste des Membres (${church.stats.members})`} id="member-list">
                            <MemberList churchId={id} />
                        </AccordionItem>
                    </div>
                </div>
            </div>
        </div>

    );
};

const MemberList = ({ churchId }) => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-center text-sm text-gray-500">Chargement des membres...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date d'inscription</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                                onClick={() => navigate(`/super-admin/member/${member.id}`)}
                            >
                                {member.firstName} {member.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                                    {(() => {
                                        if (!member.role) return 'Membre';
                                        try {
                                            const parsed = JSON.parse(member.role);
                                            return Array.isArray(parsed) ? parsed[0] : parsed;
                                        } catch (e) {
                                            return member.role || 'Membre';
                                        }
                                    })()}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(member.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Aucun membre trouvé.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const StatBox = ({ icon, title, value, onClick, className = '' }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 ${className}`}
    >
        <div className="text-3xl bg-gray-50 dark:bg-gray-700 w-14 h-14 rounded-xl flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AccordionItem = ({ title, children, isOpen: defaultOpen = false, id }) => {
    // Auto-open if the hash matches this item's ID or if explicitly set to open
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        const handleHashChange = () => {
            if (id && window.location.hash === `#${id}`) {
                setIsOpen(true);
                setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }, 500); // Small delay to allow rendering
            }
        };

        handleHashChange(); // Check on mount
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [id]);

    return (
        <div id={id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    {title}
                </h3>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

export default ChurchDetails;
