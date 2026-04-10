import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, MapPin, Search, Filter, MoreVertical, Trash2, Edit2, Layout, BookOpen, Music, Users, ChevronRight, AlertCircle, X, Check, Activity, BarChart3, PieChart } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import worshipService from '../../../api/worshipService';
import toast from 'react-hot-toast';

const WorshipDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past'
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        theme: '',
        date: '',
        time: '',
        type: 'normal',
        description: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await worshipService.getServices();
            setServices(res.data);
        } catch (err) {
            toast.error(t('error_fetch_services', 'Erreur lors de la récupération des cultes'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        try {
            await worshipService.createService(formData);
            toast.success(t('service_created', 'Culte créé avec succès'));
            setShowModal(false);
            setFormData({ theme: '', date: '', time: '', type: 'normal', description: '', imageUrl: '' });
            fetchServices();
        } catch (err) {
            toast.error(t('error_create_service', 'Erreur lors de la création du culte'));
        }
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.theme.toLowerCase().includes(searchTerm.toLowerCase());
        const serviceDate = new Date(s.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const isUpcoming = serviceDate >= today;
        return matchesSearch && (filter === 'upcoming' ? isUpcoming : !isUpcoming);
    });

    const stats = {
        total: services.length,
        upcoming: services.filter(s => new Date(s.date) >= new Date().setHours(0,0,0,0)).length,
        drafts: services.filter(s => s.status === 'draft').length
    };

    return (
        <AdminLayout>
            <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                            {t('worship_management', 'Gestion des Cultes')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {t('worship_subtitle', 'Planifiez, préparez et collaborez sur les messages de culte.')}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-brand-primary/30 transition-all duration-300 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={3} />
                        <span>{t('new_worship', 'Nouveau Culte')}</span>
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: t('total_worships', 'Total des cultes'), value: stats.total, icon: <Layout className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/10' },
                        { label: t('upcoming_worships', 'Cultes à venir'), value: stats.upcoming, icon: <Calendar className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                        { label: t('draft_worships', 'En brouillon'), value: stats.drafts, icon: <Users className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/10' },
                    ].map((st, i) => (
                        <div key={i} className={`${st.bg} p-6 rounded-[2rem] border border-white/10 shadow-sm relative overflow-hidden group`}>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                    {st.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mb-2">{st.label}</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{st.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-6 p-2 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-inner">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('search_service', 'Chercher un culte par thème...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-[#0B0F19] pl-14 pr-6 py-4 rounded-[2rem] text-sm font-semibold border-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 p-1.5 bg-white dark:bg-[#0B0F19] rounded-[2rem] shadow-sm">
                        <button 
                            onClick={() => setFilter('upcoming')}
                            className={`px-8 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all ${filter === 'upcoming' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            {t('upcoming', 'À venir')}
                        </button>
                        <button 
                            onClick={() => setFilter('past')}
                            className={`px-8 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all ${filter === 'past' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            {t('past', 'Passés')}
                        </button>
                        <button 
                            onClick={() => setFilter('stats')}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all ${filter === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            <BarChart3 size={16} /> {t('statistics', 'Statistiques')}
                        </button>
                    </div>
                </div>

                {/* Services List / Grid (Minimalist style) */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">{t('loading', 'Chargement...')}</p>
                    </div>
                ) : filter === 'stats' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        {/* Stat Box 1 */}
                        <div className="bg-white dark:bg-[#111C44] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('worship_type_distribution', 'Répartition des types de cultes')}</h3>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500"><PieChart size={20} /></div>
                            </div>
                            <div className="space-y-4">
                                {['normal', 'special', 'celebration'].map(type => {
                                    const count = services.filter(s => s.type === type).length;
                                    const percentage = services.length > 0 ? Math.round((count / services.length) * 100) : 0;
                                    return (
                                        <div key={type} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-bold text-gray-500 capitalize">{t(type, type)}</div>
                                            <div className="flex-1 h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${type === 'normal' ? 'bg-blue-500' : type === 'special' ? 'bg-purple-500' : 'bg-brand-primary'}`} 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="w-12 text-right text-sm font-bold text-gray-900 dark:text-white">{percentage}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stat Box 2 */}
                        <div className="bg-white dark:bg-[#111C44] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('meetings_activity', 'Activité des réunions')}</h3>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-500"><BarChart3 size={20} /></div>
                            </div>
                            <div className="flex items-end gap-2 h-32 mb-4">
                                {[3, 5, 4, 8, 5, 2, Math.max(1, stats.total)].map((val, i) => (
                                    <div key={i} className="flex-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-t-xl hover:bg-emerald-500 transition-colors" style={{ height: `${(val / 10) * 100}%` }}></div>
                                ))}
                            </div>
                            <p className="text-center text-sm font-medium text-gray-500">{t('monthly_overview', "Aperçu mensuel de planification de réunions et d'événements")}</p>
                        </div>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm mb-4">
                            <Activity size={28} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">{t('no_worship_found', 'Aucun culte trouvé')}</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm">{t('no_worship_instructions', 'Commencez par créer votre premier culte pour planifier le programme et le message.')}</p>
                        <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/10 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:border-brand-primary/50 hover:shadow-sm transition-all text-sm">
                            {t('create_first_worship', 'Créer un culte')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredServices.map((service) => (
                            <div 
                                key={service.id} 
                                onClick={() => navigate(`/admin/worship/builder/${service.id}`)}
                                className="bg-white dark:bg-[#111C44] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all cursor-pointer group flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        service.type === 'normal' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                                        service.type === 'special' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10' :
                                        'bg-brand-primary/10 text-brand-primary dark:bg-white/10 dark:text-white'
                                    }`}>
                                        {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                                    </div>
                                    <div className="flex gap-2 text-gray-400">
                                        {service.status === 'draft' && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] rounded-md font-bold uppercase tracking-wider">{t('draft', 'Brouillon')}</span>}
                                        <MoreVertical size={18} className="opacity-50 group-hover:opacity-100 transition-opacity hover:text-brand-primary" />
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-brand-primary transition-colors line-clamp-2">
                                    {service.theme}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-2">
                                    {service.description || "Aucune description fournie pour ce culte."}
                                </p>
                                
                                <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-white/5 mt-auto">
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={15} className="text-gray-400" />
                                            <span>{new Date(service.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={15} className="text-gray-400" />
                                            <span>{service.time}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white group-hover:scale-110 transition-all">
                                        <ChevronRight size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-[#111C44] w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative scale-in-center">
                            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                            <div className="p-10">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('plan_new_worship', 'Planifier un culte')}</h2>
                                <p className="text-gray-500 font-medium mb-10">{t('plan_worship_desc', 'Définissez le thème et les détails de base pour commencer.')}</p>
                                
                                <form onSubmit={handleCreateService} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('theme', 'Thème du culte')}</label>
                                        <input 
                                            type="text" required
                                            value={formData.theme}
                                            onChange={(e) => setFormData({...formData, theme: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 rounded-2xl font-bold border-2 border-transparent focus:border-brand-primary outline-none transition-all dark:text-white"
                                            placeholder={t('sermon_theme_placeholder', "ex: Porter du fruit en abondance")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('date', 'Date')}</label>
                                            <input 
                                                type="date" required
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 rounded-2xl font-bold border-2 border-transparent focus:border-brand-primary outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('time', 'Heure')}</label>
                                            <input 
                                                type="time" required
                                                value={formData.time}
                                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                                                className="w-full bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 rounded-2xl font-bold border-2 border-transparent focus:border-brand-primary outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">{t('worship_type', 'Type de culte')}</label>
                                        <select 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-[#0B0F19] px-6 py-4 rounded-2xl font-bold border-2 border-transparent focus:border-brand-primary outline-none transition-all dark:text-white appearance-none"
                                        >
                                            <option value="normal">{t('normal_worship', 'Culte normal')}</option>
                                            <option value="special">{t('special_worship', 'Culte spécial')}</option>
                                            <option value="celebration">{t('celebration', 'Célébration')}</option>
                                            <option value="deliverance">{t('deliverance', 'Délivrance')}</option>
                                            <option value="prayer">{t('prayer_night', 'Soirée de prière')}</option>
                                        </select>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            type="submit"
                                            className="w-full py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-brand-primary/30 hover:translate-y-[-4px] active:scale-95 transition-all"
                                        >
                                            {t('confirm_creation', 'Confirmer la création')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
};

export default WorshipDashboard;
