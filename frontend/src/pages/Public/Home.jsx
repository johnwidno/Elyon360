import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';
import {
    Users,
    CalendarDays,
    LayoutDashboard,
    Wallet,
    BarChart3,
    UserCircle,
    Globe2,
    CheckCircle2,
    ArrowRight,
    PlusCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Home = () => {
    const { t } = useLanguage();

    return (
        <PublicLayout>
            <div className="animate-in slide-in-from-top-12 duration-1000 ease-out fill-mode-both">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 text-white relative overflow-hidden min-h-[90vh] flex items-center">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10 w-full mt-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">{t('trusted_by_churches', 'Approuvé par des centaines d\'églises')}</span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            {t('hero_title_part1', 'La vision')} <span className="text-yellow-400 italic">360°</span> <br className="hidden sm:block" /> {t('hero_title_part2', 'pour votre ministère')}
                        </h1>

                        <p className="text-lg sm:text-2xl text-indigo-100/90 mb-12 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                            {t('hero_subtitle', 'Simplifiez la gestion de votre église avec une plateforme intuitive conçue pour la croissance spirituelle et administrative.')}
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-500">
                            <Link to="/register-church" className="w-full sm:w-auto bg-white text-indigo-700 px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-400 hover:text-indigo-900 transition-all shadow-2xl scale-100 hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                {t('get_started_free', 'Commencer gratuitement')}
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/20 px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all flex items-center justify-center">
                                {t('login', 'Se connecter')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors duration-500" id="features">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic uppercase">{t('why_elyonsys', 'Pourquoi ElyonSys ?')}</h2>
                            <div className="w-40 h-2 bg-indigo-600 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                            <FeatureCard
                                icon={<Users className="w-8 h-8 text-indigo-600" />}
                                title={t('feature_members_title', 'Gestion des Membres')}
                                description={t('feature_members_desc', 'Suivez le parcours spirituel et l\'engagement de chaque membre avec précision.')}
                            />
                            <FeatureCard
                                icon={<CalendarDays className="w-8 h-8 text-purple-600" />}
                                title={t('feature_events_title', 'Événements & Cultes')}
                                description={t('feature_events_desc', 'Organisez vos activités et cultes avec une planification simplifiée.')}
                            />
                            <FeatureCard
                                icon={<LayoutDashboard className="w-8 h-8 text-blue-600" />}
                                title={t('feature_dashboard_title', 'Tableau de Bord')}
                                description={t('feature_dashboard_desc', 'Visualisez la santé de votre église en un coup d\'œil via des données réelles.')}
                            />
                            <FeatureCard
                                icon={<Wallet className="w-8 h-8 text-green-600" />}
                                title={t('feature_finances_title', 'Finances & Dons')}
                                description={t('feature_finances_desc', 'Gérez les dîmes et offrandes en toute transparence et sécurité.')}
                            />
                            <FeatureCard
                                icon={<BarChart3 className="w-8 h-8 text-orange-600" />}
                                title={t('feature_stats_title', 'Rapports Avancés')}
                                description={t('feature_stats_desc', 'Prenez des décisions éclairées grâce à des statistiques basées sur la croissance.')}
                            />
                            <FeatureCard
                                icon={<UserCircle className="w-8 h-8 text-pink-600" />}
                                title={t('feature_space_title', 'Portail Membre')}
                                description={t('feature_space_desc', 'Offrez à vos membres un espace dédié pour leurs interactions et contributions.')}
                            />
                        </div>
                    </div>
                </div>

                {/* Vision/Objectif Section */}
                <div className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2 text-center lg:text-left relative">
                                <span className="absolute -top-12 -left-8 text-9xl font-black text-indigo-600/5 select-none uppercase">Vision</span>
                                <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter">{t('our_objective_title', 'Notre Objectif')}</h2>
                                <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed mb-10 font-medium">
                                    {t('our_objective_desc1', 'Offrir aux églises un outil numérique puissant, centralisé, et accessible pour mieux organiser leur vision, suivre leurs fidèles, et impacter leur communauté.')}
                                </p>
                                <div className="space-y-6">
                                    <VisionItem text={t('why_us_point1', 'Interface intuitive et facile à utiliser')} />
                                    <VisionItem text={t('why_us_point2', 'Sécurité et confidentialité garanties')} />
                                    <VisionItem text={t('why_us_point3', 'Support technique réactif')} />
                                    <VisionItem text={t('why_us_point4', 'Mises à jour régulières et nouvelles fonctionnalités')} />
                                    <VisionItem text={t('why_us_point5', 'Personnalisation selon vos besoins')} />
                                </div>
                            </div>
                            <div className="lg:w-1/2 w-full">
                                <div className="bg-indigo-600 p-12 rounded-[3.5rem] shadow-2xl text-white relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                                    <h3 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">{t('why_choose_elyonsys', 'Pourquoi choisir ElyonSys 360 ?')}</h3>
                                    <p className="text-lg text-indigo-50 mb-8 font-medium leading-relaxed">
                                        {t('our_objective_desc2', "Nous croyons que chaque église mérite d'avoir accès aux meilleures technologies pour accomplir sa mission. ElyonSys 360 est votre partenaire de confiance pour une gestion efficace et spirituellement enrichissante.")}
                                    </p>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-4xl font-black tracking-tighter mb-1">99%</p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">{t('uptime', 'Disponibilité')}</p>
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black tracking-tighter mb-1">24/7</p>
                                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">{t('support', 'Support')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-indigo-900 dark:bg-indigo-950 py-32 text-center relative overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4">
                        <Globe2 className="w-16 h-16 text-yellow-400 mx-auto mb-10 animate-spin-slow" />
                        <h2 className="text-4xl sm:text-7xl font-black text-white mb-8 tracking-tighter italic uppercase">{t('ready_to_transform_title', 'Prêt à transformer votre gestion ?')}</h2>
                        <p className="text-xl sm:text-2xl text-indigo-200 mb-12 font-medium">{t('ready_to_transform_subtitle', 'Rejoignez les églises qui font confiance à ElyonSys 360')}</p>
                        <Link to="/register-church" className="inline-flex items-center gap-3 bg-yellow-400 text-indigo-900 px-12 py-6 rounded-2xl font-black text-2xl hover:bg-yellow-300 transition-all shadow-[0_20px_50px_rgba(234,179,8,0.3)] hover:-translate-y-2">
                            {t('create_church_now', 'Créer mon église maintenant')}
                            <PlusCircle className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-10 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 group">
        <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-white tracking-tighter">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{description}</p>
    </div>
);

const VisionItem = ({ text }) => (
    <div className="flex items-center gap-4 text-lg font-bold text-gray-800 dark:text-gray-200">
        <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0" />
        {text}
    </div>
);

export default Home;
