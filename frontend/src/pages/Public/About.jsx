import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import { Info, Target, Heart, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const About = () => {
    const { t } = useLanguage();

    return (
        <PublicLayout>
            <div className="animate-in slide-in-from-top-12 duration-1000 ease-out fill-mode-both">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 text-white py-24 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                            <Info size={16} className="text-yellow-400" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">{t('who_we_are', 'À Propos')}</span>
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter italic uppercase">
                            {t('about_title', "À propos d'ElyonSys 360")}
                        </h1>
                        <p className="text-lg sm:text-2xl text-indigo-100 max-w-4xl mx-auto font-medium leading-relaxed">
                            {t('about_content', "ElyonSys 360 est une plateforme SaaS conçue pour faciliter la gestion administrative, spirituelle et communautaire des églises modernes. Grâce à une interface intuitive et sécurisée, chaque église dispose de son propre espace personnalisé pour gérer ses membres, ses activités, ses finances et sa croissance spirituelle.")}
                        </p>
                    </div>
                </div>

                {/* Mission Section */}
                <div className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors duration-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="relative">
                                <span className="absolute -top-16 -left-8 text-[120px] font-black text-indigo-600/5 select-none uppercase pointer-events-none">Mission</span>
                                <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter italic uppercase">{t('our_objective_title', 'Notre Objectif')}</h2>
                                <div className="w-24 h-2 bg-indigo-600 mb-12 rounded-full"></div>
                                <div className="space-y-6 text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                    <p>
                                        {t('our_objective_desc1', 'Offrir aux églises un outil numérique puissant, centralisé, et accessible pour mieux organiser leur vision, suivre leurs fidèles, et impacter leur communauté.')}
                                    </p>
                                    <p>
                                        {t('our_objective_desc2', "Nous croyons que chaque église mérite d'avoir accès aux meilleures technologies pour accomplir sa mission. ElyonSys 360 est votre partenaire de confiance pour une gestion efficace et spirituellement enrichissante.")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <ValueCard
                                    icon={<Sparkles className="w-6 h-6 text-yellow-500" />}
                                    title={t('value_innovation_title', 'Innovation')}
                                    desc={t('value_innovation_desc', 'Interface intuitive et facile à utiliser')}
                                />
                                <ValueCard
                                    icon={<ShieldCheck className="w-6 h-6 text-green-500" />}
                                    title={t('value_security_title', 'Sécurité')}
                                    desc={t('value_security_desc', 'Sécurité et confidentialité garanties')}
                                />
                                <ValueCard
                                    icon={<Heart className="w-6 h-6 text-red-500" />}
                                    title={t('value_support_title', 'Support')}
                                    desc={t('value_support_desc', 'Support technique réactif')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Focus/Objective Section */}
                <div className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic uppercase">{t('our_objective', 'Notre Objectif')}</h2>
                            <div className="w-32 h-2 bg-indigo-600 mx-auto rounded-full"></div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-12 sm:p-20 rounded-[3.5rem] shadow-2xl max-w-5xl mx-auto relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                            <p className="text-2xl sm:text-4xl text-gray-900 dark:text-white text-center leading-[1.1] font-black tracking-tight mb-10">
                                {t('objective_quote', 'Offrir aux églises un outil numérique puissant, centralisé et accessible pour maximiser leur impact communautaire.')}
                            </p>
                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 text-center leading-relaxed max-w-3xl mx-auto font-medium">
                                {t('objective_desc', 'Nous nous engageons à accompagner chaque église dans sa transformation numérique, en fournissant des outils qui s\'adaptent à leurs besoins spécifiques.')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Final Vision Section */}
                <div className="py-24 bg-indigo-900 dark:bg-indigo-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <Target size={64} className="text-yellow-400 mx-auto mb-10" />
                        <h2 className="text-3xl sm:text-6xl font-black mb-8 italic uppercase tracking-tighter">{t('future_vision', 'La vision pour l\'église de demain')}</h2>
                        <p className="text-lg sm:text-2xl text-indigo-100 max-w-4xl mx-auto mb-12 font-medium">
                            {t('future_desc', 'Nous imaginons un futur où chaque église dispose des meilleurs outils pour accomplir sa mission avec excellence et efficacité.')}
                        </p>
                        <Link to="/register-church" className="inline-flex items-center gap-3 bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-400 transition-all hover:-translate-y-2 shadow-2xl">
                            {t('join_us_now', 'Rejoignez l\'aventure')}
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const ValueCard = ({ icon, title, desc }) => (
    <div className="flex items-center gap-6 p-8 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-transparent hover:border-indigo-500/20 hover:bg-white dark:hover:bg-gray-800 transition-all group">
        <div className="w-14 h-14 bg-white dark:bg-gray-700 rounded-2xl shadow-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">{title}</h4>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{desc}</p>
        </div>
    </div>
);

export default About;
