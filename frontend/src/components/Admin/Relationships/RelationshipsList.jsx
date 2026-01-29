import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';

const RelationshipsList = ({ memberId, member }) => {
    const { t } = useLanguage();
    const [relationships, setRelationships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchRelationships = async () => {
        try {
            const res = await api.get(`/relationships/user/${memberId}`);
            setRelationships(res.data);
        } catch (error) {
            console.error("Error fetching relationships:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) fetchRelationships();
    }, [memberId]);

    // Virtual Spouse Injection
    const displayRelationships = [...relationships];
    const hasSpouseRelationship = relationships.some(r => r.type?.toLowerCase().includes('conjoint'));

    if (member?.spouseName && !hasSpouseRelationship) {
        displayRelationships.unshift({
            id: 'virtual-spouse',
            type: member.gender?.toLowerCase() === 'homme' ? 'Conjointe' : 'Conjoint',
            person: {
                firstName: member.spouseName,
                lastName: '',
                photo: null
            },
            details: t('from_profile', 'Depuis profil'),
            isVirtual: true
        });
    }

    const handleDelete = async (id) => {
        if (!window.confirm(t('confirm_delete_relationship', 'Êtes-vous sûr de vouloir supprimer cette relation ?'))) return;
        try {
            await api.delete(`/relationships/${id}`);
            setRelationships(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting relationship:", error);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-white/5 p-10 mt-10 transition-colors shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight transition-colors">{t('relationships', 'Relations Familiales & Autres')}</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="text-[11px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                    + {t('add', 'Ajouter')}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400 dark:text-gray-600 font-medium text-[13px] animate-pulse transition-colors">{t('loading')}</div>
            ) : relationships.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-700 font-medium text-[13px] bg-gray-50/50 dark:bg-white/5 rounded-[1.5rem] transition-colors">
                    {t('no_relationships_recorded', 'Aucune relation enregistrée.')}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayRelationships.map((rel) => (
                        <div key={rel.id} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-none transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden transition-colors shadow-sm group-hover:scale-110 transition-transform">
                                    {rel.person?.photo ? (
                                        <img src={rel.person.photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-400 dark:text-indigo-600 font-bold text-xl">
                                            {rel.person?.firstName?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight transition-colors">
                                        {rel.person?.firstName} {rel.person?.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-3 transition-colors">
                                        <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[8px] transition-colors shadow-[inset_0_0_0_1px_rgba(79,70,229,0.1)]">
                                            {t(rel.type?.toLowerCase()) || rel.type}
                                        </span>
                                        {rel.details && <span className="text-[10px] italic lowercase normal-case text-gray-400 transition-colors">• {rel.details}</span>}
                                    </div>
                                </div>
                            </div>
                            {!rel.isVirtual && (
                                <button
                                    onClick={() => handleDelete(rel.id)}
                                    className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <AddRelationshipModal
                    memberId={memberId}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchRelationships();
                    }}
                />
            )}
        </div>
    );
};

const AddRelationshipModal = ({ memberId, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [type, setType] = useState('Autre');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (search.length > 2) {
            const delaySearch = setTimeout(async () => {
                try {
                    // Assuming we have a search endpoint or filtering client side. 
                    // Using get all members for now, but should be optimized.
                    const res = await api.get('/members');
                    const filtered = res.data.filter(m =>
                        (m.firstName.toLowerCase().includes(search.toLowerCase()) ||
                            m.lastName.toLowerCase().includes(search.toLowerCase()) ||
                            (m.memberCode && m.memberCode.toLowerCase().includes(search.toLowerCase()))) &&
                        m.id !== parseInt(memberId)
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
    }, [search, memberId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPerson || !type) return;

        setLoading(true);
        try {
            await api.post('/relationships', {
                personAId: memberId,
                personBId: selectedPerson.id,
                type,
                details
            });
            onSuccess();
        } catch (error) {
            console.error("Create error:", error);
            alert(t('error_creating_relationship', "Erreur lors de la création de la relation"));
        } finally {
            setLoading(false);
        }
    };

    const types = ["Père", "Mère", "Frère", "Sœur", "Conjoint(e)", "Enfant", "Oncle", "Tante", "Autre"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors p-6">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[3rem] shadow-2xl w-full max-w-md p-12 animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">{t('add_relationship', 'Ajouter une relation')}</h3>
                <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mb-10 transition-colors">{t('link_member_to_person', 'Lier ce membre à une autre personne')}</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Search Person */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                            {t('search_member', "Rechercher le membre")}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all"
                                placeholder={t('member_name_placeholder', "Nom du membre...")}
                                value={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setSelectedPerson(null);
                                }}
                            />
                            {selectedPerson && (
                                <button
                                    type="button"
                                    onClick={() => { setSelectedPerson(null); setSearch(''); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}

                            {/* Search Results Dropdown */}
                            {!selectedPerson && search.length > 2 && results.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 rounded-[1.5rem] shadow-2xl z-[110] max-h-60 overflow-y-auto noscrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                    {results.map(person => (
                                        <div
                                            key={person.id}
                                            onClick={() => {
                                                setSelectedPerson(person);
                                                setSearch('');
                                            }}
                                            className="p-5 hover:bg-indigo-600 dark:hover:bg-indigo-600 group cursor-pointer flex items-center gap-4 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:bg-white/20 group-hover:text-white transition-colors">
                                                {person.firstName[0]}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-white transition-colors">
                                                {person.firstName} {person.lastName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Type Select */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                            {t('relationship_type', 'Type de relation')}
                        </label>
                        <select
                            className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all appearance-none cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {types.map(t_val => <option key={t_val} value={t_val} className="dark:bg-[#1A1A1A]">{t(t_val.toLowerCase()) || t_val}</option>)}
                        </select>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                        <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">
                            {t('details_optional', 'Détails (Optionnel)')}
                        </label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl px-6 py-4 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#111] font-medium text-sm outline-none transition-all"
                            placeholder={t('note_placeholder', "Note...")}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 transition-colors">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95 transition-colors"
                        >
                            {t('cancel', 'Annuler')}
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedPerson || loading}
                            className="flex-3 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
                        >
                            {loading ? t('adding', 'Ajout...') : t('add', 'Ajouter')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RelationshipsList;
