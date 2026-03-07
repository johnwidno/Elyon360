import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';
import {
    Calendar,
    Sparkles,
    CheckCircle2,
    Clock,
    Globe,
    Image as ImageIcon,
    ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Events = () => {
    const { t } = useLanguage();

    return (
        <PublicLayout>
            <div className="animate-in slide-in-from-top-12 duration-1000 ease-out fill-mode-both">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-800 text-white py-24 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSAzMCAwIEwgMzAgNjAgTSAwIDMwIEwgNjAgMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                            <Calendar size={16} className="text-blue-300" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">{t('upcoming_events_notice', 'Calendrier')}</span>
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter italic uppercase">
                            {t('events_title', 'Événements')} <br className="sm:hidden" /> <span className="text-blue-300">Publics</span>
                        </h1>
                        <p className="text-lg sm:text-2xl text-indigo-100 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('events_subtitle', 'Découvrez les événements et activités de notre communauté.')}
                        </p>
                    </div>
                </div>

                {/* Coming Soon Section */}
                <div className="py-24 sm:py-32 bg-white dark:bg-gray-950 transition-colors duration-500 overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mb-10 rotate-3 hover:rotate-0 transition-transform shadow-xl border border-indigo-100 dark:border-indigo-800">
                                <Clock size={48} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                            </div>
                            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter italic uppercase">
                                {t('coming_soon_title', 'Bientôt Disponible')}
                            </h2>
                            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
                                {t('coming_soon_desc', 'La section événements publics sera bientôt disponible. Vous pourrez y découvrir tous les événements organisés par les églises de la communauté ElyonSys 360.')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
                                <FeatureItem icon={<Calendar className="text-indigo-600" />} text={t('calendar_desc', 'Calendrier des événements publics')} />
                                <FeatureItem icon={<CheckCircle2 className="text-blue-600" />} text={t('registrations_desc', 'Inscriptions en ligne')} />
                                <FeatureItem icon={<Clock className="text-purple-600" />} text={t('notifications_desc', 'Notifications pour les événements à venir')} />
                                <FeatureItem icon={<ImageIcon className="text-pink-600" />} text={t('gallery_desc', 'Galerie photos des événements passés')} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gray-950 py-24 sm:py-32 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-blue-900/30"></div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4">
                        <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 tracking-tighter italic uppercase">{t('create_church_now', 'Prêt à organiser vos événements ?')}</h2>
                        <p className="text-xl text-gray-400 mb-12 font-medium">{t('start_organizing_desc', 'Créez votre église en quelques clics et commencez à impacter votre ville.')}</p>
                        <Link to="/register-church" className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-indigo-500 transition-all shadow-2xl hover:-translate-y-1">
                            {t('create_my_church', 'Créer mon église')}
                            <ArrowRight size={24} />
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

const FeatureItem = ({ icon, text }) => (
    <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform shadow-sm">
        <div className="shrink-0 p-3 bg-white dark:bg-gray-700 rounded-xl shadow-md">
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{text}</span>
    </div>
);

export default Events;
