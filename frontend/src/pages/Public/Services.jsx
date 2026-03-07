import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';
import {
    Users,
    Calendar,
    LayoutDashboard,
    Wallet,
    BarChart3,
    UserCircle,
    Globe,
    CheckCircle2,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Services = () => {
    const { t } = useLanguage();

    return (
        <PublicLayout>
            <div className="animate-in slide-in-from-top-12 duration-1000 ease-out fill-mode-both">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-800 text-white py-24 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSAzMCAwIEwgMzAgNjAgTSAwIDMwIEwgNjAgMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-30"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                            <Sparkles size={16} className="text-yellow-400" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">{t('our_solutions', 'Nos Solutions')}</span>
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter italic uppercase">
                            {t('services_title', 'Services')} <br className="sm:hidden" /> <span className="text-yellow-400">Élite</span>
                        </h1>
                        <p className="text-lg sm:text-2xl text-indigo-100 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('services_subtitle', 'Des outils technologiques puissants pour amplifier l\'impact de votre ministère.')}
                        </p>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors duration-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                            <ServiceCard
                                icon={<Users className="w-8 h-8 text-indigo-600" />}
                                title={t('service_members_title', 'Gestion Membres')}
                                description={t('service_members_desc', 'Centralisez les données de vos fidèles dans un environnement sécurisé.')}
                                features={[
                                    t('sm_f1', 'Profils détaillés & Photos'),
                                    t('sm_f2', 'Suivi du parcours spirituel'),
                                    t('sm_f3', 'Gestion des ministères'),
                                    t('sm_f4', 'Groupes & Départements')
                                ]}
                            />

                            <ServiceCard
                                icon={<Calendar className="w-8 h-8 text-purple-600" />}
                                title={t('service_events_title', 'Activités & Cultes')}
                                description={t('service_events_desc', 'Organisez vos événements avec une précision chirurgicale.')}
                                features={[
                                    t('se_f1', 'Calendrier centralisé'),
                                    t('se_f2', 'Gestion des inscriptions'),
                                    t('se_f3', 'Notifications automatiques'),
                                    t('se_f4', 'Planning des services')
                                ]}
                            />

                            <ServiceCard
                                icon={<LayoutDashboard className="w-8 h-8 text-blue-600" />}
                                title={t('service_admin_title', 'Administration')}
                                description={t('service_admin_desc', 'Prenez le contrôle total de votre organisation en un clic.')}
                                features={[
                                    t('sa_f1', 'Vue d\'ensemble 360°'),
                                    t('sa_f2', 'Exportation de données'),
                                    t('sa_f3', 'Indicateurs de vitalité'),
                                    t('sa_f4', 'Accès multi-roles')
                                ]}
                            />

                            <ServiceCard
                                icon={<Wallet className="w-8 h-8 text-emerald-600" />}
                                title={t('service_finances_title', 'Finances & Dons')}
                                description={t('service_finances_desc', 'Gérez les ressources de l\'église avec transparence.')}
                                features={[
                                    t('sf_f1', 'Suivi dîmes & offrandes'),
                                    t('sf_f2', 'Rapports de trésorerie'),
                                    t('sf_f3', 'Paiements sécurisés'),
                                    t('sf_f4', 'Historique transactionnel')
                                ]}
                            />

                            <ServiceCard
                                icon={<BarChart3 className="w-8 h-8 text-orange-600" />}
                                title={t('service_stats_title', 'Statistiques')}
                                description={t('service_stats_desc', 'Analysez la croissance de votre église en temps réel.')}
                                features={[
                                    t('ss_f1', 'Données démographiques'),
                                    t('ss_f2', 'Analyse des tendances'),
                                    t('ss_f3', 'Visualisations dynamiques'),
                                    t('ss_f4', 'Audit de croissance')
                                ]}
                            />

                            <ServiceCard
                                icon={<UserCircle className="w-8 h-8 text-pink-600" />}
                                title={t('service_space_title', 'Espace Fidèle')}
                                description={t('service_space_desc', 'Offrez une expérience connectée à chaque membre.')}
                                features={[
                                    t('sfp_f1', 'Accès personnel sécurisé'),
                                    t('sfp_f2', 'Historique individuel'),
                                    t('sfp_f3', 'Ressources & Médias'),
                                    t('sfp_f4', 'Dialogue avec l\'église')
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Subdomain Section */}
                <div className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="bg-white dark:bg-gray-800 p-12 sm:p-20 rounded-[4rem] shadow-2xl relative">
                            <div className="flex flex-col lg:flex-row items-center gap-16">
                                <div className="lg:w-1/2 text-center lg:text-left">
                                    <Globe size={80} className="text-indigo-600 mx-auto lg:mx-0 mb-10 animate-pulse" />
                                    <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic uppercase">{t('subdomain_title', 'Sous-domaine')}</h2>
                                    <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 font-medium mb-10 leading-relaxed">
                                        {t('subdomain_desc', 'Une identité numérique propre à votre église pour un branding professionnel.')}
                                    </p>
                                    <div className="inline-block p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-700">
                                        <p className="text-2xl sm:text-3xl font-mono font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
                                            eglise.elyonsys360.com
                                        </p>
                                    </div>
                                </div>
                                <div className="lg:w-1/2 space-y-6">
                                    <VisionListItem text={t('sd_point1', 'Identité professionnelle exclusive')} />
                                    <VisionListItem text={t('sd_point2', 'Isolation et sécurité des données')} />
                                    <VisionListItem text={t('sd_point3', 'Configuration rapide sans technique')} />
                                    <VisionListItem text={t('sd_point4', 'Expérience utilisateur fluide')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-indigo-900 dark:bg-indigo-950 py-32 text-center relative overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4">
                        <h2 className="text-4xl sm:text-7xl font-black text-white mb-10 tracking-tighter italic uppercase">{t('transform_title', 'Commencez l\'aventure')}</h2>
                        <p className="text-xl sm:text-2xl text-indigo-100 mb-12 font-medium">{t('transform_subtitle', 'Déployez ElyonSys 360 dans votre église en moins de 5 minutes.')}</p>
                        <Link to="/register-church" className="inline-flex items-center gap-3 bg-yellow-400 text-indigo-900 px-12 py-6 rounded-2xl font-black text-2xl hover:bg-yellow-300 transition-all shadow-2xl hover:-translate-y-2">
                            {t('create_my_church', 'Inscrire mon église')}
                            <ArrowRight size={24} />
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const ServiceCard = ({ icon, title, description, features }) => (
    <div className="p-10 bg-gray-50 dark:bg-gray-800/50 rounded-[3rem] border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group">
        <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
            {icon}
        </div>
        <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-white tracking-tighter italic uppercase">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 font-medium">{description}</p>
        <ul className="space-y-3">
            {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold text-sm">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    {f}
                </li>
            ))}
        </ul>
    </div>
);

const VisionListItem = ({ text }) => (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 hover:scale-105 transition-transform duration-300">
        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-white" />
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{text}</span>
    </div>
);

export default Services;
